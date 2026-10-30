import { riskScore, riskTrend } from "@/lib/risk-scoring";
import type { Issue, Risk } from "@/types/database";

type RiskSummaryProps = {
  openRisks: Risk[];
  issues: Issue[];
  today: string;
};

const Card = ({ label, value, hint, tone = "text-foreground" }: { label: string; value: string | number; hint: string; tone?: string }) => (
  <div className="flex flex-col gap-0.5 border border-border bg-surface px-4 py-3">
    <span className="text-xs font-extrabold text-muted">{label}</span>
    <b className={`text-2xl ${tone}`}>{value}</b>
    <span className="text-xs text-muted">{hint}</span>
  </div>
);

export const RiskSummary = ({ openRisks, issues, today }: RiskSummaryProps) => {
  const exposure = openRisks.reduce((sum, r) => sum + riskScore(r), 0);
  const rising = openRisks.filter((r) => riskTrend(r) === "up").length;
  const falling = openRisks.filter((r) => riskTrend(r) === "down").length;
  const severe = openRisks.filter((r) => riskScore(r) >= 10);
  const overdue = openRisks.filter((r) => r.review_date && r.review_date < today);
  const openIssues = issues.filter((i) => i.status === "open").length;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
      <Card
        label="Risk exposure"
        value={exposure}
        hint={rising || falling ? `${rising} rising · ${falling} falling in the last 2 weeks` : "Total score of open risks"}
        tone={rising > falling ? "text-danger" : "text-foreground"}
      />
      <Card
        label="Critical or high"
        value={severe.length}
        hint={severe.length ? "Need a sponsor update this week" : "None right now"}
        tone={severe.length ? "text-danger" : "text-success"}
      />
      <Card
        label="Reviews overdue"
        value={overdue.length}
        hint={overdue.length ? `${overdue.map((r) => `R${r.ref_number}`).join(", ")} past their review date` : "All reviews on time"}
        tone={overdue.length ? "text-danger" : "text-success"}
      />
      <Card label="Open issues" value={openIssues} hint="Risks that have already happened" />
    </div>
  );
};
