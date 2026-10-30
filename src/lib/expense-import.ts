import { toIsoDate } from "@/lib/dates";
import type { ExpenseInsert } from "@/types/database";

// Maps spreadsheet / Amex export columns onto expense fields and parses rows.

export type ExpenseField =
  | "occurred_on"
  | "service_name"
  | "statement_name"
  | "address"
  | "city_state"
  | "zip_code"
  | "country"
  | "reference_number"
  | "category"
  | "amount";

export const EXPENSE_FIELDS: { key: ExpenseField; label: string; required: boolean; aliases: string[] }[] = [
  { key: "occurred_on", label: "Date", required: true, aliases: ["date", "transaction date", "date occurred", "date it occurred"] },
  { key: "service_name", label: "Service name / description", required: true, aliases: ["service name / description", "service name/description", "service name", "service", "description"] },
  { key: "statement_name", label: "Appears on statement as", required: false, aliases: ["appears on your statement as", "appears on statement as", "appears on statement", "statement name"] },
  { key: "address", label: "Address", required: false, aliases: ["address"] },
  { key: "city_state", label: "City/State", required: false, aliases: ["city/state", "city / state", "city state", "city"] },
  { key: "zip_code", label: "Zip code", required: false, aliases: ["zip code", "zip", "postal code"] },
  { key: "country", label: "Country", required: false, aliases: ["country"] },
  { key: "reference_number", label: "Reference number", required: false, aliases: ["reference number", "reference", "reference #", "ref"] },
  { key: "category", label: "Category", required: false, aliases: ["category"] },
  { key: "amount", label: "Amount", required: true, aliases: ["amount", "charge", "total"] },
];

export type ColumnMapping = Record<ExpenseField, number>;

const normalize = (header: string) => header.toLowerCase().replace(/\s+/g, " ").trim();

/** Best-guess column for each field; -1 when not found. Earlier aliases win. */
export const detectMapping = (headers: string[]): ColumnMapping => {
  const normalized = headers.map(normalize);
  const used = new Set<number>();
  const mapping = {} as ColumnMapping;
  for (const field of EXPENSE_FIELDS) {
    let index = -1;
    for (const alias of field.aliases) {
      index = normalized.findIndex((h, i) => h === alias && !used.has(i));
      if (index !== -1) break;
    }
    if (index !== -1) used.add(index);
    mapping[field.key] = index;
  }
  return mapping;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** "10/05/2026", "10/5/26", "2026-10-05" or "Oct 5, 2026" → "2026-10-05". */
export const parseDate = (value: string): string | null => {
  const v = value.trim();
  let m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (m) {
    const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    const month = Number(m[1]);
    const day = Number(m[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year}-${pad(month)}-${pad(day)}`;
  }
  m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${pad(Number(m[2]))}-${pad(Number(m[3]))}`;
  if (/[a-z]/i.test(v)) {
    const parsed = new Date(v);
    if (!Number.isNaN(parsed.getTime())) return toIsoDate(parsed);
  }
  return null;
};

/** "$1,234.56", "(12.00)", "-12", "12.5 USD" → number; null if unreadable. */
export const parseAmount = (value: string): number | null => {
  const v = value.trim();
  if (!v) return null;
  const negative = /^\(.*\)$/.test(v) || v.includes("-");
  const digits = v.replace(/[^0-9.]/g, "");
  if (!digits || Number.isNaN(Number(digits))) return null;
  const n = Math.round(Number(digits) * 100) / 100;
  return negative ? -n : n;
};

export type ImportPreview = {
  rows: ExpenseInsert[];
  errors: { line: number; message: string }[];
};

export const buildImportRows = (dataRows: string[][], mapping: ColumnMapping): ImportPreview => {
  const rows: ExpenseInsert[] = [];
  const errors: ImportPreview["errors"] = [];
  const cell = (row: string[], field: ExpenseField) => (mapping[field] >= 0 ? (row[mapping[field]] ?? "").trim() : "");
  const optional = (row: string[], field: ExpenseField) => cell(row, field) || null;

  dataRows.forEach((row, i) => {
    const line = i + 2; // +1 for the header row, +1 for 1-based lines
    const date = parseDate(cell(row, "occurred_on"));
    const service = cell(row, "service_name");
    const amount = parseAmount(cell(row, "amount"));
    if (!date) return errors.push({ line, message: `Unreadable date "${cell(row, "occurred_on")}"` });
    if (!service) return errors.push({ line, message: "Missing service name" });
    if (amount === null) return errors.push({ line, message: `Unreadable amount "${cell(row, "amount")}"` });
    rows.push({
      occurred_on: date,
      service_name: service,
      statement_name: optional(row, "statement_name"),
      address: optional(row, "address"),
      city_state: optional(row, "city_state"),
      zip_code: optional(row, "zip_code"),
      country: optional(row, "country"),
      // Amex wraps references in single quotes ('320261005') so spreadsheets keep them as text.
      reference_number: cell(row, "reference_number").replace(/^'+|'+$/g, "") || null,
      category: optional(row, "category"),
      amount,
    });
  });
  return { rows, errors };
};
