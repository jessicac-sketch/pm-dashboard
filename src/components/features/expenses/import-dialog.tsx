"use client";

import { CheckCircle2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ErrorMessage } from "@/components/ui/query-state";
import { Select } from "@/components/ui/select";
import { useImportExpenses } from "@/hooks/queries/use-expenses";
import { parseCsv } from "@/lib/csv";
import { buildImportRows, detectMapping, EXPENSE_FIELDS, type ColumnMapping, type ExpenseField } from "@/lib/expense-import";
import { monthLabel, monthOf, shiftMonth } from "@/lib/expense-review";
import { formatDate, formatMoney } from "@/lib/format";

type Parsed = { fileName: string; headers: string[]; rows: string[][] };

export const ImportDialog = ({ onClose }: { onClose: () => void }) => {
  const importExpenses = useImportExpenses();
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [pickedMonth, setPickedMonth] = useState<string | null>(null);

  const preview = useMemo(() => (parsed && mapping ? buildImportRows(parsed.rows, mapping) : null), [parsed, mapping]);
  const missingRequired = mapping ? EXPENSE_FIELDS.filter((f) => f.required && mapping[f.key] < 0) : [];

  // A statement also carries charges from the last days of the month before,
  // so the whole file goes to one statement month: the most common one by default.
  const monthCounts = new Map<string, number>();
  for (const r of preview?.rows ?? []) monthCounts.set(monthOf(r.occurred_on), (monthCounts.get(monthOf(r.occurred_on)) ?? 0) + 1);
  const likelyMonth = [...monthCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const statementMonth = pickedMonth ?? likelyMonth;
  const monthOptions = likelyMonth ? [-2, -1, 0, 1].map((d) => shiftMonth(likelyMonth, d)) : [];

  const handleFile = async (file: File) => {
    setReadError(null);
    importExpenses.reset();
    const table = parseCsv(await file.text());
    if (table.length < 2) {
      setReadError("That file has no data rows. Export the sheet with a header row.");
      return;
    }
    const [headers, ...rows] = table;
    setParsed({ fileName: file.name, headers, rows });
    setPickedMonth(null);
    setMapping(detectMapping(headers));
  };

  const setColumn = (field: ExpenseField, index: number) => setMapping((m) => (m ? { ...m, [field]: index } : m));

  return (
    <Dialog open onClose={onClose} title="Import expenses from CSV" description="In Google Sheets: File › Download › Comma-separated values. An Amex statement export works too.">
      <div className="flex max-h-[72vh] flex-col gap-4 overflow-y-auto pr-1">
        <label className="flex cursor-pointer items-center gap-3 border-2 border-dashed border-border px-4 py-4 text-sm hover:border-primary">
          <Upload className="size-5 text-muted" aria-hidden />
          <span className="flex-1">{parsed ? <b>{parsed.fileName}</b> : "Choose a .csv file"}</span>
          <span className="font-bold text-primary">{parsed ? "Change" : "Browse"}</span>
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
        {readError && <ErrorMessage error={new Error(readError)} />}

        {parsed && mapping && preview && (
          <>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-extrabold">Match your columns</legend>
              {EXPENSE_FIELDS.map((f) => (
                <div key={f.key} className="grid grid-cols-[1fr_1fr] items-center gap-3 text-sm">
                  <span>
                    {f.label}
                    {f.required && <span className="text-danger"> *</span>}
                  </span>
                  <Select
                    id={`map-${f.key}`}
                    label={f.label}
                    hideLabel
                    value={String(mapping[f.key])}
                    onChange={(e) => setColumn(f.key, Number(e.target.value))}
                    className={f.required && mapping[f.key] < 0 ? "border-danger" : ""}
                    options={[{ value: "-1", label: "Not in file" }, ...parsed.headers.map((h, i) => ({ value: String(i), label: h || `Column ${i + 1}` }))]}
                  />
                </div>
              ))}
            </fieldset>

            {missingRequired.length > 0 ? (
              <ErrorMessage error={new Error(`Pick a column for: ${missingRequired.map((f) => f.label).join(", ")}.`)} />
            ) : (
              <div className="flex flex-col gap-2 border border-border bg-background p-3 text-sm">
                {statementMonth && (
                  <div className="grid grid-cols-[1fr_1fr] items-center gap-3 border-b border-border pb-3">
                    <span>
                      <b className="block">Statement month</b>
                      <span className="text-xs text-muted">Every charge in this file counts in this month, including ones dated in the last days of the month before.</span>
                    </span>
                    <Select
                      id="import-statement-month"
                      label="Statement month"
                      hideLabel
                      value={statementMonth}
                      onChange={(e) => setPickedMonth(e.target.value)}
                      options={monthOptions.map((m) => ({ value: m, label: monthLabel(m) }))}
                    />
                  </div>
                )}
                <b>
                  {preview.rows.length} of {parsed.rows.length} rows ready
                  {preview.errors.length > 0 && <span className="text-danger"> · {preview.errors.length} can&apos;t be read</span>}
                </b>
                {preview.errors.slice(0, 4).map((err) => (
                  <span key={err.line} className="text-xs text-danger">
                    Line {err.line}: {err.message}
                  </span>
                ))}
                <ul className="flex flex-col">
                  {preview.rows.slice(0, 4).map((r, i) => (
                    <li key={i} className="flex justify-between gap-2 border-t border-border py-1.5 text-xs">
                      <span className="truncate">
                        {formatDate(r.occurred_on)} · <b>{r.service_name}</b>
                        {r.reference_number && <span className="text-muted"> · {r.reference_number}</span>}
                      </span>
                      <b>{formatMoney(r.amount)}</b>
                    </li>
                  ))}
                </ul>
                <span className="text-xs text-muted">Rows whose reference number is already saved are skipped, so re-importing is safe.</span>
              </div>
            )}
          </>
        )}

        {importExpenses.error && <ErrorMessage error={importExpenses.error} />}
        {importExpenses.data && (
          <p role="status" className="flex items-center gap-2 border border-success/30 bg-success/10 px-3 py-2.5 text-sm text-success">
            <CheckCircle2 className="size-4" aria-hidden />
            Imported {importExpenses.data.inserted}
            {importExpenses.data.skipped > 0 && `, skipped ${importExpenses.data.skipped} already saved`}.{" "}
            {importExpenses.data.created > 0
              ? `${importExpenses.data.created} new ${importExpenses.data.created === 1 ? "service was" : "services were"} added; the rest went to your existing services.`
              : "Every charge went to an existing service."}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={onClose}>
            {importExpenses.data ? "Done" : "Cancel"}
          </Button>
          {!importExpenses.data && (
            <Button
              icon={Upload}
              loading={importExpenses.isPending}
              disabled={!preview || preview.rows.length === 0 || missingRequired.length > 0}
              onClick={() => preview && statementMonth && importExpenses.mutate(preview.rows.map((r) => ({ ...r, statement_month: `${statementMonth}-01` })))}
            >
              Import {preview?.rows.length ?? 0} rows
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
};
