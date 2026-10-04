import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv, isCloudEnabled } from "@/lib/env";

let browserClient: SupabaseClient | null | undefined;

/** Browser client, or null when cloud is not configured (local-first mode). */
export function getSupabase(): SupabaseClient | null {
  if (browserClient !== undefined) return browserClient;
  if (!isCloudEnabled()) {
    browserClient = null;
    return null;
  }
  const env = getEnv();
  browserClient = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return browserClient;
}

/** Server-side client scoped to the caller's JWT (RLS enforces ownership). */
export function getSupabaseForToken(token: string): SupabaseClient | null {
  if (!isCloudEnabled()) return null;
  const env = getEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
