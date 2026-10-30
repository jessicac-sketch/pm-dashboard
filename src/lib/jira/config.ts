// Jira Cloud credentials from the environment. Server-side only: these
// variables are not NEXT_PUBLIC_, so they're never sent to the browser.

export type JiraConfig = {
  baseUrl: string;
  email: string;
  apiToken: string;
  storyPointsField: string;
};

const REQUIRED = ["JIRA_BASE_URL", "JIRA_EMAIL", "JIRA_API_TOKEN"] as const;

/** Names of required Jira variables that are empty or missing. */
export const missingJiraEnv = () => REQUIRED.filter((name) => !process.env[name]?.trim());

/** The Jira config, or null when it isn't fully set up yet. */
export const getJiraConfig = (): JiraConfig | null => {
  if (typeof window !== "undefined") throw new Error("Jira config must only be read on the server.");
  if (missingJiraEnv().length > 0) return null;
  return {
    baseUrl: process.env.JIRA_BASE_URL!.trim().replace(/\/+$/, ""),
    email: process.env.JIRA_EMAIL!.trim(),
    apiToken: process.env.JIRA_API_TOKEN!.trim(),
    storyPointsField: process.env.JIRA_STORY_POINTS_FIELD?.trim() || "customfield_10016",
  };
};

/** Basic auth header for Jira Cloud's REST API (email + API token). */
export const jiraAuthHeader = (config: JiraConfig) =>
  `Basic ${Buffer.from(`${config.email}:${config.apiToken}`).toString("base64")}`;
