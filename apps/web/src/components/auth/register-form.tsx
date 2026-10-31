"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { registerSchema } from "@skanproov/validation";
import { z } from "zod";
import { signUp } from "@/lib/auth-client";
import { site } from "@/lib/site";
import { PasswordField, TextField } from "./fields";
import { PrimaryButton } from "./primary-button";

type FieldName = "fullName" | "email" | "phone" | "password" | "confirmPassword";
type Errors = Partial<Record<FieldName, string>>;

export function RegisterForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const data = new FormData(event.currentTarget);
    const parsed = registerSchema.safeParse({
      fullName: data.get("fullName"),
      email: data.get("email"),
      phone: data.get("phone"),
      password: data.get("password"),
      confirmPassword: data.get("confirmPassword"),
    });

    if (!parsed.success) {
      const fields = z.flattenError(parsed.error).fieldErrors;
      setErrors({
        fullName: fields.fullName?.[0],
        email: fields.email?.[0],
        phone: fields.phone?.[0],
        password: fields.password?.[0],
        confirmPassword: fields.confirmPassword?.[0],
      });
      return;
    }

    setErrors({});
    setPending(true);
    try {
      const result = await signUp(parsed.data);
      if (!result.ok) setFormError(result.message);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <TextField
          label="Full name"
          name="fullName"
          autoComplete="name"
          placeholder="John Doe"
          error={errors.fullName}
        />
        <TextField
          label="E-mail Address"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="example@gmail.com"
          error={errors.email}
        />
        <TextField
          label="Phone number"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0903-456-1234"
          error={errors.phone}
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          placeholder="*******"
          error={errors.password}
        />
        <PasswordField
          label="Confirm Password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="*******"
          error={errors.confirmPassword}
        />

        {formError ? (
          <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {formError}
          </p>
        ) : null}

        <div className="pt-1">
          <PrimaryButton type="submit" pending={pending} className="mx-auto w-[72%] min-w-[220px]">
            Create an account
          </PrimaryButton>
        </div>
      </form>

      <p className="mt-3 text-center text-[15px] font-medium text-ink-title">
        Already have an account?{" "}
        <Link href={site.links.login} className="font-semibold text-brand hover:text-brand-deep hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
