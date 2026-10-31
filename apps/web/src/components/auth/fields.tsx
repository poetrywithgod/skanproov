"use client";

import { useId, useState, type ComponentProps } from "react";

type FieldBaseProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  error?: string | undefined;
};

const inputClass =
  "block h-11 w-full rounded-lg border bg-white px-3.5 text-[15px] text-ink outline-none transition " +
  "placeholder:text-field-placeholder focus:border-brand focus:ring-4 focus:ring-brand/15 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

function FieldShell({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-base font-semibold text-brand-900">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({ label, error, className, ...props }: FieldBaseProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error}>
      <input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputClass} ${error ? "border-danger" : "border-field-border"} ${className ?? ""}`}
      />
    </FieldShell>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      width="20"
      height="20"
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
      {off ? <path d="m3 3 18 18" /> : null}
    </svg>
  );
}

/** Password input with a show/hide toggle. `withToggle={false}` gives the plain field used on sign-in. */
export function PasswordField({
  label,
  error,
  className,
  withToggle = true,
  ...props
}: FieldBaseProps & { withToggle?: boolean }) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <FieldShell id={id} label={label} error={error}>
      <div className="relative">
        <input
          {...props}
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputClass} ${withToggle ? "pr-11" : ""} ${
            error ? "border-danger" : "border-field-border"
          } ${className ?? ""}`}
        />
        {withToggle ? (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-ink hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
          >
            <EyeIcon off={!visible} />
          </button>
        ) : null}
      </div>
    </FieldShell>
  );
}
