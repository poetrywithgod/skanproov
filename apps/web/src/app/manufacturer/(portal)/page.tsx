import type { Metadata } from "next";
import Link from "next/link";
import { DeclareBatchButton } from "@/components/manufacturer/portal/batches/bits";
import { PortalTopBar } from "@/components/manufacturer/portal/portal-top-bar";
import {
  DeferredPanel,
  NeedsAttention,
  ProductProtection,
  RecentActivity,
  RecentBatches,
  StatRow,
} from "@/components/manufacturer/portal/overview/panels";
import { CodesIcon } from "@/components/manufacturer/portal/icons";
import { getOverview } from "@/lib/manufacturer/overview";
import { can, getManufacturerContext } from "@/lib/manufacturer/portal";
import { site } from "@/lib/site";
import { getCurrentUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Overview", robots: { index: false } };

export default async function ManufacturerOverviewPage() {
  const [manufacturer, user, o] = await Promise.all([getManufacturerContext(), getCurrentUser(), getOverview()]);
  const canDeclare = can(manufacturer, "declare_batches");
  const canGenerate = can(manufacturer, "generate_codes");
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" });
  const first = user?.fullName?.trim().split(/\s+/)[0];

  return (
    <>
      <PortalTopBar title="Overview" />
      <main className="px-5 py-6 sm:px-8">
        <p className="flex items-center gap-2 text-sm text-body">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="size-4 text-muted" aria-hidden="true">
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M4 10h16M9 3v4M15 3v4" />
          </svg>
          {today}
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-ink">Your protection at a glance</h1>
            <p className="mt-1 text-base text-body">{first ? `Welcome back, ${first}. ` : "Welcome back. "}Keep every production run protected.</p>
          </div>
          {canDeclare || canGenerate ? (
            <div className="flex flex-wrap gap-3">
              {canDeclare ? <DeclareBatchButton /> : null}
              {canGenerate ? (
                <Link
                  href={site.manufacturer.codes}
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-retail px-5 text-[15px] font-semibold text-white transition hover:bg-retail-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail"
                >
                  <CodesIcon className="size-5" />
                  Generate Codes
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <StatRow o={o} />

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {/* DEFERRED(D01): the scan activity chart. */}
          <DeferredPanel id="D01" title="Scan activity" needs="Scans per day and the share of authentic results will appear here once customers and retailers verify your codes and those results are stored per batch." />
          <NeedsAttention
            o={o}
            canGenerate={canGenerate}
            canRelease={can(manufacturer, "release_batches")}
            canManageProducts={can(manufacturer, "manage_products")}
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <RecentBatches o={o} canGenerate={canGenerate} />
          {/* DEFERRED(D02): top scan locations. */}
          <DeferredPanel id="D02" title="Top scan locations" needs="Where your products are scanned, by city, will appear here once scan locations are captured and the fraud intelligence engine is running." />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {o.activity ? <RecentActivity o={o} /> : <div className="hidden xl:block" />}
          <ProductProtection o={o} />
        </div>
      </main>
    </>
  );
}
