import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

const POINTS = [
  "See where your Products are scanned",
  "Respond to fraud cases on your batches",
  "Connect with verified retailers",
] as const;

/** Green side panel with the SKANPROOV logo, and a white card on the right for the form. */
export function CompanyShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-[31fr_69fr]">
      <aside className="flex flex-col bg-retail lg:sticky lg:top-0 lg:h-dvh">
        <div className="bg-white px-6 py-4 lg:px-12 lg:py-5">
          <Logo className="h-14 lg:h-[88px]" />
        </div>
        <div className="hidden flex-1 flex-col justify-center px-12 pb-24 text-white lg:flex">
          <p className="max-w-[260px] text-[26px] font-medium leading-[1.2] tracking-tight">
            Protect Your Goods from Counterfeits
          </p>
          <ul className="mt-4 space-y-2 text-[13px]">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2.5">
                <span aria-hidden="true" className="size-[7px] shrink-0 rounded-full bg-white" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="bg-surface-soft px-3 py-4 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-[1000px] rounded-sm bg-white px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div>
      </section>
    </main>
  );
}
