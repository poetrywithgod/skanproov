import type { Metadata } from "next";
import { DeferredPanel } from "@/components/manufacturer/portal/overview/panels";

export const metadata: Metadata = { title: "Preferences", robots: { index: false } };

export default function PreferencesPage() {
  return (
    <>
      {/* DEFERRED(D22): notification preferences per category, in-app and e-mail (notifications are company-wide today; e-mail needs SMTP). */}
      <DeferredPanel id="D22" title="Notification preferences" needs="Choosing which updates reach you, in the portal and by e-mail, will appear here. Notifications are shared by the whole company for now, and e-mail needs an e-mail service." />
      {/* DEFERRED(D23): time zone and date format (the portal uses Nigerian time and day-month-year until then). */}
      <DeferredPanel id="D23" title="Regional settings" needs="Time zone and date format will appear here. Until then the portal shows Nigerian time (Africa/Lagos) and dates as day, month, year." />
    </>
  );
}
