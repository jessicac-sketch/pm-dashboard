"use client";

import { Pencil, Plus } from "lucide-react";
import type { AllocationBoardState } from "@/hooks/use-allocation-board";
import { formatHours, type DragPayload } from "@/lib/allocation-board";
import { getInitials } from "@/lib/format";
import { ROLE_LABELS, STACK_LABELS } from "@/lib/people";
import type { Person } from "@/types/database";

type BenchRowProps = {
  person: Person;
  total: number;
  board: AllocationBoardState;
  onEdit: (person: Person) => void;
};

export const BenchRow = ({ person, total, board, onEdit }: BenchRowProps) => {
  const payload: DragPayload = { kind: "person", personId: person.id };
  const selected = board.isSelected(payload);
  const capacity = person.sprint_capacity_hours;
  const over = total > capacity;
  const free = capacity - total;
  // Bar runs to 120% of capacity so overload is visible; the marker sits at 100%.
  const barWidth = (Math.min(total / capacity, 1.2) / 1.2) * 100;

  return (
    <div
      draggable
      onDragStart={(e) => board.startDrag(e, payload)}
      onDragEnd={board.endDrag}
      className={`flex cursor-grab items-center gap-3 border-b border-border px-3 py-2.5 active:cursor-grabbing ${
        selected ? "bg-accent outline-2 -outline-offset-2 outline-primary" : "bg-surface"
      } ${board.isDragging(payload) ? "opacity-30" : ""}`}
    >
      <span
        className={`flex size-11 shrink-0 items-center justify-center bg-ink text-sm font-black text-primary-foreground ${
          over ? "outline-2 -outline-offset-2 outline-danger" : ""
        }`}
        aria-hidden
      >
        {getInitials(person.full_name)}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <b className="truncate text-sm">{person.full_name}</b>
          <b className={`shrink-0 text-xs whitespace-nowrap ${over ? "text-danger" : total <= capacity / 2 ? "text-success" : "text-foreground"}`}>
            {formatHours(total)} / {formatHours(capacity)}
          </b>
        </div>
        <div className="relative h-1.5 bg-secondary">
          <div className={`h-1.5 ${over ? "bg-danger" : "bg-primary"}`} style={{ width: `${barWidth}%` }} />
          <div className="absolute -top-1 left-[83.33%] h-3.5 w-0.5 bg-foreground" aria-hidden />
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted">
          <span className="min-w-0 truncate">
            {ROLE_LABELS[person.role]}
            {person.stack && ` · ${STACK_LABELS[person.stack]}`}
          </span>
          <span className={`ml-auto shrink-0 whitespace-nowrap ${over ? "font-bold text-danger" : ""}`}>
            {over ? `${formatHours(-free)} over` : `${formatHours(free)} free`} this sprint
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onEdit(person)}
        aria-label={`Edit ${person.full_name}`}
        title="Edit person"
        className="flex size-9 shrink-0 items-center justify-center text-muted hover:bg-accent hover:text-foreground"
      >
        <Pencil className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => board.toggleSelect(payload)}
        aria-pressed={selected}
        aria-label={`Pick up ${person.full_name} to place on a project`}
        className="flex size-9 shrink-0 items-center justify-center border border-border text-primary hover:bg-accent"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
};
