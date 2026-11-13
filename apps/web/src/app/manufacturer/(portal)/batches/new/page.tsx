import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BatchForm } from "@/components/manufacturer/portal/batches/batch-form";
import { BatchesBreadcrumb } from "@/components/manufacturer/portal/batches/bits";
import { PageHeading } from "@/components/manufacturer/portal/products/bits";
import { PortalTopBar } from "@/components/manufacturer/portal/portal-top-bar";
import { getManufacturerContext } from "@/lib/manufacturer/portal";
import { getProducts } from "@/lib/manufacturer/products";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Declare batch", robots: { index: false } };

export default async function NewBatchPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const manufacturer = await getManufacturerContext();
  if (!manufacturer) redirect(site.manufacturer.register);
  const { product } = await searchParams;
  const options = (await getProducts()).filter((p) => p.status === "registered");

  return (
    <>
      <PortalTopBar title="Batches" />
      <main className="max-w-[900px] px-5 py-6 sm:px-8">
        <BatchesBreadcrumb current="Declare batch" />
        <PageHeading title="Declare a batch" subtitle="Record a production run of one of your registered products." />
        {options.length === 0 ? (
          <div className="mt-6 rounded-xl border border-line bg-white px-6 py-12 text-center" role="status">
            <p className="text-base font-semibold text-ink">No registered products yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">Only registered products can have batches. Register a product first.</p>
            <Link href={`${site.manufacturer.products}/new`} className="mt-4 inline-block text-sm font-semibold text-retail hover:underline">
              Add a product
            </Link>
          </div>
        ) : (
          <BatchForm
            manufacturerId={manufacturer.id}
            products={options}
            {...(product && options.some((p) => p.id === product) ? { productId: product } : {})}
          />
        )}
      </main>
    </>
  );
}
