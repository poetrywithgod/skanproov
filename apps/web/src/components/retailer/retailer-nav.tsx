"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { HistoryIcon, HomeIcon, UserCircleIcon } from "@/components/app/app-icons";
import { ScanIcon } from "@/components/icons";
import { site } from "@/lib/site";
import { FactoryIcon } from "./icons";

type Tab = { label: string; href: string; Icon: ComponentType<SVGProps<SVGSVGElement>>; exact?: boolean };

const LEFT: Tab[] = [
  { label: "Home", href: site.retailer.home, Icon: HomeIcon, exact: true },
  { label: "Manufacturer", href: site.retailer.manufacturers, Icon: FactoryIcon },
];
const RIGHT: Tab[] = [
  { label: "History", href: site.retailer.history, Icon: HistoryIcon },
  { label: "Profile", href: site.retailer.profile, Icon: UserCircleIcon },
];

function TabLink({ tab, pathname }: { tab: Tab; pathname: string }) {
  const active = tab.exact ? pathname === tab.href : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
        active ? "text-retail" : "text-[#5b6660] hover:text-ink"
      }`}
    >
      <tab.Icon className="size-[22px]" />
      {tab.label}
    </Link>
  );
}

/** Tab bar for the retailer app. The raised centre button scans a carton. */
export function RetailerNav() {
  const pathname = usePathname();
  const scanning = pathname === site.retailer.scan;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] rounded-t-2xl border-t border-line bg-white px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-4px_16px_rgba(15,31,23,0.06)]"
    >
      <div className="flex items-end">
        {LEFT.map((tab) => (
          <TabLink key={tab.href} tab={tab} pathname={pathname} />
        ))}
        <div className="flex flex-1 justify-center">
          <Link
            href={site.retailer.scan}
            aria-label="Scan a carton"
            aria-current={scanning ? "page" : undefined}
            className="-mt-7 grid size-[60px] place-items-center rounded-full bg-retail text-white shadow-[0_6px_16px_rgba(14,107,79,0.4)] ring-[5px] ring-white transition-colors hover:bg-retail-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail"
          >
            <ScanIcon className="size-7" strokeWidth={2.2} />
          </Link>
        </div>
        {RIGHT.map((tab) => (
          <TabLink key={tab.href} tab={tab} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
}
