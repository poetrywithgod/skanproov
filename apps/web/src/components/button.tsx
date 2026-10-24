import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const variants = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  dark: "bg-ink text-white hover:bg-black",
  outline: "border border-line bg-white text-ink hover:bg-tint",
  light: "bg-white text-ink hover:bg-tint",
} as const;

type Props = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: keyof typeof variants;
  children: ReactNode;
};

export function ButtonLink({ variant = "primary", children, ...props }: Props) {
  return (
    <Link
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${variants[variant]}`}
    >
      {children}
    </Link>
  );
}
