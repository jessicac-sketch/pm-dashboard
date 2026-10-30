"use client";

import { ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/query-state";
import { Select } from "@/components/ui/select";
import { useCreateRisk, useUpdateRisk } from "@/hooks/queries/use-risks";
import { addDays } from "@/lib/dates";
import { CATEGORY_LABELS, IMPACT_SCALE, PROBABILITY_SCALE, RESPONSE_LABELS, STATUS_LABELS } from "@/lib/risk-scoring";
import type { RiskDraft } from "@/lib/risk-suggestions";
import type { WbsSummary } from "@/lib/wbs";
import type { Person, Risk, RiskCategory, RiskResponse, RiskStatus } from "@/types/database";
import { ScoreBadge } from "./score-badge";

const options = <T extends string,>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));

const ScorePicker = ({ label, hint, value, onChange }: { label: string; hint: string; value: number; onChange: (v: number) => void }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-sm font-semibold">
      {label} <span className="font-normal text-muted">· {hint}</span>
    </span>
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          onClick={() => onChange(n)}
          className={`size-9 border text-sm font-extrabold ${value === n ? "border-ink bg-ink text-primary-foreground" : "border-border bg-surface hover:bg-accent"}`}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
);

type RiskFormDialogProps = {
  projectId: string;
  people: Person[];
  wbs: WbsSummary;
  today: string;
  /** Edit this risk; otherwise create a new one, optionally prefilled from a suggestion. */
  risk?: Risk;
  draft?: RiskDraft;
  onClose: () => void;
};

export const RiskFormDialog = ({ projectId, people, wbs, today, risk, draft, onClose }: RiskFormDialogProps) => {
  const createRisk = useCreateRisk(projectId);
  const updateRisk = useUpdateRisk(projectId);
  const source = risk ?? draft;
  const [form, setForm] = useState({
    title: source?.title ?? "",
    category: (source?.category ?? "technical") as RiskCategory,
    wbsItemId: source?.wbs_item_id ?? "",
    probability: source?.probability ?? 3,
    impact: source?.impact ?? 3,
    residualProbability: source?.residual_probability ?? 2,
    residualImpact: source?.residual_impact ?? 2,
    response: (source?.response ?? "mitigate") as RiskResponse,
    triggerSign: source?.trigger_sign ?? "",
    responsePlan: source?.response_plan ?? "",
    contingency: source?.contingency ?? "",
    impactNote: source?.impact_note ?? "",
    ownerId: source?.owner_person_id ?? "",
    status: (risk?.status ?? "open") as RiskStatus,
    reviewDate: risk?.review_date ?? addDays(today, 14),
  });
  const set = <K extends keyof typeof form,>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const mutation = risk ? updateRisk : createRisk;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = {
      title: form.title.trim(),
      category: form.category,
      wbs_item_id: form.wbsItemId || null,
      probability: form.probability,
      impact: form.impact,
      residual_probability: form.residualProbability,
      residual_impact: form.residualImpact,
      response: form.response,
      trigger_sign: form.triggerSign.trim() || null,
      response_plan: form.responsePlan.trim() || null,
      contingency: form.contingency.trim() || null,
      impact_note: form.impactNote.trim() || null,
      owner_person_id: form.ownerId || null,
      review_date: form.reviewDate || null,
    };
    if (risk) {
      updateRisk.mutate({ id: risk.id, input: { ...input, status: form.status } }, { onSuccess: onClose });
    } else {
      createRisk.mutate({ ...input, project_id: projectId, suggestion_key: draft?.suggestion_key ?? null }, { onSuccess: onClose });
    }
  };

  const wbsOptions = [
    { value: "", label: "Whole project" },
    ...wbs.rows.filter((r) => !r.isPhase).map((r) => ({ value: r.item.id, label: `${r.code} ${r.item.name}` })),
  ];
  const ownerOptions = [{ value: "", label: "Unassigned" }, ...people.map((p) => ({ value: p.id, label: p.full_name }))];

  return (
    <Dialog open onClose={onClose} title={risk ? `Edit R${risk.ref_number}` : "New risk"} description="Describe it as a cause and its effect, then plan the response.">
      <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
        <Input
          id="risk-title"
          label="Risk"
          placeholder="e.g. If the API vendor changes pricing, enrichment costs exceed budget"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          required
          autoFocus
        />
        <div className="flex flex-wrap items-end gap-4">
          <ScorePicker label="Probability" hint={PROBABILITY_SCALE[form.probability - 1].label} value={form.probability} onChange={(v) => set("probability", v)} />
          <ScorePicker label="Impact" hint={IMPACT_SCALE[form.impact - 1].schedule} value={form.impact} onChange={(v) => set("impact", v)} />
          <span className="flex items-center gap-1.5 pb-2 text-sm">
            Now <ScoreBadge score={form.probability * form.impact} showBand />
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select id="risk-response" label="Response" options={options(RESPONSE_LABELS)} value={form.response} onChange={(e) => set("response", e.target.value as RiskResponse)} />
          <Select id="risk-category" label="Category" options={options(CATEGORY_LABELS)} value={form.category} onChange={(e) => set("category", e.target.value as RiskCategory)} />
          <Select id="risk-wbs" label="Threatens" options={wbsOptions} value={form.wbsItemId} onChange={(e) => set("wbsItemId", e.target.value)} />
          <Select id="risk-owner" label="Owner" options={ownerOptions} value={form.ownerId} onChange={(e) => set("ownerId", e.target.value)} />
        </div>
        <Input id="risk-trigger" label="Trigger (early warning sign)" value={form.triggerSign} onChange={(e) => set("triggerSign", e.target.value)} />
        <Input id="risk-plan" label="Response plan" placeholder="What will we do, and by when?" value={form.responsePlan} onChange={(e) => set("responsePlan", e.target.value)} />
        <Input id="risk-contingency" label="Contingency (if it happens)" value={form.contingency} onChange={(e) => set("contingency", e.target.value)} />
        <Input id="risk-impact-note" label="Impact if it happens (optional)" placeholder="e.g. About +5 days to go-live" value={form.impactNote} onChange={(e) => set("impactNote", e.target.value)} />
        <div className="flex flex-wrap items-end gap-4 border-t border-border pt-4">
          <ScorePicker label="After response: probability" hint={PROBABILITY_SCALE[form.residualProbability - 1].label} value={form.residualProbability} onChange={(v) => set("residualProbability", v)} />
          <ScorePicker label="After response: impact" hint={IMPACT_SCALE[form.residualImpact - 1].schedule} value={form.residualImpact} onChange={(v) => set("residualImpact", v)} />
          <span className="flex items-center gap-1.5 pb-2 text-sm">
            After <ScoreBadge score={form.residualProbability * form.residualImpact} showBand />
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input id="risk-review" label="Next review" type="date" value={form.reviewDate} onChange={(e) => set("reviewDate", e.target.value)} />
          {risk && <Select id="risk-status" label="Status" options={options(STATUS_LABELS)} value={form.status} onChange={(e) => set("status", e.target.value as RiskStatus)} />}
        </div>

        {mutation.error && <ErrorMessage error={mutation.error} />}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" icon={ShieldAlert} loading={mutation.isPending} disabled={!form.title.trim()}>
            {risk ? "Save risk" : "Add risk"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
