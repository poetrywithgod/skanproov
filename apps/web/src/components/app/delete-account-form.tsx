"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { deleteAccountSchema } from "@skanproov/validation";
import { z } from "zod";
import { PasswordField, TextField } from "@/components/auth/fields";
import { deleteAccount } from "@/lib/auth-client";
import { site } from "@/lib/site";

type Errors = Partial<Record<"password" | "confirmation", string>>;

export function DeleteAccountForm({ email }: { email: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const data = new FormData(event.currentTarget);
    const parsed = deleteAccountSchema.safeParse({
      password: data.get("password"),
      confirmation: data.get("confirmation") ?? "",
    });
    if (!parsed.success) {
      const f = z.flattenError(parsed.error).fieldErrors;
      setErrors({ password: f.password?.[0], confirmation: f.confirmation?.[0] });
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const result = await deleteAccount(email, parsed.data.password);
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      router.replace(`${site.links.login}?deleted=1`);
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-2xl bg-white p-5 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
      <PasswordField label="Your password" name="password" autoComplete="current-password" error={errors.password} />
      <TextField
        label="Type DELETE to confirm"
        name="confirmation"
        autoComplete="off"
        autoCapitalize="characters"
        placeholder="DELETE"
        error={errors.confirmation}
      />
      {formError ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {formError}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending || undefined}
          className="flex h-[54px] items-center justify-center rounded-xl bg-danger px-6 text-[15px] font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Deleting…" : "Permanently delete my account"}
        </button>
        <Link
          href={site.links.profile}
          className="flex h-12 items-center justify-center rounded-xl text-[15px] font-semibold text-body hover:bg-black/5"
        >
          Keep my account
        </Link>
      </div>
    </form>
  );
}
