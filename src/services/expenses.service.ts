import { findServiceFor, groupByMerchant } from "@/lib/expense-matching";
import { createClient } from "@/lib/supabase/client";
import type { Expense, ExpenseInsert } from "@/types/database";

const PAGE_SIZE = 1000; // Supabase returns at most 1000 rows per request.
const IMPORT_CHUNK = 500;
const LINK_CHUNK = 150;

export type ImportResult = { inserted: number; skipped: number; created: number };

/** Reads every row of a table, a page at a time. */
const fetchAll = async <T,>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) => {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    all.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return all;
  }
};

export const expensesService = {
  list: async (): Promise<Expense[]> => {
    const supabase = createClient();
    return fetchAll<Expense>((from, to) =>
      supabase.from("expenses").select("*").order("occurred_on", { ascending: false }).order("id").range(from, to),
    );
  },

  /** Points the given charges at a service. */
  linkToService: async (expenseIds: string[], serviceId: string): Promise<void> => {
    const supabase = createClient();
    // Chunked so the id list stays within URL limits.
    for (let i = 0; i < expenseIds.length; i += LINK_CHUNK) {
      const { error } = await supabase.from("expenses").update({ service_id: serviceId }).in("id", expenseIds.slice(i, i + LINK_CHUNK));
      if (error) throw error;
    }
  },

  /**
   * Gives every charge a service. Charges whose statement text matches an
   * existing service are linked to it; the rest are grouped by merchant and a
   * service is created for each group (every statement line is a recurring
   * service). Returns how many services were created.
   */
  assignServices: async (): Promise<number> => {
    const supabase = createClient();
    const [unmatched, services] = await Promise.all([
      fetchAll<Expense>((from, to) => supabase.from("expenses").select("*").is("service_id", null).order("id").range(from, to)),
      supabase.from("expense_services").select("id, name, statement_match, is_active"),
    ]);
    if (services.error) throw services.error;
    if (unmatched.length === 0) return 0;

    const byService = new Map<string, string[]>();
    const leftover: Expense[] = [];
    for (const e of unmatched) {
      const id = findServiceFor(e, services.data);
      if (id) byService.set(id, [...(byService.get(id) ?? []), e.id]);
      else leftover.push(e);
    }

    let created = 0;
    const byName = new Map(services.data.map((s) => [s.name.trim().toLowerCase(), s.id]));
    for (const group of groupByMerchant(leftover)) {
      const ids = group.charges.map((c) => c.id);
      // Names are unique (case-insensitive), so reuse a service with the same name.
      let serviceId = byName.get(group.name.trim().toLowerCase());
      if (!serviceId) {
        const { data, error } = await supabase
          .from("expense_services")
          .insert({ name: group.name, statement_match: group.statementMatch, category: group.category })
          .select("id")
          .single();
        if (error) throw error;
        serviceId = data.id;
        byName.set(group.name.trim().toLowerCase(), serviceId);
        created++;
      }
      byService.set(serviceId, [...(byService.get(serviceId) ?? []), ...ids]);
    }

    for (const [serviceId, ids] of byService) await expensesService.linkToService(ids, serviceId);
    return created;
  },

  /** Inserts rows (skipping reference numbers already saved), then matches them to services. */
  importMany: async (rows: ExpenseInsert[]): Promise<ImportResult> => {
    const supabase = createClient();
    let inserted = 0;
    for (let i = 0; i < rows.length; i += IMPORT_CHUNK) {
      const { data, error } = await supabase
        .from("expenses")
        .upsert(rows.slice(i, i + IMPORT_CHUNK), { onConflict: "reference_number", ignoreDuplicates: true })
        .select("id");
      if (error) throw error;
      inserted += data.length;
    }
    const created = await expensesService.assignServices();
    return { inserted, skipped: rows.length - inserted, created };
  },
};
