import { jiraGet, jiraGetAllPages } from "@/lib/jira/client";
import type { JiraConfig } from "@/lib/jira/config";
import type { JiraBoard, JiraSprint, JiraSprintIssue, JiraStatusCategory, SprintReportPayload } from "@/types/jira";

// Server-side: reads boards, sprints and sprint issues from Jira and trims them
// to the shapes in src/types/jira.ts.

/** Jira's standard "Flagged" (impediment) field. */
const FLAGGED_FIELD = "customfield_10021";
const ISSUE_FIELDS = [
  "summary",
  "status",
  "assignee",
  "issuetype",
  "priority",
  "timeoriginalestimate",
  "timespent",
  "timeestimate",
  FLAGGED_FIELD,
].join(",");
/** Closed sprints offered in the sprint picker, newest first. */
const RECENT_CLOSED = 5;

type RawBoard = { id: number; name: string; location?: { projectKey?: string } };
type RawSprint = {
  id: number;
  name: string;
  state: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  completeDate?: string;
};
type RawIssue = {
  key: string;
  fields: {
    summary: string;
    status: { name: string; statusCategory: { key: string } };
    assignee: { accountId: string; displayName: string; emailAddress?: string } | null;
    issuetype: { name: string; subtask: boolean };
    priority: { name: string } | null;
    timeoriginalestimate: number | null;
    timespent: number | null;
    timeestimate: number | null;
    [FLAGGED_FIELD]?: unknown[] | null;
  };
};

const toBoard = (b: RawBoard): JiraBoard => ({ id: b.id, name: b.name.trim(), projectKey: b.location?.projectKey ?? null });

const toSprint = (s: RawSprint): JiraSprint => ({
  id: s.id,
  name: s.name,
  state: s.state === "active" || s.state === "closed" ? s.state : "future",
  goal: s.goal ?? "",
  startDate: s.startDate ?? null,
  endDate: s.endDate ?? null,
  completeDate: s.completeDate ?? null,
});

const hours = (seconds: number | null) => (seconds === null ? null : Math.round((seconds / 3600) * 10) / 10);

const toIssue = (config: JiraConfig, raw: RawIssue): JiraSprintIssue => {
  const f = raw.fields;
  const category = f.status.statusCategory.key;
  return {
    key: raw.key,
    url: `${config.baseUrl}/browse/${raw.key}`,
    summary: f.summary,
    type: f.issuetype.name,
    isSubtask: f.issuetype.subtask,
    status: f.status.name,
    statusCategory: (category === "done" || category === "new" ? category : "indeterminate") as JiraStatusCategory,
    priority: f.priority?.name ?? null,
    assignee: f.assignee
      ? { accountId: f.assignee.accountId, displayName: f.assignee.displayName, email: f.assignee.emailAddress ?? null }
      : null,
    estimateHours: hours(f.timeoriginalestimate),
    loggedHours: hours(f.timespent) ?? 0,
    remainingHours: hours(f.timeestimate),
    flagged: Array.isArray(f[FLAGGED_FIELD]) && f[FLAGGED_FIELD]!.length > 0,
  };
};

/** Every Scrum board the Jira account can see, by name. */
export const listScrumBoards = async (config: JiraConfig): Promise<JiraBoard[]> => {
  const boards = await jiraGetAllPages<RawBoard>(config, "/rest/agile/1.0/board?type=scrum");
  return boards.map(toBoard).sort((a, b) => a.name.localeCompare(b.name));
};

const listSprints = async (config: JiraConfig, boardId: number) => {
  const all = (await jiraGetAllPages<RawSprint>(config, `/rest/agile/1.0/board/${boardId}/sprint?state=active,closed`)).map(toSprint);
  const active = all.filter((s) => s.state === "active");
  const closed = all
    .filter((s) => s.state === "closed")
    .sort((a, b) => (b.completeDate ?? b.endDate ?? "").localeCompare(a.completeDate ?? a.endDate ?? ""))
    .slice(0, RECENT_CLOSED);
  return [...active, ...closed];
};

const listSprintIssues = async (config: JiraConfig, sprintId: number) => {
  const issues: JiraSprintIssue[] = [];
  const pageSize = 100;
  for (let startAt = 0; ; startAt += pageSize) {
    const page = await jiraGet<{ issues: RawIssue[]; total: number }>(
      config,
      `/rest/agile/1.0/sprint/${sprintId}/issue?fields=${ISSUE_FIELDS}&startAt=${startAt}&maxResults=${pageSize}`,
    );
    issues.push(...page.issues.map((raw) => toIssue(config, raw)));
    if (page.issues.length === 0 || startAt + page.issues.length >= page.total) return issues;
  }
};

// Jira's own sprint report knows which issues joined mid-sprint. It's not part of the
// public API, so the report treats it as optional and carries on without it.
const listAddedKeys = async (config: JiraConfig, boardId: number, sprintId: number) => {
  try {
    const report = await jiraGet<{ contents?: { issueKeysAddedDuringSprint?: Record<string, boolean> } }>(
      config,
      `/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId=${boardId}&sprintId=${sprintId}`,
    );
    const added = report.contents?.issueKeysAddedDuringSprint;
    return added ? Object.keys(added) : null;
  } catch {
    return null;
  }
};

export const getSprintReport = async (config: JiraConfig, boardId: number, sprintId: number | null): Promise<SprintReportPayload> => {
  const [board, sprints] = await Promise.all([
    jiraGet<RawBoard>(config, `/rest/agile/1.0/board/${boardId}`).then(toBoard),
    listSprints(config, boardId),
  ]);
  let sprint = sprintId === null ? (sprints[0] ?? null) : (sprints.find((s) => s.id === sprintId) ?? null);
  if (sprintId !== null && !sprint) sprint = toSprint(await jiraGet<RawSprint>(config, `/rest/agile/1.0/sprint/${sprintId}`));
  if (!sprint) return { board, sprint: null, sprints, issues: [], addedKeys: null };

  const [issues, addedKeys] = await Promise.all([listSprintIssues(config, sprint.id), listAddedKeys(config, boardId, sprint.id)]);
  return { board, sprint, sprints, issues, addedKeys };
};
