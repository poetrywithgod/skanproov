import type { Metadata } from "next";
import Link from "next/link";
import { ChevronIcon } from "@/components/manufacturer/portal/icons";
import { NotificationItem } from "@/components/manufacturer/portal/notifications/notification-item";
import { PortalTopBar } from "@/components/manufacturer/portal/portal-top-bar";
import {
  getNotifications,
  NOTIFICATION_CATEGORIES,
  type ManufacturerNotification,
  type NotificationCategory,
} from "@/lib/manufacturer/notifications";
import { site } from "@/lib/site";
import { markAllNotificationsReadAction } from "./actions";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

const TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "read", label: "Read" },
] as const;
type Tab = (typeof TABS)[number]["key"];

function lagosDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
}

function dayLabel(day: string, today: string, yesterday: string): string {
  if (day === today) return "Today";
  if (day === yesterday) return "Yesterday";
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });
}

function href(cat: string | undefined, tab: Tab): string {
  const params = new URLSearchParams();
  if (cat) params.set("cat", cat);
  if (tab !== "all") params.set("tab", tab);
  const query = params.toString();
  return query ? `${site.manufacturer.notifications}?${query}` : site.manufacturer.notifications;
}

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ cat?: string; tab?: string }> }) {
  const params = await searchParams;
  const cat = NOTIFICATION_CATEGORIES.find((c) => c.key === params.cat)?.key as NotificationCategory | undefined;
  const tab: Tab = TABS.find((t) => t.key === params.tab)?.key ?? "all";

  const all = await getNotifications();
  const unreadTotal = all.filter((n) => !n.read).length;
  const unreadIn = (key: NotificationCategory) => all.filter((n) => n.category === key && !n.read).length;

  const shown = all.filter((n) => (!cat || n.category === cat) && (tab === "all" || (tab === "unread" ? !n.read : n.read)));
  const now = Date.now();
  const today = lagosDay(new Date(now).toISOString());
  const yesterday = lagosDay(new Date(now - 24 * 60 * 60 * 1000).toISOString());
  const groups: { day: string; items: ManufacturerNotification[] }[] = [];
  for (const item of shown) {
    const day = lagosDay(item.createdAt);
    const last = groups.at(-1);
    if (last && last.day === day) last.items.push(item);
    else groups.push({ day, items: [item] });
  }

  return (
    <>
      <PortalTopBar title="Notification" />
      <main className="px-5 py-6 sm:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted">
          <span>Overview</span>
          <ChevronIcon className="size-3.5 rotate-180" />
          <span aria-current="page" className="font-medium text-retail">Notifications</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-ink">Notifications</h1>
            <p className="mt-2 text-[15px] text-body">
              {unreadTotal === 0 ? "You're all caught up." : `${unreadTotal} unread.`} Batch, code generation and account updates in one place.
            </p>
          </div>
          {unreadTotal > 0 ? (
            <form action={markAllNotificationsReadAction}>
              <button type="submit" className="inline-flex h-12 items-center gap-2 rounded-xl border border-line bg-white px-5 text-[15px] font-medium text-ink transition hover:bg-surface-soft">
                <span aria-hidden="true">✓✓</span>
                Mark all as read
              </button>
            </form>
          ) : null}
        </div>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[232px_minmax(0,1fr)]">
          <nav aria-label="Notification categories" className="flex gap-1 overflow-x-auto lg:flex-col">
            {[{ key: undefined, label: "All notifications", count: unreadTotal }, ...NOTIFICATION_CATEGORIES.map((c) => ({ key: c.key as string | undefined, label: c.label, count: unreadIn(c.key) }))].map((entry) => {
              const active = entry.key === cat;
              return (
                <Link
                  key={entry.label}
                  href={href(entry.key, tab)}
                  aria-current={active ? "page" : undefined}
                  className={`flex shrink-0 items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-[15px] ${active ? "bg-white font-semibold text-ink shadow-sm" : "text-body hover:bg-white/70"}`}
                >
                  {entry.label}
                  {entry.count > 0 ? <span className="flex size-5 items-center justify-center rounded-full bg-retail text-[11px] font-semibold text-white">{entry.count}</span> : null}
                </Link>
              );
            })}
          </nav>

          <section className="overflow-hidden rounded-xl border border-line bg-white" aria-label="Notifications">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <div role="tablist" aria-label="Filter by read state" className="flex rounded-lg bg-surface-soft p-1">
                {TABS.map((t) => (
                  <Link
                    key={t.key}
                    href={href(cat, t.key)}
                    role="tab"
                    aria-selected={tab === t.key}
                    className={`rounded-md px-4 py-1.5 text-sm ${tab === t.key ? "bg-white font-semibold text-ink shadow-sm" : "text-body hover:text-ink"}`}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
              <p className="text-[13px] text-muted">{shown.length} shown</p>
            </div>

            {groups.length === 0 ? (
              <div className="border-t border-row-line px-6 py-14 text-center" role="status">
                <p className="text-base font-semibold text-ink">{all.length === 0 ? "No notifications yet" : "Nothing here"}</p>
                <p className="mt-1 text-sm text-muted">
                  {all.length === 0 ? "Updates about your batches, codes and account will appear here." : "No notifications match this filter."}
                </p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.day}>
                  <h2 className="border-y border-row-line bg-[#f7f8f7] px-6 py-2.5 text-[13px] font-medium text-body">{dayLabel(group.day, today, yesterday)}</h2>
                  <ul className="divide-y divide-row-line">
                    {group.items.map((item) => (
                      <NotificationItem key={item.id} item={item} />
                    ))}
                  </ul>
                </div>
              ))
            )}
          </section>
        </div>
      </main>
    </>
  );
}
