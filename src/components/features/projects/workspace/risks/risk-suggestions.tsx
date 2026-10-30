"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDismissSuggestion } from "@/hooks/queries/use-risks";
import type { RiskDraft, RiskSuggestion } from "@/lib/risk-suggestions";
import { ScoreBadge } from "./score-badge";

type RiskSuggestionsProps = {
  projectId: string;
  suggestions: RiskSuggestion[];
  onReview: (draft: RiskDraft) => void;
};

export const RiskSuggestions = ({ projectId, suggestions, onReview }: RiskSuggestionsProps) => {
  const dismiss = useDismissSuggestion(projectId);
  if (suggestions.length === 0) return null;

  return (
    <section className="border border-l-4 border-border border-l-primary bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="size-4 text-primary" aria-hidden />
        <div>
          <h2 className="text-[15px] font-extrabold">Suggested from your data</h2>
          <p className="text-xs text-muted">Spotted in the team, Resources and the WBS. Review the ones that matter; dismiss the rest.</p>
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
        {suggestions.map((s) => (
          <div key={s.key} className="flex flex-col gap-2 border-r border-b border-border px-4 py-3.5">
            <span className="self-start bg-background px-2 py-0.5 text-[11px] font-extrabold">{s.source}</span>
            <p className="text-sm text-foreground/80">{s.signal}</p>
            <b className="text-sm">{s.draft.title}</b>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              Suggested score <ScoreBadge score={s.draft.probability * s.draft.impact} showBand />
            </span>
            <div className="mt-auto flex gap-1.5 pt-1">
              <Button onClick={() => onReview(s.draft)}>
                Review and add
              </Button>
              <Button variant="secondary" onClick={() => dismiss.mutate(s.key)} disabled={dismiss.isPending}>
                Dismiss
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
