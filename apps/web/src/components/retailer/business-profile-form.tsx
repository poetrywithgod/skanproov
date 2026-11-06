"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { STORE_TYPES } from "@skanproov/validation";
import { requestProfileChangeAction } from "@/app/retailer/actions";
import { site } from "@/lib/site";

type Errors = Partial<Record<"business" | "storeType" | "rcNumber", string>>;

const input =
  "block h-12 w-full rounded-xl border bg-white px-3.5 text-[15px] text-ink placeholder:text-field-placeholder focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-retail";

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-ink">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="mt-1.5 text-[13px] text-body">{hint}</p> : null}
      {error ? (
        <p role="alert" className="mt-1.5 text-[13px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Edit business name, store type and RC number. These go to a Super Admin before they apply. */
export function BusinessProfileForm({
  initial,
}: {
  initial: { business: string; storeType: string; rcNumber: string };
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const data = new FormData(event.currentTarget);
    const rc = String(data.get("rcNumber") ?? "").trim();
    setPending(true);
    try {
      const result = await requestProfileChangeAction({
        business: data.get("business"),
        storeType: data.get("storeType") || undefined,
        rcNumber: rc || undefined,
      });
      if (result.ok) {
        router.replace(`${site.retailer.profile}?sent=1`);
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
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field id="business" label="Business name" error={errors.business}>
        <input
          id="business"
          name="business"
          defaultValue={initial.business}
          autoComplete="organization"
          aria-invalid={errors.business ? true : undefined}
          className={`${input} ${errors.business ? "border-danger" : "border-field-border"}`}
        />
      </Field>

      <Field id="storeType" label="Type of store" error={errors.storeType}>
        <select
          id="storeType"
          name="storeType"
          defaultValue={initial.storeType}
          aria-invalid={errors.storeType ? true : undefined}
          className={`${input} ${errors.storeType ? "border-danger" : "border-field-border"}`}
        >
          <option value="" disabled>
            Choose one
          </option>
          {STORE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>

      <Field id="rcNumber" label="CAC registration (RC) number" hint="Leave blank if your business is not registered." error={errors.rcNumber}>
        <input
          id="rcNumber"
          name="rcNumber"
          defaultValue={initial.rcNumber}
          placeholder="RC 1234567"
          autoComplete="off"
          aria-invalid={errors.rcNumber ? true : undefined}
          className={`${input} ${errors.rcNumber ? "border-danger" : "border-field-border"}`}
        />
      </Field>

      <p className="rounded-xl bg-retail-soft px-4 py-3 text-[13px] leading-[1.5] text-retail-dark">
        Changes are checked by a Super Admin before they apply. Your shop keeps its current details until then.
      </p>

      {formError ? (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-14 w-full items-center justify-center rounded-2xl bg-retail text-base font-semibold text-white transition-colors hover:bg-retail-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail disabled:opacity-70"
      >
        {pending ? "Sending…" : "Send for review"}
      </button>
    </form>
  );
}
