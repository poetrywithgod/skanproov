"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { forgotPasswordSchema } from "@skanproov/validation";
import { z } from "zod";
import { requestPasswordReset } from "@/lib/auth-client";
import { site } from "@/lib/site";
import { TextField } from "./fields";
import { PrimaryButton } from "./primary-button";

export function ForgotForm({ initialError }: { initialError?: string | undefined }) {
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(initialError ?? null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsed = forgotPasswordSchema.safeParse({ email: new FormData(event.currentTarget).get("email") });
    if (!parsed.success) {
      setEmailError(z.flattenError(parsed.error).fieldErrors.email?.[0]);
      return;
    }
    setEmailError(undefined);
    setPending(true);
    try {
      const result = await requestPasswordReset(parsed.data.email);
      if (result.ok) setSentTo(parsed.data.email);
      else setFormError(result.message);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (sentTo) {
    return (
      <div className="mt-8 rounded-xl bg-brand-soft px-5 py-6 text-center" role="status">
        <h2 className="text-lg font-semibold tracking-tight text-brand-900">Check your e-mail</h2>
        <p className="mt-2 text-sm leading-relaxed text-body">
          If an account exists for <span className="font-semibold text-ink">{sentTo}</span>, we&apos;ve sent a link to
          choose a new password. Open it in this same browser. It can take a few minutes to arrive, so check your spam
          folder too.
        </p>
        <Link
          href={site.links.login}
          className="mt-4 inline-block text-sm font-semibold text-brand hover:text-brand-deep hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <TextField
          label="E-mail"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="example@gmail.com"
          error={emailError}
        />
        {formError ? (
          <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {formError}
          </p>
        ) : null}
        <PrimaryButton type="submit" pending={pending} className="w-full">
          Send reset link
        </PrimaryButton>
      </form>
      <p className="mt-4 text-center text-[15px] font-medium text-ink-title">
        <Link href={site.links.login} className="font-semibold text-brand hover:text-brand-deep hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
