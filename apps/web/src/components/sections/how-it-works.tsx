import { Section } from "../section";

const steps = [
  { title: "Register", body: "Every unit and every carton gets its own unique digital identity at the factory." },
  { title: "Scan along the way", body: "Cartons are scanned as they move, so stock is verified at carton level." },
  { title: "Verify", body: "Shoppers scan and get a clear answer: genuine, or not verified." },
  { title: "Learn", body: "Every scan becomes intelligence about where products actually go." },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works">
      <h2 className="max-w-xl text-3xl font-bold leading-tight md:text-5xl">From factory to shelf to your hand.</h2>
      <ol className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
        {steps.map((step, i) => (
          <li key={step.title}>
            <span className="grid size-7 place-items-center rounded-full bg-ink text-xs font-semibold text-white">
              {i + 1}
            </span>
            <h3 className="mt-4 text-sm font-bold tracking-normal">{step.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted md:text-sm">{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
