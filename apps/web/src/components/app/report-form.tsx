"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { REPORT_KINDS, reportSchema } from "@skanproov/validation";
import { z } from "zod";
import { TextField } from "@/components/auth/fields";
import { PrimaryButton } from "@/components/auth/primary-button";
import { submitReport } from "@/lib/report-client";
import { site } from "@/lib/site";
import { CheckIcon } from "@/components/icons";

type Errors = Partial<Record<"kind" | "code" | "place" | "details", string>>;

export function ReportForm({ initialCode }: { initialCode: string }) {
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const data = new FormData(event.currentTarget);
    const parsed = reportSchema.safeParse({
      kind: data.get("kind") ?? "",
      code: data.get("code") ?? "",
      place: data.get("place") ?? "",
      details: data.get("details") ?? "",
    });
    if (!parsed.success) {
      const f = z.flattenError(parsed.error).fieldErrors;
      setErrors({ kind: f.kind?.[0], code: f.code?.[0], place: f.place?.[0], details: f.details?.[0] });
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const result = await submitReport(parsed.data);
      if (result.ok) setSent(true);
      else setFormError(result.message);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl bg-brand-soft p-6 text-center" role="status">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand text-white">
          <CheckIcon className="size-7" strokeWidth={3} />
        </span>
        <h2 className="mt-3 text-xl font-bold tracking-normal text-brand-deep">Thank you</h2>
        <p className="mt-1 text-sm leading-[1.5] text-body">
          We&apos;ve received your report. Until you&apos;re sure the product is safe, please don&apos;t use it.
        </p>
        <Link
          href={site.links.scan}
          className="mt-5 flex h-12 items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white"
        >
          Scan another product
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-2xl bg-white p-5 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
      <fieldset>
        <legend className="mb-2 text-base font-semibold text-brand-900">What&apos;s wrong?</legend>
        <div className="space-y-2">
          {REPORT_KINDS.map((k) => (
            <label
              key={k.value}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-field-border px-3.5 text-[15px] text-ink has-[:checked]:border-brand has-[:checked]:bg-brand-soft"
            >
              <input type="radio" name="kind" value={k.value} className="size-[18px] accent-brand" />
              {k.label}
            </label>
          ))}
        </div>
        {errors.kind ? (
          <p role="alert" className="mt-1.5 text-sm text-danger">
            {errors.kind}
          </p>
        ) : null}
      </fieldset>

      <TextField
        label="Product code (if you have it)"
        name="code"
        defaultValue={initialCode}
        autoComplete="off"
        placeholder="QR code or 12-digit PIN"
        error={errors.code}
      />
      <TextField
        label="Where did you buy it?"
        name="place"
        autoComplete="off"
        placeholder="Shop or market name and area"
        error={errors.place}
      />
      <div>
        <label htmlFor="report-details" className="mb-2 block text-base font-semibold text-brand-900">
          What did you notice?
        </label>
        <textarea
          id="report-details"
          name="details"
          rows={4}
          maxLength={1000}
          aria-invalid={errors.details ? true : undefined}
          className={`block w-full rounded-lg border bg-white px-3.5 py-3 text-[15px] text-ink outline-none placeholder:text-field-placeholder focus:border-brand focus:ring-4 focus:ring-brand/15 ${
            errors.details ? "border-danger" : "border-field-border"
          }`}
          placeholder="Anything that looks different about the packaging, seal or price."
        />
        {errors.details ? (
          <p role="alert" className="mt-1.5 text-sm text-danger">
            {errors.details}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <PrimaryButton type="submit" pending={pending} className="w-full">
        Send report
      </PrimaryButton>
    </form>
  );
}
