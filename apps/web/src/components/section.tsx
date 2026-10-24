import type { ReactNode } from "react";

type Props = {
  id?: string;
  tone?: "white" | "tint" | "dark" | "brand";
  /** Vertical padding of the section. */
  className?: string;
  children: ReactNode;
};

const tones = {
  white: "bg-white text-ink",
  tint: "bg-tint text-ink",
  dark: "bg-ink text-white",
  brand: "bg-brand text-white",
} as const;

export function Section({ id, tone = "white", className = "py-14 md:py-24", children }: Props) {
  return (
    <section id={id} className={`${tones[tone]} scroll-mt-[65px]`}>
      <div className={`mx-auto max-w-6xl px-6 ${className}`}>{children}</div>
    </section>
  );
}
