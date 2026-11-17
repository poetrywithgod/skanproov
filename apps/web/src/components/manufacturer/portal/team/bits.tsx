import { PERMISSIONS, ROLES, STATUS_LABEL, type MemberStatus, type PermissionMatrix } from "@/lib/manufacturer/team-shared";

const PILL: Record<MemberStatus, { box: string; dot: string }> = {
  active: { box: "bg-retail-soft text-retail-dark", dot: "bg-retail" },
  pending: { box: "bg-warn-soft text-warn", dot: "bg-[#f79009]" },
  expired: { box: "bg-warn-soft text-warn", dot: "bg-[#f79009]" },
  revoked: { box: "bg-pill text-muted", dot: "bg-muted" },
};

export function TeamStatusPill({ status }: { status: MemberStatus }) {
  const tone = PILL[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${tone.box}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${tone.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Avatar({ initials, size = "md", muted = false }: { initials: string; size?: "md" | "lg"; muted?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full font-semibold ${muted ? "bg-pill text-muted" : "bg-retail-soft text-retail-dark"} ${
        size === "lg" ? "size-14 text-lg" : "size-10 text-xs"
      }`}
    >
      {initials}
    </span>
  );
}

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0 text-retail" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
const Dash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4 shrink-0 text-line-strong" aria-hidden="true">
    <path d="M6 12h12" />
  </svg>
);

/** The eleven permissions in two columns, ticked for what the role allows. */
export function PermissionGrid({ role, matrix }: { role: string; matrix: PermissionMatrix }) {
  const allowed = new Set(matrix[role] ?? []);
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl bg-surface-soft px-4 py-4 sm:grid-cols-2" aria-label="What this role can do">
      {PERMISSIONS.map(({ key, label }) => {
        const yes = allowed.has(key);
        return (
          <li key={key} className={`flex items-start gap-2 text-sm ${yes ? "text-ink" : "text-muted"}`}>
            {yes ? <Check /> : <Dash />}
            <span>
              {label}
              <span className="sr-only">{yes ? ": allowed" : ": not allowed"}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** The four roles as selectable cards. */
export function RoleCards({
  value,
  onChange,
  name,
  disabled = false,
}: {
  value: string;
  onChange: (role: string) => void;
  name: string;
  disabled?: boolean;
}) {
  return (
    <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2" disabled={disabled}>
      <legend className="sr-only">Role</legend>
      {ROLES.map((role) => {
        const selected = value === role.id;
        return (
          <label
            key={role.id}
            className={`flex cursor-pointer gap-2.5 rounded-xl border p-3 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-retail ${
              selected ? "border-retail bg-retail-soft/60" : "border-line bg-white hover:bg-surface-soft"
            } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
          >
            <input type="radio" name={name} value={role.id} checked={selected} onChange={() => onChange(role.id)} className="mt-0.5 size-4 shrink-0 accent-[#0e6b4f]" />
            <span>
              <span className="block text-sm font-semibold text-ink">{role.label}</span>
              <span className="mt-1 block text-xs leading-relaxed text-body">{role.description}</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
