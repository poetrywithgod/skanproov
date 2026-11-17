import type { Metadata } from "next";
import { DeferredPanel } from "@/components/manufacturer/portal/overview/panels";
import { SecurityPanel } from "@/components/manufacturer/portal/settings/security-panel";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Security & MFA", robots: { index: false } };

export default async function SecurityPage() {
  const user = await requireUser();
  return (
    <>
      <SecurityPanel email={user.email} twoFactorOn={user.twoFactorOn} />
      {/* DEFERRED(D21): trusted devices, session timeout, a company-wide two-factor requirement, sign-in alerts and "password last changed". Two-factor is not required for code generation yet. */}
      <DeferredPanel id="D21" title="Trusted devices & company rules" needs="Trusted devices, an automatic sign-out timer, a company-wide two-factor requirement and alerts for blocked sign-ins will appear here once sign-ins are tracked by device." />
    </>
  );
}
