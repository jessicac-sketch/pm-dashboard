"use client";

import { ExternalLink, RefreshCw, RotateCcw, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/query-state";
import type { StoryDraftsState } from "@/hooks/use-story-drafts";
import { CreatedStories } from "./created-stories";
import { StoryCard } from "./story-card";

type BreakdownReviewProps = {
  drafts: StoryDraftsState;
  /** Why "Create in Jira" is unavailable, if it is. */
  createBlocker: string | null;
};

const Notes = ({ title, items }: { title: string; items: string[] }) =>
  items.length === 0 ? null : (
    <div>
      <h3 className="text-sm font-bold">{title}</h3>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-muted">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );

export const BreakdownReview = ({ drafts, createBlocker }: BreakdownReviewProps) => {
  const [feedback, setFeedback] = useState("");
  const { breakdown } = drafts;
  if (!breakdown) return null;
  const issue = breakdown.sourceIssue;
  const pending = drafts.drafts.filter((d) => d.status === "pending").length;
  const busy = drafts.generating || drafts.creating || drafts.regeneratingId !== null;

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 border border-border bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {issue ? (
              <p className="text-xs text-muted">
                From{" "}
                <a href={issue.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
                  {issue.key}
                  <ExternalLink className="size-3" aria-hidden />
                </a>{" "}
                {issue.summary} · New stories go under {issue.epic ? <b className="text-foreground">{issue.epic.key}</b> : "no epic"}
              </p>
            ) : (
              <p className="text-xs text-muted">From your notes · New stories won&apos;t be under an epic</p>
            )}
            <h2 className="text-base font-extrabold">
              {breakdown.splitSummary || "Kept as one story"}
            </h2>
          </div>
          <Button variant="ghost" icon={RotateCcw} onClick={drafts.startOver} disabled={busy}>
            Start over
          </Button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            drafts.regenerateRest(feedback);
            setFeedback("");
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <div className="min-w-64 flex-1">
            <Input
              id="breakdown-feedback"
              label="Not the right split? Tell the AI what to change"
              placeholder="e.g. split by user role instead, keep notifications out"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" icon={RefreshCw} loading={drafts.generating} disabled={busy}>
            Regenerate the rest
          </Button>
        </form>
        <p className="text-xs text-muted">Regenerating keeps the stories you&apos;ve approved and rewrites everything else.</p>
        {drafts.generateError && <ErrorMessage error={drafts.generateError} />}
      </section>

      {drafts.created && <CreatedStories created={drafts.created} />}

      {drafts.regenerateError && <ErrorMessage error={drafts.regenerateError} />}
      <div className="flex flex-col gap-3">
        {drafts.drafts.map((draft, i) => (
          <StoryCard key={draft.id} draft={draft} index={i} drafts={drafts} />
        ))}
      </div>

      {(breakdown.assumptions.length > 0 || breakdown.outOfScope.length > 0) && (
        <section className="flex flex-col gap-3 border border-border bg-surface p-4">
          <Notes title="Assumptions the AI made" items={breakdown.assumptions} />
          <Notes title="Left out on purpose" items={breakdown.outOfScope} />
        </section>
      )}

      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border border-border bg-surface px-4 py-3 shadow-lg shadow-ink/10">
        <p className="text-sm">
          <b>{drafts.approvedCount} approved</b>
          <span className="text-muted"> · {pending} still to review</span>
          {createBlocker && <span className="block text-xs text-muted">{createBlocker}</span>}
        </p>
        <div className="flex flex-col items-end gap-1">
          <Button icon={Send} onClick={drafts.createApproved} loading={drafts.creating} disabled={drafts.approvedCount === 0 || !!createBlocker || busy}>
            Create {drafts.approvedCount || ""} in Jira
          </Button>
          {drafts.createError && <ErrorMessage error={drafts.createError} />}
        </div>
      </div>
    </div>
  );
};
