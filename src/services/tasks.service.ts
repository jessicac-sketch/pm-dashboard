import { createClient } from "@/lib/supabase/client";
import type { Task, TaskInsert, TaskUpdate } from "@/types/database";

export type TaskFilters = {
  projectId?: string;
  status?: Task["status"];
};

export const tasksService = {
  list: async (filters: TaskFilters = {}): Promise<Task[]> => {
    let query = createClient()
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.projectId) query = query.eq("project_id", filters.projectId);
    if (filters.status) query = query.eq("status", filters.status);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  getById: async (id: string): Promise<Task> => {
    const { data, error } = await createClient()
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (input: TaskInsert): Promise<Task> => {
    const { data, error } = await createClient()
      .from("tasks")
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, input: TaskUpdate): Promise<Task> => {
    const { data, error } = await createClient()
      .from("tasks")
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await createClient().from("tasks").delete().eq("id", id);
    if (error) throw error;
  },
};
