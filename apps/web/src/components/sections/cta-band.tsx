import { site } from "@/lib/site";
import { ButtonLink } from "../button";
import { ArrowIcon } from "../icons";
import { Section } from "../section";

export function CtaBand() {
  return (
    <Section tone="brand" className="pb-16 pt-14 md:pb-[82px] md:pt-[71px]">
      <div className="mx-auto max-w-[720px] text-center">
        <h2 className="text-[32px] leading-none tracking-normal sm:text-[40px] md:text-5xl">
          Protect your brand. Protect your customers.
        </h2>
        <p className="mt-7 text-lg leading-[1.6] text-white/85">See SKANPROOV working on your products.</p>
        <div className="mt-9">
          <ButtonLink href={site.links.demo} variant="light" size="xl">
            Request a demo
            <ArrowIcon className="size-4" />
          </ButtonLink>
        </div>
        <p className="mt-3.5 text-sm leading-5 text-white/75">We&apos;ll reply within one business day.</p>
      </div>
    </Section>
  );
}
