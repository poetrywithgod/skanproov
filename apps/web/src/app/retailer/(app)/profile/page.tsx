import type { Metadata } from "next";
import Link from "next/link";
import { signOutAction } from "@/app/(customer)/profile/actions";
import {
  ChevronRightIcon,
  HelpIcon,
  LifebuoyIcon,
  LockIcon,
  PhoneIcon,
  ShieldIcon,
  SignOutIcon,
} from "@/components/app/app-icons";
import { RetailerHeader } from "@/components/retailer/retailer-header";
import { StoreIcon } from "@/components/retailer/icons";
import { getProfileChange, getRetailerContext } from "@/lib/retailer/data";
import { REPORT_PATH } from "@/lib/retailer/paths";
import { site } from "@/lib/site";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

const BRANCH_STATUS = {
  approved: { label: "Approved", className: "bg-retail-soft text-retail-dark" },
  pending: { label: "Waiting for approval", className: "bg-[#fdf0dc] text-[#7a4a05]" },
  rejected: { label: "Not approved", className: "bg-danger-soft text-danger" },
} as const;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white">
      <h2 className="px-4 py-3.5 text-[15px] font-bold tracking-normal text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start justify-between gap-5 border-t border-row-line px-4 py-3.5 text-[15px] leading-[1.4]">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className={`break-words text-right font-semibold ${value ? "text-ink" : "text-[#8f9496]"}`}>{value ?? "Not added"}</dd>
    </div>
  );
}

function LinkRow({ href, label, hint, Icon }: { href: string; label: string; hint?: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-t border-row-line px-4 py-3.5 transition-colors hover:bg-[#f9fbf9] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-retail"
    >
      <Icon className="size-5 shrink-0 text-retail" />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-ink">{label}</span>
        {hint ? <span className="block truncate text-[13px] text-body">{hint}</span> : null}
      </span>
      <ChevronRightIcon className="size-5 shrink-0 text-[#8f9496]" />
    </Link>
  );
}

export default async function RetailerProfilePage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  const [user, shop, change] = await Promise.all([requireUser(), getRetailerContext(), getProfileChange()]);

  return (
    <>
      <RetailerHeader />
      <div className="space-y-3 px-4 pb-4 pt-5">
        <section className="flex items-center gap-3.5 rounded-2xl border border-line bg-white p-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-retail-soft text-retail-dark">
            <StoreIcon className="size-7" />
          </span>
          <div className="min-w-0">
            <h1 className="break-words text-lg font-bold leading-snug text-ink">{shop?.businessName}</h1>
            <p className="truncate text-[13px] text-body">{user.fullName ?? user.email}</p>
          </div>
        </section>

        {sent === "1" ? (
          <p role="status" className="rounded-2xl bg-retail-soft px-4 py-3 text-sm leading-[1.5] text-retail-dark">
            Sent. A Super Admin will check your changes before they apply.
          </p>
        ) : null}

        <Card title="Business profile">
          <dl>
            <Detail label="Business name" value={shop?.businessName ?? null} />
            <Detail label="Type of store" value={shop?.storeType ?? null} />
            <Detail label="RC number" value={shop?.rcNumber ?? null} />
          </dl>
          {change?.status === "pending" ? (
            <p className="border-t border-row-line bg-[#fdf6e9] px-4 py-3 text-[13px] leading-[1.5] text-[#7a4a05]">
              Changes waiting for review: {change.businessName}, {change.storeType}
              {change.rcNumber ? `, RC ${change.rcNumber}` : ""}.
            </p>
          ) : null}
          {change?.status === "rejected" ? (
            <p className="border-t border-row-line bg-danger-soft px-4 py-3 text-[13px] leading-[1.5] text-danger">
              Your last changes were not approved.{change.reviewNote ? ` ${change.reviewNote}` : ""}
            </p>
          ) : null}
          <LinkRow href={site.retailer.businessProfile} label="Edit business details" hint="Checked by a Super Admin before they apply" Icon={StoreIcon} />
        </Card>

        <Card title="Branches">
          <ul>
            {shop?.branches.map((b) => (
              <li key={b.id} className="flex items-start justify-between gap-3 border-t border-row-line px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-ink">{b.name}</p>
                  <p className="text-[13px] text-body">
                    {b.address}, {b.city}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${BRANCH_STATUS[b.status].className}`}>
                  {BRANCH_STATUS[b.status].label}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Contact and security">
          <LinkRow href={site.links.editProfile} label="Your name and phone" hint={user.email} Icon={PhoneIcon} />
          <LinkRow href={site.links.changePassword} label="Change password" Icon={LockIcon} />
          <LinkRow href={site.links.twoFactor} label="Two-factor sign-in" hint={user.twoFactorOn ? "On" : "Off"} Icon={ShieldIcon} />
          <LinkRow href={site.links.appLock} label="App lock" Icon={LockIcon} />
        </Card>

        <Card title="Support">
          <LinkRow href={site.links.help} label="Help" Icon={HelpIcon} />
          <LinkRow href={REPORT_PATH} label="Report a problem" Icon={LifebuoyIcon} />
        </Card>

        <form action={signOutAction}>
          <button
            type="submit"
            className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl border border-line-strong bg-white text-[15px] font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail"
          >
            <SignOutIcon className="size-5" />
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}
