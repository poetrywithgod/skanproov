import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "./actions";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

/**
 * Placeholder. It proves sign-up and sign-in work end to end; the real customer
 * screens replace it once they are built.
 */
export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(site.links.login);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-12 text-center">
      <Logo className="h-14" />
      <h1 className="mt-8 text-2xl font-semibold tracking-tight text-ink-title">
        {firstName ? `Welcome, ${firstName}` : "Welcome"}
      </h1>
      <p className="mt-2 text-sm text-muted">You&apos;re signed in. Your rewards and scan history will appear here.</p>

      <dl className="mt-8 w-full divide-y divide-row-line rounded-xl border border-box-line text-left text-sm">
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-label">E-mail</dt>
          <dd className="font-medium text-ink">{user.email}</dd>
        </div>
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-label">Phone</dt>
          <dd className="font-medium text-ink">{profile?.phone ?? "—"}</dd>
        </div>
      </dl>

      <form action={signOutAction} className="mt-6">
        <button
          type="submit"
          className="h-11 rounded-xl border border-line bg-white px-6 text-sm font-semibold text-ink transition-colors hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
