import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppLockGate } from "@/components/app/app-lock-gate";
import { RetailerNav } from "@/components/retailer/retailer-nav";
import { getRetailerContext } from "@/lib/retailer/data";
import { site } from "@/lib/site";
import { requireUser } from "@/lib/supabase/user";

/**
 * Frame for the retailer app. Signed-in shop owners only; someone who has not registered a
 * shop yet is sent to do that first.
 */
export default async function RetailerLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const shop = await getRetailerContext();
  if (!shop) redirect(site.retailer.register);

  return (
    <AppLockGate userId={user.id}>
      <div className="min-h-dvh bg-[#eef1ee]">
        <div className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface-soft sm:shadow-[0_0_0_1px_rgba(15,31,23,0.05),0_8px_32px_rgba(15,31,23,0.08)]">
          <main className="flex-1 pb-32">{children}</main>
          <RetailerNav />
        </div>
      </div>
    </AppLockGate>
  );
}
