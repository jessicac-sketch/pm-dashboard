"use client";

import { AlertTriangle, CalendarDays, RefreshCw, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatTimestamp } from "@/lib/format";
import type { SprintTiming } from "@/lib/jira/sprint-summary";
import type { JiraBoard, JiraSprint } from "@/types/jira";

type SprintHeaderProps = {
  board: JiraBoard;
  sprint: JiraSprint;
  sprints: JiraSprint[];
  timing: SprintTiming;
  refreshing: boolean;
  onSprintChange: (sprintId: number) => void;
  onRefresh: () => void;
  onChangeBoard: () => void;
};

const STATE_LABELS: Record<JiraSprint["state"], string> = { active: "Active", closed: "Closed", future: "Not started" };

const timingText = (sprint: JiraSprint, timing: SprintTiming) => {
  if (sprint.state === "closed") return `Closed ${formatTimestamp(sprint.completeDate ?? sprint.endDate)}`;
  if (timing.workdaysLeft === null) return "No end date set";
  if (timing.overdue) return `Past its end date by ${Math.abs(timing.workdaysLeft)} working ${Math.abs(timing.workdaysLeft) === 1 ? "day" : "days"}`;
  return `${timing.workdaysLeft} working ${timing.workdaysLeft === 1 ? "day" : "days"} left`;
};

export const SprintHeader = ({ board, sprint, sprints, timing, refreshing, onSprintChange, onRefresh, onChangeBoard }: SprintHeaderProps) => (
  <section className="flex flex-col gap-3 border border-border bg-surface p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-muted">
          Jira board <b className="text-foreground">{board.name}</b>
          {board.projectKey && ` (${board.projectKey})`} ·{" "}
          <button type="button" onClick={onChangeBoard} className="font-bold text-primary hover:underline">
            Change board
          </button>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-extrabold">{sprint.name}</h2>
          <span className={`px-2 py-0.5 text-[11px] font-extrabold ${sprint.state === "active" ? "bg-secondary text-secondary-foreground" : "bg-background text-muted"}`}>
            {STATE_LABELS[sprint.state]}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        {sprints.length > 1 && (
          <div className="w-64">
            <Select
              id="sprint-pick"
              label="Sprint"
              hideLabel
              options={sprints.map((s) => ({ value: String(s.id), label: `${s.name}${s.state === "active" ? " (active)" : ""}` }))}
              value={String(sprint.id)}
              onChange={(e) => onSprintChange(Number(e.target.value))}
            />
          </div>
        )}
        <Button variant="secondary" icon={RefreshCw} onClick={onRefresh} loading={refreshing}>
          Refresh
        </Button>
      </div>
    </div>

    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
      <span className="flex items-center gap-1.5 text-muted">
        <CalendarDays className="size-4" aria-hidden />
        {formatTimestamp(sprint.startDate)} to {formatTimestamp(sprint.endDate)}
      </span>
      <span className={`flex items-center gap-1.5 ${timing.overdue ? "font-bold text-warning" : "text-muted"}`}>
        {timing.overdue && <AlertTriangle className="size-4" aria-hidden />}
        {timingText(sprint, timing)}
      </span>
    </div>
    {timing.elapsed !== null && sprint.state === "active" && (
      <div className="h-1.5 bg-background" title={`${Math.round(timing.elapsed * 100)}% of the sprint has passed`}>
        <div className="h-1.5 bg-muted" style={{ width: `${timing.elapsed * 100}%` }} />
      </div>
    )}
    <p className="flex items-start gap-1.5 text-sm">
      <Target className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
      {sprint.goal.trim() ? sprint.goal : <span className="text-muted">No sprint goal set in Jira.</span>}
    </p>
  </section>
);
