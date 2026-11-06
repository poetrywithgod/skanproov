import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ApplicationStatus } from "@/components/manufacturer/application-status";
import { ApplyForm } from "@/components/manufacturer/apply-form";
import { getMyApplication } from "@/lib/manufacturer/data";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Your company", robots: { index: false } };

export default async function ManufacturerRegisterPage() {
  await requireUser();
  const application = await getMyApplication();

  if (application && application.status !== "rejected") {
    return (
      <AuthShell tone="soft" title="Your application" subtitle="Thank you for applying to join SKANPROOV.">
        <ApplicationStatus application={application} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      tone="soft"
      title={application ? "Update your application" : "Tell us about your company"}
      subtitle="We check every manufacturer before they can register products."
    >
      {application ? <ApplicationStatus application={application} /> : null}
      <ApplyForm />
    </AuthShell>
  );
}
