import type { Metadata } from "next";
import { DeferredPanel } from "@/components/manufacturer/portal/overview/panels";

export const metadata: Metadata = { title: "Subscription & usage", robots: { index: false } };

export default function SubscriptionPage() {
  // DEFERRED(D04): plan, monthly code allowance, plan limits, usage history, overage and plan comparison.
  return (
    <DeferredPanel id="D04" title="Subscription & usage" needs="Your plan, monthly code allowance, plan limits, usage history and overage setting will appear here once plans and pricing are set up." />
  );
}
