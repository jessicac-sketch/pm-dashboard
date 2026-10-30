"use client";

import { useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { Empty, ErrorMessage, Loading } from "@/components/ui/query-state";
import { Select } from "@/components/ui/select";
import { usePeoplePage } from "@/hooks/queries/use-people";
import type { AllocationBoardState } from "@/hooks/use-allocation-board";
import type { DropTarget } from "@/lib/allocation-board";
import { EMPLOYMENT_OPTIONS, ROLE_OPTIONS } from "@/lib/people";
import type { EmploymentType, Person, PersonRole } from "@/types/database";
import { BenchRow } from "./bench-row";
import { PersonDialog } from "./person-dialog";

const BENCH: DropTarget = { kind: "bench" };
const PAGE_SIZE = 5;
const ROLE_FILTERS = [{ value: "all", label: "All roles" }, ...ROLE_OPTIONS];
const TYPE_FILTERS = [{ value: "all", label: "All types" }, ...EMPLOYMENT_OPTIONS];

type BenchProps = {
  totals: Map<string, number>;
  board: AllocationBoardState;
};

// The list is paged by the database (5 at a time, filters applied there too);
// drag and drop still works for whoever is on the current page.
export const Bench = ({ totals, board }: BenchProps) => {
  const [role, setRole] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Person | null>(null);
  const people = usePeoplePage({
    page,
    pageSize: PAGE_SIZE,
    role: role === "all" ? null : (role as PersonRole),
    employmentType: type === "all" ? null : (type as EmploymentType),
  });
  const filtered = role !== "all" || type !== "all";

  // A new filter starts again at page 1.
  const changeFilter = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    set(e.target.value);
    setPage(1);
  };

  return (
    <aside
      aria-label="Bench"
      onDragOver={(e) => board.dragOver(e, BENCH)}
      onDrop={(e) => board.dropEvent(e, BENCH)}
      className={`flex flex-[1_1_280px] flex-col border border-border md:max-w-sm ${
        board.overZone === "bench" ? "bg-accent outline-2 -outline-offset-4 outline-dashed outline-primary" : "bg-surface"
      }`}
    >
      <div className="flex flex-col gap-3 border-b border-border p-3">
        <div>
          <h2 className="text-base font-bold">Bench</h2>
          <p className="text-xs text-muted">Drag someone onto a project. Drop a piece here to take it off the board.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select id="bench-role" label="Filter by role" hideLabel options={ROLE_FILTERS} value={role} onChange={changeFilter(setRole)} />
          <Select
            id="bench-type"
            label="Filter by employment type"
            hideLabel
            options={TYPE_FILTERS}
            value={type}
            onChange={changeFilter(setType)}
          />
        </div>
      </div>

      {people.isPending ? (
        <Loading />
      ) : people.isError ? (
        <div className="p-3">
          <ErrorMessage error={people.error} />
        </div>
      ) : people.data.rows.length === 0 ? (
        <div className="p-3">
          <Empty message={filtered ? "No one matches these filters." : "No people yet. Add your team to start."} />
        </div>
      ) : (
        <>
          <div className={people.isPlaceholderData ? "opacity-60" : ""}>
            {people.data.rows.map((person) => (
              <BenchRow key={person.id} person={person} total={totals.get(person.id) ?? 0} board={board} onEdit={setEditing} />
            ))}
          </div>
          <div className="border-t border-border p-3">
            <Pagination
              label="Bench"
              page={page}
              pageSize={PAGE_SIZE}
              total={people.data.total}
              onPageChange={setPage}
              busy={people.isFetching}
            />
          </div>
        </>
      )}
      {editing && <PersonDialog key={editing.id} open person={editing} onClose={() => setEditing(null)} />}
    </aside>
  );
};
