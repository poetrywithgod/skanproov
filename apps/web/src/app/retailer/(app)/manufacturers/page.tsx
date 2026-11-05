import type { Metadata } from "next";
import { ManufacturerList } from "@/components/retailer/manufacturer-list";
import { getManufacturers } from "@/lib/retailer/data";

export const metadata: Metadata = { title: "Manufacturers", robots: { index: false } };

export default async function ManufacturersPage() {
  const manufacturers = await getManufacturers();

  return (
    <div className="px-4 pb-4 pt-6">
      <header className="mb-4">
        <h1 className="text-[28px] font-extrabold leading-9 tracking-[-0.03em] text-ink">Manufacturers</h1>
        <p className="mt-1 text-[15px] leading-[1.45] text-body">Connect with manufacturers to verify their cartons.</p>
      </header>
      <ManufacturerList manufacturers={manufacturers} />
    </div>
  );
}
