import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { BatchDetail, BatchListItem } from "./batch-shared";

export type { BatchDetail, BatchListItem, BatchProductOption } from "./batch-shared";
export { batchCode } from "./batch-shared";

interface BatchRow {
  id: string;
  batch_no: number;
  batch_number: string;
  product_id: string;
  product_name: string;
  variant: string | null;
  sku: string | null;
  manufactured_on: string;
  expires_on: string | null;
  units: number | null;
  status: string;
  released_at: string | null;
  codes_generated: number;
  created_at: string;
}

function toBatch(row: BatchRow): BatchListItem {
  return {
    id: row.id,
    batchNo: Number(row.batch_no),
    batchNumber: row.batch_number,
    productId: row.product_id,
    productName: row.product_name,
    variant: row.variant,
    sku: row.sku,
    manufacturedOn: row.manufactured_on,
    expiresOn: row.expires_on,
    units: row.units,
    status: row.status as BatchListItem["status"],
    releasedAt: row.released_at,
    codesGenerated: Number(row.codes_generated),
    createdAt: row.created_at,
  };
}

/** Every batch of the signed-in person's manufacturer, newest first. */
export const getBatches = cache(async (): Promise<BatchListItem[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_batches");
  if (error) console.error("Could not load the batches", error.message);
  return ((data ?? []) as BatchRow[]).map(toBatch);
});

/** One batch of the signed-in person's manufacturer, or null. */
export const getBatch = cache(async (id: string): Promise<BatchDetail | null> => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_batch", { p_id: id });
  if (error) console.error("Could not load the batch", error.message);
  const row = data?.[0] as (BatchRow & { facility: string | null; notes: string | null; certificate_path: string | null; declared_by_name: string | null }) | undefined;
  if (!row) return null;
  return { ...toBatch(row), facility: row.facility, notes: row.notes, certificatePath: row.certificate_path, declaredByName: row.declared_by_name };
});
