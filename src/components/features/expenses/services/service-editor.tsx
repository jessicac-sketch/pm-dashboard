"use client";

import { Check, Merge } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/query-state";
import { Select } from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import { useMergeService, useUpdateService } from "@/hooks/queries/use-expenses";
import { PROJECT_COLOR_CLASSES, projectCode } from "@/lib/project-colors";
import type { ServiceWithProjects } from "@/services/expense-services.service";
import { CategoryPicker } from "../category-picker";
import type { ExpenseView } from "../expense-view";

type ServiceEditorProps = { view: ExpenseView; service: ServiceWithProjects; onClose: () => void };

/** Inline panel under a service row: name, category, projects, and merging duplicates. */
export const ServiceEditor = ({ view, service, onClose }: ServiceEditorProps) => {
  const update = useUpdateService();
  const merge = useMergeService();
  const [name, setName] = useState(service.name);
  const [category, setCategory] = useState(service.category);
  const [projectIds, setProjectIds] = useState(service.project_ids);
  const [mergeTarget, setMergeTarget] = useState("");

  const projectOptions = view.projects.map((p) => {
    const rnd = p.project_type === "rnd";
    const colors = PROJECT_COLOR_CLASSES[p.color];
    return {
      value: p.id,
      label: rnd ? `${p.name} (R&D / POC)` : p.name,
      prefix: projectCode(p),
      className: rnd ? "border border-dashed border-foreground bg-surface text-foreground" : `${colors.bg} ${colors.onColor}`,
    };
  });
  const others = view.services.filter((s) => s.id !== service.id);
  const target = others.find((s) => s.id === mergeTarget);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    update.mutate({ id: service.id, input: { name: name.trim(), category }, projectIds }, { onSuccess: onClose });
  };

  const mergeNow = () => {
    if (!target) return;
    if (window.confirm(`Merge ${service.name} into ${target.name}? Its charges and remarks move to ${target.name}, and ${service.name} is removed.`)) {
      merge.mutate({ sourceId: service.id, targetId: target.id }, { onSuccess: onClose });
    }
  };

  return (
    <form onSubmit={save} className="sticky left-0 flex flex-col gap-4 border-b border-l-4 border-border border-l-primary bg-accent px-4 py-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-64">
          <Input id={`svc-name-${service.id}`} label="Service name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <CategoryPicker id={`svc-cat-${service.id}`} label="Category" value={category} onChange={setCategory} />
      </div>
      <div className="max-w-2xl">
        <TagInput
          id={`svc-projects-${service.id}`}
          label="Used by projects"
          options={projectOptions}
          value={projectIds}
          onChange={setProjectIds}
          placeholder="Leave empty for company-wide tools"
          emptyText="No project matches"
        />
      </div>
      <p className="text-xs text-muted">
        On the statement as <span className="font-mono text-foreground">{service.statement_match ?? service.name}</span>. Next month&apos;s charges with this text land here automatically.
      </p>
      {(update.error || merge.error) && <ErrorMessage error={(update.error ?? merge.error)!} />}
      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-60">
            <Select
              id={`svc-merge-${service.id}`}
              label="Same service as another? Merge into"
              options={[{ value: "", label: "Choose a service" }, ...others.map((s) => ({ value: s.id, label: s.name }))]}
              value={mergeTarget}
              onChange={(e) => setMergeTarget(e.target.value)}
            />
          </div>
          <Button type="button" variant="secondary" icon={Merge} disabled={!target} loading={merge.isPending} onClick={mergeNow}>
            Merge
          </Button>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" icon={Check} loading={update.isPending} disabled={!name.trim()}>
            Save
          </Button>
        </div>
      </div>
    </form>
  );
};
