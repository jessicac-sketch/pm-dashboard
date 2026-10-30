"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { BAND_CLASSES, BAND_LABELS, riskBand, type RiskBand } from "@/lib/risk-scoring";
import type { Risk } from "@/types/database";

export type HeatMode = "now" | "after";
export type HeatCell = { probability: number; impact: number; mode: HeatMode } | null;

const MODE_OPTIONS = [
  { value: "now", label: "Now" },
  { value: "after", label: "After response" },
] as const;

const LEGEND: RiskBand[] = ["low", "medium", "high", "critical"];

type RiskHeatmapProps = {
  openRisks: Risk[];
  mode: HeatMode;
  onModeChange: (mode: HeatMode) => void;
  selected: HeatCell;
  onSelect: (cell: HeatCell) => void;
};

export const cellOf = (risk: Risk, mode: HeatMode) =>
  mode === "now"
    ? { probability: risk.probability, impact: risk.impact }
    : { probability: risk.residual_probability, impact: risk.residual_impact };

export const RiskHeatmap = ({ openRisks, mode, onModeChange, selected, onSelect }: RiskHeatmapProps) => (
  <section className="flex flex-col gap-3 border border-border bg-surface p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h2 className="text-[15px] font-extrabold">Heat map</h2>
        <p className="text-xs text-muted">Open risks. Click a square to filter.</p>
      </div>
      <SegmentedControl label="Score shown" options={MODE_OPTIONS} value={mode} onChange={onModeChange} />
    </div>

    <div className="grid grid-cols-[22px_1fr] gap-1.5">
      <div className="flex items-center justify-center">
        <span className="-rotate-90 text-[11px] font-extrabold whitespace-nowrap text-muted">PROBABILITY →</span>
      </div>
      <div className="grid grid-cols-5">
        {[5, 4, 3, 2, 1].flatMap((probability) =>
          [1, 2, 3, 4, 5].map((impact) => {
            const count = openRisks.filter((r) => {
              const c = cellOf(r, mode);
              return c.probability === probability && c.impact === impact;
            }).length;
            const isSelected = selected?.probability === probability && selected.impact === impact && selected.mode === mode;
            return (
              <button
                key={`${probability}-${impact}`}
                type="button"
                aria-pressed={isSelected}
                aria-label={`Probability ${probability}, impact ${impact}: ${count} open risks`}
                onClick={() => onSelect(isSelected ? null : { probability, impact, mode })}
                className={`flex aspect-square items-center justify-center border-2 border-surface text-[15px] font-black ${
                  BAND_CLASSES[riskBand(probability * impact)]
                } ${isSelected ? "outline-3 -outline-offset-3 outline-ink" : ""}`}
              >
                {count || ""}
              </button>
            );
          }),
        )}
      </div>
      <div />
      <div className="text-center text-[11px] font-extrabold text-muted">IMPACT →</div>
    </div>

    <div className="flex flex-wrap gap-2.5 text-xs">
      {LEGEND.map((band) => (
        <span key={band} className="inline-flex items-center gap-1.5">
          <span className={`size-3 ${BAND_CLASSES[band].split(" ")[0]}`} aria-hidden />
          {BAND_LABELS[band]}
        </span>
      ))}
    </div>
  </section>
);
