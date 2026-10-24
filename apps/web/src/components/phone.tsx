import type { ReactNode } from "react";

/** Phone frame from the design: 248x500, 10px bezel, 36px outer radius. */
export function Phone({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex h-[500px] w-[248px] shrink-0 flex-col overflow-hidden rounded-[36px] border-[10px] border-ink bg-white shadow-[0_32px_64px_-8px_rgba(15,31,23,0.5)] ${className}`}
    >
      {children}
    </div>
  );
}
