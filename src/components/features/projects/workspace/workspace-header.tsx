import Link from "next/link";
import { formatDate } from "@/lib/format";
import { PROJECT_COLOR_CLASSES, projectCode } from "@/lib/project-colors";
import type { ProjectTeam } from "@/lib/project-team";
import type { WbsSummary } from "@/lib/wbs";
import type { Person, Project } from "@/types/database";
import { ProjectStatusBadge } from "../project-status-badge";

type WorkspaceHeaderProps = {
  project: Project;
  people: Person[];
  team: ProjectTeam;
  wbs: WbsSummary;
  openRisks: number;
  severeRisks: number;
};

const Stat = ({ label, value, tone = "text-foreground" }: { label: string; value: string; tone?: string }) => (
  <div className="flex flex-col border border-border bg-surface px-3.5 py-2.5">
    <span className="text-[11px] font-extrabold text-muted">{label}</span>
    <b className={`text-lg ${tone}`}>{value}</b>
  </div>
);

export const WorkspaceHeader = ({ project, people, team, wbs, openRisks, severeRisks }: WorkspaceHeaderProps) => {
  const colors = PROJECT_COLOR_CLASSES[project.color];
  const lead = people.find((p) => p.id === project.lead_person_id);
  const required = project.required_fte;
  const short = required !== null && team.fte < required;

  return (
    <header className="flex flex-col gap-3">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/projects" className="font-bold text-primary">
          Projects
        </Link>{" "}
        / {project.name}
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className={`flex size-13 shrink-0 items-center justify-center text-[15px] font-black ${colors.bg} ${colors.onColor}`}>
            {projectCode(project)}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="text-sm text-muted">
              {project.start_date || project.due_date
                ? `${formatDate(project.start_date)} to ${formatDate(project.due_date)}`
                : "No dates set"}{" "}
              · Lead: {lead?.full_name ?? "not set"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Progress" value={`${wbs.overallProgress}%`} />
          <Stat
            label="Staffing"
            value={`${team.fte.toFixed(2)}${required !== null ? ` / ${required}` : ""} FTE`}
            tone={short ? "text-warning" : "text-foreground"}
          />
          <Stat
            label="Open risks"
            value={severeRisks ? `${openRisks} · ${severeRisks} severe` : String(openRisks)}
            tone={severeRisks ? "text-danger" : "text-foreground"}
          />
          <Stat label="Schedule" value={`${wbs.lateCount} late`} tone={wbs.lateCount ? "text-danger" : "text-success"} />
        </div>
      </div>
    </header>
  );
};
