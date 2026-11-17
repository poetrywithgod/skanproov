import type { Metadata } from "next";
import Link from "next/link";
import { signOutAction } from "@/app/(customer)/profile/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { AcceptInvite } from "@/components/manufacturer/join/accept-invite";
import { roleLabel } from "@/lib/manufacturer/team-shared";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Join your team", robots: { index: false } };

const PRIMARY =
  "flex h-12 w-full items-center justify-center rounded-xl bg-retail text-[15px] font-semibold text-white transition hover:bg-retail-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail";
const SECONDARY =
  "flex h-12 w-full items-center justify-center rounded-xl border border-field-border bg-white text-[15px] font-semibold text-ink transition hover:bg-pill focus-visible:outline-2 focus-visible:outline-retail";

const PROBLEM: Record<string, string> = {
  used: "This invitation has already been used.",
  cancelled: "This invitation was cancelled.",
  expired: "This invitation has expired.",
};

/** The page an invitation link opens: who invited you, then sign in (or create an account) and join. */
export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = /^[0-9a-f]{20,64}$/.test(token);

  let invite: { company: string; role: string; email: string; full_name: string; state: string } | null = null;
  if (valid) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("invite_preview", { p_token: token });
    invite = data?.[0] ?? null;
  }

  if (!invite || invite.state !== "valid") {
    return (
      <AuthShell title="Invitation" subtitle="Join your company on SKANPROOV.">
        <div role="status" className="mt-8 rounded-xl bg-surface-soft px-5 py-6 text-center">
          <p className="text-base font-semibold text-ink">{invite ? (PROBLEM[invite.state] ?? "This invitation can't be used.") : "This invitation link is not valid."}</p>
          <p className="mt-2 text-sm text-body">Ask the administrator at your company to send you a new link.</p>
        </div>
      </AuthShell>
    );
  }

  const user = await getCurrentUser();
  const here = `${site.manufacturer.join}/${token}`;
  const next = encodeURIComponent(here);
  const sameEmail = user ? user.email.toLowerCase() === invite.email.toLowerCase() : false;

  return (
    <AuthShell title={`Join ${invite.company}`} subtitle={`You've been invited as ${roleLabel(invite.role)}.`}>
      <div className="mt-6 rounded-xl border border-line bg-surface-soft px-4 py-3.5 text-sm">
        <p className="text-body">Invitation for</p>
        <p className="mt-0.5 font-semibold text-ink">{invite.full_name}</p>
        <p className="text-body">{invite.email}</p>
      </div>

      {!user ? (
        <div className="mt-6 space-y-3">
          <Link href={`${site.links.login}?next=${next}`} className={PRIMARY}>
            Sign in to join
          </Link>
          <Link href={`${site.links.register}?next=${next}`} className={SECONDARY}>
            Create an account
          </Link>
          <p className="text-center text-xs leading-relaxed text-muted">
            Use the e-mail address above. If you create an account, confirm your e-mail first, then open this link again.
          </p>
        </div>
      ) : sameEmail ? (
        <AcceptInvite token={token} company={invite.company} />
      ) : (
        <div className="mt-6">
          <p role="alert" className="rounded-lg bg-warn-soft px-3.5 py-2.5 text-sm text-warn">
            You are signed in as {user.email}. This invitation is for {invite.email}.
          </p>
          <form action={signOutAction} className="mt-4">
            <button type="submit" className={SECONDARY}>
              Sign out and use another account
            </button>
          </form>
        </div>
      )}
    </AuthShell>
  );
}
