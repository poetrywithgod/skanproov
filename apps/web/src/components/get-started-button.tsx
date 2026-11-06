"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ROLES } from "@/lib/roles";
import { ArrowIcon, CloseIcon } from "./icons";
import { RoleIcon } from "./role-icon";

/** The hero "Get Started" button. Opens a dialog to continue as a manufacturer, retailer or consumer. */
export function GetStartedButton() {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      // Keep Tab inside the dialog.
      const items = dialogRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (!items || items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="inline-flex h-12 items-center justify-center gap-[22px] rounded-xl border border-line bg-white px-8 text-sm font-semibold text-ink transition-colors hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Get Started
        <ArrowIcon className="size-4" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-night/60 p-4 sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-[440px] rounded-3xl bg-white p-6 shadow-[0_24px_64px_-12px_rgba(15,31,23,0.45)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="text-xl font-bold tracking-tight text-ink">
                  How will you use SKANPROOV?
                </h2>
                <p className="mt-1 text-sm leading-[1.5] text-body">Pick the one that fits you. You can sign in or create an account next.</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="-mr-2 -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-body hover:bg-tint focus-visible:outline-2 focus-visible:outline-brand"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>

            <ul className="mt-5 space-y-2.5">
              {ROLES.map((role) => (
                <li key={role.id}>
                  <Link
                    href={role.signUp}
                    className="flex items-center gap-3.5 rounded-2xl border border-line p-3.5 transition-colors hover:border-brand hover:bg-brand-soft/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <RoleIcon role={role.id} className="size-11" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-ink">Continue as {role.label.toLowerCase()}</span>
                      <span className="block text-xs leading-[1.4] text-muted">{role.blurb}</span>
                    </span>
                    <ArrowIcon className="size-4 shrink-0 text-brand" />
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-center text-sm text-body">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-brand hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
