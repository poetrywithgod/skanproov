"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cancelInviteAction, changeRoleAction, reissueInviteAction, revokeMemberAction } from "@/app/manufacturer/(portal)/team/actions";
import { site } from "@/lib/site";
import { initialsOf, roleLabel, type MemberStatus, type PermissionMatrix } from "@/lib/manufacturer/team-shared";
import { Avatar, PermissionGrid, RoleCards, TeamStatusPill } from "./bits";
import { CopyLink } from "./copy-link";

/** Everything the panel shows, already formatted on the server. */
export interface PanelData {
  kind: "member" | "invite";
  key: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  status: MemberStatus;
  lastActive: string;
  invited: string;
  joined: string | null;
  expires: string | null;
  twoFactor: boolean;
  activity: { summary: string; when: string }[];
  isYou: boolean;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-row-line py-3 text-sm last:border-b-0">
      <dt className="text-body">{label}</dt>
      <dd className="text-right font-medium text-ink">{children}</dd>
    </div>
  );
}

function Confirm({
  title,
  body,
  confirmLabel,
  keepLabel,
  pending,
  error,
  onConfirm,
  onKeep,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  keepLabel: string;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onKeep: () => void;
}) {
  const keep = useRef<HTMLButtonElement>(null);
  useEffect(() => keep.current?.focus(), []);
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-night/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && !pending && onKeep()}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-body" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_20px_50px_rgba(15,31,23,0.3)]">
        <h3 id="confirm-title" className="text-lg font-semibold text-ink">{title}</h3>
        <p id="confirm-body" className="mt-3 text-[15px] leading-relaxed text-body">{body}</p>
        {error ? <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <button ref={keep} type="button" onClick={onKeep} disabled={pending} className="h-11 rounded-lg border border-field-border bg-white px-5 text-sm font-semibold text-ink hover:bg-pill disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-retail">
            {keepLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={pending} className="h-11 rounded-lg bg-[#c4221a] px-5 text-sm font-semibold text-white hover:bg-[#a81c15] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c4221a]">
            {pending ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** The side panel for one person (?member=kind:key): details, role, recent activity, and the actions. */
export function MemberPanel({ data, matrix }: { data: PanelData; matrix: PermissionMatrix }) {
  const router = useRouter();
  const [role, setRole] = useState(data.role);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"revoke" | "cancel" | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [linkPending, setLinkPending] = useState(false);
  const closeRef = useRef<HTMLAnchorElement>(null);

  const isMember = data.kind === "member";
  const isInvite = data.kind === "invite";
  const canEditRole = isMember && !data.isYou && data.status === "active";
  const changed = role !== data.role;

  // A fresh page of data (after saving) resets the form to what the database now says.
  useEffect(() => setRole(data.role), [data.role, data.key]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !confirm) router.push(site.manufacturer.team, { scroll: false });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, confirm]);

  async function saveRole() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const result = await changeRoleAction(data.key, role);
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.message);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function runConfirmed() {
    setConfirmPending(true);
    setConfirmError(null);
    try {
      const result = confirm === "revoke" ? await revokeMemberAction(data.key) : await cancelInviteAction(data.key);
      if (result.ok) {
        setConfirm(null);
        router.push(site.manufacturer.team, { scroll: false });
        router.refresh();
      } else {
        setConfirmError(result.message);
      }
    } catch {
      setConfirmError("Something went wrong. Please try again.");
    } finally {
      setConfirmPending(false);
    }
  }

  async function newLink() {
    setLinkPending(true);
    setError(null);
    try {
      const result = await reissueInviteAction(data.key);
      if (result.ok) setLink(`${window.location.origin}${site.manufacturer.join}/${result.token}`);
      else setError(result.message);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLinkPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <Link href={site.manufacturer.team} scroll={false} aria-label="Close panel" tabIndex={-1} className="absolute inset-0 bg-night/45" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-[520px] flex-col overflow-hidden bg-white shadow-[0_20px_50px_rgba(15,31,23,0.25)] sm:inset-y-6 sm:right-6 sm:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-row-line px-6 pb-4 pt-5">
          <div>
            <h2 id="panel-title" className="text-xl font-semibold text-ink">{data.fullName}</h2>
            <div className="mt-2">
              <TeamStatusPill status={data.status} />
            </div>
          </div>
          <Link ref={closeRef} href={site.manufacturer.team} scroll={false} aria-label="Close panel" className="grid size-9 place-items-center rounded-lg text-ink hover:bg-pill focus-visible:outline-2 focus-visible:outline-retail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="size-5" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </Link>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <Avatar initials={initialsOf(data.fullName)} size="lg" muted={data.status === "revoked"} />
            <div>
              <p className="text-[15px] font-semibold text-ink">{roleLabel(data.role)}</p>
              <p className="text-[13px] text-muted">{isMember ? `Last active ${data.lastActive}` : "Has not joined yet"}</p>
            </div>
          </div>

          <dl className="mt-5">
            <Row label="Email">{data.email}</Row>
            {data.phone ? <Row label="Phone">{data.phone}</Row> : null}
            <Row label="Invited">{data.invited}</Row>
            {isMember ? <Row label="Joined">{data.joined ?? "—"}</Row> : <Row label={data.status === "expired" ? "Expired" : "Expires"}>{data.expires ?? "—"}</Row>}
            {isMember ? <Row label="Two-factor auth">{data.twoFactor ? "Enabled" : "Not enabled"}</Row> : null}
          </dl>

          <h3 className="mt-7 text-[15px] font-semibold text-ink">Role &amp; permissions</h3>
          {data.isYou ? (
            <p className="mt-2 flex items-center gap-2 text-[13px] text-muted">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              You can&apos;t change your own role.
            </p>
          ) : null}
          {canEditRole ? (
            <div className="mt-3">
              <RoleCards name="member-role" value={role} onChange={(r) => { setRole(r); setSaved(false); }} />
            </div>
          ) : null}
          <div className="mt-3">
            <PermissionGrid role={role} matrix={matrix} />
          </div>
          {data.status === "revoked" ? <p className="mt-3 text-[13px] text-muted">Access was revoked. To bring this person back, invite them again with their e-mail address.</p> : null}

          {isInvite ? (
            <div className="mt-6">
              <h3 className="text-[15px] font-semibold text-ink">Invitation link</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-body">
                The first link is shown only once. Make a new one to send it again; the old link stops working.
              </p>
              {link ? (
                <CopyLink url={link} />
              ) : (
                <button type="button" onClick={newLink} disabled={linkPending} className="mt-3 h-10 rounded-lg border border-field-border bg-white px-4 text-sm font-semibold text-ink hover:bg-pill disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-retail">
                  {linkPending ? "Making link…" : "Make a new link"}
                </button>
              )}
            </div>
          ) : null}

          {isMember ? (
            <>
              <h3 className="mt-7 text-[15px] font-semibold text-ink">Recent activity</h3>
              {data.activity.length === 0 ? (
                <p className="mt-2 text-sm text-muted">Nothing recorded yet.</p>
              ) : (
                <ol className="mt-3 border-l border-line pl-4">
                  {data.activity.map((a, i) => (
                    <li key={i} className="relative pb-4 last:pb-0">
                      <span aria-hidden="true" className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-retail" />
                      <p className="text-sm text-ink">{a.summary}</p>
                      <p className="text-xs text-muted">{a.when}</p>
                    </li>
                  ))}
                </ol>
              )}
            </>
          ) : null}
          {error ? <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p> : null}
        </div>

        {(canEditRole || (isMember && data.status === "active" && !data.isYou) || isInvite) ? (
          <footer className="flex items-center justify-between gap-3 border-t border-row-line px-6 py-4">
            {isInvite ? (
              <button type="button" onClick={() => { setConfirmError(null); setConfirm("cancel"); }} className="h-11 rounded-lg border border-[#f0c2be] bg-white px-4 text-sm font-semibold text-danger hover:bg-danger-soft focus-visible:outline-2 focus-visible:outline-danger">
                Cancel invitation
              </button>
            ) : (
              <button type="button" onClick={() => { setConfirmError(null); setConfirm("revoke"); }} className="h-11 rounded-lg border border-[#f0c2be] bg-white px-4 text-sm font-semibold text-danger hover:bg-danger-soft focus-visible:outline-2 focus-visible:outline-danger">
                Revoke access
              </button>
            )}
            {canEditRole ? (
              <div className="flex items-center gap-3">
                {saved && !changed ? <span role="status" className="text-sm text-retail-dark">Role saved</span> : null}
                <button type="button" onClick={saveRole} disabled={!changed || saving} className="h-11 rounded-lg bg-retail px-5 text-sm font-semibold text-white hover:bg-retail-dark disabled:cursor-not-allowed disabled:bg-[#8fbfae] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail">
                  {saving ? "Saving…" : "Save role"}
                </button>
              </div>
            ) : null}
          </footer>
        ) : null}
      </aside>

      {confirm === "revoke" ? (
        <Confirm
          title="Revoke access?"
          body={`${data.fullName} will be signed out immediately and lose access to the portal. Their past activity stays in the audit log.`}
          confirmLabel="Revoke Access"
          keepLabel="Keep Access"
          pending={confirmPending}
          error={confirmError}
          onConfirm={runConfirmed}
          onKeep={() => setConfirm(null)}
        />
      ) : null}
      {confirm === "cancel" ? (
        <Confirm
          title="Cancel this invitation?"
          body={`The link sent to ${data.fullName} will stop working. You can invite them again later.`}
          confirmLabel="Cancel Invitation"
          keepLabel="Keep Invitation"
          pending={confirmPending}
          error={confirmError}
          onConfirm={runConfirmed}
          onKeep={() => setConfirm(null)}
        />
      ) : null}
    </div>
  );
}
