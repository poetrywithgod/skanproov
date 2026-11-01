import { createClient } from "@/lib/supabase/server";
import { getHistory, type HistoryEntry } from "./activity-data";

export interface HomeData {
  points: number;
  unreadNotifications: number;
  recentScans: HistoryEntry[];
}

/** Reward balance for the signed-in person (sum of their points ledger). */
export async function getPoints(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_points");
  if (error) {
    console.error("Could not load points", error.message);
    return 0;
  }
  return typeof data === "number" ? data : 0;
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (error) {
    console.error("Could not count notifications", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function getHomeData(): Promise<HomeData> {
  const [points, unreadNotifications, history] = await Promise.all([getPoints(), getUnreadCount(), getHistory(3)]);
  return { points, unreadNotifications, recentScans: history };
}
