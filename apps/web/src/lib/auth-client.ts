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

export async function signUp(input: RegisterData, intended?: "retailer" | "manufacturer"): Promise<AuthResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      // Read by the database trigger that creates the profile row.
      // intended_account is only a hint for where to send them after sign-in; the trigger ignores it.
      data: { full_name: input.fullName, phone: input.phone, ...(intended ? { intended_account: intended } : {}) },
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

export type SimpleResult = { ok: true } | { ok: false; message: string };

function passwordError(code: string | undefined): string {
  switch (code) {
    case "weak_password":
      return "That password is too easy to guess. Please choose a stronger one.";
    case "same_password":
      return "Choose a password different from your current one.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "reauthentication_needed":
    case "session_not_found":
    case "not_authenticated":
      return "Your session has ended. Please use the link in your e-mail again, or request a new one.";
    default:
      return GENERIC_ERROR;
  }
}

/**
 * Sends the reset link. Always reports success for a well-formed request, so the screen never
 * reveals which e-mail addresses have an account.
 */
export async function requestPasswordReset(email: string): Promise<SimpleResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset`,
  });
  if (error && (error.code === "over_request_rate_limit" || error.code === "over_email_send_rate_limit")) {
    return { ok: false, message: passwordError(error.code) };
  }
  return { ok: true };
}

/** Sets a new password for the person the reset link just signed in. */
export async function resetPassword(password: string): Promise<SimpleResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  return error ? { ok: false, message: passwordError(error.code) } : { ok: true };
}

/** Changes the password after checking the current one. */
export async function changePassword(email: string, currentPassword: string, password: string): Promise<SimpleResult> {
  const supabase = createClient();
  const check = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (check.error) {
    return check.error.code === "invalid_credentials"
      ? { ok: false, message: "Your current password isn't right. Please try again." }
      : { ok: false, message: passwordError(check.error.code) };
  }
  const { error } = await supabase.auth.updateUser({ password });
  return error ? { ok: false, message: passwordError(error.code) } : { ok: true };
}

/** Permanently deletes the signed-in person's account after re-checking their password. */
export async function deleteAccount(email: string, password: string): Promise<SimpleResult> {
  const supabase = createClient();
  const check = await supabase.auth.signInWithPassword({ email, password });
  if (check.error) {
    return check.error.code === "invalid_credentials"
      ? { ok: false, message: "That password isn't right. Please try again." }
      : { ok: false, message: GENERIC_ERROR };
  }
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { ok: false, message: "We couldn't delete your account. Please try again." };
  await supabase.auth.signOut();
  return { ok: true };
}
