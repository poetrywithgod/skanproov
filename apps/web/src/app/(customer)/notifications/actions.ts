"use server";

import { createClient } from "@/lib/supabase/server";

/** Marks the signed-in person's notifications as read. Row level security limits it to their own. */
export async function markAllReadAction() {
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
}
