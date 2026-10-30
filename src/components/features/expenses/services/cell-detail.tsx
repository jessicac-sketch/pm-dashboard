"use client";

import { CircleSlash, Undo2, X } from "lucide-react";
import { useSetRemarkDismissed } from "@/hooks/queries/use-expenses";
import { chargeMonth, monthLabel, needsRemark, shiftMonth } from "@/lib/expense-review";
import { formatDate, formatMoney } from "@/lib/format";
import type { ServiceWithProjects } from "@/services/expense-services.service";
import { signedMoney } from "../change-badge";
import type { ExpenseView } from "../expense-view";
import { RemarkInput } from "../remark-input";
import type { ServiceCell } from "./service-row";

type CellDetailProps = { view: ExpenseView; service: ServiceWithProjects; cell: ServiceCell; onClose: () => void };

const describe = (c: ServiceCell) => {
  const prev = monthLabel(shiftMonth(c.month, -1));
  switch (c.kind) {
    case "up":
      return `Went up ${signedMoney(c.diff)} from ${prev} (${formatMoney(c.last!)} to ${formatMoney(c.now!)})`;
    case "down":
      return `Went down ${signedMoney(c.diff)} from ${prev} (${formatMoney(c.last!)} to ${formatMoney(c.now!)})`;
    case "new":
      return `New this month: ${formatMoney(c.now!)}`;
    case "missing":
      return `Not billed (was ${formatMoney(c.last!)} in ${prev})`;
    case "first":
      return `First month on record: ${formatMoney(c.now!)}`;
    default:
      return `No change: ${formatMoney(c.now ?? 0)}`;
  }
};

/** Inline panel for one service in one month: what changed, the remark, and the charges. */
export const CellDetail = ({ view, service, cell, onClose }: CellDetailProps) => {
  const charges = view.charges.filter((e) => e.service_id === service.id && chargeMonth(e) === cell.month);
  const needs = needsRemark(cell.kind);
  const required = needs && !cell.dismissed;
  const dismiss = useSetRemarkDismissed();

  return (
    <div className="sticky left-0 grid gap-6 border-b border-l-4 border-border border-l-primary bg-accent px-4 py-4 md:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <b className="text-[15px]">
            {service.name} · {monthLabel(cell.month)}
          </b>
          <span className={`text-sm font-extrabold ${needs ? "text-danger" : cell.kind === "down" || cell.kind === "missing" ? "text-success" : "text-muted"}`}>
            {describe(cell)}
          </span>
        </div>
        <span className="text-xs font-extrabold text-foreground">
          {!required ? "Remark (optional)" : cell.kind === "up" ? "Why did it go up? (required)" : "What is this service for? (required)"}
        </span>
        <RemarkInput
          serviceId={service.id}
          serviceName={service.name}
          month={cell.month}
          value={cell.remark}
          required={required}
          placeholder={cell.kind === "new" ? "e.g. AI IDE for the developers" : cell.kind === "up" ? "e.g. Added 2 seats for the new interns" : "Optional note"}
          autoFocus={required && !cell.remark}
        />
        {needs && !cell.remark.trim() && (
          <button
            type="button"
            disabled={dismiss.isPending}
            onClick={() => dismiss.mutate({ serviceId: service.id, month: cell.month, dismissed: !cell.dismissed })}
            className="inline-flex w-fit items-center gap-1 text-xs font-bold text-muted hover:text-primary disabled:opacity-50"
          >
            {cell.dismissed ? <Undo2 className="size-3.5" aria-hidden /> : <CircleSlash className="size-3.5" aria-hidden />}
            {cell.dismissed ? "Marked as no remark needed · Undo" : "No remark needed"}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black tracking-wide text-muted uppercase">Charges in {monthLabel(cell.month)}</span>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-7 items-center justify-center text-muted hover:bg-secondary hover:text-foreground">
            <X className="size-4" aria-hidden />
          </button>
        </div>
        {charges.length === 0 ? (
          <span className="text-sm text-muted">Not billed this month.</span>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {charges
              .sort((a, b) => a.occurred_on.localeCompare(b.occurred_on))
              .map((e) => (
                <li key={e.id} title={e.statement_name ?? e.service_name} className="border border-border bg-surface px-2 py-0.5 text-xs">
                  <span className="text-muted">{formatDate(e.occurred_on)}</span> <b>{formatMoney(Number(e.amount))}</b>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};
