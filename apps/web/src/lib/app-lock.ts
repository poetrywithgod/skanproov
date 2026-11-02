/**
 * "App Lock": a fingerprint / Face ID / device-PIN check on this phone, using the browser's
 * built-in platform authenticator (WebAuthn). It is a screen lock for the app on this device,
 * checked locally. It does not change how the account signs in, and it is not sent to a server.
 */

const STORE_KEY = "skanproov:app-lock";
const OPEN_KEY = "skanproov:app-lock-open";
/** The app locks again after being out of sight this long. */
export const RELOCK_AFTER_MS = 60_000;

interface Stored {
  userId: string;
  credentialId: string;
}

const b64 = {
  encode(bytes: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(bytes)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  },
  decode(text: string): Uint8Array<ArrayBuffer> {
    const padded = text.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(text.length / 4) * 4, "=");
    return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  },
};

function read(): Stored | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

export async function isSupported(): Promise<boolean> {
  try {
    if (!window.isSecureContext || !("PublicKeyCredential" in window)) return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function isEnabledFor(userId: string): boolean {
  return read()?.userId === userId;
}

function challenge(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(32));
}

export type LockResult = { ok: true } | { ok: false; message: string };

/** Registers this device's fingerprint / face / PIN as the unlock method. */
export async function enableLock(user: { id: string; email: string; name: string }): Promise<LockResult> {
  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: challenge(),
        rp: { name: "SKANPROOV" },
        user: { id: new TextEncoder().encode(user.id), name: user.email, displayName: user.name || user.email },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null;
    if (!credential) return { ok: false, message: "Nothing was set up. Please try again." };
    localStorage.setItem(STORE_KEY, JSON.stringify({ userId: user.id, credentialId: b64.encode(credential.rawId) }));
    markOpen();
    return { ok: true };
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
      return { ok: false, message: "That was cancelled. Try again and approve with your fingerprint, face or phone PIN." };
    }
    return { ok: false, message: "We couldn't set up App Lock on this phone." };
  }
}

export function disableLock(): void {
  try {
    localStorage.removeItem(STORE_KEY);
    sessionStorage.removeItem(OPEN_KEY);
  } catch {
    // Nothing to clear.
  }
}

/** Asks the phone to confirm it's the owner. */
export async function unlock(userId: string): Promise<LockResult> {
  const stored = read();
  if (!stored || stored.userId !== userId) return { ok: true };
  try {
    const result = await navigator.credentials.get({
      publicKey: {
        challenge: challenge(),
        allowCredentials: [{ type: "public-key", id: b64.decode(stored.credentialId) }],
        userVerification: "required",
        timeout: 60_000,
      },
    });
    if (!result) return { ok: false, message: "Couldn't unlock. Please try again." };
    markOpen();
    return { ok: true };
  } catch {
    return { ok: false, message: "Couldn't unlock. Please try again." };
  }
}

export function markOpen(): void {
  try {
    sessionStorage.setItem(OPEN_KEY, String(Date.now()));
  } catch {
    // Without session storage the app just asks every time.
  }
}

/** True when the lock is on for this person and they haven't unlocked recently. */
export function isLocked(userId: string): boolean {
  if (!isEnabledFor(userId)) return false;
  try {
    const openedAt = Number(sessionStorage.getItem(OPEN_KEY));
    return !openedAt;
  } catch {
    return true;
  }
}

export function lockNow(): void {
  try {
    sessionStorage.removeItem(OPEN_KEY);
  } catch {
    // Nothing to clear.
  }
}
