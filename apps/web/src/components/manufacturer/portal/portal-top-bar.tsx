import { getManufacturerContext } from "@/lib/manufacturer/portal";
import { requireUser } from "@/lib/supabase/user";
import { UserMenu } from "./user-menu";

function initials(name: string | null, email: string): string {
  const parts = (name?.trim() || email).split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase();
}

/** "Manufacturer Portal" and the screen's name on the left, the person on the right. Every portal screen starts with it. */
export async function PortalTopBar({ title }: { title: string }) {
  const [user, manufacturer] = await Promise.all([requireUser(), getManufacturerContext()]);
  return (
    <header className="flex h-20 items-center justify-between border-b border-line bg-white px-5 sm:px-8">
      <div>
        <p className="text-[13px] font-medium text-muted">Manufacturer Portal</p>
        <p className="text-xl font-semibold tracking-tight text-ink">{title}</p>
      </div>
      <UserMenu
        name={user.fullName ?? user.email}
        initials={initials(user.fullName, user.email)}
        roleLabel={manufacturer?.role === "admin" ? "Administrator" : "Team member"}
        company={manufacturer?.name ?? ""}
      />
    </header>
  );
}
