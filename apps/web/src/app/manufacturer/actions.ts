"use server";

import { manufacturerCompanySchema } from "@skanproov/validation";
import { revalidatePath } from "next/cache";
import { getCompanyDraft } from "@/lib/manufacturer/data";
import { createClient } from "@/lib/supabase/server";

export type SubmitResult = { ok: true } | { ok: false; message: string };

/**
 * Sends the company's details and uploaded documents to SKANPROOV to be checked.
 * The details come from the sign-up page (kept in the person's sign-up data), never from the browser
 * at this point. A rejected application is sent again with the details it already has.
 */
export async function submitApplicationAction(): Promise<SubmitResult> {
  const draft = await getCompanyDraft();
  const details = draft ? manufacturerCompanySchema.parse(draft) : null;

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_manufacturer_application", { p: details });
  if (error) {
    if (/already applied/i.test(error.message)) return { ok: true };
    if (/missing documents/i.test(error.message)) {
      return { ok: false, message: "Please upload your company registration certificate and a director's ID first." };
    }
    if (/no details/i.test(error.message)) {
      return { ok: false, message: "We don't have your company details. Please register your company again." };
    }
    console.error("submit_manufacturer_application failed", error.message);
    return { ok: false, message: "We couldn't send your application. Please try again." };
  }
  revalidatePath("/manufacturer", "layout");
  return { ok: true };
}
