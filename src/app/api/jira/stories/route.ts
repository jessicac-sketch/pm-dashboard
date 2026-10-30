import { NextResponse, type NextRequest } from "next/server";
import { createStories } from "@/lib/jira/issues";
import { jiraRoute } from "@/lib/jira/route";
import type { CreateJiraStoriesRequest } from "@/types/stories";

// POST /api/jira/stories: creates the PM's approved stories (and their subtasks) under the epic.
export const POST = async (request: NextRequest) => {
  const body = (await request.json().catch(() => null)) as CreateJiraStoriesRequest | null;
  if (!body || !Number.isInteger(body.boardId) || !Array.isArray(body.stories) || body.stories.length === 0) {
    return NextResponse.json({ error: "Nothing to create." }, { status: 400 });
  }
  return jiraRoute((config) => createStories(config, body.boardId, body.epicKey, body.stories));
};
