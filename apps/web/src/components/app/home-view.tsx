import Link from "next/link";
import { CheckIcon, QrIcon } from "@/components/icons";
import { formatActivityTime } from "@/lib/customer/activity-format";
import type { HistoryEntry } from "@/lib/customer/activity-data";
import type { HomeData } from "@/lib/customer/home-data";
import { site } from "@/lib/site";
import {
  AlertTriangleIcon,
  BellIcon,
  CalendarIcon,
  ChevronRightIcon,
  GiftIcon,
  InfoIcon,
  KeypadIcon,
  VerifiedBadge,
} from "./app-icons";
import { SafetyTip } from "./safety-tip";

interface HomeViewProps {
  firstName: string | null;
  /** Show the verified seal next to the name (e-mail confirmed). */
  verified: boolean;
  data: HomeData;
  now?: Date;
}

/** Four corner brackets around a glowing scan glyph, as in the design. */
function ScanGlyph() {
  const corner = "absolute size-9 border-[#69c79a]/60";
  return (
    <div className="relative mx-auto size-[132px]" aria-hidden="true">
      <span className={`${corner} left-0 top-0 rounded-tl-lg border-l-2 border-t-2`} />
      <span className={`${corner} right-0 top-0 rounded-tr-lg border-r-2 border-t-2`} />
      <span className={`${corner} bottom-0 left-0 rounded-bl-lg border-b-2 border-l-2`} />
      <span className={`${corner} bottom-0 right-0 rounded-br-lg border-b-2 border-r-2`} />
      <span className="absolute inset-x-[-30px] top-1/2 h-px bg-gradient-to-r from-transparent via-[#7ddcaa]/50 to-transparent" />
      <span className="absolute left-1/2 top-1/2 grid size-[76px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#1a7a56]/55 shadow-[0_0_40px_rgba(125,220,170,0.35)] ring-1 ring-[#7ddcaa]/25">
        <span className="grid size-[54px] place-items-center rounded-full bg-[#0f6a49] text-[#a6efc8]">
          <QrIcon className="size-7" strokeWidth={1.8} />
        </span>
      </span>
    </div>
  );
}

function ScanRow({ scan, now }: { scan: HistoryEntry; now: Date }) {
  const bad = scan.status !== "authentic";
  return (
    <li
      className={`flex items-center gap-3 rounded-2xl p-3 shadow-[0_1px_3px_rgba(15,31,23,0.06)] ${
        bad ? "bg-danger-soft" : "bg-white"
      }`}
    >
      <span
        aria-hidden="true"
        className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#eef1ee] text-lg font-bold text-muted"
      >
        {scan.productName.slice(0, 1)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold leading-5 text-ink">{scan.productName}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          {scan.status === "authentic" ? (
            <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-brand px-2 text-xs font-semibold text-white">
              <CheckIcon className="size-3" strokeWidth={3} />
              Authentic
            </span>
          ) : (
            <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-danger px-2 text-xs font-semibold text-white">
              <AlertTriangleIcon className="size-3" strokeWidth={2.6} />
              {{ duplicate: "Duplicate Code", not_verified: "Not verified", recalled: "Recalled", expired: "Expired" }[scan.status as "duplicate" | "not_verified" | "recalled" | "expired"]}
            </span>
          )}
          <span className={`text-xs ${bad ? "text-danger" : "text-muted"}`}>{formatActivityTime(scan.scannedAt, now)}</span>
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className={`text-[15px] font-bold leading-5 ${bad ? "text-danger" : "text-ink"}`}>
          {scan.points > 0 ? `+${scan.points}` : scan.points} pts
        </p>
        <p className={`text-xs ${bad ? "text-danger" : "text-muted"}`}>
          {scan.pointsState === "credited" ? "Credited" : "—"}
        </p>
      </div>
    </li>
  );
}

