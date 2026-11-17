/** Roles, permissions and the shapes the Team Management screens use. The database decides who may do what; this file only names things. */

export const ROLE_IDS = ["admin", "code_manager", "compliance_officer", "viewer"] as const;
export type RoleId = (typeof ROLE_IDS)[number];

export const ROLES: readonly { id: RoleId; label: string; description: string }[] = [
  { id: "admin", label: "Administrator", description: "Full control of the account, including team, security and billing." },
  { id: "code_manager", label: "Code Manager", description: "Runs day-to-day production: declares batches, generates and exports codes." },
  { id: "compliance_officer", label: "Compliance Officer", description: "Oversees quality: releases batches, handles recalls and reviews activity." },
  { id: "viewer", label: "Viewer", description: "Read-only access to products, batches and notifications." },
];

export function roleLabel(role: string): string {
  return ROLES.find((r) => r.id === role)?.label ?? role;
}

export function isRoleId(value: unknown): value is RoleId {
  return typeof value === "string" && (ROLE_IDS as readonly string[]).includes(value);
}

/** In the order the design lists them (two columns, left then right). */
export const PERMISSIONS = [
  { key: "manage_products", label: "Manage products" },
  { key: "declare_batches", label: "Declare batches" },
  { key: "generate_codes", label: "Generate codes" },
  { key: "export_codes", label: "Export & print codes" },
  { key: "release_batches", label: "Release batches" },
  { key: "recall_codes", label: "Recall & revoke codes" },
  { key: "view_audit_logs", label: "View audit logs" },
  { key: "export_audit_logs", label: "Export audit logs" },
  { key: "manage_team", label: "Manage team & roles" },
  { key: "manage_settings", label: "Company & security settings" },
  { key: "manage_billing", label: "Subscription & billing" },
] as const;
export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

/** role id -> permissions it has, as the database reports them. */
export type PermissionMatrix = Record<string, readonly string[]>;

export type MemberStatus = "active" | "pending" | "expired" | "revoked";

export const STATUS_LABEL: Record<MemberStatus, string> = {
  active: "Active",
  pending: "Invite pending",
  expired: "Invite expired",
  revoked: "Revoked",
};

export interface TeamRow {
  /** The person's id for a member, the invitation's id for an invitation. */
  key: string;
  kind: "member" | "invite";
  fullName: string;
  email: string;
  role: string;
  status: MemberStatus;
  lastSeenAt: string | null;
  invitedAt: string | null;
  expiresAt: string | null;
}

export interface TeamDetail {
  kind: "member" | "invite";
  key: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  status: MemberStatus;
  lastSeenAt: string | null;
  invitedAt: string | null;
  invitedByName: string | null;
  joinedAt: string | null;
  expiresAt: string | null;
  twoFactor: boolean;
  activity: { summary: string; createdAt: string }[];
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase();
}

/** "10 minutes ago", "2 days ago"; older than a month falls back to a date. */
export function timeAgo(value: string | null, now: number = Date.now()): string {
  if (!value) return "—";
  const seconds = Math.max(0, Math.round((now - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  if (days <= 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Where a person who is not allowed in a screen is told so. */
export const NO_ACCESS_MESSAGE = "Your role does not allow this. Ask an Administrator if you need access.";

const LAGOS = "Africa/Lagos";

/** "14 Mar 2025" in Nigerian time. */
export function fmtDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: LAGOS });
}

/** "21 Oct 2026, 17:05" in Nigerian time. */
export function fmtDateTime(value: string): string {
  const d = new Date(value);
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: LAGOS });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: LAGOS });
  return `${date}, ${time}`;
}
