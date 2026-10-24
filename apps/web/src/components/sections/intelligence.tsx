import { PinIcon } from "../icons";
import { Section } from "../section";

const questions = [
  "Where has this carton been?",
  "Is the same code showing up where it shouldn't?",
  "Do the scan patterns for this batch make sense?",
  "Where are shoppers reporting suspected fakes?",
];

// Illustrative sample data for the marketing mock-up only.
const reports = [
  { place: "Onitsha, Anambra", when: "12 min ago", label: "Suspected fake" },
  { place: "Kano Municipal", when: "1h ago", label: "Code not working" },
  { place: "Ikeja, Lagos", when: "3h ago", label: "Looks different" },
];

export function Intelligence() {
  return (
    <Section id="intelligence" tone="dark">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          <h2 className="text-3xl font-bold leading-tight md:text-5xl">Every scan tells you something.</h2>
          <p className="mt-4 max-w-md text-sm text-white/70 md:text-base">
            Brands see what their products see, and get answers to the questions counterfeiters hope you never ask.
          </p>
          <ul className="mt-6 space-y-3 text-sm font-semibold">
            {questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-white p-4 text-ink shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold">Consumer reports</p>
            <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-semibold text-danger">3</span>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {reports.map((r) => (
              <li key={r.place} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-xs font-semibold">
                    ABC Premium <span className="font-normal text-muted">BTH-02491</span>
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted">
                    <PinIcon className="size-3" />
                    {r.place} · {r.when}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-semibold text-danger">
                  {r.label}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-muted">
            All three reports share one batch and are three states — a pattern worth investigating.
          </p>
        </div>
      </div>
    </Section>
  );
}
