"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ROLES } from "@/lib/roles";
import { RoleIcon } from "./role-icon";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/**
 * "Log In/ Sign up" in the header. Opens on hover, and on click or keyboard for touch screens
 * and people who do not use a mouse. Each role has its own Sign in and Sign up.
 */
export function RoleMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        rootRef.current?.querySelector("button")?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-ink px-[22px] text-sm font-semibold text-white transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Log In/ Sign up
        <Chevron open={open} />
      </button>

      {/* The top padding keeps the panel under the pointer while it travels down from the button. */}
      <div
        id={panelId}
        hidden={!open}
        className="absolute right-0 top-full z-50 w-[360px] pt-2"
      >
        <div className="rounded-2xl border border-line bg-white p-2 shadow-[0_24px_48px_-12px_rgba(15,31,23,0.25)]">
          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">I am a…</p>
          <ul>
            {ROLES.map((role) => (
              <li key={role.id} className="flex items-center gap-3 rounded-xl p-3 hover:bg-tint/60">
                <RoleIcon role={role.id} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-ink">{role.label}</p>
                  <p className="text-xs leading-[1.4] text-muted">{role.blurb}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5 text-center text-[13px] font-semibold">
                  <Link
                    href={role.signIn}
                    className="rounded-lg border border-line px-3 py-1 text-ink hover:bg-white focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    Sign in
                  </Link>
                  <Link
                    href={role.signUp}
                    className="rounded-lg bg-brand px-3 py-1 text-white hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    Sign up
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
