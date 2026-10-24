import { CheckIcon, QrIcon } from "../icons";
import { Section } from "../section";

const questions = [
  "Is this exact product or carton registered?",
  "Where has it been on its way to you?",
  "Does its verification behaviour make sense?",
];

export function Problem() {
  return (
    <Section tone="tint">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          <h2 className="text-3xl font-bold leading-tight md:text-5xl">A QR code that works is not proof.</h2>
          <p className="mt-4 max-w-md text-sm text-muted md:text-base">
            Anyone can print a QR code. Real protection means knowing the exact item in your hand.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-white/60 p-5">
            <p className="text-xs text-muted">What most tools ask</p>
            <p className="mt-2 text-lg font-semibold">Does this QR code work?</p>
            <p className="mt-2 flex items-center gap-2 text-xs text-muted">
              <QrIcon className="size-4" />A copied code passes this test every time.
            </p>
          </div>

          <div className="rounded-lg bg-brand p-5 text-white">
            <p className="text-xs opacity-80">What SKANPROOV asks</p>
            <ul className="mt-3 space-y-3">
              {questions.map((q) => (
                <li key={q} className="flex items-start gap-3 text-sm font-semibold">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 rounded-full bg-white/20 p-0.5" />
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
