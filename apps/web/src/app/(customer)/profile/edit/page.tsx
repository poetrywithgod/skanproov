import type { Metadata } from "next";
import { EditProfileForm } from "@/components/app/edit-profile-form";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Edit personal details", robots: { index: false } };

export default async function EditProfilePage() {
  const user = await requireUser();
  return (
    <div className="space-y-4 px-3 pb-4 pt-5">
      <div className="px-2">
        <h1 className="text-[26px] font-bold leading-8 tracking-normal text-ink">Personal details</h1>
        <p className="mt-0.5 text-[13px] text-body">Update the name and phone number on your account.</p>
      </div>
      <EditProfileForm userId={user.id} fullName={user.fullName ?? ""} phone={user.phone ?? ""} email={user.email} />
    </div>
  );
}
