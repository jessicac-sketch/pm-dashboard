import { NextResponse, type NextRequest } from "next/server";
import { chatJson } from "@/lib/ai/openai";
import { SINGLE_STORY_SCHEMA, singleStoryPrompt, STORY_RULES } from "@/lib/stories/prompt";
import { hasInput, loadSourceIssue, storyRoute } from "@/lib/stories/route";
import type { DraftStory, RegenerateStoryRequest } from "@/types/stories";

// POST /api/stories/regenerate: rewrites one story from a breakdown, using the PM's feedback.
export const POST = async (request: NextRequest) => {
  const body = (await request.json().catch(() => null)) as RegenerateStoryRequest | null;
  if (!body || !hasInput(body.source) || !body.story) return NextResponse.json({ error: "Missing the story to rewrite." }, { status: 400 });

  return storyRoute(async (ai) => {
    const sourceIssue = await loadSourceIssue(body.source);
    const story = await chatJson<DraftStory>(
      ai,
      [
        { role: "system", content: STORY_RULES },
        { role: "user", content: singleStoryPrompt(body.source, sourceIssue, body.projectName, body.story, body.otherTitles ?? [], body.feedback ?? "") },
      ],
      "story",
      SINGLE_STORY_SCHEMA,
    );
    return { story };
  });
};
