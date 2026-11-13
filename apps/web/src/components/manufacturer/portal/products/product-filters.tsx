"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { PRODUCT_CATEGORIES, PRODUCT_STATUSES, PRODUCT_STATUS_LABELS } from "@skanproov/validation";

const SORTS = [
  { value: "updated", label: "Recently updated" },
  { value: "name", label: "Name (A–Z)" },
  { value: "newest", label: "Newest added" },
] as const;

const selectClass =
  "h-12 w-full appearance-none rounded-lg border border-field-border bg-white pl-4 pr-9 text-[14px] text-ink outline-none transition focus:border-retail focus:ring-4 focus:ring-retail/15";

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
        {children}
      </select>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="pointer-events-none absolute right-4 top-1/2 size-3 -translate-y-1/2 text-muted">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

/** Search, category, status and sort. Each change updates the address, so the list is filtered on the server. */
export function ProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function update(next: Record<string, string>) {
    const search = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) search.set(key, value);
      else search.delete(key);
    }
    search.delete("page");
    const qs = search.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  // Wait for a pause in typing before searching.
  useEffect(() => () => clearTimeout(timer.current), []);
  function onSearch(value: string) {
    setQuery(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => update({ q: value.trim() }), 300);
  }

  return (
    <div role="search" className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_auto_auto_auto] md:[&>*:not(:first-child)]:min-w-[165px]">
      <div className="relative">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          aria-label="Search by product name or SKU"
          placeholder="Search by product name or SKU"
          value={query}
          onChange={(event) => onSearch(event.target.value)}
          className="h-12 w-full rounded-lg border border-field-border bg-white pl-11 pr-4 text-[15px] text-ink outline-none transition placeholder:text-field-placeholder focus:border-retail focus:ring-4 focus:ring-retail/15"
        />
      </div>
      <Select label="Category" value={params.get("category") ?? ""} onChange={(value) => update({ category: value })}>
        <option value="">All categories</option>
        {PRODUCT_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </Select>
      <Select label="Registration status" value={params.get("status") ?? ""} onChange={(value) => update({ status: value })}>
        <option value="">All registration statuses</option>
        {PRODUCT_STATUSES.map((status) => (
          <option key={status} value={status}>
            {PRODUCT_STATUS_LABELS[status]}
          </option>
        ))}
      </Select>
      <Select label="Sort by" value={params.get("sort") ?? "updated"} onChange={(value) => update({ sort: value === "updated" ? "" : value })}>
        {SORTS.map((sort) => (
          <option key={sort.value} value={sort.value}>
            {sort.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
