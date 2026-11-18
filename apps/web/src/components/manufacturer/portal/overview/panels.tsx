import Link from "next/link";
import type { ReactNode } from "react";
import { productCode } from "@/lib/manufacturer/product-shared";
import type { Overview, ScanActivity as Scans } from "@/lib/manufacturer/overview";
import { site } from "@/lib/site";
import { BatchesIcon, ChevronIcon, CodesIcon, ProductsIcon, TeamIcon } from "../icons";
import { formatDate, formatNumber, ProductThumb } from "../products/bits";

const card = "rounded-xl border border-line bg-white";
const linkClass = "text-sm font-semibold text-retail hover:underline focus-visible:outline-2 focus-visible:outline-retail";

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

function lagosTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Lagos" });
  return `${date}, ${time}`;
}

/* ---------------------------------------------------------------- the four numbers on top */

function Stat({ title, value, note, tone = "muted", icon }: { title: string; value: string; note: ReactNode; tone?: "muted" | "warn"; icon: ReactNode }) {
  return (
    <div className={`${card} px-5 py-5`}>
      <div className="flex items-start justify-between gap-3 text-sm text-body">
        <p>{title}</p>
        <span className={tone === "warn" ? "text-[#c77700]" : "text-retail"}>{icon}</span>
      </div>
      <p className="mt-3 text-[34px] font-medium leading-none tracking-tight text-ink">{value}</p>
      <p className={`mt-2.5 text-xs ${tone === "warn" ? "text-[#c77700]" : "text-muted"}`}>{note}</p>
    </div>
  );
}

export function StatRow({ o }: { o: Overview }) {
  const { products, batches, codesThisMonth, awaiting } = o;
  const parts = [
    `${products.registered} registered`,
    products.pending ? `${products.pending} pending` : null,
    products.draft ? `${products.draft} draft` : null,
  ].filter(Boolean);
  return (
    <section aria-label="Totals" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat title="Products" value={formatNumber(products.total)} note={products.total ? parts.join(" · ") : "None yet"} icon={<ProductsIcon className="size-5" />} />
      <Stat
        title="Production batches"
        value={formatNumber(batches.total)}
        note={batches.total ? `Across ${batches.productsWithBatches} ${batches.productsWithBatches === 1 ? "product" : "products"}` : "None declared yet"}
        icon={<BatchesIcon className="size-5" />}
      />
      {/* DEFERRED(D04): when plans exist, add "of N monthly allowance" here. */}
      <Stat
        title="Codes generated this month"
        value={formatNumber(codesThisMonth.codes)}
        note={codesThisMonth.runs ? `${codesThisMonth.runs} ${codesThisMonth.runs === 1 ? "run" : "runs"} this month` : "No runs this month"}
        icon={<CodesIcon className="size-5" />}
      />
      <Stat
        title="Units awaiting codes"
        value={formatNumber(awaiting.units)}
        tone={awaiting.units > 0 ? "warn" : "muted"}
        note={awaiting.top ? `${awaiting.top.batch.batchNumber} · Ready to generate` : "Every declared unit has a code"}
        icon={<CodesIcon className="size-5" />}
      />
    </section>
  );
}

/* ---------------------------------------------------------------- not connected yet (see docs/DEFERRED.md) */

