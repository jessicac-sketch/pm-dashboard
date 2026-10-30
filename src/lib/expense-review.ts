import { formatMoney } from "@/lib/format";
import type { DismissedSet, RemarkMap } from "@/services/expense-review.service";
import type { ServiceWithProjects } from "@/services/expense-services.service";
import type { Expense, Project } from "@/types/database";

// The monthly expense review: compare each service with the month before,
// decide which changes need a remark, and build the CEO report. Months are "YYYY-MM".

/** An increase of at least this many dollars needs a remark. */
export const REMARK_MIN_INCREASE = 1;
/** "first" = the first month on record: nothing to compare with, so no remark is needed. */
export type ChangeKind = "first" | "up" | "new" | "down" | "missing" | "same";

export type ReviewItem = {
  service: ServiceWithProjects;
  kind: ChangeKind;
  now: number;
  last: number;
  diff: number;
  needsRemark: boolean;
  remark: string;
  /** Marked "no remark needed". */
  dismissed: boolean;
};

/** serviceId → month → total charged */
export type ServiceTotals = Map<string, Map<string, number>>;

export const monthOf = (isoDate: string) => isoDate.slice(0, 7);

/** The statement month a charge counts in ("YYYY-MM"), not the month of its date. */
export const chargeMonth = (e: Pick<Expense, "statement_month" | "occurred_on">) => monthOf(e.statement_month ?? e.occurred_on);

