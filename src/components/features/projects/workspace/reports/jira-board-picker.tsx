"use client";

import { Check, KanbanSquare } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorMessage, Loading } from "@/components/ui/query-state";
import { Select } from "@/components/ui/select";
import { useJiraBoards } from "@/hooks/queries/use-jira";
import { useUpdateProject } from "@/hooks/queries/use-projects";
import type { Project } from "@/types/database";

type JiraBoardPickerProps = {
  project: Project;
  /** Shown when changing an existing link, so the PM can back out. */
  onCancel?: () => void;
};

// Links a project to the Jira Scrum board its sprints live on.
export const JiraBoardPicker = ({ project, onCancel }: JiraBoardPickerProps) => {
  const boards = useJiraBoards();
  const updateProject = useUpdateProject();
  const [boardId, setBoardId] = useState(project.jira_board_id ? String(project.jira_board_id) : "");

  const save = () =>
    updateProject.mutate({ id: project.id, input: { jira_board_id: Number(boardId) } }, { onSuccess: onCancel });

  return (
    <section className="flex flex-col gap-3 border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <KanbanSquare className="mt-0.5 size-5 text-primary" aria-hidden />
        <div>
          <h2 className="text-base font-extrabold">Which Jira board is {project.name} on?</h2>
          <p className="text-sm text-muted">Sprints live on a Scrum board. Pick the one this project&apos;s team plans its sprints on.</p>
        </div>
      </div>

      {boards.isPending ? (
        <Loading />
      ) : boards.isError ? (
        <ErrorMessage error={boards.error} />
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-64 flex-1">
            <Select
              id="jira-board"
              label="Jira board"
              options={[
                { value: "", label: "Choose a board" },
                ...boards.data.map((b) => ({ value: String(b.id), label: `${b.name}${b.projectKey ? ` (${b.projectKey})` : ""}` })),
              ]}
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
            />
          </div>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button icon={Check} onClick={save} loading={updateProject.isPending} disabled={!boardId}>
            Use this board
          </Button>
        </div>
      )}
      {updateProject.error && <ErrorMessage error={updateProject.error} />}
    </section>
  );
};
