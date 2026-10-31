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
            ? "That confirmation link is invalid or has expired. Sign in, or create your account again."
            : undefined
        }
      />
    </AuthShell>
  );
}
