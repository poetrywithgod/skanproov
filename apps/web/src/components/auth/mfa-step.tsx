"use client";

import { useState, type FormEvent } from "react";
import { cancelSignIn, verifyLoginCode } from "@/lib/mfa-client";
import { PrimaryButton } from "./primary-button";

/** Second step of sign-in for people who turned on two-factor. */
export function MfaStep({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "").replace(/\s/g, "");
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const result = await verifyLoginCode(code);
      if (result.ok) onDone();
      else setError(result.message);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-9 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-ink-title">Enter your code</h2>
        <p className="mt-1 text-sm text-ink-muted">Open your authenticator app and type the 6-digit code for SKANPROOV.</p>
      </div>
      <input
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={7}
        autoFocus
        placeholder="000000"
        aria-label="6-digit code"
        aria-invalid={error ? true : undefined}
        className={`block h-14 w-full rounded-lg border bg-white px-4 text-center font-mono text-2xl tracking-[0.3em] text-ink outline-none placeholder:text-field-placeholder focus:border-brand focus:ring-4 focus:ring-brand/15 ${
          error ? "border-danger" : "border-field-border"
        }`}
      />
      {error ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <PrimaryButton type="submit" pending={pending} className="w-full">
        Verify and sign in
      </PrimaryButton>
      <button
        type="button"
        onClick={async () => {
          await cancelSignIn();
          onCancel();
        }}
        className="block w-full text-center text-sm font-semibold text-body hover:underline"
      >
        Use a different account
      </button>
    </form>
  );
}
