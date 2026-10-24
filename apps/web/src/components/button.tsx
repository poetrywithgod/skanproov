import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const variants = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  dark: "bg-ink text-white hover:bg-black",
  outline: "border border-line bg-white text-ink hover:bg-tint",
  light: "bg-white text-ink hover:bg-tint",
} as const;

const sizes = {
  /** Header button: 40px tall */
  sm: "h-10 gap-2 rounded-[10px] px-[22px]",
  /** Hero and section buttons: 48px tall */
  lg: "h-12 gap-2 rounded-xl px-6",
} as const;

type Props = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({ variant = "primary", size = "lg", className = "", children, ...props }: Props) {
  return (
    <Link
      {...props}
      className={`inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
