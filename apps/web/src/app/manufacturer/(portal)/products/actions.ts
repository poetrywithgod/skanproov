"use server";

import { PRODUCT_IMAGE_BUCKET, productDraftSchema, productSchema } from "@skanproov/validation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getManufacturerContext } from "@/lib/manufacturer/portal";
import { createClient } from "@/lib/supabase/server";

type FieldName = "name" | "sku" | "category" | "variant" | "packSize" | "description" | "brand" | "nafdacNumber";
export type SaveProductResult =
  | { ok: true; id: string }
  | { ok: false; message?: string; fields?: Partial<Record<FieldName, string>> };

/**
 * Saves a product: registers it when it is complete, or keeps it as a draft. `id` is empty for a
 * new product. The picture (if any) was already uploaded to the manufacturer's folder by the browser.
 */
export async function saveProductAction(input: unknown, id?: string): Promise<SaveProductResult> {
  const manufacturer = await getManufacturerContext();
  if (!manufacturer) return { ok: false, message: "Your manufacturer account is not set up yet." };

  const isDraft = typeof input === "object" && input !== null && (input as { draft?: unknown }).draft === true;
  const draft = productDraftSchema.safeParse(input);
  const full = productSchema.safeParse(input);
  const parsed = isDraft ? draft : full;
  if (!parsed.success) {
    const f = z.flattenError(parsed.error as z.ZodError).fieldErrors as Record<string, string[] | undefined>;
    return {
      ok: false,
      fields: Object.fromEntries(Object.entries(f).map(([key, messages]) => [key, messages?.[0]])) as Partial<Record<FieldName, string>>,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_product", { p: parsed.data, p_id: id ?? null });
  if (error) {
    if (/sku taken/i.test(error.message)) return { ok: false, fields: { sku: "You already have a product with this SKU." } };
    if (/incomplete/i.test(error.message)) {
      return { ok: false, message: "Add a SKU and a category to register this product." };
    }
    console.error("save_product failed", error.message);
    return { ok: false, message: "We couldn't save this product. Please try again." };
  }

  const row = data?.[0] as { id: string; replaced_image: string | null } | undefined;
  if (!row) return { ok: false, message: "We couldn't save this product. Please try again." };
  if (row.replaced_image) {
    // The old picture is no longer used.
    await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([row.replaced_image]);
  }
  revalidatePath("/manufacturer/products", "layout");
  return { ok: true, id: row.id };
}
