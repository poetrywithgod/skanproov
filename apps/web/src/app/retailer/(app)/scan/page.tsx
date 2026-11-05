import type { Metadata } from "next";
import { CartonScanScreen } from "@/components/retailer/carton-scan-screen";
import { RetailerHeader } from "@/components/retailer/retailer-header";
import { branchNotice, PendingNotice } from "@/components/retailer/notice";
import { getRetailerContext } from "@/lib/retailer/data";

export const metadata: Metadata = { title: "Scan a carton", robots: { index: false } };

export default async function RetailerScanPage() {
  const shop = await getRetailerContext();
  const notice = shop ? branchNotice(shop) : null;
  if (notice) {
    return (
      <>
        <RetailerHeader />
        <div className="px-5 pt-5">
          <PendingNotice {...notice} />
        </div>
      </>
    );
  }
  return <CartonScanScreen />;
}
