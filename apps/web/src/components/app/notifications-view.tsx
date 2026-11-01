import Link from "next/link";
import {
  formatActivityTime,
  isToday,
  type NotificationItem,
  type NotificationKind,
} from "@/lib/customer/activity-data";
import { site } from "@/lib/site";

const KIND: Record<NotificationKind, { border: string; title: string }> = {
  verified: { border: "border-l-brand", title: "text-ink" },
  unverified: { border: "border-l-[#e08a14]", title: "text-[#e08a14]" },
  recalled: { border: "border-l-[#8b3fe0]", title: "text-[#8b3fe0]" },
  expired: { border: "border-l-[#5b6577]", title: "text-ink" },
};

function Item({ item, now }: { item: NotificationItem; now: Date }) {
  const kind = KIND[item.kind];
  return (
    <li>
      <Link
        href={`${site.links.verify}/${encodeURIComponent(item.code)}`}
        className={`block rounded-2xl border-l-4 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,31,23,0.07)] focus-visible:outline-2 focus-visible:outline-brand ${kind.border}`}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className={`text-[15px] font-semibold leading-5 ${kind.title}`}>{item.title}</h3>
          <time dateTime={item.scannedAt} className="shrink-0 text-xs text-body">
            {formatActivityTime(item.scannedAt, now)}
          </time>
        </div>
        <p className="mt-1 text-xs leading-[1.45] text-body">{item.body}</p>
        <p className="mt-1 text-xs font-medium text-[#1a56c4]">Tap to view product details.</p>
      </Link>
    </li>
  );
}

export function NotificationsView({ items, now = new Date() }: { items: NotificationItem[]; now?: Date }) {
  const today = items.filter((i) => isToday(i.scannedAt, now));
  const older = items.filter((i) => !isToday(i.scannedAt, now));

  return (
    <div className="px-4 pb-4 pt-5">
      <h1 className="flex items-center gap-2 text-[26px] font-bold leading-8 tracking-normal text-ink">
        Notifications
        {items.length > 0 ? (
          <span className="rounded-full bg-[#e3ebe5] px-2 text-xs font-semibold text-body">{items.length}</span>
        ) : null}
      </h1>
      <p className="mt-0.5 text-[13px] text-body">View your past scans and track your reward points.</p>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white px-5 py-10 text-center shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
          <p className="text-[15px] font-semibold text-ink">No notifications yet</p>
          <p className="mx-auto mt-1 max-w-[260px] text-[13px] leading-[1.5] text-body">
            Alerts about your scans, recalls and expiry dates will appear here.
          </p>
        </div>
      ) : (
        <>
          {today.length > 0 ? (
            <section className="mt-6">
              <h2 className="mb-2 text-[15px] text-ink">Today</h2>
              <ul className="space-y-3">
                {today.map((i) => (
                  <Item key={i.id} item={i} now={now} />
                ))}
              </ul>
            </section>
          ) : null}
          {older.length > 0 ? (
            <section className="mt-6">
              <h2 className="mb-2 text-[15px] text-ink">Older Messages</h2>
              <ul className="space-y-3">
                {older.map((i) => (
                  <Item key={i.id} item={i} now={now} />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
