"use client";

import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/app/(customer)/profile/actions";
import { ChevronIcon, SignOutIcon } from "./icons";

/** The person's name and role at the right of the top bar, with a menu to sign out. */
export function UserMenu({ name, initials, roleLabel, company }: { name: string; initials: string; roleLabel: string; company: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-3 rounded-lg p-1.5 text-left hover:bg-pill focus-visible:outline-2 focus-visible:outline-retail"
      >
        <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-retail-soft text-sm font-bold text-retail-dark">
          {initials}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[160px] truncate text-sm font-semibold text-ink">{name}</span>
          <span className="block text-xs text-muted">{roleLabel}</span>
        </span>
        <ChevronIcon className="size-4 text-muted" direction="down" />
      </button>

      {open ? (
        <div role="menu" className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-line bg-white p-1.5 shadow-[0_8px_24px_rgba(15,31,23,0.12)]">
          <div className="border-b border-row-line px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="truncate text-xs text-muted">{company}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-pill focus-visible:outline-2 focus-visible:outline-retail"
            >
              <SignOutIcon className="size-4" />
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
