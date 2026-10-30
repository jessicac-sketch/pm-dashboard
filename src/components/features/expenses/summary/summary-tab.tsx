"use client";

import { useMemo } from "react";
import { amountFor, changeFor, monthLabel, needsRemark, reviewMonth, shiftMonth, type ReviewItem } from "@/lib/expense-review";
import { formatMoney } from "@/lib/format";
import { signedMoney } from "../change-badge";
import type { ExpenseView } from "../expense-view";
import { TrendChart, type TrendSeries } from "../trend-chart";

const MAX_LISTED = 5;
const CHART_CATEGORY = "Software Development";
const CHART_START_COUNT = 10;

const MoverList = ({ items, tone, empty }: { items: ReviewItem[]; tone: "up" | "down"; empty: string }) => (
  <ul className="mt-1.5 flex flex-col gap-1 text-sm">
    {items.length === 0 && <li className="text-muted">{empty}</li>}
    {items.slice(0, MAX_LISTED).map((i) => (
      <li key={i.service.id} className="flex justify-between gap-3">
        <span className="truncate">{i.service.name}</span>
        <b className={`whitespace-nowrap ${tone === "up" ? "text-danger" : "text-success"}`}>
          {i.kind === "new" ? `New ${formatMoney(i.now)}` : i.kind === "missing" ? `Not billed ${signedMoney(i.diff)}` : signedMoney(i.diff)}
        </b>
      </li>
    ))}
    {items.length > MAX_LISTED && <li className="text-xs text-muted">and {items.length - MAX_LISTED} more</li>}
  </ul>
);

export const SummaryTab = ({ view }: { view: ExpenseView }) => {
  const { services, months, firstMonth, latest, totals, remarks, dismissed } = view;
  const items = useMemo(() => reviewMonth(services, totals, remarks, latest, firstMonth, dismissed), [services, totals, remarks, latest, firstMonth, dismissed]);
  const ups = items.filter((i) => i.kind === "up" || i.kind === "new").sort((a, b) => b.diff - a.diff);
  const downs = items.filter((i) => i.kind === "down" || i.kind === "missing").sort((a, b) => a.diff - b.diff);
  const total = items.reduce((a, i) => a + i.now, 0);
  const hasPrevious = latest > firstMonth;
  const diff = total - items.reduce((a, i) => a + i.last, 0);

  // Biggest spend first, so the legend reads like the table.
  const series: TrendSeries[] = useMemo(
    () =>
      [...services]
        .sort((a, b) => (amountFor(totals, b.id, latest) ?? 0) - (amountFor(totals, a.id, latest) ?? 0))
        .filter((s) => months.some((m) => amountFor(totals, s.id, m) !== null))
        .map((s) => ({
          id: s.id,
          name: s.name,
          values: months.map((m) => amountFor(totals, s.id, m)),
          up: months.map((m) => needsRemark(changeFor(totals, s.id, m, firstMonth).kind)),
          remarks: months.map((m) => remarks.get(`${s.id}|${m}`) ?? ""),
        })),
    [services, totals, remarks, months, latest, firstMonth],
  );
  // The chart starts with the 10 biggest software services (series is biggest first).
  const softwareIds = new Set(services.filter((s) => s.category === CHART_CATEGORY).map((s) => s.id));
  const initialIds = series.filter((s) => softwareIds.has(s.id)).slice(0, CHART_START_COUNT).map((s) => s.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-[1fr_1.4fr_1.4fr]">
        <div className="border border-border bg-surface px-4 py-3">
          <span className="text-xs font-extrabold text-muted">Total {monthLabel(latest)}</span>
          <b className="block text-[26px]">{formatMoney(total)}</b>
          <span className={`text-xs font-extrabold ${!hasPrevious ? "text-muted" : diff > 0 ? "text-danger" : "text-success"}`}>
            {hasPrevious ? `${signedMoney(diff)} vs ${monthLabel(shiftMonth(latest, -1))}` : "First month on record"}
          </span>
        </div>
        <div className="border border-t-3 border-border border-t-danger bg-surface px-4 py-3">
          <span className="text-xs font-extrabold text-muted">
            Went up in {monthLabel(latest)} · <b className="text-danger">{ups.length}</b>
          </span>
          <MoverList items={ups} tone="up" empty={hasPrevious ? "Nothing went up." : "Nothing to compare with yet."} />
        </div>
        <div className="border border-t-3 border-border border-t-success bg-surface px-4 py-3">
          <span className="text-xs font-extrabold text-muted">
            Went down / not billed in {monthLabel(latest)} · <b className="text-success">{downs.length}</b>
          </span>
          <MoverList items={downs} tone="down" empty={hasPrevious ? "Nothing went down." : "Nothing to compare with yet."} />
        </div>
      </div>

      <section className="border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-base font-extrabold">Monthly trend</h2>
          <p className="text-xs text-muted">
            Starts with the 10 biggest Software Development services. Type any service name in the box to add its line. Red points went up from the month before; hover for amounts and remarks.
          </p>
        </div>
        <div className="p-4">
          <TrendChart key={latest} months={months} series={series} initialIds={initialIds} />
        </div>
      </section>
    </div>
  );
};
