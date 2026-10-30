"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Empty, ErrorMessage } from "@/components/ui/query-state";
import { useAllocationBoard } from "@/hooks/use-allocation-board";
import type { DraftAllocation } from "@/lib/allocation-board";
import { shortNames } from "@/lib/people";
import type { Allocation, Person, Project } from "@/types/database";
import { AllocationMindmap } from "./allocation-mindmap";
import { Bench } from "./bench";
import { BoardToolbar, type ResourceView } from "./board-toolbar";
import { PersonDialog } from "./person-dialog";
import { ProjectRoom } from "./project-room";

type AllocationBoardViewProps = {
  people: Person[];
  projects: Project[];
  allocations: Allocation[];
};

export const AllocationBoardView = ({ people, projects, allocations }: AllocationBoardViewProps) => {
  const board = useAllocationBoard({ server: allocations, people, projects });
  const [addingPerson, setAddingPerson] = useState(false);
  // Board is the default; the mindmap reads the same draft so unsaved moves show in both.
  const [view, setView] = useState<ResourceView>("board");

  const personById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const nameById = useMemo(() => shortNames(people), [people]);

  const piecesByProject = useMemo(() => {
    const grouped = new Map<string, DraftAllocation[]>();
    for (const a of board.list) {
      if (!personById.has(a.personId)) continue; // inactive people stay in the data, off the board
      grouped.set(a.projectId, [...(grouped.get(a.projectId) ?? []), a]);
    }
    return grouped;
  }, [board.list, personById]);

  const { message } = board;

  return (
    <div className="flex flex-col gap-4">
      <BoardToolbar
        board={board}
        view={view}
        onViewChange={setView}
        onAddPerson={() => setAddingPerson(true)}
      />
      {board.saveError && <ErrorMessage error={board.saveError} />}

      {view === "mindmap" ? (
        <AllocationMindmap list={board.list} people={people} projects={projects} totals={board.totals} />
      ) : (
        <div className="flex flex-wrap items-start gap-4">
          <Bench totals={board.totals} board={board} />
          <div className="grid min-w-0 flex-[999_1_640px] grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {projects.length === 0 ? (
              <Empty message="No open projects yet. Create one on the Projects page." />
            ) : (
              projects.map((project) => (
                <ProjectRoom
                  key={project.id}
                  project={project}
                  pieces={piecesByProject.get(project.id) ?? []}
                  personById={personById}
                  nameById={nameById}
                  totals={board.totals}
                  board={board}
                />
              ))
            )}
          </div>
        </div>
      )}

      {addingPerson && <PersonDialog open onClose={() => setAddingPerson(false)} />}
    </div>
  );
};
