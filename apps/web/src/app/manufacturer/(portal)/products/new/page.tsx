import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Breadcrumb, PageHeading } from "@/components/manufacturer/portal/products/bits";
import { ProductForm } from "@/components/manufacturer/portal/products/product-form";
import { PortalTopBar } from "@/components/manufacturer/portal/portal-top-bar";
import { getManufacturerContext } from "@/lib/manufacturer/portal";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Add product", robots: { index: false } };

export default async function NewProductPage() {
  const manufacturer = await getManufacturerContext();
  if (!manufacturer) redirect(site.manufacturer.register);
  return (
    <>
      <PortalTopBar title="Products" />
      <main className="max-w-[900px] px-5 py-6 sm:px-8">
        <Breadcrumb current="Add product" />
        <PageHeading title="Add a product" subtitle="Enter the product's details, add a SKU and upload a clear image to register it." />
        <ProductForm manufacturerId={manufacturer.id} />
      </main>
    </>
  );
}
