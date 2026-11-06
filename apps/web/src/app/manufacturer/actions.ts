"use server";

import { manufacturerApplySchema } from "@skanproov/validation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type FieldName = "company" | "rcNumber" | "nafdacNumber" | "category" | "address" | "city";
export type ApplyResult = { ok: true } | { ok: false; message?: string; fields?: Partial<Record<FieldName, string>> };

/** Sends the company's details to SKANPROOV to be checked. */
export async function applyManufacturerAction(input: unknown): Promise<ApplyResult> {
  const parsed = manufacturerApplySchema.safeParse(input);
  if (!parsed.success) {
    const f = z.flattenError(parsed.error).fieldErrors;
    return {
      ok: false,
      fields: {
        company: f.company?.[0],
        rcNumber: f.rcNumber?.[0],
        nafdacNumber: f.nafdacNumber?.[0],
        category: f.category?.[0],
        address: f.address?.[0],
        city: f.city?.[0],
      },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("apply_manufacturer", {
    p_company: parsed.data.company,
    p_rc: parsed.data.rcNumber,
    p_nafdac: parsed.data.nafdacNumber ?? "",
    p_category: parsed.data.category,
    p_address: parsed.data.address,
    p_city: parsed.data.city,
  });
  if (error) {
    if (/already applied/i.test(error.message)) return { ok: true };
    console.error("apply_manufacturer failed", error.message);
    return { ok: false, message: "We couldn't send your application. Please try again." };
  }
  revalidatePath("/manufacturer", "layout");
  return { ok: true };
}
