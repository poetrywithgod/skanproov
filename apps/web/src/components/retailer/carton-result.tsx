import Link from "next/link";
import { markReceivedAction } from "@/app/retailer/actions";
import { AlertTriangleIcon } from "@/components/app/app-icons";
import { CheckIcon, ScanIcon } from "@/components/icons";
import { REPORT_PATH } from "@/lib/retailer/paths";
import type { CartonResult, CartonStatus } from "@/lib/retailer/format";
import { formatDateTime } from "@/lib/retailer/format";
import { site } from "@/lib/site";

type Known = Exclude<CartonResult, { status: "unavailable" }>;

const COPY: Record<
  CartonStatus,
  { title: string; sub: string; header: string; icon: string; steps: string[] }
> = {
  safe: {
    title: "Safe to receive",
    sub: "This carton is registered and matches its manufacturer.",
    header: "bg-brand",
    icon: "bg-white/20",
    steps: ["Check that the carton seal is not broken.", "Tap Mark as received to add it to your stock record."],
  },
  suspicious: {
    title: "Suspicious — Hold for investigation",
    sub: "We could not confirm this carton.",
    header: "bg-[#8a4b05]",
    icon: "bg-white/20",
    steps: [
      "Set the carton aside. Do not put it on your shelf or sell it.",
      "Do not pay the supplier for it until it is cleared.",
      "Report the issue so it can be looked into.",
    ],
  },
  recalled: {
    title: "Recalled — Do not receive",
    sub: "The manufacturer has recalled this batch.",
    header: "bg-[#6b2bb5]",
    icon: "bg-white/20",
    steps: [
      "Do not put it on your shelf or sell it. Keep it away from other stock.",
      "Ask your supplier or the manufacturer how to return it.",
    ],
  },
  expired: {
    title: "Expired — Do not receive",
    sub: "This batch is past its expiry date.",
    header: "bg-[#4a5568]",
    icon: "bg-white/20",
    steps: ["Do not put it on your shelf or sell it.", "Return it to your supplier or ask the manufacturer how to dispose of it."],
  },
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-3 text-sm last:border-b-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-semibold text-ink">{children}</span>
    </div>
  );
}

export function CartonResultView({ code, result, now }: { code: string; result: Known; now: Date }) {
  const copy = COPY[result.status];
  const c = result.carton;
  const heading = result.status === "safe" ? "Why it passed" : "Why";
  const next = result.status === "safe" ? "Before you accept it" : "What to do now";
  const reportHref = `${REPORT_PATH}?code=${encodeURIComponent(code)}`;

  return (
    <div className="pb-4">
      <section className={`${copy.header} px-5 pb-7 pt-6 text-center text-white`}>
        <span className={`mx-auto grid size-14 place-items-center rounded-full ${copy.icon}`}>
          {result.status === "safe" ? (
            <CheckIcon className="size-7" strokeWidth={3} />
          ) : (
            <AlertTriangleIcon className="size-7" />
          )}
        </span>
        <h1 className="mt-3 text-[22px] font-bold leading-7 tracking-normal">{copy.title}</h1>
        <p className="mt-1 text-sm text-white/85">{copy.sub}</p>
      </section>

      <div className="space-y-4 px-3 pt-4">
        <section className="rounded-2xl bg-white p-4 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted">{heading}</h2>
          <p className="mt-1.5 text-[15px] leading-[1.5] text-ink">{result.reason}</p>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted">{next}</h2>
          <ol className="mt-2 space-y-2.5">
            {copy.steps.map((step, i) => (
              <li key={step} className="flex gap-3 text-[15px] leading-[1.45] text-ink">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#e6eee8] text-xs font-bold text-body">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section aria-label="Carton details" className="rounded-2xl bg-white px-4 py-2 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
          <h2 className="pt-2 text-xs font-bold uppercase tracking-wide text-muted">Carton details</h2>
          {c ? (
            <>
              <Row label="Product">{c.variant ? `${c.product} · ${c.variant}` : c.product}</Row>
              <Row label="Manufacturer">{c.manufacturer}</Row>
              <Row label="Batch">{c.batchNumber}</Row>
              <Row label="Carton">{c.cartonNumber}</Row>
            </>
          ) : (
            <>
              <Row label="Code entered">
                <span className="break-all font-mono">{code}</span>
              </Row>
              <p className="pb-3 pt-1 text-[13px] text-body">This code is not in the SKANPROOV register.</p>
            </>
          )}
          <Row label="Scanned">{formatDateTime(now.toISOString())}</Row>
        </section>

        <p className="px-1 text-center text-[13px] text-body">Saved to your history.</p>

        {result.status === "safe" ? (
          result.received ? (
            <p className="flex h-[52px] items-center justify-center gap-2 rounded-xl bg-brand-soft text-[15px] font-semibold text-brand-deep">
              <CheckIcon className="size-5" strokeWidth={3} /> Marked as received
            </p>
          ) : (
            <form action={markReceivedAction}>
              <input type="hidden" name="scanId" value={result.scanId} />
              <button
                type="submit"
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <CheckIcon className="size-5" strokeWidth={3} /> Mark as received
              </button>
            </form>
          )
        ) : null}

        {result.status === "suspicious" ? (
          <>
            <Link
              href={reportHref}
              className="flex h-[52px] items-center justify-center rounded-xl bg-danger text-[15px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
            >
              Report issue
            </Link>
            {c ? (
              <Link
                href={site.retailer.manufacturers}
                className="flex h-[52px] items-center justify-center rounded-xl border border-line-strong bg-white text-[15px] font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Connect to manufacturer
              </Link>
            ) : null}
          </>
        ) : null}

        <Link
          href={site.retailer.scan}
          className={`flex h-[52px] items-center justify-center gap-2.5 rounded-xl text-[15px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
            result.status === "safe" && !result.received
              ? "border border-line-strong bg-white text-ink"
              : result.status === "suspicious"
                ? "text-body"
                : "bg-brand text-white hover:bg-brand-dark"
          }`}
        >
          <ScanIcon className="size-5" />
          Scan next carton
        </Link>
      </div>
    </div>
  );
}
