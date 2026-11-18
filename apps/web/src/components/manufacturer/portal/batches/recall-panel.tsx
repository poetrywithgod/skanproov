"use client";

import {
  BATCH_MESSAGE_MAX,
  BATCH_MESSAGE_MIN,
  BATCH_NOTE_MAX,
  RECALL_REASONS,
  REVOKE_REASONS,
  recallBatchSchema,
  revokeBatchSchema,
} from "@skanproov/validation";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { liftRecallAction, recallBatchAction, revokeBatchAction } from "@/app/manufacturer/(portal)/batches/actions";

type Mode = "recall" | "revoke";
type Errors = Partial<Record<"reason" | "message" | "note" | "confirm", string>>;

const field =
  "mt-2 w-full rounded-xl border border-field-border bg-white px-4 text-[15px] text-ink placeholder:text-field-placeholder focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-retail";

const COPY = {
  recall: {
    title: "Recall batch",
    intro: "Shoppers and retailers who scan this batch's codes will be told it has been recalled. You can lift a recall later if it was a mistake.",
    confirm: "Recall batch",
    working: "Recalling…",
    reasons: RECALL_REASONS,
  },
  revoke: {
    title: "Revoke batch",
    intro: "Revoking is final. The batch's codes stop verifying for good, and it can't be reinstated. Use it when the codes can no longer be trusted or the run was cancelled.",
    confirm: "Revoke batch",
    working: "Revoking…",
    reasons: REVOKE_REASONS,
  },
} as const;

