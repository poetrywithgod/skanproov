import type { Metadata } from "next";
import Link from "next/link";
import { GenerateForm, type GenerateProduct } from "@/components/manufacturer/portal/codes/generate-form";
import { RunsTable } from "@/components/manufacturer/portal/codes/runs-table";
import { PageHeading } from "@/components/manufacturer/portal/products/bits";
import { PortalTopBar } from "@/components/manufacturer/portal/portal-top-bar";
import { getBatches } from "@/lib/manufacturer/batches";
import { getCodeRuns, purgeExpiredCodeFiles } from "@/lib/manufacturer/code-runs";
import { site } from "@/lib/site";
import { ChevronIcon } from "@/components/manufacturer/portal/icons";

export const metadata: Metadata = { title: "Code Management", robots: { index: false } };
// Building the label PDF for a large run takes several seconds.
export const maxDuration = 60;

export default async function CodeManagementPage({ searchParams }: { searchParams: Promise<{ batch?: string }> }) {
  const { batch: batchParam } = await searchParams;
  await purgeExpiredCodeFiles();
  const [batches, runs] = await Promise.all([getBatches(), getCodeRuns()]);

  // Only batches that are still open (not released, not recalled) and have units left can get codes.
  const byProduct = new Map<string, GenerateProduct>();
  for (const b of batches) {
    if (b.releasedAt || b.status !== "active" || !b.units || b.codesGenerated >= b.units) continue;
    const entry = byProduct.get(b.productId) ?? { id: b.productId, name: b.productName, variant: b.variant, batches: [] };
    entry.batches.push({ id: b.id, batchNumber: b.batchNumber, units: b.units, generated: b.codesGenerated });
    byProduct.set(b.productId, entry);
  }
  const products = [...byProduct.values()];

  return (
    <>
      <PortalTopBar title="Code Management" />
      <main className="px-5 py-6 sm:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted">
          <span>Code Management</span>
          <ChevronIcon className="size-3.5 rotate-180" />
          <span aria-current="page" className="font-medium text-retail">Generate codes</span>
        </nav>
        <PageHeading title="Generate verification codes" subtitle="Create unique, secure codes to protect every product in your batch." />

        {products.length === 0 ? (
          <div className="mt-6 rounded-xl border border-line bg-white px-6 py-14 text-center" role="status">
            <p className="text-base font-semibold text-ink">No batch is ready for codes</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
              {batches.length === 0
                ? "Declare a batch first. Codes are generated per batch, one for every unit."
                : "Every open batch already has all its codes, or has been released. Declare a new batch to generate more."}
            </p>
            <Link href={`${site.manufacturer.batches}/new`} className="mt-4 inline-block text-sm font-semibold text-retail hover:underline">
              Declare a batch
            </Link>
          </div>
        ) : (
          <GenerateForm products={products} {...(batchParam ? { initialBatchId: batchParam } : {})} />
        )}

        <section className="mt-6 rounded-xl border border-line bg-white" aria-label="Recent generations">
          <div className="px-6 pt-6">
            <h2 className="text-lg font-semibold text-ink">Recent generations</h2>
            <p className="mt-1 pb-5 text-sm text-body">Track your latest code requests and download completed files.</p>
          </div>
          {runs.length === 0 ? (
            <div className="border-t border-row-line px-6 py-12 text-center" role="status">
              <p className="text-base font-semibold text-ink">No codes generated yet</p>
              <p className="mt-1 text-sm text-muted">Your generations and their files will appear here.</p>
            </div>
          ) : (
            <div className="border-t border-row-line">
              <RunsTable runs={runs.slice(0, 10)} />
            </div>
          )}
          <p className="border-t border-row-line px-6 py-3.5 text-[13px] text-muted">Downloads are available for 30 days.</p>
        </section>
      </main>
    </>
  );
}
