import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/coming-soon";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "History", robots: { index: false } };

export default async function HistoryPage() {
  await requireUser();
  return <ComingSoon title="Scan history" body="Every product you scan will be listed here. This screen is coming soon." />;
}
