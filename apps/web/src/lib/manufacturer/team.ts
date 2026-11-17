import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { ROLE_IDS, type MemberStatus, type PermissionMatrix, type TeamDetail, type TeamRow } from "./team-shared";

const STATUSES: readonly string[] = ["active", "pending", "expired", "revoked"];
const asStatus = (value: string): MemberStatus => (STATUSES.includes(value) ? (value as MemberStatus) : "revoked");

/** Everyone in the company and every open invitation. Administrators only; anyone else gets an empty list. */
export const getTeam = cache(async (): Promise<TeamRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("team_overview");
  if (error) {
    if (!/not allowed/i.test(error.message)) console.error("Could not load the team", error.message);
    return [];
  }
  type Row = { key: string; kind: string; full_name: string | null; email: string | null; role: string; status: string; last_seen_at: string | null; invited_at: string | null; expires_at: string | null };
  return ((data ?? []) as Row[]).map((r) => ({
    key: r.key,
    kind: r.kind === "invite" ? "invite" : "member",
    fullName: r.full_name ?? r.email ?? "Unknown",
    email: r.email ?? "",
    role: r.role,
    status: asStatus(r.status),
    lastSeenAt: r.last_seen_at,
    invitedAt: r.invited_at,
    expiresAt: r.expires_at,
  }));
});

export async function getTeamDetail(kind: "member" | "invite", key: string): Promise<TeamDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(key)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("team_member_detail", { p_kind: kind, p_key: key });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) return null;
  const d = data as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : null);
  const activity = Array.isArray(d.activity) ? (d.activity as { summary: string; createdAt: string }[]) : [];
  return {
    kind: d.kind === "invite" ? "invite" : "member",
    key: String(d.key),
    fullName: str(d.fullName) ?? str(d.email) ?? "Unknown",
    email: str(d.email) ?? "",
    phone: str(d.phone),
    role: str(d.role) ?? "viewer",
    status: asStatus(str(d.status) ?? ""),
    lastSeenAt: str(d.lastSeenAt),
    invitedAt: str(d.invitedAt),
    invitedByName: str(d.invitedByName),
    joinedAt: str(d.joinedAt),
    expiresAt: str(d.expiresAt),
    twoFactor: d.twoFactor === true,
    activity,
  };
}

/** What each role can do, straight from the database so the screen can never disagree with it. */
export const getPermissionMatrix = cache(async (): Promise<PermissionMatrix> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("permission_matrix");
  if (error) console.error("Could not load the permission table", error.message);
  const matrix: Record<string, string[]> = Object.fromEntries(ROLE_IDS.map((r) => [r, []]));
  for (const row of (data ?? []) as { role: string; permission: string }[]) (matrix[row.role] ??= []).push(row.permission);
  return matrix;
});
