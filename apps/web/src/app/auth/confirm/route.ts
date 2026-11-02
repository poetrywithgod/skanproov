import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

/** Link types this route will verify. */
const ALLOWED_TYPES: ReadonlySet<string> = new Set(["email", "signup", "recovery"]);

/**
 * Landing point for the link in the confirmation e-mail.
 *
 * The e-mail template links here with a token hash (see supabase/README.md). Unlike the
 * default code flow, this does not depend on a cookie from the browser where the person
 * signed up, so the link works when opened in another browser, another app, or on a phone.
 *
 * The destinations are fixed on purpose: never redirect to a URL taken from the request.
 */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (tokenHash && type && ALLOWED_TYPES.has(type)) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash });
      if (!error) {
        const destination = type === "recovery" ? site.links.resetPassword : site.links.home;
        return NextResponse.redirect(new URL(destination, origin));
      }
    } catch {
      // Fall through to the failure redirect below.
    }
  }

  const failure = type === "recovery" ? `${site.links.forgotPassword}?error=link` : `${site.links.login}?error=confirmation`;
  return NextResponse.redirect(new URL(failure, origin));
}
