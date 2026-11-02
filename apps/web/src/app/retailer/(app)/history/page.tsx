import type { Metadata } from "next";
import Link from "next/link";
import { ScanChip } from "@/components/retailer/scan-chip";
import { getScans } from "@/lib/retailer/data";
import { formatScanTime, latestPerCarton } from "@/lib/retailer/format";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Scan history", robots: { index: false } };

export default async function RetailerHistoryPage() {
  const scans = latestPerCarton(await getScans(500));
  const now = new Date();

  return (
    <div className="space-y-4 px-4 pb-4 pt-5">
      <h1 className="text-2xl font-bold tracking-normal text-ink">History</h1>
      {scans.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-center text-sm text-body shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
          Cartons you scan will be listed here.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {scans.map((scan) => (
            <li key={scan.id}>
              <Link
                href={`${site.retailer.result}/${encodeURIComponent(scan.code)}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3.5 shadow-[0_1px_4px_rgba(15,31,23,0.06)]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold text-ink">{scan.product ?? "Unknown carton"}</span>
                  <span className="block truncate text-xs text-muted">{scan.carton ?? scan.code}</span>
                  <span className="mt-1.5 block">
                    <ScanChip scan={scan} />
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted">{formatScanTime(scan.scannedAt, now)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
