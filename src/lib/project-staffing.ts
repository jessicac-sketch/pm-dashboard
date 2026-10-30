import { fteFor, toDraft } from "@/lib/allocation-board";
import type { Allocation, Person } from "@/types/database";

export type ProjectStaffing = { people: number; fte: number };

/** People count and FTE per project, counting active people only. */
export const staffingByProject = (allocations: Allocation[], people: Person[]) => {
  const personById = new Map(people.map((p) => [p.id, p]));
  const pieces = toDraft(allocations).filter((a) => personById.has(a.personId));
  const result = new Map<string, ProjectStaffing>();
  for (const projectId of new Set(pieces.map((a) => a.projectId))) {
    const mine = pieces.filter((a) => a.projectId === projectId);
    result.set(projectId, { people: mine.length, fte: fteFor(mine) });
  }
  return result;
};
