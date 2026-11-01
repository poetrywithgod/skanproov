import type { Metadata } from "next";
import { NotificationsView } from "@/components/app/notifications-view";
import { getNotifications } from "@/lib/customer/activity-data";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await getNotifications(user.id);
  return <NotificationsView items={items} />;
}
