import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// Browser client — used by services called from TanStack Query hooks.
// createBrowserClient returns a singleton in the browser, so calling this per request is cheap.
export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