export const shiftMonth = (month: string, delta: number) => {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const monthLabel = (month: string, style: "long" | "short" | "axis" = "long") => {
  const [y, m] = month.split("-").map(Number);
  const name = new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short" });
  return style === "long" ? `${name} ${y}` : style === "axis" ? `${name} '${String(y).slice(2)}` : name;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export const buildServiceTotals = (expenses: Expense[]): ServiceTotals => {
  const totals: ServiceTotals = new Map();
  for (const e of expenses) {
    if (!e.service_id) continue;
    const month = chargeMonth(e);
    const byMonth = totals.get(e.service_id) ?? new Map<string, number>();
    byMonth.set(month, round2((byMonth.get(month) ?? 0) + Number(e.amount)));
    totals.set(e.service_id, byMonth);
  }
  return totals;
};

/** Every calendar month from the first charge to the last, oldest first. */
export const monthRange = (expenses: Expense[]) => {
  const months = expenses.map(chargeMonth).sort();
  if (months.length === 0) return [];
  const out = [months[0]];
  while (out[out.length - 1] < months[months.length - 1]) out.push(shiftMonth(out[out.length - 1], 1));
  return out;
};

export const amountFor = (totals: ServiceTotals, serviceId: string, month: string) => totals.get(serviceId)?.get(month) ?? null;

export type MonthChange = { month: string; kind: ChangeKind | null; now: number | null; last: number | null; diff: number };

/** How a service changed in a month compared with the month before; kind is null when it wasn't billed either month. */
export const changeFor = (totals: ServiceTotals, serviceId: string, month: string, firstMonth: string): MonthChange => {
  const now = amountFor(totals, serviceId, month);
  const last = month > firstMonth ? amountFor(totals, serviceId, shiftMonth(month, -1)) : null;
  const diff = round2((now ?? 0) - (last ?? 0));
  let kind: ChangeKind | null;
  if (now === null && last === null) kind = null;
  else if (month <= firstMonth) kind = "first";
  else if (last === null) kind = "new";
  else if (now === null) kind = "missing";
  else if (diff >= REMARK_MIN_INCREASE) kind = "up";
  else if (diff <= -REMARK_MIN_INCREASE) kind = "down";
  else kind = "same";
  return { month, kind, now, last, diff };
};

export const needsRemark = (kind: ChangeKind | null) => kind === "up" || kind === "new";

/** Still waiting for a reason: it went up or is new, has no remark, and wasn't marked "no remark needed". */
export const isRemarkPending = (kind: ChangeKind | null, remark: string, dismissed: boolean) => needsRemark(kind) && !remark.trim() && !dismissed;

export const reviewMonth = (
  services: ServiceWithProjects[],
  totals: ServiceTotals,
  remarks: RemarkMap,
  month: string,
  firstMonth: string,
  dismissed: DismissedSet = new Set(),
): ReviewItem[] => {
  const items: ReviewItem[] = [];
  for (const service of services) {
    const c = changeFor(totals, service.id, month, firstMonth);
    if (!c.kind) continue;
    items.push({
      service,
      kind: c.kind,
      now: c.now ?? 0,
      last: c.last ?? 0,
      diff: c.diff,
      needsRemark: needsRemark(c.kind),
      remark: remarks.get(`${service.id}|${month}`) ?? "",
      dismissed: dismissed.has(`${service.id}|${month}`),
    });
  }
  return items.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
};

export const COMPANY_WIDE = "company";

/** Spend per project for a month. Shared services split evenly; no project = company-wide. */
export const allocateByProject = (services: ServiceWithProjects[], totals: ServiceTotals, month: string) => {
  const out = new Map<string, number>();
  for (const s of services) {
    const amount = amountFor(totals, s.id, month);
    if (!amount) continue;
    const targets = s.project_ids.length ? s.project_ids : [COMPANY_WIDE];
    for (const t of targets) out.set(t, (out.get(t) ?? 0) + amount / targets.length);
  }
  return out;
};

export type ReportGroupRow = { id: string; project: Project | null; amount: number; diff: number };
export type ReportGroup = { key: "product" | "rnd" | "company"; title: string; total: number; rows: ReportGroupRow[] };

export type MonthReport = {
  month: string;
  total: number;
  previousTotal: number;
  ups: ReviewItem[];
  downs: ReviewItem[];
  added: ReviewItem[];
  stopped: ReviewItem[];
  rndTotal: number;
  groups: ReportGroup[];
  narrative: string;
};

export const buildReport = (
  services: ServiceWithProjects[],
  projects: Project[],
  totals: ServiceTotals,
  items: ReviewItem[],
  month: string,
): MonthReport => {
  const prev = shiftMonth(month, -1);
  const now = allocateByProject(services, totals, month);
  // The first month on record has nothing to compare with.
  const before = items.some((i) => i.kind === "first") ? new Map<string, number>() : allocateByProject(services, totals, prev);
  const total = round2([...now.values()].reduce((a, v) => a + v, 0));
  const previousTotal = round2([...before.values()].reduce((a, v) => a + v, 0));
  const projectById = new Map(projects.map((p) => [p.id, p]));

  const rowsFor = (ids: string[]) =>
    ids
      .filter((id) => (now.get(id) ?? 0) !== 0 || (before.get(id) ?? 0) !== 0)
      .map((id) => ({
        id,
        project: projectById.get(id) ?? null,
        amount: round2(now.get(id) ?? 0),
        diff: round2((now.get(id) ?? 0) - (before.get(id) ?? 0)),
      }))
      .sort((a, b) => b.amount - a.amount);
  const allIds = [...new Set([...now.keys(), ...before.keys()])];
  const groups: ReportGroup[] = [
    { key: "product" as const, title: "Products", rows: rowsFor(allIds.filter((id) => projectById.get(id)?.project_type === "product")) },
    { key: "rnd" as const, title: "R&D / POC", rows: rowsFor(allIds.filter((id) => projectById.get(id)?.project_type === "rnd")) },
    { key: "company" as const, title: "Company-wide", rows: rowsFor(allIds.filter((id) => !projectById.has(id))) },
  ]
    .map((g) => ({ ...g, total: g.rows.reduce((a, r) => a + r.amount, 0) }))
    .filter((g) => g.rows.length > 0);

  const ups = items.filter((i) => i.kind === "up").sort((a, b) => b.diff - a.diff);
  const downs = items.filter((i) => i.kind === "down").sort((a, b) => a.diff - b.diff);
  const rndTotal = groups.find((g) => g.key === "rnd")?.total ?? 0;

  const diff = total - previousTotal;
  const parts = [`Total spend was ${formatMoney(total)}`];
  if (previousTotal > 0) {
    parts[0] += `, ${diff >= 0 ? "up" : "down"} ${formatMoney(Math.abs(diff))} (${Math.round((Math.abs(diff) / previousTotal) * 100)}%) from ${monthLabel(prev)}.`;
  } else parts[0] += ".";
  const top = ups[0];
  if (top) parts.push(`The biggest increase was ${top.service.name} (+${formatMoney(top.diff)}${top.remark ? `: ${top.remark}` : top.dismissed ? "" : ", reason pending"}).`);
  if (total > 0 && rndTotal > 0) parts.push(`R&D / POC work cost ${formatMoney(rndTotal)} (${Math.round((rndTotal / total) * 100)}% of spend).`);

  return {
    month,
    total,
    previousTotal,
    ups,
    downs,
    added: items.filter((i) => i.kind === "new"),
    stopped: items.filter((i) => i.kind === "missing"),
    rndTotal,
    groups,
    narrative: parts.join(" "),
  };
};

/** Plain-text version of the report for email or chat. */
export const reportSummaryText = (report: MonthReport) => {
  const lines = [`Expense report, ${monthLabel(report.month)}`, report.narrative];
  const list = (title: string, rows: string[]) => rows.length && lines.push("", title, ...rows.map((r) => `• ${r}`));
  list("Went up:", report.ups.map((i) => `${i.service.name} +${formatMoney(i.diff)}${i.remark ? `: ${i.remark}` : i.dismissed ? "" : ": reason pending"}`));
  list("Went down:", report.downs.map((i) => `${i.service.name} -${formatMoney(Math.abs(i.diff))}${i.remark ? `: ${i.remark}` : ""}`));
  list("New:", report.added.map((i) => `${i.service.name} ${formatMoney(i.now)}${i.remark ? `: ${i.remark}` : ""}`));
  list("Not billed this month:", report.stopped.map((i) => `${i.service.name} (was ${formatMoney(i.last)})${i.remark ? `: ${i.remark}` : ""}`));
  return lines.join("\n");
};
