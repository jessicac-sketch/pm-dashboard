"use client";

import { X } from "lucide-react";
import { formatHours, fteFor, type DraftAllocation } from "@/lib/allocation-board";
import { getInitials } from "@/lib/format";
import { EMPLOYMENT_LABELS, ROLE_LABELS, STACK_LABELS } from "@/lib/people";
import { PROJECT_COLOR_CLASSES, projectCode } from "@/lib/project-colors";
import type { Person, Project } from "@/types/database";

export type MindmapFocus = { kind: "person" | "project"; id: string } | null;

type MindmapDetailsProps = {
  focus: MindmapFocus;
  onClose: () => void;
  list: DraftAllocation[];
  people: Person[];
  projects: Project[];
  personById: Map<string, Person>;
  projectById: Map<string, Project>;
  totals: Map<string, number>;
};

const Meter = ({ label, value, percent, tone }: { label: string; value: string; percent: number; tone: "ok" | "warn" | "over" }) => {
  const color = { ok: "bg-success", warn: "bg-warning", over: "bg-danger" }[tone];
  const text = { ok: "text-success", warn: "text-warning", over: "text-danger" }[tone];
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted">{label}</span>
        <b className={text}>{value}</b>
      </div>
      <div className="h-2 bg-background">
        <div className={`h-2 ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
};

const Row = ({ tag, tagClass, name, value }: { tag: string; tagClass: string; name: string; value: string }) => (
  <li className="flex items-center gap-2 border-b border-border py-2 text-sm last:border-b-0">
    <span className={`inline-flex h-6 min-w-9 items-center justify-center px-1.5 text-[11px] font-black ${tagClass}`}>
      {tag}
    </span>
    <span className="min-w-0 flex-1 truncate">{name}</span>
    <b>{value}</b>
  </li>
);

export const MindmapDetails = ({
  focus,
  onClose,
  list,
  people,
  projects,
  personById,
  projectById,
  totals,
}: MindmapDetailsProps) => {
  const header = (tag: string, tagClass: string, title: string, subtitle: string) => (
    <div className="flex items-center gap-3">
      <span className={`flex size-11 shrink-0 items-center justify-center text-sm font-black ${tagClass}`} aria-hidden>
        {tag}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-bold">{title}</h2>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close details"
        className="flex size-9 items-center justify-center text-muted hover:bg-accent hover:text-foreground"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );

  const person = focus?.kind === "person" ? personById.get(focus.id) : undefined;
  const project = focus?.kind === "project" ? projectById.get(focus.id) : undefined;

  if (person) {
    const total = totals.get(person.id) ?? 0;
    const capacity = person.sprint_capacity_hours;
    const over = total > capacity;
    const mine = list.filter((a) => a.personId === person.id);
    return (
      <section className="flex flex-col gap-3 border border-border bg-surface p-4">
        {header(
          getInitials(person.full_name),
          `bg-ink text-primary-foreground ${over ? "outline-2 -outline-offset-2 outline-danger" : ""}`,
          person.full_name,
          [person.title, ROLE_LABELS[person.role], person.stack ? STACK_LABELS[person.stack] : null, EMPLOYMENT_LABELS[person.employment_type]].filter(Boolean).join(" · "),
        )}
        <Meter
          label="Booked this sprint"
          value={`${formatHours(total)} / ${formatHours(capacity)}${over ? " · over capacity" : ""}`}
          percent={(total / capacity) * 100}
          tone={over ? "over" : total <= capacity / 2 ? "ok" : "warn"}
        />
        <h3 className="text-xs font-bold text-muted">Projects</h3>
        <ul>
          {mine.map((a) => {
            const p = projectById.get(a.projectId);
            if (!p) return null;
            const colors = PROJECT_COLOR_CLASSES[p.color];
            return <Row key={a.key} tag={projectCode(p)} tagClass={`${colors.bg} ${colors.onColor}`} name={p.name} value={formatHours(a.hours)} />;
          })}
        </ul>
        {mine.length === 0 && <p className="text-sm text-muted">Not on any project. Assign them on the Board.</p>}
      </section>
    );
  }

  if (project) {
    const mine = list.filter((a) => a.projectId === project.id);
    const fte = fteFor(mine);
    const required = project.required_fte;
    const colors = PROJECT_COLOR_CLASSES[project.color];
    return (
      <section className="flex flex-col gap-3 border border-border bg-surface p-4">
        {header(projectCode(project), `${colors.bg} ${colors.onColor}`, project.name, `${mine.length} ${mine.length === 1 ? "person" : "people"} assigned`)}
        <Meter
          label="Staffing"
          value={`${fte.toFixed(2)}${required !== null ? ` / ${required}` : ""} FTE`}
          percent={required ? (fte / required) * 100 : 100}
          tone={required !== null && fte < required ? "warn" : "ok"}
        />
        <h3 className="text-xs font-bold text-muted">People</h3>
        <ul>
          {mine.map((a) => {
            const p = personById.get(a.personId);
            if (!p) return null;
            return (
              <Row
                key={a.key}
                tag={getInitials(p.full_name)}
                tagClass="bg-ink text-primary-foreground"
                name={`${p.full_name} · ${formatHours(totals.get(p.id) ?? 0)} / ${formatHours(p.sprint_capacity_hours)} total`}
                value={formatHours(a.hours)}
              />
            );
          })}
        </ul>
        {mine.length === 0 && <p className="text-sm text-muted">No one assigned yet. Add people on the Board.</p>}
      </section>
    );
  }

  const overloaded = people.filter((p) => (totals.get(p.id) ?? 0) > p.sprint_capacity_hours);
  return (
    <section className="flex flex-col gap-3 border border-border bg-surface p-4">
      <div>
        <h2 className="text-base font-bold">Team at a glance</h2>
        <p className="text-xs text-muted">Click a project or a person on the map to trace their links.</p>
      </div>
      <ul>
        {projects.map((p) => {
          const fte = fteFor(list.filter((a) => a.projectId === p.id));
          const colors = PROJECT_COLOR_CLASSES[p.color];
          const short = p.required_fte !== null && fte < p.required_fte;
          return (
            <li key={p.id} className="flex items-center gap-2 border-b border-border py-2 text-sm">
              <span className={`inline-flex h-6 min-w-9 items-center justify-center px-1.5 text-[11px] font-black ${colors.bg} ${colors.onColor}`}>
                {projectCode(p)}
              </span>
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              <b className={short ? "text-warning" : "text-success"}>
                {fte.toFixed(2)}
                {p.required_fte !== null && ` / ${p.required_fte}`} FTE
              </b>
            </li>
          );
        })}
      </ul>
      {overloaded.length > 0 && (
        <p className="text-sm text-danger">
          <b>Over capacity:</b> {overloaded.map((p) => `${p.full_name} (${formatHours(totals.get(p.id) ?? 0)} of ${formatHours(p.sprint_capacity_hours)})`).join(", ")}
        </p>
      )}
    </section>
  );
};
