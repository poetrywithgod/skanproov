import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Register as a retailer" };

export default function RetailerSignupPage() {
  return (
    <AuthShell
      tone="soft"
      title="Register as a retailer"
      subtitle="Check every carton before it reaches your shelves. Create your account first, then add your shop."
    >
      <RegisterForm role="retailer" />
    </AuthShell>
  );
}
