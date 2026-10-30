import { jiraRoute } from "@/lib/jira/route";
import { listScrumBoards } from "@/lib/jira/sprints";

// GET /api/jira/boards: every Jira Scrum board, for linking a project to its board.
export const GET = () => jiraRoute(listScrumBoards);
