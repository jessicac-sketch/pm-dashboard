import type { DraftStory, SourceIssue, StorySource } from "@/types/stories";

// Instructions for the AI story writer. The rules mirror the PM skill in
// .claude/skills/jira-story-writer/SKILL.md; keep the two in step when the team's style changes.

export const STORY_RULES = `You write Jira user stories for a product team. Their hierarchy is Epic > Story > Subtasks.
The PM reviews what you write and approves, edits or declines each story, so write stories that need as little editing as possible.

Every story is a short description plus a short numbered list of User Acceptance Criteria that goes straight to the point.
Shorter and clearer beats complete and long. Developers and QA use the criteria to know what "done" means.

WHEN TO SPLIT. Split the input into several stories when it would need more than 7 criteria, has more than one actor doing
different things (e.g. Admin generates, Franchisee reviews), covers more than one screen or flow step, needs "and" in its title,
or won't fit in one sprint. Split by, best first: workflow step; actor; happy path first with edge cases later; business rule or
variation; operation (view, create, edit, delete); extras such as notifications, exports and filters as their own stories.
Each story must still deliver something a user can see or use. Never split into a "backend story" and a "frontend story";
that belongs in the subtasks. If the input is already small, return one tightened story.

STORY FIELDS.
- title: "[Module] <Actor> can <do something>", under about 12 words. Take the module from the epic name
  (epic "01 - Proposal" gives "[Proposal]"); if there's no epic, infer a short module name.
- description: 1 to 3 plain sentences on what the user can do and why. No background essay, no repeating the criteria.
  Mention related Jira keys when relevant.
- uiux: the design link from the input if there is one, otherwise "TBD".
- criteria: 3 to 6 items, 7 at most. Each is one observable behavior QA can check by using the product: one behavior per line,
  what the user sees or can do (not how it is built), exact names of buttons, statuses and fields in double quotes,
  plain direct language starting with the actor or the thing that changes (never "shall", "hereinafter", "petitioner").
  Include an error or edge case only when it matters to the business. Don't number the items yourself.
- subtasks: by default one {kind: "API"} and one {kind: "UI"}, e.g. "Create a proposal on behalf of a selected franchisee" and
  "Franchisee picker and \\"Generate Proposal\\" action in the Dashboard". Add an "Other" subtask only when the work needs it
  (a migration, an email template). No hour estimates.

ALSO RETURN.
- splitSummary: one line naming the split and why, e.g. "Split into 3 stories by workflow step: generate, notify, revise".
  Empty string when it stays one story.
- assumptions: one short line per assumption you made instead of asking. Empty when none.
- outOfScope: anything you deliberately left for later. Empty when none.
- Don't duplicate stories that already exist under the epic.`;

const STORY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "uiux", "criteria", "subtasks"],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    uiux: { type: "string" },
    criteria: { type: "array", items: { type: "string" } },
    subtasks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "summary"],
        properties: { kind: { type: "string", enum: ["API", "UI", "Other"] }, summary: { type: "string" } },
      },
    },
  },
};

export const BREAKDOWN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["splitSummary", "stories", "assumptions", "outOfScope"],
  properties: {
    splitSummary: { type: "string" },
    stories: { type: "array", items: STORY_SCHEMA },
    assumptions: { type: "array", items: { type: "string" } },
    outOfScope: { type: "array", items: { type: "string" } },
  },
};

export const SINGLE_STORY_SCHEMA = STORY_SCHEMA;

const describeSource = (source: StorySource, issue: SourceIssue | null, projectName: string) => {
  const parts = [`Project: ${projectName}`];
  if (issue) {
    parts.push(`Jira ${issue.type} ${issue.key}: ${issue.summary}`);
    if (issue.epic && issue.epic.key !== issue.key) parts.push(`Parent epic ${issue.epic.key}: ${issue.epic.summary}`);
    if (issue.description.trim()) parts.push(`Current description:\n${issue.description.trim()}`);
    if (issue.siblingSummaries.length) parts.push(`Stories that already exist under the epic:\n- ${issue.siblingSummaries.join("\n- ")}`);
  }
  if (source.idea.trim()) parts.push(`${issue ? "Extra notes from the PM" : "What the PM wants"}:\n${source.idea.trim()}`);
  return parts.join("\n\n");
};

export const breakdownPrompt = (source: StorySource, issue: SourceIssue | null, projectName: string, feedback?: string) =>
  [
    "Write the stories for this.",
    describeSource(source, issue, projectName),
    feedback?.trim() ? `The PM wasn't happy with the last version. Their feedback:\n${feedback.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

export const singleStoryPrompt = (
  source: StorySource,
  issue: SourceIssue | null,
  projectName: string,
  story: DraftStory,
  otherTitles: string[],
  feedback: string,
) =>
  [
    "Rewrite ONE story from a breakdown. Return only that story.",
    describeSource(source, issue, projectName),
    otherTitles.length ? `The other stories in this breakdown (don't overlap them):\n- ${otherTitles.join("\n- ")}` : "",
    `The story to rewrite:\n${JSON.stringify(story, null, 2)}`,
    feedback.trim() ? `The PM's feedback on it:\n${feedback.trim()}` : "Write a better version of it.",
  ]
    .filter(Boolean)
    .join("\n\n");
