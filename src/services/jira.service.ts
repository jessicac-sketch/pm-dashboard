import type { JiraBoard, JiraHealth, SprintReportPayload } from "@/types/jira";

// Jira is read through the app's own /api/jira routes, which hold the API token server-side.

const getJson = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: "no-store" });
  const body = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok || body === null) throw new Error(body?.error ?? `Jira request failed (HTTP ${res.status}).`);
  return body;
};

export const jiraService = {
  health: (): Promise<JiraHealth> => getJson("/api/jira/health"),

  boards: (): Promise<JiraBoard[]> => getJson("/api/jira/boards"),

  sprintReport: (boardId: number, sprintId: number | null): Promise<SprintReportPayload> =>
    getJson(`/api/jira/boards/${boardId}/sprint-report${sprintId === null ? "" : `?sprintId=${sprintId}`}`),
};
