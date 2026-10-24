import Image from "next/image";
import { site } from "@/lib/site";
import { ButtonLink } from "../button";
import { ArrowIcon, CheckIcon, PinIcon, ScanIcon } from "../icons";
import { ProductDetails } from "../product-details";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-12 md:grid-cols-2 md:py-24">
      <div>
        <p className="text-xs font-medium text-brand">{site.tagline}</p>
        <h1 className="mt-4 text-4xl font-bold leading-[1.05] md:text-6xl">Know it&apos;s genuine before you buy it.</h1>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-muted md:text-base">
          SKANPROOV gives every product a unique digital identity. Shoppers check it in seconds. Brands protect it from
          factory to shelf.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href={site.links.scan}>
            <ScanIcon className="size-4" />
            Scan a product
          </ButtonLink>
          <ButtonLink href={site.links.getStarted} variant="outline">
            Get Started
            <ArrowIcon className="size-4" />
          </ButtonLink>
        </div>
        <p className="mt-4 text-xs text-muted">No account. No app. Scan right here in your browser.</p>
      </div>

      <div className="relative mx-auto w-full max-w-sm pb-10 md:max-w-md">
        <Image
          src="/images/hero-scan.jpg"
          alt="A shopper scanning a product code on a carton with a phone"
          width={800}
          height={1000}
          priority
          sizes="(min-width: 768px) 448px, 90vw"
          className="aspect-[4/5] w-full rounded-lg object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 mx-auto w-[78%] overflow-hidden rounded-lg border border-line bg-white shadow-xl">
          <div className="flex items-center gap-2 bg-brand px-3 py-2 text-white">
            <CheckIcon className="size-4 rounded-full bg-white/20 p-0.5" />
            <div>
              <p className="text-xs font-semibold leading-tight">Genuine product</p>
              <p className="text-[10px] leading-tight opacity-80">Registered with SKANPROOV</p>
            </div>
          </div>
          <div className="px-3 pb-1 pt-1">
            <ProductDetails />
          </div>
          <p className="flex items-center gap-1 border-t border-line px-3 py-2 text-[10px] text-muted">
            <PinIcon className="size-3" />
            Scanned just now · Ikeja, Lagos
          </p>
        </div>
      </div>
    </section>
  );
}
