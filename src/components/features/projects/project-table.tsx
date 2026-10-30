import Link from "next/link";
import { formatDate } from "@/lib/format";
import { PROJECT_COLOR_CLASSES, projectCode } from "@/lib/project-colors";
import type { ProjectStaffing } from "@/lib/project-staffing";
import type { Project } from "@/types/database";
import { ProjectStaffingText } from "./project-staffing-text";
import { ProjectStatusBadge } from "./project-status-badge";

type ProjectTableProps = {
  projects: Project[];
  staffing: Map<string, ProjectStaffing>;
};

export const ProjectTable = ({ projects, staffing }: ProjectTableProps) => (
  <div className="overflow-x-auto border border-border bg-surface">
    <table className="w-full text-left text-sm">
      <thead className="border-b border-border text-xs text-muted">
        <tr>
          <th className="px-4 py-2.5 font-bold">Project</th>
          <th className="px-4 py-2.5 font-bold">Status</th>
          <th className="px-4 py-2.5 font-bold">Staffing</th>
          <th className="px-4 py-2.5 font-bold">Start</th>
          <th className="px-4 py-2.5 font-bold">Due</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {projects.map((project) => {
          const colors = PROJECT_COLOR_CLASSES[project.color];
          return (
            <tr key={project.id} className="hover:bg-accent">
              <td className="px-4 py-3">
                <Link href={`/projects/${project.id}`} className="flex items-center gap-3 text-foreground hover:text-primary">
                  <span
                    className={`inline-flex h-6 min-w-11 items-center justify-center px-1.5 text-[11px] font-black ${colors.bg} ${colors.onColor}`}
                  >
                    {projectCode(project)}
                  </span>
                  <span className="font-bold">{project.name}</span>
                  {project.project_type === "rnd" && (
                    <span className="border border-dashed border-foreground px-1.5 text-[11px] font-bold">R&amp;D / POC</span>
                  )}
                </Link>
              </td>
              <td className="px-4 py-3">
                <ProjectStatusBadge status={project.status} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <ProjectStaffingText staffing={staffing.get(project.id)} requiredFte={project.required_fte} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDate(project.start_date)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDate(project.due_date)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
