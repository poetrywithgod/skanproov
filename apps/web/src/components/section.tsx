import type { ReactNode } from "react";

type Props = {
  id?: string;
  tone?: "white" | "tint" | "dark" | "brand";
  children: ReactNode;
};

const tones = {
  white: "bg-white text-ink",
  tint: "bg-tint text-ink",
  dark: "bg-ink text-white",
  brand: "bg-brand text-white",
} as const;

export function Section({ id, tone = "white", children }: Props) {
  return (
    <section id={id} className={`${tones[tone]} scroll-mt-[65px]`}>
      <div className="mx-auto max-w-6xl px-5 py-14 md:py-24">{children}</div>
    </section>
  );
}
