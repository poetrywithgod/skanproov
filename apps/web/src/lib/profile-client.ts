import type { ProfileData } from "@skanproov/validation";
import { createClient } from "@/lib/supabase/browser";

export type SaveProfileResult = { ok: true } | { ok: false; message: string; field?: "phone" };

/** Saves the signed-in person's name and phone. Row level security limits this to their own row. */
export async function saveProfile(userId: string, input: ProfileData): Promise<SaveProfileResult> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: input.fullName, phone: input.phone })
    .eq("id", userId)
    .select("id");

  if (error) {
    // 23505 = unique violation: another account already uses this phone number.
    if (error.code === "23505") {
      return { ok: false, field: "phone", message: "That phone number is already used by another account." };
    }
    return { ok: false, message: "We couldn't save your changes. Please try again." };
  }
  if (!data || data.length === 0) {
    return { ok: false, message: "We couldn't save your changes. Please sign in again and retry." };
  }
  return { ok: true };
}
