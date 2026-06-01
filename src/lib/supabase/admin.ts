import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Privileged client using the Supabase secret key. NEVER import this into
 * client components. Bypasses RLS - use only in trusted server contexts
 * (cron, privileged writes).
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
