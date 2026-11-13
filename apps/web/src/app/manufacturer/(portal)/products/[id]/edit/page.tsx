import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Breadcrumb, PageHeading } from "@/components/manufacturer/portal/products/bits";
import { ProductForm } from "@/components/manufacturer/portal/products/product-form";
import { PortalTopBar } from "@/components/manufacturer/portal/portal-top-bar";
import { getManufacturerContext } from "@/lib/manufacturer/portal";
import { getProduct } from "@/lib/manufacturer/products";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Edit product", robots: { index: false } };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const manufacturer = await getManufacturerContext();
  if (!manufacturer) redirect(site.manufacturer.register);
  const product = await getProduct(id);
  if (!product) notFound();
  return (
    <>
      <PortalTopBar title="Products" />
      <main className="max-w-[900px] px-5 py-6 sm:px-8">
        <Breadcrumb current={product.status === "draft" ? "Complete setup" : "Edit product"} />
        <PageHeading
          title={product.status === "draft" ? "Complete your product" : "Edit product"}
          subtitle={product.name}
        />
        <ProductForm manufacturerId={manufacturer.id} product={product} />
      </main>
    </>
  );
}
