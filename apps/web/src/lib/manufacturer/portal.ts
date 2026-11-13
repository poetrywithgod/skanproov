import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface ManufacturerContext {
  id: string;
  name: string;
  role: "admin" | "member";
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
  return { id: row.id, name: row.name, role: row.role === "admin" ? "admin" : "member", verified: row.verified };
});
