import type { StatusCount } from "@/lib/dashboard";

const STATUS = {
  active: { label: "Active", swatch: "bg-success" },
  planning: { label: "Planning", swatch: "bg-muted" },
  on_hold: { label: "On hold", swatch: "bg-warning" },
};

// One bar split by status; the list names each part, so color isn't the only cue.
export const StatusBreakdown = ({ statuses }: { statuses: StatusCount[] }) => (
  <section aria-label="Projects by status" className="flex flex-col gap-3 border border-border bg-surface px-5 py-4">
    <h2 className="text-base font-extrabold">By status</h2>
    <div
      className="flex h-3 gap-0.5 bg-accent"
      role="img"
      aria-label={statuses.map((s) => `${s.count} ${STATUS[s.status].label.toLowerCase()}`).join(", ")}
    >
      {statuses
        .filter((s) => s.count > 0)
        .map((s) => (
          <span key={s.status} className={STATUS[s.status].swatch} style={{ flexGrow: s.count, flexBasis: 0 }} />
        ))}
    </div>
    <ul className="flex flex-col gap-2 text-[13px]">
      {statuses.map((s) => (
        <li key={s.status} className="flex items-center gap-2">
          <span className={`size-2.5 ${STATUS[s.status].swatch}`} aria-hidden />
          {STATUS[s.status].label}
          <b className="ml-auto">{s.count}</b>
        </li>
      ))}
    </ul>
  </section>
);
