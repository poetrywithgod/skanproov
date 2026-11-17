"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { site } from "@/lib/site";
import { ROLES, STATUS_LABEL, roleLabel, initialsOf, type MemberStatus } from "@/lib/manufacturer/team-shared";
import { ChevronIcon } from "../icons";
import { Avatar, TeamStatusPill } from "./bits";

export interface MemberListRow {
  key: string;
  kind: "member" | "invite";
  fullName: string;
  email: string;
  role: string;
  status: MemberStatus;
  /** Worked out on the server so it matches on first paint. */
  lastActive: string;
  isYou: boolean;
}

const selectClass =
  "h-11 w-full appearance-none rounded-lg border border-field-border bg-white pl-3.5 pr-9 text-sm text-ink focus-visible:outline-2 focus-visible:outline-retail";

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <label className="sr-only">{label}</label>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        {children}
      </select>
      <ChevronIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" direction="down" />
    </div>
  );
}

/** The Members tab: search, filters and the table. Opening a row opens its panel (?member=). */
export function MembersView({ rows }: { rows: MemberListRow[] }) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((r) => !needle || r.fullName.toLowerCase().includes(needle) || r.email.toLowerCase().includes(needle))
      .filter((r) => !role || r.role === role)
      .filter((r) => !status || r.status === status);
  }, [rows, q, role, status]);

  return (
    <section className="mt-6 rounded-xl border border-line bg-white" aria-label="Team members">
      <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_200px_200px] sm:p-5">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email"
          aria-label="Search by name or email"
          className="h-11 w-full rounded-lg border border-field-border bg-white px-3.5 text-sm text-ink placeholder:text-field-placeholder focus-visible:outline-2 focus-visible:outline-retail"
        />
        <Select label="Filter by role" value={role} onChange={setRole}>
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </Select>
        <Select label="Filter by status" value={status} onChange={setStatus}>
          <option value="">All statuses</option>
          {(Object.keys(STATUS_LABEL) as MemberStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </div>

      {visible.length === 0 ? (
        <div className="border-t border-row-line px-6 py-14 text-center" role="status">
          <p className="text-base font-semibold text-ink">No one matches</p>
          <p className="mt-1 text-sm text-muted">Try a different search or clear the filters.</p>
          <button
            type="button"
            onClick={() => {
              setQ("");
              setRole("");
              setStatus("");
            }}
            className="mt-4 text-sm font-semibold text-retail hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">Team members and invitations</caption>
            <thead>
              <tr className="border-y border-row-line bg-surface-soft text-[13px] font-normal text-muted">
                <th scope="col" className="px-5 py-3 font-normal sm:px-6">Member</th>
                <th scope="col" className="px-3 py-3 font-normal">Role</th>
                <th scope="col" className="px-3 py-3 font-normal">Status</th>
                <th scope="col" className="px-3 py-3 font-normal">Last active</th>
                <th scope="col" className="px-5 py-3 text-right font-normal sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const href = `${site.manufacturer.team}?member=${r.kind}:${r.key}`;
                return (
                  <tr key={`${r.kind}-${r.key}`} className="border-b border-row-line last:border-b-0 hover:bg-surface-soft">
                    <td className="px-5 py-3.5 sm:px-6">
                      <Link href={href} scroll={false} className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-retail">
                        <Avatar initials={initialsOf(r.fullName)} muted={r.status === "revoked"} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-ink">
                            {r.fullName}
                            {r.isYou ? <span className="ml-1.5 text-[13px] font-normal text-muted">(You)</span> : null}
                          </span>
                          <span className="block truncate text-xs text-muted">{r.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3.5 text-ink">{roleLabel(r.role)}</td>
                    <td className="px-3 py-3.5">
                      <TeamStatusPill status={r.status} />
                    </td>
                    <td className="px-3 py-3.5 text-body">{r.lastActive}</td>
                    <td className="px-5 py-3.5 text-right sm:px-6">
                      <Link href={href} scroll={false} aria-label={`Open ${r.fullName}`} className="inline-grid size-9 place-items-center rounded-lg text-body hover:bg-pill focus-visible:outline-2 focus-visible:outline-retail">
                        <ChevronIcon className="size-4" direction="right" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
