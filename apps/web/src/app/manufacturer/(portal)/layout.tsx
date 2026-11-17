import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { PortalShell } from "@/components/manufacturer/portal/portal-shell";
import { AccessRevoked } from "@/components/manufacturer/portal/team/access-revoked";
import { can, getManufacturerContext } from "@/lib/manufacturer/portal";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/user";

/**
 * Frame for the manufacturer portal. Only active members of an approved manufacturer get in: anyone
 * else (still applying, or never applied) is sent to the company registration screen, and someone
 * whose access was revoked is told so.
 */
export default async function ManufacturerPortalLayout({ children }: { children: ReactNode }) {
  await requireUser();
  const manufacturer = await getManufacturerContext();
  if (!manufacturer) redirect(site.manufacturer.register);
  if (manufacturer.status === "revoked") return <AccessRevoked company={manufacturer.name} />;

  // Remember when this person was last here (the database writes at most every five minutes).
  const supabase = await createClient();
  await supabase.rpc("touch_member_seen");

  return (
    <PortalShell
      showTeam={can(manufacturer, "manage_team")}
      showCodes={can(manufacturer, "generate_codes") || can(manufacturer, "export_codes")}
    >
      {children}
    </PortalShell>
  );
}
