import Link from "next/link";
import { CheckIcon, ScanIcon } from "@/components/icons";
import type { Ad } from "@/lib/ads";
import type { VerifyResult } from "@/lib/verify";
import { site } from "@/lib/site";
import { AlertTriangleIcon, ChevronRightIcon } from "./app-icons";
import { CopyButton } from "./copy-button";
import { SponsoredBanner } from "./sponsored-banner";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

function Row({ label, children, copy }: { label: string; children: React.ReactNode; copy?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-3.5 last:border-b-0">
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <div className="mt-0.5 break-words text-[15px] font-semibold text-ink">{children}</div>
      </div>
      {copy ? <CopyButton value={copy} label={label} /> : null}
    </div>
  );
}

export function ResultView({
  code,
  result,
  ads,
  now = new Date(),
}: {
  code: string;
  result: VerifyResult;
  ads: Ad[];
  now?: Date;
}) {
  const reportHref = `${site.links.report}?code=${encodeURIComponent(code)}`;

  return (
    <div className="pb-4">
      <SponsoredBanner ads={ads} />

      <div className="space-y-4 px-3 pt-4">
        {result.status === "genuine" ? (
          <>
            <section className="rounded-2xl bg-brand-soft p-5 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand text-white">
                <CheckIcon className="size-7" strokeWidth={3} />
              </span>
              <h1 className="mt-3 text-2xl font-bold tracking-normal text-brand-deep">Genuine product</h1>
              <p className="mt-1 text-sm text-body">You are holding a product registered with SKANPROOV.</p>
            </section>

            <section aria-label="Product details" className="rounded-2xl bg-white px-4 py-2 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
              <div className="border-b border-line py-3.5">
                <p className="text-lg font-bold text-ink">{result.product.name}</p>
                {result.product.variant ? <p className="text-sm text-body">{result.product.variant}</p> : null}
              </div>
              <Row label="Manufacturer">{result.product.manufacturer}</Row>
              <Row label="Batch number" copy={result.product.batchNumber}>
                {result.product.batchNumber}
              </Row>
              {result.product.nafdacNumber ? (
                <Row label="NAFDAC reg. no." copy={result.product.nafdacNumber}>
                  {result.product.nafdacNumber}
                </Row>
              ) : null}
              <Row label="Manufactured">{formatDate(result.product.manufacturedOn)}</Row>
              {result.product.expiresOn ? (
                <Row label="Expires">
                  <span className="flex flex-wrap items-center gap-2">
                    {formatDate(result.product.expiresOn)}
                    {new Date(`${result.product.expiresOn}T23:59:59Z`) >= now ? (
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">Valid</span>
                    ) : (
                      <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
                        Expired
                      </span>
                    )}
                  </span>
                </Row>
              ) : null}
            </section>
          </>
        ) : result.status === "not_verified" ? (
          <section className="rounded-2xl bg-danger-soft p-5 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-danger text-white">
              <AlertTriangleIcon className="size-7" />
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-normal text-danger">Not verified</h1>
            <p className="mt-1 text-sm text-body">We couldn&apos;t verify this product.</p>
            <p className="mt-2 text-sm text-body">
              Don&apos;t use this product until you&apos;re sure. Tell the brand what you found, it takes a few taps.
            </p>
            <Link
              href={reportHref}
              className="mt-4 flex h-12 items-center justify-center rounded-xl bg-danger text-sm font-semibold text-white"
            >
              Report this product
            </Link>
          </section>
        ) : (
          <section className="rounded-2xl bg-white p-5 text-center shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
            <h1 className="text-xl font-bold tracking-normal text-ink">Verification isn&apos;t available yet</h1>
            <p className="mt-2 text-sm leading-[1.5] text-body">
              We couldn&apos;t check this code right now. That doesn&apos;t mean the product is fake or genuine. Please try
              again later.
            </p>
          </section>
        )}

        <Link
          href={site.links.scan}
          className="flex h-[52px] items-center justify-center gap-2.5 rounded-xl bg-brand text-[15px] font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <ScanIcon className="size-5" />
          Scan another product
        </Link>

        {result.status === "genuine" ? (
          <Link
            href={reportHref}
            className="flex items-center justify-between rounded-2xl bg-white p-4 text-sm shadow-[0_1px_4px_rgba(15,31,23,0.06)]"
          >
            <span>
              <span className="block font-semibold text-ink">Something looks wrong?</span>
              <span className="text-body">Report an issue</span>
            </span>
            <ChevronRightIcon className="size-5 text-muted" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
