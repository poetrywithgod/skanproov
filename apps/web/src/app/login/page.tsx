import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getRole, parseRole } from "@/lib/roles";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; deleted?: string; mfa?: string; as?: string }> }) {
  const { error, deleted, mfa, as } = await searchParams;
  const role = parseRole(as);
  const chosen = getRole(role);

  return (
    <AuthShell
      tone="white"
      {...(chosen
        ? {
            title: `Sign in as a ${chosen.label.toLowerCase()}`,
            subtitle: chosen.blurb,
          }
        : {})}
    >
      <LoginForm
        role={role}
        checkMfaOnLoad={mfa === "1"}
        notice={deleted === "1" ? "Your account has been deleted." : undefined}
        initialError={
          error === "confirmation"
            ? "We couldn't sign you in from that link. If you've already confirmed your e-mail, just sign in below. If the link has expired, create your account again."
            : undefined
        }
      />
    </AuthShell>
  );
}
