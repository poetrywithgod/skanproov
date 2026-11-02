"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  confirmEnrollment,
  disableTwoFactor,
  startEnrollment,
  twoFactorEnabled,
  type Enrollment,
} from "@/lib/mfa-client";
import { PrimaryButton } from "@/components/auth/primary-button";
import { site } from "@/lib/site";

type State = { step: "loading" } | { step: "off" } | { step: "setup"; enrollment: Enrollment } | { step: "on" };

function CodeInput({ error, label }: { error: string | null; label: string }) {
  return (
    <>
      <label htmlFor="mfa-code" className="mb-2 block text-base font-semibold text-brand-900">
        {label}
      </label>
      <input
        id="mfa-code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={7}
        placeholder="000000"
        aria-invalid={error ? true : undefined}
        className={`block h-14 w-full rounded-lg border bg-white px-4 text-center font-mono text-2xl tracking-[0.3em] text-ink outline-none placeholder:text-field-placeholder focus:border-brand focus:ring-4 focus:ring-brand/15 ${
          error ? "border-danger" : "border-field-border"
        }`}
      />
      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </>
  );
}

function readCode(event: FormEvent<HTMLFormElement>): string {
  return String(new FormData(event.currentTarget).get("code") ?? "").replace(/\s/g, "");
}

export function TwoFactorPanel() {
  const router = useRouter();
  const [state, setState] = useState<State>({ step: "loading" });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void twoFactorEnabled().then((on) => setState({ step: on ? "on" : "off" }));
  }, []);

  async function begin() {
    setError(null);
    setPending(true);
    try {
      const result = await startEnrollment();
      if (result.ok) setState({ step: "setup", enrollment: result.enrollment });
      else setError(result.message);
    } finally {
      setPending(false);
    }
  }

  async function onConfirm(event: FormEvent<HTMLFormElement>, factorId: string) {
    event.preventDefault();
    const code = readCode(event);
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code from your app.");
    setError(null);
    setPending(true);
    try {
      const result = await confirmEnrollment(factorId, code);
      if (result.ok) {
        setState({ step: "on" });
        router.refresh();
      } else setError(result.message);
    } finally {
      setPending(false);
    }
  }

  async function onDisable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = readCode(event);
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code from your app.");
    setError(null);
    setPending(true);
    try {
      const result = await disableTwoFactor(code);
      if (result.ok) {
        setState({ step: "off" });
        router.refresh();
      } else setError(result.message);
    } finally {
      setPending(false);
    }
  }

  const card = "space-y-5 rounded-2xl bg-white p-5 shadow-[0_1px_4px_rgba(15,31,23,0.06)]";

  if (state.step === "loading") return <div className={card} aria-busy="true">Loading…</div>;

  if (state.step === "off") {
    return (
      <div className={card}>
        <p className="text-sm leading-[1.5] text-body">
          Two-factor authentication adds a second step when you sign in: a 6-digit code from an authenticator app such as
          Google Authenticator, Microsoft Authenticator or Authy. Someone who learns your password still can&apos;t get
          into your account.
        </p>
        {error ? (
          <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <PrimaryButton type="button" pending={pending} onClick={begin} className="w-full">
          Turn on two-factor
        </PrimaryButton>
        <Link href={site.links.profile} className="block text-center text-sm font-semibold text-body hover:underline">
          Back to profile
        </Link>
      </div>
    );
  }

  if (state.step === "setup") {
    const { enrollment } = state;
    return (
      <form onSubmit={(e) => onConfirm(e, enrollment.factorId)} noValidate className={card}>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-[1.5] text-body">
          <li>Open your authenticator app and add a new account.</li>
          <li>Scan this QR code, or type the key below by hand.</li>
          <li>Enter the 6-digit code the app shows.</li>
        </ol>
        {/* eslint-disable-next-line @next/next/no-img-element -- an inline SVG data URL, nothing to optimise */}
        <img src={enrollment.qrCode} alt="QR code to add SKANPROOV to your authenticator app" className="mx-auto size-48" />
        <p className="break-all rounded-lg bg-[#f1f3f1] px-3 py-2 text-center font-mono text-sm text-ink">
          {enrollment.secret}
        </p>
        <div>
          <CodeInput error={error} label="Code from your app" />
        </div>
        <PrimaryButton type="submit" pending={pending} className="w-full">
          Confirm and turn on
        </PrimaryButton>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setState({ step: "off" });
          }}
          className="block w-full text-center text-sm font-semibold text-body hover:underline"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onDisable} noValidate className={card}>
      <p role="status" className="rounded-lg bg-brand-soft px-3.5 py-2.5 text-sm font-semibold text-brand-deep">
        Two-factor is on. Signing in asks for a code from your app.
      </p>
      <div>
        <CodeInput error={error} label="To turn it off, enter a code" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="flex h-[54px] w-full items-center justify-center rounded-xl bg-danger px-6 text-[15px] font-semibold text-white hover:opacity-90 disabled:opacity-70"
      >
        {pending ? "Turning off…" : "Turn off two-factor"}
      </button>
      <Link href={site.links.profile} className="block text-center text-sm font-semibold text-body hover:underline">
        Back to profile
      </Link>
    </form>
  );
}
