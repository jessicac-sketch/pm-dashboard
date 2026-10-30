import { splitMatchText } from "@/lib/expense-matching";
import { createClient } from "@/lib/supabase/client";
import type { ExpenseService, ExpenseServiceUpdate } from "@/types/database";

/** A service plus the projects that use it. */
export type ServiceWithProjects = ExpenseService & { project_ids: string[] };

type SupabaseClient = ReturnType<typeof createClient>;

const setProjects = async (supabase: SupabaseClient, serviceId: string, projectIds: string[]) => {
  const { error: deleteError } = await supabase.from("expense_service_project_links").delete().eq("service_id", serviceId);
  if (deleteError) throw deleteError;
  if (projectIds.length === 0) return;
  const { error } = await supabase
    .from("expense_service_project_links")
    .insert(projectIds.map((project_id) => ({ service_id: serviceId, project_id })));
  if (error) throw error;
};

export const expenseServicesService = {
  list: async (): Promise<ServiceWithProjects[]> => {
    const supabase = createClient();
    const [services, links] = await Promise.all([
      supabase.from("expense_services").select("*").order("name"),
      supabase.from("expense_service_project_links").select("*"),
    ]);
    if (services.error) throw services.error;
    if (links.error) throw links.error;
    const byService = new Map<string, string[]>();
    for (const l of links.data) byService.set(l.service_id, [...(byService.get(l.service_id) ?? []), l.project_id]);
    return services.data.map((s) => ({ ...s, project_ids: byService.get(s.id) ?? [] }));
  },

  /** Updates a service. Project links are replaced only when `projectIds` is given. */
  update: async (id: string, input: ExpenseServiceUpdate, projectIds?: string[]): Promise<ExpenseService> => {
    const supabase = createClient();
    const { data, error } = await supabase.from("expense_services").update(input).eq("id", id).select().single();
    if (error) throw error;
    if (projectIds) await setProjects(supabase, id, projectIds);
    return data;
  },

  /**
   * Folds one service into another (for duplicates the import created):
   * moves its charges, remarks the target doesn't have yet, project links and
   * statement text, then deletes it.
   */
  mergeInto: async (sourceId: string, targetId: string): Promise<void> => {
    if (sourceId === targetId) return;
    const supabase = createClient();
    const [services, remarks, links] = await Promise.all([
      supabase.from("expense_services").select("*").in("id", [sourceId, targetId]),
      supabase.from("expense_remarks").select("service_id, month, remark").in("service_id", [sourceId, targetId]),
      supabase.from("expense_service_project_links").select("*").in("service_id", [sourceId, targetId]),
    ]);
    for (const r of [services, remarks, links]) if (r.error) throw r.error;
    const source = services.data!.find((s) => s.id === sourceId);
    const target = services.data!.find((s) => s.id === targetId);
    if (!source || !target) throw new Error("Service not found.");

    const { error: moveError } = await supabase.from("expenses").update({ service_id: targetId }).eq("service_id", sourceId);
    if (moveError) throw moveError;

    const targetMonths = new Set(remarks.data!.filter((r) => r.service_id === targetId).map((r) => r.month));
    const movedRemarks = remarks.data!
      .filter((r) => r.service_id === sourceId && !targetMonths.has(r.month))
      .map((r) => ({ service_id: targetId, month: r.month, remark: r.remark }));
    if (movedRemarks.length) {
      const { error } = await supabase.from("expense_remarks").insert(movedRemarks);
      if (error) throw error;
    }

    const targetProjects = new Set(links.data!.filter((l) => l.service_id === targetId).map((l) => l.project_id));
    const movedLinks = links.data!
      .filter((l) => l.service_id === sourceId && !targetProjects.has(l.project_id))
      .map((l) => ({ service_id: targetId, project_id: l.project_id }));
    if (movedLinks.length) {
      const { error } = await supabase.from("expense_service_project_links").insert(movedLinks);
      if (error) throw error;
    }

    // Keep both statement texts so next month's charges from either line match the target.
    const statementMatch = [...new Set([...splitMatchText(target.statement_match), ...splitMatchText(source.statement_match)])].join(" | ") || null;
    const { error: matchError } = await supabase
      .from("expense_services")
      .update({ statement_match: statementMatch, category: target.category ?? source.category })
      .eq("id", targetId);
    if (matchError) throw matchError;

    const { error } = await supabase.from("expense_services").delete().eq("id", sourceId);
    if (error) throw error;
  },
};
