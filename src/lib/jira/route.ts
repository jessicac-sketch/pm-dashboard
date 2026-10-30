import { NextResponse } from "next/server";
import { JiraError } from "@/lib/jira/client";
import { getJiraConfig, type JiraConfig } from "@/lib/jira/config";

/** Runs a Jira call for a route handler and turns failures into `{ error }` JSON responses. */
export const jiraRoute = async <T,>(run: (config: JiraConfig) => Promise<T>) => {
  const config = getJiraConfig();
  if (!config) return NextResponse.json({ error: "Jira isn't set up. Fill in the JIRA_ keys in .env.local." }, { status: 503 });
  try {
    return NextResponse.json(await run(config));
  } catch (error) {
    if (error instanceof JiraError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Something went wrong reading from Jira." }, { status: 500 });
  }
};
