"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { SearchIcon } from "@/components/app/app-icons";
import { formatClock, formatDayHeading, inFilter, type HistoryFilter, type ScanEntry } from "@/lib/retailer/format";
import { site } from "@/lib/site";
import { ScanChip } from "./scan-chip";

const FILTERS: { key: HistoryFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "received", label: "Received" },
  { key: "not-received", label: "Not received" },
  { key: "on-hold", label: "On hold" },
];

/** Every carton the shop has checked: search, four filters with counts, grouped by day. */
export function HistoryList({ scans, now }: { scans: ScanEntry[]; now: string }) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<HistoryFilter>("all");

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.key, scans.filter((s) => inFilter(s, f.key)).length])) as Record<HistoryFilter, number>,
    [scans],
  );

  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () =>
      scans.filter(
        (s) =>
          inFilter(s, filter) &&
          (!q ||
            [s.product, s.manufacturer, s.carton, s.batch, s.code].some((v) => v?.toLowerCase().includes(q))),
      ),
    [scans, filter, q],
  );

  const groups = useMemo(() => {
    const nowDate = new Date(now);
    const out: { key: string; label: string; items: ScanEntry[] }[] = [];
    for (const scan of shown) {
      const day = formatDayHeading(scan.scannedAt, nowDate);
      const last = out[out.length - 1];
      if (last && last.key === day.key) last.items.push(scan);
      else out.push({ ...day, items: [scan] });
    }
    return out;
  }, [shown, now]);

  if (scans.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white px-5 py-8 text-center">
        <p className="text-[15px] font-semibold text-ink">No cartons checked yet</p>
        <p className="mx-auto mt-1 max-w-[280px] text-[13px] leading-[1.5] text-body">
          Every carton you scan is saved here, so you can find it again later.
        </p>
        <Link
          href={site.retailer.scan}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-retail px-5 text-[15px] font-semibold text-white hover:bg-retail-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail"
        >
          Scan a carton
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-field-placeholder" />
        <label htmlFor={searchId} className="sr-only">
          Search your history by product, manufacturer, batch or carton
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search product, batch or carton"
          autoComplete="off"
          className="h-12 w-full rounded-2xl border border-line bg-white pl-12 pr-4 text-[15px] text-ink placeholder:text-field-placeholder focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-retail"
        />
      </div>

      <div role="group" aria-label="Filter history" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none]">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f.key)}
              className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail ${
                active ? "bg-retail text-white" : "bg-white text-ink ring-1 ring-inset ring-line"
              }`}
            >
              {f.label} <span className={active ? "text-white/80" : "text-[#8f9496]"}>{counts[f.key]}</span>
            </button>
          );
        })}
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white px-5 py-8 text-center">
          <p className="text-[15px] font-semibold text-ink">Nothing matches</p>
          <p className="mx-auto mt-1 max-w-[280px] text-[13px] leading-[1.5] text-body">
            Try a different word, or choose All.
          </p>
        </div>
      ) : (
        <div aria-live="polite" className="space-y-5">
          {groups.map((group) => (
            <section key={group.key} aria-label={group.label}>
              <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-[#5b6660]">{group.label}</h2>
              <ul className="space-y-2.5">
                {group.items.map((scan) => (
                  <li key={scan.id}>
                    <Link
                      href={`${site.retailer.result}/${encodeURIComponent(scan.code)}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-3.5 transition-colors hover:bg-[#f9fbf9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail"
                    >
                      <span className="min-w-0">
                        <span className="block break-words text-[15px] font-bold leading-snug text-ink">
                          {scan.product ?? "Unknown carton"}
                        </span>
                        <span className="mt-0.5 block break-words text-[13px] leading-snug text-body">
                          {[scan.manufacturer, scan.carton ?? scan.code].filter(Boolean).join(" · ")}
                        </span>
                        <span className="mt-2 block">
                          <ScanChip scan={scan} />
                        </span>
                      </span>
                      <span className="shrink-0 self-start text-[13px] font-medium text-muted">{formatClock(scan.scannedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
