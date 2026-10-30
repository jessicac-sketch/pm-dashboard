import type { ProjectColor } from "@/types/database";

// Full class names so Tailwind can see them. Validated as a colorblind-safe set;
// every use also shows the project code, so color is never the only cue. `onColor` is the
// readable text color on the fill; it switches with the theme (see globals.css).
export const PROJECT_COLOR_CLASSES: Record<
  ProjectColor,
  { bg: string; text: string; onColor: string }
> = {
  magenta: { bg: "bg-project-magenta", text: "text-project-magenta", onColor: "text-on-project-magenta" },
  blue: { bg: "bg-project-blue", text: "text-project-blue", onColor: "text-on-project-blue" },
  teal: { bg: "bg-project-teal", text: "text-project-teal", onColor: "text-on-project-teal" },
  amber: { bg: "bg-project-amber", text: "text-project-amber", onColor: "text-on-project-amber" },
  violet: { bg: "bg-project-violet", text: "text-project-violet", onColor: "text-on-project-violet" },
};

/** "Signage CMS" -> "SC" when a project has no code yet. */
export const projectCode = (project: { code: string | null; name: string }) =>
  project.code ??
  project.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
