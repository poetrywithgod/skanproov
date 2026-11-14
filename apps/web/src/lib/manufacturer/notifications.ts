import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ManufacturerNotification, NotificationCategory } from "./notification-shared";

export * from "./notification-shared";

/** The manufacturer's latest notifications (up to 200), newest first. */
export const getNotifications = cache(async (): Promise<ManufacturerNotification[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_notifications");
  if (error) console.error("Could not load the notifications", error.message);
  return (
    (data ?? []) as {
      id: string;
      category: string;
      title: string;
      body: string;
      ref_label: string | null;
      link: string | null;
      link_label: string | null;
      created_at: string;
      read_at: string | null;
    }[]
  ).map((row) => ({
    id: row.id,
    category: row.category as NotificationCategory,
    title: row.title,
    body: row.body,
    refLabel: row.ref_label,
    link: row.link,
    linkLabel: row.link_label,
    createdAt: row.created_at,
    read: row.read_at !== null,
  }));
});
