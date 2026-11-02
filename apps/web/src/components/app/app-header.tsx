import Link from "next/link";
import { Logo } from "@/components/logo";
import { site } from "@/lib/site";

function initials(name: string | null, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "?") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "");
  return letters.toUpperCase();
}

/**
 * Top bar of every customer screen. The SKANPROOV logo is always shown here:
 * never replace it with text or a placeholder icon.
 */
export function AppHeader({
  user,
  profileHref = site.links.profile,
  homeHref = site.links.home,
}: {
  user: { fullName: string | null; email: string } | null;
  profileHref?: string;
  homeHref?: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white/95 px-5 shadow-[0_1px_0_rgba(15,31,23,0.06)] backdrop-blur">
      <Logo href={user ? homeHref : "/"} className="h-9" />

      {user ? (
        <Link
          href={profileHref}
          aria-label="Your profile"
          className="grid size-10 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand-deep ring-2 ring-white outline-offset-2 hover:bg-[#d3eadd] focus-visible:outline-2 focus-visible:outline-brand"
        >
          {initials(user.fullName, user.email)}
        </Link>
      ) : (
        <Link
          href={site.links.login}
          className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-[13px] font-semibold text-white hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Sign in
        </Link>
      )}
    </header>
  );
}
