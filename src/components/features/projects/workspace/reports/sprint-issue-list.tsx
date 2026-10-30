"use client";

import { ExternalLink, Flag } from "lucide-react";
import { useState } from "react";
import { Empty } from "@/components/ui/query-state";
import { formatHours } from "@/lib/allocation-board";
import type { JiraSprintIssue } from "@/types/jira";

type SprintIssueListProps = {
  title: string;
  description: string;
  issues: JiraSprintIssue[];
  emptyMessage: string;
  /** Rows shown before "Show all". */
  initialCount?: number;
};

/** Remaining estimate, falling back to the original estimate. */
const leftText = (issue: JiraSprintIssue) => {
  const left = issue.remainingHours ?? issue.estimateHours;
  return left === null ? "-" : formatHours(left);
};

export const SprintIssueList = ({ title, description, issues, emptyMessage, initialCount = 8 }: SprintIssueListProps) => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? issues : issues.slice(0, initialCount);

  return (
    <section className="flex flex-col border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-[15px] font-extrabold">
          {title} <span className="bg-background px-1.5 text-xs">{issues.length}</span>
        </h3>
        <p className="text-xs text-muted">{description}</p>
      </div>
      {issues.length === 0 ? (
        <div className="p-4">
          <Empty message={emptyMessage} />
        </div>
      ) : (
        <ul>
          {visible.map((issue) => (
            <li key={issue.key} className="flex items-start gap-3 border-b border-border px-4 py-2.5 text-sm last:border-b-0">
              <a
                href={issue.url}
                target="_blank"
                rel="noreferrer"
                className="flex shrink-0 items-center gap-1 font-extrabold text-primary hover:underline"
                aria-label={`${issue.key} in Jira (opens in a new tab)`}
              >
                {issue.key}
                <ExternalLink className="size-3" aria-hidden />
              </a>
              <div className="min-w-0 flex-1">
                <p className="truncate" title={issue.summary}>
                  {issue.summary}
                </p>
                <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                  <span className="bg-background px-1.5 font-bold text-foreground">{issue.status}</span>
                  {issue.flagged && (
                    <span className="flex items-center gap-1 font-bold text-warning">
                      <Flag className="size-3" aria-hidden />
                      Flagged
                    </span>
                  )}
                  <span>{issue.assignee?.displayName ?? "Unassigned"}</span>
                  <span>{issue.type}</span>
                </p>
              </div>
              <span className="shrink-0 text-right text-xs text-muted">
                <b className="block text-sm text-foreground">
                  {leftText(issue)}
                </b>
                left
              </span>
            </li>
          ))}
        </ul>
      )}
      {issues.length > initialCount && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="border-t border-border px-4 py-2.5 text-left text-sm font-bold text-primary hover:bg-accent">
          {showAll ? "Show fewer" : `Show all ${issues.length}`}
        </button>
      )}
    </section>
  );
};
