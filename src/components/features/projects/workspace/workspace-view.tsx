"use client";

import { useMemo, useState } from "react";
import { todayIso } from "@/lib/dates";
import { projectTeam } from "@/lib/project-team";
import { buildRiskSuggestions } from "@/lib/risk-suggestions";
import { riskScore } from "@/lib/risk-scoring";
import { buildWbs } from "@/lib/wbs";
import type { Allocation, Issue, Person, Project, Risk, WbsItem } from "@/types/database";
import { GanttTab } from "./gantt/gantt-tab";
import { ReportsTab } from "./reports/reports-tab";
import { RisksTab } from "./risks/risks-tab";
import { StoriesTab } from "./stories/stories-tab";
import { TeamTab } from "./team-tab";
import { WbsTab } from "./wbs/wbs-tab";
import { WorkspaceHeader } from "./workspace-header";

export type WorkspaceTab = "team" | "risks" | "wbs" | "gantt" | "stories" | "reports";

type WorkspaceViewProps = {
  project: Project;
  people: Person[];
  allocations: Allocation[];
  wbsItems: WbsItem[];
  risks: Risk[];
  issues: Issue[];
  dismissedSuggestions: string[];
};

export const WorkspaceView = ({
  project,
  people,
  allocations,
  wbsItems,
  risks,
  issues,
  dismissedSuggestions,
}: WorkspaceViewProps) => {
  const [tab, setTab] = useState<WorkspaceTab>("team");
  const [today] = useState(todayIso);

  const team = useMemo(() => projectTeam(project.id, allocations, people), [project.id, allocations, people]);
  const wbs = useMemo(() => buildWbs(wbsItems, today), [wbsItems, today]);
  const openRisks = risks.filter((r) => r.status !== "closed");
  const severeCount = openRisks.filter((r) => riskScore(r) >= 10).length;
  const suggestions = useMemo(
    () => buildRiskSuggestions({ project, team, wbs, risks, dismissed: dismissedSuggestions, today }),
    [project, team, wbs, risks, dismissedSuggestions, today],
  );

  const tabs: { id: WorkspaceTab; label: string; count: string }[] = [
    { id: "team", label: "Team", count: String(team.members.length) },
    { id: "risks", label: "Risks", count: suggestions.length ? `${openRisks.length} · ${suggestions.length} new` : String(openRisks.length) },
    { id: "wbs", label: "WBS", count: String(wbs.rows.filter((r) => r.item.kind === "work_package").length) },
    { id: "gantt", label: "Gantt", count: wbs.lateCount ? `${wbs.lateCount} late` : "" },
    { id: "stories", label: "Stories", count: "AI" },
    { id: "reports", label: "Reports", count: "Jira" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <WorkspaceHeader project={project} people={people} team={team} wbs={wbs} openRisks={openRisks.length} severeRisks={severeCount} />

      <div role="tablist" aria-label="Project sections" className="flex flex-wrap gap-6 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px inline-flex h-12 items-center gap-2 border-b-3 text-[15px] font-bold ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count && <span className="bg-background px-1.5 text-[11px] font-extrabold text-foreground">{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === "team" && <TeamTab project={project} people={people} team={team} onGoToRisks={() => setTab("risks")} />}
      {tab === "risks" && (
        <RisksTab
          project={project}
          people={people}
          risks={risks}
          issues={issues}
          wbs={wbs}
          suggestions={suggestions}
          today={today}
        />
      )}
      {tab === "wbs" && <WbsTab project={project} people={people} items={wbsItems} wbs={wbs} />}
      {tab === "gantt" && <GanttTab wbs={wbs} today={today} onGoToWbs={() => setTab("wbs")} />}
      {/* Kept mounted so AI drafts survive switching tabs. */}
      <div hidden={tab !== "stories"}>
        <StoriesTab project={project} />
      </div>
      {tab === "reports" && <ReportsTab project={project} people={people} allocations={allocations} />}
    </div>
  );
};
