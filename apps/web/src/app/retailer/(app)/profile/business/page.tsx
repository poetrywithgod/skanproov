import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/app/app-icons";
import { BusinessProfileForm } from "@/components/retailer/business-profile-form";
import { getProfileChange, getRetailerContext } from "@/lib/retailer/data";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Business details", robots: { index: false } };

export default async function BusinessDetailsPage() {
  const [shop, change] = await Promise.all([getRetailerContext(), getProfileChange()]);
  // Start from what was last sent if it is still waiting, so nothing typed is lost.
  const waiting = change?.status === "pending" ? change : null;

  return (
    <div className="px-4 pb-4 pt-4">
      <div className="flex items-center gap-1">
        <Link
          href={site.retailer.profile}
          aria-label="Back to profile"
          className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-retail"
        >
          <ChevronLeftIcon className="size-6" />
        </Link>
        <h1 className="text-[17px] font-bold text-ink">Business details</h1>
      </div>
      <div className="mt-4">
        <BusinessProfileForm
          initial={{
            business: waiting?.businessName ?? shop?.businessName ?? "",
            storeType: waiting?.storeType ?? shop?.storeType ?? "",
            rcNumber: waiting ? (waiting.rcNumber ?? "") : (shop?.rcNumber ?? ""),
          }}
        />
      </div>
    </div>
  );
}
