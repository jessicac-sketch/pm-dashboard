import { BAND_CLASSES, BAND_LABELS, BAND_RULES, IMPACT_SCALE, PROBABILITY_SCALE } from "@/lib/risk-scoring";

const Panel = ({ title, subtitle, className = "", children }: { title: string; subtitle?: string; className?: string; children: React.ReactNode }) => (
  <section className={`border border-border bg-surface ${className}`}>
    <div className="border-b border-border px-4 py-3.5">
      <h2 className="text-[15px] font-extrabold">{title}</h2>
      {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
    </div>
    <div className="text-sm [&>div]:border-b [&>div]:border-border [&>div]:px-4 [&>div]:py-2.5 [&>div:last-child]:border-b-0">{children}</div>
  </section>
);

export const ScoringGuide = () => (
  <div className="flex flex-wrap items-start gap-4">
    <Panel title="Probability" subtitle="How likely over the life of the project" className="flex-[1_1_340px]">
      {PROBABILITY_SCALE.map((p) => (
        <div key={p.score} className="grid grid-cols-[40px_1fr_110px]">
          <b>{p.score}</b>
          <span>{p.label}</span>
          <span className="text-muted">{p.range}</span>
        </div>
      ))}
    </Panel>
    <Panel title="Impact" subtitle="Score by the worst of the three columns" className="flex-[2_1_560px]">
      <div className="grid grid-cols-[40px_1fr_1fr_1fr] text-xs font-extrabold text-muted">
        <span>Score</span>
        <span>Schedule</span>
        <span>Budget</span>
        <span>Scope / quality</span>
      </div>
      {IMPACT_SCALE.map((i) => (
        <div key={i.score} className="grid grid-cols-[40px_1fr_1fr_1fr]">
          <b>{i.score}</b>
          <span>{i.schedule}</span>
          <span>{i.budget}</span>
          <span>{i.scope}</span>
        </div>
      ))}
    </Panel>
    <Panel title="What each score band requires" className="flex-[1_1_100%]">
      {BAND_RULES.map((r) => (
        <div key={r.band} className="grid grid-cols-[160px_1fr_160px] items-center gap-2">
          <span className={`justify-self-start px-2 py-0.5 text-[11px] font-extrabold ${BAND_CLASSES[r.band]}`}>
            {BAND_LABELS[r.band]} · {r.range}
          </span>
          <span>{r.rule}</span>
          <span className="text-muted">{r.review}</span>
        </div>
      ))}
    </Panel>
  </div>
);
