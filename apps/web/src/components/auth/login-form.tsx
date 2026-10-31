"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { loginSchema } from "@skanproov/validation";
import { z } from "zod";
import { signIn } from "@/lib/auth-client";
import { site } from "@/lib/site";
import { PasswordField, TextField } from "./fields";
import { ArrowRight, PrimaryButton } from "./primary-button";

type Errors = Partial<Record<"email" | "password", string>>;

export function LoginForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const data = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: data.get("email"),
      password: data.get("password"),
      remember: data.get("remember") === "on",
    });

    if (!parsed.success) {
      const fields = z.flattenError(parsed.error).fieldErrors;
      setErrors({ email: fields.email?.[0], password: fields.password?.[0] });
      return;
    }

    setErrors({});
    setPending(true);
    try {
      const result = await signIn(parsed.data);
      if (!result.ok) setFormError(result.message);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-9">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <TextField
          label="E-mail"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="example@gmail.com"
          error={errors.email}
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter password"
          withToggle={false}
          error={errors.password}
          className="placeholder:text-ink/60"
        />

        <div>
          <label className="flex w-fit cursor-pointer items-center gap-2.5 pl-3 text-sm text-ink-muted">
            <input
              type="checkbox"
              name="remember"
              className="size-[18px] cursor-pointer rounded-[5px] border-2 border-ink accent-brand"
            />
            Remember me
          </label>
          <div className="mt-1.5 text-right">
            <Link
              href={site.links.forgotPassword}
              className="pr-3 text-[15px] text-ink hover:text-brand-dark hover:underline"
            >
              Forgot password
            </Link>
          </div>
        </div>

        {formError ? (
          <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {formError}
          </p>
        ) : null}

        <PrimaryButton type="submit" pending={pending} className="w-full">
          Sign In
          <ArrowRight />
        </PrimaryButton>
      </form>

      <Link
        href={site.links.register}
        className="mt-4 flex h-[54px] items-center justify-center rounded-xl border border-[#e4e7ec] bg-white text-[15px] font-semibold text-black shadow-[0_2px_6px_rgba(16,24,40,0.06)] transition hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Create an account
      </Link>

      <div className="mt-5 text-right">
        <Link
          href={site.links.scan}
          className="inline-flex items-center gap-2.5 text-[15px] font-semibold text-brand hover:text-brand-deep"
        >
          Continue without an account
          <ArrowRight />
        </Link>
      </div>
    </div>
  );
}
