import { site } from "@/lib/site";
import { ButtonLink } from "../button";
import { ArrowIcon } from "../icons";
import { Section } from "../section";

export function CtaBand() {
  return (
    <Section tone="brand">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold leading-tight md:text-5xl">Protect your brand. Protect your customers.</h2>
        <p className="mt-4 text-sm text-white/80">See SKANPROOV working on your products.</p>
        <div className="mt-6">
          <ButtonLink href={site.links.demo} variant="light">
            Request a demo
            <ArrowIcon className="size-4" />
          </ButtonLink>
        </div>
        <p className="mt-4 text-xs text-white/70">We&apos;ll reply within one business day.</p>
      </div>
    </Section>
  );
}
