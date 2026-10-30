"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { riskScore } from "@/lib/risk-scoring";
import type { RiskDraft, RiskSuggestion } from "@/lib/risk-suggestions";
import type { WbsSummary } from "@/lib/wbs";
import type { Issue, Person, Project, Risk } from "@/types/database";
import { IssuesTable } from "./issues-table";
import { cellOf, RiskHeatmap, type HeatCell, type HeatMode } from "./risk-heatmap";
import { RiskFormDialog } from "./risk-form-dialog";
import { RiskRegister } from "./risk-register";
import { RiskSuggestions } from "./risk-suggestions";
import { RiskSummary } from "./risk-summary";
import { ScoringGuide } from "./scoring-guide";

type RiskView = "register" | "issues" | "guide";
type FormState = { key: number; risk?: Risk; draft?: RiskDraft } | null;

type RisksTabProps = {
  project: Project;
  people: Person[];
  risks: Risk[];
  issues: Issue[];
  wbs: WbsSummary;
  suggestions: RiskSuggestion[];
  today: string;
};

export const RisksTab = ({ project, people, risks, issues, wbs, suggestions, today }: RisksTabProps) => {
  const [view, setView] = useState<RiskView>("register");
  const [heatMode, setHeatMode] = useState<HeatMode>("now");
  const [heatCell, setHeatCell] = useState<HeatCell>(null);
  const [form, setForm] = useState<FormState>(null);

  const openRisks = risks.filter((r) => r.status !== "closed");
  const openIssues = issues.filter((i) => i.status === "open").length;
  const filtered = heatCell
    ? openRisks.filter((r) => {
        const c = cellOf(r, heatCell.mode);
        return c.probability === heatCell.probability && c.impact === heatCell.impact;
      })
    : risks;
  // Open first, then highest score.
  const sorted = [...filtered].sort(
    (a, b) => Number(a.status === "closed") - Number(b.status === "closed") || riskScore(b) - riskScore(a),
  );

  const openForm = (next: Omit<NonNullable<FormState>, "key">) => setForm({ key: Date.now(), ...next });

  return (
    <div className="flex flex-col gap-4">
      <RiskSummary openRisks={openRisks} issues={issues} today={today} />

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <SegmentedControl
          label="Risk views"
          options={[
            { value: "register", label: "Risk register" },
            { value: "issues", label: `Issues · ${openIssues}` },
            { value: "guide", label: "Scoring guide" },
          ]}
          value={view}
          onChange={setView}
        />
        <Button icon={Plus} onClick={() => openForm({})}>
          Add risk
        </Button>
      </div>

      {view === "register" && (
        <>
          <RiskSuggestions projectId={project.id} suggestions={suggestions} onReview={(draft) => openForm({ draft })} />
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex max-w-100 flex-[1_1_320px] flex-col gap-4">
              <RiskHeatmap
                openRisks={openRisks}
                mode={heatMode}
                onModeChange={(m) => {
                  setHeatMode(m);
                  setHeatCell(null);
                }}
                selected={heatCell}
                onSelect={setHeatCell}
              />
            </div>
            <RiskRegister
              projectId={project.id}
              risks={sorted}
              people={people}
              wbs={wbs}
              today={today}
              onEdit={(risk) => openForm({ risk })}
              subtitle={
                heatCell
                  ? `Open risks at probability ${heatCell.probability}, impact ${heatCell.impact}${heatCell.mode === "after" ? " (after response)" : ""}`
                  : `${openRisks.length} open · sorted by score · click a risk for its plan, click a status to move it along`
              }
              headerAction={
                heatCell && (
                  <Button variant="secondary" onClick={() => setHeatCell(null)}>
                    Show all
                  </Button>
                )
              }
            />
          </div>
        </>
      )}
      {view === "issues" && <IssuesTable projectId={project.id} issues={issues} people={people} today={today} />}
      {view === "guide" && <ScoringGuide />}

      {form && (
        <RiskFormDialog
          key={form.key}
          projectId={project.id}
          people={people}
          wbs={wbs}
          today={today}
          risk={form.risk}
          draft={form.draft}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  );
};
