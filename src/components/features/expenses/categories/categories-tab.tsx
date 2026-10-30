"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { ErrorMessage } from "@/components/ui/query-state";
import { useUpdateService } from "@/hooks/queries/use-expenses";
import { amountFor, changeFor, monthLabel } from "@/lib/expense-review";
import { formatMoney } from "@/lib/format";
import type { ServiceWithProjects } from "@/services/expense-services.service";
import { CategoryPicker } from "../category-picker";
import { ChangeBadge, signedMoney } from "../change-badge";
import { categoryName, UNCATEGORIZED, type ExpenseView } from "../expense-view";
import { ProjectPills } from "../project-pill";

export const CategoriesTab = ({ view }: { view: ExpenseView }) => {
  const { services, months, firstMonth, latest, totals, projectById } = view;
  const update = useUpdateService();
  const [open, setOpen] = useState<Set<string>>(() => new Set([UNCATEGORIZED]));
  const prev = months.length > 1 ? months[months.length - 2] : null;
  const sumFor = (list: ServiceWithProjects[], m: string) => list.reduce((a, s) => a + (amountFor(totals, s.id, m) ?? 0), 0);

  const groups = [...new Set(services.map(categoryName))]
    .map((name) => {
      const list = services
        .filter((s) => categoryName(s) === name)
        .sort((a, b) => (amountFor(totals, b.id, latest) ?? 0) - (amountFor(totals, a.id, latest) ?? 0));
      return { name, list, latestTotal: sumFor(list, latest), diff: prev ? sumFor(list, latest) - sumFor(list, prev) : 0 };
    })
    .sort((a, b) => b.latestTotal - a.latestTotal);

  const toggle = (name: string) =>
    setOpen((o) => {
      const next = new Set(o);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  const cols = `minmax(240px, 1.3fr) repeat(${months.length}, 124px) 130px minmax(260px, 1.2fr)`;

  return (
    <section className="border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-base font-extrabold">Spend by category</h2>
        <p className="text-xs text-muted">Totals per month. Open a category to see its services and move a service to another category.</p>
      </div>
      {update.error && (
        <div className="px-4 pt-3">
          <ErrorMessage error={update.error} />
        </div>
      )}
      <div className="overflow-x-auto">
        <div className="grid min-w-max border-b border-border bg-background text-[11px] font-black tracking-wide text-muted uppercase" style={{ gridTemplateColumns: cols }}>
          <div className="sticky left-0 z-10 border-r border-border bg-background px-3 py-2.5">Category</div>
          {months.map((m) => (
            <div key={m} className="px-3 py-2.5 text-right">
              {monthLabel(m, "axis")}
            </div>
          ))}
          <div className="px-3 py-2.5 text-right">vs {prev ? monthLabel(prev, "short") : "-"}</div>
          <div className="px-3 py-2.5">Category</div>
        </div>

        {groups.map((g) => {
          const isOpen = open.has(g.name);
          return (
            <div key={g.name}>
              <div className="grid min-w-max border-b border-border bg-background/60 text-sm" style={{ gridTemplateColumns: cols }}>
                <button
                  type="button"
                  onClick={() => toggle(g.name)}
                  aria-expanded={isOpen}
                  className="sticky left-0 z-10 flex items-center gap-1.5 border-r border-border bg-background px-3 py-2.5 text-left hover:text-primary"
                >
                  <ChevronRight className={`size-4 text-muted transition-transform ${isOpen ? "rotate-90" : ""}`} aria-hidden />
                  <b className={g.name === UNCATEGORIZED ? "text-warning" : ""}>{g.name}</b>
                  <span className="text-[11px] text-muted">
                    {g.list.length} {g.list.length === 1 ? "service" : "services"}
                  </span>
                </button>
                {months.map((m) => (
                  <div key={m} className="px-3 py-2.5 text-right font-black tabular-nums">
                    {formatMoney(sumFor(g.list, m))}
                  </div>
                ))}
                <div className={`px-3 py-2.5 text-right font-black ${!prev || Math.abs(g.diff) < 1 ? "text-muted" : g.diff > 0 ? "text-danger" : "text-success"}`}>
                  {!prev ? "" : Math.abs(g.diff) < 1 ? "No change" : signedMoney(g.diff)}
                </div>
                <div />
              </div>

              {isOpen &&
                g.list.map((s) => {
                  const c = changeFor(totals, s.id, latest, firstMonth);
                  return (
                    <div key={s.id} className="grid min-w-max items-center border-b border-border text-sm" style={{ gridTemplateColumns: cols }}>
                      <div className="sticky left-0 z-10 flex flex-col gap-1 border-r border-border bg-surface py-2 pr-3 pl-9">
                        <span className="font-bold">{s.name}</span>
                        <ProjectPills projectIds={s.project_ids} projectById={projectById} />
                      </div>
                      {months.map((m) => {
                        const v = amountFor(totals, s.id, m);
                        return (
                          <div key={m} className={`px-3 text-right tabular-nums ${v === null ? "text-border" : ""}`}>
                            {v === null ? "-" : formatMoney(v)}
                          </div>
                        );
                      })}
                      <div className="px-3 text-right">
                        <ChangeBadge kind={c.kind === "same" ? null : c.kind} diff={c.diff} />
                      </div>
                      <div className="px-3 py-1.5">
                        <CategoryPicker
                          key={s.category ?? ""}
                          id={`cat-${s.id}`}
                          label={`Category for ${s.name}`}
                          hideLabel
                          value={s.category}
                          onChange={(category) => update.mutate({ id: s.id, input: { category } })}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          );
        })}

        <div className="grid min-w-max border-t-2 border-border bg-accent text-sm font-black" style={{ gridTemplateColumns: cols }}>
          <div className="sticky left-0 z-10 border-r border-border bg-accent px-3 py-2.5">Total</div>
          {months.map((m) => (
            <div key={m} className="px-3 py-2.5 text-right tabular-nums">
              {formatMoney(sumFor(services, m))}
            </div>
          ))}
          <div />
          <div />
        </div>
      </div>
    </section>
  );
};
