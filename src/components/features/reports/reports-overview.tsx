import { FileText, PlugZap } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

const REPORT_TYPES = [
  { name: "Portfolio status", desc: "Every active project's progress, health and late work in one view.", source: "Jira epics + each project's WBS" },
  { name: "Resource allocation", desc: "Who is working on which project, and who is over or under capacity.", source: "Resources board" },
  { name: "Risks & issues", desc: "Open risks and issues across all projects, sorted by score.", source: "Each project's risk register + Jira blockers" },
  { name: "Time logged", desc: "Hours logged per person and project for a period.", source: "Jira worklogs" },
];

// Placeholder until the Jira integration exists: shows what's coming, honestly disabled.
export const ReportsOverview = () => (
  <>
    <PageHeader title="Reports" description="Reports across all your projects. Project-specific reports live on each project's Reports tab." />
    <div className="flex flex-col gap-4">
      <section className="flex flex-wrap items-start gap-3 border border-l-4 border-border border-l-warning bg-surface p-4">
        <PlugZap className="mt-0.5 size-5 text-warning" aria-hidden />
        <div className="flex-1">
          <h2 className="text-base font-extrabold">Jira isn&apos;t connected yet</h2>
          <p className="text-sm text-muted">Reports that pull issues, sprints and worklogs will be available once Jira is connected.</p>
        </div>
      </section>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
        {REPORT_TYPES.map((r) => (
          <section key={r.name} className="flex flex-col gap-2 border border-border bg-surface p-4">
            <h3 className="flex items-center gap-2 text-[15px] font-extrabold">
              <FileText className="size-4 text-muted" aria-hidden />
              {r.name}
            </h3>
            <p className="flex-1 text-sm text-muted">{r.desc}</p>
            <span className="text-xs">
              <b>Pulls:</b> {r.source}
            </span>
            <span className="self-start bg-background px-2 py-1 text-xs font-bold text-muted">Coming soon</span>
          </section>
        ))}
      </div>
    </div>
  </>
);