/** Recall, revoke and lift-recall controls for one batch. Only shown to people allowed to use them. */
export function RecallPanel({
  batchId,
  batchNumber,
  status,
  released,
}: {
  batchId: string;
  batchNumber: string;
  status: "active" | "recalled" | "revoked";
  released: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [lifting, setLifting] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const firstRef = useRef<HTMLSelectElement>(null);

  function open(next: Mode) {
    setMode(next);
    setLifting(false);
    setErrors({});
    setFormError(null);
    setMessage("");
  }
  function close() {
    setMode(null);
    setErrors({});
    setFormError(null);
  }

  useEffect(() => {
    if (!mode) return;
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mode]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mode) return;
    const data = new FormData(event.currentTarget);
    const input = { batchId, reason: data.get("reason") ?? "", message: data.get("message") ?? "", note: data.get("note") ?? "" };
    const parsed = (mode === "recall" ? recallBatchSchema : revokeBatchSchema).safeParse(input);
    const next: Errors = {};
    if (!parsed.success) {
      const f = z.flattenError(parsed.error).fieldErrors as Record<string, string[] | undefined>;
      if (f.reason?.[0]) next.reason = f.reason[0];
      if (f.message?.[0]) next.message = f.message[0];
      if (f.note?.[0]) next.note = f.note[0];
    }
    if (mode === "revoke" && String(data.get("confirm") ?? "").trim() !== batchNumber) {
      next.confirm = `Type ${batchNumber} to confirm`;
    }
    if (Object.keys(next).length > 0) return setErrors(next);
    setErrors({});
    setFormError(null);
    setPending(true);
    try {
      const result = await (mode === "recall" ? recallBatchAction(input) : revokeBatchAction(input));
      if (!result.ok) {
        if (result.fields) setErrors(result.fields);
        if (result.message) setFormError(result.message);
        return;
      }
      close();
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function lift() {
    setPending(true);
    setFormError(null);
    try {
      const result = await liftRecallAction(batchId);
      if (!result.ok) return setFormError(result.message);
      setLifting(false);
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const danger = "h-11 rounded-xl bg-danger px-5 text-[15px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60";
  const outline = "h-11 rounded-xl border border-line-strong bg-white px-5 text-[15px] font-semibold text-ink transition hover:bg-surface-soft disabled:opacity-60";

  if (status === "revoked") return null;
  const copy = mode ? COPY[mode] : null;

  return (
    <div>
      {!mode ? (
        <div className="flex flex-wrap items-center gap-3">
          {status === "recalled" ? (
            lifting ? (
              <div role="alertdialog" aria-label={`Lift the recall on ${batchNumber}`} className="max-w-md rounded-xl border border-line bg-white p-4">
                <p className="text-[15px] font-semibold text-ink">Lift the recall on batch {batchNumber}?</p>
                <p className="mt-1 text-sm text-body">Its codes will verify again as genuine. Only do this if the recall was a mistake or the problem is fixed.</p>
                <div className="mt-4 flex items-center gap-3">
                  <button type="button" onClick={lift} disabled={pending} className="h-11 rounded-xl bg-retail px-5 text-[15px] font-semibold text-white transition hover:bg-retail-dark disabled:opacity-70">
                    {pending ? "Lifting…" : "Yes, lift the recall"}
                  </button>
                  <button type="button" onClick={() => setLifting(false)} disabled={pending} className="text-sm font-semibold text-body hover:underline">Cancel</button>
                </div>
              </div>
            ) : (
              <button type="button" className={outline} onClick={() => { setFormError(null); setLifting(true); }}>Lift recall</button>
            )
          ) : released ? (
            <button type="button" className={danger} onClick={() => open("recall")}>Recall batch</button>
          ) : null}
          {!lifting ? <button type="button" className={outline} onClick={() => open("revoke")}>Revoke batch</button> : null}
        </div>
      ) : null}
      {formError && !mode ? <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{formError}</p> : null}

      {mode && copy ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !pending) close(); }}>
          <form
            onSubmit={onSubmit}
            noValidate
            role="dialog"
            aria-modal="true"
            aria-labelledby="recall-title"
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 id="recall-title" className="text-xl font-semibold text-ink">{copy.title} {batchNumber}</h2>
            <p className="mt-2 text-sm text-body">{copy.intro}</p>

            <div className="mt-5">
              <label htmlFor="reason" className="text-[15px] font-semibold text-ink">Reason</label>
              <select id="reason" name="reason" ref={firstRef} defaultValue="" aria-invalid={errors.reason ? true : undefined} className={`${field} h-12`}>
                <option value="" disabled>Choose a reason</option>
                {copy.reasons.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
              </select>
              {errors.reason ? <p role="alert" className="mt-1.5 text-[13px] text-danger">{errors.reason}</p> : null}
            </div>

            <div className="mt-5">
              <label htmlFor="message" className="text-[15px] font-semibold text-ink">Message to shoppers and retailers</label>
              <textarea
                id="message"
                name="message"
                rows={3}
                maxLength={BATCH_MESSAGE_MAX}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                aria-invalid={errors.message ? true : undefined}
                placeholder={mode === "recall" ? "For example: Stop using this batch and contact us on 0800 000 0000." : "For example: This batch was withdrawn. Do not use it."}
                className={`${field} py-3 leading-relaxed`}
              />
              <p className="mt-1.5 flex justify-between text-[13px] text-muted">
                <span>Shown on the recalled result when someone scans a code from this batch. {BATCH_MESSAGE_MIN}-{BATCH_MESSAGE_MAX} characters.</span>
                <span aria-live="off">{message.length}/{BATCH_MESSAGE_MAX}</span>
              </p>
              {errors.message ? <p role="alert" className="mt-1 text-[13px] text-danger">{errors.message}</p> : null}
            </div>

            <div className="mt-5">
              <label htmlFor="note" className="text-[15px] font-semibold text-ink">Internal note <span className="font-normal text-muted">(optional)</span></label>
              <textarea id="note" name="note" rows={2} maxLength={BATCH_NOTE_MAX} aria-invalid={errors.note ? true : undefined} placeholder="Only your team sees this." className={`${field} py-3 leading-relaxed`} />
              {errors.note ? <p role="alert" className="mt-1.5 text-[13px] text-danger">{errors.note}</p> : null}
            </div>

            {mode === "revoke" ? (
              <div className="mt-5">
                <label htmlFor="confirm" className="text-[15px] font-semibold text-ink">Type the batch number to confirm</label>
                <input id="confirm" name="confirm" autoComplete="off" placeholder={batchNumber} aria-invalid={errors.confirm ? true : undefined} className={`${field} h-12 font-mono`} />
                {errors.confirm ? <p role="alert" className="mt-1.5 text-[13px] text-danger">{errors.confirm}</p> : null}
              </div>
            ) : null}

            {formError ? <p role="alert" className="mt-5 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{formError}</p> : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={close} disabled={pending} className="h-11 px-4 text-[15px] font-semibold text-body hover:underline">Cancel</button>
              <button type="submit" disabled={pending} className={danger}>{pending ? copy.working : copy.confirm}</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
