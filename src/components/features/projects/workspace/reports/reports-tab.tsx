"use client";

import { useState } from "react";
import { ErrorMessage, Loading } from "@/components/ui/query-state";
import { useJiraHealth } from "@/hooks/queries/use-jira";
import type { Allocation, Person, Project } from "@/types/database";
import { JiraBoardPicker } from "./jira-board-picker";
import { JiraNotConnected } from "./jira-not-connected";
import { SprintReport } from "./sprint-report";

type ReportsTabProps = {
  project: Project;
  people: Person[];
  allocations: Allocation[];
};

export const ReportsTab = ({ project, people, allocations }: ReportsTabProps) => {
  const health = useJiraHealth();
  const [changingBoard, setChangingBoard] = useState(false);

  if (health.isPending) return <Loading />;
  if (health.isError) return <ErrorMessage error={health.error} />;
  if (!health.data.configured || !health.data.connected) return <JiraNotConnected health={health.data} />;

  if (!project.jira_board_id || changingBoard) {
    return <JiraBoardPicker project={project} onCancel={project.jira_board_id ? () => setChangingBoard(false) : undefined} />;
  }

  return (
    <SprintReport
      key={project.jira_board_id}
      project={project}
      boardId={project.jira_board_id}
      people={people}
      allocations={allocations}
      onChangeBoard={() => setChangingBoard(true)}
    />
  );
};
