import Link from "next/link";
import { signOutAction } from "@/app/(customer)/profile/actions";
import type { CurrentUser } from "@/lib/supabase/user";
import { site } from "@/lib/site";
import {
  AlertTriangleIcon,
  ChevronRightIcon,
  LifebuoyIcon,
  LockIcon,
  MegaphoneIcon,
  PhoneIcon,
  SignOutIcon,
  TargetIcon,
  TrashIcon,
  VerifiedBadge,
} from "./app-icons";

function initials(name: string | null, email: string | null): string {
  const source = (name ?? email ?? "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0]![0]! + parts[parts.length - 1]![0]! : source.slice(0, 2);
  return letters.toUpperCase();
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
      <h2 className="flex items-center gap-3 text-lg font-semibold tracking-normal text-ink">
        <span className="grid size-9 place-items-center rounded-lg bg-[#e6eee8] text-body">{icon}</span>
        {title}
      </h2>
      <div className="mt-3 divide-y divide-line">{children}</div>
    </section>
  );
}

function Soon() {
  return (
    <span className="shrink-0 rounded-full bg-[#e6eee8] px-2.5 py-1 text-[11px] font-semibold text-body">
      Coming soon
    </span>
  );
}

/** A setting that is designed but not built yet. Shown honestly, not as a working control. */
function SoonRow({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3.5 first:pt-1 last:pb-1">
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-ink">{title}</p>
        <p className="text-xs leading-[1.4] text-body">{hint}</p>
      </div>
      <Soon />
    </div>
  );
}

function LinkRow({
  href,
  icon,
  title,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 py-3.5 first:pt-1 last:pb-1">
      <span className="text-brand">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-ink">{title}</span>
        {hint ? <span className="block text-xs text-body">{hint}</span> : null}
      </span>
      <ChevronRightIcon className="size-5 text-muted" />
    </Link>
  );
}

export function ProfileView({
  user,
  saved = null,
  totalScans,
  points,
  blocked,
}: {
  user: CurrentUser;
  saved?: "details" | "password" | null;
  totalScans: number;
  points: number;
  blocked: number;
}) {
  const stats = [
    { label: "Total Scans", value: totalScans.toLocaleString("en-NG"), tone: "text-ink" },
    { label: "Reward PTS", value: points.toLocaleString("en-NG"), tone: "text-brand" },
    { label: "Blocked", value: blocked.toLocaleString("en-NG"), tone: "text-danger" },
  ];

  return (
    <div className="space-y-4 px-3 pb-4 pt-3">
      {saved ? (
        <p role="status" className="rounded-xl bg-brand-soft px-4 py-3 text-sm font-semibold text-brand-deep">
          {saved === "password" ? "Your password has been changed." : "Your details have been saved."}
        </p>
      ) : null}
      <section className="rounded-2xl bg-white p-4 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-full bg-brand text-lg font-bold text-white"
          >
            {initials(user.fullName, user.email)}
          </span>
          <div className="min-w-0">
            <h1 className="flex items-center gap-1.5 text-xl font-bold leading-6 tracking-normal text-ink">
              <span className="truncate">{user.fullName ?? "Your account"}</span>
              {user.emailConfirmed ? (
                <VerifiedBadge className="size-[18px] shrink-0 text-brand" aria-label="Verified account" />
              ) : null}
            </h1>
            {user.phone ? <p className="text-xs text-body">{user.phone}</p> : null}
            {user.email ? <p className="truncate text-xs text-body">{user.email}</p> : null}
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-[#e9eeea] px-2 py-3 text-center">
              <dd className={`text-xl font-bold leading-6 ${s.tone}`}>{s.value}</dd>
              <dt className="mt-1 text-[11px] text-body">{s.label}</dt>
            </div>
          ))}
        </dl>

        <Link
          href={site.links.editProfile}
          className="mt-3 flex items-center justify-end gap-0.5 text-[13px] font-bold text-brand hover:text-brand-deep"
        >
          Edit Personal Details
          <ChevronRightIcon className="size-4" strokeWidth={2.4} />
        </Link>
      </section>

      <Card icon={<LockIcon className="size-5" />} title="Sign-in & Security">
        <SoonRow title="Biometric App Unlock" hint="Face ID and fingerprint for Quick Verify" />
        <LinkRow
          href={site.links.changePassword}
          icon={<LockIcon className="size-5" />}
          title="Change Password"
          hint="Update the password you sign in with"
        />
        <SoonRow title="Two-Factor Authentication (2FA)" hint="A code sent to your phone at sign-in" />
      </Card>

      <Card icon={<TargetIcon className="size-5" />} title="Location & Geotagging">
        <SoonRow
          title="GPS Scan Geotagging"
          hint="Tie each scan to where it happened, to help spot cloned codes."
        />
        <SoonRow title="Counterfeit Cluster Proximity" hint="Get notified when entering reported high-risk markets" />
      </Card>

      <Card icon={<LifebuoyIcon className="size-5" />} title="Support & Enforcement">
        <LinkRow
          href={site.links.report}
          icon={<MegaphoneIcon className="size-5 text-danger" />}
          title="Report Fake Batch / Merchant"
          hint="Confidential regulatory whistleblower dispatch"
        />
        <LinkRow
          href={site.links.help}
          icon={<LifebuoyIcon className="size-5" />}
          title="Help Center & Verification FAQs"
          hint="Answers to common questions"
        />
        <div className="flex items-center gap-3 py-3.5 last:pb-1">
          <PhoneIcon className="size-5 text-brand" />
          <p className="min-w-0 flex-1 text-[15px] font-medium text-ink">24/7 Rapid Response Desk</p>
          <Soon />
        </div>
      </Card>

      <form action={signOutAction}>
        <button
          type="submit"
          className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-[#e3ebe5] text-[15px] font-semibold text-ink transition-colors hover:bg-[#d8e3dc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <SignOutIcon className="size-5" />
          Sign Out of SKANPROOV
        </button>
      </form>

      <section className="rounded-2xl bg-danger-soft p-4">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-danger">
          <AlertTriangleIcon className="size-5" />
          Danger Zone
        </h2>
        <p className="mt-3 text-[13px] leading-[1.5] text-body">
          Permanently removes your scan history and notifications, and forfeits your unredeemed{" "}
          {points.toLocaleString("en-NG")} points balance.
        </p>
        <Link
          href={site.links.deleteAccount}
          className="mt-3 inline-flex items-center gap-2 text-[13px] font-semibold text-danger underline"
        >
          <TrashIcon className="size-4" />
          Request Account Deletion
        </Link>
      </section>
    </div>
  );
}
