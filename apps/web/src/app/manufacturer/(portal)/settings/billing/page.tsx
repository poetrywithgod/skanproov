import type { Metadata } from "next";
import { DeferredPanel } from "@/components/manufacturer/portal/overview/panels";
import { NoAccess } from "@/components/manufacturer/portal/team/no-access";
import { can, getManufacturerContext } from "@/lib/manufacturer/portal";

export const metadata: Metadata = { title: "Billing", robots: { index: false } };

export default async function BillingPage() {
  const manufacturer = await getManufacturerContext();
  if (!can(manufacturer, "manage_billing")) return <NoAccess title="Billing" what="You can't open Billing" />;
  // DEFERRED(D08): payment method, billing contact and invoices (needs the payment gateway decision).
  return (
    <DeferredPanel id="D08" title="Billing" needs="Your payment method, billing contact and invoices will appear here once the payment gateway is chosen and billing is set up." />
  );
}
