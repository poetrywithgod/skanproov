import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NotificationsView } from "@/components/retailer/notifications-view";
import { RetailerHeader } from "@/components/retailer/retailer-header";
import { getRetailerContext } from "@/lib/retailer/data";
import { getNotifications } from "@/lib/retailer/notifications";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

export default async function RetailerNotificationsPage() {
  const shop = await getRetailerContext();
  if (!shop) redirect(site.retailer.register);
  const n = await getNotifications(shop);

  return (
    <>
      <RetailerHeader />
      <div className="px-4 pb-4 pt-5">
        <NotificationsView attention={n.attention} updates={n.updates} unread={n.unread} now={new Date().toISOString()} />
      </div>
    </>
  );
}
