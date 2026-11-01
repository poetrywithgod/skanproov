"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckIcon, QrIcon } from "@/components/icons";
import {
  formatActivityTime,
  isToday,
  type ActivityStatus,
  type HistoryEntry,
} from "@/lib/customer/activity-data";
import { site } from "@/lib/site";
import {
  AlertTriangleIcon,
  ChevronRightIcon,
  ClockIcon,
  GiftIcon,
  InfoIcon,
  SearchIcon,
  ShieldIcon,
  ShieldXIcon,
  SparkleIcon,
} from "./app-icons";

type Tab = "scans" | "ledger";
type Filter = "all" | "authentic" | "unverified";

const FILTERS: { id: Filter; label: string; dot?: string }[] = [
  { id: "all", label: "All Results" },
  { id: "authentic", label: "Verified Authentic", dot: "bg-brand" },
  { id: "unverified", label: "Unverified Code", dot: "bg-[#5b6577]" },
];

const STATUS_STYLES: Record<ActivityStatus, { border: string; card: string }> = {
  authentic: { border: "border-l-brand", card: "bg-white" },
  duplicate: { border: "border-l-[#5b6577]", card: "bg-white" },
  counterfeit: { border: "border-l-danger", card: "bg-danger-soft" },
};

function Thumb({ entry }: { entry: HistoryEntry }) {
  if (entry.status === "counterfeit") {
    return (
      <span className="grid size-[50px] shrink-0 place-items-center rounded-lg bg-[#f6d5d2] text-danger">
        <ShieldXIcon className="size-6" />
      </span>
    );
  }
  return (
    <span className="relative grid size-[50px] shrink-0 place-items-center rounded-lg bg-[#e3ecf0] text-lg font-bold text-muted">
      {entry.productName.slice(0, 1)}
      {entry.status === "authentic" ? (
        <span className="absolute -bottom-1 -right-1 grid size-[18px] place-items-center rounded-full bg-brand text-white ring-2 ring-white">
          <CheckIcon className="size-2.5" strokeWidth={3.5} />
        </span>
      ) : null}
    </span>
  );
}

