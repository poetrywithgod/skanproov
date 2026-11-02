/** Client-safe types and wording for the retailer app. */

export type CartonStatus = "safe" | "suspicious" | "recalled" | "expired";

export interface CartonDetails {
  product: string;
  variant: string | null;
  manufacturer: string;
  manufacturerId: string;
  batchNumber: string;
  cartonNumber: string;
  manufacturedOn: string | null;
  expiresOn: string | null;
}

export type CartonResult =
  | { status: CartonStatus; reason: string; scanId: string; received: boolean; carton: CartonDetails | null }
  | { status: "unavailable" };

export interface ScanEntry {
  id: string;
  code: string;
  status: CartonStatus;
  reason: string | null;
  product: string | null;
  manufacturer: string | null;
  batch: string | null;
  carton: string | null;
  received: boolean;
  scannedAt: string;
  receivedAt: string | null;
}

/** Chip wording from the retailer designs. */
export function scanChip(scan: Pick<ScanEntry, "status" | "received">): { label: string; tone: "good" | "pending" | "warn" | "recalled" | "expired" } {
  switch (scan.status) {
    case "safe":
      return scan.received ? { label: "Received", tone: "good" } : { label: "Verified · Not received", tone: "pending" };
    case "suspicious":
      return { label: "Suspicious · On hold", tone: "warn" };
    case "recalled":
      return { label: "Recalled · Do not sell", tone: "recalled" };
    case "expired":
      return { label: "Expired · Do not sell", tone: "expired" };
  }
}

export const CHIP_TONES = {
  good: "bg-brand-soft text-brand-deep",
  pending: "bg-[#e9edf3] text-[#3d4a63]",
  warn: "bg-[#f6e7d2] text-[#8a4b05]",
  recalled: "bg-[#ecdcfb] text-[#6b2bb5]",
  expired: "bg-[#dfe5f2] text-[#3d4a63]",
} as const;

export function formatScanTime(iso: string, now: Date): string {
  const then = new Date(iso);
  const minutes = Math.round((now.getTime() - then.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" }).format(then);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(iso));
}

/** The same carton can be scanned many times: keep the newest scan per carton. */
export function latestPerCarton<T extends { code: string; carton: string | null; scannedAt: string }>(scans: T[]): T[] {
  const seen = new Map<string, T>();
  for (const scan of scans) {
    const key = scan.carton ?? scan.code.toUpperCase();
    const current = seen.get(key);
    if (!current || scan.scannedAt > current.scannedAt) seen.set(key, scan);
  }
  return [...seen.values()].sort((a, b) => (a.scannedAt < b.scannedAt ? 1 : -1));
}
