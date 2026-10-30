"use client";

import { useEffect, useState } from "react";
import { useCreateJiraStories, useGenerateStories, useRegenerateStory } from "@/hooks/queries/use-stories";
import type { CreatedStory, DraftStory, SourceIssue, StoryBreakdown, StorySource } from "@/types/stories";

export type DraftStatus = "pending" | "approved" | "declined";

export type Draft = { id: number; story: DraftStory; status: DraftStatus };

type Breakdown = Omit<StoryBreakdown, "stories"> & { sourceIssue: SourceIssue | null; source: StorySource };

let nextId = 1;
const toDrafts = (stories: DraftStory[]): Draft[] => stories.map((story) => ({ id: nextId++, story, status: "pending" }));

/** Review state for the Stories tab: AI drafts, the PM's decisions, and creating approved ones in Jira. */
export const useStoryDrafts = (projectName: string, boardId: number | null) => {
  const generate = useGenerateStories();
  const regenerate = useRegenerateStory();
  const createInJira = useCreateJiraStories();
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);
  const [created, setCreated] = useState<CreatedStory[] | null>(null);

  const update = (id: number, change: Partial<Draft>) => setDrafts((list) => list.map((d) => (d.id === id ? { ...d, ...change } : d)));

  const run = (source: StorySource, feedback?: string) =>
    generate.mutate(
      { source, projectName, feedback },
      {
        onSuccess: ({ breakdown: result, sourceIssue }) => {
          const { stories, ...rest } = result;
          setBreakdown({ ...rest, sourceIssue, source });
          // Approved stories survive a "regenerate the rest"; everything else is replaced.
          setDrafts((list) => [...list.filter((d) => feedback !== undefined && d.status === "approved"), ...toDrafts(stories)]);
          setCreated(null);
        },
      },
    );

  const regenerateOne = (id: number, feedback: string) => {
    const draft = drafts.find((d) => d.id === id);
    if (!draft || !breakdown) return;
    setRegeneratingId(id);
    regenerate.mutate(
      {
        source: breakdown.source,
        projectName,
        story: draft.story,
        otherTitles: drafts.filter((d) => d.id !== id && d.status !== "declined").map((d) => d.story.title),
        feedback,
      },
      {
        onSuccess: (story) => update(id, { story, status: "pending" }),
        onSettled: () => setRegeneratingId(null),
      },
    );
  };

  const approved = drafts.filter((d) => d.status === "approved");

  // Drafts only live in this page, so warn before closing the tab with some still open.
  useEffect(() => {
    if (drafts.length === 0) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [drafts.length]);

  const createApproved = () => {
    if (!boardId || approved.length === 0) return;
    createInJira.mutate(
      { boardId, epicKey: breakdown?.sourceIssue?.epic?.key ?? null, stories: approved.map((d) => d.story) },
      {
        onSuccess: (results) => {
          setCreated(results);
          // Keep only what failed, so the PM can fix and retry it.
          const failed = new Set(results.filter((r) => r.error).map((r) => r.title));
          setDrafts((list) => list.filter((d) => d.status !== "approved" || failed.has(d.story.title)));
        },
      },
    );
  };

  const startOver = () => {
    setBreakdown(null);
    setDrafts([]);
    setCreated(null);
    generate.reset();
  };

  return {
    breakdown,
    drafts,
    approvedCount: approved.length,
    created,
    generating: generate.isPending,
    generateError: generate.error,
    regeneratingId,
    regenerateError: regenerate.error,
    creating: createInJira.isPending,
    createError: createInJira.error,
    generate: (source: StorySource) => run(source),
    // Approved stories are kept, so tell the AI not to write them again.
    regenerateRest: (feedback: string) =>
      breakdown &&
      run(
        breakdown.source,
        [feedback.trim(), approved.length ? `Already approved, don't write these again:\n- ${approved.map((d) => d.story.title).join("\n- ")}` : ""]
          .filter(Boolean)
          .join("\n\n"),
      ),
    regenerateOne,
    setStatus: (id: number, status: DraftStatus) => update(id, { status }),
    edit: (id: number, story: DraftStory) => update(id, { story }),
    createApproved,
    startOver,
  };
};

export type StoryDraftsState = ReturnType<typeof useStoryDrafts>;
