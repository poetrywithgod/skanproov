"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { CloseIcon } from "@/components/icons";
import { formatPin } from "@/lib/code";
import { site } from "@/lib/site";

/** Bottom sheet for typing the 12-digit backup code printed under the scratch-off coating. */
export function ManualCodeSheet({
  open,
  onClose,
  variant = "product",
}: {
  open: boolean;
  onClose: () => void;
  variant?: "product" | "carton";
}) {
  const carton = variant === "carton";
  const router = useRouter();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (carton) {
      const code = value.trim().replace(/\s+/g, "");
      if (!/^[A-Za-z0-9_-]{4,64}$/.test(code)) {
        setError("Enter the carton code exactly as printed (letters, numbers and dashes).");
        inputRef.current?.focus();
        return;
      }
      setPending(true);
      router.push(`${site.retailer.result}/${encodeURIComponent(code)}`);
      return;
    }
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 12) {
      setError("Enter all 12 digits of the backup code.");
      inputRef.current?.focus();
      return;
    }
    setPending(true);
    router.push(`${site.links.verify}/${digits}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[480px] rounded-t-3xl bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-8px_32px_rgba(0,0,0,0.2)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold tracking-normal text-ink">
              {carton ? "Enter carton code" : "Enter backup code"}
            </h2>
            <p className="mt-1 text-[13px] leading-[1.45] text-body">
              {carton ? "Type the code printed under the QR code on the carton label." : "Scratch off the silver coating on the seal and type the 12 digits underneath."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-2 grid size-10 shrink-0 place-items-center rounded-full text-body hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-brand"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} noValidate className="mt-5">
          <label htmlFor={`${titleId}-pin`} className="sr-only">
            {carton ? "Carton code" : "12-digit backup code"}
          </label>
          <input
            ref={inputRef}
            id={`${titleId}-pin`}
            value={value}
            onChange={(event) => {
              setValue(carton ? event.target.value.toUpperCase().slice(0, 64) : formatPin(event.target.value));
              setError(null);
            }}
            inputMode={carton ? "text" : "numeric"}
            autoComplete="off"
            placeholder={carton ? "CT-000123" : "0000 0000 0000"}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${titleId}-error` : undefined}
            className={`block h-14 w-full rounded-xl border bg-white px-4 text-center font-mono text-xl tracking-[0.18em] text-ink outline-none placeholder:text-field-placeholder focus:border-brand focus:ring-4 focus:ring-brand/15 ${
              error ? "border-danger" : "border-field-border"
            }`}
          />
          {error ? (
            <p id={`${titleId}-error`} role="alert" className="mt-2 text-[13px] text-danger">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-4 flex h-[52px] w-full items-center justify-center rounded-xl bg-brand text-[15px] font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-70"
          >
            {pending ? "Checking…" : carton ? "Check carton" : "Verify product"}
          </button>
        </form>
      </div>
    </div>
  );
}
