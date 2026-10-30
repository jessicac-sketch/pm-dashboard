"use client";

import { KeyRound } from "lucide-react";
import { ErrorMessage, Loading } from "@/components/ui/query-state";
import { useJiraHealth } from "@/hooks/queries/use-jira";
import { useAiHealth } from "@/hooks/queries/use-stories";
import { useStoryDrafts } from "@/hooks/use-story-drafts";
import type { Project } from "@/types/database";
import { BreakdownReview } from "./breakdown-review";
import { StorySourceForm } from "./story-source-form";

// AI story writer: draft stories from an epic or an idea, review each one, then create the approved ones in Jira.
export const StoriesTab = ({ project }: { project: Project }) => {
  const ai = useAiHealth();
  const jira = useJiraHealth();
  const drafts = useStoryDrafts(project.name, project.jira_board_id);

  if (ai.isPending || jira.isPending) return <Loading />;
  if (ai.isError) return <ErrorMessage error={ai.error} />;

  if (!ai.data.configured) {
    return (
      <section className="flex items-start gap-3 border border-l-4 border-border border-l-warning bg-surface p-4">
        <KeyRound className="mt-0.5 size-5 text-warning" aria-hidden />
        <div>
          <h2 className="text-base font-extrabold">The AI story writer isn&apos;t set up yet</h2>
          <p className="text-sm text-muted">
            Add {ai.data.missing.join(" and ")} to .env.local, then restart the app. See .env.example for what each one is.
          </p>
        </div>
      </section>
    );
  }

  const jiraConnected = !!jira.data?.configured && jira.data.connected;
  const createBlocker = !jiraConnected
    ? "Jira isn't connected, so stories can't be created there. Copy them from here instead."
    : !project.jira_board_id
      ? "Link this project to its Jira board on the Reports tab to create stories."
      : null;

  return drafts.breakdown ? (
    <BreakdownReview drafts={drafts} createBlocker={createBlocker} />
  ) : (
    <StorySourceForm jiraConnected={jiraConnected} generating={drafts.generating} error={drafts.generateError} onGenerate={drafts.generate} />
  );
};
