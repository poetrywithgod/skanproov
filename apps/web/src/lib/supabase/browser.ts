import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "./env";

/** Supabase client for client components. Sessions are kept in cookies so the server can read them. */
export function createClient() {
  const { url, publishableKey } = requireSupabaseEnv();
  return createBrowserClient(url, publishableKey);
}
