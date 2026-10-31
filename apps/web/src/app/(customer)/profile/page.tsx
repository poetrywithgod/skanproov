import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/user";
import { signOutAction } from "./actions";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default async function ProfilePage() {
  const user = await requireUser();
  const rows: [string, string][] = [
    ["Name", user.fullName ?? "—"],
    ["E-mail", user.email ?? "—"],
    ["Phone", user.phone ?? "—"],
  ];

  return (
    <div className="space-y-5 px-5 pt-5">
      <h1 className="text-2xl font-bold tracking-normal text-ink">Profile</h1>
      <dl className="rounded-2xl bg-white px-4 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
        {rows.map(([label, value]) => (
          <div key={label} className="border-b border-line py-3.5 last:border-b-0">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-0.5 break-words text-[15px] font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <form action={signOutAction}>
        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center rounded-xl border border-field-border bg-white text-sm font-semibold text-ink hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-brand"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
