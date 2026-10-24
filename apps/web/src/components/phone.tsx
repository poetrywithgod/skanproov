import type { ReactNode } from "react";

export function Phone({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`w-48 overflow-hidden rounded-[2rem] border-[6px] border-ink bg-white shadow-2xl md:w-56 ${className}`}
    >
      {children}
    </div>
  );
}
