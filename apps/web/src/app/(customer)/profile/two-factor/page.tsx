import type { Metadata } from "next";
import { TwoFactorPanel } from "@/components/app/two-factor-panel";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Two-factor authentication", robots: { index: false } };

export default async function TwoFactorPage() {
  await requireUser();
  return (
    <div className="space-y-4 px-3 pb-4 pt-5">
      <div className="px-2">
        <h1 className="text-[26px] font-bold leading-8 tracking-normal text-ink">Two-factor authentication</h1>
        <p className="mt-0.5 text-[13px] text-body">Protect your account with a code from an authenticator app.</p>
      </div>
      <TwoFactorPanel />
    </div>
  );
}
