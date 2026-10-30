import { PlugZap } from "lucide-react";
import type { JiraHealth } from "@/types/jira";

// Shown instead of the sprint report while Jira can't be reached.
export const JiraNotConnected = ({ health }: { health: JiraHealth }) => {
  const detail = !health.configured
    ? `Fill in ${health.missing.join(", ")} in .env.local, then restart the app.`
    : !health.connected
      ? health.hint
      : "";

  return (
    <section className="flex flex-wrap items-start gap-3 border border-l-4 border-border border-l-warning bg-surface p-4">
      <PlugZap className="mt-0.5 size-5 text-warning" aria-hidden />
      <div className="flex-1">
        <h2 className="text-base font-extrabold">{health.configured ? "Can't reach Jira" : "Jira isn't connected yet"}</h2>
        <p className="text-sm text-muted">Sprint reports read the board&apos;s current sprint from Jira. {detail}</p>
      </div>
    </section>
  );
};
