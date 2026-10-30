"use client";

import { Plus } from "lucide-react";
import type { AllocationBoardState } from "@/hooks/use-allocation-board";
import { formatHours, fteFor, type DraftAllocation, type DropTarget } from "@/lib/allocation-board";
import { formatEnum } from "@/lib/format";
import { PROJECT_COLOR_CLASSES, projectCode } from "@/lib/project-colors";
import type { Person, Project } from "@/types/database";
import { BoardPiece } from "./board-piece";

const COLUMNS = 4;

type ProjectRoomProps = {
  project: Project;
  pieces: DraftAllocation[];
  personById: Map<string, Person>;
  nameById: Map<string, string>;
  totals: Map<string, number>;
  board: AllocationBoardState;
};

export const ProjectRoom = ({ project, pieces, personById, nameById, totals, board }: ProjectRoomProps) => {
  const target: DropTarget = { kind: "project", projectId: project.id };
  const colors = PROJECT_COLOR_CLASSES[project.color];

  const fte = fteFor(pieces);
  const required = project.required_fte;
  const short = required !== null && fte < required;
  const coverageColor = required === null ? "text-muted" : short ? "text-warning" : "text-success";

  // Always leave at least one empty square to drop on; fill whole rows.
  const squareCount = Math.max(COLUMNS * 2, Math.ceil((pieces.length + 1) / COLUMNS) * COLUMNS);

  return (
    <section
      aria-label={project.name}
      onDragOver={(e) => board.dragOver(e, target)}
      onDrop={(e) => board.dropEvent(e, target)}
      className={`flex flex-col border border-border bg-surface ${
        board.overZone === project.id ? "outline-2 -outline-offset-1 outline-primary" : ""
      }`}
    >
      <div className={`h-1.5 ${colors.bg}`} />
      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className={`text-[11px] font-black tracking-widest ${colors.text}`}>
              {projectCode(project)}
            </span>
            <h2 className="truncate text-base font-bold">{project.name}</h2>
          </div>
          <span className="shrink-0 bg-background px-2 py-0.5 text-xs font-bold text-muted">
            {formatEnum(project.status)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted">
            {pieces.length} {pieces.length === 1 ? "person" : "people"} · {formatHours(pieces.reduce((sum, a) => sum + a.hours, 0))}
          </span>
          <b className={coverageColor}>
            {fte.toFixed(2)}
            {required !== null && ` / ${required}`} FTE
          </b>
        </div>
        {required !== null && (
          <div className="h-1.5 bg-background">
            <div
              className={`h-1.5 ${short ? "bg-warning" : "bg-success"}`}
              style={{ width: `${Math.min(fte / required, 1) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 border-t border-border">
        {Array.from({ length: squareCount }, (_, i) => {
          const piece = pieces[i];
          const dark = (Math.floor(i / COLUMNS) + (i % COLUMNS)) % 2 === 1;
          const person = piece ? personById.get(piece.personId) : undefined;
          return (
            <div
              key={piece?.key ?? `empty-${i}`}
              className={`flex aspect-square items-center justify-center ${dark ? "bg-board-dark" : "bg-surface"}`}
            >
              {piece && person ? (
                <BoardPiece
                  allocation={piece}
                  person={person}
                  displayName={nameById.get(person.id) ?? person.full_name}
                  projectName={project.name}
                  colors={colors}
                  overCapacity={(totals.get(piece.personId) ?? 0) > person.sprint_capacity_hours}
                  board={board}
                />
              ) : board.selected ? (
                <button
                  type="button"
                  onClick={() => board.drop(target)}
                  aria-label={`Place here on ${project.name}`}
                  className="flex size-[82%] items-center justify-center border-2 border-dashed border-primary/40 text-primary hover:bg-accent"
                >
                  <Plus className="size-5" aria-hidden />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
};
