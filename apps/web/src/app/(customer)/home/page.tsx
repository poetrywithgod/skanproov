import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HomeView } from "@/components/app/home-view";
import { getHomeData } from "@/lib/customer/home-data";
import { site } from "@/lib/site";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Home", robots: { index: false } };

export default async function HomePage() {
  const user = await requireUser();
  if (user.accountType === "manufacturer" || user.intendedAccount === "manufacturer") redirect(site.manufacturer.register);
  if (user.accountType === "retailer" || user.intendedAccount === "retailer") redirect(site.retailer.home);
  const data = await getHomeData();

  return <HomeView firstName={user.firstName} verified={user.emailConfirmed} data={data} />;
}
