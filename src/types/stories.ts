// Draft stories the AI writes in the project's Stories tab, before they go to Jira.

export type SubtaskKind = "API" | "UI" | "Other";

export type DraftSubtask = { kind: SubtaskKind; summary: string };

export type DraftStory = {
  title: string;
  description: string;
  /** Design link, or "TBD". */
  uiux: string;
  criteria: string[];
  subtasks: DraftSubtask[];
};

export type StoryBreakdown = {
  /** One line on how and why it was split, empty when it stayed one story. */
  splitSummary: string;
  stories: DraftStory[];
  assumptions: string[];
  outOfScope: string[];
};

/** What the stories are written from: a Jira issue, a typed idea, or both. */
export type StorySource = { jiraKey: string | null; idea: string };

/** The Jira issue a breakdown started from, plus where new stories will go. */
export type SourceIssue = {
  key: string;
  url: string;
  type: string;
  summary: string;
  description: string;
  /** The epic new stories are created under: the issue itself if it's an epic, else its parent. */
  epic: { key: string; summary: string } | null;
  /** Stories already under the epic, so the AI doesn't duplicate them. */
  siblingSummaries: string[];
};

export type GenerateStoriesRequest = {
  projectName: string;
  source: StorySource;
  /** Feedback when regenerating, e.g. "fewer criteria". */
  feedback?: string;
};

export type GenerateStoriesResponse = { breakdown: StoryBreakdown; sourceIssue: SourceIssue | null };

export type RegenerateStoryRequest = {
  projectName: string;
  source: StorySource;
  story: DraftStory;
  /** The other stories in the breakdown, so the new version doesn't overlap them. */
  otherTitles: string[];
  feedback: string;
};

export type CreateJiraStoriesRequest = {
  boardId: number;
  epicKey: string | null;
  stories: DraftStory[];
};

export type CreatedStory = { key: string; url: string; title: string; subtaskKeys: string[]; error?: string };

export type AiHealth = { configured: false; missing: string[] } | { configured: true; model: string };
