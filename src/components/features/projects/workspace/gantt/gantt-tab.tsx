"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/query-state";
import { formatDate } from "@/lib/format";
import { buildGanttScale } from "@/lib/gantt";
import type { WbsSummary } from "@/lib/wbs";

type GanttTabProps = { wbs: WbsSummary; today: string; onGoToWbs: () => void };

const Legend = () => (
  <div className="flex flex-wrap gap-4 px-4 py-3 text-xs">
    <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-5 bg-ink" aria-hidden />Phase (rolled up)</span>
    <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-5 bg-project-blue" aria-hidden />Done</span>
    <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-5 bg-gantt-track" aria-hidden />Remaining</span>
    <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-5 bg-gantt-track outline-2 outline-danger" aria-hidden />Late (past finish, not done)</span>
    <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rotate-45 bg-ink" aria-hidden />Milestone</span>
    <span className="inline-flex items-center gap-1.5"><span className="h-3 w-0.5 bg-brand-red" aria-hidden />Today</span>
  </div>
);

export const GanttTab = ({ wbs, today, onGoToWbs }: GanttTabProps) => {
  if (!wbs.range) {
    return (
      <section className="flex flex-col items-start gap-3 border border-border bg-surface p-4">
        <Empty message="Nothing to chart yet. Add dates to your WBS work packages and the Gantt chart builds itself." />
        <Button variant="secondary" onClick={onGoToWbs}>
          Go to WBS
        </Button>
      </section>
    );
  }

  const scale = buildGanttScale(wbs.range.start, wbs.range.end);
  const todayLeft = scale.left(today);
  const showToday = todayLeft >= 0 && todayLeft <= 100;

  return (
    <section className="border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border px-4 py-3.5">
        <div>
          <h2 className="text-base font-extrabold">Gantt chart</h2>
          <p className="text-xs text-muted">
            Built from the WBS · {formatDate(wbs.range.start)} to {formatDate(wbs.range.end)} · by week
          </p>
        </div>
        <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
          Print / save as PDF
        </Button>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: 280 + scale.weeks.length * 64 }}>
          <div className="flex border-b border-border bg-background">
            <div className="w-70 shrink-0 border-r border-border px-3 py-2 text-xs font-extrabold text-muted">Work</div>
            <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${scale.weeks.length}, minmax(0, 1fr))` }}>
              {scale.weeks.map((w) => (
                <div key={w.start} className="border-l border-border px-1 py-2 text-center text-[11px] font-extrabold whitespace-nowrap text-muted">
                  {w.label}
                </div>
              ))}
            </div>
          </div>

          {wbs.rows.map((row) => {
            const isMilestone = row.item.kind === "milestone";
            const scheduled = isMilestone ? !!row.start : !!(row.start && row.end);
            return (
              <div key={row.item.id} className={`flex border-b border-border ${row.isPhase ? "bg-background" : ""}`}>
                <div className="flex h-10 w-70 shrink-0 items-center gap-2 overflow-hidden border-r border-border px-3 text-sm">
                  <span className="w-8 shrink-0 font-black text-muted">{row.code}</span>
                  <span className={`truncate ${row.isPhase ? "font-extrabold" : "pl-2 font-semibold"}`}>{row.item.name}</span>
                </div>
                <div className="relative h-10 flex-1">
                  {scale.weeks.map((w, i) => (
                    <div key={w.start} className="absolute inset-y-0 w-px bg-board-dark" style={{ left: `${(i * 7 * 100) / scale.totalDays}%` }} aria-hidden />
                  ))}
                  {showToday && <div className="absolute inset-y-0 z-10 w-0.5 bg-brand-red" style={{ left: `${todayLeft}%` }} aria-hidden />}

                  {scheduled && isMilestone && (
                    <div
                      role="img"
                      aria-label={`${row.item.name}, ${formatDate(row.start)}`}
                      title={`${row.item.name} · ${formatDate(row.start)}`}
                      className="absolute top-3 size-4 -translate-x-1/2 rotate-45 bg-ink"
                      style={{ left: `${scale.left(row.start!)}%` }}
                    />
                  )}
                  {scheduled && !isMilestone && (
                    <div
                      role="img"
                      aria-label={`${row.item.name}, ${formatDate(row.start)} to ${formatDate(row.end)}, ${row.progress}% done${row.late ? ", late" : ""}`}
                      title={`${row.item.name} · ${formatDate(row.start)} to ${formatDate(row.end)} · ${row.progress}% done${row.late ? " · late" : ""}`}
                      className={`absolute overflow-hidden ${row.isPhase ? "top-3.5 h-3 bg-gantt-phase-track" : "top-2.5 h-5 bg-gantt-track"} ${row.late ? "outline-2 outline-danger" : ""}`}
                      style={{ left: `${scale.left(row.start!)}%`, width: `${scale.width(row.start!, row.end!)}%` }}
                    >
                      <div className={`h-full ${row.isPhase ? "bg-ink" : "bg-project-blue"}`} style={{ width: `${row.progress}%` }} />
                    </div>
                  )}
                  {!scheduled && !row.isPhase && (
                    <span className="absolute top-2.5 left-2 text-xs text-muted italic">Unscheduled: set dates in the WBS</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Legend />
    </section>
  );
};
