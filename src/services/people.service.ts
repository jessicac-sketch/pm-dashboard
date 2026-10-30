import { createClient } from "@/lib/supabase/client";
import type { EmploymentType, Person, PersonInsert, PersonRole, PersonUpdate } from "@/types/database";

export type PeoplePageParams = {
  /** 1-based page number. */
  page: number;
  pageSize: number;
  role: PersonRole | null;
  employmentType: EmploymentType | null;
};

export type PeoplePage = { rows: Person[]; total: number };

export const peopleService = {
  /** One page of active people, filtered and counted by the database. */
  listPage: async ({ page, pageSize, role, employmentType }: PeoplePageParams): Promise<PeoplePage> => {
    const from = (page - 1) * pageSize;
    let query = createClient()
      .from("people")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .order("full_name")
      .order("id")
      .range(from, from + pageSize - 1);
    if (role) query = query.eq("role", role);
    if (employmentType) query = query.eq("employment_type", employmentType);
    const { data, count, error } = await query;
    if (error) throw error;
    return { rows: data, total: count ?? 0 };
  },

  list: async (): Promise<Person[]> => {
    const { data, error } = await createClient()
      .from("people")
      .select("*")
      .eq("is_active", true)
      .order("full_name");
    if (error) throw error;
    return data;
  },

  create: async (input: PersonInsert): Promise<Person> => {
    const { data, error } = await createClient().from("people").insert(input).select().single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, input: PersonUpdate): Promise<Person> => {
    const { data, error } = await createClient()
      .from("people")
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
