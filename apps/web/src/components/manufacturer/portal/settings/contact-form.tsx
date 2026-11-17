"use client";

import { contactDetailsSchema } from "@skanproov/validation";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { saveContactDetailsAction } from "@/app/manufacturer/(portal)/settings/actions";

type Values = { contactName: string; contactRole: string; contactPhone: string; qualityEmail: string; website: string };
type Errors = Partial<Record<keyof Values, string>>;

const input =
  "mt-2 h-12 w-full rounded-xl border border-field-border bg-white px-4 text-[15px] text-ink placeholder:text-field-placeholder focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-retail disabled:bg-surface-soft disabled:text-body read-only:bg-surface-soft";

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-[15px] font-semibold text-ink">{label}</label>
      {children}
      {error ? <p id={`${id}-error`} role="alert" className="mt-1.5 text-[13px] text-danger">{error}</p> : hint ? <p className="mt-1.5 text-[13px] text-muted">{hint}</p> : null}
    </div>
  );
}

/** The company's contact details. Everyone in the company can read them; only the Administrator can save. */
export function ContactForm({ initial, primaryEmail, canEdit }: { initial: Values; primaryEmail: string; canEdit: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState<Values>(initial);
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const dirty = (Object.keys(values) as (keyof Values)[]).some((k) => values[k] !== saved[k]);

  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setDone(false);
  };
  const props = (key: keyof Values) => ({
    id: key,
    value: values[key],
    onChange: set(key),
    readOnly: !canEdit,
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
    className: input,
  });

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setDone(false);
    const parsed = contactDetailsSchema.safeParse(values);
    if (!parsed.success) {
      const f = z.flattenError(parsed.error).fieldErrors;
      setErrors({
        ...(f.contactName?.[0] ? { contactName: f.contactName[0] } : {}),
        ...(f.contactRole?.[0] ? { contactRole: f.contactRole[0] } : {}),
        ...(f.contactPhone?.[0] ? { contactPhone: f.contactPhone[0] } : {}),
        ...(f.qualityEmail?.[0] ? { qualityEmail: f.qualityEmail[0] } : {}),
        ...(f.website?.[0] ? { website: f.website[0] } : {}),
      });
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const result = await saveContactDetailsAction(values);
      if (!result.ok) {
        if (result.fields) setErrors(result.fields);
        if (result.message) setFormError(result.message);
        return;
      }
      const d = parsed.data;
      const next: Values = { contactName: d.contactName, contactRole: d.contactRole ?? "", contactPhone: d.contactPhone ?? "", qualityEmail: d.qualityEmail ?? "", website: d.website ?? "" };
      setValues(next);
      setSaved(next);
      setDone(true);
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-xl border border-line bg-white" aria-labelledby="contact-title">
      <div className="p-6">
        <h2 id="contact-title" className="text-xl font-semibold text-ink">Contact details</h2>
        <p className="mt-1 text-sm text-body">How SKANPROOV and consumers reach your company.</p>
      </div>
      <div className="grid gap-x-6 gap-y-6 border-t border-row-line p-6 sm:grid-cols-2">
        <Field id="contactName" label="Primary contact name" error={errors.contactName}>
          <input {...props("contactName")} maxLength={120} autoComplete="name" />
        </Field>
        <Field id="contactRole" label="Job title" error={errors.contactRole}>
          <input {...props("contactRole")} maxLength={60} autoComplete="organization-title" />
        </Field>
        {/* DEFERRED(D20): changing the primary contact e-mail, with verification (needs e-mail sending). */}
        <Field id="primaryEmail" label="Primary contact email" hint="This can't be changed here yet. Changing it will need e-mail verification.">
          <input id="primaryEmail" value={primaryEmail} readOnly className={input} />
        </Field>
        <Field id="contactPhone" label="Phone number" hint="Nigerian number, for example 0801 234 5678." error={errors.contactPhone}>
          <input {...props("contactPhone")} inputMode="tel" autoComplete="tel" />
        </Field>
        <Field id="qualityEmail" label="Quality & complaints email" hint="Shown to consumers on verification pages once those show company contacts." error={errors.qualityEmail}>
          <input {...props("qualityEmail")} type="email" maxLength={254} />
        </Field>
        <Field id="website" label="Company website" hint="For example https://example.com" error={errors.website}>
          <input {...props("website")} inputMode="url" maxLength={200} autoComplete="url" />
        </Field>
      </div>
      {canEdit ? (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-row-line px-6 py-5">
          <div className="mr-auto" aria-live="polite">
            {formError ? <p role="alert" className="text-sm text-danger">{formError}</p> : done ? <p className="text-sm text-retail-dark">Changes saved.</p> : null}
          </div>
          <button
            type="button"
            disabled={!dirty || pending}
            onClick={() => { setValues(saved); setErrors({}); setFormError(null); setDone(false); }}
            className="h-12 rounded-xl border border-line bg-white px-5 text-[15px] font-semibold text-ink transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:text-muted disabled:opacity-60"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={!dirty || pending}
            className="h-12 rounded-xl bg-retail px-6 text-[15px] font-semibold text-white transition hover:bg-retail-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      ) : (
        <p className="border-t border-row-line px-6 py-4 text-sm text-muted">Only an Administrator can change these details.</p>
      )}
    </form>
  );
}
