import type { ReactNode } from "react";
import { AppHeader } from "@/components/app/app-header";
import { BottomNav } from "@/components/app/bottom-nav";
import { getCurrentUser, type CurrentUser } from "@/lib/supabase/user";

/** Scanning works without an account, so a failure to look up the person must not break the screen. */
async function safeUser(): Promise<CurrentUser | null> {
  try {
    return await getCurrentUser();
  } catch (error) {
    // Next.js uses thrown signals (dynamic rendering, redirects). Those must not be swallowed.
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("Could not load the current user", error);
    return null;
  }
}

/**
 * Mobile-first frame for the customer app. On wider screens the same phone-width column is
 * centred; the desktop layout comes with the desktop designs.
 */
export default async function CustomerLayout({ children }: { children: ReactNode }) {
  const user = await safeUser();

  return (
    <div className="min-h-dvh bg-[#eef1ee]">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface-soft sm:shadow-[0_0_0_1px_rgba(15,31,23,0.05),0_8px_32px_rgba(15,31,23,0.08)]">
        <AppHeader user={user} />
        <main className="flex-1 pb-32">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
