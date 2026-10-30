"use client";

import { useMemo, useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { formatHours, type DraftAllocation } from "@/lib/allocation-board";
import { getInitials } from "@/lib/format";
import { shortNames } from "@/lib/people";
import { computeMindmapLayout, lineStyle, MINDMAP_SIZE, type Point } from "@/lib/mindmap-layout";
import { PROJECT_COLOR_CLASSES, projectCode } from "@/lib/project-colors";
import type { Person, Project } from "@/types/database";
import { MindmapDetails, type MindmapFocus } from "./mindmap-details";

type GroupBy = "project" | "person";

const GROUP_OPTIONS = [
  { value: "project", label: "By project" },
  { value: "person", label: "By person" },
] as const;

const BRANCH = { w: 170, h: 64 };
const LEAF = { w: 140, h: 44 };
const HUB = 120;

type AllocationMindmapProps = {
  list: DraftAllocation[];
  people: Person[];
  projects: Project[];
  totals: Map<string, number>;
};

const place = (p: Point, size: { w: number; h: number }) => ({ left: p.x - size.w / 2, top: p.y - size.h / 2, width: size.w, height: size.h });

// Read-only view of the same allocations the board edits.
export const AllocationMindmap = ({ list, people, projects, totals }: AllocationMindmapProps) => {
  const [groupBy, setGroupBy] = useState<GroupBy>("project");
  const [focus, setFocus] = useState<MindmapFocus>(null);

  const personById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const nameById = useMemo(() => shortNames(people), [people]);
  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const visible = useMemo(
    () => list.filter((a) => personById.has(a.personId) && projectById.has(a.projectId)),
    [list, personById, projectById],
  );

  const byProject = groupBy === "project";
  const branchIds = byProject ? projects.map((p) => p.id) : people.map((p) => p.id);
  const branchOf = (a: DraftAllocation) => (byProject ? a.projectId : a.personId);
  const layout = computeMindmapLayout(
    branchIds.map((id) => ({ id, leafIds: visible.filter((a) => branchOf(a) === id).map((a) => a.key) })),
  );

  // Everything linked to the focused person or project stays lit; the rest fades.
  const linkLit = (a: DraftAllocation) =>
    !focus || (focus.kind === "person" ? a.personId === focus.id : a.projectId === focus.id);
  const branchLit = (id: string) =>
    !focus || (focus.kind === (byProject ? "project" : "person") && focus.id === id) || visible.some((a) => branchOf(a) === id && linkLit(a));
  const dim = (lit: boolean) => (lit ? "" : "opacity-15");
  const ring = (active: boolean) => (active ? "outline-3 outline-offset-3 outline-brand-orange" : "");
  const select = (next: MindmapFocus) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setFocus(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Click any node to trace its links. Thicker line = more hours this sprint.</p>
        <SegmentedControl
          label="Group by"
          options={GROUP_OPTIONS}
          value={groupBy}
          onChange={(v) => {
            setGroupBy(v);
            setFocus(null);
          }}
        />
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <section aria-label="Mindmap" className="min-w-0 flex-[999_1_700px] overflow-auto border border-border bg-surface">
          <div
            onClick={() => setFocus(null)}
            className="relative bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-[size:22px_22px]"
            style={{ width: MINDMAP_SIZE.width, height: MINDMAP_SIZE.height }}
          >
            {branchIds.map((id) => {
              const p = layout.branches.get(id);
              const color = byProject ? PROJECT_COLOR_CLASSES[projectById.get(id)!.color].bg : "bg-ink";
              return p ? (
                <div key={`hub-${id}`} aria-hidden className={`absolute origin-left ${color} ${dim(branchLit(id))}`} style={lineStyle(layout.center, p, 3)} />
              ) : null;
            })}
            {visible.map((a) => {
              const from = layout.branches.get(branchOf(a));
              const to = layout.leaves.get(a.key);
              const color = PROJECT_COLOR_CLASSES[projectById.get(a.projectId)!.color].bg;
              return from && to ? (
                <div
                  key={`line-${a.key}`}
                  aria-hidden
                  className={`absolute origin-left ${color} ${dim(linkLit(a))}`}
                  style={lineStyle(from, to, Math.max(2, Math.round(a.hours / 10)))}
                />
              ) : null;
            })}

            <div
              className="absolute flex flex-col items-center justify-center gap-1.5 bg-ink text-primary-foreground shadow-xl shadow-ink/30"
              style={place(layout.center, { w: HUB, h: HUB })}
            >
              <span className="text-sm font-black">NTV360 Team</span>
              <span className="text-[11px] opacity-80">
                {people.length} people · {projects.length} projects
              </span>
            </div>

            {branchIds.map((id) => {
              const p = layout.branches.get(id);
              if (!p) return null;
              const project = byProject ? projectById.get(id) : undefined;
              const person = byProject ? undefined : personById.get(id);
              const total = person ? (totals.get(person.id) ?? 0) : 0;
              const colors = project ? PROJECT_COLOR_CLASSES[project.color] : null;
              const count = visible.filter((a) => branchOf(a) === id).length;
              const active = focus?.id === id && focus.kind === (byProject ? "project" : "person");
              return (
                <button
                  key={id}
                  type="button"
                  onClick={select({ kind: byProject ? "project" : "person", id })}
                  aria-pressed={active}
                  className={`absolute z-10 flex flex-col items-start justify-center px-3 text-left shadow-lg shadow-ink/20 transition-opacity ${
                    colors ? `${colors.bg} ${colors.onColor}` : "bg-ink text-primary-foreground"
                  } ${person && total > person.sprint_capacity_hours ? "outline-2 -outline-offset-2 outline-danger" : ""} ${ring(active)} ${dim(branchLit(id))}`}
                  style={place(p, BRANCH)}
                >
                  <span className="text-[11px] font-black tracking-wider opacity-90">
                    {project ? projectCode(project) : `${nameById.get(person!.id) ?? person!.full_name}${person!.title ? ` · ${person!.title}` : ""}`}
                  </span>
                  <span className="max-w-full truncate text-sm font-bold">{project?.name ?? person?.full_name}</span>
                  <span className="text-[11px] font-semibold opacity-90">
                    {project ? `${count} ${count === 1 ? "person" : "people"}` : `${formatHours(total)} / ${formatHours(person!.sprint_capacity_hours)} booked${total > person!.sprint_capacity_hours ? " · over" : ""}`}
                  </span>
                </button>
              );
            })}

            {visible.map((a) => {
              const p = layout.leaves.get(a.key);
              const person = personById.get(a.personId)!;
              const project = projectById.get(a.projectId)!;
              const colors = PROJECT_COLOR_CLASSES[project.color];
              const over = (totals.get(person.id) ?? 0) > person.sprint_capacity_hours;
              const next: MindmapFocus = byProject ? { kind: "person", id: person.id } : { kind: "project", id: project.id };
              return p ? (
                <button
                  key={a.key}
                  type="button"
                  onClick={select(next)}
                  aria-label={`${person.full_name} on ${project.name}, ${formatHours(a.hours)}`}
                  className={`absolute z-10 flex items-center gap-2 border bg-surface pr-2 pl-1 text-left shadow-md shadow-ink/10 transition-opacity ${
                    byProject && over ? "border-2 border-danger" : "border-border"
                  } ${dim(linkLit(a))}`}
                  style={place(p, LEAF)}
                >
                  <span
                    className={`flex size-8.5 shrink-0 items-center justify-center text-xs font-black ${
                      byProject ? "bg-ink text-primary-foreground" : `${colors.bg} ${colors.onColor}`
                    }`}
                  >
                    {byProject ? getInitials(person.full_name) : projectCode(project)}
                  </span>
                  <span className="flex min-w-0 flex-col leading-tight">
                    <b className="truncate text-xs">{byProject ? (nameById.get(person.id) ?? person.full_name) : project.name}</b>
                    <span className={`text-xs font-extrabold ${over ? "text-danger" : "text-muted"}`}>{formatHours(a.hours)}</span>
                  </span>
                </button>
              ) : null;
            })}
          </div>
        </section>

        <aside className="flex flex-[1_1_300px] flex-col gap-3">
          <MindmapDetails
            focus={focus}
            onClose={() => setFocus(null)}
            list={visible}
            people={people}
            projects={projects}
            personById={personById}
            projectById={projectById}
            totals={totals}
          />
          <p className="border border-border bg-surface p-3 text-xs text-muted">
            This view is read-only. Switch to <b className="text-foreground">Board</b> to move people or change their hours.
          </p>
        </aside>
      </div>
    </div>
  );
};
