import { createClient } from "@/lib/supabase/client";
import type { WbsItem, WbsItemInsert, WbsItemUpdate } from "@/types/database";

export const wbsService = {
  /** Every project's WBS items, for cross-project views like the dashboard. */
  listAll: async (): Promise<WbsItem[]> => {
    const { data, error } = await createClient().from("wbs_items").select("*").order("sort_order").order("created_at");
    if (error) throw error;
    return data;
  },

  listByProject: async (projectId: string): Promise<WbsItem[]> => {
    const { data, error } = await createClient()
      .from("wbs_items")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order")
      .order("created_at");
    if (error) throw error;
    return data;
  },

  create: async (input: WbsItemInsert): Promise<WbsItem> => {
    const { data, error } = await createClient().from("wbs_items").insert(input).select().single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, input: WbsItemUpdate): Promise<WbsItem> => {
    const { data, error } = await createClient()
      .from("wbs_items")
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await createClient().from("wbs_items").delete().eq("id", id);
    if (error) throw error;
  },
};
