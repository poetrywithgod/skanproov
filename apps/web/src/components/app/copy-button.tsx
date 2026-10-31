"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/icons";
import { CopyIcon } from "./app-icons";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked; nothing else to do.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-black/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
    >
      {copied ? <CheckIcon className="size-4 text-brand" /> : <CopyIcon className="size-4" />}
    </button>
  );
}
