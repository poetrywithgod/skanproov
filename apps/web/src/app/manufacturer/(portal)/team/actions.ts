"use server";

import { inviteMemberSchema, teamRoleSchema } from "@skanproov/validation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, getManufacturerContext } from "@/lib/manufacturer/portal";
import { NO_ACCESS_MESSAGE } from "@/lib/manufacturer/team-shared";
import { createClient } from "@/lib/supabase/server";

type Failure = { ok: false; message: string };
export type TeamActionResult = { ok: true } | Failure;
export type InviteResult =
  | { ok: true; token: string; id: string }
  | { ok: false; message?: string; fields?: Partial<Record<"fullName" | "email" | "role", string>> };

async function allowed(): Promise<Failure | null> {
  const manufacturer = await getManufacturerContext();
  if (!manufacturer || manufacturer.status !== "active") return { ok: false, message: "Your manufacturer account is not set up yet." };
  if (!can(manufacturer, "manage_team")) return { ok: false, message: NO_ACCESS_MESSAGE };
  return null;
}

function explain(message: string, fallback: string): string {
  if (/not allowed/i.test(message)) return NO_ACCESS_MESSAGE;
  if (/not yourself/i.test(message)) return "You can't do this to your own account.";
  if (/no such (member|invite|person)/i.test(message)) return "This person is no longer in the list. Refresh the page.";
  return fallback;
}

/** Creates an invitation and returns its one-time link token, shown once. */
export async function inviteMemberAction(input: unknown): Promise<InviteResult> {
  const denied = await allowed();
  if (denied) return denied;

  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) {
    const f = z.flattenError(parsed.error).fieldErrors;
    return { ok: false, fields: { fullName: f.fullName?.[0], email: f.email?.[0], role: f.role?.[0] } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("invite_member", {
    p_name: parsed.data.fullName,
    p_email: parsed.data.email,
    p_role: parsed.data.role,
  });
  if (error) {
    if (/already invited/i.test(error.message)) {
      return { ok: false, fields: { email: "This e-mail already has an open invitation. Open it in the list to get a new link." } };
    }
    if (/cannot invite/i.test(error.message)) {
      return { ok: false, fields: { email: "This e-mail can't be invited. The person may already be on a team." } };
    }
    console.error("invite_member failed", error.message);
    return { ok: false, message: explain(error.message, "We couldn't create the invitation. Please try again.") };
  }
  const result = data as { id?: string; token?: string } | null;
  if (!result?.token || !result.id) return { ok: false, message: "We couldn't create the invitation. Please try again." };
  revalidatePath("/manufacturer/team");
  return { ok: true, token: result.token, id: result.id };
}

/** Makes a fresh link for an open or expired invitation. The old link stops working. */
export async function reissueInviteAction(id: string): Promise<{ ok: true; token: string } | Failure> {
  const denied = await allowed();
  if (denied) return denied;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reissue_invite", { p_id: id });
  const token = (data as { token?: string } | null)?.token;
  if (error || !token) {
    if (error) console.error("reissue_invite failed", error.message);
    return { ok: false, message: explain(error?.message ?? "", "We couldn't make a new link. Please try again.") };
  }
  revalidatePath("/manufacturer/team");
  return { ok: true, token };
}

export async function cancelInviteAction(id: string): Promise<TeamActionResult> {
  const denied = await allowed();
  if (denied) return denied;
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_invite", { p_id: id });
  if (error) {
    console.error("cancel_invite failed", error.message);
    return { ok: false, message: explain(error.message, "We couldn't cancel the invitation. Please try again.") };
  }
  revalidatePath("/manufacturer/team");
  return { ok: true };
}

export async function changeRoleAction(userId: string, role: unknown): Promise<TeamActionResult> {
  const denied = await allowed();
  if (denied) return denied;
  const parsed = teamRoleSchema.safeParse(role);
  if (!parsed.success) return { ok: false, message: "Choose a role." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("change_member_role", { p_user: userId, p_role: parsed.data });
  if (error) {
    console.error("change_member_role failed", error.message);
    return { ok: false, message: explain(error.message, "We couldn't change the role. Please try again.") };
  }
  revalidatePath("/manufacturer/team");
  return { ok: true };
}

export async function revokeMemberAction(userId: string): Promise<TeamActionResult> {
  const denied = await allowed();
  if (denied) return denied;
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_member", { p_user: userId });
  if (error) {
    console.error("revoke_member failed", error.message);
    return { ok: false, message: explain(error.message, "We couldn't revoke access. Please try again.") };
  }
  revalidatePath("/manufacturer", "layout");
  return { ok: true };
}
