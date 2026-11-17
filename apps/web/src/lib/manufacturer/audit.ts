import { createClient } from "@/lib/supabase/server";
import { AUDIT_PAGE_SIZE, rangeDays, type AuditEntry, type AuditFilters } from "./audit-shared";

type Row = {
  id: string;
  kind: string;
  summary: string;
  ref_label: string | null;
  actor_name: string | null;
  actor_role: string | null;
  created_at: string;
  total?: number | string;
};

const toEntry = (r: Row): AuditEntry => ({
  id: r.id,
  kind: r.kind,
  summary: r.summary,
  refLabel: r.ref_label,
  actorName: r.actor_name,
  actorRole: r.actor_role,
  createdAt: r.created_at,
});

/** One page of the log (newest first) and how many records match the filters. */
export async function getAuditPage(filters: AuditFilters, page: number): Promise<{ entries: AuditEntry[]; total: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("audit_log", {
    p_search: filters.q || null,
    p_group: filters.type || null,
    p_days: rangeDays(filters.range),
    p_limit: AUDIT_PAGE_SIZE,
    p_offset: (page - 1) * AUDIT_PAGE_SIZE,
  });
  if (error) {
    if (!/not allowed/i.test(error.message)) console.error("Could not load the audit log", error.message);
    return { entries: [], total: 0 };
  }
  const rows = (data ?? []) as Row[];
  return { entries: rows.map(toEntry), total: rows.length ? Number(rows[0]?.total ?? rows.length) : 0 };
}

/** Everything matching the filters, up to 10,000 records, for the CSV. Logs the export. */
export async function getAuditExport(filters: AuditFilters): Promise<AuditEntry[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("audit_log_export", {
    p_search: filters.q || null,
    p_group: filters.type || null,
    p_days: rangeDays(filters.range),
  });
  if (error) return null;
  return ((data ?? []) as Row[]).map(toEntry);
}
