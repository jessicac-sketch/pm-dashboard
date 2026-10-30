"use client";

import { CheckCircle2, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Empty, ErrorMessage } from "@/components/ui/query-state";
import { Select } from "@/components/ui/select";
import { useCreateIssue, useUpdateIssue } from "@/hooks/queries/use-risks";
import { addDays } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { BAND_CLASSES, BAND_LABELS } from "@/lib/risk-scoring";
import type { Issue, IssueSeverity, Person } from "@/types/database";

const COLUMNS = "grid-cols-[50px_minmax(260px,3fr)_96px_120px_150px_100px_100px_110px]";
const SEVERITY_OPTIONS = (["critical", "high", "medium", "low"] as IssueSeverity[]).map((v) => ({ value: v, label: BAND_LABELS[v] }));

type IssuesTableProps = { projectId: string; issues: Issue[]; people: Person[]; today: string };

const IssueDialog = ({ projectId, people, today, onClose }: { projectId: string; people: Person[]; today: string; onClose: () => void }) => {
  const createIssue = useCreateIssue(projectId);
  const [form, setForm] = useState({ title: "", actionPlan: "", severity: "medium" as IssueSeverity, ownerId: "", dueDate: addDays(today, 7) });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createIssue.mutate(
      {
        project_id: projectId,
        title: form.title.trim(),
        action_plan: form.actionPlan.trim() || null,
        severity: form.severity,
        source: "Logged manually",
        owner_person_id: form.ownerId || null,
        due_date: form.dueDate || null,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open onClose={onClose} title="Log issue" description="Something that is already happening and needs action.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input id="issue-title" label="Issue" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required autoFocus />
        <Input id="issue-action" label="Action plan" value={form.actionPlan} onChange={(e) => setForm((f) => ({ ...f, actionPlan: e.target.value }))} />
        <div className="grid grid-cols-3 gap-3">
          <Select id="issue-severity" label="Severity" options={SEVERITY_OPTIONS} value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as IssueSeverity }))} />
          <Select
            id="issue-owner"
            label="Owner"
            options={[{ value: "", label: "Unassigned" }, ...people.map((p) => ({ value: p.id, label: p.full_name }))]}
            value={form.ownerId}
            onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}
          />
          <Input id="issue-due" label="Fix by" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
        </div>
        {createIssue.error && <ErrorMessage error={createIssue.error} />}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" icon={Plus} loading={createIssue.isPending} disabled={!form.title.trim()}>
            Log issue
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export const IssuesTable = ({ projectId, issues, people, today }: IssuesTableProps) => {
  const updateIssue = useUpdateIssue(projectId);
  const [showResolved, setShowResolved] = useState(false);
  const [logging, setLogging] = useState(false);
  const resolvedCount = issues.filter((i) => i.status === "resolved").length;
  const shown = issues.filter((i) => showResolved || i.status === "open");
  const personName = (id: string | null) => people.find((p) => p.id === id)?.full_name ?? "Unassigned";

  return (
    <section className="border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border px-4 py-3.5">
        <div>
          <h2 className="text-base font-extrabold">Issues</h2>
          <p className="text-xs text-muted">Problems already happening. Each needs an owner and a fix date.</p>
        </div>
        <div className="flex gap-2">
          {resolvedCount > 0 && (
            <Button variant="ghost" onClick={() => setShowResolved((v) => !v)}>
              {showResolved ? "Hide resolved" : `Show resolved (${resolvedCount})`}
            </Button>
          )}
          <Button variant="secondary" icon={Plus} onClick={() => setLogging(true)}>
            Log issue
          </Button>
        </div>
      </div>
      {updateIssue.error && <div className="px-4 pt-3"><ErrorMessage error={updateIssue.error} /></div>}

      {shown.length === 0 ? (
        <div className="p-4">
          <Empty message="No open issues." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-225 text-sm">
            <div className={`grid ${COLUMNS} border-b border-border text-xs font-extrabold text-muted [&>div]:px-3 [&>div]:py-2.5`}>
              <div>ID</div>
              <div>Issue</div>
              <div>Severity</div>
              <div>Came from</div>
              <div>Owner</div>
              <div>Raised</div>
              <div>Fix by</div>
              <div />
            </div>
            {shown.map((issue) => {
              const late = issue.status === "open" && !!issue.due_date && issue.due_date < today;
              return (
                <div key={issue.id} className={`grid ${COLUMNS} items-center border-b border-border [&>div]:px-3 [&>div]:py-2.5 ${issue.status === "resolved" ? "opacity-55" : ""}`}>
                  <div className="font-extrabold text-muted">I{issue.ref_number}</div>
                  <div>
                    <b>{issue.title}</b>
                    {issue.action_plan && <p className="text-xs text-muted">{issue.action_plan}</p>}
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 text-[11px] font-extrabold ${BAND_CLASSES[issue.severity]}`}>{BAND_LABELS[issue.severity]}</span>
                  </div>
                  <div className="font-bold text-project-blue">{issue.source ?? "-"}</div>
                  <div className="truncate">{personName(issue.owner_person_id)}</div>
                  <div>{formatDate(issue.raised_on)}</div>
                  <div className={`font-bold ${late ? "text-danger" : ""}`}>{formatDate(issue.due_date)}</div>
                  <div>
                    {issue.status === "open" ? (
                      <Button variant="ghost" icon={CheckCircle2} onClick={() => updateIssue.mutate({ id: issue.id, input: { status: "resolved" } })}>
                        Resolve
                      </Button>
                    ) : (
                      <span className="text-xs font-bold text-success">Resolved</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {logging && <IssueDialog projectId={projectId} people={people} today={today} onClose={() => setLogging(false)} />}
    </section>
  );
};
