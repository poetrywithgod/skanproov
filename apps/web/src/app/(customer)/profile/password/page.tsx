import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/app/change-password-form";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Change password", robots: { index: false } };

export default async function ChangePasswordPage() {
  const user = await requireUser();
  return (
    <div className="space-y-4 px-3 pb-4 pt-5">
      <div className="px-2">
        <h1 className="text-[26px] font-bold leading-8 tracking-normal text-ink">Change password</h1>
        <p className="mt-0.5 text-[13px] text-body">Enter your current password, then choose a new one.</p>
      </div>
      <ChangePasswordForm email={user.email} />
    </div>
  );
}
