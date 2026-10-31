import { demoDataEnabled } from "../demo";

export type ScanStatus = "authentic" | "duplicate" | "not_verified";

export interface ScanEntry {
  id: string;
  productName: string;
  status: ScanStatus;
  /** ISO timestamp. */
  scannedAt: string;
  points: number;
  pointsState: "credited" | "reported" | "none";
}

export interface HomeData {
  points: number;
  unreadNotifications: number;
  recentScans: ScanEntry[];
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function demoHome(now: Date): HomeData {
  return {
    points: 2450,
    unreadNotifications: 3,
    recentScans: [
      {
        id: "demo-1",
        productName: "Nestlé Pure Life 750ml",
        status: "authentic",
        scannedAt: new Date(now.getTime() - 1 * HOUR).toISOString(),
        points: 50,
        pointsState: "credited",
      },
      {
        id: "demo-2",
        productName: "Panadol Extra 500mg (20pk)",
        status: "authentic",
        scannedAt: new Date(now.getTime() - 1 * DAY).toISOString(),
        points: 100,
        pointsState: "credited",
      },
      {
        id: "demo-3",
        productName: "Dettol Antiseptic 250ml",
        status: "duplicate",
        scannedAt: new Date(now.getTime() - 14 * DAY).toISOString(),
        points: 0,
        pointsState: "reported",
      },
    ],
  };
}

/**
 * What the home screen shows for a signed-in person.
 *
 * TODO: read points, scan history and notifications from the database once those tables exist.
 * Until then real accounts see zero points and no scans (honest empty states).
 */
export async function getHomeData(_userId: string, now: Date = new Date()): Promise<HomeData> {
  if (demoDataEnabled) return demoHome(now);
  return { points: 0, unreadNotifications: 0, recentScans: [] };
}

const TIME_ZONE = "Africa/Lagos";

function dayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date); // yyyy-mm-dd
}

/** "Today, 11:20 AM", "Yesterday", or "May 18". */
export function formatScanTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const today = dayKey(now);
  if (dayKey(date) === today) {
    const time = new Intl.DateTimeFormat("en-NG", {
      timeZone: TIME_ZONE,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .format(date)
      .replace(/ /g, " ")
      .toUpperCase();
    return `Today, ${time}`;
  }
  if (dayKey(date) === dayKey(new Date(now.getTime() - DAY))) return "Yesterday";
  return new Intl.DateTimeFormat("en-NG", { timeZone: TIME_ZONE, month: "short", day: "numeric" }).format(date);
}
