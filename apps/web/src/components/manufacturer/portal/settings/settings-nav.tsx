"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/lib/site";
import { AuditIcon, BatchesIcon, CodesIcon, ProductsIcon, SettingsIcon, TeamIcon } from "../icons";

const base = site.manufacturer.settings;

const TABS = [
  { slug: "company", label: "Company profile", icon: ProductsIcon },
  { slug: "contact", label: "Contact details", icon: TeamIcon },
  { slug: "security", label: "Security & MFA", icon: AuditIcon },
  { slug: "subscription", label: "Subscription & usage", icon: BatchesIcon },
  { slug: "billing", label: "Billing", icon: CodesIcon, needs: "billing" },
  { slug: "preferences", label: "Preferences", icon: SettingsIcon },
] as const;

function current(pathname: string) {
  return TABS.find((t) => pathname === `${base}/${t.slug}` || pathname.startsWith(`${base}/${t.slug}/`));
}

/** Overview > Settings > this tab. */
export function SettingsBreadcrumb() {
  const tab = current(usePathname());
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-body">
      <Link href={site.manufacturer.home} className="hover:underline">Overview</Link>
      <span aria-hidden="true" className="mx-2 text-muted">›</span>
      <Link href={base} className="hover:underline">Settings</Link>
      {tab ? (
        <>
          <span aria-hidden="true" className="mx-2 text-muted">›</span>
          <span className="text-retail">{tab.label}</span>
        </>
      ) : null}
    </nav>
  );
}

/** The list of Settings tabs. Billing shows only to people who may manage it. */
export function SettingsTabs({ showBilling }: { showBilling: boolean }) {
  const active = current(usePathname());
  return (
    <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {TABS.filter((t) => !("needs" in t) || showBilling).map(({ slug, label, icon: TabIcon }) => {
        const on = active?.slug === slug;
        return (
          <Link
            key={slug}
            href={`${base}/${slug}`}
            aria-current={on ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3.5 py-2.5 text-[15px] transition focus-visible:outline-2 focus-visible:outline-retail ${
              on ? "bg-white font-semibold text-ink shadow-[0_1px_3px_rgba(15,31,23,0.08)]" : "text-body hover:bg-white/60"
            }`}
          >
            <TabIcon className={`size-5 ${on ? "text-retail" : "text-muted"}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
