import { NextResponse, type NextRequest } from "next/server";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for the password reset e-mail. Swaps the one-time code for a session, then sends
 * the person to the "choose a new password" screen. Destinations are fixed on purpose.
 */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(site.links.resetPassword, origin));
    } catch {
      // Fall through to the failure redirect below.
    }
  }

  return NextResponse.redirect(new URL(`${site.links.forgotPassword}?error=link`, origin));
}
