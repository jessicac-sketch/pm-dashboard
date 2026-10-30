import { NextResponse } from "next/server";
import { getJiraConfig, jiraAuthHeader, missingJiraEnv } from "@/lib/jira/config";

// GET /api/jira/health: checks the Jira keys in .env.local without exposing them.
// Only reachable when signed in (the middleware guards every route).
export const GET = async () => {
  const config = getJiraConfig();
  if (!config) {
    return NextResponse.json({ configured: false, missing: missingJiraEnv() });
  }

  try {
    const res = await fetch(`${config.baseUrl}/rest/api/3/myself`, {
      headers: { Authorization: jiraAuthHeader(config), Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      const hint =
        res.status === 401
          ? "Jira rejected the email/API token pair."
          : res.status === 404
            ? "JIRA_BASE_URL doesn't look like a Jira Cloud site."
            : `Jira answered with HTTP ${res.status}.`;
      return NextResponse.json({ configured: true, connected: false, status: res.status, hint });
    }
    const me = (await res.json()) as { displayName?: string; emailAddress?: string };
    return NextResponse.json({ configured: true, connected: true, site: config.baseUrl, account: me.displayName ?? me.emailAddress });
  } catch {
    return NextResponse.json({ configured: true, connected: false, hint: "Couldn't reach JIRA_BASE_URL. Check the address." });
  }
};
