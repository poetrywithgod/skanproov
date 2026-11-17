"use client";

import { changePasswordSchema } from "@skanproov/validation";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { changePassword } from "@/lib/auth-client";
import { confirmEnrollment, disableTwoFactor, startEnrollment, type Enrollment } from "@/lib/mfa-client";

const input =
  "mt-2 h-12 w-full rounded-xl border border-field-border bg-white px-4 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-retail";
const primary = "h-12 rounded-xl bg-retail px-6 text-[15px] font-semibold text-white transition hover:bg-retail-dark disabled:opacity-60";
const secondary = "h-12 rounded-xl border border-line-strong bg-white px-5 text-[15px] font-semibold text-ink transition hover:bg-surface-soft disabled:opacity-60";

const sixDigits = (form: HTMLFormElement) => String(new FormData(form).get("code") ?? "").replace(/\s/g, "");

function CodeField({ error }: { error: string | null }) {
  return (
    <div>
      <label htmlFor="mfa-code" className="text-[15px] font-semibold text-ink">Code from your authenticator app</label>
      <input id="mfa-code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} placeholder="000000" aria-invalid={error ? true : undefined} className={`${input} max-w-[220px] text-center font-mono text-xl tracking-[0.25em]`} />
      {error ? <p role="alert" className="mt-1.5 text-[13px] text-danger">{error}</p> : null}
    </div>
  );
}

type Mfa = { step: "idle" } | { step: "setup"; enrollment: Enrollment } | { step: "disable" };

