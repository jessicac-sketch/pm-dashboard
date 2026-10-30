"use client";

import { Check, FolderPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/query-state";
import { Select } from "@/components/ui/select";
import { useCreateProject } from "@/hooks/queries/use-projects";
import { PROJECT_COLOR_CLASSES, projectCode } from "@/lib/project-colors";
import type { ProjectColor, ProjectStatus, ProjectType } from "@/types/database";

const COLORS = Object.keys(PROJECT_COLOR_CLASSES) as ProjectColor[];
const TYPE_OPTIONS = [
  { value: "product", label: "Product" },
  { value: "rnd", label: "R&D / POC" },
];

const STATUS_OPTIONS = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
];

const EMPTY_FORM = {
  name: "",
  code: "",
  codeEdited: false,
  color: "magenta" as ProjectColor,
  status: "planning" as ProjectStatus,
  projectType: "product" as ProjectType,
  startDate: "",
  dueDate: "",
  requiredFte: "",
  description: "",
};

export const ProjectCreateDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const createProject = useCreateProject();
  const [form, setForm] = useState(EMPTY_FORM);

  const close = () => {
    setForm(EMPTY_FORM);
    createProject.reset();
    onClose();
  };

  // The code follows the name until someone types their own.
  const handleNameChange = (name: string) =>
    setForm((f) => ({ ...f, name, code: f.codeEdited ? f.code : projectCode({ code: null, name }).slice(0, 5) }));

  const fte = form.requiredFte === "" ? null : Number(form.requiredFte);
  const fteValid = fte === null || (Number.isFinite(fte) && fte > 0 && fte < 100);
  const datesValid = !form.startDate || !form.dueDate || form.startDate <= form.dueDate;
  const valid = form.name.trim() !== "" && fteValid && datesValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    createProject.mutate(
      {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase() || null,
        color: form.color,
        status: form.status,
        project_type: form.projectType,
        start_date: form.startDate || null,
        due_date: form.dueDate || null,
        required_fte: fte,
        description: form.description.trim() || null,
      },
      { onSuccess: close },
    );
  };

  return (
    <Dialog open={open} onClose={close} title="New project" description="Add a project to your portfolio.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-[1fr_7rem] gap-3">
          <Input
            id="project-name"
            label="Project name"
            placeholder="e.g. Partner Portal"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            autoFocus
          />
          <Input
            id="project-code"
            label="Code"
            maxLength={5}
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase(), codeEdited: true }))}
            className="font-bold uppercase"
          />
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-semibold">Color</legend>
          <div className="flex gap-2.5">
            {COLORS.map((color) => {
              const selected = form.color === color;
              const classes = PROJECT_COLOR_CLASSES[color];
              return (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={color}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  className={`flex size-9 items-center justify-center ${classes.bg} ${classes.onColor} ${
                    selected ? "outline-2 outline-offset-2 outline-ink" : ""
                  }`}
                >
                  {selected && <Check className="size-4" aria-hidden />}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid grid-cols-3 gap-3">
          <Select
            id="project-type"
            label="Type"
            options={TYPE_OPTIONS}
            value={form.projectType}
            onChange={(e) => setForm((f) => ({ ...f, projectType: e.target.value as ProjectType }))}
          />
          <Select
            id="project-status"
            label="Status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}
          />
          <Input
            id="project-fte"
            label="Team size needed (FTE)"
            type="number"
            min={0.25}
            step={0.25}
            placeholder="e.g. 2.5"
            value={form.requiredFte}
            onChange={(e) => setForm((f) => ({ ...f, requiredFte: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="project-start"
            label="Start date"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
          />
          <Input
            id="project-due"
            label="Due date"
            type="date"
            min={form.startDate || undefined}
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
          />
        </div>
        {!datesValid && <ErrorMessage error={new Error("Due date can't be before the start date.")} />}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="project-description" className="text-sm font-semibold">
            Description (optional)
          </label>
          <textarea
            id="project-description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="resize-y border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary focus:outline-1 focus:outline-primary"
          />
        </div>

        {createProject.error && <ErrorMessage error={createProject.error} />}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" icon={FolderPlus} loading={createProject.isPending} disabled={!valid}>
            Create project
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
