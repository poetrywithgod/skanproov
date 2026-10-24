import type { ReactNode } from "react";

export function Phone({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`w-[40vw] max-w-40 overflow-hidden rounded-[2rem] border-[6px] border-ink bg-white shadow-2xl sm:w-48 sm:max-w-none md:w-56 ${className}`}
    >
      {children}
    </div>
  );
}
