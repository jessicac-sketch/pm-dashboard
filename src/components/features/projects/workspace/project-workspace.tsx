"use client";

import { ErrorMessage, Loading } from "@/components/ui/query-state";
import { useAllocations } from "@/hooks/queries/use-allocations";
import { usePeople } from "@/hooks/queries/use-people";
import { useProject } from "@/hooks/queries/use-projects";
import { useDismissedSuggestions, useIssues, useRisks } from "@/hooks/queries/use-risks";
import { useWbs } from "@/hooks/queries/use-wbs";
import { WorkspaceView } from "./workspace-view";

// Loads everything a project page needs, then hands off to the tabs.
export const ProjectWorkspace = ({ id }: { id: string }) => {
  const project = useProject(id);
  const people = usePeople();
  const allocations = useAllocations();
  const wbs = useWbs(id);
  const risks = useRisks(id);
  const issues = useIssues(id);
  const dismissed = useDismissedSuggestions(id);

  const queries = [project, people, allocations, wbs, risks, issues, dismissed];
  if (queries.some((q) => q.isPending)) return <Loading variant="page" />;
  const failed = queries.find((q) => q.isError);
  if (failed?.error) return <ErrorMessage error={failed.error} />;

  return (
    <WorkspaceView
      project={project.data!}
      people={people.data!}
      allocations={allocations.data!}
      wbsItems={wbs.data!}
      risks={risks.data!}
      issues={issues.data!}
      dismissedSuggestions={dismissed.data!}
    />
  );
};
