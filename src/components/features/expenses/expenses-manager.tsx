"use client";

import { Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Empty, ErrorMessage, Loading } from "@/components/ui/query-state";
import { useAssignServices, useExpenseRemarks, useExpenses, useExpenseServices } from "@/hooks/queries/use-expenses";
import { useProjects } from "@/hooks/queries/use-projects";
import { buildServiceTotals, isRemarkPending, monthRange } from "@/lib/expense-review";
import { CategoriesTab } from "./categories/categories-tab";
import type { ExpenseView } from "./expense-view";
import { ImportDialog } from "./import-dialog";
import { listIncreases, RemarksTab } from "./remarks/remarks-tab";
import { CeoReport } from "./report/ceo-report";
import { ServicesTab } from "./services/services-tab";
import { SummaryTab } from "./summary/summary-tab";

type Tab = "summary" | "services" | "remarks" | "categories" | "report";

export const ExpensesManager = () => {
  const expenses = useExpenses();
  const services = useExpenseServices();
  const remarks = useExpenseRemarks();
  const projects = useProjects();
  const assign = useAssignServices();
  const [tab, setTab] = useState<Tab>("summary");
  const [importing, setImporting] = useState(false);

  const view = useMemo((): ExpenseView | null => {
    if (!expenses.data || !services.data || !remarks.data) return null;
    const months = monthRange(expenses.data);
    if (months.length === 0) return null;
    const projectList = projects.data ?? [];
    return {
      charges: expenses.data,
      services: services.data,
      months,
      firstMonth: months[0],
      latest: months[months.length - 1],
      totals: buildServiceTotals(expenses.data),
      remarks: remarks.data.remarks,
      dismissed: remarks.data.dismissed,
      projects: projectList,
      projectById: new Map(projectList.map((p) => [p.id, p])),
    };
  }, [expenses.data, services.data, remarks.data, projects.data]);

  // Charges saved before services were created automatically still need one.
  const unassigned = expenses.data?.some((e) => !e.service_id) ?? false;
  const assignTried = useRef(false);
  useEffect(() => {
    if (unassigned && !assignTried.current) {
      assignTried.current = true;
      assign.mutate();
    }
  }, [unassigned, assign]);

  const loading = [expenses, services, remarks].some((q) => q.isPending) || (unassigned && assign.isPending);
  const failed = [expenses, services, remarks].find((q) => q.isError)?.error ?? assign.error;
  const pending = view ? listIncreases(view).filter((i) => isRemarkPending(i.kind, i.remark, i.dismissed)).length : 0;
  const categoryCount = view ? new Set(view.services.map((s) => s.category?.trim() || "")).size : 0;

  const tabs: { id: Tab; label: string; count?: string; warn?: boolean }[] = [
    { id: "summary", label: "Summary" },
    { id: "services", label: "Services", count: String(view?.services.length ?? 0) },
    { id: "remarks", label: "Need remarks", count: String(pending), warn: pending > 0 },
    { id: "categories", label: "Categories", count: String(categoryCount) },
    { id: "report", label: "Report" },
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Button icon={Upload} onClick={() => setImporting(true)}>
          Import Amex statement
        </Button>
      </div>

      {loading ? (
        <Loading variant="page" />
      ) : failed ? (
        <ErrorMessage error={failed} />
      ) : !view ? (
        <Empty message="No charges yet. Import your Amex statement as CSV: every line becomes a service, and next month's statement is compared with it." />
      ) : (
        <div className="flex flex-col gap-4">
          <div role="tablist" aria-label="Expenses sections" className="flex flex-wrap gap-6 border-b border-border">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`-mb-px inline-flex h-12 items-center gap-2 border-b-3 text-[15px] font-bold ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground"}`}
              >
                {t.label}
                {t.count !== undefined && (
                  <span className={`px-1.5 text-[11px] font-extrabold ${t.warn ? "bg-danger/10 text-danger" : "bg-background text-foreground"}`}>{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {tab === "summary" && <SummaryTab view={view} />}
          {tab === "services" && <ServicesTab view={view} />}
          {tab === "remarks" && <RemarksTab view={view} />}
          {tab === "categories" && <CategoriesTab view={view} />}
          {tab === "report" && <CeoReport view={view} />}
        </div>
      )}

      {importing && <ImportDialog onClose={() => setImporting(false)} />}
    </>
  );
};
