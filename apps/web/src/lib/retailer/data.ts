import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { latestPerCarton, type CartonResult, type CartonStatus, type ScanEntry } from "./format";

export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  status: "pending" | "approved" | "rejected";
  reviewedAt: string | null;
}

export interface RetailerContext {
  id: string;
  businessName: string;
  branches: Branch[];
  /** The branch cartons are scanned for: the first approved one. Null until a branch is approved. */
  activeBranch: Branch | null;
}

/** The signed-in person's shop, or null if they have not registered one. Cached per request. */
export const getRetailerContext = cache(async (): Promise<RetailerContext | null> => {
  const supabase = await createClient();
  const { data: retailer, error } = await supabase.from("retailers").select("id, business_name").maybeSingle();
  if (error) console.error("Could not load the retailer", error.message);
  if (!retailer) return null;

  const { data: rows, error: branchError } = await supabase
    .from("retailer_branches")
    .select("id, name, address, city, status, reviewed_at")
    .order("created_at", { ascending: true });
  if (branchError) console.error("Could not load branches", branchError.message);

  const branches: Branch[] = (rows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    status: row.status as Branch["status"],
    reviewedAt: row.reviewed_at,
  }));

  return {
    id: retailer.id,
    businessName: retailer.business_name,
    branches,
    activeBranch: branches.find((b) => b.status === "approved") ?? null,
  };
});

export interface Manufacturer {
  id: string;
  name: string;
  categories: string[];
  /** SKANPROOV has checked the business. Only then may the app say "Business verified". */
  verified: boolean;
  connected: boolean;
  connectedAt: string | null;
}

export interface ManufacturerProfile extends Manufacturer {
  registeredName: string | null;
  rcNumber: string | null;
  address: string | null;
  brands: string[];
  contactEmail: string | null;
}

type ManufacturerRow = {
  id: string;
  name: string;
  categories: string[] | null;
  verified: boolean;
  connected: boolean;
  connected_at: string | null;
};

function toManufacturer(row: ManufacturerRow): Manufacturer {
  return {
    id: row.id,
    name: row.name,
    categories: row.categories ?? [],
    verified: row.verified,
    connected: row.connected,
    connectedAt: row.connected_at,
  };
}

export async function getManufacturers(): Promise<Manufacturer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_manufacturers");
  if (error) {
    console.error("Could not load manufacturers", error.message);
    return [];
  }
  return ((data ?? []) as ManufacturerRow[]).map(toManufacturer);
}

/** One manufacturer's profile, or null when it does not exist (or the person is not a retailer). */
export async function getManufacturer(id: string): Promise<ManufacturerProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_manufacturer", { p_manufacturer: id });
  if (error) {
    console.error("Could not load the manufacturer", error.message);
    return null;
  }
  const row = (data as (ManufacturerRow & {
    registered_name: string | null;
    rc_number: string | null;
    address: string | null;
    brands: string[] | null;
    contact_email: string | null;
  })[] | null)?.[0];
  if (!row) return null;
  return {
    ...toManufacturer(row),
    registeredName: row.registered_name,
    rcNumber: row.rc_number,
    address: row.address,
    brands: row.brands ?? [],
    contactEmail: row.contact_email,
  };
}

/** Checks a carton for a branch. This also records the scan. */
export async function verifyCarton(code: string, branchId: string): Promise<CartonResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("retailer_verify_carton", { p_code: code, p_branch: branchId });
  if (error || !data || typeof data !== "object") {
    if (error) console.error("Carton check failed", error.message);
    return { status: "unavailable" };
  }
  const row = data as {
    status: CartonStatus;
    reason: string;
    scan_id: string;
    received: boolean;
    carton: null | {
      product: string;
      variant: string | null;
      manufacturer: string;
      manufacturer_id: string;
      batch_number: string;
      carton_number: string;
      manufactured_on: string | null;
      expires_on: string | null;
    };
  };
  return {
    status: row.status,
    reason: row.reason,
    scanId: row.scan_id,
    received: row.received,
    carton: row.carton
      ? {
          product: row.carton.product,
          variant: row.carton.variant,
          manufacturer: row.carton.manufacturer,
          manufacturerId: row.carton.manufacturer_id,
          batchNumber: row.carton.batch_number,
          cartonNumber: row.carton.carton_number,
          manufacturedOn: row.carton.manufactured_on,
          expiresOn: row.carton.expires_on,
        }
      : null,
  };
}

