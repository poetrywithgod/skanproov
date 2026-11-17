"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AcceptInviteResult = { ok: true } | { ok: false; message: string };

/** Joins the company from an invitation link. The database checks the link and that the e-mail matches. */
export async function acceptInviteAction(token: string): Promise<AcceptInviteResult> {
  if (!/^[0-9a-f]{20,64}$/.test(token)) return { ok: false, message: "This invitation link is not valid." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_manufacturer_invite", { p_token: token });
  if (error) {
    const m = error.message;
    if (/wrong email/i.test(m)) return { ok: false, message: "You are signed in with a different e-mail than the one invited." };
    if (/invite expired/i.test(m)) return { ok: false, message: "This invitation has expired. Ask your administrator for a new link." };
    if (/invite used|no such invite/i.test(m)) return { ok: false, message: "This invitation link has already been used or cancelled." };
    if (/already a member/i.test(m)) return { ok: false, message: "This account already belongs to a company on SKANPROOV." };
    if (/wrong account type/i.test(m)) return { ok: false, message: "This is a retailer account. Use another e-mail address to join a manufacturer." };
    if (/two-factor/i.test(m)) return { ok: false, message: "Finish signing in with your authenticator code, then open the link again." };
    console.error("accept_manufacturer_invite failed", m);
    return { ok: false, message: "We couldn't add you to the team. Please try again." };
  }
  revalidatePath("/manufacturer", "layout");
  return { ok: true };
}
