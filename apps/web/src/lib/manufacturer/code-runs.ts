import { CODE_FILES_BUCKET } from "@skanproov/validation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { CodeRun } from "./code-run-shared";

export type { CodeRun } from "./code-run-shared";

/** Deletes the files of runs older than 30 days. The runs stay in the history, marked Expired. */
export async function purgeExpiredCodeFiles(): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_expired_code_files");
  if (error) {
    console.error("Could not check expired code files", error.message);
    return;
  }
  const paths = ((data ?? []) as { path: string | null }[]).map((row) => row.path).filter((path): path is string => Boolean(path));
  if (paths.length > 0) await supabase.storage.from(CODE_FILES_BUCKET).remove(paths);
}

/** The manufacturer's generation runs, newest first. */
export const getCodeRuns = cache(async (): Promise<CodeRun[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_code_runs", { p_batch: null });
  if (error) console.error("Could not load the code runs", error.message);
  return (
    (data ?? []) as {
      id: string;
      run_no: number;
      batch_id: string;
      batch_number: string;
      product_name: string;
      variant: string | null;
      quantity: number;
      generated_by_name: string | null;
      created_at: string;
      csv_path: string | null;
      pdf_path: string | null;
      files_expire_at: string | null;
    }[]
  ).map((row) => ({
    id: row.id,
    runNo: Number(row.run_no),
    batchId: row.batch_id,
    batchNumber: row.batch_number,
    productName: row.product_name,
    variant: row.variant,
    quantity: row.quantity,
    generatedByName: row.generated_by_name,
    createdAt: row.created_at,
    csvPath: row.csv_path,
    pdfPath: row.pdf_path,
    filesExpireAt: row.files_expire_at,
  }));
});
