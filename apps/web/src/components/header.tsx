"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/lib/site";
import { ButtonLink } from "./button";
import { CloseIcon, MenuIcon, ScanIcon } from "./icons";
import { Logo } from "./logo";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-header">
      <div className="mx-auto flex h-[64.8px] max-w-6xl items-center px-6">
        <Logo />

        <nav aria-label="Primary" className="ml-auto hidden items-center gap-8 text-sm font-medium text-body md:flex">
          {site.nav.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </a>
          ))}
          <Link href={site.links.scan} className="ml-2.5 inline-flex items-center gap-2 text-brand">
            <ScanIcon className="size-4" />
            Scan a product
          </Link>
        </nav>

        <div className="ml-auto hidden md:ml-7 md:block">
          <ButtonLink href={site.links.login} variant="dark" size="sm">
            Log In/ Sign up
          </ButtonLink>
        </div>

        <button
          type="button"
          className="ml-auto rounded-md p-2 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="bg-header px-6 pb-5 pt-1 md:hidden">
          <ul className="flex flex-col gap-4 text-sm text-body">
            {site.nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <Link href={site.links.scan} className="inline-flex items-center gap-2 font-medium text-brand">
                <ScanIcon className="size-4" />
                Scan a product
              </Link>
            </li>
            <li>
              <ButtonLink href={site.links.login} variant="dark" size="sm">
                Log In/ Sign up
              </ButtonLink>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
