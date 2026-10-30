import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type SignInInput = { email: string; password: string };

export const authService = {
  signIn: async ({ email, password }: SignInInput): Promise<User> => {
    const { data, error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },

  signOut: async (): Promise<void> => {
    const { error } = await createClient().auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async (): Promise<User | null> => {
    const { data, error } = await createClient().auth.getUser();
    if (error) throw error;
    return data.user;
  },
};
