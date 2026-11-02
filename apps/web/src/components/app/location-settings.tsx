"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { site } from "@/lib/site";

type Permission = "granted" | "denied" | "unknown";

function askBrowser(): Promise<Permission> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve("unknown");
    navigator.geolocation.getCurrentPosition(
      () => resolve("granted"),
      (error) => resolve(error.code === error.PERMISSION_DENIED ? "denied" : "unknown"),
      { timeout: 10_000 },
    );
  });
}

export function LocationSettings({ userId, initiallyOn }: { userId: string; initiallyOn: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(initiallyOn);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<Permission>("unknown");

  async function toggle() {
    const next = !on;
    setError(null);
    setPending(true);
    try {
      if (next) setPermission(await askBrowser());
      const { error: saveError } = await createClient()
        .from("profiles")
        .update({ geotag_scans: next })
        .eq("id", userId);
      if (saveError) {
        setError("We couldn't save that. Please try again.");
        return;
      }
      setOn(next);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5 rounded-2xl bg-white p-5 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[15px] font-semibold text-ink">Add my location to scans</p>
          <p className="text-xs text-body">{on ? "On" : "Off"}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Add my location to scans"
          disabled={pending}
          onClick={toggle}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60 ${
            on ? "bg-brand" : "bg-[#c5cec8]"
          }`}
        >
          <span
            className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${on ? "left-7" : "left-1"}`}
          />
        </button>
      </div>

      {permission === "denied" && on ? (
        <p role="status" className="rounded-lg bg-[#fdf0dc] px-3.5 py-2.5 text-sm text-[#9a5b06]">
          Your browser is blocking location for this site, so scans won&apos;t include it. Allow location in your browser
          settings to use this.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="space-y-2 text-sm leading-[1.55] text-body">
        <p>
          When this is on and you scan a product while signed in, we ask your phone for where you are and save it with
          that scan.
        </p>
        <p>
          We keep it to about 100 metres, not your exact spot. It helps us notice when one code is scanned in places far
          apart, which is a sign it was copied. It is never shown to other people.
        </p>
        <p>It is off until you turn it on, and you can turn it off at any time. Scans already saved keep their location.</p>
      </div>

      <Link href={site.links.profile} className="block text-center text-sm font-semibold text-body hover:underline">
        Back to profile
      </Link>
    </div>
  );
}
