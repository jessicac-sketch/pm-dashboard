import { PROJECT_COLOR_CLASSES, projectCode } from "@/lib/project-colors";
import type { Project } from "@/types/database";

/** Project code chip. R&D / POC projects get a dashed outline so they stand apart. */
export const ProjectPill = ({ project }: { project: Project }) => {
  const rnd = project.project_type === "rnd";
  const colors = PROJECT_COLOR_CLASSES[project.color];
  return (
    <span
      title={`${project.name}${rnd ? " (R&D / POC)" : ""}`}
      className={`inline-flex px-1.5 text-[11px] font-black whitespace-nowrap ${
        rnd ? "border border-dashed border-foreground bg-surface text-foreground" : `${colors.bg} ${colors.onColor}`
      }`}
    >
      {rnd && "R&D · "}
      {projectCode(project)}
    </span>
  );
};

export const CompanyWidePill = () => (
  <span title="No specific project" className="inline-flex bg-background px-1.5 text-[11px] font-black text-muted">
    Company-wide
  </span>
);

export const ProjectPills = ({ projectIds, projectById }: { projectIds: string[]; projectById: Map<string, Project> }) => {
  const list = projectIds.map((id) => projectById.get(id)).filter((p): p is Project => !!p);
  if (list.length === 0) return <CompanyWidePill />;
  return (
    <span className="flex flex-wrap gap-1">
      {list.map((p) => (
        <ProjectPill key={p.id} project={p} />
      ))}
    </span>
  );
};
