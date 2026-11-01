import { extractCode } from "./code";
import { createClient } from "./supabase/server";

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
  | { status: "genuine"; product: ProductDetails; points: number }
  /** Scanned before by someone else. */
  | { status: "duplicate"; product: ProductDetails }
  | { status: "recalled"; product: ProductDetails }
  | { status: "expired"; product: ProductDetails }
  /** We looked and could not confirm it. Never means "fake" on its own; the screen says what to do. */
  | { status: "not_verified" }
  /** The check itself could not run. Never shown as genuine or as a verdict. */
  | { status: "unavailable" };

interface RpcProduct {
  name: string;
  variant: string | null;
  manufacturer: string;
  batch_number: string;
  nafdac_number: string | null;
  manufactured_on: string;
  expires_on: string | null;
}

interface RpcResult {
  status: "genuine" | "duplicate" | "recalled" | "expired" | "not_verified";
  product?: RpcProduct;
  points?: number;
}

/**
 * Checks a scanned or typed code with the database (public.verify_product). When the person is
 * signed in, this also records the scan, awards points and writes a notification.
 */
export async function verifyCode(raw: string): Promise<VerifyResult> {
  const code = extractCode(raw);
  if (!code) return { status: "not_verified" };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("verify_product", { p_code: code });
    if (error || !data) {
      console.error("Verification failed", error?.message);
      return { status: "unavailable" };
    }

    const result = data as RpcResult;
    if (result.status === "not_verified" || !result.product) return { status: "not_verified" };

    const product: ProductDetails = {
      name: result.product.name,
      variant: result.product.variant,
      manufacturer: result.product.manufacturer,
      batchNumber: result.product.batch_number,
      nafdacNumber: result.product.nafdac_number,
      manufacturedOn: result.product.manufactured_on,
      expiresOn: result.product.expires_on,
    };
    return result.status === "genuine"
      ? { status: "genuine", product, points: result.points ?? 0 }
      : { status: result.status, product };
  } catch (error) {
    // Dynamic-rendering signals must reach Next.js; anything else means the check could not run.
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("Verification failed", error);
    return { status: "unavailable" };
  }
}
