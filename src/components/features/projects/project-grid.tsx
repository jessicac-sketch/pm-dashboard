import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { PROJECT_COLOR_CLASSES, projectCode } from "@/lib/project-colors";
import type { ProjectStaffing } from "@/lib/project-staffing";
import type { Project } from "@/types/database";
import { ProjectStaffingText } from "./project-staffing-text";
import { ProjectStatusBadge } from "./project-status-badge";

type ProjectGridProps = {
  projects: Project[];
  staffing: Map<string, ProjectStaffing>;
};

export const ProjectGrid = ({ projects, staffing }: ProjectGridProps) => (
  <ul className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
    {projects.map((project) => {
      const colors = PROJECT_COLOR_CLASSES[project.color];
      return (
        <li key={project.id}>
          <Link
            href={`/projects/${project.id}`}
            className="flex h-full flex-col border border-border bg-surface text-foreground hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
          >
            <div className={`h-1.5 ${colors.bg}`} />
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <span className={`text-xs font-black tracking-widest ${colors.text}`}>{projectCode(project)}</span>
                <span className="flex gap-1.5">
                  {project.project_type === "rnd" && (
                    <span className="border border-dashed border-foreground px-2 py-0.5 text-xs font-bold">R&amp;D / POC</span>
                  )}
                  <ProjectStatusBadge status={project.status} />
                </span>
              </div>
              <div>
                <h2 className="text-base font-bold">{project.name}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted">
                  {project.description ?? "No description yet."}
                </p>
              </div>
              <div className="mt-auto flex flex-col gap-1.5 border-t border-border pt-3">
                <ProjectStaffingText staffing={staffing.get(project.id)} requiredFte={project.required_fte} />
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <CalendarDays className="size-3.5" aria-hidden />
                  {project.start_date || project.due_date
                    ? `${formatDate(project.start_date)} to ${formatDate(project.due_date)}`
                    : "No dates set"}
                </span>
              </div>
            </div>
          </Link>
        </li>
      );
    })}
  </ul>
);
