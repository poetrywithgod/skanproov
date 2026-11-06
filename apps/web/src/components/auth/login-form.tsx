"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { loginSchema } from "@skanproov/validation";
import { z } from "zod";
import { signIn } from "@/lib/auth-client";
import { needsMfa } from "@/lib/mfa-client";
import { getRole, type RoleId } from "@/lib/roles";
import { site } from "@/lib/site";
import { PasswordField, TextField } from "./fields";
import { MfaStep } from "./mfa-step";
import { ArrowRight, PrimaryButton } from "./primary-button";

type Errors = Partial<Record<"email" | "password", string>>;

export function LoginForm({
  initialError,
  notice,
  checkMfaOnLoad = false,
  role = null,
}: {
  /** Which kind of account the person chose on the landing page. */
  role?: RoleId | null;
  initialError?: string;
  notice?: string | undefined;
  checkMfaOnLoad?: boolean;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(initialError ?? null);
  const [pending, setPending] = useState(false);
  const [mfaStep, setMfaStep] = useState(false);

  // Sent back here after a password-only sign-in (for example after a password reset).
  useEffect(() => {
    if (!checkMfaOnLoad) return;
    void needsMfa().then((needed) => setMfaStep(needed));
  }, [checkMfaOnLoad]);

  const chosen = getRole(role);

  function finish() {
    router.replace(
      role === "manufacturer" ? site.manufacturer.register : role === "retailer" ? site.retailer.home : site.links.home,
    );
    router.refresh();
  }

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
      if (!result.ok) {
        setFormError(result.message);
      } else if (await needsMfa()) {
        setMfaStep(true);
      } else {
        finish();
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (mfaStep) return <MfaStep onDone={finish} onCancel={() => setMfaStep(false)} />;

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

        {notice ? (
          <p role="status" className="rounded-lg bg-brand-soft px-3.5 py-2.5 text-sm text-brand-deep">
            {notice}
          </p>
        ) : null}
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
        href={chosen?.signUp ?? site.links.register}
        className="mt-4 flex h-[54px] items-center justify-center rounded-xl border border-[#e4e7ec] bg-white text-[15px] font-semibold text-black shadow-[0_2px_6px_rgba(16,24,40,0.06)] transition hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {chosen ? `Create a ${chosen.label.toLowerCase()} account` : "Create an account"}
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
