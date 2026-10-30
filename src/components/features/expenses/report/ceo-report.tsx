"use client";

import { AlertTriangle, CheckCircle2, ClipboardCopy, Printer, Send, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/query-state";
import { Select } from "@/components/ui/select";
import { useSentReports, useSetReportSent } from "@/hooks/queries/use-expenses";
import { buildReport, isRemarkPending, monthLabel, reportSummaryText, reviewMonth, shiftMonth, type ReviewItem } from "@/lib/expense-review";
import { formatDate, formatMoney } from "@/lib/format";
import type { ExpenseView } from "../expense-view";
import { ProjectPill } from "../project-pill";

const signed = (n: number) => `${n >= 0 ? "+" : "-"}${formatMoney(Math.abs(n))}`;

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h3 className="mb-2.5 text-[13px] font-black tracking-[0.06em] text-primary uppercase">{title}</h3>
    {children}
  </section>
);

const RemarkText = ({ item }: { item: ReviewItem }) =>
  item.remark ? <span>{item.remark}</span> : item.dismissed ? null : <span className="font-bold text-danger">Reason not added yet</span>;

export const CeoReport = ({ view }: { view: ExpenseView }) => {
  const { services, projects, totals, remarks, dismissed, months, firstMonth, latest } = view;
  const setSent = useSetReportSent();
  const sent = useSentReports();
  const [copied, setCopied] = useState(false);
  const [picked, setPicked] = useState(latest);
  const month = months.includes(picked) ? picked : latest;
  const items = useMemo(() => reviewMonth(services, totals, remarks, month, firstMonth, dismissed), [services, totals, remarks, month, firstMonth, dismissed]);
  const report = useMemo(() => buildReport(services, projects, totals, items, month), [services, projects, totals, items, month]);
  const pendingRemarks = items.filter((i) => isRemarkPending(i.kind, i.remark, i.dismissed)).length;
  const sentAt = sent.data?.get(month);
  const blocked = pendingRemarks > 0;
  const isFirst = month <= firstMonth;
  const prev = shiftMonth(report.month, -1);
  const maxAmount = Math.max(1, ...report.groups.flatMap((g) => g.rows.map((r) => r.amount)));
  const diff = report.total - report.previousTotal;

  const copy = async () => {
    await navigator.clipboard.writeText(reportSummaryText(report));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };


  return (
    <div className="mx-auto flex w-full max-w-225 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-44">
          <Select
            id="report-month"
            label="Report month"
            hideLabel
            options={[...months].reverse().map((m) => ({ value: m, label: monthLabel(m) }))}
            value={month}
            onChange={(e) => setPicked(e.target.value)}
          />
        </div>
        {sentAt ? (
          <span className="flex items-center gap-1.5 bg-success/10 px-3 py-2 text-sm font-bold text-success">
            <CheckCircle2 className="size-4" aria-hidden />
            Marked as sent {formatDate(sentAt.slice(0, 10))}
          </span>
        ) : blocked ? (
          <span className="flex items-center gap-1.5 bg-danger/10 px-3 py-2 text-sm font-bold text-danger">
            <AlertTriangle className="size-4" aria-hidden />
            {pendingRemarks} {pendingRemarks === 1 ? "increase needs" : "increases need"} a remark. They show as pending in the report.
          </span>
        ) : (
          <span className="flex items-center gap-1.5 bg-success/10 px-3 py-2 text-sm font-bold text-success">
            <CheckCircle2 className="size-4" aria-hidden />
            Every change is explained. Ready to send.
          </span>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="secondary" icon={ClipboardCopy} onClick={copy}>
            {copied ? "Copied" : "Copy summary"}
          </Button>
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
            Print / Save as PDF
          </Button>
          {sentAt ? (
            <Button variant="ghost" onClick={() => setSent.mutate({ month: report.month, sent: false })} loading={setSent.isPending}>
              Undo sent
            </Button>
          ) : (
            <Button icon={Send} disabled={blocked} onClick={() => setSent.mutate({ month: report.month, sent: true })} loading={setSent.isPending}>
              Mark as sent to CEO
            </Button>
          )}
        </div>
      </div>
      {setSent.error && <ErrorMessage error={setSent.error} />}

      <article aria-label="CEO expense report" className="print-area flex flex-col gap-7 border border-border bg-surface px-12 py-10 shadow-lg shadow-ink/5">
        <header className="border-b-3 border-primary pb-4">
          <p className="text-xs font-black tracking-[0.14em] text-primary">NTV360 · SERVICES &amp; SUBSCRIPTIONS</p>
          <h2 className="mt-1 text-[26px] font-black">Expense report: {monthLabel(report.month)}</h2>
          <p className="text-sm text-muted">Amex corporate card · {isFirst ? "first month on record" : `compared with ${monthLabel(prev)}`}</p>
        </header>

        <Section title="Summary">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { label: "Total spend", value: formatMoney(report.total), hint: `${signed(diff)} vs ${monthLabel(prev, "short")}` },
              { label: "Went up", value: String(report.ups.length), hint: signed(report.ups.reduce((a, i) => a + i.diff, 0)) },
              { label: "Went down", value: String(report.downs.length), hint: signed(report.downs.reduce((a, i) => a + i.diff, 0)) },
              { label: "R&D / POC", value: formatMoney(report.rndTotal), hint: report.total ? `${Math.round((report.rndTotal / report.total) * 100)}% of spend` : "-" },
            ].map((k) => (
              <div key={k.label} className="border border-border p-3">
                <div className="text-[11px] font-extrabold text-muted">{k.label}</div>
                <div className="text-xl font-black">{k.value}</div>
                <div className="text-[11px] text-muted">{k.hint}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm leading-relaxed">{report.narrative}</p>
        </Section>

        <Section title="Where the money goes">
          {report.groups.map((g) => (
            <div key={g.key} className="mb-2">
              <div className="flex justify-between border-b-2 border-foreground py-2 text-sm font-black">
                <span>{g.title}</span>
                <span>
                  {formatMoney(g.total)} · {report.total ? Math.round((g.total / report.total) * 100) : 0}%
                </span>
              </div>
              {g.rows.map((r) => (
                <div key={r.id} className="grid grid-cols-[1.2fr_1.3fr_100px_110px] items-center gap-2.5 border-b border-border py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-1.5">
                    {r.project ? <ProjectPill project={r.project} /> : null}
                    <span className="truncate">{r.project?.name ?? "Company-wide tools"}</span>
                  </span>
                  <div className="h-2.5 bg-background">
                    <div className={`h-2.5 ${g.key === "rnd" ? "bg-muted" : g.key === "company" ? "bg-border" : "bg-primary"}`} style={{ width: `${(r.amount / maxAmount) * 100}%` }} />
                  </div>
                  <span className="text-right font-extrabold tabular-nums">{formatMoney(r.amount)}</span>
                  <span className={`text-right text-xs font-extrabold ${r.diff > 0.5 ? "text-danger" : r.diff < -0.5 ? "text-success" : "text-muted"}`}>
                    {Math.abs(r.diff) < 0.5 ? (
                      "no change"
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        {r.diff > 0 ? <TrendingUp className="size-3.5" aria-hidden /> : <TrendingDown className="size-3.5" aria-hidden />}
                        {formatMoney(Math.abs(r.diff), true)}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ))}
          <p className="text-[11px] text-muted">A service used by several projects is split evenly between them. Services with no project count as company-wide.</p>
        </Section>

        <Section title="What went up">
          {report.ups.length === 0 && <p className="text-sm text-muted">Nothing went up.</p>}
          {report.ups.map((i) => (
            <div key={i.service.id} className="grid grid-cols-[170px_100px_100px_1fr] gap-2.5 border-b border-border py-2 text-sm">
              <b>{i.service.name}</b>
              <span className="text-right tabular-nums">{formatMoney(i.now)}</span>
              <span className="text-right font-black text-danger tabular-nums">{signed(i.diff)}</span>
              <RemarkText item={i} />
            </div>
          ))}
        </Section>

        <div className="grid gap-6 sm:grid-cols-2">
          <Section title="What went down">
            {report.downs.length === 0 && <p className="text-sm text-muted">Nothing went down.</p>}
            {report.downs.map((i) => (
              <div key={i.service.id} className="flex justify-between gap-2 border-b border-border py-2 text-sm">
                <span>
                  <b>{i.service.name}</b> {i.remark && <span className="text-muted">· {i.remark}</span>}
                </span>
                <span className="font-black whitespace-nowrap text-success">{signed(i.diff)}</span>
              </div>
            ))}
          </Section>
          <Section title="New & not billed">
            {report.added.length + report.stopped.length === 0 && <p className="text-sm text-muted">No new or stopped services.</p>}
            {report.added.map((i) => (
              <div key={i.service.id} className="flex justify-between gap-2 border-b border-border py-2 text-sm">
                <span>
                  <span className="mr-1.5 bg-secondary px-1.5 text-[11px] font-black text-secondary-foreground">NEW</span>
                  <b>{i.service.name}</b> <span className="text-muted">· </span>
                  <RemarkText item={i} />
                </span>
                <b className="whitespace-nowrap">{formatMoney(i.now)}</b>
              </div>
            ))}
            {report.stopped.map((i) => (
              <div key={i.service.id} className="flex justify-between gap-2 border-b border-border py-2 text-sm">
                <span>
                  <span className="mr-1.5 bg-warning/10 px-1.5 text-[11px] font-black text-warning">NOT BILLED</span>
                  <b>{i.service.name}</b> {i.remark && <span className="text-muted">· {i.remark}</span>}
                </span>
                <span className="whitespace-nowrap text-muted">was {formatMoney(i.last)}</span>
              </div>
            ))}
          </Section>
        </div>
      </article>
    </div>
  );
};
