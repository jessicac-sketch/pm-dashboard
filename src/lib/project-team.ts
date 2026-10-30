import { fteFor, toDraft } from "@/lib/allocation-board";
import type { Allocation, Person } from "@/types/database";

export type TeamMember = {
  person: Person;
  /** Hours per sprint on this project. */
  hours: number;
  /** Hours per sprint across all projects. */
  totalHours: number;
};

export type ProjectTeam = { members: TeamMember[]; fte: number };

export const projectTeam = (projectId: string, allocations: Allocation[], people: Person[]): ProjectTeam => {
  const personById = new Map(people.map((p) => [p.id, p]));
  const pieces = toDraft(allocations).filter((a) => personById.has(a.personId));
  const totals = new Map<string, number>();
  for (const a of pieces) totals.set(a.personId, (totals.get(a.personId) ?? 0) + a.hours);

  const mine = pieces.filter((a) => a.projectId === projectId);
  const members = mine
    .map((a) => ({ person: personById.get(a.personId)!, hours: a.hours, totalHours: totals.get(a.personId) ?? a.hours }))
    .sort((a, b) => b.hours - a.hours);

  return { members, fte: fteFor(mine) };
};
