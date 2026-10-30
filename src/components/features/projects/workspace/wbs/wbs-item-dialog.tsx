"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/query-state";
import { Select } from "@/components/ui/select";
import { useCreateWbsItem, useUpdateWbsItem } from "@/hooks/queries/use-wbs";
import { nextSortOrder } from "@/lib/wbs";
import type { Person, WbsItem, WbsKind } from "@/types/database";

export type WbsDialogMode = { type: "create"; kind: WbsKind; parentId: string | null } | { type: "edit"; item: WbsItem };

type WbsItemDialogProps = {
  projectId: string;
  people: Person[];
  items: WbsItem[];
  mode: WbsDialogMode;
  onClose: () => void;
};

const KIND_OPTIONS = [
  { value: "work_package", label: "Work package" },
  { value: "milestone", label: "Milestone" },
];

export const WbsItemDialog = ({ projectId, people, items, mode, onClose }: WbsItemDialogProps) => {
  const createItem = useCreateWbsItem(projectId);
  const updateItem = useUpdateWbsItem(projectId);
  const item = mode.type === "edit" ? mode.item : undefined;
  const [form, setForm] = useState({
    kind: (item?.kind ?? (mode.type === "create" ? mode.kind : "work_package")) as WbsKind,
    name: item?.name ?? "",
    ownerId: item?.owner_person_id ?? "",
    startDate: item?.start_date ?? "",
    endDate: item?.end_date ?? "",
    estimate: item?.estimate_days?.toString() ?? "",
    progress: String(item?.progress ?? 0),
    jiraKey: item?.jira_key ?? "",
  });
  const set = <K extends keyof typeof form,>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const isPhase = form.kind === "phase";
  const isMilestone = form.kind === "milestone";
  const progress = Number(form.progress);
  const datesValid = !form.startDate || !form.endDate || form.startDate <= form.endDate;
  const valid = form.name.trim() !== "" && datesValid && progress >= 0 && progress <= 100;
  const mutation = item ? updateItem : createItem;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = {
      kind: form.kind,
      name: form.name.trim(),
      owner_person_id: isPhase ? null : form.ownerId || null,
      start_date: isPhase ? null : form.startDate || null,
      // A milestone is a single date.
      end_date: isPhase ? null : isMilestone ? form.startDate || null : form.endDate || null,
      estimate_days: isPhase || isMilestone || form.estimate === "" ? null : Number(form.estimate),
      progress: isPhase ? 0 : progress,
      jira_key: isPhase ? null : form.jiraKey.trim().toUpperCase() || null,
    };
    if (item) {
      updateItem.mutate({ id: item.id, input }, { onSuccess: onClose });
    } else if (mode.type === "create") {
      createItem.mutate(
        { ...input, project_id: projectId, parent_id: mode.parentId, sort_order: nextSortOrder(items, mode.parentId) },
        { onSuccess: onClose },
      );
    }
  };

  const title = item ? `Edit ${item.name}` : isPhase ? "New phase" : "New item";

  return (
    <Dialog open onClose={onClose} title={title} description={isPhase ? "Phases group work packages, e.g. Discovery, Build, Launch." : undefined}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isPhase && !item && (
          <Select id="wbs-kind" label="Type" options={KIND_OPTIONS} value={form.kind} onChange={(e) => set("kind", e.target.value as WbsKind)} />
        )}
        <Input id="wbs-name" label="Name" value={form.name} onChange={(e) => set("name", e.target.value)} required autoFocus />

        {!isPhase && (
          <>
            <Select
              id="wbs-owner"
              label="Owner"
              options={[{ value: "", label: "Unassigned" }, ...people.map((p) => ({ value: p.id, label: p.full_name }))]}
              value={form.ownerId}
              onChange={(e) => set("ownerId", e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input id="wbs-start" label={isMilestone ? "Date" : "Start"} type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
              {!isMilestone && (
                <Input id="wbs-end" label="Finish" type="date" min={form.startDate || undefined} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
              )}
            </div>
            {!datesValid && <ErrorMessage error={new Error("Finish can't be before start.")} />}
            <div className="grid grid-cols-3 gap-3">
              {!isMilestone && (
                <Input id="wbs-estimate" label="Est. days" type="number" min={0} step={0.5} value={form.estimate} onChange={(e) => set("estimate", e.target.value)} />
              )}
              <Input id="wbs-progress" label={isMilestone ? "Done (0 or 100)" : "Progress %"} type="number" min={0} max={100} step={isMilestone ? 100 : 5} value={form.progress} onChange={(e) => set("progress", e.target.value)} />
              <Input id="wbs-jira" label="Jira epic" placeholder="e.g. PA-12" value={form.jiraKey} onChange={(e) => set("jiraKey", e.target.value)} className="uppercase" />
            </div>
            <p className="text-xs text-muted">Until Jira is connected, enter progress by hand. Once it is, progress will come from the linked epic.</p>
          </>
        )}

        {mutation.error && <ErrorMessage error={mutation.error} />}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" icon={Check} loading={mutation.isPending} disabled={!valid}>
            {item ? "Save" : "Add"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
