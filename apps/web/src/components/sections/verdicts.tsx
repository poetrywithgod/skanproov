import { site } from "@/lib/site";
import { ButtonLink } from "../button";
import { CheckIcon, CloseIcon, FlagIcon, ScanIcon, ShieldCheckIcon } from "../icons";
import { Phone } from "../phone";
import { Section } from "../section";

const product = [
  { label: "Product", value: "ABC Premium" },
  { label: "Manufacturer", value: "ABC Nigeria Ltd" },
  { label: "Batch", value: "BTH-02491" },
];

function PhoneBrand() {
  return (
    <p className="flex h-4 items-center justify-center gap-3 text-[11px] font-semibold">
      <ShieldCheckIcon className="size-[13px]" strokeWidth={2.4} />
      SKANPROOV
    </p>
  );
}

export function Verdicts() {
  return (
    <Section className="pb-20 pt-14 md:pb-[120.6px] md:pt-[71px]">
      <h2 className="text-[32px] leading-none tracking-normal sm:text-[40px] md:text-5xl">
        The simplest part of the product.
      </h2>

      <p className="mt-[34px] text-lg leading-[1.6] text-body">
        No account. No app. No complicated registration.&nbsp; Scan the code, wait a moment, and get an answer in plain
        language.
      </p>
      <p className="mt-[27px] text-lg leading-[1.6] text-body">
        If a product can&apos;t be verified, we say so clearly and one tap lets you report it.
      </p>

      <ul className="mt-[25px] flex flex-wrap items-center gap-x-6 gap-y-2 text-sm leading-5 text-muted">
        <li className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-brand" />
          Green means genuine
        </li>
        <li className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-danger" />
          Red means stop and report
        </li>
      </ul>

      <div className="mt-6">
        <ButtonLink href={site.links.scan}>
          <ScanIcon className="size-4" />
          Try it now
        </ButtonLink>
      </div>

      <div className="mt-[47px] flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-center sm:pr-[25px]">
        <Phone>
          <div className="bg-brand px-5 pb-[27px] pt-[49px] text-center text-white">
            <PhoneBrand />
            <span className="mx-auto mt-[22px] grid size-16 place-items-center rounded-full bg-white text-brand">
              <CheckIcon className="size-9" strokeWidth={2.6} />
            </span>
            <p className="mt-3 text-xl font-extrabold leading-7">Genuine product</p>
            <p className="mx-auto mt-[7px] max-w-[170px] text-xs leading-[17px] text-white/85">
              You are holding a product registered with SKANPROOV.
            </p>
          </div>
          <div className="flex flex-1 flex-col px-5 pb-[21px] pt-[15px]">
            <dl>
              {product.map((row) => (
                <div
                  key={row.label}
                  className="flex h-[37px] items-center justify-between border-b border-[#f0f2ef] text-xs last:border-b-0"
                >
                  <dt className="text-muted">{row.label}</dt>
                  <dd className="font-semibold text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-auto flex h-[39px] items-center justify-center rounded-xl bg-brand-soft text-xs font-semibold text-brand-deep">
              View product details
            </p>
          </div>
        </Phone>

        <Phone className="sm:mt-12">
          <div className="bg-danger px-5 pb-7 pt-[49px] text-center text-white">
            <PhoneBrand />
            <span className="mx-auto mt-[22px] grid size-16 place-items-center rounded-full bg-white text-danger">
              <CloseIcon className="size-7" strokeWidth={2.6} />
            </span>
            <p className="mt-3 text-xl font-extrabold leading-7">Not verified</p>
            <p className="mt-1.5 text-xs leading-[17px] text-white/85">We couldn&apos;t verify this product.</p>
          </div>
          <div className="flex flex-1 flex-col px-5 pb-[21px] pt-[17px]">
            <p className="text-xs leading-[19.2px] text-body">
              Don&apos;t use this product until you&apos;re sure. Tell the brand what you found, it takes a few taps.
            </p>
            <p className="mt-auto flex h-[39px] items-center justify-center gap-2 rounded-xl bg-danger text-xs font-semibold text-white">
              <FlagIcon className="size-4" strokeWidth={2.4} />
              Report this product
            </p>
          </div>
        </Phone>
      </div>
    </Section>
  );
}
