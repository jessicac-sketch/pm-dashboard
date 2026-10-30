import { createClient } from "@/lib/supabase/client";

/** "serviceId|YYYY-MM" → remark */
export type RemarkMap = Map<string, string>;
/** "serviceId|YYYY-MM" keys marked "no remark needed" */
export type DismissedSet = Set<string>;
export type RemarkData = { remarks: RemarkMap; dismissed: DismissedSet };
/** "YYYY-MM" → when the CEO report was marked sent */
export type SentMap = Map<string, string>;

export const remarkKey = (serviceId: string, month: string) => `${serviceId}|${month}`;
const firstOfMonth = (month: string) => `${month}-01`;

export const expenseReviewService = {
  listRemarks: async (): Promise<RemarkData> => {
    const { data, error } = await createClient().from("expense_remarks").select("service_id, month, remark, dismissed");
    if (error) throw error;
    const key = (r: { service_id: string; month: string }) => remarkKey(r.service_id, r.month.slice(0, 7));
    return {
      remarks: new Map(data.filter((r) => r.remark.trim()).map((r) => [key(r), r.remark])),
      dismissed: new Set(data.filter((r) => r.dismissed).map(key)),
    };
  },

  /** Saves a remark. Clearing it removes the row unless the increase is marked "no remark needed". */
  saveRemark: async (serviceId: string, month: string, remark: string): Promise<void> => {
    const supabase = createClient();
    const text = remark.trim();
    if (text) {
      const { error } = await supabase.from("expense_remarks").upsert({ service_id: serviceId, month: firstOfMonth(month), remark: text });
      if (error) throw error;
      return;
    }
    const { error } = await supabase
      .from("expense_remarks")
      .delete()
      .eq("service_id", serviceId)
      .eq("month", firstOfMonth(month))
      .eq("dismissed", false);
    if (error) throw error;
    const { error: clearError } = await supabase.from("expense_remarks").update({ remark: "" }).eq("service_id", serviceId).eq("month", firstOfMonth(month));
    if (clearError) throw clearError;
  },

  /** Marks an increase as "no remark needed" (or undoes it). Any typed remark is kept. */
  setDismissed: async (serviceId: string, month: string, dismissed: boolean): Promise<void> => {
    const supabase = createClient();
    if (dismissed) {
      const { error } = await supabase.from("expense_remarks").upsert({ service_id: serviceId, month: firstOfMonth(month), dismissed: true });
      if (error) throw error;
      return;
    }
    // Remove the row first when it has no remark: un-dismissing an empty row would break the
    // "a remark or dismissed" rule. A row with a typed remark just loses the flag.
    const { error: cleanError } = await supabase
      .from("expense_remarks")
      .delete()
      .eq("service_id", serviceId)
      .eq("month", firstOfMonth(month))
      .eq("remark", "");
    if (cleanError) throw cleanError;
    const { error } = await supabase.from("expense_remarks").update({ dismissed: false }).eq("service_id", serviceId).eq("month", firstOfMonth(month));
    if (error) throw error;
  },

  listSent: async (): Promise<SentMap> => {
    const { data, error } = await createClient().from("expense_month_reviews").select("month, report_sent_at");
    if (error) throw error;
    return new Map(data.filter((r) => r.report_sent_at).map((r) => [r.month.slice(0, 7), r.report_sent_at!]));
  },

  setSent: async (month: string, sent: boolean): Promise<void> => {
    const { error } = await createClient()
      .from("expense_month_reviews")
      .upsert({ month: firstOfMonth(month), report_sent_at: sent ? new Date().toISOString() : null });
    if (error) throw error;
  },
};