function StatusChip({ status }: { status: ActivityStatus }) {
  if (status === "authentic") {
    return (
      <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-brand px-2 text-xs font-semibold text-white">
        <CheckIcon className="size-3" strokeWidth={3} />
        Authentic
      </span>
    );
  }
  if (status === "duplicate") {
    return (
      <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-[#dfe5f2] px-2 text-xs font-semibold text-[#3d4a63]">
        <AlertTriangleIcon className="size-3" strokeWidth={2.4} />
        Duplicate
      </span>
    );
  }
  return (
    <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-danger px-2 text-xs font-semibold text-white">
      <AlertTriangleIcon className="size-3" strokeWidth={2.4} />
      Counterfeit
    </span>
  );
}

function ScanCard({ entry, now }: { entry: HistoryEntry; now: Date }) {
  const style = STATUS_STYLES[entry.status];
  const bad = entry.status === "counterfeit";
  return (
    <li className={`overflow-hidden rounded-2xl border-l-4 p-3.5 shadow-[0_1px_3px_rgba(15,31,23,0.07)] ${style.border} ${style.card}`}>
      <div className="flex gap-3">
        <Thumb entry={entry} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[15px] font-semibold leading-5 text-ink">{entry.productName}</p>
            <div className="shrink-0 text-right">
              <StatusChip status={entry.status} />
              <p
                className={`mt-1 text-[11px] font-bold uppercase ${
                  entry.status === "authentic" ? "text-brand" : bad ? "text-danger" : "text-body"
                }`}
              >
                {entry.pointsState === "reported" ? "Reported" : `${entry.points > 0 ? "+" : ""}${entry.points} PTS`}
              </p>
            </div>
          </div>
          <p className="mt-0.5 text-xs text-body">
            {[entry.manufacturer, entry.reference].filter(Boolean).join(" • ")}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-body">
            <ClockIcon className="size-3.5" />
            {formatActivityTime(entry.scannedAt, now)}
          </p>
        </div>
      </div>

      {entry.status === "authentic" && entry.nafdac ? (
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs">
          <span className="flex items-center gap-1.5 font-bold text-brand">
            <ShieldIcon className="size-3.5" />
            NAFDAC Reg: {entry.nafdac}
          </span>
          <Link
            href={`${site.links.verify}/${encodeURIComponent(entry.code)}`}
            className="inline-flex items-center font-semibold text-ink"
          >
            Inspect Details
            <ChevronRightIcon className="size-3.5" />
          </Link>
        </div>
      ) : null}

      {entry.status === "duplicate" && entry.note ? (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-[#e8eefb] px-3 py-2.5 text-xs text-[#3d4a63]">
          <InfoIcon className="size-4 shrink-0" />
          {entry.note}
        </p>
      ) : null}

      {bad ? (
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-danger">{entry.note}</span>
          <Link href={site.links.notifications} className="font-semibold text-danger underline">
            View Notice
          </Link>
        </div>
      ) : null}
    </li>
  );
}

function Group({ title, aside, children }: { title: string; aside?: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center justify-between px-1 text-xs">
        <h2 className="font-semibold uppercase tracking-wide text-body">{title}</h2>
        {aside ? <span className="text-muted">{aside}</span> : null}
      </div>
      <ul className="space-y-3">{children}</ul>
    </section>
  );
}

export function HistoryView({
  entries,
  points,
  now = new Date(),
}: {
  entries: HistoryEntry[];
  points: number;
  now?: Date;
}) {
  const [tab, setTab] = useState<Tab>("scans");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (filter === "authentic" && e.status !== "authentic") return false;
      if (filter === "unverified" && e.status === "authentic") return false;
      if (!q) return true;
      return [e.productName, e.manufacturer ?? "", e.reference].some((v) => v.toLowerCase().includes(q));
    });
  }, [entries, filter, query]);

  const today = visible.filter((e) => isToday(e.scannedAt, now));
  const past = visible.filter((e) => !isToday(e.scannedAt, now));
  const credited = entries.filter((e) => e.pointsState === "credited" && e.points > 0);

  return (
    <div className="px-4 pb-4 pt-5">
      <h1 className="text-[26px] font-bold leading-8 tracking-normal text-ink">Activity History</h1>
      <p className="mt-0.5 text-[13px] text-body">Review past scans and monitor reward ledger</p>

      <div role="tablist" aria-label="History sections" className="mt-4 flex gap-1 rounded-2xl bg-[#e3ebe5] p-1">
        {(
          [
            { id: "scans", label: "Product Scans", Icon: QrIcon },
            { id: "ledger", label: "Rewards Ledger", Icon: GiftIcon },
          ] as const
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
              tab === id ? "bg-white text-ink shadow-sm" : "text-body"
            }`}
          >
            <Icon className="size-[18px]" />
            {label}
            {id === "scans" && entries.length > 0 ? (
              <span
                className={`rounded-full px-2 text-xs ${tab === id ? "bg-[#dfe9f7] text-[#35507a]" : "bg-brand text-white"}`}
              >
                {entries.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "scans" ? (
        <div role="tabpanel">
          <label className="relative mt-4 block">
            <span className="sr-only">Search scans</span>
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Search product name, batch, or serial..."
              className="h-12 w-full rounded-2xl border border-transparent bg-white pl-11 pr-4 text-sm text-ink shadow-[0_1px_3px_rgba(15,31,23,0.06)] outline-none placeholder:text-muted focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
          </label>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
                  filter === f.id
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-white text-ink hover:bg-black/5"
                }`}
              >
                {f.dot && filter !== f.id ? <span className={`size-2 rounded-full ${f.dot}`} /> : null}
                {f.label}
              </button>
            ))}
          </div>

          {entries.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-white px-5 py-10 text-center shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
              <p className="text-[15px] font-semibold text-ink">No scans yet</p>
              <p className="mx-auto mt-1 max-w-[260px] text-[13px] leading-[1.5] text-body">
                Scan the code on a product and your results will appear here.
              </p>
              <Link
                href={site.links.scan}
                className="mt-4 inline-flex h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-white"
              >
                Scan a product
              </Link>
            </div>
          ) : visible.length === 0 ? (
            <p className="mt-8 text-center text-sm text-body">No scans match your search.</p>
          ) : (
            <>
              {today.length > 0 ? (
                <Group title="Today" aside={`${today.length} ${today.length === 1 ? "verification" : "verifications"}`}>
                  {today.map((e) => (
                    <ScanCard key={e.id} entry={e} now={now} />
                  ))}
                </Group>
              ) : null}
              {past.length > 0 ? (
                <Group title="Past Verifications">
                  {past.map((e) => (
                    <ScanCard key={e.id} entry={e} now={now} />
                  ))}
                </Group>
              ) : null}
            </>
          )}
        </div>
      ) : (
        <div role="tabpanel" className="mt-5">
          <section className="rounded-2xl bg-[#115a3c] p-5 text-white">
            <p className="flex items-center gap-2 text-[13px] text-white/85">
              <GiftIcon className="size-4" />
              Net Reward Balance
            </p>
            <p className="mt-1 text-[28px] font-bold leading-9">{points.toLocaleString("en-NG")} pts</p>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#e8eee9] p-4 text-ink">
              <div>
                <p className="text-xs font-semibold">Total points earned</p>
                <p className="mt-2 text-2xl font-bold">{points}</p>
              </div>
              <div>
                <p className="text-xs font-semibold">Total points redeemed</p>
                <p className="mt-2 text-2xl font-bold">0</p>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-2 text-[13px] text-white/90">
              <SparkleIcon className="size-4" />
              Keep earning points. Redemption is coming soon
            </p>
          </section>

          {credited.length === 0 ? (
            <p className="mt-8 text-center text-sm text-body">Points you earn from scans will be listed here.</p>
          ) : (
            <ul className="mt-6 space-y-3">
              {credited.map((e) => (
                <li
                  key={e.id}
                  className="flex gap-3 overflow-hidden rounded-2xl border-l-4 border-l-brand bg-white p-3.5 shadow-[0_1px_3px_rgba(15,31,23,0.07)]"
                >
                  <Thumb entry={e} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold leading-5 text-ink">{e.productName}</p>
                    <p className="mt-0.5 text-xs text-body">
                      {[e.manufacturer, e.reference].filter(Boolean).join(" • ")}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-body">
                      <ClockIcon className="size-3.5" />
                      {formatActivityTime(e.scannedAt, now)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-brand">
                    <p className="text-[13px] font-bold">+{e.points} PTS</p>
                    <p className="text-xs font-semibold">Credited</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
