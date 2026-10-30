"use client";

import { Check, Pencil, RefreshCw, Undo2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Draft, StoryDraftsState } from "@/hooks/use-story-drafts";
import { StoryEditForm } from "./story-edit-form";

type StoryCardProps = {
  draft: Draft;
  index: number;
  drafts: StoryDraftsState;
};

const STATUS_STYLES = {
  pending: "border-l-border",
  approved: "border-l-success",
  declined: "border-l-border opacity-60",
};

export const StoryCard = ({ draft, index, drafts }: StoryCardProps) => {
  const { id, story, status } = draft;
  const [mode, setMode] = useState<"view" | "edit" | "feedback">("view");
  const [feedback, setFeedback] = useState("");
  const regenerating = drafts.regeneratingId === id;
  const busy = drafts.regeneratingId !== null || drafts.creating;

  const submitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    drafts.regenerateOne(id, feedback);
    setFeedback("");
    setMode("view");
  };

  return (
    <article aria-label={story.title} className={`flex flex-col gap-3 border border-l-4 border-border bg-surface p-4 ${STATUS_STYLES[status]} ${regenerating ? "animate-pulse" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-extrabold text-muted">STORY {index + 1}</span>
          <h3 className={`text-[15px] font-extrabold ${status === "declined" ? "line-through" : ""}`}>{story.title}</h3>
        </div>
        {status !== "pending" && (
          <span
            className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-extrabold ${
              status === "approved" ? "bg-success/10 text-success" : "bg-background text-muted"
            }`}
          >
            {status === "approved" ? <Check className="size-3" aria-hidden /> : <X className="size-3" aria-hidden />}
            {status === "approved" ? "Approved" : "Declined"}
          </span>
        )}
      </div>

      {mode === "edit" ? (
        <StoryEditForm
          id={id}
          story={story}
          onSave={(next) => {
            drafts.edit(id, next);
            setMode("view");
          }}
          onCancel={() => setMode("view")}
        />
      ) : (
        <>
          {story.description && <p className="text-sm">{story.description}</p>}
          <p className="text-sm">
            <b>UI/UX:</b> <span className="text-muted">{story.uiux || "TBD"}</span>
          </p>
          <div>
            <h4 className="text-sm font-bold">User Acceptance Criteria</h4>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
              {story.criteria.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ol>
          </div>
          {story.subtasks.length > 0 && (
            <div>
              <h4 className="text-sm font-bold">Subtasks</h4>
              <ul className="mt-1 flex flex-col gap-1 text-sm">
                {story.subtasks.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 bg-background px-1.5 text-[11px] font-extrabold">{s.kind}</span>
                    {s.summary}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {mode === "feedback" && (
        <form onSubmit={submitFeedback} className="flex flex-wrap items-end gap-2 border-t border-border pt-3">
          <div className="min-w-60 flex-1">
            <Input
              id={`story-${id}-feedback`}
              label="What should change? (optional)"
              placeholder="e.g. fewer criteria, focus on the admin side only"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="button" variant="ghost" onClick={() => setMode("view")}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary" icon={RefreshCw}>
            Regenerate
          </Button>
        </form>
      )}

      {mode === "view" && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          {status === "pending" ? (
            <>
              <Button variant="secondary" icon={Check} onClick={() => drafts.setStatus(id, "approved")} disabled={busy}>
                Approve
              </Button>
              <Button variant="ghost" icon={X} onClick={() => drafts.setStatus(id, "declined")} disabled={busy}>
                Decline
              </Button>
            </>
          ) : (
            <Button variant="ghost" icon={Undo2} onClick={() => drafts.setStatus(id, "pending")} disabled={busy}>
              {status === "approved" ? "Unapprove" : "Undo decline"}
            </Button>
          )}
          {status !== "declined" && (
            <>
              <Button variant="ghost" icon={Pencil} onClick={() => setMode("edit")} disabled={busy}>
                Edit
              </Button>
              <Button variant="ghost" icon={RefreshCw} onClick={() => setMode("feedback")} disabled={busy} loading={regenerating}>
                {regenerating ? "Regenerating…" : "Regenerate"}
              </Button>
            </>
          )}
        </div>
      )}
    </article>
  );
};
