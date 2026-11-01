// Safe to import from client components (no server-only code).

const TIME_ZONE = "Africa/Lagos";
const DAY = 24 * 3_600_000;

function dayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);
}

export function isToday(iso: string, now: Date = new Date()): boolean {
  return dayKey(new Date(iso)) === dayKey(now);
}

/** "Today, 11:20 AM", "Yesterday, 4:15 PM", "May 18, 2:10 PM". */
export function formatActivityTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat("en-NG", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .replace(/ /g, " ")
    .toUpperCase();
  if (dayKey(date) === dayKey(now)) return `Today, ${time}`;
  if (dayKey(date) === dayKey(new Date(now.getTime() - DAY))) return `Yesterday, ${time}`;
  const day = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, month: "short", day: "numeric" }).format(date);
  return `${day}, ${time}`;
}
