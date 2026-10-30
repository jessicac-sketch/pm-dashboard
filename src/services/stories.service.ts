import type {
  AiHealth,
  CreatedStory,
  CreateJiraStoriesRequest,
  DraftStory,
  GenerateStoriesRequest,
  GenerateStoriesResponse,
  RegenerateStoryRequest,
} from "@/types/stories";

// The AI story writer, through the app's own API routes (which hold the AI and Jira keys server-side).

const request = async <T,>(url: string, body?: unknown): Promise<T> => {
  const res = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok || json === null) throw new Error(json?.error ?? `Request failed (HTTP ${res.status}).`);
  return json;
};

export const storiesService = {
  aiHealth: (): Promise<AiHealth> => request("/api/ai/health"),

  generate: (input: GenerateStoriesRequest): Promise<GenerateStoriesResponse> => request("/api/stories/generate", input),

  regenerate: async (input: RegenerateStoryRequest): Promise<DraftStory> =>
    (await request<{ story: DraftStory }>("/api/stories/regenerate", input)).story,

  createInJira: (input: CreateJiraStoriesRequest): Promise<CreatedStory[]> => request("/api/jira/stories", input),
};
