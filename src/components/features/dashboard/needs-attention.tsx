import { AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { AttentionItem } from "@/lib/dashboard";
import { PROJECT_COLOR_CLASSES, projectCode } from "@/lib/project-colors";
import { DashboardCard } from "./dashboard-card";

const LEVEL_CLASSES = { critical: "border-l-danger", warning: "border-l-warning", info: "border-l-muted" };

export const NeedsAttention = ({ items }: { items: AttentionItem[] }) => (
  <DashboardCard title="Needs attention" icon={AlertTriangle} tone="warning">
    {items.length === 0 ? (
      <p className="flex items-center gap-2 px-5 py-4 text-sm text-success">
        <CheckCircle2 className="size-4" aria-hidden />
        Nothing needs attention right now.
      </p>
    ) : (
      <ul>
        {items.map((item, i) => {
          const colors = PROJECT_COLOR_CLASSES[item.project.color];
          return (
            <li key={`${item.project.id}-${i}`} className={`border-b border-l-3 border-border last:border-b-0 ${LEVEL_CLASSES[item.level]}`}>
              <Link href={`/projects/${item.project.id}`} className="flex gap-3 px-5 py-3.5 text-sm text-foreground hover:bg-accent">
                <span className={`flex h-6 min-w-10 shrink-0 items-center justify-center px-1 text-[11px] font-black ${colors.bg} ${colors.onColor}`}>
                  {projectCode(item.project)}
                </span>
                <span className="min-w-0">
                  <b className="flex items-center gap-1.5">
                    {item.level === "critical" && <AlertTriangle className="size-3.5 shrink-0 text-danger" aria-hidden />}
                    {item.title}
                  </b>
                  <span className="block text-muted">
                    {item.project.name} · {item.detail}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    )}
  </DashboardCard>
);
