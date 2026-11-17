"use client";

import { useState } from "react";

/** A link in a read-only box with a Copy button. */
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setFailed(false);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          aria-label="Invitation link"
          onFocus={(e) => e.currentTarget.select()}
          className="h-11 min-w-0 flex-1 rounded-lg border border-field-border bg-surface-soft px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-retail"
        />
        <button
          type="button"
          onClick={copy}
          className="h-11 shrink-0 rounded-lg border border-field-border bg-white px-4 text-sm font-semibold text-ink hover:bg-pill focus-visible:outline-2 focus-visible:outline-retail"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <p role="status" className="mt-1.5 min-h-4 text-xs text-muted">
        {failed ? "Couldn't copy automatically. Select the link and copy it." : ""}
      </p>
    </div>
  );
}