/** A panel from the design that has no real data yet. It says so, and why, so it is not forgotten. */
export function DeferredPanel({ id, title, needs, className = "" }: { id: string; title: string; needs: string; className?: string }) {
  return (
    <section className={`${card} p-6 ${className}`} aria-label={`${title} (not connected yet)`} data-deferred={id}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        <span className="rounded-full bg-pill px-2.5 py-0.5 text-xs font-medium text-muted">Not connected yet</span>
      </div>
      <div className="mt-5 grid place-items-center rounded-xl border border-dashed border-line-strong px-6 py-10 text-center">
        <p className="max-w-sm text-sm leading-relaxed text-body">{needs}</p>
        <p className="mt-2 text-xs text-muted">Tracked as {id} in docs/DEFERRED.md</p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- scan activity */

const shortDay = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export function ScanActivityPanel({ scans }: { scans: Scans | null }) {
  const first = scans?.days[0]?.day;
  const last = scans?.days.at(-1)?.day;
  const share = scans && scans.total > 0 ? (scans.authentic / scans.total) * 100 : null;
  // A round top for the scale: 10, 20, 50, 100 ... times a step.
  const max = Math.max(0, ...(scans?.days.map((d) => d.authentic + d.repeat + d.other) ?? []));
  const top = max <= 4 ? 4 : Math.ceil(max / 10 ** (String(max).length - 1)) * 10 ** (String(max).length - 1);
  const ticks = [top, (top * 2) / 3, top / 3, 0].map((v) => Math.round(v));

  return (
    <section className={`${card} p-6`} aria-labelledby="scan-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="scan-title" className="text-xl font-semibold text-ink">Scan activity</h2>
        {first && last ? <p className="text-sm text-body">{shortDay(first)} to {shortDay(last)}</p> : null}
      </div>
      {!scans ? (
        <p className="mt-5 rounded-xl bg-surface-soft px-4 py-10 text-center text-sm text-body" role="status">Scan activity couldn&apos;t be loaded. Please refresh the page.</p>
      ) : scans.total === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-line-strong px-6 py-12 text-center text-sm leading-relaxed text-body" role="status">
          No scans of your codes in the last 7 days. Scans appear here once customers verify codes from released batches.
        </p>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <p className="text-[34px] font-medium leading-none tracking-tight text-ink">{formatNumber(scans.total)}</p>
              <p className="mt-1.5 text-xs text-muted">Total scans · Last 7 days</p>
            </div>
            <div className="border-l border-line pl-8">
              <p className="text-[34px] font-medium leading-none tracking-tight text-retail-dark">{share === null ? "—" : `${share.toFixed(1)}%`}</p>
              <p className="mt-1.5 text-xs text-muted">Authentic results</p>
            </div>
          </div>
          <div className="mt-6 flex gap-3" role="img" aria-label={`Scans per day: ${scans.days.map((d) => `${shortDay(d.day)} ${d.authentic + d.repeat + d.other}`).join(", ")}`}>
            <div className="flex h-[168px] flex-col justify-between pb-6 text-right text-[11px] text-muted" aria-hidden="true">
              {ticks.map((t, i) => (<span key={i}>{formatNumber(t)}</span>))}
            </div>
            <div className="grid flex-1 grid-cols-7 items-end gap-2 border-b border-line" style={{ height: 168 }} aria-hidden="true">
              {scans.days.map((d, i) => {
                const total = d.authentic + d.repeat + d.other;
                const height = top > 0 ? Math.max(total > 0 ? 3 : 0, (total / top) * 144) : 0;
                return (
                  <div key={d.day} className="flex h-full flex-col items-center justify-end gap-1.5">
                    <div className={`w-full max-w-[44px] rounded-t-md ${i === scans.days.length - 1 ? "bg-retail-dark" : "bg-retail/40"}`} style={{ height }} title={`${shortDay(d.day)}: ${total} scans`} />
                    <span className="text-[11px] text-muted">{shortDay(d.day)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <table className="sr-only">
            <caption>Scans per day, last 7 days</caption>
            <thead><tr><th scope="col">Day</th><th scope="col">Authentic</th><th scope="col">Repeat</th><th scope="col">Other</th></tr></thead>
            <tbody>{scans.days.map((d) => (<tr key={d.day}><th scope="row">{shortDay(d.day)}</th><td>{d.authentic}</td><td>{d.repeat}</td><td>{d.other}</td></tr>))}</tbody>
          </table>
          <p className="mt-5 flex flex-wrap gap-x-8 gap-y-1 text-xs text-body">
            <span><span aria-hidden="true" className="mr-1.5 inline-block size-2 rounded-full bg-retail" />Authentic <strong className="ml-1 font-semibold text-ink">{formatNumber(scans.authentic)}</strong></span>
            <span><span aria-hidden="true" className="mr-1.5 inline-block size-2 rounded-full bg-[#c77700]" />Repeat scans <strong className="ml-1 font-semibold text-ink">{formatNumber(scans.repeat)}</strong></span>
            <span><span aria-hidden="true" className="mr-1.5 inline-block size-2 rounded-full bg-line-strong" />Recalled or expired <strong className="ml-1 font-semibold text-ink">{formatNumber(scans.other)}</strong></span>
          </p>
        </>
      )}
      {/* DEFERRED(D03): a "Suspected counterfeit" count here once fraud rules and alerts exist. */}
      <p className="mt-4 border-t border-row-line pt-3 text-xs text-muted">
        Counts one scan per person, code and result, from signed-in customers. Suspected counterfeit scans are not connected yet (D03).
      </p>
    </section>
  );
}

/* ---------------------------------------------------------------- needs attention */

interface Attention {
  key: string;
  icon: ReactNode;
  tone: "warn" | "ok" | "muted";
  title: string;
  detail: string;
  action?: { label: string; href: string };
}

export function NeedsAttention({ o, canGenerate, canRelease, canManageProducts }: { o: Overview; canGenerate: boolean; canRelease: boolean; canManageProducts: boolean }) {
  const items: Attention[] = [];

  if (o.awaiting.top) {
    const { batch, remaining } = o.awaiting.top;
    items.push({
      key: "codes",
      icon: <CodesIcon className="size-5" />,
      tone: "warn",
      title: `${formatNumber(remaining)} ${remaining === 1 ? "unit needs" : "units need"} codes`,
      detail: `${batch.productName} · ${batch.batchNumber}`,
      ...(canGenerate ? { action: { label: "Generate remaining codes", href: `${site.manufacturer.codes}?batch=${batch.id}` } } : {}),
    });
  }
  const ready = o.readyToRelease[0];
  if (ready) {
    const more = o.readyToRelease.length - 1;
    items.push({
      key: "release",
      icon: <BatchesIcon className="size-5" />,
      tone: "warn",
      title: o.readyToRelease.length === 1 ? "A batch is ready to release" : `${o.readyToRelease.length} batches are ready to release`,
      detail: `${ready.productName} · ${ready.batchNumber}${more > 0 ? ` and ${more} more` : ""}. Codes verify only after release.`,
      ...(canRelease ? { action: { label: "Open batch", href: `${site.manufacturer.batches}/${ready.id}` } } : {}),
    });
  }
  const draft = o.drafts[0];
  if (draft) {
    items.push({
      key: "draft",
      icon: <ProductsIcon className="size-5" />,
      tone: "muted",
      title: o.drafts.length === 1 ? "Finish your draft product" : `Finish your ${o.drafts.length} draft products`,
      detail: draft.name + (draft.variant ? ` ${draft.variant}` : ""),
      ...(canManageProducts ? { action: { label: "Complete setup", href: `${site.manufacturer.products}/${draft.id}/edit` } } : {}),
    });
  }

  const pending = o.pendingReview[0];
  const priorities = items.length;

  return (
    <section className={`${card} flex flex-col p-6`} aria-labelledby="attention-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="attention-title" className="text-xl font-semibold text-ink">Needs attention</h2>
        {priorities ? <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-medium text-warn">{priorities} {priorities === 1 ? "priority" : "priorities"}</span> : null}
      </div>
      {items.length === 0 ? (
        <p className="mt-6 rounded-xl bg-surface-soft px-4 py-6 text-center text-sm text-body">Nothing needs your attention right now.</p>
      ) : (
        <ul className="mt-4 divide-y divide-row-line">
          {items.map((item) => (
            <li key={item.key} className="flex gap-3.5 py-4 first:pt-2">
              <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${item.tone === "warn" ? "bg-warn-soft text-[#c77700]" : "bg-pill text-body"}`}>{item.icon}</span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-ink">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted">{item.detail}</p>
                {item.action ? (
                  <Link href={item.action.href} className={`${linkClass} mt-2 inline-flex items-center gap-1.5`}>
                    {item.action.label} <Arrow />
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      {pending ? (
        <Link href={`${site.manufacturer.products}/${pending.id}`} className="mt-auto flex items-center justify-between border-t border-row-line pt-4 text-xs text-muted hover:text-ink">
          <span>{pending.name} is pending review.</span>
          <ChevronIcon className="size-4" direction="right" />
        </Link>
      ) : null}
      {/* DEFERRED(D03): add "suspected counterfeit scans" here once fraud alerts exist. */}
    </section>
  );
}

/* ---------------------------------------------------------------- recent batches */

export function RecentBatches({ o, canGenerate }: { o: Overview; canGenerate: boolean }) {
  return (
    <section className={`${card} overflow-hidden`} aria-labelledby="recent-batches-title">
      <div className="flex items-center justify-between gap-3 px-6 pb-4 pt-6">
        <h2 id="recent-batches-title" className="text-xl font-semibold text-ink">Recent batches</h2>
        <Link href={site.manufacturer.batches} className={`${linkClass} inline-flex items-center gap-1.5`}>
          View all batches <Arrow />
        </Link>
      </div>
      {o.recentBatches.length === 0 ? (
        <p className="border-t border-row-line px-6 py-10 text-center text-sm text-body">No batches yet. Declare a batch to start generating codes.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <caption className="sr-only">Most recently declared batches</caption>
            <thead>
              <tr className="border-y border-row-line bg-surface-soft text-xs font-medium text-body">
                <th scope="col" className="px-6 py-2.5 font-medium">Product / Batch</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Latest codes generated</th>
                <th scope="col" className="px-6 py-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {o.recentBatches.map(({ batch, imagePath, latestRun, remaining }) => (
                <tr key={batch.id} className="border-b border-row-line last:border-b-0">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <ProductThumb path={imagePath} name={batch.productName} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{batch.productName}{batch.variant ? ` ${batch.variant}` : ""}</p>
                        <p className="text-xs text-muted">{batch.batchNumber} · {batch.releasedAt ? "Released" : batch.status === "active" ? "Active" : batch.status === "recalled" ? "Recalled" : "Revoked"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    {latestRun ? (
                      <>
                        <p className="text-[15px] text-ink">{formatNumber(latestRun.quantity)}</p>
                        <p className="text-xs text-muted">{formatDate(latestRun.createdAt)}</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted">None yet</p>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    {canGenerate && remaining > 0 ? (
                      <Link href={`${site.manufacturer.codes}?batch=${batch.id}`} className={linkClass}>Generate Codes</Link>
                    ) : (
                      <Link href={`${site.manufacturer.batches}/${batch.id}`} className={linkClass}>View batch</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- recent activity */

const ACTIVITY_ICON: Record<string, ReactNode> = {
  codes_generated: <CodesIcon className="size-5" />,
  batch_declared: <BatchesIcon className="size-5" />,
  batch_released: <BatchesIcon className="size-5" />,
  product_registered: <ProductsIcon className="size-5" />,
  member_invited: <TeamIcon className="size-5" />,
  member_joined: <TeamIcon className="size-5" />,
  role_changed: <TeamIcon className="size-5" />,
  member_revoked: <TeamIcon className="size-5" />,
  invite_cancelled: <TeamIcon className="size-5" />,
};

export function RecentActivity({ o, canExport }: { o: Overview; canExport: boolean }) {
  const activity = o.activity ?? [];
  return (
    <section className={`${card} overflow-hidden`} aria-labelledby="recent-activity-title">
      <div className="flex items-center justify-between gap-3 px-6 pb-4 pt-6">
        <h2 id="recent-activity-title" className="text-xl font-semibold text-ink">Recent activity</h2>
        <Link href={site.manufacturer.audit} className={`${linkClass} inline-flex items-center gap-1.5`}>
          View audit logs <Arrow />
        </Link>
      </div>
      {activity.length === 0 ? (
        <p className="border-t border-row-line px-6 py-10 text-center text-sm text-body">Nothing has happened yet. Your team&apos;s actions will appear here.</p>
      ) : (
        <ul>
          {activity.map((a) => (
            <li key={a.id} className="flex items-center gap-3.5 border-t border-row-line px-6 py-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-retail-soft text-retail">{ACTIVITY_ICON[a.kind] ?? <CodesIcon className="size-5" />}</span>
              <div className="min-w-0">
                <p className="text-[15px] font-medium text-ink">{a.summary}</p>
                <p className="text-xs text-muted">{a.actorName ? `${a.actorName} · ` : ""}{lagosTime(a.createdAt)}</p>
              </div>
              {canExport && a.runId ? (
                <span className="ml-auto flex shrink-0 gap-4 text-sm">
                  <a href={`${site.manufacturer.codes}/download/${a.runId}/csv`} className={linkClass}>CSV</a>
                  <a href={`${site.manufacturer.codes}/download/${a.runId}/pdf`} className={linkClass}>Label PDF</a>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <p className="border-t border-row-line px-6 py-3 text-xs text-muted">CSV and label PDF downloads are available for 30 days, in Code Management.</p>
    </section>
  );
}

/* ---------------------------------------------------------------- product protection */

export function ProductProtection({ o }: { o: Overview }) {
  const f = o.focus;
  return (
    <section className={`${card} p-6`} aria-labelledby="protection-title">
      <h2 id="protection-title" className="text-xl font-semibold text-ink">Product protection</h2>
      {!f ? (
        <p className="mt-6 rounded-xl bg-surface-soft px-4 py-8 text-center text-sm text-body">Declare a batch for a registered product to see how much of it is protected.</p>
      ) : (
        (() => {
          const pct = f.declared > 0 ? Math.min(100, (f.coded / f.declared) * 100) : 0;
          const awaiting = Math.max(0, f.declared - f.coded);
          return (
            <>
              <div className="mt-5 flex items-center gap-3.5">
                <ProductThumb path={f.product.imagePath} name={f.product.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-ink">{f.product.name}{f.product.variant ? ` ${f.product.variant}` : ""}</p>
                  <p className="text-xs text-muted">{f.batches} {f.batches === 1 ? "batch" : "batches"} · {formatNumber(f.declared)} units declared · {productCode(f.product.productNo)}</p>
                </div>
              </div>
              <div className="mt-6 flex items-baseline justify-between gap-3">
                <p className="text-lg font-semibold text-retail-dark">{pct.toFixed(1)}% coded</p>
                <p className="text-xs text-muted">{formatNumber(f.coded)} / {formatNumber(f.declared)}</p>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-track" role="img" aria-label={`${pct.toFixed(1)} percent of declared units have codes`}>
                <div className="h-full rounded-full bg-retail" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                {awaiting > 0 ? `${formatNumber(awaiting)} units awaiting codes. ` : "Every declared unit has a code. "}
                Code generation does not activate codes; a batch&apos;s codes verify only after you release it.
              </p>
              <Link href={`${site.manufacturer.products}/${f.product.id}`} className={`${linkClass} mt-5 inline-flex items-center gap-1.5 border-t border-row-line pt-4`}>
                View product and batches <Arrow />
              </Link>
            </>
          );
        })()
      )}
    </section>
  );
}
