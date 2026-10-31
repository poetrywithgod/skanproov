import { extractCode } from "./code";
import { demoDataEnabled } from "./demo";

export interface ProductDetails {
  name: string;
  variant: string | null;
  manufacturer: string;
  batchNumber: string;
  nafdacNumber: string | null;
  /** ISO dates (yyyy-mm-dd). */
  manufacturedOn: string;
  expiresOn: string | null;
}

export type VerifyResult =
  | { status: "genuine"; product: ProductDetails }
  /** We looked and could not confirm it. Never means "fake" on its own; the screen says what to do. */
  | { status: "not_verified" }
  /** The check itself could not run. Never shown as genuine or as a verdict. */
  | { status: "unavailable" };

// Sample products for the demo only. Test values, matching the design.
const DEMO_PRODUCTS: Record<string, ProductDetails> = {
  "123456789012": {
    name: "Indomie Instant Noodles",
    variant: "Chicken Flavour",
    manufacturer: "Dufil Prima Foods Ltd.",
    batchNumber: "IND-TEST-261001",
    nafdacNumber: "NAFDAC/TEST/000001",
    manufacturedOn: "2026-10-01",
    expiresOn: "2027-10-01",
  },
};
DEMO_PRODUCTS["DEMO-GENUINE"] = DEMO_PRODUCTS["123456789012"]!;

/**
 * Checks a scanned or typed code.
 *
 * TODO: replace with the real check (signed codes, batch status, clone detection,
 * recall/revoke) once @skanproov/core and the database tables exist. Until then the
 * only way to get "genuine" is a demo code in demo mode.
 */
export async function verifyCode(raw: string): Promise<VerifyResult> {
  const code = extractCode(raw);
  if (!code) return { status: "not_verified" };

  if (!demoDataEnabled) return { status: "unavailable" };

  const product = DEMO_PRODUCTS[code.toUpperCase()];
  return product ? { status: "genuine", product } : { status: "not_verified" };
}
