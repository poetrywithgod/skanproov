import Image from "next/image";
import { site } from "@/lib/site";
import { ButtonLink } from "../button";
import { ArrowIcon, CheckIcon, PinIcon, ScanIcon } from "../icons";

const details = [
  { label: "Product", value: "ABC Premium" },
  { label: "Manufacturer", value: "ABC Nigeria Ltd" },
  { label: "Batch", value: "BTH-02491" },
];

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-[88.95px] pt-16">
      <p className="text-sm font-medium leading-5 text-brand">{site.tagline}</p>

      <h1 className="mt-4 max-w-[820px] text-[40px] leading-none sm:text-5xl md:text-[60px]">
        Know it&apos;s genuine before you buy it.
      </h1>

      <p className="mt-6 max-w-[520px] text-lg leading-[1.6] text-body">
        SKANPROOV gives every product a unique digital identity. Shoppers check it in seconds. Brands protect it from
        factory to shelf.
      </p>

      <div className="mt-[38px] flex flex-wrap gap-3">
        <ButtonLink href={site.links.scan}>
          <ScanIcon className="size-4" />
          Scan a product
        </ButtonLink>
        <ButtonLink href={site.links.getStarted} variant="outline" className="gap-[22px] px-8">
          Get Started
          <ArrowIcon className="size-4" />
        </ButtonLink>
      </div>

      <p className="mt-6 text-sm leading-5 text-muted">No account. No app. Scan right here in your browser.</p>

      <div className="relative mx-auto mt-12 w-full max-w-[448px]">
        <Image
          src="/images/hero-scan.jpg"
          alt="A shopper scanning a product code on a carton with a phone"
          width={896}
          height={1120}
          priority
          sizes="(min-width: 512px) 448px, 90vw"
          className="aspect-[4/5] w-full rounded-[20px] object-cover"
        />

        <div className="absolute -bottom-8 -left-3 w-[280px] sm:-left-8 max-w-[calc(100%+2rem)] overflow-hidden rounded-2xl bg-white shadow-[0_24px_48px_-12px_rgba(15,31,23,0.25)]">
          <div className="flex h-[68px] items-center gap-3 bg-brand px-5 text-white">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-brand">
              <CheckIcon className="size-5" />
            </span>
            <div>
              <p className="text-[15px] font-semibold leading-5">Genuine product</p>
              <p className="text-xs leading-4 text-white/80">Registered with SKANPROOV</p>
            </div>
          </div>

          <dl className="px-5">
            {details.map((row) => (
              <div
                key={row.label}
                className="flex h-[45px] items-center justify-between border-b border-[#f0f2ef] last:border-b-0"
              >
                <dt className="text-xs text-muted">{row.label}</dt>
                <dd className="text-sm font-semibold text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>

          <p className="flex h-[38px] items-center gap-2 bg-card-foot px-5 text-xs text-muted">
            <PinIcon className="size-3.5 shrink-0" />
            Scanned just now · Ikeja, Lagos
          </p>
        </div>
      </div>
    </section>
  );
}
