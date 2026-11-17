import { PERMISSIONS, ROLES, type PermissionMatrix } from "@/lib/manufacturer/team-shared";

/** "Roles & permissions" tab: who can do what, read from the same rules the database enforces. */
export function RolesTable({ matrix }: { matrix: PermissionMatrix }) {
  return (
    <section className="mt-6 rounded-xl border border-line bg-white" aria-label="Roles and permissions">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption className="sr-only">What each role can do</caption>
          <thead>
            <tr className="border-b border-row-line align-bottom">
              <th scope="col" className="px-6 py-5 text-[13px] font-normal text-muted">Permission</th>
              {ROLES.map((r) => (
                <th key={r.id} scope="col" className="w-[150px] px-3 py-5 align-bottom">
                  <span className="block text-sm font-semibold text-ink">{r.label}</span>
                  <span className="mt-1 block text-xs font-normal leading-snug text-muted">{r.description}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map(({ key, label }) => (
              <tr key={key} className="border-b border-row-line last:border-b-0">
                <th scope="row" className="px-6 py-3.5 font-normal text-ink">{label}</th>
                {ROLES.map((r) => {
                  const yes = (matrix[r.id] ?? []).includes(key);
                  return (
                    <td key={r.id} className="px-3 py-3.5">
                      {yes ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-retail" role="img" aria-label="Allowed">
                          <path d="m5 12.5 4.5 4.5L19 7.5" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4 text-line-strong" role="img" aria-label="Not allowed">
                          <path d="M6 12h12" />
                        </svg>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-row-line px-6 py-3.5 text-[13px] text-muted">
        Roles are enforced on every action, not only on the screens. Changing a person&apos;s role takes effect immediately.
      </p>
    </section>
  );
}
