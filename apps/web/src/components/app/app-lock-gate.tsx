"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/logo";
import { isLocked, lockNow, markOpen, RELOCK_AFTER_MS, unlock } from "@/lib/app-lock";
import { cancelSignIn } from "@/lib/mfa-client";
import { LockIcon } from "./app-icons";

/**
 * Covers the app with an unlock screen when App Lock is on for this person and this phone.
 * Public visitors (no account) are never locked.
 */
export function AppLockGate({ userId, children }: { userId: string | null; children: ReactNode }) {
  const router = useRouter();
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const hiddenAt = useRef<number | null>(null);

  const tryUnlock = useCallback(async () => {
    if (!userId) return;
    setPending(true);
    setMessage(null);
    const result = await unlock(userId);
    setPending(false);
    if (result.ok) setLocked(false);
    else setMessage(result.message);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    if (isLocked(userId)) {
      setLocked(true);
      void tryUnlock();
    } else {
      markOpen();
    }

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt.current = Date.now();
      } else if (hiddenAt.current && Date.now() - hiddenAt.current > RELOCK_AFTER_MS) {
        hiddenAt.current = null;
        lockNow();
        if (isLocked(userId)) {
          setLocked(true);
          void tryUnlock();
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [userId, tryUnlock]);

  return (
    <>
      {children}
      {locked ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="App locked"
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 bg-white px-8 text-center"
        >
          <Logo className="h-12" />
          <span className="grid size-16 place-items-center rounded-full bg-brand-soft text-brand">
            <LockIcon className="size-8" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-ink">SKANPROOV is locked</h2>
            <p className="mt-1 text-sm text-body">Use your fingerprint, face or phone PIN to continue.</p>
          </div>
          {message ? (
            <p role="alert" className="max-w-xs rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
              {message}
            </p>
          ) : null}
          <button
            type="button"
            onClick={tryUnlock}
            disabled={pending}
            className="flex h-[52px] w-full max-w-xs items-center justify-center rounded-xl bg-brand text-[15px] font-semibold text-white hover:bg-brand-dark disabled:opacity-70"
          >
            {pending ? "Waiting…" : "Unlock"}
          </button>
          <button
            type="button"
            onClick={async () => {
              await cancelSignIn();
              setLocked(false);
              router.replace("/login");
              router.refresh();
            }}
            className="text-sm font-semibold text-body hover:underline"
          >
            Sign out instead
          </button>
        </div>
      ) : null}
    </>
  );
}
