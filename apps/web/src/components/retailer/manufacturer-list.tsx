"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { BadgeCheckIcon, SearchIcon } from "@/components/app/app-icons";
import { ScanIcon } from "@/components/icons";
import type { Manufacturer } from "@/lib/retailer/data";
import { site } from "@/lib/site";
import { ConnectButton } from "./connect-button";
import { ManufacturerAvatar } from "./manufacturer-avatar";

type TabKey = "connected" | "discover";

const BUTTON_BASE =
  "flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail";

function ManufacturerCard({ m }: { m: Manufacturer }) {
  return (
    <li className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,31,23,0.03)]">
      <div className="flex items-start gap-3">
        <ManufacturerAvatar name={m.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="flex min-w-0 items-start gap-1.5 text-[15px] font-bold leading-6 tracking-[-0.01em] text-ink">
              <span className="min-w-0 break-words">{m.name}</span>
              {m.verified ? <BadgeCheckIcon className="mt-[3px] size-[18px] shrink-0 text-retail" aria-label="Business verified" role="img" /> : null}
            </p>
            <span
              className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                m.connected ? "bg-retail-soft text-retail-dark" : "bg-pill text-[#5b6660]"
              }`}
            >
              {m.connected ? "Connected" : "Not connected"}
            </span>
          </div>
          {m.categories.length > 0 ? <p className="mt-0.5 text-sm leading-5 text-body">{m.categories.join(" · ")}</p> : null}
        </div>
      </div>

      <div className="mt-3.5 flex gap-2.5">
        <Link
          href={`${site.retailer.manufacturers}/${m.id}`}
          className={`${BUTTON_BASE} border border-line bg-white text-ink hover:bg-[#f4f6f4]`}
        >
          View profile
        </Link>
        {m.connected ? (
          <Link href={site.retailer.scan} className={`${BUTTON_BASE} bg-retail text-white hover:bg-retail-dark`}>
            <ScanIcon className="size-[18px]" />
            Scan cartons
          </Link>
        ) : (
          <ConnectButton manufacturerId={m.id} />
        )}
      </div>
    </li>
  );
}

function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-5 py-8 text-center">
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-[280px] text-[13px] leading-[1.5] text-body">{body}</p>
      {action}
    </div>
  );
}

/**
 * Connected and Discover tabs, a search box and category chips.
 * Connecting is instant: no approval, no limit on how many manufacturers.
 */
export function ManufacturerList({ manufacturers }: { manufacturers: Manufacturer[] }) {
  const searchId = useId();
  const connectedAll = useMemo(() => manufacturers.filter((m) => m.connected), [manufacturers]);
  const discoverAll = useMemo(() => manufacturers.filter((m) => !m.connected), [manufacturers]);

  const [tab, setTab] = useState<TabKey>(connectedAll.length > 0 ? "connected" : "discover");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  // Chips come from the manufacturers you could still connect to, most common first.
  const chips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of discoverAll) for (const c of m.categories) counts.set(c, (counts.get(c) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name]) => name);
  }, [discoverAll]);
  const activeCategory = category && chips.includes(category) ? category : null;

  const q = query.trim().toLowerCase();
  const matches = (m: Manufacturer) =>
    !q || m.name.toLowerCase().includes(q) || m.categories.some((c) => c.toLowerCase().includes(q));

  const shown =
    tab === "connected"
      ? connectedAll.filter(matches)
      : discoverAll.filter(matches).filter((m) => !activeCategory || m.categories.includes(activeCategory));

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "connected", label: "Connected", count: connectedAll.length },
    { key: "discover", label: "Discover", count: discoverAll.length },
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-field-placeholder" />
        <label htmlFor={searchId} className="sr-only">
          Search manufacturers by name or category
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or category"
          autoComplete="off"
          className="h-12 w-full rounded-2xl border border-line bg-white pl-12 pr-4 text-[15px] text-ink placeholder:text-field-placeholder focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-retail"
        />
      </div>

      <div role="tablist" aria-label="Manufacturers" className="flex rounded-2xl bg-track p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls="manufacturer-panel"
            onClick={() => setTab(t.key)}
            className={`h-10 flex-1 rounded-xl text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-retail ${
              tab === t.key ? "bg-white text-ink shadow-[0_1px_3px_rgba(15,31,23,0.1)]" : "text-[#5b6660]"
            }`}
          >
            {t.label} <span className="font-medium text-[#8f9496]">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "discover" && chips.length > 0 ? (
        <div
          role="group"
          aria-label="Filter by category"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {[null, ...chips].map((chip) => {
            const active = (chip ?? null) === activeCategory;
            return (
              <button
                key={chip ?? "all"}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(chip)}
                className={`h-10 shrink-0 rounded-full px-4 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail ${
                  active ? "bg-retail text-white" : "border border-line bg-white text-ink hover:bg-[#f4f6f4]"
                }`}
              >
                {chip ?? "All"}
              </button>
            );
          })}
        </div>
      ) : null}

      <div id="manufacturer-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} aria-live="polite">
        {shown.length > 0 ? (
          <ul className="space-y-3">
            {shown.map((m) => (
              <ManufacturerCard key={m.id} m={m} />
            ))}
          </ul>
        ) : manufacturers.length === 0 ? (
          <Empty title="No manufacturers yet" body="Manufacturers will appear here as they join SKANPROOV." />
        ) : q ? (
          <Empty title="No match" body={`Nothing matches “${query.trim()}”. Try a different name or category.`} />
        ) : tab === "connected" ? (
          <Empty
            title="Not connected to anyone yet"
            body="Connect to the manufacturers you buy from, so their cartons can be confirmed safe when you scan them."
            action={
              <button
                type="button"
                onClick={() => setTab("discover")}
                className="mt-4 h-11 rounded-xl bg-retail px-5 text-[15px] font-semibold text-white hover:bg-retail-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail"
              >
                Find manufacturers
              </button>
            }
          />
        ) : (
          <Empty title="You're connected to everyone" body="There are no other manufacturers on SKANPROOV to connect to right now." />
        )}
      </div>
    </div>
  );
}
