"use client";

import { useState } from "react";
import { TagInput } from "@/components/ui/tag-input";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { monthLabel } from "@/lib/expense-review";
import { formatMoney } from "@/lib/format";

// Project colors first, then the extra chart colors. Every line also has a
// named legend button, so color is never the only cue.
const SERIES_COLORS = [
  "var(--project-magenta)",
  "var(--project-blue)",
  "var(--project-teal)",
  "var(--project-amber)",
  "var(--project-violet)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
  "var(--chart-9)",
  "var(--chart-10)",
];
// The same colors as a left border on each picked service's pill.
const SERIES_BORDERS = [
  "border-project-magenta",
  "border-project-blue",
  "border-project-teal",
  "border-project-amber",
  "border-project-violet",
  "border-chart-6",
  "border-chart-7",
  "border-chart-8",
  "border-chart-9",
  "border-chart-10",
];
export type TrendSeries = {
  id: string;
  name: string;
  /** One value per month; null = not billed that month. */
  values: (number | null)[];
  /** One entry per month; true = went up (or started) from the month before. */
  up: boolean[];
  /** One entry per month; the remark for that month, if any. */
  remarks: string[];
};

type TrendChartProps = {
  months: string[];
  series: TrendSeries[];
  /** The services drawn at first; more can be added in the search box. */
  initialIds: string[];
  height?: number;
};

type TooltipEntry = { dataKey?: string | number; value?: number | null; color?: string };

/** One line chart with a line per service; pick which services to draw in the search box. */
export const TrendChart = ({ months, series, initialIds, height = 340 }: TrendChartProps) => {
  const [shownIds, setShownIds] = useState<string[]>(initialIds);
  const indexOf = new Map(series.map((s, i) => [s.id, i]));
  const colorOf = new Map(series.map((s, i) => [s.id, SERIES_COLORS[i % SERIES_COLORS.length]]));
  const visible = series.filter((s) => shownIds.includes(s.id));
  const byId = new Map(series.map((s) => [s.id, s]));
  const data = months.map((month, i) => {
    const row: Record<string, string | number | null> = { label: monthLabel(month, "axis") };
    for (const s of visible) row[s.id] = s.values[i];
    return row;
  });


  const TooltipContent = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    const index = data.findIndex((d) => d.label === label);
    return (
      <div className="max-w-80 border border-border bg-surface px-3 py-2.5 text-sm shadow-lg shadow-ink/15">
        <b className="mb-1 block">{monthLabel(months[index])}</b>
        {payload
          .filter((p) => p.value !== null && p.value !== undefined)
          .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
          .map((p) => {
            const s = byId.get(String(p.dataKey))!;
            const remark = s.remarks[index];
            return (
              <div key={s.id} className="py-0.5">
                <div className="flex items-center gap-2">
                  <span className="h-0.5 w-3.5 shrink-0" style={{ background: p.color }} aria-hidden />
                  <span className={`flex-1 truncate ${s.up[index] ? "font-bold text-danger" : ""}`}>{s.name}</span>
                  <b>{formatMoney(p.value ?? 0)}</b>
                </div>
                {remark && <p className="pl-5.5 text-xs text-muted italic">“{remark}”</p>}
              </div>
            );
          })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <TagInput
        id="trend-services"
        label={`Services on the chart (${visible.length} of ${series.length})`}
        options={series.map((s) => ({
          value: s.id,
          label: s.name,
          className: `border-l-4 bg-background text-foreground ${SERIES_BORDERS[(indexOf.get(s.id) ?? 0) % SERIES_BORDERS.length]}`,
        }))}
        value={shownIds}
        onChange={setShownIds}
        placeholder="Type a service name to add its line"
        emptyText="No service matches"
      />
      {months.length < 2 && (
        <p className="text-xs text-muted">Only one month so far: each service is a single point. Lines appear after next month&apos;s statement.</p>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
            <YAxis tickFormatter={(v: number) => formatMoney(v, true)} tick={{ fontSize: 12, fill: "var(--muted)" }} tickLine={false} axisLine={false} width={72} />
            <Tooltip content={<TooltipContent />} cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }} />
            {visible.map((s) => {
              const color = colorOf.get(s.id)!;
              return (
                <Line
                  key={s.id}
                  type="linear"
                  dataKey={s.id}
                  name={s.name}
                  stroke={color}
                  strokeWidth={2}
                  connectNulls={false}
                  isAnimationActive={false}
                  activeDot={{ r: 6, stroke: "var(--surface)", strokeWidth: 2 }}
                  dot={(props: { cx?: number; cy?: number; index?: number; value?: number | null }) => {
                    const i = props.index ?? 0;
                    const key = `${s.id}-${i}`;
                    if (props.cx === undefined || props.cy === undefined || props.value === null || props.value === undefined) return <g key={key} />;
                    // Filled red point = went up from the month before.
                    return s.up[i] ? (
                      <circle key={key} cx={props.cx} cy={props.cy} r={5} fill="var(--danger)" stroke="var(--surface)" strokeWidth={1.5} />
                    ) : (
                      <circle key={key} cx={props.cx} cy={props.cy} r={3.5} fill="var(--surface)" stroke={color} strokeWidth={2} />
                    );
                  }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/** Tiny inline trend line for table rows. */
export const Sparkline = ({ values, label, alert = false }: { values: (number | null)[]; label: string; alert?: boolean }) => {
  const nums = values.map((v) => v ?? 0);
  if (nums.length < 2) nums.push(nums[0] ?? 0);
  const max = Math.max(...nums);
  const min = Math.min(...nums);
  const span = max - min || max || 1;
  const points = nums.map((v, i) => `${Math.round((i * 86) / (nums.length - 1)) + 2},${26 - Math.round(((v - min) / span) * 22)}`).join(" ");
  return (
    <svg viewBox="0 0 90 28" width={90} height={28} role="img" aria-label={label} className="overflow-visible">
      <polyline points={points} fill="none" className={alert ? "stroke-danger" : "stroke-primary"} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
};
