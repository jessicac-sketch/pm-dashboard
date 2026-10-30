"use client";

import { Check, LayoutGrid, Network, Undo2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { AllocationBoardState } from "@/hooks/use-allocation-board";

export type ResourceView = "board" | "mindmap";

const VIEW_OPTIONS = [
  { value: "board", label: "Board", icon: LayoutGrid },
  { value: "mindmap", label: "Mindmap", icon: Network },
] as const;

const DESCRIPTIONS: Record<ResourceView, string> = {
  board: "Each project is a board and your people are the pieces. Click the hours on a piece to change them. Nothing changes until you save.",
  mindmap: "How people and projects connect. Read-only; make changes on the Board.",
};

type BoardToolbarProps = {
  board: AllocationBoardState;
  view: ResourceView;
  onViewChange: (view: ResourceView) => void;
  onAddPerson: () => void;
};

export const BoardToolbar = ({ board, view, onViewChange, onAddPerson }: BoardToolbarProps) => (
  <PageHeader
    title="Resource allocation"
    description={DESCRIPTIONS[view]}
    actions={
      <div className="flex flex-wrap gap-2">
        <SegmentedControl label="View" options={VIEW_OPTIONS} value={view} onChange={onViewChange} />
        <Button variant="secondary" icon={UserPlus} onClick={onAddPerson}>
          Add person
        </Button>
        {/* Only shown once there's something to undo or throw away. */}
        {board.canUndo && (
          <Button variant="secondary" icon={Undo2} onClick={board.undo} disabled={board.isSaving}>
            Undo
          </Button>
        )}
        {board.isDirty && (
          <Button variant="ghost" onClick={board.discard} disabled={board.isSaving}>
            Discard
          </Button>
        )}
        {board.isDirty && (
          <Button icon={Check} onClick={board.saveChanges} loading={board.isSaving}>
            Save {board.changeCount} {board.changeCount === 1 ? "change" : "changes"}
          </Button>
        )}
      </div>
    }
  />
);
