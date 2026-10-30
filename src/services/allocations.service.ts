import { createClient } from "@/lib/supabase/client";
import type { Allocation, AllocationInsert } from "@/types/database";

export type AllocationChanges = {
  /** New or changed rows, matched on (person_id, project_id). */
  upserts: AllocationInsert[];
  /** Ids of rows to remove. */
  deleteIds: string[];
};

export const allocationsService = {
  list: async (): Promise<Allocation[]> => {
    const { data, error } = await createClient().from("allocations").select("*");
    if (error) throw error;
    return data;
  },

  // Deletes run first so a person moved off and back onto a project doesn't hit the unique key.
  saveChanges: async ({ upserts, deleteIds }: AllocationChanges): Promise<void> => {
    const supabase = createClient();
    if (deleteIds.length > 0) {
      const { error } = await supabase.from("allocations").delete().in("id", deleteIds);
      if (error) throw error;
    }
    if (upserts.length > 0) {
      const { error } = await supabase
        .from("allocations")
        .upsert(upserts, { onConflict: "person_id,project_id" });
      if (error) throw error;
    }
  },
};
