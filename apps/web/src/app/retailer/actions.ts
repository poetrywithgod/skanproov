"use server";

import { retailerRegisterSchema } from "@skanproov/validation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type RegisterShopResult =
  | { ok: true }
  | { ok: false; message?: string; fields?: Partial<Record<"business" | "branch" | "address" | "city", string>> };

/** Creates the shop and its first branch. The branch waits for approval before it can receive cartons. */
export async function registerShopAction(input: unknown): Promise<RegisterShopResult> {
  const parsed = retailerRegisterSchema.safeParse(input);
  if (!parsed.success) {
    const f = z.flattenError(parsed.error).fieldErrors;
    return {
      ok: false,
      fields: { business: f.business?.[0], branch: f.branch?.[0], address: f.address?.[0], city: f.city?.[0] },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("register_retailer", {
    p_business: parsed.data.business,
    p_branch: parsed.data.branch,
    p_address: parsed.data.address,
    p_city: parsed.data.city,
  });
  if (error) {
    if (/already a retailer/i.test(error.message)) return { ok: true };
    console.error("register_retailer failed", error.message);
    return { ok: false, message: "We couldn't register your shop. Please try again." };
  }
  revalidatePath("/retailer", "layout");
  return { ok: true };
}

async function setConnection(manufacturerId: string, connect: boolean) {
  if (!z.uuid().safeParse(manufacturerId).success) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc(connect ? "connect_manufacturer" : "disconnect_manufacturer", {
    p_manufacturer: manufacturerId,
  });
  if (error) console.error("Connection change failed", error.message);
  revalidatePath("/retailer", "layout");
}

export async function connectManufacturerAction(formData: FormData) {
  await setConnection(String(formData.get("manufacturerId") ?? ""), true);
}

export async function disconnectManufacturerAction(formData: FormData) {
  await setConnection(String(formData.get("manufacturerId") ?? ""), false);
}

export async function markReceivedAction(formData: FormData) {
  const scanId = String(formData.get("scanId") ?? "");
  if (!z.uuid().safeParse(scanId).success) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("retailer_receive_carton", { p_scan: scanId });
  if (error) console.error("Could not mark received", error.message);
  revalidatePath("/retailer", "layout");
}