/** Two-factor (authenticator app) and password for the signed-in person. */
export function SecurityPanel({ email, twoFactorOn }: { email: string; twoFactorOn: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(twoFactorOn);
  const [mfa, setMfa] = useState<Mfa>({ step: "idle" });
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pwErrors, setPwErrors] = useState<Partial<Record<"currentPassword" | "password" | "confirmPassword", string>>>({});
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwDone, setPwDone] = useState(false);

  async function begin() {
    setMfaError(null);
    setPending(true);
    try {
      const r = await startEnrollment();
      if (r.ok) setMfa({ step: "setup", enrollment: r.enrollment });
      else setMfaError(r.message);
    } finally {
      setPending(false);
    }
  }

  async function confirm(event: FormEvent<HTMLFormElement>, factorId: string) {
    event.preventDefault();
    const code = sixDigits(event.currentTarget);
    if (!/^\d{6}$/.test(code)) return setMfaError("Enter the 6-digit code from your app.");
    setMfaError(null);
    setPending(true);
    try {
      const r = await confirmEnrollment(factorId, code);
      if (r.ok) {
        setOn(true);
        setMfa({ step: "idle" });
        router.refresh();
      } else setMfaError(r.message);
    } finally {
      setPending(false);
    }
  }

  async function disable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = sixDigits(event.currentTarget);
    if (!/^\d{6}$/.test(code)) return setMfaError("Enter the 6-digit code from your app.");
    setMfaError(null);
    setPending(true);
    try {
      const r = await disableTwoFactor(code);
      if (r.ok) {
        setOn(false);
        setMfa({ step: "idle" });
        router.refresh();
      } else setMfaError(r.message);
    } finally {
      setPending(false);
    }
  }

  async function onPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPwError(null);
    const data = new FormData(event.currentTarget);
    const parsed = changePasswordSchema.safeParse({
      currentPassword: data.get("currentPassword"),
      password: data.get("password"),
      confirmPassword: data.get("confirmPassword"),
    });
    if (!parsed.success) {
      const f = z.flattenError(parsed.error).fieldErrors;
      setPwErrors({
        ...(f.currentPassword?.[0] ? { currentPassword: f.currentPassword[0] } : {}),
        ...(f.password?.[0] ? { password: f.password[0] } : {}),
        ...(f.confirmPassword?.[0] ? { confirmPassword: f.confirmPassword[0] } : {}),
      });
      return;
    }
    setPwErrors({});
    setPending(true);
    try {
      const r = await changePassword(email, parsed.data.currentPassword, parsed.data.password);
      if (!r.ok) return setPwError(r.message);
      setPwOpen(false);
      setPwDone(true);
    } catch {
      setPwError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const row = "border-t border-row-line p-6 first:border-t-0";
  return (
    <section className="rounded-xl border border-line bg-white" aria-labelledby="signin-title">
      <div className="p-6">
        <h2 id="signin-title" className="text-xl font-semibold text-ink">Sign-in security</h2>
        <p className="mt-1 text-sm text-body">Protect your own account and the codes it controls.</p>
      </div>

      <div className={`${row} border-t`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-ink">
              Two-factor authentication
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${on ? "bg-retail-soft text-retail-dark" : "bg-pill text-muted"}`}>
                {on ? "On · Authenticator app" : "Off"}
              </span>
            </p>
            <p className="mt-1 text-sm text-body">
              Asks for a 6-digit code from an authenticator app (Google Authenticator, Microsoft Authenticator, Authy) each time you sign in. It&apos;s optional for now.
            </p>
          </div>
          {mfa.step === "idle" ? (
            on ? (
              <button type="button" className={secondary} onClick={() => { setMfaError(null); setMfa({ step: "disable" }); }}>Turn off</button>
            ) : (
              <button type="button" className={primary} disabled={pending} onClick={begin}>{pending ? "Starting…" : "Turn on"}</button>
            )
          ) : null}
        </div>
        {mfa.step === "idle" && mfaError ? <p role="alert" className="mt-3 text-sm text-danger">{mfaError}</p> : null}

        {mfa.step === "setup" ? (
          <form onSubmit={(e) => confirm(e, mfa.enrollment.factorId)} noValidate className="mt-5 space-y-4 rounded-xl bg-surface-soft p-5">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-body">
              <li>Open your authenticator app and add a new account.</li>
              <li>Scan this QR code, or type the key by hand.</li>
              <li>Enter the 6-digit code the app shows.</li>
            </ol>
            {/* eslint-disable-next-line @next/next/no-img-element -- an inline SVG data URL, nothing to optimise */}
            <img src={mfa.enrollment.qrCode} alt="QR code to add SKANPROOV to your authenticator app" className="size-44 rounded-lg bg-white p-2" />
            <p className="break-all rounded-lg bg-white px-3 py-2 font-mono text-sm text-ink">{mfa.enrollment.secret}</p>
            <CodeField error={mfaError} />
            <div className="flex gap-3">
              <button type="submit" className={primary} disabled={pending}>{pending ? "Checking…" : "Confirm and turn on"}</button>
              <button type="button" className={secondary} onClick={() => { setMfaError(null); setMfa({ step: "idle" }); }}>Cancel</button>
            </div>
          </form>
        ) : null}

        {mfa.step === "disable" ? (
          <form onSubmit={disable} noValidate className="mt-5 space-y-4 rounded-xl bg-surface-soft p-5">
            <p className="text-sm text-body">Enter a current code to turn two-factor off.</p>
            <CodeField error={mfaError} />
            <div className="flex gap-3">
              <button type="submit" disabled={pending} className="h-12 rounded-xl bg-danger px-6 text-[15px] font-semibold text-white hover:opacity-90 disabled:opacity-60">{pending ? "Turning off…" : "Turn off two-factor"}</button>
              <button type="button" className={secondary} onClick={() => { setMfaError(null); setMfa({ step: "idle" }); }}>Cancel</button>
            </div>
          </form>
        ) : null}
      </div>

      <div className={row}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[15px] font-semibold text-ink">Password</p>
            <p className="mt-1 text-sm text-body">{pwDone ? "Your password was updated." : "Use a strong password you don't use anywhere else."}</p>
          </div>
          {!pwOpen ? (
            <button type="button" className={secondary} onClick={() => { setPwDone(false); setPwOpen(true); }}>Change password</button>
          ) : null}
        </div>
        {pwOpen ? (
          <form onSubmit={onPassword} noValidate className="mt-5 grid max-w-md gap-4 rounded-xl bg-surface-soft p-5">
            {(
              [
                ["currentPassword", "Current password", "current-password"],
                ["password", "New password", "new-password"],
                ["confirmPassword", "Confirm new password", "new-password"],
              ] as const
            ).map(([name, label, auto]) => (
              <div key={name}>
                <label htmlFor={name} className="text-[15px] font-semibold text-ink">{label}</label>
                <input id={name} name={name} type="password" autoComplete={auto} aria-invalid={pwErrors[name] ? true : undefined} className={input} />
                {pwErrors[name] ? <p role="alert" className="mt-1.5 text-[13px] text-danger">{pwErrors[name]}</p> : null}
              </div>
            ))}
            {pwError ? <p role="alert" className="text-sm text-danger">{pwError}</p> : null}
            <div className="flex gap-3">
              <button type="submit" className={primary} disabled={pending}>{pending ? "Updating…" : "Update password"}</button>
              <button type="button" className={secondary} onClick={() => { setPwOpen(false); setPwErrors({}); setPwError(null); }}>Cancel</button>
            </div>
          </form>
        ) : null}
      </div>
    </section>
  );
}
