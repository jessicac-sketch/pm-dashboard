import { JiraError, jiraGet, jiraPost } from "@/lib/jira/client";
import type { JiraConfig } from "@/lib/jira/config";
import type { CreatedStory, DraftStory, SourceIssue } from "@/types/stories";

// Server-side: reads the issue a story breakdown starts from, and creates approved
// stories (with their subtasks) in Jira. Uses REST v2 so descriptions can be wiki markup.

type RawIssue = {
  key: string;
  fields: {
    summary: string;
    description: string | null;
    issuetype: { name: string };
    parent?: { key: string; fields?: { summary?: string; issuetype?: { name?: string } } };
  };
};

const isEpic = (type: string | undefined) => type?.toLowerCase() === "epic";

const childSummaries = async (config: JiraConfig, epicKey: string) => {
  const jql = encodeURIComponent(`parent = ${epicKey} ORDER BY key`);
  const res = await jiraGet<{ issues: { key: string; fields: { summary: string } }[] }>(
    config,
    `/rest/api/2/search/jql?jql=${jql}&fields=summary&maxResults=100`,
  );
  return res.issues.map((i) => `${i.key}: ${i.fields.summary}`);
};

export const getSourceIssue = async (config: JiraConfig, key: string): Promise<SourceIssue> => {
  const issue = await jiraGet<RawIssue>(config, `/rest/api/2/issue/${encodeURIComponent(key)}?fields=summary,description,issuetype,parent`);
  const f = issue.fields;
  const epic = isEpic(f.issuetype.name)
    ? { key: issue.key, summary: f.summary }
    : f.parent && isEpic(f.parent.fields?.issuetype?.name)
      ? { key: f.parent.key, summary: f.parent.fields?.summary ?? "" }
      : null;
  const siblings = epic ? (await childSummaries(config, epic.key)).filter((s) => !s.startsWith(`${issue.key}:`)) : [];
  return {
    key: issue.key,
    url: `${config.baseUrl}/browse/${issue.key}`,
    type: f.issuetype.name,
    summary: f.summary,
    description: (f.description ?? "").slice(0, 6000),
    epic,
    siblingSummaries: siblings,
  };
};

/** Jira wiki markup in the team's usual layout: description, UI/UX link, numbered UAC. */
export const storyDescription = (story: DraftStory) =>
  [
    story.description.trim(),
    `*UI/UX:* ${story.uiux.trim() || "TBD"}`,
    `*User Acceptance Criteria:*\n${story.criteria.map((c) => `# ${c.trim()}`).join("\n")}`,
  ].join("\n\n");

const issueTypeIds = async (config: JiraConfig, projectKey: string) => {
  const meta = await jiraGet<{ issueTypes?: { id: string; name: string; subtask: boolean }[]; values?: { id: string; name: string; subtask: boolean }[] }>(
    config,
    `/rest/api/2/issue/createmeta/${projectKey}/issuetypes`,
  );
  const types = meta.issueTypes ?? meta.values ?? [];
  const story = types.find((t) => !t.subtask && t.name.toLowerCase() === "story");
  const subtask = types.find((t) => t.subtask);
  if (!story || !subtask) throw new JiraError(`Jira project ${projectKey} has no Story or Sub-task issue type.`, 422);
  return { story: story.id, subtask: subtask.id };
};

/** Creates each story, then its subtasks. Keeps going after a failure so one bad story doesn't block the rest. */
export const createStories = async (
  config: JiraConfig,
  boardId: number,
  epicKey: string | null,
  stories: DraftStory[],
): Promise<CreatedStory[]> => {
  const board = await jiraGet<{ location?: { projectKey?: string } }>(config, `/rest/agile/1.0/board/${boardId}`);
  const projectKey = board.location?.projectKey;
  if (!projectKey) throw new JiraError("Couldn't tell which Jira project this board belongs to.", 422);
  const types = await issueTypeIds(config, projectKey);

  const results: CreatedStory[] = [];
  for (const story of stories) {
    try {
      const created = await jiraPost<{ key: string }>(config, "/rest/api/2/issue", {
        fields: {
          project: { key: projectKey },
          issuetype: { id: types.story },
          summary: story.title.trim(),
          description: storyDescription(story),
          ...(epicKey ? { parent: { key: epicKey } } : {}),
        },
      });
      const subtaskKeys: string[] = [];
      for (const subtask of story.subtasks) {
        const sub = await jiraPost<{ key: string }>(config, "/rest/api/2/issue", {
          fields: {
            project: { key: projectKey },
            issuetype: { id: types.subtask },
            parent: { key: created.key },
            // "[API] ..." / "[UI] ..." so devs see at a glance which side it is.
            summary: subtask.kind === "Other" ? subtask.summary.trim() : `[${subtask.kind}] ${subtask.summary.trim()}`,
          },
        });
        subtaskKeys.push(sub.key);
      }
      results.push({ key: created.key, url: `${config.baseUrl}/browse/${created.key}`, title: story.title, subtaskKeys });
    } catch (error) {
      results.push({ key: "", url: "", title: story.title, subtaskKeys: [], error: error instanceof Error ? error.message : "Failed" });
    }
  }
  return results;
};
