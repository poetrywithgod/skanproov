"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { changePasswordSchema } from "@skanproov/validation";
import { z } from "zod";
import { PasswordField } from "@/components/auth/fields";
import { PrimaryButton } from "@/components/auth/primary-button";
import { changePassword } from "@/lib/auth-client";
import { site } from "@/lib/site";

type Errors = Partial<Record<"currentPassword" | "password" | "confirmPassword", string>>;

export function ChangePasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const data = new FormData(event.currentTarget);
    const parsed = changePasswordSchema.safeParse({
      currentPassword: data.get("currentPassword"),
      password: data.get("password"),
      confirmPassword: data.get("confirmPassword"),
    });
    if (!parsed.success) {
      const fields = z.flattenError(parsed.error).fieldErrors;
      setErrors({
        currentPassword: fields.currentPassword?.[0],
        password: fields.password?.[0],
        confirmPassword: fields.confirmPassword?.[0],
      });
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const result = await changePassword(email, parsed.data.currentPassword, parsed.data.password);
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      router.replace(`${site.links.profile}?saved=password`);
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-2xl bg-white p-5 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
      <PasswordField
        label="Current password"
        name="currentPassword"
        autoComplete="current-password"
        error={errors.currentPassword}
      />
      <PasswordField label="New password" name="password" autoComplete="new-password" error={errors.password} />
      <PasswordField
        label="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
        error={errors.confirmPassword}
      />
      {formError ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {formError}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 pt-1">
        <PrimaryButton type="submit" pending={pending}>
          Update password
        </PrimaryButton>
        <Link
          href={site.links.profile}
          className="flex h-12 items-center justify-center rounded-xl text-[15px] font-semibold text-body hover:bg-black/5"
        >
          Cancel
        </Link>
        <Link
          href={site.links.forgotPassword}
          className="text-center text-sm font-semibold text-brand hover:text-brand-deep hover:underline"
        >
          Forgot your current password?
        </Link>
      </div>
    </form>
  );
}
