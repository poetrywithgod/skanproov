import type { Metadata } from "next";
import { signOutAction } from "@/app/(customer)/profile/actions";
import { SignOutIcon } from "@/components/app/app-icons";
import { StoreIcon } from "@/components/retailer/icons";
import { getRetailerContext } from "@/lib/retailer/data";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

const STATUS = {
  approved: { label: "Approved", className: "bg-brand-soft text-brand-deep" },
  pending: { label: "Waiting for approval", className: "bg-[#fdf0dc] text-[#7a4a05]" },
  rejected: { label: "Not approved", className: "bg-danger-soft text-danger" },
} as const;

export default async function RetailerProfilePage() {
  const [user, shop] = await Promise.all([requireUser(), getRetailerContext()]);

  return (
    <div className="space-y-4 px-4 pb-4 pt-5">
      <section className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-deep">
          <StoreIcon className="size-6" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-normal text-ink">{shop?.businessName}</h1>
          <p className="truncate text-[13px] text-body">{user.fullName ?? user.email}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
      </section>

      <section aria-labelledby="branches" className="rounded-2xl bg-white p-4 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
        <h2 id="branches" className="text-base font-bold tracking-normal text-ink">
          Branches
        </h2>
        <ul className="mt-2 divide-y divide-line">
          {shop?.branches.map((b) => (
            <li key={b.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-ink">{b.name}</p>
                <p className="text-xs text-muted">
                  {b.address}, {b.city}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[b.status].className}`}>
                {STATUS[b.status].label}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <form action={signOutAction}>
        <button
          type="submit"
          className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl border border-line-strong bg-white text-[15px] font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <SignOutIcon className="size-5" />
          Sign out
        </button>
      </form>
    </div>
  );
}
