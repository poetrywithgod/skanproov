import type { Metadata } from "next";
import { ProfileView } from "@/components/app/profile-view";
import { getHistory } from "@/lib/customer/activity-data";
import { getPoints } from "@/lib/customer/home-data";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const user = await requireUser();
  const [history, points] = await Promise.all([getHistory(), getPoints()]);
  return (
    <ProfileView
      user={user}
      saved={saved === "password" ? "password" : saved === "1" ? "details" : null}
      totalScans={history.length}
      points={points}
      blocked={history.filter((h) => h.status !== "authentic").length}
    />
  );
}
