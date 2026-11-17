"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { acceptInviteAction } from "@/app/manufacturer/join/actions";
import { site } from "@/lib/site";

export function AcceptInvite({ token, company }: { token: string; company: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setPending(true);
    setError(null);
    try {
      const result = await acceptInviteAction(token);
      if (result.ok) {
        router.replace(site.manufacturer.home);
        router.refresh();
      } else {
        setError(result.message);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6">
      {error ? <p role="alert" className="mb-3 rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p> : null}
      <button
        type="button"
        onClick={join}
        disabled={pending}
        className="h-12 w-full rounded-xl bg-retail text-[15px] font-semibold text-white transition hover:bg-retail-dark disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail"
      >
        {pending ? "Joining…" : `Join ${company}`}
      </button>
    </div>
  );
}
