"use server";

import { contactDetailsSchema } from "@skanproov/validation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, getManufacturerContext } from "@/lib/manufacturer/portal";
import { NO_ACCESS_MESSAGE } from "@/lib/manufacturer/team-shared";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";

export type ContactResult =
  | { ok: true }
  | { ok: false; message?: string; fields?: Partial<Record<"contactName" | "contactRole" | "contactPhone" | "qualityEmail" | "website", string>> };

/** Saves the company's contact details. Administrators only; the database checks this again. */
export async function saveContactDetailsAction(input: unknown): Promise<ContactResult> {
  const manufacturer = await getManufacturerContext();
  if (!manufacturer || manufacturer.status !== "active") return { ok: false, message: "Your manufacturer account is not set up yet." };
  if (!can(manufacturer, "manage_settings")) return { ok: false, message: NO_ACCESS_MESSAGE };

  const parsed = contactDetailsSchema.safeParse(input);
  if (!parsed.success) {
    const f = z.flattenError(parsed.error).fieldErrors;
    return {
      ok: false,
      fields: {
        ...(f.contactName?.[0] ? { contactName: f.contactName[0] } : {}),
        ...(f.contactRole?.[0] ? { contactRole: f.contactRole[0] } : {}),
        ...(f.contactPhone?.[0] ? { contactPhone: f.contactPhone[0] } : {}),
        ...(f.qualityEmail?.[0] ? { qualityEmail: f.qualityEmail[0] } : {}),
        ...(f.website?.[0] ? { website: f.website[0] } : {}),
      },
    };
  }

  const supabase = await createClient();
  const d = parsed.data;
  const { error } = await supabase.rpc("update_company_contact", {
    p_name: d.contactName,
    p_role: d.contactRole ?? "",
    p_phone: d.contactPhone ?? "",
    p_quality_email: d.qualityEmail ?? "",
    p_website: d.website ?? "",
  });
  if (error) {
    if (/not allowed/i.test(error.message)) return { ok: false, message: NO_ACCESS_MESSAGE };
    console.error("update_company_contact failed", error.message);
    return { ok: false, message: "We couldn't save your changes. Please try again." };
  }
  revalidatePath(`${site.manufacturer.settings}/contact`);
  return { ok: true };
}
