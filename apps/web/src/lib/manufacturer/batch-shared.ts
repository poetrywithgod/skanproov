import type { ProductStatus } from "@skanproov/validation";

/** The shape of batches, free of server code so client components can use it. Reads live in batches.ts. */

export interface BatchListItem {
  id: string;
  /** Shown as BT-000124. */
  batchNo: number;
  batchNumber: string;
  productId: string;
  productName: string;
  variant: string | null;
  sku: string | null;
  manufacturedOn: string;
  expiresOn: string | null;
  units: number | null;
  status: "active" | "recalled" | "revoked";
  releasedAt: string | null;
  codesGenerated: number;
  createdAt: string;
}

export interface BatchDetail extends BatchListItem {
  facility: string | null;
  notes: string | null;
  certificatePath: string | null;
  declaredByName: string | null;
}

/** A registered product a batch can be declared for. */
export interface BatchProductOption {
  id: string;
  name: string;
  variant: string | null;
  sku: string | null;
  nafdacNumber: string | null;
  category: string | null;
  packSize: string | null;
  status: ProductStatus;
}

/** "BT-000124" */
export function batchCode(batchNo: number): string {
  return `BT-${String(batchNo).padStart(6, "0")}`;
}
