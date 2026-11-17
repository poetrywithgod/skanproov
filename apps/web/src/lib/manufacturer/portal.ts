import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isRoleId, type PermissionKey, type RoleId } from "./team-shared";

export interface ManufacturerContext {
  id: string;
  name: string;
  role: RoleId;
  /** 'revoked' means an administrator removed this person's access. */
  status: "active" | "revoked";
  /** What the role allows, as the database reports it. */
  permissions: readonly string[];
  /** SKANPROOV has checked the business. */
  verified: boolean;
}

/**
 * The signed-in person's manufacturer, or null if they are not a member of one (they may still be
 * waiting for their application to be approved). Cached per request, so the layout and the pages
 * share one lookup.
 */
export const getManufacturerContext = cache(async (): Promise<ManufacturerContext | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_manufacturer");
  if (error) console.error("Could not load the manufacturer", error.message);
  const row = data?.[0];
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    role: isRoleId(row.role) ? row.role : "viewer",
    status: row.status === "revoked" ? "revoked" : "active",
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
    verified: row.verified,
  };
});

/** Does the person's role allow this? (The database checks again on every action.) */
export function can(manufacturer: ManufacturerContext | null, permission: PermissionKey): boolean {
  return Boolean(manufacturer && manufacturer.status === "active" && manufacturer.permissions.includes(permission));
}
