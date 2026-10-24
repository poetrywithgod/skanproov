import Image from "next/image";
import { Section } from "../section";

const sides = [
  { title: "Manufacturers", body: "Register products, prove they are genuine, and handle consumer reports as open cases." },
  { title: "Distributors", body: "Verify stock at carton level as goods move through your hands." },
  { title: "Retailers", body: "Confirm what you receive and show customers it is genuine." },
  { title: "Consumers", body: "Scan any product, get a verdict, and report a problem in a few taps." },
];

export function Ecosystem() {
  return (
    <Section id="who-its-for" tone="tint" className="pb-16 pt-14 md:pt-20">
      <Image
        src="/images/shopper.jpg"
        alt="A shopper checking a product with their phone in a neighbourhood store"
        width={895}
        height={672}
        sizes="(min-width: 943px) 895px, 100vw"
        className="aspect-[895/672] w-full rounded-3xl object-cover"
      />

      <h2 className="mt-[62px] max-w-[760px] text-[34px] leading-none tracking-normal sm:text-[40px] md:text-5xl">
        One ecosystem. Four sides, all connected.
      </h2>
      <p className="mt-[27px] max-w-[520px] text-lg leading-[30px] text-body">
        Most tools stop at a QR check. SKANPROOV links everyone who touches a product.
      </p>

      <div className="mt-[40.6px] grid gap-x-10 sm:grid-cols-2">
        {sides.map((side) => (
          <div key={side.title} className="border-t border-divider pb-[25px] pt-[23px]">
            <h3 className="text-base font-bold leading-6 text-ink">{side.title}</h3>
            <p className="mt-2 text-base leading-[26px] text-body">{side.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
