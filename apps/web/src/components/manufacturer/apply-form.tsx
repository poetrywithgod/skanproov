"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { MANUFACTURER_CATEGORIES } from "@skanproov/validation";
import { applyManufacturerAction } from "@/app/manufacturer/actions";
import { TextField } from "@/components/auth/fields";
import { PrimaryButton } from "@/components/auth/primary-button";
import { site } from "@/lib/site";

type Errors = Partial<Record<"company" | "rcNumber" | "nafdacNumber" | "category" | "address" | "city", string>>;

export function ApplyForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const data = new FormData(event.currentTarget);
    const nafdac = String(data.get("nafdacNumber") ?? "").trim();
    setPending(true);
    try {
      const result = await applyManufacturerAction({
        company: data.get("company"),
        rcNumber: data.get("rcNumber"),
        nafdacNumber: nafdac || undefined,
        category: data.get("category") || undefined,
        address: data.get("address"),
        city: data.get("city"),
      });
      if (result.ok) {
        setErrors({});
        router.replace(site.manufacturer.register);
        router.refresh();
        return;
      }
      setErrors(result.fields ?? {});
      setFormError(result.message ?? null);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
      <TextField label="Registered company name" name="company" autoComplete="organization" placeholder="Ada Foods Nigeria Ltd" error={errors.company} />
      <TextField label="CAC registration (RC) number" name="rcNumber" placeholder="RC 1234567" error={errors.rcNumber} />
      <div>
        <label htmlFor="category" className="mb-2 block text-base font-semibold text-brand-900">
          What do you make?
        </label>
        <select
          id="category"
          name="category"
          defaultValue=""
          aria-invalid={errors.category ? true : undefined}
          className={`block h-11 w-full rounded-lg border bg-white px-3 text-[15px] text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15 ${
            errors.category ? "border-danger" : "border-field-border"
          }`}
        >
          <option value="" disabled>
            Choose one
          </option>
          {MANUFACTURER_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {errors.category ? (
          <p role="alert" className="mt-1.5 text-sm text-danger">
            {errors.category}
          </p>
        ) : null}
      </div>
      <TextField label="NAFDAC number (if you have one)" name="nafdacNumber" placeholder="A1-1234" error={errors.nafdacNumber} />
      <TextField label="Factory or office address" name="address" autoComplete="street-address" placeholder="14 Industrial Avenue" error={errors.address} />
      <TextField label="City" name="city" autoComplete="address-level2" placeholder="Lagos" error={errors.city} />

      <p className="rounded-lg bg-brand-soft px-3.5 py-2.5 text-[13px] leading-[1.45] text-body">
        SKANPROOV checks your CAC registration before your manufacturer account goes live. We will e-mail you when it is ready.
      </p>

      {formError ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <PrimaryButton type="submit" pending={pending} className="mx-auto w-[72%] min-w-[220px]">
        Send application
      </PrimaryButton>
    </form>
  );
}
