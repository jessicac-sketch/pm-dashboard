import { AlertTriangle } from "lucide-react";
import type { DashboardSummary as Summary } from "@/lib/dashboard";

type TileProps = {
  label: string;
  value: string;
  note: string;
  tone?: "default" | "highlight" | "warning" | "danger";
};

const TONE_CLASSES = { default: "", highlight: "text-highlight", warning: "text-warning", danger: "text-danger" };

const Tile = ({ label, value, note, tone = "default" }: TileProps) => (
  <div className={`border border-border bg-surface px-4.5 py-4 ${tone === "highlight" ? "border-l-3 border-l-highlight" : ""}`}>
    <p className="text-[11px] font-extrabold tracking-[0.14em] text-muted">{label}</p>
    <p className={`mt-1.5 flex items-center gap-2 text-[34px] leading-tight font-black ${TONE_CLASSES[tone]}`}>
      {/* Danger is never shown by color alone. */}
      {tone === "danger" && <AlertTriangle className="size-6" aria-hidden />}
      {value}
    </p>
    <p className="text-xs text-muted">{note}</p>
  </div>
);

export const DashboardSummary = ({ summary }: { summary: Summary }) => (
  <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
    <Tile label="ACTIVE PROJECTS" value={String(summary.active)} note={summary.planning ? `+${summary.planning} in planning` : "none in planning"} />
    <Tile
      label="AVERAGE PROGRESS"
      value={summary.averageProgress === null ? "-" : `${summary.averageProgress}%`}
      note={summary.averageProgress === null ? "no work packages yet" : "across active projects"}
      tone="highlight"
    />
    <Tile
      label="UNDERSTAFFED"
      value={String(summary.understaffed)}
      note={summary.understaffed ? `short by ${summary.totalShort.toFixed(2)} FTE in total` : "every target is met"}
      tone={summary.understaffed ? "warning" : "default"}
    />
    <Tile
      label="LATE WORK PACKAGES"
      value={String(summary.lateWork)}
      note={summary.lateWork ? `in ${summary.lateProjects} ${summary.lateProjects === 1 ? "project" : "projects"}` : "nothing is late"}
      tone={summary.lateWork ? "danger" : "default"}
    />
  </div>
);
