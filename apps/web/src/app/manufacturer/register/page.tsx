import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ApplicationStatus } from "@/components/manufacturer/application-status";
import { CompanyShell } from "@/components/manufacturer/company-shell";
import { DocumentsForm } from "@/components/manufacturer/documents-form";
import { getCompanyDraft, getMyApplication, getMyDocuments } from "@/lib/manufacturer/data";
import { getManufacturerContext } from "@/lib/manufacturer/portal";
import { site } from "@/lib/site";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Your company", robots: { index: false } };

export default async function ManufacturerRegisterPage() {
  const user = await requireUser();
  // Approved companies go straight to the portal.
  if (await getManufacturerContext()) redirect(site.manufacturer.home);
  const application = await getMyApplication();

  // Waiting for a decision, or approved: nothing more to upload.
  if (application && application.status !== "rejected") {
    return (
      <CompanyShell>
        <div className="mx-auto max-w-[520px]">
          <h1 className="text-[17px] font-semibold text-ink">Your application</h1>
          <p className="mt-0.5 text-xs text-body">Thank you for applying to join SKANPROOV.</p>
          <ApplicationStatus application={application} />
        </div>
      </CompanyShell>
    );
  }

  const draft = await getCompanyDraft();

  // Signed in, but never filled in the company details (an account made before this screen existed).
  if (!draft && !application) {
    return (
      <CompanyShell>
        <div className="mx-auto max-w-[520px] py-10 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">We need your company details</h1>
          <p className="mt-3 text-base leading-relaxed text-body">
            This account has no company details yet. Register your company to continue.
          </p>
          <Link
            href={site.manufacturer.signup}
            className="mt-6 inline-block text-base font-semibold text-retail hover:text-retail-dark hover:underline"
          >
            Register your company
          </Link>
        </div>
      </CompanyShell>
    );
  }

  const documents = await getMyDocuments();
  const company = draft?.company ?? application?.company ?? "";
  const rcNumber = draft?.rcNumber ?? application?.rcNumber ?? "";

  return (
    <CompanyShell>
      <header>
        <h1 className="text-[17px] font-semibold tracking-normal text-ink">
          {application ? "Update your application" : "Upload your documents"}
        </h1>
        <p className="mt-0.5 text-xs text-body">
          {company} · {rcNumber}. We check these documents against your registration so we can verify your business.
        </p>
      </header>
      {application ? <ApplicationStatus application={application} /> : null}
      <div className="mt-6">
        <DocumentsForm userId={user.id} initial={documents} />
      </div>
    </CompanyShell>
  );
}
