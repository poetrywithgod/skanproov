import type { Metadata } from "next";
import { DeferredPanel } from "@/components/manufacturer/portal/overview/panels";
import { getCompany } from "@/lib/manufacturer/company";
import { fmtDate } from "@/lib/manufacturer/team-shared";

export const metadata: Metadata = { title: "Company profile", robots: { index: false } };

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 text-muted" aria-hidden="true">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

function Locked({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[13px] text-muted">
        <LockIcon />
        {label}
      </p>
      <p className={`mt-1 text-[15px] text-ink ${mono ? "font-mono" : "font-medium"}`}>{value || "—"}</p>
    </div>
  );
}

export default async function CompanyProfilePage() {
  const company = await getCompany();
  if (!company) return <p className="rounded-xl border border-line bg-white px-6 py-10 text-center text-sm text-body" role="status">We couldn&apos;t load your company details. Please refresh the page.</p>;

  return (
    <>
      <section className="rounded-xl border border-line bg-white" aria-labelledby="company-title">
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div>
            <h2 id="company-title" className="text-xl font-semibold text-ink">Registered business information</h2>
            <p className="mt-1 max-w-xl text-sm text-body">Company identity used on your SKANPROOV certificate and consumer verification pages.</p>
          </div>
          {/* DEFERRED(D18): "Request a change" (documents sent to SKANPROOV compliance for review). */}
          <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-dashed border-line-strong px-4 text-sm text-muted" title="Not connected yet">
            Request a change <span className="rounded-full bg-pill px-2 py-0.5 text-xs">Soon</span>
          </span>
        </div>
        <div className="border-t border-row-line p-6">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-body">
            {company.verifiedAt ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-retail-soft px-3 py-1 text-[13px] font-medium text-retail-dark">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                  Registration approved
                </span>
                <span>Since {fmtDate(company.verifiedAt)}</span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-3 py-1 text-[13px] font-medium text-warn">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                Pending verification
              </span>
            )}
            {/* DEFERRED(D18): the account ID (design: "MFR-NG-00418") once account numbers exist. */}
          </p>
          <dl className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            <Locked label="Registered company name" value={company.registeredName ?? company.name} />
            <Locked label="CAC registration (RC) number" value={company.rcNumber} />
            <Locked label="Tax identification number" value={company.tin} />
            <Locked label="NAFDAC / regulatory number" value={company.regulatoryNumber} />
            <Locked label="Business type" value={company.category} />
            <Locked label="Registered address" value={company.address} />
          </dl>
          <p className="mt-6 text-xs text-muted">Identity details are locked. Changes need supporting documents and are reviewed by SKANPROOV compliance.</p>
        </div>
      </section>

      {/* DEFERRED(D19): the list of manufacturing facilities and their licence status. */}
      <DeferredPanel id="D19" title="Manufacturing facilities" needs="The sites where your registered products are made, with their licence status, will appear here once facilities are recorded." />
    </>
  );
}
