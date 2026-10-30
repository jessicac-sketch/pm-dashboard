"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import type { AllocationBoardState } from "@/hooks/use-allocation-board";
import { useFitText } from "@/hooks/use-fit-text";
import { formatHours, type DraftAllocation, type DragPayload } from "@/lib/allocation-board";
import type { PROJECT_COLOR_CLASSES } from "@/lib/project-colors";
import { STACK_LABELS } from "@/lib/people";
import type { Person } from "@/types/database";
import { PieceHoursInput } from "./piece-hours-input";

type BoardPieceProps = {
  allocation: DraftAllocation;
  person: Person;
  /** First name, or first name + last initial when two people share it. */
  displayName: string;
  projectName: string;
  colors: (typeof PROJECT_COLOR_CLASSES)[keyof typeof PROJECT_COLOR_CLASSES];
  overCapacity: boolean;
  board: AllocationBoardState;
};

export const BoardPiece = ({
  allocation,
  person,
  displayName,
  projectName,
  colors,
  overCapacity,
  board,
}: BoardPieceProps) => {
  const payload: DragPayload = { kind: "piece", key: allocation.key };
  // Largest font (15px down to 8px) at which the name fits the piece on one line.
  const nameRef = useFitText<HTMLSpanElement>(displayName);
  const selected = board.isSelected(payload);
  // No dragging while the hours field is focused, so selecting text in it works.
  const [editingHours, setEditingHours] = useState(false);

  const outline = selected
    ? "outline-2 outline-offset-2 outline-brand-orange"
    : overCapacity
      ? "outline-2 -outline-offset-2 outline-danger"
      : "";

  return (
    <div
      draggable={!editingHours}
      onDragStart={(e) => {
        e.stopPropagation();
        board.startDrag(e, payload);
      }}
      onDragEnd={board.endDrag}
      title={`${person.full_name}${person.stack ? ` (${STACK_LABELS[person.stack]})` : ""} · ${formatHours(allocation.hours)} on ${projectName}`}
      className={`@container relative flex size-[82%] cursor-grab flex-col bg-ink text-primary-foreground shadow-lg shadow-ink/30 active:cursor-grabbing ${outline} ${
        board.isDragging(payload) ? "opacity-30" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => board.toggleSelect(payload)}
        aria-pressed={selected}
        aria-label={`${person.full_name}${person.stack ? `, ${STACK_LABELS[person.stack]}` : ""}, ${formatHours(allocation.hours)} on ${projectName}. Select to move.`}
        className="flex flex-1 flex-col items-center justify-center gap-0.5"
      >
        <span ref={nameRef} className="w-full overflow-hidden px-1 text-center leading-tight font-black whitespace-nowrap">
          {displayName}
        </span>
        {person.stack && (
          <span className="text-[clamp(6px,12cqw,9px)] leading-none font-extrabold tracking-wider text-primary-foreground/70 uppercase">
            {STACK_LABELS[person.stack]}
          </span>
        )}
      </button>
      <PieceHoursInput
        key={allocation.hours}
        hours={allocation.hours}
        colorClass={`${colors.bg} ${colors.onColor}`}
        label={`Hours this sprint for ${person.full_name} on ${projectName}`}
        autoFocus={board.focusKey === allocation.key}
        onCommit={(hours) => board.setHours(allocation.key, hours)}
        onEditingChange={setEditingHours}
      />
      {overCapacity && (
        <span
          role="img"
          aria-label="Over capacity"
          className="absolute -top-2 -right-2 flex size-5 items-center justify-center bg-danger text-primary-foreground"
        >
          <AlertTriangle className="size-3" aria-hidden />
        </span>
      )}
    </div>
  );
};
