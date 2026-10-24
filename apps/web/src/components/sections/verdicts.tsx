import { site } from "@/lib/site";
import { ButtonLink } from "../button";
import { CheckIcon, CloseIcon, FlagIcon } from "../icons";
import { Phone } from "../phone";
import { ProductDetails } from "../product-details";
import { Section } from "../section";

export function Verdicts() {
  return (
    <Section>
      <div className="grid gap-12 md:grid-cols-2 md:items-center">
        <div>
          <h2 className="text-3xl font-bold leading-tight md:text-5xl">The simplest part of the product.</h2>
          <p className="mt-4 max-w-md text-sm text-muted md:text-base">
            No account. No app. No complicated registration. Scan the code, wait a moment, and get an answer in plain
            language.
          </p>
          <p className="mt-4 max-w-md text-sm text-muted md:text-base">
            If a product can&apos;t be verified, we say so clearly and one tap lets you report it.
          </p>
          <ul className="mt-5 space-y-1.5 text-xs text-muted">
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-brand" />
              Green means genuine
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-danger" />
              Red means stop and report
            </li>
          </ul>
          <div className="mt-6">
            <ButtonLink href={site.links.scan}>Try it now</ButtonLink>
          </div>
        </div>

        <div className="flex items-start justify-center gap-4">
          <Phone>
            <div className="bg-brand px-4 pb-6 pt-4 text-center text-white">
              <p className="text-[9px] font-bold tracking-wide">SKANPROOV</p>
              <span className="mx-auto mt-4 grid size-12 place-items-center rounded-full bg-white text-brand">
                <CheckIcon className="size-6" />
              </span>
              <p className="mt-3 text-base font-bold">Genuine product</p>
              <p className="mt-1 text-[10px] opacity-80">You are holding a product registered with SKANPROOV.</p>
            </div>
            <div className="px-4 py-3">
              <ProductDetails />
              <p className="mt-2 rounded-md bg-tint py-2 text-center text-[10px] font-semibold text-brand">
                View product details
              </p>
            </div>
          </Phone>

          <Phone className="mt-8">
            <div className="bg-danger px-4 pb-6 pt-4 text-center text-white">
              <p className="text-[9px] font-bold tracking-wide">SKANPROOV</p>
              <span className="mx-auto mt-4 grid size-12 place-items-center rounded-full bg-white text-danger">
                <CloseIcon className="size-6" />
              </span>
              <p className="mt-3 text-base font-bold">Not verified</p>
              <p className="mt-1 text-[10px] opacity-80">We couldn&apos;t verify this product.</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-[10px] leading-relaxed text-muted">
                Don&apos;t use this product until you&apos;re sure. Tell the brand what you found. It takes a few taps.
              </p>
              <p className="mt-3 flex items-center justify-center gap-1 rounded-md bg-danger py-2 text-[10px] font-semibold text-white">
                <FlagIcon className="size-3" /> Report this product
              </p>
            </div>
          </Phone>
        </div>
      </div>
    </Section>
  );
}
