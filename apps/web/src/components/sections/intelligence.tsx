import { PinIcon } from "../icons";
import { Section } from "../section";

const questions = [
  "Where has this carton been?",
  "Is the same code showing up where it shouldn't?",
  "Do the scan patterns for this batch make sense?",
  "Where are shoppers reporting suspected fakes?",
];

type Tone = "red" | "orange";

// Illustrative sample data for the marketing mock-up only.
const reports: { place: string; when: string; label: string; tone: Tone }[] = [
  { place: "Onitsha, Anambra", when: "12 min ago", label: "Suspected fake", tone: "red" },
  { place: "Kano Municipal", when: "1 hr ago", label: "Code not working", tone: "orange" },
  { place: "Ikeja, Lagos", when: "3 hr ago", label: "Looks different", tone: "orange" },
];

const pillTone: Record<Tone, string> = {
  red: "bg-danger-soft text-danger",
  orange: "bg-warn-soft text-warn",
};

export function Intelligence() {
  return (
    <Section id="intelligence" tone="dark" className="pb-16 pt-14 md:pb-[80.7px] md:pt-[71px]">
      <h2 className="text-[32px] leading-none tracking-normal sm:text-[40px] md:text-5xl">
        Every scan tells you something.
      </h2>
      <p className="mt-[29px] max-w-[820px] text-lg leading-[30px] text-white/70">
        Brands see what their products see&nbsp; and get&nbsp; answers to the questions counterfeiters hope you never
        ask.
      </p>

      <ul className="mt-9">
        {questions.map((q) => (
          <li key={q} className="border-t border-white/[0.07] py-4 text-lg font-semibold leading-7 text-white/90">
            {q}
          </li>
        ))}
      </ul>

      <div className="mt-14 overflow-hidden rounded-2xl bg-white text-ink shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] md:mt-[86.5px]">
        <div className="flex h-14 items-center justify-between px-6 pt-1">
          <p className="text-sm font-bold leading-5">Consumer reports</p>
          <span className="h-6 w-24 rounded-full bg-danger-soft px-2.5 text-xs font-semibold leading-6 text-danger">
            3
          </span>
        </div>

        <ul className="mx-2 overflow-hidden rounded-xl border border-box-line">
          {reports.map((r) => (
            <li
              key={r.place}
              className="flex flex-col items-start justify-center gap-2.5 border-b border-row-line px-4 py-4 last:border-b-0 sm:min-h-[73px] sm:flex-row sm:items-center sm:justify-between sm:py-0 sm:last:min-h-[71px]"
            >
              <div className="min-w-0 sm:-mt-1">
                <p className="whitespace-nowrap text-sm leading-5">
                  <span className="font-bold">ABC Premium</span> <span className="text-muted">· BTH-02491</span>
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs leading-4 text-muted">
                  <PinIcon className="size-3 shrink-0" />
                  <span>
                    {r.place}· {r.when}
                  </span>
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 text-xs font-semibold leading-6 ${pillTone[r.tone]}`}
              >
                {r.label}
              </span>
            </li>
          ))}
        </ul>

        <p className="px-6 pb-[22px] pt-2.5 text-xs leading-4 text-muted">
          All three reports share one batch across three states — a pattern worth investigating.
        </p>
      </div>
    </Section>
  );
}
