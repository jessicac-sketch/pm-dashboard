"use client";

import { AlertTriangle } from "lucide-react";
import { ErrorMessage } from "@/components/ui/query-state";
import { Select } from "@/components/ui/select";
import { useUpdatePerson } from "@/hooks/queries/use-people";
import { formatHours } from "@/lib/allocation-board";
import { getInitials } from "@/lib/format";
import type { PersonRow, SprintTiming } from "@/lib/jira/sprint-summary";
import type { Person } from "@/types/database";

type SprintPeopleProps = {
  rows: PersonRow[];
  people: Person[];
  timing: SprintTiming;
};

/** Hours of their allocation still ahead in the sprint, or null when they aren't allocated. */
const hoursAhead = (row: PersonRow, timing: SprintTiming) =>
  row.allocated === null ? null : Math.round(row.allocated * (1 - (timing.elapsed ?? 0)) * 10) / 10;

const LinkPerson = ({ row, people }: { row: PersonRow; people: Person[] }) => {
  const updatePerson = useUpdatePerson();
  const free = people.filter((p) => !p.jira_account_id);
  return (
    <div className="mt-1 flex flex-col gap-1">
      <Select
        id={`link-${row.id}`}
        label={`Which person is ${row.assignee!.displayName}?`}
        hideLabel
        options={[{ value: "", label: "Link to a person" }, ...free.map((p) => ({ value: p.id, label: p.full_name }))]}
        value=""
        disabled={updatePerson.isPending}
        onChange={(e) => e.target.value && updatePerson.mutate({ id: e.target.value, input: { jira_account_id: row.assignee!.accountId } })}
        className="h-8 text-xs"
      />
      {updatePerson.error && <ErrorMessage error={updatePerson.error} />}
    </div>
  );
};

export const SprintPeople = ({ rows, people, timing }: SprintPeopleProps) => (
  <section className="border border-border bg-surface">
    <div className="border-b border-border px-4 py-3">
      <h3 className="text-[15px] font-extrabold">By developer</h3>
      <p className="text-xs text-muted">
        Jira hours next to the hours each person is allocated to this project on the Resources board. &quot;Left&quot; uses the remaining
        estimate, or the original estimate when none is set.
      </p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-180 text-sm">
        <thead>
          <tr className="border-b border-border bg-background text-left text-xs text-muted">
            <th scope="col" className="px-4 py-2 font-bold">Person</th>
            <th scope="col" className="px-3 py-2 text-right font-bold">Done</th>
            <th scope="col" className="px-3 py-2 text-right font-bold">Estimated</th>
            <th scope="col" className="px-3 py-2 text-right font-bold">Logged</th>
            <th scope="col" className="px-3 py-2 text-right font-bold">Left</th>
            <th scope="col" className="px-3 py-2 text-right font-bold">Allocated</th>
            <th scope="col" className="px-4 py-2 font-bold">Fits the time left?</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const ahead = hoursAhead(row, timing);
            const over = ahead !== null && row.remaining > ahead;
            const name = row.person?.full_name ?? row.assignee?.displayName ?? "Unassigned";
            return (
              <tr key={row.id} className="border-b border-border align-top last:border-b-0">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span aria-hidden className="flex size-8 shrink-0 items-center justify-center bg-ink text-[11px] font-black text-primary-foreground">
                      {row.assignee ? getInitials(name) : "-"}
                    </span>
                    <div className="min-w-0">
                      <b className="block truncate">{name}</b>
                      {row.assignee && !row.person && <span className="text-xs text-muted">Not linked to anyone on Resources</span>}
                    </div>
                  </div>
                  {row.assignee && !row.person && <LinkPerson row={row} people={people} />}
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  <b>{row.done}</b> / {row.issues}
                </td>
                <td className="px-3 py-2.5 text-right">{formatHours(row.estimate)}</td>
                <td className="px-3 py-2.5 text-right">{formatHours(row.logged)}</td>
                <td className="px-3 py-2.5 text-right font-bold">{formatHours(row.remaining)}</td>
                <td className="px-3 py-2.5 text-right">{row.allocated === null ? <span className="text-muted">-</span> : formatHours(row.allocated)}</td>
                <td className="px-4 py-2.5">
                  {!row.assignee ? (
                    <span className="text-muted">Needs an owner</span>
                  ) : ahead === null ? (
                    <span className="text-muted">Not allocated to this project</span>
                  ) : over ? (
                    <span className="flex items-center gap-1.5 font-bold text-warning">
                      <AlertTriangle className="size-4 shrink-0" aria-hidden />
                      {formatHours(row.remaining - ahead)} more than their {formatHours(ahead)} left
                    </span>
                  ) : (
                    <span className="text-success">Yes, {formatHours(ahead)} of allocation left</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </section>
);
