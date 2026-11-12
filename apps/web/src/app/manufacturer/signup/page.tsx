import type { Metadata } from "next";
import { CompanyShell } from "@/components/manufacturer/company-shell";
import { CompanySignupForm } from "@/components/manufacturer/company-signup-form";

export const metadata: Metadata = { title: "Register your company" };

export default function ManufacturerSignupPage() {
  return (
    <CompanyShell>
      <CompanySignupForm />
    </CompanyShell>
  );
}
