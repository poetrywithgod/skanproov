import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { PortalShell } from "@/components/manufacturer/portal/portal-shell";
import { getManufacturerContext } from "@/lib/manufacturer/portal";
import { site } from "@/lib/site";
import { requireUser } from "@/lib/supabase/user";

/**
 * Frame for the manufacturer portal. Only members of an approved manufacturer get in: anyone else
 * (still applying, or never applied) is sent to the company registration screen.
 */
export default async function ManufacturerPortalLayout({ children }: { children: ReactNode }) {
  await requireUser();
  const manufacturer = await getManufacturerContext();
  if (!manufacturer) redirect(site.manufacturer.register);
  return <PortalShell>{children}</PortalShell>;
}
