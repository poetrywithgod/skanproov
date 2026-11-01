import type { Metadata } from "next";
import { HomeView } from "@/components/app/home-view";
import { getHomeData } from "@/lib/customer/home-data";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Home", robots: { index: false } };

export default async function HomePage() {
  const user = await requireUser();
  const data = await getHomeData();

  return <HomeView firstName={user.firstName} verified={user.emailConfirmed} data={data} />;
}
