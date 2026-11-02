import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/reset-form";
import { site } from "@/lib/site";
import { getCurrentUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage() {
  // The e-mailed link signs the person in; without that there is nothing to reset.
  const user = await getCurrentUser();
  if (!user) redirect(`${site.links.forgotPassword}?error=link`);

  return (
    <AuthShell title="Choose a new password" subtitle="Use at least 8 characters. You'll be signed in right after.">
      <ResetForm />
    </AuthShell>
  );
}
