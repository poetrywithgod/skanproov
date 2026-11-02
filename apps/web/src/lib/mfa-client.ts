import { createClient } from "@/lib/supabase/browser";

export type MfaResult = { ok: true } | { ok: false; message: string };

const GENERIC = "Something went wrong. Please try again.";

function codeError(code: string | undefined): string {
  switch (code) {
    case "mfa_verification_failed":
    case "mfa_challenge_expired":
      return "That code isn't right, or it has expired. Check your app and try the new code.";
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a few minutes and try again.";
    default:
      return GENERIC;
  }
}

/** True when the person has two-factor on but has not entered a code in this session yet. */
export async function needsMfa(): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return data?.nextLevel === "aal2" && data.currentLevel !== "aal2";
}

async function verifiedFactorId(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  return data?.totp[0]?.id ?? null;
}

/** Checks a six-digit code against the person's authenticator app (used at sign-in). */
export async function verifyLoginCode(code: string): Promise<MfaResult> {
  const supabase = createClient();
  const factorId = await verifiedFactorId();
  if (!factorId) return { ok: false, message: GENERIC };
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  return error ? { ok: false, message: codeError(error.code) } : { ok: true };
}

export async function twoFactorEnabled(): Promise<boolean> {
  return (await verifiedFactorId()) !== null;
}

export interface Enrollment {
  factorId: string;
  /** SVG image as a data URL. */
  qrCode: string;
  /** The same key as text, for typing in by hand. */
  secret: string;
}

/** Starts setting up an authenticator app. Clears any half-finished attempt first. */
export async function startEnrollment(): Promise<{ ok: true; enrollment: Enrollment } | { ok: false; message: string }> {
  const supabase = createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const factor of factors?.all ?? []) {
    if (factor.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "SKANPROOV" });
  if (error || !data) return { ok: false, message: GENERIC };
  return { ok: true, enrollment: { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret } };
}

/** Finishes setup by checking the first code from the app. */
export async function confirmEnrollment(factorId: string, code: string): Promise<MfaResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  return error ? { ok: false, message: codeError(error.code) } : { ok: true };
}

/** Turns two-factor off. A current code is required, which also proves it is really them. */
export async function disableTwoFactor(code: string): Promise<MfaResult> {
  const supabase = createClient();
  const factorId = await verifiedFactorId();
  if (!factorId) return { ok: true };
  const verified = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (verified.error) return { ok: false, message: codeError(verified.error.code) };
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  return error ? { ok: false, message: GENERIC } : { ok: true };
}

export async function cancelSignIn(): Promise<void> {
  await createClient().auth.signOut();
}
