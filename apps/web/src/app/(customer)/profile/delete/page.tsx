import type { Metadata } from "next";
import { DeleteAccountForm } from "@/components/app/delete-account-form";
import { getPoints } from "@/lib/customer/home-data";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Delete account", robots: { index: false } };

export default async function DeleteAccountPage() {
  const user = await requireUser();
  const points = await getPoints();
  return (
    <div className="space-y-4 px-3 pb-4 pt-5">
      <div className="px-2">
        <h1 className="text-[26px] font-bold leading-8 tracking-normal text-danger">Delete account</h1>
        <p className="mt-1 text-[13px] leading-[1.5] text-body">
          This is permanent and can&apos;t be undone. It removes your sign-in, your profile, your scan history and your
          notifications
          {points > 0 ? `, and you lose your ${points.toLocaleString("en-NG")} unredeemed points` : ""}. Reports you have
          sent stay with us, without your name.
        </p>
      </div>
      <DeleteAccountForm email={user.email} />
    </div>
  );
}
