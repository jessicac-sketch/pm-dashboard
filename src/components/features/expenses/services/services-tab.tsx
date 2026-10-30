"use client";

import { MessageCircle, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Select } from "@/components/ui/select";
import { amountFor, changeFor, isRemarkPending, monthLabel, needsRemark } from "@/lib/expense-review";
import { formatMoney } from "@/lib/format";
import { categoryName, type ExpenseView } from "../expense-view";
import { ServiceRow, type ServiceCell } from "./service-row";

type Filter = "all" | "up" | "down" | "todo" | "rnd" | "company";
export type OpenPanel = { serviceId: string; panel: "edit" | string } | null;

export const ServicesTab = ({ view }: { view: ExpenseView }) => {
  const { services, months, firstMonth, latest, totals, remarks, dismissed, projectById } = view;
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState("all");
  const [open, setOpen] = useState<OpenPanel>(null);

  const rows = useMemo(
    () =>
      services
        .map((service) => ({
          service,
          cells: months.map(
            (m): ServiceCell => ({
              ...changeFor(totals, service.id, m, firstMonth),
              remark: remarks.get(`${service.id}|${m}`) ?? "",
              dismissed: dismissed.has(`${service.id}|${m}`),
            }),
          ),
        }))
        .filter((r) => r.cells.some((c) => c.kind))
        .sort((a, b) => (amountFor(totals, b.service.id, latest) ?? 0) - (amountFor(totals, a.service.id, latest) ?? 0) || a.service.name.localeCompare(b.service.name)),
    [services, months, firstMonth, latest, totals, remarks, dismissed],
  );

  const latestShort = monthLabel(latest, "short");
  const lastKind = (cells: ServiceCell[]) => cells[cells.length - 1].kind;
  const FILTERS: { id: Filter; label: string; test: (r: (typeof rows)[number]) => boolean }[] = [
    { id: "all", label: "All services", test: () => true },
    { id: "up", label: `Went up in ${latestShort}`, test: (r) => needsRemark(lastKind(r.cells)) },
    { id: "down", label: `Went down in ${latestShort}`, test: (r) => lastKind(r.cells) === "down" || lastKind(r.cells) === "missing" },
    { id: "todo", label: "Needs remark", test: (r) => r.cells.some((c) => isRemarkPending(c.kind, c.remark, c.dismissed)) },
    { id: "rnd", label: "R&D / POC", test: (r) => r.service.project_ids.some((id) => projectById.get(id)?.project_type === "rnd") },
    { id: "company", label: "Company-wide", test: (r) => r.service.project_ids.length === 0 },
  ];
  const inCategory = rows.filter((r) => category === "all" || categoryName(r.service) === category);
  const active = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];
  const shown = inCategory.filter(active.test);
  const categories = [...new Set(services.map(categoryName))].sort();
  const cols = `minmax(230px, 1.4fr) repeat(${months.length}, 124px) 104px`;
  const monthTotal = (m: string) => services.reduce((a, s) => a + (amountFor(totals, s.id, m) ?? 0), 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => {
          const on = f.id === active.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(f.id)}
              className={`inline-flex h-8 items-center gap-1.5 border px-2.5 text-xs font-extrabold ${on ? "border-primary bg-accent text-primary" : "border-border bg-surface text-foreground hover:bg-accent"}`}
            >
              {f.label}
              <span className={`px-1.5 text-[11px] font-black ${on ? "bg-primary text-on-primary" : "bg-background"}`}>{inCategory.filter(f.test).length}</span>
            </button>
          );
        })}
        <div className="ml-auto w-56">
          <Select
            id="services-category"
            label="Category"
            hideLabel
            options={[{ value: "all", label: "All categories" }, ...categories.map((c) => ({ value: c, label: c }))]}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
      </div>

      <section className="border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-base font-extrabold">Services by month</h2>
            <p className="text-xs text-muted">Click a service to set its name, category and projects. Click a month to see its charges or add a remark.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3.5 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="size-3.5 text-danger" aria-hidden />
              up from the month before
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-3.5 w-2.5 border-l-3 border-danger bg-danger/5" aria-hidden />
              needs a remark
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="size-3.5" aria-hidden />
              has a remark
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid min-w-max border-b border-border bg-background text-[11px] font-black tracking-wide text-muted uppercase" style={{ gridTemplateColumns: cols }}>
            <div className="sticky left-0 z-10 border-r border-border bg-background px-3 py-2.5">Service · used by</div>
            {months.map((m) => (
              <div key={m} className="px-3 py-2.5 text-right">
                {monthLabel(m, "axis")}
              </div>
            ))}
            <div className="px-3 py-2.5">Trend</div>
          </div>

          {shown.map((r) => (
            <ServiceRow
              key={r.service.id}
              view={view}
              service={r.service}
              cells={r.cells}
              cols={cols}
              open={open?.serviceId === r.service.id ? open.panel : null}
              onOpen={(panel) => setOpen(panel ? { serviceId: r.service.id, panel } : null)}
            />
          ))}
          {shown.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">No services in this filter.</p>}

          <div className="grid min-w-max border-t-2 border-border bg-accent text-sm font-black" style={{ gridTemplateColumns: cols }}>
            <div className="sticky left-0 z-10 border-r border-border bg-accent px-3 py-2.5">
              Total <span className="text-xs font-bold text-muted">· {rows.length} services</span>
            </div>
            {months.map((m, i) => {
              const d = i > 0 ? monthTotal(m) - monthTotal(months[i - 1]) : 0;
              return (
                <div key={m} className="flex flex-col items-end px-3 py-2.5 tabular-nums">
                  {formatMoney(monthTotal(m))}
                  {i > 0 && <span className={`text-[11px] ${d > 0 ? "text-danger" : "text-success"}`}>{`${d >= 0 ? "+" : "-"}${formatMoney(Math.abs(d))}`}</span>}
                </div>
              );
            })}
            <div />
          </div>
        </div>
      </section>
    </div>
  );
};
