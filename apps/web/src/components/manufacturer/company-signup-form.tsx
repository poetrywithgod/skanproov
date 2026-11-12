"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  CONTACT_ROLES,
  MANUFACTURER_CATEGORIES,
  STAFF_RANGES,
  manufacturerSignupSchema,
  type ManufacturerCompany,
} from "@skanproov/validation";
import { z } from "zod";
import { signUpManufacturer } from "@/lib/auth-client";
import { NIGERIA, NIGERIAN_STATES } from "@/lib/nigeria";
import { site } from "@/lib/site";
import { PasswordInput, SectionTitle, SelectInput, SubmitButton, TextInput, controlClass, Field } from "./form-bits";

type Errors = Partial<Record<string, string>>;

const YEARS = Array.from({ length: new Date().getFullYear() - 1959 }, (_, i) => String(new Date().getFullYear() - i));

/** "Register your Company": the company's details and the account it signs in with. */
export function CompanySignupForm() {
  const router = useRouter();
  const [state, setState] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const data = new FormData(event.currentTarget);
    const parsed = manufacturerSignupSchema.safeParse({
      company: data.get("company"),
      companyEmail: data.get("companyEmail"),
      companyPhone: data.get("companyPhone"),
      address: data.get("address"),
      state: data.get("state") || "",
      city: data.get("city"),
      rcNumber: data.get("rcNumber"),
      tin: data.get("tin"),
      regulatoryNumber: data.get("regulatoryNumber") || undefined,
      yearIncorporated: data.get("yearIncorporated") || undefined,
      staffRange: data.get("staffRange") || undefined,
      category: data.get("category") || undefined,
      contactName: data.get("contactName"),
      contactPhone: data.get("contactPhone"),
      contactRole: data.get("contactRole") || undefined,
      password: data.get("password"),
      confirmPassword: data.get("confirmPassword"),
      agree: data.get("agree") === "on",
    });

    if (!parsed.success) {
      const fields = z.flattenError(parsed.error).fieldErrors as Record<string, string[] | undefined>;
      setErrors(Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key, messages?.[0]])));
      // Take the person to the first field that needs attention.
      const first = Object.keys(fields)[0];
      if (first) event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setErrors({});
    const { password, confirmPassword: _confirm, agree: _agree, ...company } = parsed.data;
    setPending(true);
    try {
      const result = await signUpManufacturer(company as ManufacturerCompany, password);
      if (!result.ok) {
        setFormError(result.message);
      } else if (result.next === "confirm-email") {
        setConfirmEmail(company.companyEmail);
      } else {
        router.replace(site.manufacturer.register);
        router.refresh();
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (confirmEmail) {
    return (
      <div className="mx-auto max-w-[520px] py-10 text-center" role="status">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Check your e-mail</h1>
        <p className="mt-3 text-base leading-relaxed text-body">
          We sent a confirmation link to <span className="font-semibold text-ink">{confirmEmail}</span>. Click it, sign
          in, and you can upload your verification documents. We keep the company details you just entered.
        </p>
        <Link
          href={`${site.links.login}?as=manufacturer`}
          className="mt-6 inline-block text-base font-semibold text-retail hover:text-retail-dark hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <header>
        <h1 className="text-[17px] font-semibold tracking-normal text-ink">Register your Company</h1>
        <p className="mt-0.5 text-xs text-body">
          Provide your company details so we can verify your business. You will upload your registration documents
          next.
        </p>
      </header>

      <div className="mt-6 space-y-7 px-0 sm:px-1">
        <section className="space-y-5">
          <SectionTitle>Company Details</SectionTitle>
          <TextInput label="Company Name" name="company" autoComplete="organization" placeholder="Fedoz Nig Ltd" error={errors.company} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput label="Company E-mail" name="companyEmail" type="email" autoComplete="email" placeholder="fedoznigltd@gmail.com" error={errors.companyEmail} />
            <TextInput label="Company Phone" name="companyPhone" type="tel" autoComplete="tel" placeholder="+234-806-0067-556" error={errors.companyPhone} />
          </div>
          <TextInput label="Company Address" name="address" autoComplete="street-address" placeholder="12 Industrial Avenue" error={errors.address} />
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectInput
              label="State"
              name="state"
              required
              defaultValue=""
              placeholder="Lagos"
              options={NIGERIAN_STATES}
              error={errors.state}
              onChange={(event) => setState(event.target.value)}
            />
            <Field label="City" error={errors.city}>
              {({ id, invalid, describedBy }) => (
                <>
                  <input
                    id={id}
                    name="city"
                    list={`${id}-cities`}
                    autoComplete="address-level2"
                    placeholder="Ikeja"
                    aria-invalid={invalid}
                    aria-describedby={describedBy}
                    className={`${controlClass} ${errors.city ? "border-danger" : "border-field-border"}`}
                  />
                  <datalist id={`${id}-cities`}>
                    {(NIGERIA[state] ?? []).map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </>
              )}
            </Field>
          </div>
        </section>

        <section className="space-y-5">
          <SectionTitle>Registration Details</SectionTitle>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput label="RC Number" name="rcNumber" placeholder="RC 00000" error={errors.rcNumber} />
            <TextInput label="Tax Identification Number" name="tin" inputMode="numeric" placeholder="0000-002-002" error={errors.tin} />
          </div>
          <TextInput
            label="Regulatory Registration Number (if applicable)"
            name="regulatoryNumber"
            placeholder="e.g. product or facility registration numbers"
            error={errors.regulatoryNumber}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectInput label="Year Incorporated" name="yearIncorporated" required defaultValue="" placeholder="2015" options={YEARS} error={errors.yearIncorporated} />
            <SelectInput label="Number of Staff" name="staffRange" required defaultValue="" placeholder="1-20" options={STAFF_RANGES} error={errors.staffRange} />
          </div>
          <SelectInput label="Product Category" name="category" required defaultValue="" placeholder="Alcoholic beverages" options={MANUFACTURER_CATEGORIES} error={errors.category} />
        </section>

        <section className="space-y-5">
          <SectionTitle>Contact Person</SectionTitle>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput label="Full Name" name="contactName" autoComplete="name" placeholder="John Doe" error={errors.contactName} />
            <TextInput label="Contact Detail" name="contactPhone" type="tel" autoComplete="tel" placeholder="080-008-5567" error={errors.contactPhone} />
          </div>
          <SelectInput label="Role in the Company" name="contactRole" required defaultValue="" placeholder="Managing Director" options={CONTACT_ROLES} error={errors.contactRole} />
        </section>

        <section className="space-y-5">
          <SectionTitle>Create your Account</SectionTitle>
          <p className="-mt-2 text-sm text-body">You will sign in with your company e-mail and this password.</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <PasswordInput label="Password" name="password" autoComplete="new-password" placeholder="At least 8 characters" error={errors.password} />
            <PasswordInput label="Confirm Password" name="confirmPassword" autoComplete="new-password" placeholder="Repeat password" error={errors.confirmPassword} />
          </div>
        </section>

        <div>
          <label className="flex items-start gap-3 text-[13px] leading-snug text-ink">
            <input
              type="checkbox"
              name="agree"
              aria-invalid={errors.agree ? true : undefined}
              className="mt-0.5 size-[18px] shrink-0 rounded-[3px] border-field-border accent-retail"
            />
            I confirm the information is accurate, and I agree to the Terms of Use and Privacy Policy
          </label>
          {errors.agree ? (
            <p role="alert" className="mt-1.5 text-sm text-danger">
              {errors.agree}
            </p>
          ) : null}
        </div>

        {formError ? (
          <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {formError}
          </p>
        ) : null}

        <div className="pb-4">
          <SubmitButton pending={pending}>Continue to documents</SubmitButton>
          <p className="mt-4 text-center text-xs text-body">
            Already registered?{" "}
            <Link href={`${site.links.login}?as=manufacturer`} className="font-semibold text-retail hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </form>
  );
}
