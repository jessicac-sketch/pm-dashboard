import { createClient } from "@/lib/supabase/client";
import type { Risk, RiskInsert, RiskUpdate } from "@/types/database";

export const risksService = {
  listByProject: async (projectId: string): Promise<Risk[]> => {
    const { data, error } = await createClient()
      .from("risks")
      .select("*")
      .eq("project_id", projectId)
      .order("ref_number");
    if (error) throw error;
    return data;
  },

  create: async (input: RiskInsert): Promise<Risk> => {
    const { data, error } = await createClient().from("risks").insert(input).select().single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, input: RiskUpdate): Promise<Risk> => {
    const { data, error } = await createClient()
      .from("risks")
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  listDismissedSuggestions: async (projectId: string): Promise<string[]> => {
    const { data, error } = await createClient()
      .from("dismissed_risk_suggestions")
      .select("suggestion_key")
      .eq("project_id", projectId);
    if (error) throw error;
    return data.map((row) => row.suggestion_key);
  },

  dismissSuggestion: async (projectId: string, suggestionKey: string): Promise<void> => {
    const { error } = await createClient()
      .from("dismissed_risk_suggestions")
      .upsert({ project_id: projectId, suggestion_key: suggestionKey });
    if (error) throw error;
  },
};
