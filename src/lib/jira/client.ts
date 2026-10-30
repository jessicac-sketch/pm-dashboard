import { jiraAuthHeader, type JiraConfig } from "@/lib/jira/config";

// Server-side Jira REST calls. Only import this from route handlers.

export class JiraError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const hintFor = (status: number) =>
  status === 401
    ? "Jira rejected the email/API token in .env.local."
    : status === 403
      ? "The Jira account in .env.local can't see this board."
      : status === 404
        ? "Jira couldn't find that board or sprint."
        : `Jira answered with HTTP ${status}.`;

export const jiraGet = async <T,>(config: JiraConfig, path: string): Promise<T> => {
  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}${path}`, {
      headers: { Authorization: jiraAuthHeader(config), Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new JiraError("Couldn't reach Jira. Check JIRA_BASE_URL.", 502);
  }
  if (!res.ok) throw new JiraError(hintFor(res.status), res.status);
  return (await res.json()) as T;
};

type Paged<T> = { values: T[]; isLast?: boolean; total?: number; startAt: number; maxResults: number };

/** Follows Jira Agile's startAt paging until the last page. `path` must already have a query string. */
export const jiraGetAllPages = async <T,>(config: JiraConfig, path: string, pageSize = 50): Promise<T[]> => {
  const all: T[] = [];
  for (let startAt = 0; ; startAt += pageSize) {
    const page = await jiraGet<Paged<T>>(config, `${path}&startAt=${startAt}&maxResults=${pageSize}`);
    all.push(...page.values);
    const done = page.isLast ?? (page.total !== undefined ? startAt + page.values.length >= page.total : true);
    if (done || page.values.length === 0) return all;
  }
};

/** POST JSON to Jira. Error messages from Jira's validation are passed through so the PM can act on them. */
export const jiraPost = async <T,>(config: JiraConfig, path: string, body: unknown): Promise<T> => {
  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}${path}`, {
      method: "POST",
      headers: { Authorization: jiraAuthHeader(config), Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new JiraError("Couldn't reach Jira. Check JIRA_BASE_URL.", 502);
  }
  const json = (await res.json().catch(() => null)) as (T & { errorMessages?: string[]; errors?: Record<string, string> }) | null;
  if (!res.ok) {
    const details = [...(json?.errorMessages ?? []), ...Object.values(json?.errors ?? {})].join(" ");
    throw new JiraError(details || hintFor(res.status), res.status);
  }
  return json as T;
};
