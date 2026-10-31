/**
 * Public Supabase settings. Both values are safe to expose to the browser: the
 * publishable key only ever acts as the signed-in user, under row level security.
 * Never put the service role key in a NEXT_PUBLIC_ variable.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && publishableKey ? { url, publishableKey } : null;
}

export function requireSupabaseEnv() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in apps/web/.env.local (see .env.example).",
    );
  }
  return env;
}
