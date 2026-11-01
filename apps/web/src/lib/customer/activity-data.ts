import { createClient } from "@/lib/supabase/server";

export type ActivityStatus = "authentic" | "duplicate" | "not_verified" | "recalled" | "expired";

export interface HistoryEntry {
  id: string;
  /** What the person scanned or typed; opens the result screen again. */
  code: string;
  productName: string;
  manufacturer: string | null;
  /** Batch number, or the code itself when we did not recognise it. */
  reference: string;
  status: ActivityStatus;
  /** ISO timestamp. */
  scannedAt: string;
  points: number;
  pointsState: "credited" | "none";
  nafdac: string | null;
  /** Short explanation shown on duplicate, recalled, expired and unrecognised rows. */
  note: string | null;
}

export type NotificationKind = "verified" | "unverified" | "recalled" | "expired";

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  scannedAt: string;
  unread: boolean;
  /** Result screen to open. */
  code: string | null;
}

interface ScanRow {
  id: string;
  code_input: string;
  result: "genuine" | "duplicate" | "recalled" | "expired" | "not_verified";
  product_name: string | null;
  manufacturer_name: string | null;
  batch_number: string | null;
  nafdac_number: string | null;
  note: string | null;
  points: number;
  scanned_at: string;
}

const SCAN_COLUMNS =
  "id, code_input, result, product_name, manufacturer_name, batch_number, nafdac_number, note, points, scanned_at";

function toEntry(row: ScanRow): HistoryEntry {
  const unknown = row.result === "not_verified";
  return {
    id: row.id,
    code: row.code_input,
    productName: unknown ? "Unrecognised code" : (row.product_name ?? "Product"),
    manufacturer: row.manufacturer_name,
    reference: unknown ? `Code ${row.code_input}` : (row.batch_number ?? ""),
    status: row.result === "genuine" ? "authentic" : row.result,
    scannedAt: row.scanned_at,
    points: row.points,
    pointsState: row.points > 0 ? "credited" : "none",
    nafdac: row.nafdac_number,
    note: unknown ? "We couldn't confirm this code. Check where you bought the product." : row.note,
  };
}

/** The signed-in person's scans, newest first. Row level security limits this to their own. */
export async function getHistory(limit = 100): Promise<HistoryEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scans")
    .select(SCAN_COLUMNS)
    .order("scanned_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Could not load scan history", error.message);
    return [];
  }
  return ((data ?? []) as ScanRow[]).map(toEntry);
}

interface NotificationRow {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
  scans: { code_input: string } | { code_input: string }[] | null;
}

export async function getNotifications(limit = 50): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, title, body, created_at, read_at, scans(code_input)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Could not load notifications", error.message);
    return [];
  }
  return ((data ?? []) as unknown as NotificationRow[]).map((row) => {
    const scan = Array.isArray(row.scans) ? row.scans[0] : row.scans;
    return {
      id: row.id,
      kind: row.kind,
      title: row.title,
      body: row.body,
      scannedAt: row.created_at,
      unread: row.read_at === null,
      code: scan?.code_input ?? null,
    };
  });
}
