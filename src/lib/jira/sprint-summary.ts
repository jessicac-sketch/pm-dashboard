import type { Allocation, Person } from "@/types/database";
import type { JiraAssignee, JiraSprint, JiraSprintIssue, SprintReportPayload } from "@/types/jira";

// Pure helpers that turn a sprint's Jira issues into the numbers on the sprint report.

/** Only the "Done" column counts as finished (agreed with the PMs). */
const DONE_STATUSES = new Set(["done"]);
/** Statuses that mean work is stuck, on top of Jira's Flagged marker. */
const BLOCKED_STATUSES = /^(on\s*-?\s*hold|blocked)$/i;

export const isDone = (issue: JiraSprintIssue) => DONE_STATUSES.has(issue.status.trim().toLowerCase());
export const isBlocked = (issue: JiraSprintIssue) => !isDone(issue) && (issue.flagged || BLOCKED_STATUSES.test(issue.status.trim()));

const sum = (values: (number | null)[]) => Math.round(values.reduce<number>((a, v) => a + (v ?? 0), 0) * 10) / 10;

export type SprintTotals = {
  issues: number;
  done: number;
  estimate: number;
  doneEstimate: number;
  logged: number;
  remaining: number;
  /** Issues with no original estimate. */
  unestimated: number;
  /** Issues added after the sprint started, or null when Jira didn't say. */
  added: number | null;
  blocked: number;
};

export type StatusCount = { status: string; count: number; category: JiraSprintIssue["statusCategory"]; done: boolean };

export type PersonRow = {
  /** Jira account id, or "unassigned". */
  id: string;
  assignee: JiraAssignee | null;
  person: Person | null;
  issues: number;
  done: number;
  estimate: number;
  logged: number;
  remaining: number;
  /** Hours set for them on this project on the Resources board, null if they aren't allocated. */
  allocated: number | null;
};

export type SprintTiming = {
  /** Working days (Mon to Fri) left until the end date; negative when overdue. */
  workdaysLeft: number | null;
  /** 0 to 1 share of the sprint's calendar time that has passed. */
  elapsed: number | null;
  overdue: boolean;
};

export type SprintSummary = {
  totals: SprintTotals;
  statuses: StatusCount[];
  people: PersonRow[];
  blocked: JiraSprintIssue[];
  notDone: JiraSprintIssue[];
  timing: SprintTiming;
};

/** The person a Jira assignee is: linked account first, then email, then exact name. */
export const matchPerson = (assignee: JiraAssignee, people: Person[]) =>
  people.find((p) => p.jira_account_id === assignee.accountId) ??
  (assignee.email ? people.find((p) => p.email?.toLowerCase() === assignee.email!.toLowerCase()) : undefined) ??
  people.find((p) => !p.jira_account_id && p.full_name.trim().toLowerCase() === assignee.displayName.trim().toLowerCase()) ??
  null;

const CATEGORY_ORDER = { new: 0, indeterminate: 1, done: 2 } as const;

const countWorkdays = (from: Date, to: Date) => {
  let days = 0;
  const step = from <= to ? 1 : -1;
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (d.getTime() !== end.getTime()) {
    d.setDate(d.getDate() + step);
    const weekday = d.getDay();
    if (weekday !== 0 && weekday !== 6) days += step;
  }
  return days;
};

export const sprintTiming = (sprint: JiraSprint, now = new Date()): SprintTiming => {
  if (!sprint.startDate || !sprint.endDate) return { workdaysLeft: null, elapsed: null, overdue: false };
  const start = new Date(sprint.startDate).getTime();
  const end = new Date(sprint.endDate).getTime();
  const at = sprint.state === "closed" && sprint.completeDate ? new Date(sprint.completeDate).getTime() : now.getTime();
  return {
    workdaysLeft: sprint.state === "closed" ? 0 : countWorkdays(now, new Date(end)),
    elapsed: end > start ? Math.min(1, Math.max(0, (at - start) / (end - start))) : null,
    overdue: sprint.state === "active" && now.getTime() > end,
  };
};

export const summarizeSprint = (
  payload: SprintReportPayload,
  people: Person[],
  allocations: Allocation[],
  projectId: string,
): SprintSummary => {
  const { issues } = payload;
  const done = issues.filter(isDone);
  const blocked = issues.filter(isBlocked);

  const statusMap = new Map<string, StatusCount>();
  for (const issue of issues) {
    const row = statusMap.get(issue.status) ?? { status: issue.status, count: 0, category: issue.statusCategory, done: isDone(issue) };
    row.count += 1;
    statusMap.set(issue.status, row);
  }
  const statuses = [...statusMap.values()].sort(
    (a, b) => Number(a.done) - Number(b.done) || CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category] || b.count - a.count,
  );

  const hoursOnProject = new Map(allocations.filter((a) => a.project_id === projectId).map((a) => [a.person_id, Number(a.hours)]));
  const byAssignee = new Map<string, JiraSprintIssue[]>();
  for (const issue of issues) {
    const id = issue.assignee?.accountId ?? "unassigned";
    byAssignee.set(id, [...(byAssignee.get(id) ?? []), issue]);
  }
  const personRows: PersonRow[] = [...byAssignee.entries()].map(([id, mine]) => {
    const assignee = mine[0].assignee;
    const person = assignee ? matchPerson(assignee, people) : null;
    return {
      id,
      assignee,
      person,
      issues: mine.length,
      done: mine.filter(isDone).length,
      estimate: sum(mine.map((i) => i.estimateHours)),
      logged: sum(mine.map((i) => i.loggedHours)),
      remaining: sum(mine.filter((i) => !isDone(i)).map((i) => i.remainingHours ?? i.estimateHours)),
      allocated: person ? (hoursOnProject.get(person.id) ?? null) : null,
    };
  });
  // Unassigned last, everyone else by remaining work.
  personRows.sort((a, b) => Number(a.id === "unassigned") - Number(b.id === "unassigned") || b.remaining - a.remaining);

  const notDone = issues
    .filter((i) => !isDone(i))
    .sort((a, b) => CATEGORY_ORDER[b.statusCategory] - CATEGORY_ORDER[a.statusCategory] || a.status.localeCompare(b.status));

  return {
    totals: {
      issues: issues.length,
      done: done.length,
      estimate: sum(issues.map((i) => i.estimateHours)),
      doneEstimate: sum(done.map((i) => i.estimateHours)),
      logged: sum(issues.map((i) => i.loggedHours)),
      remaining: sum(issues.filter((i) => !isDone(i)).map((i) => i.remainingHours ?? i.estimateHours)),
      unestimated: issues.filter((i) => i.estimateHours === null).length,
      added: payload.addedKeys === null ? null : payload.addedKeys.length,
      blocked: blocked.length,
    },
    statuses,
    people: personRows,
    blocked,
    notDone,
    timing: payload.sprint ? sprintTiming(payload.sprint) : { workdaysLeft: null, elapsed: null, overdue: false },
  };
};
