"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { disableLock, enableLock, isEnabledFor, isSupported } from "@/lib/app-lock";
import { site } from "@/lib/site";

export function AppLockSettings({ user }: { user: { id: string; email: string; name: string } }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [on, setOn] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOn(isEnabledFor(user.id));
    void isSupported().then(setSupported);
  }, [user.id]);

  async function toggle() {
    setError(null);
    if (on) {
      disableLock();
      setOn(false);
      return;
    }
    setPending(true);
    const result = await enableLock(user);
    setPending(false);
    if (result.ok) setOn(true);
    else setError(result.message);
  }

  return (
    <div className="space-y-5 rounded-2xl bg-white p-5 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[15px] font-semibold text-ink">Lock the app on this phone</p>
          <p className="text-xs text-body">{on ? "On" : "Off"}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Lock the app on this phone"
          disabled={pending || supported === false || supported === null}
          onClick={toggle}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 ${
            on ? "bg-brand" : "bg-[#c5cec8]"
          }`}
        >
          <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${on ? "left-7" : "left-1"}`} />
        </button>
      </div>

      {supported === false ? (
        <p role="status" className="rounded-lg bg-[#fdf0dc] px-3.5 py-2.5 text-sm text-[#9a5b06]">
          This phone or browser doesn&apos;t support a fingerprint, face or PIN lock for websites, or the page isn&apos;t on
          a secure (https) address. Set up a screen lock in your phone settings and try again.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="space-y-2 text-sm leading-[1.55] text-body">
        <p>
          When this is on, SKANPROOV asks for your fingerprint, face or phone PIN each time you open the app, and again
          after it has been out of sight for a minute.
        </p>
        <p>
          It protects against someone picking up your unlocked phone. It applies to this phone and browser only, and it
          doesn&apos;t change how you sign in. If you can&apos;t unlock, you can sign out from the lock screen.
        </p>
      </div>

      <Link href={site.links.profile} className="block text-center text-sm font-semibold text-body hover:underline">
        Back to profile
      </Link>
    </div>
  );
}
