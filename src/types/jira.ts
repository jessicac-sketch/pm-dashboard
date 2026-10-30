// Shapes the app's /api/jira routes return. Trimmed from Jira's REST responses
// so the browser only gets what the reports use.

export type JiraHealth =
  | { configured: false; missing: string[] }
  | { configured: true; connected: false; hint: string; status?: number }
  | { configured: true; connected: true; site: string; account: string };

export type JiraBoard = {
  id: number;
  name: string;
  projectKey: string | null;
};

export type JiraSprintState = "active" | "closed" | "future";

export type JiraSprint = {
  id: number;
  name: string;
  state: JiraSprintState;
  goal: string;
  startDate: string | null;
  endDate: string | null;
  completeDate: string | null;
};

/** Jira's status categories: "new" is To Do, "indeterminate" is In Progress. */
export type JiraStatusCategory = "new" | "indeterminate" | "done";

export type JiraAssignee = {
  accountId: string;
  displayName: string;
  /** Often hidden by the person's Jira privacy settings. */
  email: string | null;
};

export type JiraSprintIssue = {
  key: string;
  url: string;
  summary: string;
  type: string;
  isSubtask: boolean;
  status: string;
  statusCategory: JiraStatusCategory;
  priority: string | null;
  assignee: JiraAssignee | null;
  /** Original estimate in hours, null when not estimated. */
  estimateHours: number | null;
  /** All time logged on the issue, in hours. */
  loggedHours: number;
  /** Remaining estimate in hours, null when not set. */
  remainingHours: number | null;
  flagged: boolean;
};

export type SprintReportPayload = {
  board: JiraBoard;
  /** The sprint shown: the one asked for, else the active one, else the last closed one. */
  sprint: JiraSprint | null;
  /** Sprints to choose from: active ones first, then the most recent closed ones. */
  sprints: JiraSprint[];
  issues: JiraSprintIssue[];
  /** Issues added after the sprint started, or null when Jira didn't say. */
  addedKeys: string[] | null;
};
