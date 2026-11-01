import type { Metadata } from "next";
import { HistoryView } from "@/components/app/history-view";
import { getHistory } from "@/lib/customer/activity-data";
import { getPoints } from "@/lib/customer/home-data";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "History", robots: { index: false } };

export default async function HistoryPage() {
  await requireUser();
  const [entries, points] = await Promise.all([getHistory(), getPoints()]);
  return <HistoryView entries={entries} points={points} />;
}
