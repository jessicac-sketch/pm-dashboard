import { NextResponse } from "next/server";
import { AiError } from "@/lib/ai/openai";
import { getAiConfig, type AiConfig } from "@/lib/ai/config";
import { JiraError } from "@/lib/jira/client";
import { getJiraConfig } from "@/lib/jira/config";
import { getSourceIssue } from "@/lib/jira/issues";
import type { SourceIssue, StorySource } from "@/types/stories";

/** Runs an AI story route and turns failures into `{ error }` JSON responses. */
export const storyRoute = async <T,>(run: (ai: AiConfig) => Promise<T>) => {
  const ai = getAiConfig();
  if (!ai) return NextResponse.json({ error: "The AI isn't set up. Fill in OPENAI_API_KEY and OPENAI_MODEL in .env.local." }, { status: 503 });
  try {
    return NextResponse.json(await run(ai));
  } catch (error) {
    if (error instanceof AiError || error instanceof JiraError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Something went wrong writing the stories." }, { status: 500 });
  }
};

/** The Jira issue a breakdown starts from, or null when the PM only typed an idea. */
export const loadSourceIssue = async (source: StorySource): Promise<SourceIssue | null> => {
  const key = source.jiraKey?.trim().toUpperCase();
  if (!key) return null;
  const jira = getJiraConfig();
  if (!jira) throw new JiraError("Jira isn't set up, so the issue can't be read. Paste its text instead.", 503);
  return getSourceIssue(jira, key);
};

export const hasInput = (source: StorySource | undefined) => !!source && (!!source.jiraKey?.trim() || !!source.idea?.trim());
