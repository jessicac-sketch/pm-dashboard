"use client";

import { useEffect, useMemo, useState } from "react";
import { useSaveAllocations } from "@/hooks/queries/use-allocations";
import {
  applyDrop,
  applyHours,
  diffAllocations,
  formatHours,
  toDraft,
  totalsByPerson,
  type BoardChange,
  type BoardLookup,
  type DraftAllocation,
  type DragPayload,
  type DropTarget,
} from "@/lib/allocation-board";
import { FULL_TIME_SPRINT_HOURS } from "@/lib/people";
import type { Allocation, Person, Project } from "@/types/database";

export type BoardMessage = { text: string; warn: boolean };

/** Id used for highlighting the zone under the cursor: a project id, or "bench". */
const zoneId = (target: DropTarget) => (target.kind === "bench" ? "bench" : target.projectId);

type UseAllocationBoardArgs = {
  server: Allocation[];
  people: Person[];
  projects: Project[];
};

export const useAllocationBoard = ({ server, people, projects }: UseAllocationBoardArgs) => {
  const save = useSaveAllocations();
  // `edited` is null until the first move, so the board follows the server until then.
  const [edited, setEdited] = useState<DraftAllocation[] | null>(null);
  const [history, setHistory] = useState<DraftAllocation[][]>([]);
  const [message, setMessage] = useState<BoardMessage | null>(null);
  const [drag, setDrag] = useState<DragPayload | null>(null);
  const [selected, setSelected] = useState<DragPayload | null>(null);
  const [overZone, setOverZone] = useState<string | null>(null);
  // Piece whose hours field takes focus when it mounts, so a new placement can be typed into right away.
  const [focusKey, setFocusKey] = useState<string | null>(null);

  const list = useMemo(() => edited ?? toDraft(server), [edited, server]);
  const totals = useMemo(() => totalsByPerson(list), [list]);
  const changes = useMemo(() => diffAllocations(server, list), [server, list]);
  const changeCount = changes.upserts.length + changes.deleteIds.length;
  const isDirty = changeCount > 0;

  const lookup = useMemo<BoardLookup>(() => {
    const personNames = new Map(people.map((p) => [p.id, p.full_name]));
    const projectNames = new Map(projects.map((p) => [p.id, p.name]));
    const capacities = new Map(people.map((p) => [p.id, p.sprint_capacity_hours]));
    return {
      person: (id) => personNames.get(id) ?? "Someone",
      project: (id) => projectNames.get(id) ?? "a project",
      capacity: (id) => capacities.get(id) ?? FULL_TIME_SPRINT_HOURS,
    };
  }, [people, projects]);

  // Warn before closing the tab with unsaved moves.
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const resetPointer = () => {
    setDrag(null);
    setOverZone(null);
  };

  const commit = (change: BoardChange | null, focusPiece = false) => {
    resetPointer();
    setSelected(null);
    setFocusKey(focusPiece && change?.key ? change.key : null);
    if (!change) return;
    const total = totalsByPerson(change.list).get(change.personId) ?? 0;
    const capacity = lookup.capacity(change.personId);
    const over = total > capacity;
    setHistory((h) => [...h, list]);
    setEdited(change.list);
    setMessage({
      text: over ? `${change.text} · now at ${formatHours(total)} of ${formatHours(capacity)}, over capacity` : change.text,
      warn: over,
    });
  };

  const drop = (target: DropTarget) => {
    const source = drag ?? selected;
    if (source) commit(applyDrop(list, source, target, lookup), true);
  };

  const startDrag = (e: React.DragEvent, payload: DragPayload) => {
    e.dataTransfer.effectAllowed = "move";
    // Firefox only starts a drag when some data is set.
    e.dataTransfer.setData("text/plain", payload.kind === "person" ? payload.personId : payload.key);
    setSelected(null);
    setDrag(payload);
  };

  const dragOver = (e: React.DragEvent, target: DropTarget) => {
    e.preventDefault();
    const id = zoneId(target);
    if (overZone !== id) setOverZone(id);
  };

  const dropEvent = (e: React.DragEvent, target: DropTarget) => {
    e.preventDefault();
    drop(target);
  };

  const isSame = (a: DragPayload | null, b: DragPayload) =>
    !!a &&
    a.kind === b.kind &&
    (a.kind === "person" ? a.personId === (b as typeof a).personId : a.key === (b as typeof a).key);

  const toggleSelect = (payload: DragPayload) =>
    setSelected((current) => (isSame(current, payload) ? null : payload));

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setEdited(previous);
    setHistory((h) => h.slice(0, -1));
    setSelected(null);
    setMessage({ text: "Undid last move", warn: false });
  };

  const discard = () => {
    setEdited(null);
    setHistory([]);
    setSelected(null);
    setMessage(null);
  };

  const saveChanges = () => {
    const count = changeCount;
    save.mutate(changes, {
      onSuccess: () => {
        setEdited(null);
        setHistory([]);
        setMessage({ text: `Saved ${count} ${count === 1 ? "change" : "changes"}`, warn: false });
      },
    });
  };

  return {
    list,
    totals,
    drag,
    selected,
    overZone,
    message,
    changeCount,
    isDirty,
    canUndo: history.length > 0,
    isSaving: save.isPending,
    saveError: save.error,
    isDragging: (payload: DragPayload) => isSame(drag, payload),
    isSelected: (payload: DragPayload) => isSame(selected, payload),
    startDrag,
    endDrag: resetPointer,
    dragOver,
    dropEvent,
    drop,
    toggleSelect,
    clearSelection: () => setSelected(null),
    // No-op edits keep the editor open.
    setHours: (key: string, hours: number) => {
      const change = applyHours(list, key, hours, lookup);
      if (change) commit(change);
    },
    capacityOf: lookup.capacity,
    focusKey,
    undo,
    discard,
    saveChanges,
  };
};

export type AllocationBoardState = ReturnType<typeof useAllocationBoard>;
