import { FULL_TIME_SPRINT_HOURS } from "@/lib/people";
import type { AllocationChanges } from "@/services/allocations.service";
import type { Allocation } from "@/types/database";

// Pure helpers for the drag-and-drop allocation board. A person has at most one
// allocation per project, so "personId:projectId" identifies a piece. Shares are
// planned in hours per sprint.

export type DraftAllocation = {
  key: string;
  personId: string;
  projectId: string;
  hours: number;
};

export type DragPayload = { kind: "person"; personId: string } | { kind: "piece"; key: string };

export type DropTarget = { kind: "project"; projectId: string } | { kind: "bench" };

export type BoardLookup = {
  person: (id: string) => string;
  project: (id: string) => string;
  /** Sprint capacity in hours. */
  capacity: (id: string) => number;
};

/** `key` is the piece the change created or edited, if any. */
export type BoardChange = { list: DraftAllocation[]; personId: string; key?: string; text: string };

/** Hours given to someone dropped on a project when they have no free time left. */
export const FALLBACK_HOURS = 8;
/** The database allows up to 120 hours on one allocation. */
export const MAX_HOURS = 120;

export const pieceKey = (personId: string, projectId: string) => `${personId}:${projectId}`;

/** Rounds to the nearest half hour, between 0.5 and MAX_HOURS. */
export const clampHours = (value: number) => Math.max(0.5, Math.min(MAX_HOURS, Math.round(value * 2) / 2));

export const formatHours = (hours: number) => `${Math.round(hours * 2) / 2}h`;

export const toDraft = (rows: Allocation[]): DraftAllocation[] =>
  rows.map((row) => ({
    key: pieceKey(row.person_id, row.project_id),
    personId: row.person_id,
    projectId: row.project_id,
    hours: Number(row.hours),
  }));

/** Full-time equivalents on a set of pieces (80h per sprint is 1 FTE). */
export const fteFor = (pieces: DraftAllocation[]) =>
  pieces.reduce((sum, a) => sum + a.hours, 0) / FULL_TIME_SPRINT_HOURS;

/** Hours booked per person across all projects. */
export const totalsByPerson = (list: DraftAllocation[]) => {
  const totals = new Map<string, number>();
  for (const a of list) totals.set(a.personId, (totals.get(a.personId) ?? 0) + a.hours);
  return totals;
};

/** Adds `hours` for a person on a project, merging into an existing piece if there is one. */
const addHours = (list: DraftAllocation[], personId: string, projectId: string, hours: number) => {
  const key = pieceKey(personId, projectId);
  const existing = list.find((a) => a.key === key);
  if (existing) {
    return list.map((a) => (a.key === key ? { ...a, hours: clampHours(a.hours + hours) } : a));
  }
  return [...list, { key, personId, projectId, hours: clampHours(hours) }];
};

export const applyDrop = (
  list: DraftAllocation[],
  payload: DragPayload,
  target: DropTarget,
  lookup: BoardLookup,
): BoardChange | null => {
  if (payload.kind === "person") {
    if (target.kind === "bench") return null;
    const { personId } = payload;
    const key = pieceKey(personId, target.projectId);
    // Give them whatever is still free this sprint, so a fresh hire fills up in one move.
    const free = lookup.capacity(personId) - (totalsByPerson(list).get(personId) ?? 0);
    const hours = free > 0 ? free : FALLBACK_HOURS;
    const had = list.some((a) => a.key === key);
    return {
      list: addHours(list, personId, target.projectId, hours),
      personId,
      key,
      text: had
        ? `${lookup.person(personId)} +${formatHours(hours)} on ${lookup.project(target.projectId)}`
        : `${lookup.person(personId)} placed on ${lookup.project(target.projectId)} for ${formatHours(hours)}`,
    };
  }

  const piece = list.find((a) => a.key === payload.key);
  if (!piece) return null;
  const rest = list.filter((a) => a.key !== piece.key);
  const who = lookup.person(piece.personId);
  const from = lookup.project(piece.projectId);

  if (target.kind === "bench") {
    return { list: rest, personId: piece.personId, text: `${who} taken off ${from}` };
  }
  if (target.projectId === piece.projectId) return null;
  return {
    list: addHours(rest, piece.personId, target.projectId, piece.hours),
    personId: piece.personId,
    key: pieceKey(piece.personId, target.projectId),
    text: `${who} moved from ${from} to ${lookup.project(target.projectId)}`,
  };
};

export const applyHours = (
  list: DraftAllocation[],
  key: string,
  hours: number,
  lookup: BoardLookup,
): BoardChange | null => {
  const piece = list.find((a) => a.key === key);
  const next = clampHours(hours);
  if (!piece || piece.hours === next) return null;
  return {
    list: list.map((a) => (a.key === key ? { ...a, hours: next } : a)),
    personId: piece.personId,
    key,
    text: `${lookup.person(piece.personId)} on ${lookup.project(piece.projectId)}: ${formatHours(piece.hours)} to ${formatHours(next)}`,
  };
};

/** What to send to the server so it matches the draft. */
export const diffAllocations = (server: Allocation[], draft: DraftAllocation[]): AllocationChanges => {
  const draftByKey = new Map(draft.map((a) => [a.key, a]));
  const serverByKey = new Map(server.map((row) => [pieceKey(row.person_id, row.project_id), row]));

  const deleteIds = server
    .filter((row) => !draftByKey.has(pieceKey(row.person_id, row.project_id)))
    .map((row) => row.id);

  const upserts = draft
    .filter((a) => {
      const row = serverByKey.get(a.key);
      return !row || Number(row.hours) !== a.hours;
    })
    .map((a) => ({ person_id: a.personId, project_id: a.projectId, hours: a.hours }));

  return { upserts, deleteIds };
};
