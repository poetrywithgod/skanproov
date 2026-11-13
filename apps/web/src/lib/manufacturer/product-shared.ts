import type { ProductStatus } from "@skanproov/validation";
import { PRODUCT_IMAGE_BUCKET } from "@skanproov/validation";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * The shape of products and the helpers that need no server access, so client components can use
 * them too. The database reads live in products.ts.
 */

export interface Product {
  id: string;
  /** Shown as PRD-00024. */
  productNo: number;
  name: string;
  variant: string | null;
  packSize: string | null;
  description: string | null;
  sku: string | null;
  category: string | null;
  brand: string | null;
  nafdacNumber: string | null;
  imagePath: string | null;
  status: ProductStatus;
  updatedAt: string;
}

export interface ProductListItem extends Product {
  createdAt: string;
  batchCount: number;
}

export interface ProductDetail extends Product {
  registeredAt: string | null;
  registeredByName: string | null;
}

export interface ProductBatch {
  id: string;
  batchNumber: string;
  manufacturedOn: string;
  expiresOn: string | null;
  units: number | null;
  status: "active" | "recalled" | "revoked";
  releasedAt: string | null;
  codesGenerated: number;
}

/** "PRD-00024" */
export function productCode(productNo: number): string {
  return `PRD-${String(productNo).padStart(5, "0")}`;
}

/** The public address of a product picture, or null if it has none. */
export function productImageUrl(path: string | null): string | null {
  const env = getSupabaseEnv();
  if (!path || !env) return null;
  return `${env.url}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

