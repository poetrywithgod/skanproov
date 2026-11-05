import Link from "next/link";
import { AlertTriangleIcon, ChevronLeftIcon } from "@/components/app/app-icons";
import { CheckIcon, ScanIcon } from "@/components/icons";
import { formatDayTime, type CartonResult, type CartonStatus } from "@/lib/retailer/format";
import { REPORT_PATH } from "@/lib/retailer/paths";
import { site } from "@/lib/site";
import { ConfirmReceipt } from "./confirm-receipt";

type Known = Exclude<CartonResult, { status: "unavailable" }>;

const COPY: Record<
  CartonStatus,
  { eyebrow: string; title: string; sub: string; header: string; steps: string[] }
> = {
  safe: {
    eyebrow: "Verified",
    title: "Safe to receive",
    sub: "This carton is genuine and matches the manufacturer’s records.",
    header: "bg-retail",
    steps: ["Confirm receipt to add it to your stock records.", "Shelve it as normal."],
  },
  suspicious: {
    eyebrow: "Suspicious",
    title: "Hold for investigation",
    sub: "We could not confirm this carton.",
    header: "bg-[#8a4b05]",
    steps: [
      "Set the carton aside. Do not put it on your shelf or sell it.",
      "Do not pay the supplier for it until it is cleared.",
      "Report the issue so it can be looked into.",
    ],
  },
  recalled: {
    eyebrow: "Recalled",
    title: "Do not receive",
    sub: "The manufacturer has recalled this batch.",
    header: "bg-[#6b2bb5]",
    steps: [
      "Do not put it on your shelf or sell it. Keep it away from other stock.",
      "Ask your supplier or the manufacturer how to return it.",
    ],
  },
  expired: {
    eyebrow: "Expired",
    title: "Do not receive",
    sub: "This batch is past its expiry date.",
    header: "bg-[#4a5568]",
    steps: [
      "Do not put it on your shelf or sell it.",
      "Return it to your supplier or ask the manufacturer how to dispose of it.",
    ],
  },
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white">
      <h2 className="px-4 py-3.5 text-[15px] font-bold tracking-normal text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-5 border-t border-row-line px-4 py-3.5 text-[15px] leading-[1.4]">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right font-semibold text-ink">{children}</dd>
    </div>
  );
}

function ScanNext({ variant }: { variant: "outline" | "primary" | "text" }) {
  const style = {
    outline: "h-12 border border-line bg-white text-ink hover:bg-[#f4f6f4]",
    primary: "h-14 bg-retail text-white hover:bg-retail-dark",
    text: "h-12 text-body hover:bg-black/5",
  }[variant];
  return (
    <Link
      href={site.retailer.scan}
      className={`flex w-full items-center justify-center gap-2.5 rounded-2xl text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail ${style}`}
    >
      {variant === "primary" ? <ScanIcon className="size-5" /> : null}
      Scan next carton
    </Link>
  );
}

/** What a retailer sees after a carton is checked. */
export function CartonResultView({ code, result, now }: { code: string; result: Known; now: Date }) {
  const copy = COPY[result.status];
  const c = result.carton;
  const safe = result.status === "safe";
  const reportHref = `${REPORT_PATH}?code=${encodeURIComponent(code)}`;

  return (
    <div className="min-h-[calc(100dvh-7rem)] bg-pill pb-4">
      <header className={`${copy.header} px-4 pb-7 pt-4 text-white`}>
        <div className="flex items-center gap-1">
          <Link
            href={site.retailer.scan}
            aria-label="Back to the scanner"
            className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="size-6" />
          </Link>
          <p className="text-[17px] font-bold">Scan result</p>
        </div>
        <span className="mt-5 grid size-16 place-items-center rounded-2xl bg-white/20">
          {safe ? <CheckIcon className="size-8" strokeWidth={2.6} /> : <AlertTriangleIcon className="size-8" />}
        </span>
        <p className="mt-5 text-sm font-medium text-white/85">{copy.eyebrow}</p>
        <h1 className="mt-0.5 text-[32px] font-extrabold leading-tight tracking-[-0.03em]">{copy.title}</h1>
        <p className="mt-2 text-[15px] leading-[1.5] text-white/85">{copy.sub}</p>
      </header>

      <div className="space-y-3 px-4 pt-4">
        {safe ? null : (
          <Card title="Why">
            <p className="border-t border-row-line px-4 py-3.5 text-[15px] leading-[1.5] text-ink">{result.reason}</p>
          </Card>
        )}

        <Card title="What to do now">
          <ol className="space-y-3.5 border-t border-row-line px-4 py-4">
            {copy.steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-[15px] leading-[1.45] text-ink">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-retail-soft text-[13px] font-bold text-retail-dark">
                  {index + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card title="Carton details">
          <dl>
            {c ? (
              <>
                <Row label="Product">{c.variant ? `${c.product}, ${c.variant}` : c.product}</Row>
                <Row label="Manufacturer">{c.manufacturer}</Row>
                <Row label="Batch">{c.batchNumber}</Row>
                <Row label="Carton">{c.cartonNumber}</Row>
              </>
            ) : (
              <>
                <Row label="Code entered">
                  <span className="break-all">{code}</span>
                </Row>
                <p className="border-t border-row-line px-4 py-3 text-[13px] leading-[1.5] text-body">
                  This code is not in the SKANPROOV register.
                </p>
              </>
            )}
            <Row label="Scanned">{formatDayTime(result.scannedAt, now)}</Row>
          </dl>
        </Card>

        <p className="px-1 text-[13px] text-body">Saved to your history.</p>
      </div>

      <div className="mt-4 space-y-2.5 border-t border-line px-4 pt-4">
        {safe && !result.received ? (
          <>
            <ConfirmReceipt scanId={result.scanId} />
            <ScanNext variant="outline" />
          </>
        ) : null}

        {safe && result.received ? (
          <>
            <p
              role="status"
              className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-retail-soft text-base font-semibold text-retail-dark"
            >
              <CheckIcon className="size-5" strokeWidth={2.6} />
              Receipt confirmed
            </p>
            <ScanNext variant="primary" />
          </>
        ) : null}

        {result.status === "suspicious" ? (
          <>
            <Link
              href={reportHref}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-danger text-base font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
            >
              Report issue
            </Link>
            {c ? (
              <Link
                href={`${site.retailer.manufacturers}/${c.manufacturerId}`}
                className="flex h-12 w-full items-center justify-center rounded-2xl border border-line bg-white text-base font-semibold text-ink transition-colors hover:bg-[#f4f6f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail"
              >
                View {c.manufacturer}
              </Link>
            ) : null}
            <ScanNext variant="text" />
          </>
        ) : null}

        {result.status === "recalled" || result.status === "expired" ? <ScanNext variant="primary" /> : null}
      </div>
    </div>
  );
}
