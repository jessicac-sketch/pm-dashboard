import { formatHours } from "@/lib/allocation-board";
import { ROLE_LABELS } from "@/lib/people";
import type { ProjectTeam } from "@/lib/project-team";
import type { WbsSummary } from "@/lib/wbs";
import type { Project, Risk, RiskInsert } from "@/types/database";

// Risks the app can spot from data it already has. Each has a stable key so a
// dismissed or accepted suggestion doesn't come back.

export type RiskDraft = Omit<RiskInsert, "project_id">;

export type RiskSuggestion = {
  key: string;
  source: string;
  signal: string;
  draft: RiskDraft;
};

type SuggestionInput = {
  project: Project;
  team: ProjectTeam;
  wbs: WbsSummary;
  risks: Risk[];
  dismissed: string[];
  today: string;
};

export const buildRiskSuggestions = ({ project, team, wbs, risks, dismissed, today }: SuggestionInput) => {
  const suggestions: RiskSuggestion[] = [];
  const unfinishedWork = wbs.rows.filter((r) => r.item.kind === "work_package" && r.progress < 100);
  const firstUpcoming = unfinishedWork.find((r) => !r.start || r.start >= today);

  // 1. Required roles nobody on the team covers.
  const coveredRoles = new Set(team.members.map((m) => m.person.role));
  for (const role of project.required_roles.filter((r) => !coveredRoles.has(r))) {
    const label = ROLE_LABELS[role];
    suggestions.push({
      key: `missing-role:${role}`,
      source: "Team",
      signal: `${label} is a required role, but no one on the team has it.`,
      draft: {
        title: `No ${label} assigned, so ${label.toLowerCase()} work may be skipped or delayed`,
        category: "resourcing",
        probability: 4,
        impact: 4,
        residual_probability: 2,
        residual_impact: 3,
        response: "mitigate",
        trigger_sign: `No ${label} booked two weeks before their work starts`,
        response_plan: `Assign a ${label} on the Resources board`,
        wbs_item_id: firstUpcoming?.item.id ?? null,
        suggestion_key: `missing-role:${role}`,
      },
    });
  }

  // 2. Below the staffing target.
  if (project.required_fte !== null && team.fte < project.required_fte) {
    const short = (project.required_fte - team.fte).toFixed(2);
    suggestions.push({
      key: "understaffed",
      source: "Resources",
      signal: `Staffed at ${team.fte.toFixed(2)} of ${project.required_fte} FTE (${short} short).`,
      draft: {
        title: `Team is ${short} FTE below target; delivery may slip`,
        category: "resourcing",
        probability: 3,
        impact: 3,
        residual_probability: 2,
        residual_impact: 2,
        response: "mitigate",
        trigger_sign: "Still below target at the next weekly review",
        response_plan: "Add people or re-plan scope with the sponsor",
        suggestion_key: "understaffed",
      },
    });
  }

  // 3. Team members booked over their sprint capacity across all projects.
  for (const member of team.members.filter((m) => m.totalHours > m.person.sprint_capacity_hours)) {
    const theirWork = unfinishedWork.find((r) => r.item.owner_person_id === member.person.id);
    const name = member.person.full_name;
    suggestions.push({
      key: `overallocated:${member.person.id}`,
      source: "Resources",
      signal: `${name} is booked ${formatHours(member.totalHours)} of ${formatHours(member.person.sprint_capacity_hours)} this sprint across all projects.`,
      draft: {
        title: `${name} is over-allocated; their work here may slip`,
        category: "resourcing",
        probability: 3,
        impact: 3,
        residual_probability: 2,
        residual_impact: 2,
        response: "mitigate",
        trigger_sign: `${name} still over capacity next week`,
        response_plan: "Rebalance their projects on the Resources board",
        owner_person_id: null,
        wbs_item_id: theirWork?.item.id ?? null,
        suggestion_key: `overallocated:${member.person.id}`,
      },
    });
  }

  // 4. Work packages past their finish date.
  const late = wbs.rows.filter((r) => r.late && r.item.kind === "work_package");
  if (late.length > 0) {
    suggestions.push({
      key: "late-work",
      source: "WBS",
      signal: `${late.length} work package${late.length === 1 ? " is" : "s are"} past the finish date: ${late.map((r) => r.code).join(", ")}.`,
      draft: {
        title: "Late work squeezes the phases that follow",
        category: "schedule",
        probability: 4,
        impact: 3,
        residual_probability: 3,
        residual_impact: 2,
        response: "mitigate",
        trigger_sign: "Late items not finished by the next milestone",
        response_plan: "Re-plan the late work packages and protect the next milestone",
        wbs_item_id: firstUpcoming?.item.id ?? null,
        suggestion_key: "late-work",
      },
    });
  }

  const taken = new Set([...dismissed, ...risks.map((r) => r.suggestion_key).filter(Boolean)]);
  return suggestions.filter((s) => !taken.has(s.key));
};
