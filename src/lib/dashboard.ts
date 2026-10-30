import { daysBetween } from "@/lib/dates";
import { FULL_TIME_SPRINT_HOURS } from "@/lib/people";
import { staffingByProject } from "@/lib/project-staffing";
import { buildWbs } from "@/lib/wbs";
import type { Allocation, Person, Project, ProjectStatus, WbsItem } from "@/types/database";

// Pure helpers for the dashboard's "projects at a glance": one row per open project,
// the headline numbers above it, and the short "needs attention" list beside it.

export type ProjectGlance = {
  project: Project;
  lead: Person | null;
  progress: number;
  /** False when the project has no work packages yet, so 0% isn't mistaken for real progress. */
  hasWork: boolean;
  people: number;
  hours: number;
  fte: number;
  /** FTE still missing against the target; 0 when staffed or no target. */
  shortBy: number;
  lateCount: number;
  /** Days the oldest late work package is past its end date. */
  oldestLateDays: number;
};

export type AttentionLevel = "critical" | "warning" | "info";

export type AttentionItem = { project: Project; level: AttentionLevel; title: string; detail: string };

export type DashboardSummary = {
  active: number;
  planning: number;
  averageProgress: number | null;
  understaffed: number;
  totalShort: number;
  lateWork: number;
  lateProjects: number;
};

export type StatusCount = { status: Exclude<ProjectStatus, "completed">; count: number };

export type DashboardData = {
  rows: ProjectGlance[];
  summary: DashboardSummary;
  attention: AttentionItem[];
  statuses: StatusCount[];
};

/** Open projects in this order: active first, then planning, then on hold. */
const STATUS_ORDER: StatusCount["status"][] = ["active", "planning", "on_hold"];
const LEVEL_ORDER: Record<AttentionLevel, number> = { critical: 0, warning: 1, info: 2 };
const MAX_ATTENTION = 6;

const round2 = (n: number) => Math.round(n * 100) / 100;

const glanceFor = (
  project: Project,
  wbsItems: WbsItem[],
  staffing: ReturnType<typeof staffingByProject>,
  personById: Map<string, Person>,
  today: string,
): ProjectGlance => {
  const wbs = buildWbs(wbsItems, today);
  const late = wbs.rows.filter((r) => r.late);
  const staff = staffing.get(project.id) ?? { people: 0, fte: 0 };
  const fte = round2(staff.fte);
  return {
    project,
    lead: project.lead_person_id ? (personById.get(project.lead_person_id) ?? null) : null,
    progress: wbs.overallProgress,
    hasWork: wbs.rows.some((r) => r.item.kind === "work_package"),
    people: staff.people,
    hours: Math.round(staff.fte * FULL_TIME_SPRINT_HOURS),
    fte,
    shortBy: project.required_fte !== null ? Math.max(0, round2(project.required_fte - fte)) : 0,
    lateCount: late.length,
    oldestLateDays: late.reduce((max, r) => Math.max(max, r.end ? daysBetween(r.end, today) : 0), 0),
  };
};

const attentionFor = (row: ProjectGlance, today: string): AttentionItem[] => {
  const { project } = row;
  const items: AttentionItem[] = [];
  if (project.due_date && project.due_date < today) {
    const days = daysBetween(project.due_date, today);
    items.push({ project, level: "critical", title: "Past its due date", detail: `${days} ${days === 1 ? "day" : "days"} overdue` });
  }
  if (row.lateCount > 0) {
    items.push({
      project,
      level: "critical",
      title: `${row.lateCount} work ${row.lateCount === 1 ? "package" : "packages"} late`,
      detail: `Oldest is ${row.oldestLateDays} ${row.oldestLateDays === 1 ? "day" : "days"} overdue`,
    });
  }
  if (row.shortBy > 0) {
    const target = Math.round(project.required_fte! * FULL_TIME_SPRINT_HOURS);
    items.push({ project, level: "warning", title: `Short by ${row.shortBy.toFixed(2)} FTE`, detail: `${row.hours}h of ${target}h per sprint staffed` });
  }
  if (project.status === "active" && project.required_fte === null) {
    items.push({ project, level: "info", title: "No staffing target set", detail: "Set one in the project's settings" });
  }
  return items;
};

export const buildDashboard = (
  projects: Project[],
  wbsItems: WbsItem[],
  allocations: Allocation[],
  people: Person[],
  today: string,
): DashboardData => {
  const open = projects
    .filter((p) => p.status !== "completed")
    .sort(
      (a, b) =>
        STATUS_ORDER.indexOf(a.status as StatusCount["status"]) - STATUS_ORDER.indexOf(b.status as StatusCount["status"]) ||
        (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") ||
        a.name.localeCompare(b.name),
    );
  const staffing = staffingByProject(allocations, people);
  const personById = new Map(people.map((p) => [p.id, p]));
  const itemsByProject = new Map<string, WbsItem[]>();
  for (const item of wbsItems) itemsByProject.set(item.project_id, [...(itemsByProject.get(item.project_id) ?? []), item]);

  const rows = open.map((p) => glanceFor(p, itemsByProject.get(p.id) ?? [], staffing, personById, today));
  const active = rows.filter((r) => r.project.status === "active");
  const withWork = active.filter((r) => r.hasWork);
  const understaffed = rows.filter((r) => r.shortBy > 0);

  return {
    rows,
    summary: {
      active: active.length,
      planning: rows.filter((r) => r.project.status === "planning").length,
      averageProgress: withWork.length ? Math.round(withWork.reduce((sum, r) => sum + r.progress, 0) / withWork.length) : null,
      understaffed: understaffed.length,
      totalShort: round2(understaffed.reduce((sum, r) => sum + r.shortBy, 0)),
      lateWork: rows.reduce((sum, r) => sum + r.lateCount, 0),
      lateProjects: rows.filter((r) => r.lateCount > 0).length,
    },
    attention: rows
      .flatMap((r) => attentionFor(r, today))
      .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level])
      .slice(0, MAX_ATTENTION),
    statuses: STATUS_ORDER.map((status) => ({ status, count: rows.filter((r) => r.project.status === status).length })),
  };
};
