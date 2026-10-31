import type { LoginInput, RegisterData } from "@skanproov/validation";
import { createClient } from "@/lib/supabase/browser";

export type AuthResult =
  /** `confirm-email`: account created, but the person must click the e-mailed link first. */
  { ok: true; next: "account" | "confirm-email" } | { ok: false; message: string };

const GENERIC_ERROR = "Something went wrong. Please try again.";

/**
 * The only file that talks to the auth provider (Supabase Auth). The forms depend
 * on these two functions and the AuthResult shape, nothing else, so changing
 * provider later means changing this file only.
 */
export async function signIn(input: LoginInput): Promise<AuthResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (!error) return { ok: true, next: "account" };

  switch (error.code) {
    case "invalid_credentials":
      return { ok: false, message: "That e-mail and password don't match. Please check and try again." };
    case "email_not_confirmed":
      return { ok: false, message: "Please confirm your e-mail address first. Check your inbox for the link." };
    case "over_request_rate_limit":
      return { ok: false, message: "Too many attempts. Please wait a few minutes and try again." };
    default:
      return { ok: false, message: GENERIC_ERROR };
  }
}

export async function signUp(input: RegisterData): Promise<AuthResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      // Read by the database trigger that creates the profile row.
      data: { full_name: input.fullName, phone: input.phone },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    switch (error.code) {
      case "weak_password":
        return { ok: false, message: "That password is too easy to guess. Please choose a stronger one." };
      case "over_request_rate_limit":
      case "over_email_send_rate_limit":
        return { ok: false, message: "Too many attempts. Please wait a few minutes and try again." };
      case "unexpected_failure":
        // The profile insert is rejected (e.g. phone number already registered) and Supabase
        // reports it generically. Stay vague on purpose: no hints about which accounts exist.
        return {
          ok: false,
          message: "We couldn't create that account. The e-mail or phone number may already be registered.",
        };
      default:
        return { ok: false, message: GENERIC_ERROR };
    }
  }

  // With e-mail confirmation on (Supabase default) there is no session until the link is clicked.
  return { ok: true, next: data.session ? "account" : "confirm-email" };
}
