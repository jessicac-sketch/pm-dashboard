"use client";

import { useMemo, useState } from "react";
import { ErrorMessage, Loading } from "@/components/ui/query-state";
import { useAllocations } from "@/hooks/queries/use-allocations";
import { usePeople } from "@/hooks/queries/use-people";
import { useProjects } from "@/hooks/queries/use-projects";
import { useAllWbsItems } from "@/hooks/queries/use-wbs";
import { buildDashboard } from "@/lib/dashboard";
import { todayIso } from "@/lib/dates";
import { DashboardGreeting } from "./dashboard-greeting";
import { DashboardSummary } from "./dashboard-summary";
import { NeedsAttention } from "./needs-attention";
import { ProjectsGlance } from "./projects-glance";
import { StatusBreakdown } from "./status-breakdown";

export const DashboardView = () => {
  const projects = useProjects();
  const wbs = useAllWbsItems();
  const allocations = useAllocations();
  const people = usePeople();
  const [today] = useState(todayIso);

  const data = useMemo(
    () =>
      projects.data && wbs.data && allocations.data && people.data
        ? buildDashboard(projects.data, wbs.data, allocations.data, people.data, today)
        : null,
    [projects.data, wbs.data, allocations.data, people.data, today],
  );
  const failed = [projects, wbs, allocations, people].find((q) => q.error)?.error;

  return (
    <div className="flex flex-col gap-5">
      <DashboardGreeting />
      {failed ? (
        <ErrorMessage error={failed} />
      ) : !data ? (
        <Loading variant="page" />
      ) : (
        <>
          <DashboardSummary summary={data.summary} />
          <div className="flex flex-wrap items-start gap-5">
            <ProjectsGlance rows={data.rows} />
            <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
              <NeedsAttention items={data.attention} />
              <StatusBreakdown statuses={data.statuses} />
            </aside>
          </div>
        </>
      )}
    </div>
  );
};
