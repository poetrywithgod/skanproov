import type { LoginInput, RegisterData } from "@skanproov/validation";

export type AuthResult = { ok: true } | { ok: false; message: string };

/**
 * Auth transport placeholder. The auth provider is still an open decision for
 * Phase 1, so these deliberately fail instead of pretending to succeed.
 * Replace the bodies once the provider is chosen — the forms need no changes.
 */
const NOT_CONNECTED: AuthResult = {
  ok: false,
  message: "Sign-in isn't connected yet. Please try again once the platform is live.",
};

export async function signIn(_input: LoginInput): Promise<AuthResult> {
  return NOT_CONNECTED;
}

export async function signUp(_input: RegisterData): Promise<AuthResult> {
  return NOT_CONNECTED;
}
