import { demoDataEnabled } from "../demo";

export type ActivityStatus = "authentic" | "duplicate" | "counterfeit";

export interface HistoryEntry {
  id: string;
  /** Code to open the result screen with. */
  code: string;
  productName: string;
  manufacturer: string | null;
  /** Batch number or serial, whichever we have. */
  reference: string;
  status: ActivityStatus;
  /** ISO timestamp. */
  scannedAt: string;
  points: number;
  pointsState: "credited" | "reported" | "none";
  nafdac: string | null;
  /** Short explanation shown on duplicate and failed rows. */
  note: string | null;
}

export type NotificationKind = "verified" | "unverified" | "recalled" | "expired";

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  scannedAt: string;
  /** Result screen to open. */
  code: string;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function demoHistory(now: Date): HistoryEntry[] {
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
  return [
    {
      id: "h1",
      code: "DEMO-GENUINE",
      productName: "Panadol Extra 500mg",
      manufacturer: "GSK Consumer Nigeria",
      reference: "BN-2024-8839",
      status: "authentic",
      scannedAt: ago(HOUR),
      points: 100,
      pointsState: "credited",
      nafdac: "A4-0291 (Active)",
      note: null,
    },
    {
      id: "h2",
      code: "DEMO-GENUINE",
      productName: "Nestlé Pure Life 750ml",
      manufacturer: "Nestlé Waters Ltd",
      reference: "BN-99321",
      status: "authentic",
      scannedAt: ago(DAY + 2 * HOUR),
      points: 50,
      pointsState: "credited",
      nafdac: null,
      note: null,
    },
    {
      id: "h3",
      code: "DEMO-DUPLICATE",
      productName: "Dettol Antiseptic Liquid 250ml",
      manufacturer: "Reckitt Benckiser",
      reference: "BN-44109",
      status: "duplicate",
      scannedAt: ago(14 * DAY),
      points: 0,
      pointsState: "none",
      nafdac: null,
      note: "This security hash was scanned previously in Ikeja, Lagos.",
    },
    {
      id: "h4",
      code: "SKP-000-INVALID",
      productName: "Aura Vita CBD Elixir 30ml",
      manufacturer: null,
      reference: "Serial #SKP-000-INVALID",
      status: "counterfeit",
      scannedAt: ago(20 * DAY),
      points: 0,
      pointsState: "reported",
      nafdac: null,
      note: "Failed Cryptographic Hash Validation",
    },
  ];
}

function demoNotifications(now: Date): NotificationItem[] {
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
  return [
    {
      id: "n1",
      kind: "verified",
      title: "Your product has been verified!",
      body: "Good news! Your scanned product is registered with SKANPROOV and has passed its verification checks.",
      scannedAt: ago(HOUR),
      code: "DEMO-GENUINE",
    },
    {
      id: "n2",
      kind: "unverified",
      title: "Your product is Unverified!",
      body: "This product has unusual verification activity. Please review the scan result before proceeding.",
      scannedAt: ago(2 * HOUR),
      code: "DEMO-DUPLICATE",
    },
    {
      id: "n3",
      kind: "recalled",
      title: "This Product Has Been Recalled",
      body: "This product has been recalled by the manufacturer. Do not purchase or use it. Follow the recommended next steps.",
      scannedAt: ago(3 * DAY),
      code: "DEMO-GENUINE",
    },
    {
      id: "n4",
      kind: "expired",
      title: "Expired Product",
      body: "This product has passed its expiry date. Do not purchase or use it.",
      scannedAt: ago(5 * DAY),
      code: "DEMO-GENUINE",
    },
  ];
}

/**
 * TODO: read from the database once scans and notifications are stored. Until then real accounts
 * see honest empty states and only demo mode shows sample rows.
 */
export async function getHistory(_userId: string, now: Date = new Date()): Promise<HistoryEntry[]> {
  return demoDataEnabled ? demoHistory(now) : [];
}

export async function getNotifications(_userId: string, now: Date = new Date()): Promise<NotificationItem[]> {
  return demoDataEnabled ? demoNotifications(now) : [];
}

const TIME_ZONE = "Africa/Lagos";

function dayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);
}

export function isToday(iso: string, now: Date = new Date()): boolean {
  return dayKey(new Date(iso)) === dayKey(now);
}

/** "Today, 11:20 AM", "Yesterday, 4:15 PM", "May 18, 2:10 PM". */
export function formatActivityTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat("en-NG", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .replace(/ /g, " ")
    .toUpperCase();
  if (dayKey(date) === dayKey(now)) return `Today, ${time}`;
  if (dayKey(date) === dayKey(new Date(now.getTime() - DAY))) return `Yesterday, ${time}`;
  const day = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, month: "short", day: "numeric" }).format(date);
  return `${day}, ${time}`;
}
