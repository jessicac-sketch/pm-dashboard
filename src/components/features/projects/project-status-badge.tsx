import { formatEnum } from "@/lib/format";
import type { ProjectStatus } from "@/types/database";

const STATUS_CLASSES: Record<ProjectStatus, string> = {
  planning: "bg-secondary text-secondary-foreground",
  active: "bg-success/10 text-success",
  on_hold: "bg-warning/10 text-warning",
  completed: "bg-background text-muted",
};

export const ProjectStatusBadge = ({ status }: { status: ProjectStatus }) => (
  <span className={`inline-flex shrink-0 px-2 py-0.5 text-xs font-bold ${STATUS_CLASSES[status]}`}>
    {formatEnum(status)}
  </span>
);
