import type { Metadata } from "next";
import Link from "next/link";
import { AddProductButton, Breadcrumb, InfoNote, PageHeading, StatCard, formatDate } from "@/components/manufacturer/portal/products/bits";
import { ProductsEmptyState } from "@/components/manufacturer/portal/products/empty-state";
import { Pagination } from "@/components/manufacturer/portal/products/pagination";
import { ProductFilters } from "@/components/manufacturer/portal/products/product-filters";
import { ProductTable } from "@/components/manufacturer/portal/products/product-table";
import { PortalTopBar } from "@/components/manufacturer/portal/portal-top-bar";
import { getProducts } from "@/lib/manufacturer/products";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Products", robots: { index: false } };

const PAGE_SIZE = 10;

type SearchParams = { q?: string; category?: string; status?: string; sort?: string; page?: string };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { q = "", category = "", status = "", sort = "updated", page: pageParam = "1" } = await searchParams;
  const all = await getProducts();

  const needle = q.trim().toLowerCase();
  const filtered = all
    .filter((p) => !needle || p.name.toLowerCase().includes(needle) || (p.sku ?? "").toLowerCase().includes(needle))
    .filter((p) => !category || p.category === category)
    .filter((p) => !status || p.status === status);
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "newest") filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number.parseInt(pageParam, 10) || 1), pageCount);
  const start = (page - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const registered = all.filter((p) => p.status === "registered").length;
  const pending = all.filter((p) => p.status === "pending_review").length;
  const drafts = all.filter((p) => p.status === "draft").length;
  const categories = new Set(all.map((p) => p.category).filter(Boolean)).size;
  const lastUpdated = all.reduce<string | null>((latest, p) => (!latest || p.updatedAt > latest ? p.updatedAt : latest), null);

  function hrefFor(n: number): string {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (category) search.set("category", category);
    if (status) search.set("status", status);
    if (sort !== "updated") search.set("sort", sort);
    if (n > 1) search.set("page", String(n));
    const qs = search.toString();
    return qs ? `${site.manufacturer.products}?${qs}` : site.manufacturer.products;
  }

  return (
    <>
      <PortalTopBar title="Products" />
      <main className="px-5 py-6 sm:px-8">
        <Breadcrumb current="Product register" />
        <PageHeading title="Your products" subtitle="Manage your product register, view batches and generate authentication codes." action={<AddProductButton />} />

        {all.length === 0 ? (
          <ProductsEmptyState />
        ) : (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <StatCard value={all.length} title="Total products" note={`Across ${categories} ${categories === 1 ? "category" : "categories"}`} />
              <StatCard value={registered} title="Registered" note="Ready for authentication" />
              <StatCard
                value={pending + drafts}
                title="Awaiting completion"
                note={`${pending} pending review · ${drafts} ${drafts === 1 ? "draft" : "drafts"}`}
              />
            </div>

            <section className="mt-6 rounded-xl border border-line bg-white" aria-label="All products">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-6 sm:px-6">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h2 className="whitespace-nowrap text-lg font-semibold text-ink">All products</h2>
                  <span className="text-[13px] text-muted">
                    {all.length} {all.length === 1 ? "product" : "products"}
                  </span>
                </div>
                {lastUpdated ? <p className="text-[13px] text-muted">Last updated: {formatDate(lastUpdated)}</p> : null}
              </div>
              <div className="px-5 py-5 sm:px-6">
                <ProductFilters />
              </div>

              {total === 0 ? (
                <div className="border-t border-row-line px-6 py-14 text-center" role="status">
                  <p className="text-base font-semibold text-ink">No products match</p>
                  <p className="mt-1 text-sm text-muted">Try a different search or clear the filters.</p>
                  <Link href={site.manufacturer.products} className="mt-4 inline-block text-sm font-semibold text-retail hover:underline">
                    Clear filters
                  </Link>
                </div>
              ) : (
                <>
                  <div className="border-t border-row-line">
                    <ProductTable products={visible} />
                  </div>
                  <Pagination page={page} pageCount={pageCount} from={start + 1} to={start + visible.length} total={total} hrefFor={hrefFor} />
                </>
              )}
            </section>
            <InfoNote>Only registered products can have production batches declared and authentication codes generated.</InfoNote>
          </>
        )}
      </main>
    </>
  );
}
