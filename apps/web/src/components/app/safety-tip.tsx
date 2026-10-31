"use client";

import { useEffect, useState } from "react";
import { CloseIcon } from "@/components/icons";
import { BulbIcon } from "./app-icons";

const STORAGE_KEY = "skanproov:tip-dismissed";

/** Dismissible safety tip. Remembers the dismissal on this device when storage is available. */
export function SafetyTip({ title, children }: { title: string; children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setHidden(true);
    } catch {
      // Storage can be blocked (private mode); the tip just shows again next time.
    }
  }, []);

  if (hidden) return null;

  return (
    <aside className="flex gap-3 rounded-2xl bg-[#e6eee8] p-4" aria-label="Safety tip">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#d5e6db] text-brand">
        <BulbIcon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold leading-5 text-ink">{title}</p>
        <p className="mt-0.5 text-[13px] leading-[1.45] text-body">{children}</p>
      </div>
      <button
        type="button"
        aria-label="Dismiss tip"
        onClick={() => {
          setHidden(true);
          try {
            localStorage.setItem(STORAGE_KEY, "1");
          } catch {
            // Ignore: dismissal just won't be remembered.
          }
        }}
        className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-body hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-brand"
      >
        <CloseIcon className="size-4" />
      </button>
    </aside>
  );
}
