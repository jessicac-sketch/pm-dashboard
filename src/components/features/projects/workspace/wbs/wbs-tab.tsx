"use client";

import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Empty, ErrorMessage } from "@/components/ui/query-state";
import { useDeleteWbsItem } from "@/hooks/queries/use-wbs";
import { formatDate } from "@/lib/format";
import type { WbsRow, WbsSummary } from "@/lib/wbs";
import type { Person, Project, WbsItem } from "@/types/database";
import { WbsItemDialog, type WbsDialogMode } from "./wbs-item-dialog";

const COLUMNS = "grid-cols-[64px_minmax(260px,3fr)_150px_76px_96px_96px_80px_160px_112px]";

type WbsTabProps = { project: Project; people: Person[]; items: WbsItem[]; wbs: WbsSummary };

export const WbsTab = ({ project, people, items, wbs }: WbsTabProps) => {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<{ key: number; mode: WbsDialogMode } | null>(null);
  const deleteItem = useDeleteWbsItem(project.id);
  const personName = (id: string | null) => people.find((p) => p.id === id)?.full_name ?? "Unassigned";

  const open = (mode: WbsDialogMode) => setDialog({ key: Date.now(), mode });
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const remove = (row: WbsRow) => {
    const extra = row.isPhase && row.childCount ? ` and its ${row.childCount} item${row.childCount === 1 ? "" : "s"}` : "";
    if (window.confirm(`Delete "${row.item.name}"${extra}? Risks linked to it will become project-wide.`)) deleteItem.mutate(row.item.id);
  };

  const visible = wbs.rows.filter((r) => r.isPhase || !collapsed.has(r.item.parent_id ?? ""));

  return (
    <section className="border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border px-4 py-3.5">
        <div>
          <h2 className="text-base font-extrabold">Work breakdown structure</h2>
          <p className="text-xs text-muted">Phases → work packages and milestones. Dates feed the Gantt chart.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {wbs.rows.length > 0 && (
            <>
              <Button variant="ghost" onClick={() => setCollapsed(new Set())}>
                Expand all
              </Button>
              <Button variant="ghost" onClick={() => setCollapsed(new Set(wbs.rows.filter((r) => r.isPhase).map((r) => r.item.id)))}>
                Collapse all
              </Button>
            </>
          )}
          <Button icon={Plus} onClick={() => open({ type: "create", kind: "phase", parentId: null })}>
            Add phase
          </Button>
        </div>
      </div>
      {deleteItem.error && <div className="px-4 pt-3"><ErrorMessage error={deleteItem.error} /></div>}

      {wbs.rows.length === 0 ? (
        <div className="p-4">
          <Empty message="No WBS yet. Start with a phase, such as Discovery or Build, then add work packages to it." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-280 text-sm">
            <div className={`grid ${COLUMNS} border-b border-border text-xs font-extrabold text-muted [&>div]:px-3 [&>div]:py-2.5`}>
              <div>WBS</div>
              <div>Name</div>
              <div>Owner</div>
              <div className="text-right">Est. days</div>
              <div>Start</div>
              <div>Finish</div>
              <div>Jira</div>
              <div>Progress</div>
              <div />
            </div>
            {visible.map((row) => {
              const { item } = row;
              const isCollapsed = collapsed.has(item.id);
              const isMilestone = item.kind === "milestone";
              return (
                <div key={item.id} className={`grid ${COLUMNS} items-center border-b border-border [&>div]:px-3 [&>div]:py-2 ${row.isPhase ? "bg-background" : ""}`}>
                  <div className="font-black text-muted">{row.code}</div>
                  <div className={`flex min-w-0 items-center gap-1.5 ${row.isPhase ? "" : "pl-8"}`}>
                    {row.isPhase && (
                      <button type="button" onClick={() => toggle(item.id)} aria-expanded={!isCollapsed} aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${item.name}`} className="flex size-6 items-center justify-center hover:bg-accent">
                        {isCollapsed ? <ChevronRight className="size-4" aria-hidden /> : <ChevronDown className="size-4" aria-hidden />}
                      </button>
                    )}
                    {isMilestone && <span className="mx-1.5 size-2.5 shrink-0 rotate-45 bg-ink" aria-label="Milestone" role="img" />}
                    <span className={`truncate ${row.isPhase ? "font-extrabold" : "font-semibold"}`}>{item.name}</span>
                    {row.late && <span className="shrink-0 bg-danger/10 px-1.5 text-[11px] font-extrabold text-danger">Late</span>}
                  </div>
                  <div className="truncate">{row.isPhase ? "" : personName(item.owner_person_id)}</div>
                  <div className="text-right">{isMilestone ? "" : row.estimate || "-"}</div>
                  <div className="whitespace-nowrap">{row.start ? formatDate(row.start) : "-"}</div>
                  <div className="whitespace-nowrap">{isMilestone ? "" : row.end ? formatDate(row.end) : "-"}</div>
                  <div className="font-extrabold text-project-blue">{item.jira_key ?? (row.isPhase ? "" : "-")}</div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-border">
                      <div className={`h-1.5 ${row.progress === 100 ? "bg-success" : "bg-project-blue"}`} style={{ width: `${row.progress}%` }} />
                    </div>
                    <b className="w-9 text-right text-xs">{row.progress}%</b>
                  </div>
                  <div className="flex justify-end gap-0.5">
                    {row.isPhase && (
                      <button type="button" onClick={() => open({ type: "create", kind: "work_package", parentId: item.id })} aria-label={`Add item to ${item.name}`} className="flex size-8 items-center justify-center text-primary hover:bg-accent">
                        <Plus className="size-4" aria-hidden />
                      </button>
                    )}
                    <button type="button" onClick={() => open({ type: "edit", item })} aria-label={`Edit ${item.name}`} className="flex size-8 items-center justify-center text-muted hover:bg-accent hover:text-foreground">
                      <Pencil className="size-4" aria-hidden />
                    </button>
                    <button type="button" onClick={() => remove(row)} aria-label={`Delete ${item.name}`} className="flex size-8 items-center justify-center text-muted hover:bg-danger/10 hover:text-danger">
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {dialog && (
        <WbsItemDialog key={dialog.key} projectId={project.id} people={people} items={items} mode={dialog.mode} onClose={() => setDialog(null)} />
      )}
    </section>
  );
};
