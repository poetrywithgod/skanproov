import type { Metadata } from "next";
import Link from "next/link";
import { BatchesTable } from "@/components/manufacturer/portal/batches/batches-table";
import { DeclareBatchButton } from "@/components/manufacturer/portal/batches/bits";
import { InfoNote, PageHeading, StatCard, formatNumber } from "@/components/manufacturer/portal/products/bits";
import { PortalTopBar } from "@/components/manufacturer/portal/portal-top-bar";
import { getBatches } from "@/lib/manufacturer/batches";
import { getProducts } from "@/lib/manufacturer/products";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Batches", robots: { index: false } };

export default async function BatchesPage() {
  const [batches, products] = await Promise.all([getBatches(), getProducts()]);
  const hasRegistered = products.some((p) => p.status === "registered");
  const released = batches.filter((b) => b.releasedAt).length;
  const units = batches.reduce((sum, b) => sum + (b.units ?? 0), 0);
  const codes = batches.reduce((sum, b) => sum + b.codesGenerated, 0);

  return (
    <>
      <PortalTopBar title="Batches" />
      <main className="px-5 py-6 sm:px-8">
        <PageHeading
          title="Batches"
          subtitle="Declare production runs, generate their codes and release them at dispatch."
          action={hasRegistered ? <DeclareBatchButton /> : undefined}
        />

        {batches.length === 0 ? (
          <div className="mt-6 rounded-xl border border-line bg-white px-6 py-14 text-center" role="status">
            <p className="text-base font-semibold text-ink">No batches yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
              {hasRegistered ? "Declare your first production batch to start generating codes." : "Register a product first. Only registered products can have batches."}
            </p>
            {hasRegistered ? null : (
              <Link href={`${site.manufacturer.products}/new`} className="mt-4 inline-block text-sm font-semibold text-retail hover:underline">
                Add a product
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <StatCard value={batches.length} title="Batches" note={`${released} released · ${batches.length - released} not released`} />
              <StatCard value={formatNumber(units)} title="Units declared" note="Across all batches" />
              <StatCard value={formatNumber(codes)} title="Codes generated" note={`${formatNumber(Math.max(0, units - codes))} units awaiting codes`} />
            </div>
            <section className="mt-6 rounded-xl border border-line bg-white" aria-label="All batches">
              <div className="flex items-baseline gap-3 px-6 py-5">
                <h2 className="text-lg font-semibold text-ink">All batches</h2>
                <span className="text-[13px] text-muted">Newest first</span>
              </div>
              <div className="border-t border-row-line">
                <BatchesTable batches={batches} />
              </div>
            </section>
            <InfoNote>A batch&apos;s codes only verify once you release it at dispatch.</InfoNote>
          </>
        )}
      </main>
    </>
  );
}
