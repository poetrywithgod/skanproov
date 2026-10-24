/**
 * Storage contract. Apps and @skanproov/core depend on this interface only.
 * Migrating off Supabase means writing a new adapter, nothing else.
 */
export interface Batch {
  id: string;
  manufacturerId: string;
  productId: string;
  batchNumber: string;
  createdAt: string;
}

export interface ProductCode {
  id: string;
  batchId: string;
  /** Public code printed or encoded in the QR. Never the signing secret. */
  publicCode: string;
  status: "generated" | "released" | "revoked";
}

export interface Repository {
  getBatchById(id: string): Promise<Batch | null>;
  getCodeByPublicCode(publicCode: string): Promise<ProductCode | null>;
}
