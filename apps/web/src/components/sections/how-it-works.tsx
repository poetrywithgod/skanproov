import { Section } from "../section";

const steps = [
  { title: "Register", body: "Every unit and every carton gets its own unique digital identity at the factory." },
  { title: "Scan along the way", body: "Cartons are scanned as they move, so stock is verified at carton level." },
  { title: "Verify", body: "Shoppers scan and get a clear answer: genuine, or not verified." },
  { title: "Learn", body: "Every scan becomes intelligence about where products actually go." },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" className="pb-14 pt-14 md:pb-[81px] md:pt-[81px]">
      <h2 className="max-w-[480px] text-[34px] leading-none sm:text-[40px] md:text-5xl">
        From factory to shelf to your hand.
      </h2>
      <ol className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2 md:mt-[63px] md:gap-y-[41px]">
        {steps.map((step, i) => (
          <li key={step.title}>
            <span className="grid size-10 place-items-center rounded-full bg-ink text-sm font-semibold text-white">
              {i + 1}
            </span>
            <h3 className="mt-[25px] text-lg font-bold leading-6 text-ink">{step.title}</h3>
            <p className="mt-[10px] max-w-[320px] text-base leading-[26px] text-body">{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
