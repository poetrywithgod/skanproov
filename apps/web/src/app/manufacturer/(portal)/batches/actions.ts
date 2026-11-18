"use server";

import { batchSchema, recallBatchSchema, revokeBatchSchema } from "@skanproov/validation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, getManufacturerContext } from "@/lib/manufacturer/portal";
import { NO_ACCESS_MESSAGE } from "@/lib/manufacturer/team-shared";
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

type RecallField = "reason" | "message" | "note";
export type RecallResult = { ok: true } | { ok: false; message?: string; fields?: Partial<Record<RecallField, string>> };

function recallError(message: string): string | null {
  if (/not allowed/i.test(message)) return "Only an Administrator or a Compliance Officer can recall or revoke a batch.";
  if (/batch is revoked/i.test(message)) return "This batch has been revoked. That can't be undone.";
  if (/already recalled/i.test(message)) return "This batch is already recalled. Refresh the page.";
  if (/not recalled/i.test(message)) return "This batch is not recalled. Refresh the page.";
  if (/batch not released/i.test(message)) return "Only a released batch can be recalled. An unreleased batch can be revoked.";
  if (/no such batch/i.test(message)) return "We couldn't find this batch.";
  return null;
}

async function recallOrRevoke(kind: "recall" | "revoke", input: unknown): Promise<RecallResult> {
  const manufacturer = await getManufacturerContext();
  if (!manufacturer || manufacturer.status !== "active") return { ok: false, message: "Your manufacturer account is not set up yet." };
  if (!can(manufacturer, "recall_codes")) return { ok: false, message: NO_ACCESS_MESSAGE };

  const parsed = (kind === "recall" ? recallBatchSchema : revokeBatchSchema).safeParse(input);
  if (!parsed.success) {
    const f = z.flattenError(parsed.error).fieldErrors as Record<string, string[] | undefined>;
    return {
      ok: false,
      fields: {
        ...(f.reason?.[0] ? { reason: f.reason[0] } : {}),
        ...(f.message?.[0] ? { message: f.message[0] } : {}),
        ...(f.note?.[0] ? { note: f.note[0] } : {}),
      },
    };
  }
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc(kind === "recall" ? "recall_batch" : "revoke_batch", {
    p_id: d.batchId,
    p_reason: d.reason,
    p_message: d.message,
    p_note: d.note ?? "",
  });
  if (error) {
    const known = recallError(error.message);
    if (!known) console.error(`${kind}_batch failed`, error.message);
    return { ok: false, message: known ?? "We couldn't save this. Please try again." };
  }
  revalidatePath("/manufacturer", "layout");
  return { ok: true };
}

/** Recalls a released batch (can be lifted later). Administrators and Compliance Officers. */
export async function recallBatchAction(input: unknown): Promise<RecallResult> {
  return recallOrRevoke("recall", input);
}

/** Revokes a batch for good. Administrators and Compliance Officers. */
export async function revokeBatchAction(input: unknown): Promise<RecallResult> {
  return recallOrRevoke("revoke", input);
}

/** Lifts a recall, so the batch's codes verify again. */
export async function liftRecallAction(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const manufacturer = await getManufacturerContext();
  if (!manufacturer || manufacturer.status !== "active") return { ok: false, message: "Your manufacturer account is not set up yet." };
  if (!can(manufacturer, "recall_codes")) return { ok: false, message: NO_ACCESS_MESSAGE };
  const supabase = await createClient();
  const { error } = await supabase.rpc("lift_recall", { p_id: id });
  if (error) {
    const known = recallError(error.message);
    if (!known) console.error("lift_recall failed", error.message);
    return { ok: false, message: known ?? "We couldn't lift the recall. Please try again." };
  }
  revalidatePath("/manufacturer", "layout");
  return { ok: true };
}
