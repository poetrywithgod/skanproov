import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RetailerHomeView } from "@/components/retailer/home-view";
import { getRetailerContext, getRetailerHome } from "@/lib/retailer/data";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Retailer home", robots: { index: false } };

export default async function RetailerHomePage() {
  const shop = await getRetailerContext();
  if (!shop) redirect(site.retailer.register);
  const data = await getRetailerHome(shop);
  return <RetailerHomeView shop={shop} data={data} />;
}
