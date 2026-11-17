import { signOutAction } from "@/app/(customer)/profile/actions";
import { Logo } from "@/components/logo";

/** Shown instead of the portal to someone whose access an administrator removed. */
export function AccessRevoked({ company }: { company: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-surface-soft px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 text-center">
        <div className="flex justify-center">
          <Logo className="h-14" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink">Your access has been removed</h1>
        <p className="mt-3 text-sm leading-relaxed text-body">
          An administrator at {company} removed your access to the manufacturer portal. If you think this is a mistake, ask them to invite you again.
        </p>
        <form action={signOutAction} className="mt-6">
          <button
            type="submit"
            className="inline-flex h-11 items-center rounded-xl border border-field-border bg-white px-5 text-sm font-semibold text-ink hover:bg-pill focus-visible:outline-2 focus-visible:outline-retail"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
