import { NextResponse, type NextRequest } from "next/server";
import { jiraRoute } from "@/lib/jira/route";
import { getSprintReport } from "@/lib/jira/sprints";

type Context = { params: Promise<{ boardId: string }> };

// GET /api/jira/boards/:boardId/sprint-report?sprintId=123
// Without sprintId it reports on the active sprint (or the last closed one).
export const GET = async (request: NextRequest, { params }: Context) => {
  const boardId = Number((await params).boardId);
  const sprintParam = request.nextUrl.searchParams.get("sprintId");
  const sprintId = sprintParam ? Number(sprintParam) : null;
  if (!Number.isInteger(boardId) || (sprintId !== null && !Number.isInteger(sprintId))) {
    return NextResponse.json({ error: "Board and sprint must be numbers." }, { status: 400 });
  }
  return jiraRoute((config) => getSprintReport(config, boardId, sprintId));
};
