import { AlertTriangle } from "lucide-react";
import { formatHours } from "@/lib/allocation-board";
import type { StatusCount, SprintTotals } from "@/lib/jira/sprint-summary";

const Tile = ({ label, value, note, warn = false }: { label: string; value: string; note: string; warn?: boolean }) => (
  <div className="flex flex-col gap-0.5 border border-border bg-surface px-4 py-3">
    <span className="text-[11px] font-extrabold text-muted">{label}</span>
    <b className={`flex items-center gap-1.5 text-2xl ${warn ? "text-warning" : ""}`}>
      {warn && <AlertTriangle className="size-5" aria-hidden />}
      {value}
    </b>
    <span className="text-xs text-muted">{note}</span>
  </div>
);

export const SprintStats = ({ totals }: { totals: SprintTotals }) => {
  const pct = totals.issues ? Math.round((totals.done / totals.issues) * 100) : 0;
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2">
      <Tile label="Done" value={`${totals.done} of ${totals.issues}`} note={`${pct}% of issues · ${formatHours(totals.doneEstimate)} of ${formatHours(totals.estimate)} estimated`} />
      <Tile label="Hours logged" value={formatHours(totals.logged)} note={`against ${formatHours(totals.estimate)} estimated`} />
      <Tile
        label="Work left"
        value={formatHours(totals.remaining)}
        note={totals.unestimated ? `plus ${totals.unestimated} ${totals.unestimated === 1 ? "issue" : "issues"} with no estimate` : "every issue is estimated"}
      />
      <Tile
        label="Added mid-sprint"
        value={totals.added === null ? "-" : String(totals.added)}
        note={totals.added === null ? "Jira didn't report this" : "issues joined after the start"}
      />
      <Tile label="Blocked" value={String(totals.blocked)} note="flagged or on hold" warn={totals.blocked > 0} />
    </div>
  );
};

const CATEGORY_CLASSES: Record<StatusCount["category"], string> = {
  new: "bg-muted",
  indeterminate: "bg-project-blue",
  done: "bg-success",
};

// Only the Done column counts as done, so other "done"-category statuses show as in progress.
const segmentClass = (s: StatusCount) =>
  CATEGORY_CLASSES[s.done ? "done" : s.category === "done" ? "indeterminate" : s.category];

// One bar split by status; the list below names each segment so color isn't the only cue.
export const StatusBreakdown = ({ statuses, total }: { statuses: StatusCount[]; total: number }) => (
  <section className="flex flex-col gap-3 border border-border bg-surface p-4">
    <div className="flex items-baseline justify-between gap-2">
      <h3 className="text-[15px] font-extrabold">Issues by status</h3>
      <span className="text-xs text-muted">Gray: to do · Blue: in progress · Green: done</span>
    </div>
    <div className="flex h-4 gap-0.5" role="img" aria-label={statuses.map((s) => `${s.status}: ${s.count}`).join(", ")}>
      {statuses.map((s) => (
        <div
          key={s.status}
          title={`${s.status}: ${s.count} ${s.count === 1 ? "issue" : "issues"}`}
          className={`h-4 ${segmentClass(s)}`}
          style={{ flexGrow: s.count, flexBasis: 0 }}
        />
      ))}
    </div>
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {statuses.map((s) => (
        <li key={s.status} className="flex items-center gap-1.5">
          <span aria-hidden className={`size-2.5 ${segmentClass(s)}`} />
          {s.status} <b>{s.count}</b>
          <span className="text-xs text-muted">({Math.round((s.count / total) * 100)}%)</span>
        </li>
      ))}
    </ul>
  </section>
);
