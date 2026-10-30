import type { DevStack, EmploymentType, PersonRole } from "@/types/database";

export const STACK_LABELS: Record<DevStack, string> = {
  frontend: "Frontend",
  backend: "Backend",
  fullstack: "Full-stack",
};


export const STACK_OPTIONS = [
  { value: "", label: "Not set" },
  ...Object.entries(STACK_LABELS).map(([value, label]) => ({ value: value as DevStack, label })),
];

export const ROLE_LABELS: Record<PersonRole, string> = {
  developer: "Developer",
  qa: "QA",
  designer: "Designer",
  devops: "DevOps",
  data_engineer: "Data Engineer",
  project_manager: "Project Manager",
  business_analyst: "Business Analyst",
  other: "Other",
};

export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  regular: "Regular",
  intern: "Intern",
  contractor: "Contractor",
};

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value: value as PersonRole,
  label,
}));

export const EMPLOYMENT_OPTIONS = Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => ({
  value: value as EmploymentType,
  label,
}));

/** Hours a full-time equivalent works in a 2-week sprint; used to turn people's shares into FTE. */
export const FULL_TIME_SPRINT_HOURS = 80;

/**
 * Short names for tight spaces: the first name, plus as much of the last name
 * as it takes to tell people apart ("Mark S." and "Mark P."; "Mark Sa." and
 * "Mark So." if both start with S). Falls back to the full name.
 */
export const shortNames = (people: { id: string; full_name: string }[]): Map<string, string> => {
  const split = people.map((p) => {
    const parts = p.full_name.trim().split(/\s+/);
    return { id: p.id, full: p.full_name.trim(), first: parts[0] ?? "", last: parts.length > 1 ? parts[parts.length - 1] : "" };
  });
  const byFirst = new Map<string, typeof split>();
  for (const p of split) byFirst.set(p.first.toLowerCase(), [...(byFirst.get(p.first.toLowerCase()) ?? []), p]);

  const out = new Map<string, string>();
  for (const group of byFirst.values()) {
    if (group.length === 1) {
      out.set(group[0].id, group[0].first);
      continue;
    }
    for (const p of group) {
      let label = p.full;
      for (let k = 1; k <= p.last.length; k++) {
        const prefix = p.last.slice(0, k).toLowerCase();
        const clash = group.some((o) => o.id !== p.id && o.last.slice(0, k).toLowerCase() === prefix);
        if (!clash) {
          label = `${p.first} ${p.last.charAt(0).toUpperCase()}${p.last.slice(1, k)}.`;
          break;
        }
      }
      out.set(p.id, label);
    }
  }
  return out;
};
