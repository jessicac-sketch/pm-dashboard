import { AlertTriangle, FolderKanban } from "lucide-react";
import Link from "next/link";
import { Empty } from "@/components/ui/query-state";
import type { ProjectGlance } from "@/lib/dashboard";
import { formatDate } from "@/lib/format";
import { PROJECT_COLOR_CLASSES, projectCode } from "@/lib/project-colors";
import type { ProjectStatus } from "@/types/database";
import { DashboardCard } from "./dashboard-card";

const COLUMNS = "grid grid-cols-[minmax(220px,2fr)_96px_minmax(150px,1.3fr)_minmax(170px,1.4fr)_110px_100px] gap-4";

const STATUS: Record<ProjectStatus, { label: string; className: string }> = {
  planning: { label: "Planning", className: "border-muted text-muted" },
  active: { label: "Active", className: "border-success text-success" },
  on_hold: { label: "On hold", className: "border-warning text-warning" },
  completed: { label: "Completed", className: "border-muted text-muted" },
};

const Bar = ({ percent, className }: { percent: number; className: string }) => (
  <span className="block h-1.5 bg-accent">
    <span className={`block h-1.5 ${className}`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
  </span>
);

const Row = ({ row }: { row: ProjectGlance }) => {
  const { project } = row;
  const colors = PROJECT_COLOR_CLASSES[project.color];
  const target = project.required_fte;
  const staffText = target === null ? "text-muted" : row.shortBy > 0 ? "text-warning" : "text-success";
  const staffBar = target === null ? "bg-muted" : row.shortBy > 0 ? "bg-warning" : "bg-success";

  return (
    <Link href={`/projects/${project.id}`} className={`${COLUMNS} items-center border-b border-border px-5 py-3.5 text-foreground last:border-b-0 hover:bg-accent`}>
      <span className="flex min-w-0 items-center gap-3">
        <span className={`flex h-7.5 min-w-11 items-center justify-center px-1.5 text-xs font-black ${colors.bg} ${colors.onColor}`}>
          {projectCode(project)}
        </span>
        <span className="flex min-w-0 flex-col">
          <b className="truncate text-[15px]">{project.name}</b>
          <span className="truncate text-xs text-muted">
            Lead: {row.lead?.full_name ?? "not set"} · {row.people} {row.people === 1 ? "person" : "people"} · {row.hours}h
          </span>
        </span>
      </span>
      <span className={`justify-self-start border px-2 py-0.5 text-[11px] font-extrabold ${STATUS[project.status].className}`}>
        {STATUS[project.status].label}
      </span>
      <span className="flex flex-col gap-1.5">
        <span className="text-[13px] font-extrabold">
          {row.hasWork ? `${row.progress}%` : <span className="font-normal text-muted">No WBS yet</span>}
        </span>
        <Bar percent={row.hasWork ? row.progress : 0} className="bg-highlight" />
      </span>
      <span className="flex flex-col gap-1.5">
        <span className="text-[13px]">
          <b className={staffText}>{row.fte.toFixed(2)}</b>
          <span className="text-muted">{target === null ? " FTE · no target" : ` / ${target} FTE`}</span>
        </span>
        <Bar percent={target === null ? 100 : (row.fte / target) * 100} className={staffBar} />
      </span>
      <span className={`flex items-center gap-1.5 text-[13px] font-bold ${row.lateCount ? "text-danger" : "text-muted"}`}>
        {row.lateCount > 0 && <AlertTriangle className="size-3.5" aria-hidden />}
        {row.lateCount ? `${row.lateCount} late` : "None"}
      </span>
      <span className="text-[13px] text-muted">{formatDate(project.due_date)}</span>
    </Link>
  );
};

export const ProjectsGlance = ({ rows }: { rows: ProjectGlance[] }) => (
  <DashboardCard title="Projects at a glance" icon={FolderKanban} viewAllHref="/projects" className="min-w-0 flex-[999_1_640px]">
    {rows.length === 0 ? (
      <div className="p-5">
        <Empty message="No open projects. Create one with New project." />
      </div>
    ) : (
      <div className="overflow-x-auto">
        <div className="min-w-215">
          <div className={`${COLUMNS} border-b border-border px-5 py-2.5 text-[11px] font-extrabold tracking-[0.12em] text-muted`}>
            <span>PROJECT</span>
            <span>STATUS</span>
            <span>PROGRESS</span>
            <span>STAFFING</span>
            <span>LATE WORK</span>
            <span>DUE</span>
          </div>
          {rows.map((row) => (
            <Row key={row.project.id} row={row} />
          ))}
        </div>
      </div>
    )}
  </DashboardCard>
);
