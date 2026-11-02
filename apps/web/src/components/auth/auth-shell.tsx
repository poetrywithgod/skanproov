import Image from "next/image";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

type AuthShellProps = {
  /** Sign-in sits on white; create-account sits on the soft grey from the design. */
  tone?: "white" | "soft";
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

/** Split-panel layout shared by every auth screen: photo on the left, form on the right. */
export function AuthShell({
  tone = "white",
  title = "Welcome to Skanproov",
  subtitle = "Sign in to manage your rewards, redeem airtime, and keep track of your scans.",
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-[51.5fr_48.5fr]">
      <div className="relative h-44 sm:h-60 lg:h-auto lg:min-h-dvh">
        <Image
          src="/images/auth-scan.jpg"
          alt="Scanning a QR code on a parcel with a phone"
          fill
          priority
          sizes="(min-width: 1024px) 52vw, 100vw"
          className="object-cover object-[50%_35%] lg:object-[50%_50%]"
        />
      </div>

      <section
        className={`flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-12 ${
          tone === "soft" ? "bg-surface-soft" : "bg-white"
        }`}
      >
        <div className="w-full max-w-[400px]">
          <header className="flex flex-col items-center text-center">
            <Logo className="h-16" />
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink-title">
              {title}
            </h1>
            <p className="mt-1.5 text-sm leading-snug text-ink-muted">{subtitle}</p>
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}
