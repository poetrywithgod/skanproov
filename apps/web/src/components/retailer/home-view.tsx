import Link from "next/link";
import { BellIcon, ChevronRightIcon } from "@/components/app/app-icons";
import { QrIcon } from "@/components/icons";
import type { RetailerContext, RetailerHome } from "@/lib/retailer/data";
import { formatScanTime, type ScanEntry } from "@/lib/retailer/format";
import { site } from "@/lib/site";
import { branchNotice, PendingNotice } from "./notice";
import { ScanChip } from "./scan-chip";

const CARD = "rounded-2xl bg-white p-4 shadow-[0_1px_4px_rgba(15,31,23,0.06)]";

function productLine(scan: ScanEntry) {
  return scan.product ?? "Unknown carton";
}

function subLine(scan: ScanEntry) {
  return scan.carton ?? scan.code;
}

export function RetailerHomeView({
  shop,
  data,
  unread = 0,
  now = new Date(),
}: {
  shop: RetailerContext;
  data: RetailerHome;
  /** Notifications not yet marked read. */
  unread?: number;
  now?: Date;
}) {
  const notice = branchNotice(shop);
  const resultHref = (scan: ScanEntry) => `${site.retailer.result}/${encodeURIComponent(scan.code)}`;

  return (
    <div className="space-y-5 px-4 pb-4 pt-4">
      <section aria-label="Your shop" className="flex items-start justify-between gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold leading-7 tracking-normal text-ink">{shop.businessName}</h1>
          <p className="mt-0.5 text-[13px] leading-5 text-body">Check stock before it reaches your shelves.</p>
        </div>
        <Link
          href={site.retailer.notifications}
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          className="relative grid size-11 shrink-0 place-items-center rounded-full bg-[#e6eee8] text-ink hover:bg-[#dbe7df] focus-visible:outline-2 focus-visible:outline-brand"
        >
          <BellIcon className="size-5" />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[11px] font-bold leading-[18px] text-white ring-2 ring-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Link>
      </section>

      {notice ? <PendingNotice {...notice} /> : null}

      <section aria-label="Scan a delivery" className="rounded-2xl bg-gradient-to-br from-[#10543b] via-[#0d6a49] to-[#0b5a3f] p-5 text-white shadow-[0_8px_24px_rgba(11,90,63,0.22)]">
        <h2 className="text-lg font-bold leading-6 tracking-normal">Delivery arrived?</h2>
        <p className="mt-1 text-sm leading-[1.5] text-white/85">Scan each carton before you accept it and put it on the shelf.</p>
        {shop.activeBranch ? (
          <Link
            href={site.retailer.scan}
            className="mt-4 flex h-[50px] items-center justify-center gap-2.5 rounded-xl bg-white text-[15px] font-bold text-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <QrIcon className="size-5" />
            Scan carton
          </Link>
        ) : (
          <p className="mt-4 rounded-xl bg-white/15 px-4 py-3 text-center text-sm font-semibold">Scanning opens when your branch is approved</p>
        )}
      </section>

      {data.onHoldCount > 0 ? (
        <section aria-labelledby="hold-heading">
          <h2 id="hold-heading" className="mb-2 text-lg font-bold tracking-normal text-ink">
            On hold ({data.onHoldCount})
          </h2>
          <ul className="space-y-2.5">
            {data.onHold.map((scan) => (
              <li key={scan.id} className={`${CARD} flex items-center gap-3 !p-3`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-ink">{productLine(scan)}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2">
                    <ScanChip scan={scan} />
                    <span className="truncate text-xs text-muted">{subLine(scan)}</span>
                  </p>
                </div>
                <Link
                  href={resultHref(scan)}
                  className="inline-flex h-9 shrink-0 items-center rounded-lg bg-ink px-4 text-[13px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  Review
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="recent-heading">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="recent-heading" className="text-lg font-bold tracking-normal text-ink">
            Recent scans
          </h2>
          {data.recent.length > 0 ? (
            <Link href={site.retailer.history} className="inline-flex items-center gap-0.5 text-[13px] font-bold text-brand hover:text-brand-deep">
              View all
              <ChevronRightIcon className="size-4" strokeWidth={2.4} />
            </Link>
          ) : null}
        </div>
        {data.recent.length > 0 ? (
          <ul className="space-y-2.5">
            {data.recent.map((scan) => (
              <li key={scan.id}>
                <Link href={resultHref(scan)} className={`${CARD} flex items-center justify-between gap-3 !p-3`}>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold text-ink">{productLine(scan)}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2">
                      <ScanChip scan={scan} />
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">{formatScanTime(scan.scannedAt, now)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className={`${CARD} px-5 py-7 text-center`}>
            <p className="text-[15px] font-semibold text-ink">No cartons scanned yet</p>
            <p className="mx-auto mt-1 max-w-[260px] text-[13px] leading-[1.5] text-body">Cartons you scan will show up here.</p>
          </div>
        )}
      </section>

      <section aria-labelledby="month-heading">
        <h2 id="month-heading" className="mb-2 text-lg font-bold tracking-normal text-ink">
          This month
        </h2>
        <dl className="grid grid-cols-3 gap-2.5">
          {[
            ["Scanned", data.month.scanned, "text-ink"],
            ["Received", data.month.received, "text-brand"],
            ["Flagged", data.month.flagged, data.month.flagged > 0 ? "text-danger" : "text-ink"],
          ].map(([label, value, tone]) => (
            <div key={label as string} className={`${CARD} text-center !px-2 !py-3`}>
              <dd className={`text-2xl font-bold leading-8 ${tone}`}>{value}</dd>
              <dt className="text-xs text-muted">{label}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="conn-heading" className={CARD}>
        <div className="flex items-center justify-between">
          <h2 id="conn-heading" className="text-lg font-bold tracking-normal text-ink">
            Manufacturer connections
          </h2>
          <Link href={site.retailer.manufacturers} className="text-[13px] font-bold text-brand hover:text-brand-deep">
            Manage
          </Link>
        </div>
        {data.connected.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {data.connected.map((m) => (
              <li key={m.id} className="rounded-full bg-brand-soft px-3 py-1.5 text-[13px] font-semibold text-brand-deep">
                {m.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[13px] leading-[1.5] text-body">
            You are not connected to any manufacturer yet. Cartons can only be confirmed safe for manufacturers you are connected to.
          </p>
        )}
      </section>

      <section id="updates" aria-labelledby="updates-heading" className="scroll-mt-20">
        <h2 id="updates-heading" className="mb-2 text-lg font-bold tracking-normal text-ink">
          Updates
        </h2>
        {data.updates.length > 0 ? (
          <ul className="space-y-2.5">
            {data.updates.map((u) => (
              <li key={u.id} className={`${CARD} flex items-start justify-between gap-3 !p-3 text-[14px] leading-[1.4] text-ink`}>
                <span>{u.text}</span>
                <span className="shrink-0 text-xs text-muted">{formatScanTime(u.at, now)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={`${CARD} text-[13px] text-body`}>Nothing new. Approvals and connections will show here.</p>
        )}
      </section>
    </div>
  );
}
