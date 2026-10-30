import { BAND_CLASSES, BAND_LABELS, riskBand } from "@/lib/risk-scoring";

export const ScoreBadge = ({ score, showBand = false }: { score: number; showBand?: boolean }) => {
  const band = riskBand(score);
  return (
    <span className={`inline-flex shrink-0 px-2 py-0.5 text-[11px] font-extrabold whitespace-nowrap ${BAND_CLASSES[band]}`}>
      {score}
      {showBand && ` · ${BAND_LABELS[band]}`}
    </span>
  );
};
