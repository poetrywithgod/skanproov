import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your e-mail and we'll send you a link to choose a new one.">
      <ForgotForm
        initialError={
          error === "link"
            ? "That reset link didn't work. It may have expired or been opened in a different browser. Request a new one below."
            : undefined
        }
      />
    </AuthShell>
  );
}
