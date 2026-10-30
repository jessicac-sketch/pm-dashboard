"use client";

import { useMemo, useState } from "react";
import { Empty, ErrorMessage, Loading } from "@/components/ui/query-state";
import { useSprintReport } from "@/hooks/queries/use-jira";
import { summarizeSprint } from "@/lib/jira/sprint-summary";
import type { Allocation, Person, Project } from "@/types/database";
import { SprintHeader } from "./sprint-header";
import { SprintIssueList } from "./sprint-issue-list";
import { SprintPeople } from "./sprint-people";
import { StatusBreakdown, SprintStats } from "./sprint-stats";

type SprintReportProps = {
  project: Project;
  boardId: number;
  people: Person[];
  allocations: Allocation[];
  onChangeBoard: () => void;
};

export const SprintReport = ({ project, boardId, people, allocations, onChangeBoard }: SprintReportProps) => {
  // null = the board's current sprint.
  const [sprintId, setSprintId] = useState<number | null>(null);
  const report = useSprintReport(boardId, sprintId);
  const summary = useMemo(
    () => (report.data ? summarizeSprint(report.data, people, allocations, project.id) : null),
    [report.data, people, allocations, project.id],
  );

  if (report.isPending) return <Loading variant="page" label="Reading the sprint from Jira…" />;
  if (report.isError) {
    return (
      <div className="flex flex-col gap-2">
        <ErrorMessage error={report.error} />
        <button type="button" onClick={onChangeBoard} className="self-start text-sm font-bold text-primary hover:underline">
          Pick a different board
        </button>
      </div>
    );
  }

  const { board, sprint, sprints } = report.data;
  if (!sprint || !summary) {
    return (
      <section className="flex flex-col gap-2 border border-border bg-surface p-4">
        <Empty message={`${board.name} has no active or closed sprints yet.`} />
        <button type="button" onClick={onChangeBoard} className="self-start text-sm font-bold text-primary hover:underline">
          Pick a different board
        </button>
      </section>
    );
  }

  const ended = sprint.state === "closed" || summary.timing.overdue;

  return (
    <div className={`flex flex-col gap-4 ${report.isFetching ? "opacity-70" : ""}`}>
      <SprintHeader
        board={board}
        sprint={sprint}
        sprints={sprints}
        timing={summary.timing}
        refreshing={report.isFetching}
        onSprintChange={setSprintId}
        onRefresh={() => report.refetch()}
        onChangeBoard={onChangeBoard}
      />
      {summary.totals.issues === 0 ? (
        <Empty message="This sprint has no issues in it." />
      ) : (
        <>
          <SprintStats totals={summary.totals} />
          <StatusBreakdown statuses={summary.statuses} total={summary.totals.issues} />
          <SprintPeople rows={summary.people} people={people} timing={summary.timing} />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] gap-4">
            <SprintIssueList
              title="Blocked"
              description="Flagged in Jira or in an on-hold status."
              issues={summary.blocked}
              emptyMessage="Nothing is blocked."
            />
            <SprintIssueList
              title={ended ? "Carrying over" : "Not done yet"}
              description={ended ? "Not in Done when the sprint ended, so they roll into the next sprint." : "Everything not in the Done column, furthest along first."}
              issues={summary.notDone}
              emptyMessage="Everything is done."
            />
          </div>
        </>
      )}
    </div>
  );
};
