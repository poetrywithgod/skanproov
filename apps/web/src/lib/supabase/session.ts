import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/**
 * Keeps the sign-in session fresh. Supabase access tokens are short-lived; this
 * refreshes them and writes the new cookies onto both the request and the response.
 * When Supabase is not configured it does nothing, so the public pages keep working.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const env = getSupabaseEnv();
  if (!env) return response;

  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // Validates the token and refreshes it if needed. Do not put code between
  // createServerClient and this call.
  await supabase.auth.getClaims();

  return response;
}
