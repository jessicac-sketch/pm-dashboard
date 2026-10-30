"use client";

import { MessageCircle, Pencil } from "lucide-react";
import { isRemarkPending, monthLabel, needsRemark, type MonthChange } from "@/lib/expense-review";
import { formatMoney } from "@/lib/format";
import type { ServiceWithProjects } from "@/services/expense-services.service";
import { ChangeBadge } from "../change-badge";
import { categoryName, type ExpenseView } from "../expense-view";
import { ProjectPills } from "../project-pill";
import { Sparkline } from "../trend-chart";
import { CellDetail } from "./cell-detail";
import { ServiceEditor } from "./service-editor";

export type ServiceCell = MonthChange & { remark: string; dismissed: boolean };

type ServiceRowProps = {
  view: ExpenseView;
  service: ServiceWithProjects;
  cells: ServiceCell[];
  cols: string;
  /** "edit", a month ("YYYY-MM"), or null when closed. */
  open: string | null;
  onOpen: (panel: string | null) => void;
};

export const ServiceRow = ({ view, service, cells, cols, open, onOpen }: ServiceRowProps) => {
  const openCell = open && open !== "edit" ? cells.find((c) => c.month === open) : undefined;
  const last = cells[cells.length - 1];

  return (
    <>
      <div className="grid min-w-max border-b border-border bg-surface text-sm" style={{ gridTemplateColumns: cols }}>
        <div className="sticky left-0 z-10 flex flex-col gap-1 border-r border-border bg-surface px-3 py-2">
          <button
            type="button"
            onClick={() => onOpen(open === "edit" ? null : "edit")}
            aria-expanded={open === "edit"}
            className="group flex items-center gap-1.5 text-left"
          >
            <b className="group-hover:text-primary group-hover:underline">{service.name}</b>
            <Pencil className="size-3.5 text-muted" aria-hidden />
          </button>
          <span className={`text-[11px] font-bold ${service.category ? "text-muted" : "text-warning"}`}>{categoryName(service)}</span>
          <ProjectPills projectIds={service.project_ids} projectById={view.projectById} />
        </div>

        {cells.map((c) => {
          const todo = isRemarkPending(c.kind, c.remark, c.dismissed);
          const selected = open === c.month;
          const empty = c.now === null;
          return (
            <button
              key={c.month}
              type="button"
              disabled={!c.kind}
              onClick={() => onOpen(selected ? null : c.month)}
              aria-label={`${service.name}, ${monthLabel(c.month)}: ${empty ? "not billed" : formatMoney(c.now!)}${todo ? ", needs a remark" : ""}`}
              className={`flex flex-col items-end justify-center gap-0.5 border-l-3 px-3 py-2 text-right hover:bg-accent disabled:cursor-default disabled:hover:bg-transparent ${
                todo ? "border-danger bg-danger/5" : "border-transparent"
              } ${selected ? "outline-2 -outline-offset-2 outline-primary" : ""}`}
            >
              <span className={`inline-flex items-center gap-1 font-extrabold tabular-nums ${empty ? "text-border" : ""}`}>
                {c.remark.trim() && <MessageCircle className="size-3.5 text-muted" aria-label="Has a remark" />}
                {empty ? "-" : formatMoney(c.now!)}
              </span>
              <ChangeBadge kind={c.kind} diff={c.diff} />
            </button>
          );
        })}

        <div className="flex items-center px-3">
          <Sparkline
            values={cells.map((c) => c.now)}
            alert={needsRemark(last.kind)}
            label={`${service.name}: ${cells.map((c) => `${monthLabel(c.month, "short")} ${c.now === null ? "none" : formatMoney(c.now)}`).join(", ")}`}
          />
        </div>
      </div>

      {open === "edit" && <ServiceEditor key={service.id} view={view} service={service} onClose={() => onOpen(null)} />}
      {openCell && <CellDetail key={openCell.month} view={view} service={service} cell={openCell} onClose={() => onOpen(null)} />}
    </>
  );
};
