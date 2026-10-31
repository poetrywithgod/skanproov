import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabaseEnv } from "./env";

/** Supabase client for server components, route handlers and server actions. */
export async function createClient() {
  // Read cookies first: it marks the page as per-request, so it is never rendered at build time.
  const cookieStore = await cookies();
  const { url, publishableKey } = requireSupabaseEnv();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a server component, which cannot set cookies. Safe to ignore:
          // proxy.ts refreshes the session on every request.
        }
      },
    },
  });
}
