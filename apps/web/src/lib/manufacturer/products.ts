import type { ProductStatus } from "@skanproov/validation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Product, ProductBatch, ProductDetail, ProductListItem } from "./product-shared";

export type { Product, ProductBatch, ProductDetail, ProductListItem } from "./product-shared";
export { productCode, productImageUrl } from "./product-shared";

interface ProductRowBase {
  id: string;
  product_no: number;
  name: string;
  variant: string | null;
  pack_size: string | null;
  description: string | null;
  sku: string | null;
  category: string | null;
  brand: string | null;
  nafdac_number: string | null;
  image_path: string | null;
  status: string;
  updated_at: string;
}

function toProduct(row: ProductRowBase): Product {
  return {
    id: row.id,
    productNo: Number(row.product_no),
    name: row.name,
    variant: row.variant,
    packSize: row.pack_size,
    description: row.description,
    sku: row.sku,
    category: row.category,
    brand: row.brand,
    nafdacNumber: row.nafdac_number,
    imagePath: row.image_path,
    status: row.status as ProductStatus,
    updatedAt: row.updated_at,
  };
}

/** Every product of the signed-in person's manufacturer, most recently updated first. */
export const getProducts = cache(async (): Promise<ProductListItem[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_products");
  if (error) console.error("Could not load the products", error.message);
  return (data ?? []).map((row: ProductRowBase & { created_at: string; batch_count: number }) => ({
    ...toProduct(row),
    createdAt: row.created_at,
    batchCount: Number(row.batch_count),
  }));
});

/** One product of the signed-in person's manufacturer, or null. */
export const getProduct = cache(async (id: string): Promise<ProductDetail | null> => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_product", { p_id: id });
  if (error) console.error("Could not load the product", error.message);
  const row = data?.[0] as (ProductRowBase & { registered_at: string | null; registered_by_name: string | null }) | undefined;
  if (!row) return null;
  return { ...toProduct(row), registeredAt: row.registered_at, registeredByName: row.registered_by_name };
});

/** The batches declared for a product, newest production date first. */
export const getProductBatches = cache(async (productId: string): Promise<ProductBatch[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_product_batches", { p_product: productId });
  if (error) console.error("Could not load the batches", error.message);
  return (data ?? []).map(
    (row: {
      id: string;
      batch_number: string;
      manufactured_on: string;
      expires_on: string | null;
      units: number | null;
      status: string;
      released_at: string | null;
      codes_generated: number;
    }) => ({
      id: row.id,
      batchNumber: row.batch_number,
      manufacturedOn: row.manufactured_on,
      expiresOn: row.expires_on,
      units: row.units,
      status: row.status as ProductBatch["status"],
      releasedAt: row.released_at,
      codesGenerated: Number(row.codes_generated),
    }),
  );
});
