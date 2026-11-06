import { getLatestProfileChange, getScans, type RetailerContext } from "./data";
import { latestPerCarton } from "./format";
import { site } from "@/lib/site";

export type NotificationKind = "suspicious" | "recalled" | "expired" | "good" | "warn" | "info";

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** When it happened (ISO). */
  at: string;
  href?: string;
  unread: boolean;
}

export interface Notifications {
  /** Cartons you must not sell, newest first. They stay until a later scan clears them. */
  attention: Notification[];
  /** Approvals and decisions, newest first. */
  updates: Notification[];
  unread: number;
}

const ATTENTION_DAYS = 60;

/**
 * Worked out from real records, so there is nothing to keep in step. Anything newer than the
 * last "Mark all read" is unread.
 */
export async function getNotifications(shop: RetailerContext): Promise<Notifications> {
  const readAt = shop.notificationsReadAt ?? "";
  const since = new Date(Date.now() - ATTENTION_DAYS * 24 * 3600_000);
  const [scans, change] = await Promise.all([getScans(500, since), getLatestProfileChange()]);

  const attention: Notification[] = latestPerCarton(scans)
    .filter((s) => s.status !== "safe")
    .map((s) => {
      const what = s.product ?? "Unknown carton";
      const ref = s.carton ?? s.code;
      const kind = s.status as "suspicious" | "recalled" | "expired";
      return {
        id: `s-${s.id}`,
        kind,
        title:
          kind === "suspicious" ? "Suspicious carton on hold" : kind === "recalled" ? "Recalled carton: do not sell" : "Expired carton: do not sell",
        body: `${what} (${ref}). ${s.reason ?? "Keep it away from your shelves."}`,
        at: s.scannedAt,
        href: `${site.retailer.result}/${encodeURIComponent(s.code)}`,
        unread: s.scannedAt > readAt,
      };
    });

  const updates: Notification[] = [];
  for (const b of shop.branches) {
    if (!b.reviewedAt) continue;
    if (b.status === "approved")
      updates.push({ id: `b-${b.id}`, kind: "good", title: "Branch approved", body: `${b.name} can now receive cartons.`, at: b.reviewedAt, href: site.retailer.scan, unread: b.reviewedAt > readAt });
    if (b.status === "rejected")
      updates.push({ id: `b-${b.id}`, kind: "warn", title: "Branch not approved", body: `${b.name} was not approved. Contact SKANPROOV for help.`, at: b.reviewedAt, href: site.retailer.profile, unread: b.reviewedAt > readAt });
  }
  if (change?.reviewedAt && change.status !== "pending") {
    const approved = change.status === "approved";
    updates.push({
      id: "p-change",
      kind: approved ? "good" : "warn",
      title: approved ? "Business details approved" : "Business details not approved",
      body: approved ? "Your changes now apply to your shop." : (change.reviewNote ?? "Check the details and send them again."),
      at: change.reviewedAt,
      href: approved ? site.retailer.profile : site.retailer.businessProfile,
      unread: change.reviewedAt > readAt,
    });
  }
  updates.sort((a, b) => (a.at < b.at ? 1 : -1));

  return {
    attention,
    updates,
    unread: [...attention, ...updates].filter((n) => n.unread).length,
  };
}
