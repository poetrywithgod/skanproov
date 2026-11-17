"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Logo } from "@/components/logo";
import { site } from "@/lib/site";
import { BatchesIcon, BellIcon, ChevronIcon, CloseIcon, CodesIcon, MenuIcon, OverviewIcon, ProductsIcon, TeamIcon, AuditIcon } from "./icons";

type NavItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Missing while the screen has not been built yet; the item then shows as "Soon". */
  href?: string;
  /** Shown only to people whose role allows it. */
  needs?: "team" | "codes" | "audit";
};

/**
 * The sidebar, in the order of the design. An item without a link is not built yet and shows as
 * "Soon" (see docs/DEFERRED.md); Code Management and Team Management only show for roles that may
 * use them.
 */
const NAV: readonly NavItem[] = [
  { label: "Overview", icon: OverviewIcon, href: site.manufacturer.home },
  { label: "Products", icon: ProductsIcon, href: site.manufacturer.products },
  { label: "Batches", icon: BatchesIcon, href: site.manufacturer.batches },
  { label: "Code Management", icon: CodesIcon, href: site.manufacturer.codes, needs: "codes" },
  { label: "Notification", icon: BellIcon, href: site.manufacturer.notifications },
  { label: "Team Management", icon: TeamIcon, href: site.manufacturer.team, needs: "team" },
  { label: "Audit Logs", icon: AuditIcon, href: site.manufacturer.audit, needs: "audit" },
];

/**
 * Frame of the manufacturer portal: green sidebar and a content area. The SKANPROOV logo is always
 * shown, on a white plate so the black "SKAN" stays readable on the green. Never replace it with
 * text or a placeholder icon.
 */
export function PortalShell({ children, showTeam, showCodes, showAudit = false }: { children: ReactNode; showTeam: boolean; showCodes: boolean; showAudit?: boolean }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);

  // Close the phone drawer after moving to another screen.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const narrow = collapsed ? "lg:w-20" : "lg:w-72";

  return (
    <div className="min-h-dvh bg-surface-soft">
      {/* Phone bar */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
        <Logo href={site.manufacturer.home} className="h-9" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid size-10 place-items-center rounded-lg text-ink hover:bg-pill focus-visible:outline-2 focus-visible:outline-retail"
        >
          <MenuIcon />
        </button>
      </div>

      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-night/50 lg:hidden"
        />
      ) : null}

      <aside
        aria-label="Manufacturer portal"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-retail text-white transition-[transform,width] duration-200 lg:translate-x-0 ${narrow} ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className={`mx-4 mt-5 flex items-center justify-between rounded-xl bg-white p-2.5 ${collapsed ? "lg:mx-2 lg:justify-center" : ""}`}>
          {collapsed ? (
            <Link href={site.manufacturer.home} aria-label="SKANPROOV home" className="hidden lg:block">
              <Image src="/brand/mark.png" alt="SKANPROOV" width={40} height={40} className="size-10" />
            </Link>
          ) : null}
          <div className={collapsed ? "lg:hidden" : ""}>
            <Logo href={site.manufacturer.home} className="h-11" />
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="grid size-9 place-items-center rounded-lg text-ink hover:bg-pill lg:hidden"
          >
            <CloseIcon />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          className="absolute -right-3 top-24 hidden size-6 place-items-center rounded-full border border-line bg-white text-ink shadow-sm hover:bg-pill focus-visible:outline-2 focus-visible:outline-white lg:grid"
        >
          <ChevronIcon className="size-3.5" direction={collapsed ? "right" : "left"} />
        </button>

        <nav aria-label="Main" className="mt-8 flex-1 space-y-1.5 px-4">
          {NAV.filter((item) => (item.needs === "team" ? showTeam : item.needs === "codes" ? showCodes : item.needs === "audit" ? showAudit : true)).map(({ label, icon: ItemIcon, href }) => {
            const active = href ? pathname === href || (href !== site.manufacturer.home && pathname.startsWith(`${href}/`)) : false;
            const base = `flex h-12 items-center gap-3 whitespace-nowrap rounded-xl px-4 text-[15px] ${collapsed ? "lg:justify-center lg:px-0" : ""}`;
            const labelClass = collapsed ? "lg:sr-only" : "";
            if (!href) {
              return (
                <div key={label} aria-disabled="true" title={`${label} is coming soon`} className={`${base} cursor-not-allowed text-white/45`}>
                  <ItemIcon className="size-5 shrink-0" />
                  <span className={labelClass}>{label}</span>
                  <span
                    className={`ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/70 ${collapsed ? "lg:hidden" : ""}`}
                  >
                    Soon
                  </span>
                </div>
              );
            }
            return (
              <Link
                key={label}
                href={href}
                aria-current={active ? "page" : undefined}
                title={collapsed ? label : undefined}
                className={`${base} transition focus-visible:outline-2 focus-visible:outline-white ${
                  active ? "bg-[#e6f4ec] font-semibold text-retail-dark" : "text-white/90 hover:bg-white/10"
                }`}
              >
                <ItemIcon className="size-5 shrink-0" />
                <span className={labelClass}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* DEFERRED(D04): the plan and usage card. Shown as a reminder until plans and billing exist. */}
        <div className={`mx-4 mb-5 rounded-xl border border-dashed border-white/25 bg-white/5 px-4 py-3 text-white/80 ${collapsed ? "lg:hidden" : ""}`}>
          <p className="text-[13px] font-medium text-white">Plan &amp; usage</p>
          <p className="mt-0.5 text-xs leading-relaxed text-white/65">Not connected yet. Appears when plans and billing are set up.</p>
        </div>
      </aside>

      <div className={`transition-[padding] duration-200 ${collapsed ? "lg:pl-20" : "lg:pl-72"}`}>{children}</div>
    </div>
  );
}
