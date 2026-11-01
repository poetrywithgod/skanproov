import type { Metadata } from "next";
import { MarkRead } from "@/components/app/mark-read";
import { NotificationsView } from "@/components/app/notifications-view";
import { getNotifications } from "@/lib/customer/activity-data";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

export default async function NotificationsPage() {
  await requireUser();
  const items = await getNotifications();
  return (
    <>
      <NotificationsView items={items} />
      {items.some((i) => i.unread) ? <MarkRead /> : null}
    </>
  );
}
