"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { resetPasswordSchema } from "@skanproov/validation";
import { z } from "zod";
import { resetPassword } from "@/lib/auth-client";
import { site } from "@/lib/site";
import { PasswordField } from "./fields";
import { PrimaryButton } from "./primary-button";

type Errors = Partial<Record<"password" | "confirmPassword", string>>;

export function ResetForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const data = new FormData(event.currentTarget);
    const parsed = resetPasswordSchema.safeParse({
      password: data.get("password"),
      confirmPassword: data.get("confirmPassword"),
    });
    if (!parsed.success) {
      const fields = z.flattenError(parsed.error).fieldErrors;
      setErrors({ password: fields.password?.[0], confirmPassword: fields.confirmPassword?.[0] });
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const result = await resetPassword(parsed.data.password);
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      router.replace(`${site.links.home}`);
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
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
      <PrimaryButton type="submit" pending={pending} className="w-full">
        Save new password
      </PrimaryButton>
    </form>
  );
}
