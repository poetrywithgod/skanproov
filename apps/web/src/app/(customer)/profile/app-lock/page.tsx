import type { Metadata } from "next";
import { AppLockSettings } from "@/components/app/app-lock-settings";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "App lock", robots: { index: false } };

export default async function AppLockPage() {
  const user = await requireUser();
  return (
    <div className="space-y-4 px-3 pb-4 pt-5">
      <div className="px-2">
        <h1 className="text-[26px] font-bold leading-8 tracking-normal text-ink">App lock</h1>
        <p className="mt-0.5 text-[13px] text-body">Require your fingerprint, face or phone PIN to open the app.</p>
      </div>
      <AppLockSettings user={{ id: user.id, email: user.email, name: user.fullName ?? "" }} />
    </div>
  );
}
