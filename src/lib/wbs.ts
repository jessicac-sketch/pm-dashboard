import type { WbsItem } from "@/types/database";

// Turns flat wbs_items rows into an ordered, numbered tree (1, 1.1, 1.2, 2 …)
// with phase dates and progress rolled up from their children.

export type WbsRow = {
  item: WbsItem;
  code: string;
  isPhase: boolean;
  start: string | null;
  end: string | null;
  progress: number;
  estimate: number;
  late: boolean;
  childCount: number;
};

export type WbsSummary = {
  rows: WbsRow[];
  byId: Map<string, WbsRow>;
  overallProgress: number;
  lateCount: number;
  range: { start: string; end: string } | null;
};

const bySortOrder = (a: WbsItem, b: WbsItem) =>
  a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at);

const isLate = (item: WbsItem, today: string) =>
  item.kind !== "phase" && !!item.end_date && item.end_date < today && item.progress < 100;

/** Weighted by estimated days; falls back to a plain average when nothing is estimated. */
const rollUpProgress = (children: WbsItem[]) => {
  const work = children.filter((c) => c.kind === "work_package");
  if (work.length === 0) return 0;
  const totalDays = work.reduce((sum, c) => sum + (c.estimate_days ?? 0), 0);
  if (totalDays === 0) return Math.round(work.reduce((sum, c) => sum + c.progress, 0) / work.length);
  return Math.round(work.reduce((sum, c) => sum + c.progress * (c.estimate_days ?? 0), 0) / totalDays);
};

const minDate = (dates: (string | null)[]) => dates.filter(Boolean).sort()[0] ?? null;
const maxDate = (dates: (string | null)[]) => dates.filter(Boolean).sort().at(-1) ?? null;

export const buildWbs = (items: WbsItem[], today: string): WbsSummary => {
  const phases = items.filter((i) => i.kind === "phase").sort(bySortOrder);
  const rows: WbsRow[] = [];

  phases.forEach((phase, pi) => {
    const children = items.filter((i) => i.parent_id === phase.id).sort(bySortOrder);
    const code = String(pi + 1);
    rows.push({
      item: phase,
      code,
      isPhase: true,
      start: minDate(children.map((c) => c.start_date)),
      end: maxDate(children.map((c) => c.end_date ?? c.start_date)),
      progress: rollUpProgress(children),
      estimate: children.reduce((sum, c) => sum + (c.estimate_days ?? 0), 0),
      late: false,
      childCount: children.length,
    });
    children.forEach((child, ci) => {
      const end = child.kind === "milestone" ? child.start_date : child.end_date;
      rows.push({
        item: child,
        code: `${code}.${ci + 1}`,
        isPhase: false,
        start: child.start_date,
        end,
        progress: child.progress,
        estimate: child.estimate_days ?? 0,
        late: isLate({ ...child, end_date: end }, today),
        childCount: 0,
      });
    });
  });

  const workRows = rows.filter((r) => r.item.kind === "work_package");
  const start = minDate(rows.map((r) => r.start));
  const end = maxDate(rows.map((r) => r.end));

  return {
    rows,
    byId: new Map(rows.map((r) => [r.item.id, r])),
    overallProgress: rollUpProgress(workRows.map((r) => r.item)),
    lateCount: rows.filter((r) => r.late).length,
    range: start && end ? { start, end } : null,
  };
};

/** Next sort_order for a new item among its siblings. */
export const nextSortOrder = (items: WbsItem[], parentId: string | null) =>
  items.filter((i) => i.parent_id === parentId).reduce((max, i) => Math.max(max, i.sort_order), -1) + 1;
