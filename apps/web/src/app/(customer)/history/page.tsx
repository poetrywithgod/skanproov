import type { Metadata } from "next";
import { HistoryView } from "@/components/app/history-view";
import { getHistory } from "@/lib/customer/activity-data";
import { getHomeData } from "@/lib/customer/home-data";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "History", robots: { index: false } };

export default async function HistoryPage() {
  const user = await requireUser();
  const [entries, home] = await Promise.all([getHistory(user.id), getHomeData(user.id)]);
  return <HistoryView entries={entries} points={home.points} />;
}
