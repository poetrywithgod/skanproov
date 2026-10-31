import type { ComponentProps, ReactNode } from "react";

export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="size-5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type PrimaryButtonProps = Omit<ComponentProps<"button">, "children"> & {
  pending?: boolean;
  children: ReactNode;
};

export function PrimaryButton({ pending = false, children, className, ...props }: PrimaryButtonProps) {
  return (
    <button
      {...props}
      disabled={pending || props.disabled}
      aria-busy={pending || undefined}
      className={`flex h-[54px] items-center justify-center gap-3 rounded-xl bg-brand px-6 text-[15px] font-semibold text-white shadow-[0_6px_14px_-4px_rgba(10,122,74,0.45)] transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-70 ${className ?? ""}`}
    >
      {pending ? <Spinner /> : children}
    </button>
  );
}
