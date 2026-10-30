"use client";

import { ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { Fragment, useState } from "react";
import { Button } from "@/components/ui/button";
import { Empty, ErrorMessage } from "@/components/ui/query-state";
import { useConvertRiskToIssue, useUpdateRisk } from "@/hooks/queries/use-risks";
import { addDays } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import {
  CATEGORY_LABELS,
  NEXT_STATUS,
  RESPONSE_LABELS,
  STATUS_LABELS,
  residualScore,
  riskScore,
  riskTrend,
  severityFromScore,
} from "@/lib/risk-scoring";
import type { WbsSummary } from "@/lib/wbs";
import type { Person, Risk } from "@/types/database";
import { ScoreBadge } from "./score-badge";

const COLUMNS = "grid-cols-[44px_minmax(250px,3fr)_60px_96px_124px_44px_150px_110px_110px]";
const TREND = {
  up: { icon: "↑", label: "Score went up in the last 2 weeks", className: "text-danger" },
  down: { icon: "↓", label: "Score went down in the last 2 weeks", className: "text-success" },
  flat: { icon: "→", label: "No recent change", className: "text-muted" },
};

type RiskRegisterProps = {
  projectId: string;
  risks: Risk[];
  people: Person[];
  wbs: WbsSummary;
  today: string;
  subtitle: string;
  onEdit: (risk: Risk) => void;
  headerAction?: React.ReactNode;
};

const Detail = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <span className="mb-1 block text-xs font-extrabold text-foreground/70">{label}</span>
    <span className="text-sm">{children || <span className="text-muted">Not set</span>}</span>
  </div>
);

export const RiskRegister = ({ projectId, risks, people, wbs, today, subtitle, onEdit, headerAction }: RiskRegisterProps) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const updateRisk = useUpdateRisk(projectId);
  const convert = useConvertRiskToIssue(projectId);
  const personName = (id: string | null) => people.find((p) => p.id === id)?.full_name ?? "Unassigned";

  const convertToIssue = (risk: Risk) =>
    convert.mutate({
      risk,
      issue: {
        project_id: projectId,
        title: risk.title,
        action_plan: risk.contingency ? `Contingency: ${risk.contingency}` : null,
        severity: severityFromScore(riskScore(risk)),
        source: `Risk R${risk.ref_number}`,
        risk_id: risk.id,
        owner_person_id: risk.owner_person_id,
        due_date: addDays(today, 7),
      },
    });

  return (
    <section className="min-w-0 flex-[999_1_680px] border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border px-4 py-3.5">
        <div>
          <h2 className="text-base font-extrabold">Risk register</h2>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
        {headerAction}
      </div>
      {(updateRisk.error || convert.error) && (
        <div className="px-4 pt-3">
          <ErrorMessage error={(updateRisk.error ?? convert.error)!} />
        </div>
      )}

      {risks.length === 0 ? (
        <div className="p-4">
          <Empty message="No risks here. Add one, or review the suggestions above." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-255 text-sm">
            <div className={`grid ${COLUMNS} border-b border-border text-xs font-extrabold text-muted [&>div]:px-3 [&>div]:py-2.5`}>
              <div>ID</div>
              <div>Risk and trigger</div>
              <div>WBS</div>
              <div>Response</div>
              <div>Score now → after</div>
              <div>Trend</div>
              <div>Owner</div>
              <div>Status</div>
              <div>Review</div>
            </div>
            {risks.map((risk) => {
              const open = expanded === risk.id;
              const closed = risk.status === "closed";
              const overdue = !closed && !!risk.review_date && risk.review_date < today;
              const trend = TREND[riskTrend(risk)];
              const wbsRow = risk.wbs_item_id ? wbs.byId.get(risk.wbs_item_id) : undefined;
              return (
                <Fragment key={risk.id}>
                  <div className={`grid ${COLUMNS} items-center border-b border-border [&>div]:px-3 [&>div]:py-2.5 ${closed ? "opacity-55" : ""} ${open ? "bg-background" : ""}`}>
                    <div className="font-extrabold text-muted">R{risk.ref_number}</div>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : risk.id)}
                        aria-expanded={open}
                        className="flex items-start gap-1 text-left font-extrabold hover:text-primary"
                      >
                        {open ? <ChevronDown className="mt-0.5 size-4 shrink-0" aria-hidden /> : <ChevronRight className="mt-0.5 size-4 shrink-0" aria-hidden />}
                        {risk.title}
                      </button>
                      {risk.trigger_sign && <p className="mt-0.5 pl-5 text-xs text-muted">Trigger: {risk.trigger_sign}</p>}
                    </div>
                    <div className="font-extrabold text-project-blue">{wbsRow?.code ?? "-"}</div>
                    <div>
                      <span className="bg-background px-2 py-0.5 text-[11px] font-extrabold">{RESPONSE_LABELS[risk.response]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ScoreBadge score={riskScore(risk)} />
                      <span className="text-muted">→</span>
                      <ScoreBadge score={residualScore(risk)} />
                    </div>
                    <div className={`text-base font-black ${trend.className}`} title={trend.label}>
                      <span aria-label={trend.label}>{trend.icon}</span>
                    </div>
                    <div className="truncate">{personName(risk.owner_person_id)}</div>
                    <div>
                      <button
                        type="button"
                        onClick={() => updateRisk.mutate({ id: risk.id, input: { status: NEXT_STATUS[risk.status] } })}
                        aria-label={`Status ${STATUS_LABELS[risk.status]}. Change to ${STATUS_LABELS[NEXT_STATUS[risk.status]]}`}
                        className="h-8 border border-border bg-surface px-2.5 text-xs font-bold hover:bg-accent"
                      >
                        {STATUS_LABELS[risk.status]}
                      </button>
                    </div>
                    <div className={`font-bold ${overdue ? "text-danger" : ""}`}>
                      {risk.review_date ? formatDate(risk.review_date) : "-"}
                      {overdue && <span className="block text-[11px]">overdue</span>}
                    </div>
                  </div>
                  {open && (
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5 border-b border-border bg-background py-3.5 pr-4 pl-15">
                      <Detail label="Response plan">{risk.response_plan}</Detail>
                      <Detail label="Contingency (if it happens)">{risk.contingency}</Detail>
                      <Detail label="Impact if it happens">{risk.impact_note}</Detail>
                      <Detail label="Category · threatens">
                        {CATEGORY_LABELS[risk.category]} · {wbsRow ? `${wbsRow.code} ${wbsRow.item.name}` : "Whole project"}
                      </Detail>
                      <div className="col-span-full flex flex-wrap gap-2">
                        <Button variant="secondary" icon={Pencil} onClick={() => onEdit(risk)}>
                          Edit
                        </Button>
                        {!closed && (
                          <Button variant="ghost" onClick={() => convertToIssue(risk)} loading={convert.isPending}>
                            It happened: convert to issue
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
