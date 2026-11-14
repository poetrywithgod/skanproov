"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Marks one notification read or unread. */
export async function setNotificationReadAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const read = formData.get("read") === "true";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_notification_read", { p_id: id, p_read: read });
  if (error) console.error("set_notification_read failed", error.message);
  revalidatePath("/manufacturer", "layout");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_all_notifications_read");
  if (error) console.error("mark_all_notifications_read failed", error.message);
  revalidatePath("/manufacturer", "layout");
}
