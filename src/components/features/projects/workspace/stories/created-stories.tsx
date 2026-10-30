import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import type { CreatedStory } from "@/types/stories";

// Result of "Create in Jira": links to new stories, and any that failed (those stay in the list below to retry).
export const CreatedStories = ({ created }: { created: CreatedStory[] }) => {
  const ok = created.filter((c) => !c.error);
  const failed = created.filter((c) => c.error);
  return (
    <section className="flex flex-col gap-2 border border-l-4 border-border border-l-success bg-surface p-4">
      {ok.length > 0 && (
        <>
          <h3 className="flex items-center gap-2 text-[15px] font-extrabold">
            <CheckCircle2 className="size-4 text-success" aria-hidden />
            Created {ok.length} {ok.length === 1 ? "story" : "stories"} in Jira
          </h3>
          <ul className="flex flex-col gap-1 text-sm">
            {ok.map((c) => (
              <li key={c.key}>
                <a href={c.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
                  {c.key}
                  <ExternalLink className="size-3" aria-hidden />
                </a>{" "}
                {c.title}
                {c.subtaskKeys.length > 0 && <span className="text-muted"> · subtasks {c.subtaskKeys.join(", ")}</span>}
              </li>
            ))}
          </ul>
        </>
      )}
      {failed.map((c) => (
        <p key={c.title} role="alert" className="flex items-start gap-2 text-sm text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <b>{c.title}</b> wasn&apos;t created: {c.error} It&apos;s still approved below, so you can fix it and try again.
          </span>
        </p>
      ))}
    </section>
  );
};
