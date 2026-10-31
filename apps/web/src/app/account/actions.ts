"use server";

import { redirect } from "next/navigation";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(site.links.login);
}