const SCAN_COLUMNS =
  "id, code_input, result, reason, product_name, manufacturer_name, batch_number, carton_number, received, received_at, scanned_at";

type ScanRow = {
  id: string;
  code_input: string;
  result: CartonStatus;
  reason: string | null;
  product_name: string | null;
  manufacturer_name: string | null;
  batch_number: string | null;
  carton_number: string | null;
  received: boolean;
  received_at: string | null;
  scanned_at: string;
};

function toEntry(row: ScanRow): ScanEntry {
  return {
    id: row.id,
    code: row.code_input,
    status: row.result,
    reason: row.reason,
    product: row.product_name,
    manufacturer: row.manufacturer_name,
    batch: row.batch_number,
    carton: row.carton_number,
    received: row.received,
    scannedAt: row.scanned_at,
    receivedAt: row.received_at,
  };
}

export async function getScans(limit = 200, since?: Date): Promise<ScanEntry[]> {
  const supabase = await createClient();
  let query = supabase.from("carton_scans").select(SCAN_COLUMNS).order("scanned_at", { ascending: false }).limit(limit);
  if (since) query = query.gte("scanned_at", since.toISOString());
  const { data, error } = await query;
  if (error) {
    console.error("Could not load scans", error.message);
    return [];
  }
  return (data as ScanRow[]).map(toEntry);
}

export interface RetailerUpdate {
  id: string;
  text: string;
  at: string;
  tone: "good" | "warn" | "info";
}

export interface RetailerHome {
  onHold: ScanEntry[];
  onHoldCount: number;
  recent: ScanEntry[];
  month: { scanned: number; received: number; flagged: number };
  connected: Manufacturer[];
  updates: RetailerUpdate[];
}

function startOfLagosMonth(now: Date): Date {
  const lagos = new Date(now.getTime() + 3600_000); // Lagos is UTC+1, no daylight saving
  return new Date(Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), 1) - 3600_000);
}

export async function getRetailerHome(ctx: RetailerContext, now = new Date()): Promise<RetailerHome> {
  const [scans, manufacturers] = await Promise.all([getScans(500), getManufacturers()]);

  // A carton is "on hold" until a later scan of it comes back safe.
  const latest = latestPerCarton(scans);
  const onHold = latest.filter((s) => s.status !== "safe");

  const monthStart = startOfLagosMonth(now).toISOString();
  const thisMonth = scans.filter((s) => s.scannedAt >= monthStart);
  const monthLatest = latestPerCarton(thisMonth);

  const connected = manufacturers.filter((m) => m.connected);

  const updates: RetailerUpdate[] = [];
  for (const b of ctx.branches) {
    if (b.status === "approved" && b.reviewedAt)
      updates.push({ id: `b-${b.id}`, text: `${b.name} was approved. You can now receive cartons.`, at: b.reviewedAt, tone: "good" });
    if (b.status === "rejected" && b.reviewedAt)
      updates.push({ id: `b-${b.id}`, text: `${b.name} was not approved. Contact SKANPROOV for help.`, at: b.reviewedAt, tone: "warn" });
  }
  for (const m of connected) {
    if (m.connectedAt) updates.push({ id: `m-${m.id}`, text: `You connected to ${m.name}.`, at: m.connectedAt, tone: "info" });
  }
  updates.sort((a, b) => (a.at < b.at ? 1 : -1));

  return {
    onHold: onHold.slice(0, 10),
    onHoldCount: onHold.length,
    recent: latest.slice(0, 5),
    month: {
      scanned: monthLatest.length,
      received: monthLatest.filter((s) => s.received).length,
      flagged: monthLatest.filter((s) => s.status !== "safe").length,
    },
    connected,
    updates: updates.slice(0, 5),
  };
}
