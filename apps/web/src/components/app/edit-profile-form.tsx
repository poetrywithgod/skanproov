"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { profileSchema } from "@skanproov/validation";
import { z } from "zod";
import { TextField } from "@/components/auth/fields";
import { PrimaryButton } from "@/components/auth/primary-button";
import { saveProfile } from "@/lib/profile-client";
import { site } from "@/lib/site";

export function EditProfileForm({
  userId,
  fullName,
  phone,
  email,
}: {
  userId: string;
  fullName: string;
  phone: string;
  email: string;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<{ fullName?: string | undefined; phone?: string | undefined }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const data = new FormData(event.currentTarget);
    const parsed = profileSchema.safeParse({ fullName: data.get("fullName"), phone: data.get("phone") });

    if (!parsed.success) {
      const fields = z.flattenError(parsed.error).fieldErrors;
      setErrors({ fullName: fields.fullName?.[0], phone: fields.phone?.[0] });
      return;
    }

    setErrors({});
    setPending(true);
    try {
      const result = await saveProfile(userId, parsed.data);
      if (!result.ok) {
        if (result.field === "phone") setErrors({ phone: result.message });
        else setFormError(result.message);
        return;
      }
      router.replace(`${site.links.profile}?saved=1`);
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-2xl bg-white p-5 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
      <TextField label="Full name" name="fullName" autoComplete="name" defaultValue={fullName} error={errors.fullName} />
      <TextField
        label="Phone number"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        defaultValue={phone}
        error={errors.phone}
      />
      <div>
        <p className="mb-2 text-base font-semibold text-brand-900">E-mail address</p>
        <p className="flex h-11 items-center rounded-lg border border-field-border bg-[#f1f3f1] px-3.5 text-[15px] text-body">
          {email}
        </p>
        <p className="mt-1.5 text-xs text-body">Changing your e-mail address isn&apos;t available yet.</p>
      </div>

      {formError ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 pt-1">
        <PrimaryButton type="submit" pending={pending}>
          Save changes
        </PrimaryButton>
        <Link
          href={site.links.profile}
          className="flex h-12 items-center justify-center rounded-xl text-[15px] font-semibold text-body hover:bg-black/5"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
