import Link from "next/link";
import { setNotificationReadAction } from "@/app/manufacturer/(portal)/notifications/actions";
import { categoryLabel, type ManufacturerNotification, type NotificationCategory } from "@/lib/manufacturer/notification-shared";

const ICON_STYLE: Record<NotificationCategory, string> = {
  code_generation: "bg-retail-soft text-retail",
  batches: "bg-[#eaf3fb] text-[#1d6fb8]",
  account: "bg-[#f3f0fa] text-[#6a4bb5]",
};

function CategoryIcon({ category }: { category: NotificationCategory }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", className: "size-5", "aria-hidden": true } as const;
  if (category === "code_generation") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <path d="M14 14h2v2h-2zM18 18h2M14 20h2" />
      </svg>
    );
  }
  if (category === "batches") {
    return (
      <svg {...common}>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 13 9 5 9-5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M5 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16M14 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h2M8 12h2M8 16h2" />
    </svg>
  );
}

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Lagos" });
}

/** One notification: what happened, when, the thing it is about, and what to do next. */
export function NotificationItem({ item }: { item: ManufacturerNotification }) {
  return (
    <li className={`relative flex gap-4 px-6 py-5 ${item.read ? "bg-white" : "bg-[#f3f8f5]"}`}>
      {item.read ? null : <span aria-label="Unread" className="absolute left-2.5 top-8 size-1.5 rounded-full bg-retail" />}
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${ICON_STYLE[item.category]}`}>
        <CategoryIcon category={item.category} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-[15px] font-semibold text-ink">{item.title}</h3>
          <time dateTime={item.createdAt} className="shrink-0 text-[13px] text-muted">
            {timeOf(item.createdAt)}
          </time>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-body">{item.body}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[13px] text-muted">
            {categoryLabel(item.category)}
            {item.refLabel ? <span className="rounded-md border border-line bg-white px-2 py-0.5 font-mono text-xs text-body">{item.refLabel}</span> : null}
          </p>
          <div className="flex items-center gap-4">
            <form action={setNotificationReadAction}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="read" value={item.read ? "false" : "true"} />
              <button type="submit" className="text-[13px] text-muted hover:text-ink hover:underline">
                {item.read ? "Mark as unread" : "Mark as read"}
              </button>
            </form>
            {item.link ? (
              <Link href={item.link} className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3.5 text-sm font-medium text-ink transition hover:bg-surface-soft">
                {item.linkLabel ?? "Open"}
                <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
