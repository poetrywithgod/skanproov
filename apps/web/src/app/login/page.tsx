import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <AuthShell tone="white">
      <LoginForm
        initialError={
          error === "confirmation"
            ? "We couldn't sign you in from that link. If you've already confirmed your e-mail, just sign in below. If the link has expired, create your account again."
            : undefined
        }
      />
    </AuthShell>
  );
}
