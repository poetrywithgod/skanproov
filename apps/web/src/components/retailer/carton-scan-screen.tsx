"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type QrScannerType from "qr-scanner";
import { FlashIcon } from "@/components/app/app-icons";
import { CloseIcon } from "@/components/icons";
import { extractCode } from "@/lib/code";
import { clearDelivery, useDeliveryCount } from "@/lib/retailer/delivery";
import { site } from "@/lib/site";
import { CartonChecking } from "./carton-checking";

type CameraState = "starting" | "scanning" | "denied" | "unavailable" | "insecure";

const CAMERA_MESSAGES: Record<Exclude<CameraState, "starting" | "scanning">, { title: string; body: string }> = {
  denied: {
    title: "Camera access is off",
    body: "Allow the camera for this site in your browser settings, then reload. Or type the code under the QR below.",
  },
  unavailable: {
    title: "No camera found",
    body: "We couldn't open a camera on this device. Type the code printed under the QR below.",
  },
  insecure: {
    title: "The camera needs a secure connection",
    body: "Browsers only allow the camera on secure (https) pages. Type the code printed under the QR below.",
  },
};

/** "Checking this carton" shows at once; Cancel works during this short hold, before anything is saved. */
const CHECKING_HOLD_MS = 600;

/** Scan a carton's QR code, or type its code, while receiving a delivery. */
export function CartonScanScreen() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScannerType | null>(null);
  const handledRef = useRef(false);
  const lastBadRef = useRef<{ data: string; at: number } | null>(null);
  const holdRef = useRef<number | null>(null);

  const delivered = useDeliveryCount();
  const [camera, setCamera] = useState<CameraState>("starting");
  const [attempt, setAttempt] = useState(0);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [typedError, setTypedError] = useState<string | null>(null);

  const openResult = useCallback(
    (code: string) => {
      handledRef.current = true;
      scannerRef.current?.stop();
      navigator.vibrate?.(40);
      setChecking(code.toUpperCase());
      holdRef.current = window.setTimeout(() => {
        holdRef.current = null;
        router.push(`${site.retailer.result}/${encodeURIComponent(code)}`);
      }, CHECKING_HOLD_MS);
    },
    [router],
  );

  function cancelChecking() {
    if (holdRef.current !== null) {
      window.clearTimeout(holdRef.current);
      holdRef.current = null;
    } else {
      // The result is already loading. Going back to the scanner replaces that navigation.
      router.replace(site.retailer.scan);
    }
    handledRef.current = false;
    setChecking(null);
    setAttempt((n) => n + 1);
  }

  useEffect(() => {
    return () => {
      if (holdRef.current !== null) window.clearTimeout(holdRef.current);
    };
  }, []);

  // Coming back with the browser's back button can restore this page as it was left.
  useEffect(() => {
    const onShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      handledRef.current = false;
      setChecking(null);
      setAttempt((n) => n + 1);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  useEffect(() => {
    if (checking) return; // the camera view is not on screen while checking
    const video = videoRef.current;
    if (!video) return;
    if (!window.isSecureContext) {
      setCamera("insecure");
      return;
    }

    let cancelled = false;
    handledRef.current = false;
    setCamera("starting");

    (async () => {
      const { default: QrScanner } = await import("qr-scanner");
      if (cancelled) return;
      if (!(await QrScanner.hasCamera())) {
        setCamera("unavailable");
        return;
      }

      const scanner = new QrScanner(
        video,
        (result) => {
          if (handledRef.current) return;
          const code = extractCode(result.data);

          if (!code) {
            // Not a SKANPROOV code. Keep scanning, and don't repeat the same notice.
            const last = lastBadRef.current;
            if (!last || last.data !== result.data || Date.now() - last.at > 3000) {
              lastBadRef.current = { data: result.data, at: Date.now() };
              setNotice("That doesn't look like a SKANPROOV code. Scan the QR on the carton.");
            }
            return;
          }
          openResult(code);
        },
        {
          preferredCamera: "environment",
          returnDetailedScanResult: true,
          highlightScanRegion: false,
          highlightCodeOutline: false,
          maxScansPerSecond: 12,
        },
      );
      scannerRef.current = scanner;

      try {
        await scanner.start();
        if (cancelled) {
          scanner.destroy();
          return;
        }
        setCamera("scanning");
        setHasFlash(await scanner.hasFlash());
        setFlashOn(false);
      } catch (error) {
        if (cancelled) return;
        const name = error instanceof Error ? error.name : String(error);
        setCamera(/NotAllowed|Permission|denied/i.test(name + String(error)) ? "denied" : "unavailable");
      }
    })();

    return () => {
      cancelled = true;
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
    // `attempt` intentionally restarts the camera.
  }, [attempt, checking, openResult]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(id);
  }, [notice]);

  async function toggleFlash() {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      await scanner.toggleFlash();
      setFlashOn(scanner.isFlashOn());
    } catch {
      setHasFlash(false);
    }
  }

  function onTypedSubmit(event: FormEvent) {
    event.preventDefault();
    const code = extractCode(typed);
    if (!code) {
      setTypedError("Enter the carton code exactly as printed (letters, numbers and dashes).");
      return;
    }
    setTypedError(null);
    openResult(code);
  }

  function finishDelivery() {
    clearDelivery();
    router.push(site.retailer.home);
  }

  if (checking) return <CartonChecking code={checking} onCancel={cancelChecking} />;

  const problem = camera === "denied" || camera === "unavailable" || camera === "insecure" ? CAMERA_MESSAGES[camera] : null;

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] flex-col bg-[#0f1813]">
      <section aria-label="Camera" className="relative min-h-[420px] flex-1 overflow-hidden">
        <video ref={videoRef} muted playsInline className="absolute inset-0 size-full object-cover" />
        {camera === "scanning" ? <div className="absolute inset-0 bg-black/30" aria-hidden="true" /> : null}

        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4 text-white">
          <Link
            href={site.retailer.manufacturers}
            aria-label="Close scanner"
            className="grid size-10 place-items-center rounded-full hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
          >
            <CloseIcon className="size-6" />
          </Link>
          <h1 className="text-[17px] font-bold tracking-normal">Scan carton</h1>
          <button
            type="button"
            onClick={toggleFlash}
            disabled={!hasFlash}
            aria-pressed={flashOn}
            aria-label={flashOn ? "Turn flash off" : "Turn flash on"}
            className={`grid size-10 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-white ${
              flashOn ? "bg-white text-ink" : "bg-[#272f2b] text-white"
            } ${hasFlash ? "" : "opacity-70"}`}
          >
            <FlashIcon off={!flashOn} className="size-5" />
          </button>
        </div>

        <div className="absolute inset-x-0 top-[72px] flex justify-center gap-2 text-white" aria-live="polite">
          <span className="rounded-full bg-[#272f2b] px-4 py-1.5 text-[13px] font-semibold">This delivery:</span>
          <span className="grid min-w-14 place-items-center rounded-full bg-retail px-4 py-1.5 text-[13px] font-bold">
            {delivered}
          </span>
        </div>

        <div
          className="pointer-events-none absolute left-1/2 top-[27%] h-[210px] w-[min(255px,66%)] -translate-x-1/2"
          aria-hidden="true"
        >
          <span className="absolute left-0 top-0 size-12 rounded-tl-2xl border-l-[3px] border-t-[3px] border-white" />
          <span className="absolute right-0 top-0 size-12 rounded-tr-2xl border-r-[3px] border-t-[3px] border-white" />
          <span className="absolute bottom-0 left-0 size-12 rounded-bl-2xl border-b-[3px] border-l-[3px] border-white" />
          <span className="absolute bottom-0 right-0 size-12 rounded-br-2xl border-b-[3px] border-r-[3px] border-white" />
          {camera === "scanning" ? (
            <span className="scan-line absolute inset-x-5 top-1/2 h-0.5 rounded-full bg-[#7ee0b0] shadow-[0_0_12px_#7ee0b0]" />
          ) : (
            <span className="absolute inset-x-5 top-[12%] h-0.5 rounded-full bg-[#7ee0b0]/70" />
          )}
        </div>

        <div className="absolute inset-x-6 bottom-8 text-center text-white">
          {problem ? (
            <>
              <p className="text-lg font-bold">{problem.title}</p>
              <p className="mt-1.5 text-[13px] leading-[1.45] text-white/75">{problem.body}</p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold">
                {camera === "starting" ? "Starting camera…" : "Point at the QR code on the carton"}
              </p>
              <p className="mt-1.5 text-[13px] leading-[1.45] text-white/65">Hold steady. Scanning starts by itself.</p>
            </>
          )}
        </div>

        {notice ? (
          <p
            role="status"
            className="absolute inset-x-5 top-[120px] rounded-xl bg-black/70 px-4 py-2.5 text-center text-[13px] leading-[1.4] text-white backdrop-blur"
          >
            {notice}
          </p>
        ) : null}
      </section>

      <form onSubmit={onTypedSubmit} noValidate className="rounded-t-3xl bg-white px-4 pb-5 pt-5">
        <label htmlFor="carton-code" className="text-sm font-bold text-ink">
          Can&apos;t scan? Type the code printed under the QR
        </label>
        <div className="mt-3 flex gap-2.5">
          <input
            id="carton-code"
            value={typed}
            onChange={(event) => {
              setTyped(event.target.value.slice(0, 64));
              setTypedError(null);
            }}
            placeholder="e.g. CT-88213-004"
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={typedError ? true : undefined}
            aria-describedby={typedError ? "carton-code-error" : undefined}
            className="h-12 min-w-0 flex-1 rounded-xl border border-field-border bg-white px-3.5 text-[15px] text-ink placeholder:text-field-placeholder focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-retail"
          />
          <button
            type="submit"
            disabled={!typed.trim()}
            className="h-12 shrink-0 rounded-xl bg-retail px-5 text-[15px] font-semibold text-white transition-colors hover:bg-retail-dark disabled:bg-retail/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail"
          >
            Check
          </button>
        </div>
        {typedError ? (
          <p id="carton-code-error" role="alert" className="mt-2 text-[13px] leading-[1.4] text-danger">
            {typedError}
          </p>
        ) : null}

        <button
          type="button"
          onClick={finishDelivery}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-line bg-white text-[15px] font-semibold text-ink transition-colors hover:bg-[#f4f6f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail"
        >
          Finish delivery
        </button>
      </form>
    </div>
  );
}
