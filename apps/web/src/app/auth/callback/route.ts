import { NextResponse, type NextRequest } from "next/server";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for the link in the confirmation e-mail. Swaps the one-time code
 * for a session, then sends the person to their account. The destination is fixed
 * on purpose: never redirect to a URL taken from the request.
 */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(site.links.account, origin));
  }

  return NextResponse.redirect(new URL(`${site.links.login}?error=confirmation`, origin));
}
