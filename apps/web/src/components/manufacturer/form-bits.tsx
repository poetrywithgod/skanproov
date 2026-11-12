"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";

export const controlClass =
  "block h-12 w-full rounded-[4px] border bg-white px-5 text-base text-ink outline-none transition " +
  "placeholder:text-field-placeholder focus:border-retail focus:ring-4 focus:ring-retail/15 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

/** A section heading with a rule under it, like "Company Details". */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="border-b border-line-strong pb-2 text-[17px] font-medium tracking-normal text-ink">{children}</h2>
  );
}

type FieldProps = {
  label: string;
  error?: string | undefined;
  children: (props: { id: string; invalid: true | undefined; describedBy: string | undefined }) => ReactNode;
};

/** A label above a control, with the error under it. The control gets the ids it needs. */
export function Field({ label, error, children }: FieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2.5 block text-base text-ink">
        {label}
      </label>
      {children({ id, invalid: error ? true : undefined, describedBy: error ? `${id}-error` : undefined })}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  label,
  error,
  className,
  ...props
}: Omit<ComponentProps<"input">, "id"> & { label: string; error?: string | undefined }) {
  return (
    <Field label={label} error={error}>
      {({ id, invalid, describedBy }) => (
        <input
          {...props}
          id={id}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={`${controlClass} ${error ? "border-danger" : "border-field-border"} ${className ?? ""}`}
        />
      )}
    </Field>
  );
}

function Chevron() {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-muted"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function SelectInput({
  label,
  error,
  placeholder,
  options,
  className,
  ...props
}: Omit<ComponentProps<"select">, "id" | "children"> & {
  label: string;
  error?: string | undefined;
  placeholder: string;
  options: readonly string[];
}) {
  return (
    <Field label={label} error={error}>
      {({ id, invalid, describedBy }) => (
        <div className="relative">
          <select
            {...props}
            id={id}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={`${controlClass} cursor-pointer appearance-none pr-12 invalid:text-field-placeholder ${
              error ? "border-danger" : "border-field-border"
            } ${className ?? ""}`}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((option) => (
              <option key={option} value={option} className="text-ink">
                {option}
              </option>
            ))}
          </select>
          <Chevron />
        </div>
      )}
    </Field>
  );
}

export function PasswordInput({
  label,
  error,
  className,
  ...props
}: Omit<ComponentProps<"input">, "id" | "type"> & { label: string; error?: string | undefined }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} error={error}>
      {({ id, invalid, describedBy }) => (
        <div className="relative">
          <input
            {...props}
            id={id}
            type={visible ? "text" : "password"}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={`${controlClass} pr-12 ${error ? "border-danger" : "border-field-border"} ${className ?? ""}`}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-ink hover:text-retail-dark focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-retail"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {visible ? null : <path d="m3 3 18 18" />}
            </svg>
          </button>
        </div>
      )}
    </Field>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mx-auto block h-14 w-full max-w-[640px] rounded-[4px] bg-retail text-xl font-medium text-white transition hover:bg-retail-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}
