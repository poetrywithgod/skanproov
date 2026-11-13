import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BatchesBreadcrumb } from "@/components/manufacturer/portal/batches/bits";
import { ReleaseButton } from "@/components/manufacturer/portal/batches/release-button";
import { BATCH_LABEL, BATCH_PILL, batchState } from "@/components/manufacturer/portal/products/batch-table";
import { InfoNote, PageHeading, StatCard, formatDate, formatNumber } from "@/components/manufacturer/portal/products/bits";
import { PortalTopBar } from "@/components/manufacturer/portal/portal-top-bar";
import { getBatch, batchCode } from "@/lib/manufacturer/batches";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Batch details", robots: { index: false } };

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="mt-1 text-[15px] font-medium text-ink">{value || "—"}</dd>
    </div>
  );
}

export default async function BatchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const batch = await getBatch(id);
  if (!batch) notFound();

  const state = batchState(batch);
  const remaining = batch.units ? Math.max(0, batch.units - batch.codesGenerated) : null;
  const product = [batch.productName, batch.variant].filter(Boolean).join(" · ");
  const disabledReason =
    batch.status !== "active"
      ? "This batch has been recalled, so it cannot be released."
      : batch.codesGenerated === 0
        ? "Generate codes for this batch before releasing it."
        : undefined;

  return (
    <>
      <PortalTopBar title="Batches" />
      <main className="px-5 py-6 sm:px-8">
        <BatchesBreadcrumb current="Batch details" />
        <PageHeading title={`Batch ${batch.batchNumber}`} subtitle={`${product} · ${batchCode(batch.batchNo)}`} />

        <section className="mt-6 rounded-xl border border-line bg-white" aria-label="Batch information">
          <div className="flex items-start justify-between gap-4 p-6">
            <dl className="grid flex-1 gap-x-8 gap-y-5 sm:grid-cols-3">
              <Fact label="Product" value={product} />
              <Fact label="Product SKU" value={batch.sku} />
              <Fact label="Units declared" value={batch.units ? formatNumber(batch.units) : null} />
              <Fact label="Production date" value={formatDate(batch.manufacturedOn)} />
              <Fact label="Expiry date" value={batch.expiresOn ? formatDate(batch.expiresOn) : null} />
              <Fact label="Manufacturing facility" value={batch.facility} />
              <Fact label="Declared by" value={batch.declaredByName} />
              <Fact label="Declared on" value={formatDate(batch.createdAt)} />
              {batch.notes ? <Fact label="Notes" value={batch.notes} /> : null}
            </dl>
            <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium ${BATCH_PILL[state]}`}>
              <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
              {BATCH_LABEL[state]}
            </span>
          </div>
        </section>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard value={formatNumber(batch.codesGenerated)} title="Codes generated" note={remaining !== null ? `${formatNumber(remaining)} units awaiting codes` : "No unit count"} />
          <StatCard value={batch.releasedAt ? "Yes" : "No"} title="Released" note={batch.releasedAt ? `On ${formatDate(batch.releasedAt)}` : "Codes do not verify yet"} />
        </div>

        <section className="mt-6 rounded-xl border border-line bg-white p-6" aria-label="Release">
          <h2 className="text-lg font-semibold text-ink">Release at dispatch</h2>
          {batch.releasedAt ? (
            <p className="mt-2 text-sm text-body">This batch was released on {formatDate(batch.releasedAt)}. Its codes now verify for shoppers and retailers.</p>
          ) : (
            <>
              <p className="mt-2 max-w-xl text-sm text-body">
                Codes in this batch stay inactive until you release it. Release it when the products are dispatched, so a code cannot verify before the product is out.
              </p>
              <div className="mt-4">
                <ReleaseButton batchId={batch.id} batchNumber={batch.batchNumber} {...(disabledReason ? { disabledReason } : {})} />
              </div>
            </>
          )}
        </section>

        <div className="mt-5 flex items-center gap-4">
          <Link href={site.manufacturer.batches} className="text-[13px] text-body hover:underline">
            Back to all batches
          </Link>
          <Link href={`${site.manufacturer.products}/${batch.productId}`} className="text-[13px] text-body hover:underline">
            View product
          </Link>
        </div>
        <InfoNote>Generating codes for a batch comes in the next step.</InfoNote>
      </main>
    </>
  );
}
