import type { Metadata } from "next";
import Link from "next/link";
import { CartonResultView } from "@/components/retailer/carton-result";
import { branchNotice, PendingNotice } from "@/components/retailer/notice";
import { getRetailerContext, verifyCarton } from "@/lib/retailer/data";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Carton result", robots: { index: false } };

export default async function CartonResultPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw);
  const shop = await getRetailerContext();
  const notice = shop ? branchNotice(shop) : null;
  if (!shop || !shop.activeBranch || notice) {
    return (
      <div className="px-5 pt-5">
        <PendingNotice {...(notice ?? { title: "Register a branch first", body: "Add a branch to start scanning." })} />
      </div>
    );
  }

  const result = await verifyCarton(code, shop.activeBranch.id);
  if (result.status === "unavailable") {
    return (
      <div className="space-y-4 px-5 pt-6 text-center">
        <h1 className="text-xl font-bold text-ink">We couldn&apos;t check this carton</h1>
        <p className="text-sm leading-[1.5] text-body">
          Something went wrong on our side. That does not mean the carton is safe. Please try again.
        </p>
        <Link href={site.retailer.scan} className="inline-flex h-12 items-center rounded-xl bg-brand px-6 text-sm font-semibold text-white">
          Scan again
        </Link>
      </div>
    );
  }
  return <CartonResultView code={code} result={result} now={new Date()} />;
}
