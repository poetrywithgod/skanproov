import type { Metadata } from "next";
import { ProfileView } from "@/components/app/profile-view";
import { getHistory } from "@/lib/customer/activity-data";
import { getHomeData } from "@/lib/customer/home-data";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default async function ProfilePage() {
  const user = await requireUser();
  const [history, home] = await Promise.all([getHistory(user.id), getHomeData(user.id)]);
  return (
    <ProfileView
      user={user}
      totalScans={history.length}
      points={home.points}
      blocked={history.filter((h) => h.status === "counterfeit").length}
    />
  );
}
