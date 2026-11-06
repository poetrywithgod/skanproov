import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Sign up as a manufacturer" };

export default function ManufacturerSignupPage() {
  return (
    <AuthShell
      tone="soft"
      title="Sign up as a manufacturer"
      subtitle="Protect your products from factory to shelf. Create your account first, then tell us about your company."
    >
      <RegisterForm role="manufacturer" />
    </AuthShell>
  );
}
