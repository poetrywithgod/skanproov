import type { Metadata } from "next";
import { HistoryList } from "@/components/retailer/history-list";
import { RetailerHeader } from "@/components/retailer/retailer-header";
import { getScans } from "@/lib/retailer/data";
import { latestPerCarton } from "@/lib/retailer/format";

export const metadata: Metadata = { title: "Scan history", robots: { index: false } };

export default async function RetailerHistoryPage() {
  const scans = latestPerCarton(await getScans(500));

  return (
    <>
      <RetailerHeader />
      <div className="space-y-4 px-4 pb-4 pt-5">
        <h1 className="text-2xl font-bold tracking-normal text-ink">History</h1>
        <HistoryList scans={scans} now={new Date().toISOString()} />
      </div>
    </>
  );
}
