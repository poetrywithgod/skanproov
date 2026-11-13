"use server";

import { batchSchema } from "@skanproov/validation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getManufacturerContext } from "@/lib/manufacturer/portal";
import { createClient } from "@/lib/supabase/server";

type FieldName = "productId" | "batchNumber" | "manufacturedOn" | "expiresOn" | "units" | "facility" | "notes";
export type DeclareBatchResult =
  | { ok: true; id: string }
  | { ok: false; message?: string; fields?: Partial<Record<FieldName, string>> };

/** Declares a batch. The certificate (if any) was already uploaded to the manufacturer's folder by the browser. */
export async function declareBatchAction(input: unknown): Promise<DeclareBatchResult> {
  const manufacturer = await getManufacturerContext();
  if (!manufacturer) return { ok: false, message: "Your manufacturer account is not set up yet." };

  const parsed = batchSchema.safeParse(input);
  if (!parsed.success) {
    const f = z.flattenError(parsed.error).fieldErrors as Record<string, string[] | undefined>;
    return {
      ok: false,
      fields: Object.fromEntries(Object.entries(f).map(([key, messages]) => [key, messages?.[0]])) as Partial<Record<FieldName, string>>,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("declare_batch", { p: parsed.data });
  if (error) {
    if (/batch number taken/i.test(error.message)) {
      return { ok: false, fields: { batchNumber: "This product already has a batch with this number." } };
    }
    if (/no such product|product is a draft/i.test(error.message)) {
      return { ok: false, fields: { productId: "Choose a registered product." } };
    }
    console.error("declare_batch failed", error.message);
    return { ok: false, message: "We couldn't declare this batch. Please try again." };
  }
  if (typeof data !== "string") return { ok: false, message: "We couldn't declare this batch. Please try again." };
  revalidatePath("/manufacturer", "layout");
  return { ok: true, id: data };
}

export type ReleaseBatchResult = { ok: true } | { ok: false; message: string };

/** Releases a batch at dispatch: from now on its codes verify. */
export async function releaseBatchAction(id: string): Promise<ReleaseBatchResult> {
  const manufacturer = await getManufacturerContext();
  if (!manufacturer) return { ok: false, message: "Your manufacturer account is not set up yet." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("release_batch", { p_id: id });
  if (error) {
    if (/no codes/i.test(error.message)) return { ok: false, message: "Generate codes for this batch before releasing it." };
    if (/batch is (recalled|revoked)/i.test(error.message)) return { ok: false, message: "This batch has been recalled, so it cannot be released." };
    console.error("release_batch failed", error.message);
    return { ok: false, message: "We couldn't release this batch. Please try again." };
  }
  revalidatePath("/manufacturer", "layout");
  return { ok: true };
}
