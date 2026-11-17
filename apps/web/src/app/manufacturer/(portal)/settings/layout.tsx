import type { ReactNode } from "react";
import { PortalTopBar } from "@/components/manufacturer/portal/portal-top-bar";
import { PageHeading } from "@/components/manufacturer/portal/products/bits";
import { SettingsBreadcrumb, SettingsTabs } from "@/components/manufacturer/portal/settings/settings-nav";
import { can, getManufacturerContext } from "@/lib/manufacturer/portal";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const manufacturer = await getManufacturerContext();
  return (
    <>
      <PortalTopBar title="Settings" />
      <main className="px-5 py-6 sm:px-8">
        <SettingsBreadcrumb />
        <PageHeading title="Settings" subtitle="Manage your company account, security and subscription." />
        <div className="mt-6 grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
          <SettingsTabs showBilling={can(manufacturer, "manage_billing")} />
          <div className="min-w-0 space-y-6">{children}</div>
        </div>
      </main>
    </>
  );
}
