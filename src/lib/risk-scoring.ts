import type { IssueSeverity, Risk, RiskCategory, RiskResponse, RiskStatus } from "@/types/database";

// Probability × impact scoring on a 5×5 grid, with the bands and scales from
// the project's scoring guide. Keep these in one place so every screen agrees.

export type RiskBand = "low" | "medium" | "high" | "critical";

export const riskBand = (score: number): RiskBand =>
  score >= 15 ? "critical" : score >= 10 ? "high" : score >= 5 ? "medium" : "low";

export const BAND_LABELS: Record<RiskBand, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

/** Background + text classes for each band (tokens in globals.css). */
export const BAND_CLASSES: Record<RiskBand, string> = {
  low: "bg-risk-low text-risk-low-fg",
  medium: "bg-risk-medium text-risk-medium-fg",
  high: "bg-risk-high text-risk-high-fg",
  critical: "bg-risk-critical text-risk-critical-fg",
};

export const BAND_RULES: { band: RiskBand; range: string; rule: string; review: string }[] = [
  { band: "critical", range: "15-25", rule: "Response plan required now. Raise with the sponsor in this week's update.", review: "Review weekly" },
  { band: "high", range: "10-14", rule: "Response plan and named owner required.", review: "Review every 2 weeks" },
  { band: "medium", range: "5-9", rule: "Owner monitors the trigger; plan optional.", review: "Review monthly" },
  { band: "low", range: "1-4", rule: "Usually accepted; keep on the register.", review: "Review at phase end" },
];

export const PROBABILITY_SCALE = [
  { score: 1, label: "Rare", range: "under 10%" },
  { score: 2, label: "Unlikely", range: "10-30%" },
  { score: 3, label: "Possible", range: "30-50%" },
  { score: 4, label: "Likely", range: "50-70%" },
  { score: 5, label: "Almost certain", range: "over 70%" },
] as const;

export const IMPACT_SCALE = [
  { score: 1, schedule: "Under 1 day", budget: "Under 1%", scope: "Barely noticeable" },
  { score: 2, schedule: "1-3 days", budget: "1-5%", scope: "Minor feature affected" },
  { score: 3, schedule: "About 1 week", budget: "5-10%", scope: "A deliverable needs rework" },
  { score: 4, schedule: "2+ weeks", budget: "10-20%", scope: "Key feature cut or delayed" },
  { score: 5, schedule: "Misses go-live", budget: "Over 20%", scope: "Project goal not met" },
] as const;

export const RESPONSE_LABELS: Record<RiskResponse, string> = {
  mitigate: "Mitigate",
  avoid: "Avoid",
  transfer: "Transfer",
  accept: "Accept",
};

export const CATEGORY_LABELS: Record<RiskCategory, string> = {
  resourcing: "Resourcing",
  technical: "Technical",
  scope: "Scope",
  schedule: "Schedule",
  compliance: "Compliance",
  budget: "Budget",
  other: "Other",
};

export const STATUS_LABELS: Record<RiskStatus, string> = {
  open: "Open",
  mitigating: "Mitigating",
  closed: "Closed",
};

export const NEXT_STATUS: Record<RiskStatus, RiskStatus> = {
  open: "mitigating",
  mitigating: "closed",
  closed: "open",
};

export const riskScore = (r: Pick<Risk, "probability" | "impact">) => r.probability * r.impact;
export const residualScore = (r: Pick<Risk, "residual_probability" | "residual_impact">) =>
  r.residual_probability * r.residual_impact;

export type RiskTrend = "up" | "down" | "flat";

/** Up/down if the score changed in the last two weeks, otherwise flat. */
export const riskTrend = (r: Risk, now = new Date()): RiskTrend => {
  if (r.previous_score === null || !r.score_changed_at) return "flat";
  const ageDays = (now.getTime() - new Date(r.score_changed_at).getTime()) / 86_400_000;
  if (ageDays > 14) return "flat";
  const score = riskScore(r);
  return score > r.previous_score ? "up" : score < r.previous_score ? "down" : "flat";
};

/** Issues inherit the band of the risk they came from. */
export const severityFromScore = (score: number): IssueSeverity => riskBand(score);
