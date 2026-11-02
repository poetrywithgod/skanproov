"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type QrScannerType from "qr-scanner";
import { ScanIcon } from "@/components/icons";
import { extractCode } from "@/lib/code";
import { site } from "@/lib/site";
import { BulbIcon, ChevronLeftIcon, FlashIcon, FlipCameraIcon, HelpIcon, KeyboardIcon, KeypadIcon } from "./app-icons";
import { ManualCodeSheet } from "./manual-code-sheet";

type CameraState = "starting" | "scanning" | "denied" | "unavailable" | "insecure";

const CAMERA_MESSAGES: Record<Exclude<CameraState, "starting" | "scanning">, { title: string; body: string }> = {
  denied: {
    title: "Camera access is off",
    body: "Allow camera access for this site in your browser settings, then tap the green button to try again. Or enter the backup code instead.",
  },
  unavailable: {
    title: "No camera found",
    body: "We couldn't open a camera on this device. You can enter the code by hand instead.",
  },
  insecure: {
    title: "Camera needs a secure connection",
    body: "Browsers only allow the camera on secure (https) pages. Enter the backup code instead.",
  },
};

export function ScanScreen({
  initialManual = false,
  variant = "product",
}: {
  initialManual?: boolean;
  /** "carton" is the retailer scanner: it checks cartons, not shopper products. */
  variant?: "product" | "carton";
}) {
  const carton = variant === "carton";
  const resultBase = carton ? site.retailer.result : site.links.verify;
  const backHref = carton ? site.retailer.home : site.links.home;
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScannerType | null>(null);
  const handledRef = useRef(false);
  const lastBadRef = useRef<{ data: string; at: number } | null>(null);

  const [camera, setCamera] = useState<CameraState>("starting");
  const [attempt, setAttempt] = useState(0);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(initialManual);

  const closeManual = useCallback(() => setManualOpen(false), []);

  useEffect(() => {
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
            // Not a SKANPROOV code. Keep scanning, and don't flash the same notice repeatedly.
            const last = lastBadRef.current;
            if (!last || last.data !== result.data || Date.now() - last.at > 3000) {
              lastBadRef.current = { data: result.data, at: Date.now() };
              setNotice("That doesn't look like a SKANPROOV code. Try the code on the carton.");
            }
            return;
          }

          handledRef.current = true;
          scanner.stop();
          navigator.vibrate?.(40);
          router.push(`${resultBase}/${encodeURIComponent(code)}`);
        },
        {
          preferredCamera: facing,
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
    // `facing` and `attempt` intentionally restart the camera.
  }, [facing, attempt, router, resultBase]);

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

  const problem = camera === "denied" || camera === "unavailable" || camera === "insecure" ? CAMERA_MESSAGES[camera] : null;

  return (
    <div className="space-y-4 px-3 pb-4 pt-3">
      <section
        aria-label="Camera"
        className="relative h-[min(64dvh,560px)] min-h-[420px] overflow-hidden rounded-3xl bg-[#101a14]"
      >
        <video ref={videoRef} muted playsInline className="absolute inset-0 size-full object-cover" />
        {camera === "scanning" ? <div className="absolute inset-0 bg-black/25" aria-hidden="true" /> : null}

        <Link
          href={backHref}
          aria-label="Back"
          className="absolute left-4 top-4 grid size-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white"
        >
          <ChevronLeftIcon className="size-5" />
        </Link>
        <button
          type="button"
          onClick={() =>
            setNotice("Hold your phone steady over the QR code on the carton. Use flash if it's dark.")
          }
          aria-label="Help"
          className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white"
        >
          <HelpIcon className="size-5" />
        </button>

        <div
          className="pointer-events-none absolute left-1/2 top-[27%] h-[200px] w-[min(250px,64%)] -translate-x-1/2"
          aria-hidden="true"
        >
          <span className="absolute left-0 top-0 size-12 rounded-tl-2xl border-l-[3px] border-t-[3px] border-white" />
          <span className="absolute right-0 top-0 size-12 rounded-tr-2xl border-r-[3px] border-t-[3px] border-white" />
          <span className="absolute bottom-0 left-0 size-12 rounded-bl-2xl border-b-[3px] border-l-[3px] border-white" />
          <span className="absolute bottom-0 right-0 size-12 rounded-br-2xl border-b-[3px] border-r-[3px] border-white" />
          {camera === "scanning" ? (
            <span className="scan-line absolute inset-x-5 top-1/2 h-0.5 rounded-full bg-[#7ee0b0] shadow-[0_0_12px_#7ee0b0]" />
          ) : (
            <span className="absolute inset-x-5 top-[30%] h-0.5 rounded-full bg-[#7ee0b0]/70" />
          )}
        </div>

        <div className="absolute inset-x-6 bottom-9 text-center text-white">
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
              <p className="mt-1.5 text-[13px] leading-[1.45] text-white/70">Hold steady. Scanning starts by itself.</p>
            </>
          )}
        </div>

        {notice ? (
          <p
            role="status"
            className="absolute inset-x-5 top-[72px] rounded-xl bg-black/70 px-4 py-2.5 text-center text-[13px] leading-[1.4] text-white backdrop-blur"
          >
            {notice}
          </p>
        ) : null}
      </section>

      <section aria-label="Camera controls" className="flex items-center justify-between rounded-2xl bg-white px-8 py-3.5 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
        <button
          type="button"
          onClick={toggleFlash}
          disabled={!hasFlash}
          aria-pressed={flashOn}
          className="flex w-16 flex-col items-center gap-1.5 text-xs text-body disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-brand"
        >
          <span className={`grid size-11 place-items-center rounded-full ${flashOn ? "bg-brand-soft text-brand" : "bg-[#f1f3f1] text-body"}`}>
            <FlashIcon off={!flashOn} className="size-5" />
          </span>
          Flash {flashOn ? "ON" : "OFF"}
        </button>

        <button
          type="button"
          onClick={() => setAttempt((n) => n + 1)}
          aria-label={camera === "scanning" ? "Restart scanner" : "Try the camera again"}
          className="grid size-[60px] place-items-center rounded-full bg-brand text-white shadow-[0_4px_12px_rgba(10,122,74,0.35)] ring-4 ring-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <ScanIcon className="size-7" strokeWidth={2.2} />
        </button>

        <button
          type="button"
          onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
          className="flex w-16 flex-col items-center gap-1.5 text-xs text-body focus-visible:outline-2 focus-visible:outline-brand"
        >
          <span className="grid size-11 place-items-center rounded-full bg-[#f1f3f1] text-body">
            <FlipCameraIcon className="size-5" />
          </span>
          Flip Lens
        </button>
      </section>

      {carton ? (
        <section className="rounded-2xl bg-white p-3 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-white">
              <KeypadIcon className="size-[18px]" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold leading-5 text-ink">Label damaged or unreadable?</h2>
              <p className="text-xs leading-[1.4] text-body">Type the carton code printed under the QR code</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <KeyboardIcon className="size-[18px]" />
            Enter Carton Code
          </button>
        </section>
      ) : (
        <>
      <section className="rounded-2xl bg-white p-3 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-white">
            <KeypadIcon className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold leading-5 text-ink">Unreadable or Smudged Seal?</h2>
            <p className="text-xs leading-[1.4] text-body">Scratch silver coating for 12-digit backup PIN</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setManualOpen(true)}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <KeyboardIcon className="size-[18px]" />
          Enter Code Manually
        </button>
      </section>

      <aside className="flex gap-2.5 rounded-2xl bg-white p-4 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
        <BulbIcon className="mt-0.5 size-5 shrink-0 text-brand" />
        <div>
          <p className="text-[13px] font-bold leading-5 text-ink">Pro Tip for Quick Scans</p>
          <p className="mt-0.5 text-[13px] leading-[1.45] text-body">
            Tilt your phone at a 15° angle under direct glare to illuminate the optical diffraction pattern on
            anti-counterfeit seals.
          </p>
        </div>
      </aside>

        </>
      )}

      <ManualCodeSheet open={manualOpen} onClose={closeManual} variant={variant} />
    </div>
  );
}
