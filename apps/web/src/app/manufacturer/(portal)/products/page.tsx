import type { Metadata } from "next";
import { PortalTopBar } from "@/components/manufacturer/portal/portal-top-bar";

export const metadata: Metadata = { title: "Products", robots: { index: false } };

export default function ProductsPage() {
  return (
    <>
      <PortalTopBar title="Products" />
      <main className="px-5 py-6 sm:px-8">
        <h1 className="text-[30px] font-semibold tracking-tight text-ink">Your products</h1>
        <p className="mt-1 text-base text-body">Manage your product register, view batches and generate authentication codes.</p>
        <div role="status" className="mt-8 rounded-xl border border-line bg-white px-6 py-10 text-center">
          <p className="text-lg font-semibold text-ink">Product registration is the next step</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-body">
            Your manufacturer account is ready. You will be able to add products, declare batches and generate codes here.
          </p>
        </div>
      </main>
    </>
  );
}
