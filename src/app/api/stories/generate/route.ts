import { NextResponse, type NextRequest } from "next/server";
import { chatJson } from "@/lib/ai/openai";
import { BREAKDOWN_SCHEMA, breakdownPrompt, STORY_RULES } from "@/lib/stories/prompt";
import { hasInput, loadSourceIssue, storyRoute } from "@/lib/stories/route";
import type { GenerateStoriesRequest, GenerateStoriesResponse, StoryBreakdown } from "@/types/stories";

// POST /api/stories/generate: drafts stories from a Jira issue and/or the PM's notes.
export const POST = async (request: NextRequest) => {
  const body = (await request.json().catch(() => null)) as GenerateStoriesRequest | null;
  if (!body || !hasInput(body.source)) return NextResponse.json({ error: "Give a Jira key or describe what you need." }, { status: 400 });

  return storyRoute(async (ai): Promise<GenerateStoriesResponse> => {
    const sourceIssue = await loadSourceIssue(body.source);
    const breakdown = await chatJson<StoryBreakdown>(
      ai,
      [
        { role: "system", content: STORY_RULES },
        { role: "user", content: breakdownPrompt(body.source, sourceIssue, body.projectName, body.feedback) },
      ],
      "story_breakdown",
      BREAKDOWN_SCHEMA,
    );
    return { breakdown, sourceIssue };
  });
};
