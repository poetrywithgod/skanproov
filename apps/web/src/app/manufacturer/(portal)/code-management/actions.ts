"use server";

import { CODE_FILES_BUCKET, generateCodesSchema, runCode } from "@skanproov/validation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buildCsv, buildLabelPdf, type GeneratedCode } from "@/lib/manufacturer/code-files";
import { getBatch } from "@/lib/manufacturer/batches";
import { getManufacturerContext } from "@/lib/manufacturer/portal";
import { createClient } from "@/lib/supabase/server";

type FieldName = "batchId" | "quantity" | "format";
export type GenerateCodesResult =
  | { ok: true; runNo: number; quantity: number }
  | { ok: false; message?: string; fields?: Partial<Record<FieldName, string>> };

const GENERIC = "We couldn't generate these codes. Nothing was created. Please try again.";

/**
 * Generates a run of codes for a batch: asks the database for them (it keeps only hashes), builds
 * the CSV and the label PDF, stores both for 30 days and records them. If anything after the
 * database step fails, the run is discarded so no code exists that nobody has seen.
 */
export async function generateCodesAction(input: unknown): Promise<GenerateCodesResult> {
  const manufacturer = await getManufacturerContext();
  if (!manufacturer) return { ok: false, message: "Your manufacturer account is not set up yet." };

  const parsed = generateCodesSchema.safeParse(input);
  if (!parsed.success) {
    const f = z.flattenError(parsed.error).fieldErrors as Record<string, string[] | undefined>;
    return {
      ok: false,
      fields: Object.fromEntries(Object.entries(f).map(([key, messages]) => [key, messages?.[0]])) as Partial<Record<FieldName, string>>,
    };
  }
  const { batchId, quantity, format } = parsed.data;

  const batch = await getBatch(batchId);
  if (!batch) return { ok: false, fields: { batchId: "Choose a batch." } };
  if (batch.releasedAt) return { ok: false, fields: { batchId: "This batch has been released, so no more codes can be added." } };
  if (batch.status !== "active") return { ok: false, fields: { batchId: "This batch has been recalled." } };
  const available = Math.max(0, (batch.units ?? 0) - batch.codesGenerated);
  if (quantity > available) {
    return { ok: false, fields: { quantity: `Only ${available.toLocaleString("en-US")} codes are left for this batch.` } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("generate_codes", { p_batch: batchId, p_quantity: quantity });
  if (error || !data) {
    console.error("generate_codes failed", error?.message);
    if (error && /over the units/i.test(error.message)) return { ok: false, fields: { quantity: "That is more than the units left for this batch." } };
    if (error && /batch released/i.test(error.message)) return { ok: false, fields: { batchId: "This batch has been released, so no more codes can be added." } };
    return { ok: false, message: GENERIC };
  }

  const result = data as { run_id: string; run_no: number; codes: { t: string; p: string }[] };
  const uploaded: string[] = [];
  try {
    if (result.codes.length !== quantity) throw new Error(`expected ${quantity} codes, got ${result.codes.length}`);
    const codes: GeneratedCode[] = result.codes.map((c) => ({ token: c.t, pin: c.p }));
    const info = { productName: batch.productName, variant: batch.variant, batchNumber: batch.batchNumber, runNo: Number(result.run_no), format };
    const csv = Buffer.from(buildCsv(codes, info), "utf8");
    const pdf = await buildLabelPdf(codes, info);

    const base = `${manufacturer.id}/${result.run_id}/${runCode(Number(result.run_no))}`;
    const csvPath = `${base}.csv`;
    const pdfPath = `${base}.pdf`;
    const storage = supabase.storage.from(CODE_FILES_BUCKET);
    const a = await storage.upload(csvPath, csv, { contentType: "text/csv" });
    if (a.error) throw a.error;
    uploaded.push(csvPath);
    const b = await storage.upload(pdfPath, pdf, { contentType: "application/pdf" });
    if (b.error) throw b.error;
    uploaded.push(pdfPath);

    const attach = await supabase.rpc("attach_code_run_files", { p_run: result.run_id, p_csv: csvPath, p_pdf: pdfPath });
    if (attach.error) throw attach.error;
  } catch (err) {
    console.error("Could not finish the code run", err instanceof Error ? err.message : err);
    if (uploaded.length > 0) await supabase.storage.from(CODE_FILES_BUCKET).remove(uploaded);
    const discard = await supabase.rpc("discard_code_run", { p_run: result.run_id });
    if (discard.error) console.error("Could not discard the code run", discard.error.message);
    return { ok: false, message: GENERIC };
  }

  revalidatePath("/manufacturer", "layout");
  return { ok: true, runNo: Number(result.run_no), quantity };
}
