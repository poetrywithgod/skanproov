"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { releaseBatchAction } from "@/app/manufacturer/(portal)/batches/actions";

/** Releases a batch at dispatch. Asks first, because shoppers can verify its codes from then on. */
export function ReleaseButton({ batchId, batchNumber, disabledReason }: { batchId: string; batchNumber: string; disabledReason?: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function release() {
    setPending(true);
    setError(null);
    try {
      const result = await releaseBatchAction(batchId);
      if (result.ok) {
        setConfirming(false);
        router.refresh();
      } else {
        setError(result.message);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (disabledReason) {
    return (
      <div>
        <button type="button" disabled className="h-11 cursor-not-allowed rounded-xl bg-retail/40 px-5 text-[15px] font-semibold text-white">
          Release batch
        </button>
        <p className="mt-2 text-[13px] text-muted">{disabledReason}</p>
      </div>
    );
  }

  return (
    <div>
      {confirming ? (
        <div role="alertdialog" aria-label={`Release batch ${batchNumber}`} className="max-w-md rounded-xl border border-line bg-white p-4">
          <p className="text-[15px] font-semibold text-ink">Release batch {batchNumber}?</p>
          <p className="mt-1 text-sm text-body">From now on, shoppers and retailers can verify this batch&apos;s codes. Only release it when the products are dispatched.</p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={release}
              disabled={pending}
              className="h-11 rounded-xl bg-retail px-5 text-[15px] font-semibold text-white transition hover:bg-retail-dark disabled:opacity-70"
            >
              {pending ? "Releasing…" : "Yes, release"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={pending} className="text-sm font-semibold text-body hover:underline">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="h-11 rounded-xl bg-retail px-5 text-[15px] font-semibold text-white transition hover:bg-retail-dark"
        >
          Release batch
        </button>
      )}
      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