export function HomeView({ firstName, verified, data, now = new Date() }: HomeViewProps) {
  return (
    <div className="space-y-6 px-5 pb-4 pt-5">
      <section className="flex items-start justify-between gap-3" aria-label="Greeting">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold leading-8 tracking-normal text-ink">
            <span className="truncate">{firstName ? `Hello, ${firstName}` : "Hello"}</span>
            {verified ? <VerifiedBadge className="size-5 shrink-0 text-brand" aria-label="Verified account" /> : null}
          </h1>
          <p className="mt-0.5 text-[13px] leading-5 text-body">Protecting your daily essentials</p>
        </div>
        <Link
          href={site.links.notifications}
          aria-label={
            data.unreadNotifications > 0 ? `Notifications, ${data.unreadNotifications} unread` : "Notifications"
          }
          className="relative grid size-11 shrink-0 place-items-center rounded-full bg-[#e6eee8] text-ink hover:bg-[#dbe7df] focus-visible:outline-2 focus-visible:outline-brand"
        >
          <BellIcon className="size-5" />
          {data.unreadNotifications > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 grid size-[18px] place-items-center rounded-full bg-danger text-[10px] font-bold text-white ring-2 ring-surface-soft">
              {data.unreadNotifications > 9 ? "9+" : data.unreadNotifications}
            </span>
          ) : null}
        </Link>
      </section>

      <section
        aria-label="Verify a product"
        className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#10543b] via-[#0d6a49] to-[#0b5a3f] px-6 pb-6 pt-8 text-center text-white shadow-[0_8px_24px_rgba(11,90,63,0.25)]"
      >
        <ScanGlyph />
        <h2 className="mt-6 text-[26px] font-bold leading-8 tracking-normal">Verify Product Authenticity</h2>
        <p className="mx-auto mt-3 max-w-[290px] text-[15px] leading-[1.5] text-white/85">
          Instant proof before you buy. Validates official seals &amp; serial codes in real-time.
        </p>
        <Link
          href={site.links.scan}
          className="mt-6 flex h-[52px] items-center justify-center gap-2.5 rounded-xl bg-[#0d8a58] text-[15px] font-bold text-white shadow-[0_6px_14px_rgba(0,0,0,0.2)] transition-colors hover:bg-[#0b7a4d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <QrIcon className="size-5" />
          Scan Product Code
        </Link>
        <Link
          href={`${site.links.scan}?manual=1`}
          className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium text-white/85 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          or enter 12-digit code manually
          <KeypadIcon className="size-4" />
        </Link>
      </section>

      <section aria-labelledby="rewards-heading" className="rounded-2xl bg-white p-5 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-[#e6eee8] text-body">
            <GiftIcon className="size-[18px]" />
          </span>
          <h2 id="rewards-heading" className="text-lg font-semibold tracking-normal text-ink">
            Your Rewards Points
          </h2>
        </div>
        <p className="mt-5 flex items-baseline gap-2">
          <span className="text-4xl font-bold leading-none text-ink">{data.points.toLocaleString("en-NG")}</span>
          <span className="text-sm font-semibold text-brand">Eligible Points</span>
        </p>
        <p className="mt-4 text-[13px] leading-[1.5] text-body">
          Earn points as you scan eligible products. More ways to use your points are coming soon.
        </p>
        <p className="mt-3 flex gap-2 text-[13px] leading-[1.45] text-body">
          <InfoIcon className="mt-0.5 size-4 shrink-0 text-brand" />
          Points credited automatically on verified authentic items with partner manufacturers.
        </p>
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-[#e6eee8] px-3 py-2.5 text-xs font-bold leading-[1.45] text-body">
          <CalendarIcon className="mt-0.5 size-4 shrink-0" />
          Coming Soon : Exchange points for utility rewards like mobile data &amp; electricity.
        </p>
      </section>

      <SafetyTip title="Consumer Safety Pro Tip">
        Always inspect the tamper-evident holographic sticker before scanning. Intact seal patterns ensure zero reuse.
      </SafetyTip>

      <section aria-labelledby="recent-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-heading" className="text-xl font-semibold tracking-normal text-ink">
            Recent Scans
          </h2>
          {data.recentScans.length > 0 ? (
            <Link
              href={site.links.history}
              className="inline-flex items-center gap-0.5 text-[13px] font-bold text-brand hover:text-brand-deep"
            >
              View all history
              <ChevronRightIcon className="size-4" strokeWidth={2.4} />
            </Link>
          ) : null}
        </div>

        {data.recentScans.length > 0 ? (
          <ul className="space-y-3">
            {data.recentScans.map((scan) => (
              <ScanRow key={scan.id} scan={scan} now={now} />
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl bg-white px-5 py-8 text-center shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
            <p className="text-[15px] font-semibold text-ink">No scans yet</p>
            <p className="mx-auto mt-1 max-w-[260px] text-[13px] leading-[1.5] text-body">
              Scan the code on a product and your results will appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
