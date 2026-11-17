"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { inviteMemberAction } from "@/app/manufacturer/(portal)/team/actions";
import { site } from "@/lib/site";
import { roleLabel } from "@/lib/manufacturer/team-shared";
import { RoleCards } from "./bits";
import { CopyLink } from "./copy-link";

type Errors = Partial<Record<"fullName" | "email" | "role", string>>;

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-field-border bg-white px-3.5 text-sm text-ink placeholder:text-field-placeholder focus-visible:outline-2 focus-visible:outline-retail";

/** "Invite member": name, e-mail and role. The result is a one-time link for the administrator to send. */
export function InviteMemberButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("viewer");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<{ name: string; email: string; role: string; token: string } | null>(null);
  const first = useRef<HTMLInputElement>(null);

  function close() {
    setOpen(false);
    if (created) router.refresh();
    setCreated(null);
    setErrors({});
    setFormError(null);
    setRole("viewer");
  }

  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // close reads current state on purpose; re-subscribing on each change is fine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, created]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fullName = String(data.get("fullName") ?? "");
    const email = String(data.get("email") ?? "");
    setErrors({});
    setFormError(null);
    setPending(true);
    try {
      const result = await inviteMemberAction({ fullName, email, role });
      if (result.ok) {
        setCreated({ name: fullName.trim(), email: email.trim().toLowerCase(), role, token: result.token });
      } else {
        if (result.fields) setErrors(result.fields);
        if (result.message) setFormError(result.message);
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-12 items-center gap-2 rounded-xl bg-retail px-5 text-[15px] font-semibold text-white transition hover:bg-retail-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M18 8v6M15 11h6" />
        </svg>
        Invite member
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-night/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div role="dialog" aria-modal="true" aria-labelledby="invite-title" className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-[0_20px_50px_rgba(15,31,23,0.25)] sm:p-7">
            {created ? (
              <div>
                <h2 id="invite-title" className="text-xl font-semibold text-ink">Invitation ready</h2>
                <p className="mt-2 text-sm leading-relaxed text-body">
                  Send this link to <span className="font-semibold text-ink">{created.name}</span>. They must sign in, or create an account, with{" "}
                  <span className="font-semibold text-ink">{created.email}</span> and then open the link to join as {roleLabel(created.role)}.
                </p>
                <CopyLink url={`${window.location.origin}${site.manufacturer.join}/${created.token}`} />
                <p className="mt-3 text-xs text-muted">The link works once and expires in 14 days. It is shown only now; you can make a new one from the person&apos;s row.</p>
                <div className="mt-6 flex justify-end">
                  <button type="button" onClick={close} className="h-11 rounded-xl bg-retail px-6 text-sm font-semibold text-white hover:bg-retail-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate>
                <h2 id="invite-title" className="text-xl font-semibold text-ink">Invite a team member</h2>
                <p className="mt-1 text-sm text-body">They get a personal link to join your company on SKANPROOV.</p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="invite-name" className="text-sm font-medium text-ink">Full name</label>
                    <input ref={first} id="invite-name" name="fullName" autoComplete="off" placeholder="e.g. Ifeoma Eze" aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? "invite-name-err" : undefined} className={inputClass} />
                    {errors.fullName ? <p id="invite-name-err" className="mt-1 text-xs text-danger">{errors.fullName}</p> : null}
                  </div>
                  <div>
                    <label htmlFor="invite-email" className="text-sm font-medium text-ink">E-mail address</label>
                    <input id="invite-email" name="email" type="email" autoComplete="off" placeholder="name@company.ng" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "invite-email-err" : undefined} className={inputClass} />
                    {errors.email ? <p id="invite-email-err" className="mt-1 text-xs text-danger">{errors.email}</p> : null}
                  </div>
                </div>

                <p className="mt-5 text-sm font-medium text-ink">Role</p>
                <div className="mt-2">
                  <RoleCards name="invite-role" value={role} onChange={setRole} />
                </div>
                {errors.role ? <p className="mt-1 text-xs text-danger">{errors.role}</p> : null}
                {formError ? <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{formError}</p> : null}

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={close} className="h-11 rounded-xl border border-field-border bg-white px-5 text-sm font-semibold text-ink hover:bg-pill focus-visible:outline-2 focus-visible:outline-retail">
                    Cancel
                  </button>
                  <button type="submit" disabled={pending} className="h-11 rounded-xl bg-retail px-6 text-sm font-semibold text-white hover:bg-retail-dark disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail">
                    {pending ? "Creating…" : "Create invite link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
