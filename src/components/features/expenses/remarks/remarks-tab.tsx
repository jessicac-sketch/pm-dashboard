"use client";

import { CheckCircle2, CircleSlash, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ErrorMessage } from "@/components/ui/query-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useSetRemarkDismissed } from "@/hooks/queries/use-expenses";
import { changeFor, isRemarkPending, monthLabel, needsRemark, type MonthChange } from "@/lib/expense-review";
import { formatMoney } from "@/lib/format";
import type { ServiceWithProjects } from "@/services/expense-services.service";
import { ChangeBadge } from "../change-badge";
import { categoryName, type ExpenseView } from "../expense-view";
import { RemarkInput } from "../remark-input";

type Mode = "todo" | "all";
type Increase = MonthChange & { service: ServiceWithProjects; remark: string; dismissed: boolean };

/** Every month where a service went up or started, so each one gets a reason (or is let go). */
export const listIncreases = (view: ExpenseView): Increase[] =>
  view.services
    .flatMap((service) =>
      view.months.map((m) => {
        const key = `${service.id}|${m}`;
        return { ...changeFor(view.totals, service.id, m, view.firstMonth), service, remark: view.remarks.get(key) ?? "", dismissed: view.dismissed.has(key) };
      }),
    )
    .filter((c) => needsRemark(c.kind))
    .sort((a, b) => b.month.localeCompare(a.month) || b.diff - a.diff);

const COLS = "grid-cols-[minmax(200px,1.2fr)_100px_110px_110px_150px_minmax(260px,2fr)_190px]";

export const RemarksTab = ({ view }: { view: ExpenseView }) => {
  const [mode, setMode] = useState<Mode>("todo");
  const dismiss = useSetRemarkDismissed();
  const increases = useMemo(() => listIncreases(view), [view]);
  const pending = increases.filter((i) => isRemarkPending(i.kind, i.remark, i.dismissed));
  // Keep rows on screen while they're being handled, so the list doesn't jump.
  const [shownIds] = useState(() => new Set(pending.map((i) => `${i.service.id}|${i.month}`)));
  const rows =
    mode === "all" ? increases : increases.filter((i) => shownIds.has(`${i.service.id}|${i.month}`) || isRemarkPending(i.kind, i.remark, i.dismissed));

  return (
    <section className="border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-base font-extrabold">Need remarks</h2>
          <p className="text-xs text-muted">
            Every service that went up or started, compared with the month before. Type a reason for the CEO report, or mark it as not needing one.
          </p>
        </div>
        <SegmentedControl<Mode>
          label="Show"
          options={[
            { value: "todo", label: `Needs remark · ${pending.length}` },
            { value: "all", label: `All increases · ${increases.length}` },
          ]}
          value={mode}
          onChange={setMode}
        />
      </div>
      {dismiss.error && (
        <div className="px-4 pt-3">
          <ErrorMessage error={dismiss.error} />
        </div>
      )}

      <div className="overflow-x-auto">
        <div className={`grid min-w-max ${COLS} border-b border-border bg-background text-[11px] font-black tracking-wide text-muted uppercase`}>
          {["Service", "Month", "Previous", "This month", "Change", "Remark", "Status"].map((h, i) => (
            <div key={h} className={`px-3 py-2.5 ${i >= 2 && i <= 4 ? "text-right" : ""}`}>
              {h}
            </div>
          ))}
        </div>
        {rows.map((r) => {
          const explained = !!r.remark.trim();
          const busy = dismiss.isPending && dismiss.variables?.serviceId === r.service.id && dismiss.variables.month === r.month;
          return (
            <div key={`${r.service.id}|${r.month}`} className={`grid min-w-max ${COLS} items-center border-b border-border text-sm ${r.dismissed && !explained ? "text-muted" : ""}`}>
              <div className="px-3 py-2">
                <b className="block">{r.service.name}</b>
                <span className="text-[11px] text-muted">{categoryName(r.service)}</span>
              </div>
              <div className="px-3 font-extrabold">{monthLabel(r.month)}</div>
              <div className="px-3 text-right text-muted tabular-nums">{r.last === null ? "-" : formatMoney(r.last)}</div>
              <div className="px-3 text-right font-extrabold tabular-nums">{formatMoney(r.now ?? 0)}</div>
              <div className="px-3 text-right">
                <ChangeBadge kind={r.kind} diff={r.diff} last={r.last} />
              </div>
              <div className="px-3 py-2">
                <RemarkInput
                  serviceId={r.service.id}
                  serviceName={`${r.service.name}, ${monthLabel(r.month)}`}
                  month={r.month}
                  value={r.remark}
                  required={!r.dismissed}
                  placeholder={r.dismissed ? "Optional note" : r.kind === "new" ? "What is this service for?" : "Why did it go up?"}
                />
              </div>
              <div className="flex flex-col items-start gap-1 px-3 py-2">
                <span
                  className={`px-2 py-0.5 text-[11px] font-black ${
                    explained ? "bg-success/10 text-success" : r.dismissed ? "bg-background text-muted" : "bg-danger/10 text-danger"
                  }`}
                >
                  {explained ? "Explained" : r.dismissed ? "No remark needed" : "Needs remark"}
                </span>
                {!explained && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => dismiss.mutate({ serviceId: r.service.id, month: r.month, dismissed: !r.dismissed })}
                    className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-primary disabled:opacity-50"
                  >
                    {r.dismissed ? <Undo2 className="size-3.5" aria-hidden /> : <CircleSlash className="size-3.5" aria-hidden />}
                    {r.dismissed ? "Undo" : "No remark needed"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <p className="flex items-center justify-center gap-2 px-4 py-10 text-sm font-extrabold text-success">
            <CheckCircle2 className="size-4" aria-hidden />
            Every increase has a remark or doesn&apos;t need one.
          </p>
        )}
      </div>
    </section>
  );
};
