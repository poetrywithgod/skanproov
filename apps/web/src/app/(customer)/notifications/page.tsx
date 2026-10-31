import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/coming-soon";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

export default async function NotificationsPage() {
  await requireUser();
  return <ComingSoon title="Notifications" body="Alerts about your scans and rewards will appear here. Coming soon." />;
}
