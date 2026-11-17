"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AUDIT_GROUPS, AUDIT_RANGES, DEFAULT_RANGE, type AuditFilters } from "@/lib/manufacturer/audit-shared";

const field =
  "h-12 w-full rounded-xl border border-field-border bg-white px-4 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-retail";

/** Search box and two selects. Changing any of them reloads the list from page 1 (the address holds the filters). */
export function AuditFilterBar({ filters }: { filters: AuditFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(filters.q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function go(next: Partial<AuditFilters>) {
    const f = { ...filters, q, ...next };
    const params = new URLSearchParams();
    if (f.q.trim()) params.set("q", f.q.trim());
    if (f.type) params.set("type", f.type);
    if (f.range !== DEFAULT_RANGE) params.set("range", f.range);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="space-y-4 p-5 sm:p-6">
      <div className="relative">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-4-4" />
        </svg>
        <input
          type="search"
          value={q}
          maxLength={80}
          aria-label="Search activity, user or reference"
          placeholder="Search activity, user or reference"
          className={`${field} pl-12 placeholder:text-field-placeholder`}
          onChange={(e) => {
            const value = e.target.value;
            setQ(value);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => go({ q: value }), 400);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (timer.current) clearTimeout(timer.current);
              go({ q });
            }
          }}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <select aria-label="Date range" value={filters.range} onChange={(e) => go({ range: e.target.value })} className={field}>
          {AUDIT_RANGES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select aria-label="Activity type" value={filters.type} onChange={(e) => go({ type: e.target.value })} className={field}>
          {AUDIT_GROUPS.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
      </div>
      {/* DEFERRED(D16): an "Outcomes" filter (success, blocked, failed) once blocked and failed events are recorded. */}
    </div>
  );
}
