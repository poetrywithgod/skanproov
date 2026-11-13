import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BatchTable, batchState } from "@/components/manufacturer/portal/products/batch-table";
import { AddProductButton, Breadcrumb, InfoNote, PageHeading, ProductThumb, StatCard, StatusPill, formatDate, formatNumber } from "@/components/manufacturer/portal/products/bits";
import { PortalTopBar } from "@/components/manufacturer/portal/portal-top-bar";
import { getProduct, getProductBatches, productCode } from "@/lib/manufacturer/products";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Product details", robots: { index: false } };

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="mt-1 text-[15px] font-medium text-ink">{value || "—"}</dd>
    </div>
  );
}

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  const batches = await getProductBatches(product.id);

  const active = batches.filter((b) => batchState(b) === "active").length;
  const unitsDeclared = batches.reduce((sum, b) => sum + (b.units ?? 0), 0);
  const codesGenerated = batches.reduce((sum, b) => sum + b.codesGenerated, 0);
  const awaiting = Math.max(0, unitsDeclared - codesGenerated);
  const title = [product.name, product.variant].filter(Boolean).join(" · ");
  const base = `${site.manufacturer.products}/${product.id}`;

  return (
    <>
      <PortalTopBar title="Products" />
      <main className="px-5 py-6 sm:px-8">
        <Breadcrumb current="Product details" />
        <PageHeading title={product.name} subtitle="View product information and manage its associated production batches." action={<AddProductButton />} />

        <section className="mt-6 rounded-xl border border-line bg-white" aria-label="Product information">
          <div className="flex flex-col gap-6 p-6 sm:flex-row">
            <ProductThumb path={product.imagePath} name={product.name} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-ink">{title}</h2>
                  {product.description || product.packSize ? (
                    <p className="mt-1 text-base text-body">{product.description ?? product.packSize}</p>
                  ) : null}
                </div>
                <StatusPill status={product.status} />
              </div>
              <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-3">
                <Fact label="Product SKU" value={product.sku} />
                <Fact label="Category" value={product.category} />
                <Fact label="Brand" value={product.brand} />
                <Fact label="Product ID" value={productCode(product.productNo)} />
                <Fact label="Registered on" value={product.registeredAt ? formatDate(product.registeredAt) : null} />
                <Fact label="Registered by" value={product.registeredByName} />
                {product.nafdacNumber ? <Fact label="NAFDAC number" value={product.nafdacNumber} /> : null}
              </dl>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-row-line px-6 py-4">
            <p className={`flex items-center gap-2 text-[13px] ${product.status === "registered" ? "text-retail" : "text-warn"}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
                <path d="M12 3 4.5 6v5.5c0 4.5 3 8 7.5 9.5 4.5-1.5 7.5-5 7.5-9.5V6L12 3Z" />
                {product.status === "registered" ? <path d="m9 12 2 2 4-4" /> : <path d="M12 8v5M12 16h.01" />}
              </svg>
              {product.status === "registered"
                ? "Registered and eligible for authentication codes"
                : product.status === "draft"
                  ? "Draft: add a SKU and category to register this product"
                  : "Pending review: batches and codes open once it is approved"}
            </p>
            <div className="flex items-center gap-4">
              <Link href={site.manufacturer.products} className="text-[13px] text-body hover:underline">
                Back to all products
              </Link>
              <Link
                href={`${base}/edit`}
                className="inline-flex h-10 items-center rounded-lg border border-field-border bg-white px-4 text-sm font-semibold text-ink hover:bg-pill"
              >
                {product.status === "draft" ? "Complete setup" : "Edit Product"}
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard value={batches.length} title="Production batches" note={`${active} active · ${batches.length - active} closed`} />
          <StatCard value={formatNumber(unitsDeclared)} title="Total units declared" note="Across all production batches" />
          <StatCard value={formatNumber(codesGenerated)} title="Codes generated" note={`${formatNumber(awaiting)} units awaiting codes`} />
        </div>

        <section id="batches" className="mt-6 scroll-mt-6 rounded-xl border border-line bg-white" aria-label="Production batches">
          <div className="px-6 pt-6">
            <div className="flex items-baseline gap-3">
              <h2 className="text-lg font-semibold text-ink">Production batches</h2>
              <span className="text-[13px] text-muted">
                {batches.length} {batches.length === 1 ? "batch" : "batches"}
              </span>
            </div>
            <p className="mt-1 pb-5 text-sm text-body">Select a batch to generate codes for this product.</p>
          </div>
          {batches.length === 0 ? (
            <div className="border-t border-row-line px-6 py-12 text-center" role="status">
              <p className="text-base font-semibold text-ink">No batches yet</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                {product.status === "registered"
                  ? "Declaring a batch for this product is the next step of the build."
                  : "Register this product first. Only registered products can have batches."}
              </p>
            </div>
          ) : (
            <div className="border-t border-row-line">
              <BatchTable batches={batches} />
              <p className="border-t border-row-line px-6 py-3.5 text-[13px] text-muted">
                Showing all {batches.length} {batches.length === 1 ? "batch" : "batches"} for {product.name} · Newest first
              </p>
            </div>
          )}
        </section>
        <InfoNote>Each unit receives one unique code. Declare a new batch before generating codes for a new production run.</InfoNote>
      </main>
    </>
  );
}
