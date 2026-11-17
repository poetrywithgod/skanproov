import type { Metadata } from "next";
import { ContactForm } from "@/components/manufacturer/portal/settings/contact-form";
import { getCompany } from "@/lib/manufacturer/company";
import { can, getManufacturerContext } from "@/lib/manufacturer/portal";

export const metadata: Metadata = { title: "Contact details", robots: { index: false } };

export default async function ContactDetailsPage() {
  const [company, manufacturer] = await Promise.all([getCompany(), getManufacturerContext()]);
  if (!company) return <p className="rounded-xl border border-line bg-white px-6 py-10 text-center text-sm text-body" role="status">We couldn&apos;t load your company details. Please refresh the page.</p>;
  return (
    <ContactForm
      canEdit={can(manufacturer, "manage_settings")}
      primaryEmail={company.contactEmail ?? ""}
      initial={{
        contactName: company.contactName ?? "",
        contactRole: company.contactRole ?? "",
        contactPhone: company.contactPhone ?? "",
        qualityEmail: company.qualityEmail ?? "",
        website: company.website ?? "",
      }}
    />
  );
}
