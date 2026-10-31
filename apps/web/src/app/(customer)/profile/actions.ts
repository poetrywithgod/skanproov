"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(site.links.login);
}
