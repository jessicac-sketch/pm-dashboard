"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Empty, ErrorMessage } from "@/components/ui/query-state";
import { Select } from "@/components/ui/select";
import { useUpdateProject } from "@/hooks/queries/use-projects";
import { formatHours } from "@/lib/allocation-board";
import { getInitials } from "@/lib/format";
import { EMPLOYMENT_LABELS, FULL_TIME_SPRINT_HOURS, ROLE_OPTIONS } from "@/lib/people";
import type { ProjectTeam, TeamMember } from "@/lib/project-team";
import type { Person, PersonRole, Project } from "@/types/database";

type TeamTabProps = {
  project: Project;
  people: Person[];
  team: ProjectTeam;
  onGoToRisks: () => void;
};

const MemberRow = ({ member, isLead }: { member: TeamMember; isLead: boolean }) => {
  const capacity = member.person.sprint_capacity_hours;
  const over = member.totalHours > capacity;
  return (
    <li className="grid grid-cols-[minmax(240px,2fr)_130px_110px_minmax(200px,1.5fr)] items-center border-b border-border px-4 py-2.5 text-sm">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center bg-ink text-[11px] font-black text-primary-foreground" aria-hidden>
          {getInitials(member.person.full_name)}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <b className="truncate">{member.person.full_name}</b>
            {isLead && <span className="bg-secondary px-1.5 text-[11px] font-extrabold text-secondary-foreground">Lead</span>}
            {member.person.employment_type !== "regular" && (
              <span className="bg-background px-1.5 text-[11px] font-extrabold">{EMPLOYMENT_LABELS[member.person.employment_type]}</span>
            )}
          </div>
          {member.person.title && <div className="truncate text-xs text-muted">{member.person.title}</div>}
        </div>
      </div>
      <div>
        <b className="text-[15px]">{formatHours(member.hours)}</b> <span className="text-xs text-muted">on this project</span>
      </div>
      <div className="text-muted">of {formatHours(capacity)} / sprint</div>
      <div className="flex items-center gap-2">
        <div className="relative h-2 flex-1 bg-secondary">
          <div className={`h-2 ${over ? "bg-danger" : "bg-primary"}`} style={{ width: `${(Math.min(member.totalHours / capacity, 1.2) / 1.2) * 100}%` }} />
          <div className="absolute -top-1 left-[83.33%] h-3.5 w-0.5 bg-foreground" aria-hidden />
        </div>
        <b className={`w-24 text-right text-xs ${over ? "text-danger" : ""}`}>{formatHours(member.totalHours)} total</b>
      </div>
    </li>
  );
};

export const TeamTab = ({ project, people, team, onGoToRisks }: TeamTabProps) => {
  const updateProject = useUpdateProject();
  const required = new Set(project.required_roles);
  const memberRoles = new Set(team.members.map((m) => m.person.role));
  const groups = ROLE_OPTIONS.filter((r) => memberRoles.has(r.value) || required.has(r.value));
  const overloaded = team.members.filter((m) => m.totalHours > m.person.sprint_capacity_hours);

  const toggleRequired = (role: PersonRole) => {
    const next = required.has(role) ? project.required_roles.filter((r) => r !== role) : [...project.required_roles, role];
    updateProject.mutate({ id: project.id, input: { required_roles: next } });
  };

  return (
    <div className="flex flex-wrap items-start gap-4">
      <section className="min-w-0 flex-[999_1_680px] border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3.5">
          <div>
            <h2 className="text-base font-extrabold">Who&apos;s working on this</h2>
            <p className="text-xs text-muted">Grouped by role. Required roles with no one in them show as gaps.</p>
          </div>
          <Link href="/resources" className="text-sm font-extrabold text-primary">
            Change on Resources board
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="p-4">
            <Empty message="No one is assigned yet. Add people to this project on the Resources board." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-180">
              {groups.map((role) => {
                const members = team.members.filter((m) => m.person.role === role.value);
                const gap = members.length === 0;
                const fte = members.reduce((sum, m) => sum + m.hours, 0) / FULL_TIME_SPRINT_HOURS;
                return (
                  <div key={role.value}>
                    <div className={`flex items-center justify-between gap-2.5 border-b border-border px-4 py-2.5 ${gap ? "bg-danger/5" : "bg-background"}`}>
                      <div className="flex items-center gap-2.5">
                        <b className="text-sm">{role.label}</b>
                        <span className="bg-surface px-1.5 text-[11px] font-extrabold">{members.length}</span>
                        {gap && (
                          <span className="flex items-center gap-1 bg-danger/10 px-2 py-0.5 text-[11px] font-extrabold text-danger">
                            <AlertTriangle className="size-3" aria-hidden />
                            Required · none assigned
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted">{gap ? "Required for this project" : `${fte.toFixed(2)} FTE on this project`}</span>
                    </div>
                    <ul>
                      {members.map((m) => (
                        <MemberRow key={m.person.id} member={m} isLead={m.person.id === project.lead_person_id} />
                      ))}
                    </ul>
                    {gap && (
                      <p className="flex flex-wrap items-center gap-2.5 border-b border-border py-3 pr-4 pl-14 text-sm">
                        <span className="font-extrabold text-danger">No {role.label} on this project yet.</span>
                        <Link href="/resources" className="font-extrabold text-primary">
                          Find someone on Resources
                        </Link>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <aside className="flex flex-[1_1_280px] flex-col gap-3">
        <section className="flex flex-col gap-3 border border-border bg-surface p-4">
          <h2 className="text-[15px] font-extrabold">Project setup</h2>
          <Select
            id="project-lead"
            label="Project lead"
            options={[{ value: "", label: "Not set" }, ...people.map((p) => ({ value: p.id, label: p.full_name }))]}
            value={project.lead_person_id ?? ""}
            onChange={(e) => updateProject.mutate({ id: project.id, input: { lead_person_id: e.target.value || null } })}
          />
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">Required roles</legend>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  aria-pressed={required.has(r.value)}
                  onClick={() => toggleRequired(r.value)}
                  className={`h-8 border px-2.5 text-xs font-bold ${
                    required.has(r.value) ? "border-ink bg-ink text-primary-foreground" : "border-border bg-surface hover:bg-accent"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </fieldset>
          {updateProject.error && <ErrorMessage error={updateProject.error} />}
        </section>

        {project.required_fte !== null && (
          <section className="flex flex-col gap-2 border border-border bg-surface p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Staffed vs target</span>
              <b className={team.fte < project.required_fte ? "text-warning" : "text-success"}>
                {team.fte.toFixed(2)} / {project.required_fte} FTE
              </b>
            </div>
            <div className="h-2 bg-background">
              <div
                className={`h-2 ${team.fte < project.required_fte ? "bg-warning" : "bg-success"}`}
                style={{ width: `${Math.min(team.fte / project.required_fte, 1) * 100}%` }}
              />
            </div>
          </section>
        )}

        {overloaded.map((m) => (
          <p key={m.person.id} className="border border-warning/30 bg-warning/10 px-3.5 py-3 text-sm">
            <b>
              {m.person.full_name} is booked {formatHours(m.totalHours)} of {formatHours(m.person.sprint_capacity_hours)}
            </b>{" "}
            this sprint across their projects. Their {formatHours(m.hours)} here may slip.{" "}
            <button type="button" onClick={onGoToRisks} className="font-extrabold text-primary">
              See risks
            </button>
          </p>
        ))}
      </aside>
    </div>
  );
};
