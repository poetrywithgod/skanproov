"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { markNotificationsReadAction } from "@/app/retailer/actions";
import { AlertTriangleIcon, BellIcon, ChevronRightIcon } from "@/components/app/app-icons";
import { CheckIcon } from "@/components/icons";
import { formatScanTime } from "@/lib/retailer/format";
import type { Notification, NotificationKind } from "@/lib/retailer/notifications";

const TONE: Record<NotificationKind, string> = {
  suspicious: "bg-[#f6e7d2] text-[#8a4b05]",
  recalled: "bg-[#ecdcfb] text-[#6b2bb5]",
  expired: "bg-[#dfe5f2] text-[#3d4a63]",
  good: "bg-retail-soft text-retail-dark",
  warn: "bg-[#f6e7d2] text-[#8a4b05]",
  info: "bg-pill text-[#5b6660]",
};

function KindIcon({ kind }: { kind: NotificationKind }) {
  const Icon = kind === "good" ? CheckIcon : kind === "info" ? BellIcon : AlertTriangleIcon;
  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-full ${TONE[kind]}`}>
      <Icon className="size-5" />
    </span>
  );
}

function MarkAllRead({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="text-sm font-semibold text-retail hover:text-retail-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail disabled:text-[#8f9496]"
    >
      {pending ? "Marking…" : "Mark all read"}
    </button>
  );
}

function Item({ n, now }: { n: Notification; now: Date }) {
  const body = (
    <>
      <KindIcon kind={n.kind} />
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className={`text-[15px] leading-snug text-ink ${n.unread ? "font-bold" : "font-semibold"}`}>{n.title}</span>
          <span className="flex shrink-0 items-center gap-1.5 pt-0.5 text-xs text-muted">
            {n.unread ? <span role="img" aria-label="Unread" className="size-2 rounded-full bg-retail" /> : null}
            {formatScanTime(n.at, now)}
          </span>
        </span>
        <span className="mt-0.5 block break-words text-[13px] leading-[1.45] text-body">{n.body}</span>
      </span>
      {n.href ? <ChevronRightIcon className="mt-2 size-5 shrink-0 text-[#8f9496]" /> : null}
    </>
  );
  const cls = `flex items-start gap-3 rounded-2xl border p-3.5 ${n.unread ? "border-retail/25 bg-[#f4faf6]" : "border-line bg-white"}`;
  return n.href ? (
    <Link href={n.href} className={`${cls} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Needs attention and Updates, with Mark all read. */
export function NotificationsView({
  attention,
  updates,
  unread,
  now,
}: {
  attention: Notification[];
  updates: Notification[];
  unread: number;
  now: string;
}) {
  const [tab, setTab] = useState<"attention" | "updates">(attention.length > 0 ? "attention" : "updates");
  const nowDate = new Date(now);
  const list = tab === "attention" ? attention : updates;
  const tabs = [
    { key: "attention" as const, label: "Needs attention", count: attention.length },
    { key: "updates" as const, label: "Updates", count: updates.length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-normal text-ink">Notifications</h1>
        <form action={markNotificationsReadAction}>
          <MarkAllRead disabled={unread === 0} />
        </form>
      </div>

      <div role="tablist" aria-label="Notifications" className="flex rounded-2xl bg-track p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            aria-controls="notifications-panel"
            onClick={() => setTab(t.key)}
            className={`h-10 flex-1 rounded-xl text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-retail ${
              tab === t.key ? "bg-white text-ink shadow-[0_1px_3px_rgba(15,31,23,0.1)]" : "text-[#5b6660]"
            }`}
          >
            {t.label} <span className="font-medium text-[#8f9496]">{t.count}</span>
          </button>
        ))}
      </div>

      <div id="notifications-panel" role="tabpanel">
        {list.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white px-5 py-8 text-center">
            <p className="text-[15px] font-semibold text-ink">
              {tab === "attention" ? "Nothing needs your attention" : "No updates yet"}
            </p>
            <p className="mx-auto mt-1 max-w-[280px] text-[13px] leading-[1.5] text-body">
              {tab === "attention"
                ? "Suspicious, recalled and expired cartons will show here."
                : "Approvals and decisions on your shop will show here."}
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {list.map((n) => (
              <li key={n.id}>
                <Item n={n} now={nowDate} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
