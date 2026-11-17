import type { Metadata } from "next";
import Link from "next/link";
import { AuditFilterBar } from "@/components/manufacturer/portal/audit/audit-filters";
import { PortalTopBar } from "@/components/manufacturer/portal/portal-top-bar";
import { PageHeading } from "@/components/manufacturer/portal/products/bits";
import { NoAccess } from "@/components/manufacturer/portal/team/no-access";
import { formatNumber } from "@/components/manufacturer/portal/products/bits";
import { getAuditPage } from "@/lib/manufacturer/audit";
import { AUDIT_PAGE_SIZE, auditCategory, auditRefType, parseAuditFilters, DEFAULT_RANGE, type AuditFilters } from "@/lib/manufacturer/audit-shared";
import { can, getManufacturerContext } from "@/lib/manufacturer/portal";
import { fmtDate } from "@/lib/manufacturer/team-shared";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Audit Logs", robots: { index: false } };

type SearchParams = { q?: string; type?: string; range?: string; page?: string };

const LAGOS = "Africa/Lagos";
const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: LAGOS });

function query(filters: AuditFilters, page: number, extra: Record<string, string> = {}): string {
  const p = new URLSearchParams();
  if (filters.q) p.set("q", filters.q);
  if (filters.type) p.set("type", filters.type);
  if (filters.range !== DEFAULT_RANGE) p.set("range", filters.range);
  if (page > 1) p.set("page", String(page));
  for (const [k, v] of Object.entries(extra)) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const manufacturer = await getManufacturerContext();
  if (!can(manufacturer, "view_audit_logs")) return <NoAccess title="Audit Logs" what="You can't open Audit Logs" />;

  const filters = parseAuditFilters(sp);
  const requested = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  let { entries, total } = await getAuditPage(filters, requested);
  const pages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));
  let page = Math.min(requested, pages);
  if (page !== requested) ({ entries, total } = await getAuditPage(filters, page)); // a page past the end
  const from = total === 0 ? 0 : (page - 1) * AUDIT_PAGE_SIZE + 1;
  const to = (page - 1) * AUDIT_PAGE_SIZE + entries.length;
  const canExport = can(manufacturer, "export_audit_logs");
  const filtered = Boolean(filters.q || filters.type);

  return (
    <>
      <PortalTopBar title="Audit Logs" />
      <main className="px-5 py-6 sm:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-body">
          <Link href={site.manufacturer.home} className="hover:underline">Overview</Link>
          <span aria-hidden="true" className="mx-2 text-muted">›</span>
          <span className="text-retail">Audit Logs</span>
        </nav>
        <PageHeading
          title="Audit Logs"
          subtitle="A record of batch, code, product and team activity on your account."
          {...(canExport
            ? {
                action: (
                  <a
                    href={`${site.manufacturer.audit}/export${query(filters, 1)}`}
                    className="inline-flex h-12 items-center gap-2 rounded-xl border border-line-strong bg-white px-5 text-[15px] font-semibold text-ink transition hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
                      <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14" />
                    </svg>
                    Export logs
                  </a>
                ),
              }
            : {})}
        />

        <section className="mt-6 overflow-hidden rounded-xl border border-line bg-white" aria-label="Audit log">
          <AuditFilterBar filters={filters} />

          {entries.length === 0 ? (
            <p className="border-t border-row-line px-6 py-14 text-center text-sm text-body" role="status">
              {filtered || filters.range !== "all" ? "No activity matches these filters." : "Nothing has been recorded yet."}
            </p>
          ) : (
            <div className="overflow-x-auto border-t border-row-line">
              <table className="w-full min-w-[820px] text-left text-sm">
                <caption className="sr-only">Account activity, newest first</caption>
                <thead>
                  <tr className="border-b border-row-line bg-surface-soft text-[13px] text-body">
                    <th scope="col" className="px-6 py-3.5 font-medium">Date &amp; time</th>
                    <th scope="col" className="px-3 py-3.5 font-medium">Activity</th>
                    <th scope="col" className="px-3 py-3.5 font-medium">Performed by</th>
                    <th scope="col" className="px-3 py-3.5 font-medium">Reference</th>
                    <th scope="col" className="px-6 py-3.5 font-medium">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => {
                    const refType = auditRefType(e.kind);
                    return (
                      <tr key={e.id} className="border-b border-row-line align-top last:border-b-0">
                        <td className="whitespace-nowrap px-6 py-4">
                          <p className="text-[15px] text-ink">{fmtDate(e.createdAt)}</p>
                          <p className="text-xs text-muted">{time(e.createdAt)}</p>
                        </td>
                        <td className="max-w-[300px] px-3 py-4">
                          <p className="text-[15px] font-semibold leading-snug text-ink">{e.summary}</p>
                          <p className="mt-0.5 text-xs text-muted">{auditCategory(e.kind)}</p>
                        </td>
                        <td className="px-3 py-4">
                          <p className="text-[15px] text-ink">{e.actorName ?? "Unknown"}</p>
                          {e.actorRole ? <p className="text-xs text-muted">{e.actorRole}</p> : null}
                        </td>
                        <td className="px-3 py-4">
                          {e.refLabel && refType ? (
                            <>
                              <p className="text-xs text-muted">{refType}</p>
                              <p className="font-mono text-[13px] text-ink">{e.refLabel}</p>
                            </>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {/* DEFERRED(D16): Blocked and Failed outcomes, once those events are recorded. Everything recorded today succeeded. */}
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-retail-soft px-2.5 py-0.5 text-xs font-medium text-retail-dark">
                            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                            Success
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-row-line px-6 py-4 text-[13px] text-muted">
            <p>{total === 0 ? "No records" : `Showing ${formatNumber(from)}–${formatNumber(to)} of ${formatNumber(total)} records`}</p>
            {pages > 1 ? (
              <nav aria-label="Pages" className="flex items-center gap-3">
                {page > 1 ? (
                  <Link href={`${site.manufacturer.audit}${query(filters, page - 1)}`} aria-label="Previous page" className="rounded-md px-2 py-1 text-ink hover:bg-surface-soft">‹ Previous</Link>
                ) : (
                  <span className="px-2 py-1 text-field-placeholder">‹ Previous</span>
                )}
                <span>Page {page} of {pages}</span>
                {page < pages ? (
                  <Link href={`${site.manufacturer.audit}${query(filters, page + 1)}`} aria-label="Next page" className="rounded-md px-2 py-1 text-ink hover:bg-surface-soft">Next ›</Link>
                ) : (
                  <span className="px-2 py-1 text-field-placeholder">Next ›</span>
                )}
              </nav>
            ) : null}
          </div>
        </section>
        {/* DEFERRED(D17): security events (blocked sign-ins, devices), printing and reconciliation, and SKANPROOV review events appear here once they exist. */}
      </main>
    </>
  );
}
