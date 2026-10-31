import { redirect } from "next/navigation";
import { cache } from "react";
import { site } from "@/lib/site";
import { createClient } from "./server";

export interface CurrentUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
  fullName: string | null;
  firstName: string | null;
  phone: string | null;
}

/**
 * The signed-in person plus their profile row, or null for a guest.
 * Cached per request, so a layout and a page can both call it for one lookup.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();

  // getUser() asks Supabase to validate the session; do not trust the cookie alone.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  const fullName = profile?.full_name ?? null;
  return {
    id: user.id,
    email: user.email ?? "",
    emailConfirmed: Boolean(user.email_confirmed_at),
    fullName,
    firstName: fullName?.trim().split(/\s+/)[0] ?? null,
    phone: profile?.phone ?? null,
  };
});

/** For screens that need an account. Guests are sent to sign in. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(site.links.login);
  return user;
}
