import { createClient } from "@/lib/supabase/client";
import type { Project, ProjectInsert, ProjectUpdate } from "@/types/database";

export const projectsService = {
  list: async (): Promise<Project[]> => {
    const { data, error } = await createClient()
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  getById: async (id: string): Promise<Project> => {
    const { data, error } = await createClient()
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (input: ProjectInsert): Promise<Project> => {
    const { data, error } = await createClient()
      .from("projects")
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, input: ProjectUpdate): Promise<Project> => {
    const { data, error } = await createClient()
      .from("projects")
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await createClient().from("projects").delete().eq("id", id);
    if (error) throw error;
  },
};
