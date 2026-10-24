"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/lib/site";
import { ButtonLink } from "./button";
import { MenuIcon, ScanIcon, CloseIcon } from "./icons";
import { Logo } from "./logo";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-7 text-sm text-muted md:flex">
          {site.nav.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </a>
          ))}
          <Link href={site.links.scan} className="inline-flex items-center gap-1.5 font-medium text-brand">
            <ScanIcon className="size-4" />
            Scan a product
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <ButtonLink href={site.links.login} variant="dark">
              Log in / Signup
            </ButtonLink>
          </div>
          <button
            type="button"
            className="rounded-md p-2 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-line bg-white px-5 py-4 md:hidden">
          <ul className="flex flex-col gap-4 text-sm">
            {site.nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <Link href={site.links.scan} className="inline-flex items-center gap-1.5 font-medium text-brand">
                <ScanIcon className="size-4" />
                Scan a product
              </Link>
            </li>
            <li>
              <ButtonLink href={site.links.login} variant="dark">
                Log in / Signup
              </ButtonLink>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
