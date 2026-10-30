import { createClient } from "@/lib/supabase/client";
import type { Issue, IssueInsert, IssueUpdate } from "@/types/database";

export const issuesService = {
  listByProject: async (projectId: string): Promise<Issue[]> => {
    const { data, error } = await createClient()
      .from("issues")
      .select("*")
      .eq("project_id", projectId)
      .order("ref_number");
    if (error) throw error;
    return data;
  },

  create: async (input: IssueInsert): Promise<Issue> => {
    const { data, error } = await createClient().from("issues").insert(input).select().single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, input: IssueUpdate): Promise<Issue> => {
    const { data, error } = await createClient()
      .from("issues")
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
