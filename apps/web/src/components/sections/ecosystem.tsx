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
    <Section id="who-its-for" tone="tint">
      <Image
        src="/images/shopper.jpg"
        alt="A shopper checking a product with their phone in a neighbourhood store"
        width={1200}
        height={800}
        sizes="(min-width: 1152px) 1112px, 90vw"
        className="aspect-[3/2] w-full rounded-lg object-cover md:aspect-[2.2/1]"
      />
      <h2 className="mt-10 max-w-xl text-3xl font-bold leading-tight md:text-5xl">
        One ecosystem. Four sides, all connected.
      </h2>
      <p className="mt-4 max-w-md text-sm text-muted md:text-base">
        Most tools stop at a QR check. SKANPROOV links everyone who touches a product.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
        {sides.map((side) => (
          <div key={side.title}>
            <h3 className="text-sm font-bold tracking-normal">{side.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted md:text-sm">{side.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
