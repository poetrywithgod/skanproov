import type { Metadata } from "next";
import Link from "next/link";
import { InviteMemberButton } from "@/components/manufacturer/portal/team/invite-dialog";
import { MembersView, type MemberListRow } from "@/components/manufacturer/portal/team/members-view";
import { MemberPanel, type PanelData } from "@/components/manufacturer/portal/team/member-panel";
import { NoAccess } from "@/components/manufacturer/portal/team/no-access";
import { RolesTable } from "@/components/manufacturer/portal/team/roles-table";
import { PageHeading } from "@/components/manufacturer/portal/products/bits";
import { PortalTopBar } from "@/components/manufacturer/portal/portal-top-bar";
import { ChevronIcon } from "@/components/manufacturer/portal/icons";
import { can, getManufacturerContext } from "@/lib/manufacturer/portal";
import { getPermissionMatrix, getTeam, getTeamDetail } from "@/lib/manufacturer/team";
import { fmtDate, fmtDateTime, timeAgo } from "@/lib/manufacturer/team-shared";
import { site } from "@/lib/site";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Team Management", robots: { index: false } };

type SearchParams = { tab?: string; member?: string };

export default async function TeamPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { tab, member } = await searchParams;
  const manufacturer = await getManufacturerContext();
  if (!can(manufacturer, "manage_team")) return <NoAccess title="Team Management" what="You can't open Team Management" />;

  const [user, team, matrix] = await Promise.all([requireUser(), getTeam(), getPermissionMatrix()]);
  const now = Date.now();
  const rolesTab = tab === "roles";

  const rows: MemberListRow[] = team.map((t) => ({
    key: t.key,
    kind: t.kind,
    fullName: t.fullName,
    email: t.email,
    role: t.role,
    status: t.status,
    lastActive: t.kind === "invite" ? "—" : t.lastSeenAt ? timeAgo(t.lastSeenAt, now) : "Never",
    isYou: t.kind === "member" && t.key === user.id,
  }));
  const active = team.filter((t) => t.status === "active").length;
  const invited = team.filter((t) => t.status === "pending" || t.status === "expired").length;

  // The open panel (?member=member:<id> or invite:<id>).
  let panel: PanelData | null = null;
  const [kind, key] = (member ?? "").split(":");
  if ((kind === "member" || kind === "invite") && key && team.some((t) => t.kind === kind && t.key === key)) {
    const d = await getTeamDetail(kind, key);
    if (d) {
      panel = {
        kind: d.kind,
        key: d.key,
        fullName: d.fullName,
        email: d.email,
        phone: d.phone,
        role: d.role,
        status: d.status,
        lastActive: d.lastSeenAt ? timeAgo(d.lastSeenAt, now) : "never",
        invited: d.invitedAt ? `${fmtDate(d.invitedAt)} by ${d.invitedByName ?? "SKANPROOV onboarding"}` : d.invitedByName ? `By ${d.invitedByName}` : "By SKANPROOV onboarding",
        joined: d.joinedAt ? fmtDate(d.joinedAt) : null,
        expires: d.expiresAt ? fmtDate(d.expiresAt) : null,
        twoFactor: d.twoFactor,
        activity: d.activity.map((a) => ({ summary: a.summary, when: fmtDateTime(a.createdAt) })),
        isYou: d.kind === "member" && d.key === user.id,
      };
    }
  }

  const tabClass = (on: boolean) =>
    `-mb-px inline-block border-b-2 px-1 pb-3 text-[15px] font-medium transition ${on ? "border-retail text-retail-dark" : "border-transparent text-body hover:text-ink"}`;

  return (
    <>
      <PortalTopBar title="Team Management" />
      <main className="px-5 py-6 sm:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted">
          <span>Overview</span>
          <ChevronIcon className="size-3.5 rotate-180" />
          <span aria-current="page" className="font-medium text-retail">Team Management</span>
        </nav>
        <PageHeading
          title="Team Management"
          subtitle={`Control who can access the portal and what they can do. ${active} ${active === 1 ? "member" : "members"}${invited ? ` · ${invited} ${invited === 1 ? "invitation" : "invitations"} waiting` : ""}.`}
          action={<InviteMemberButton />}
        />

        <div className="mt-6 flex gap-8 border-b border-line" role="tablist" aria-label="Team sections">
          <Link role="tab" aria-selected={!rolesTab} href={site.manufacturer.team} className={tabClass(!rolesTab)}>
            Members
          </Link>
          <Link role="tab" aria-selected={rolesTab} href={`${site.manufacturer.team}?tab=roles`} className={tabClass(rolesTab)}>
            Roles &amp; permissions
          </Link>
        </div>

        {rolesTab ? <RolesTable matrix={matrix} /> : <MembersView rows={rows} />}
      </main>
      {panel ? <MemberPanel key={`${panel.kind}-${panel.key}`} data={panel} matrix={matrix} /> : null}
    </>
  );
}
