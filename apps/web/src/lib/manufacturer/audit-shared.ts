/** Shared by the Audit Logs screen, its data layer and the CSV export. */

export const AUDIT_PAGE_SIZE = 10;

export const AUDIT_GROUPS = [
  { value: "", label: "All Activity Types" },
  { value: "batches", label: "Batches" },
  { value: "codes", label: "Codes & exports" },
  { value: "products", label: "Products" },
  { value: "team", label: "Team & permissions" },
  { value: "settings", label: "Settings" },
  { value: "audit", label: "Audit log" },
] as const;

export const AUDIT_RANGES = [
  { value: "7", label: "Last 7 days", days: 7 },
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "90", label: "Last 90 days", days: 90 },
  { value: "all", label: "All time", days: null },
] as const;

export const DEFAULT_RANGE = "30";

export interface AuditFilters {
  q: string;
  type: string; // "" or a group value
  range: string; // a range value
}

export interface AuditEntry {
  id: string;
  kind: string;
  summary: string;
  refLabel: string | null;
  actorName: string | null;
  actorRole: string | null;
  createdAt: string;
}

/** Reads ?q, ?type, ?range from the address, dropping anything we do not know. */
export function parseAuditFilters(sp: { q?: string; type?: string; range?: string }): AuditFilters {
  const q = (sp.q ?? "").trim().slice(0, 80);
  const type = AUDIT_GROUPS.some((g) => g.value === sp.type) ? (sp.type ?? "") : "";
  const range = AUDIT_RANGES.some((r) => r.value === sp.range) ? (sp.range as string) : DEFAULT_RANGE;
  return { q, type, range };
}

export const rangeDays = (range: string): number | null => AUDIT_RANGES.find((r) => r.value === range)?.days ?? null;

const CATEGORY: Record<string, string> = {
  batch_declared: "Batch declaration",
  batch_released: "Batch release",
  codes_generated: "Code generation",
  codes_exported: "Export",
  product_registered: "Product registration",
  member_invited: "Team & permissions",
  invite_cancelled: "Team & permissions",
  role_changed: "Team & permissions",
  member_revoked: "Team & permissions",
  member_joined: "Team & permissions",
  settings_updated: "Settings",
  audit_exported: "Export",
};

export const auditCategory = (kind: string): string => CATEGORY[kind] ?? "Activity";

/** What the reference column's value is. Team events have no reference of their own. */
export function auditRefType(kind: string): string | null {
  if (kind === "product_registered") return "Product";
  if (kind.startsWith("batch_") || kind.startsWith("codes_")) return "Batch";
  return null;
}
