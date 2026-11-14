import Link from "next/link";
import { getNotifications } from "@/lib/manufacturer/notifications";
import { getManufacturerContext } from "@/lib/manufacturer/portal";
import { site } from "@/lib/site";
import { BellIcon } from "./icons";
import { requireUser } from "@/lib/supabase/user";
import { UserMenu } from "./user-menu";

function initials(name: string | null, email: string): string {
  const parts = (name?.trim() || email).split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase();
}

/** "Manufacturer Portal" and the screen's name on the left, the person on the right. Every portal screen starts with it. */
export async function PortalTopBar({ title }: { title: string }) {
  const [user, manufacturer, notifications] = await Promise.all([requireUser(), getManufacturerContext(), getNotifications()]);
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <header className="flex h-20 items-center justify-between border-b border-line bg-white px-5 sm:px-8">
      <div>
        <p className="text-[13px] font-medium text-muted">Manufacturer Portal</p>
        <p className="text-xl font-semibold tracking-tight text-ink">{title}</p>
      </div>
      <div className="flex items-center gap-5">
        <Link
          href={site.manufacturer.notifications}
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          className="relative flex size-10 items-center justify-center rounded-full text-body transition hover:bg-surface-soft"
        >
          <BellIcon className="size-5" />
          {unread > 0 ? <span aria-hidden="true" className="absolute right-2.5 top-2.5 size-2 rounded-full bg-danger ring-2 ring-white" /> : null}
        </Link>
        <UserMenu
          name={user.fullName ?? user.email}
          initials={initials(user.fullName, user.email)}
          roleLabel={manufacturer?.role === "admin" ? "Administrator" : "Team member"}
          company={manufacturer?.name ?? ""}
        />
      </div>
    </header>
  );
}
