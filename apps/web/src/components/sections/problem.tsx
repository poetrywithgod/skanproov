import { CheckIcon, QrIcon } from "../icons";
import { Section } from "../section";

const questions = [
  "Is this exact product or carton registered?",
  "Where has it been on its way to you?",
  "Does its verification behaviour make sense?",
];

export function Problem() {
  return (
    <Section tone="tint" className="pb-14 pt-14 md:pb-20 md:pt-[81px]">
      <h2 className="max-w-[720px] text-[34px] leading-none sm:text-[40px] md:text-5xl">
        A QR code that works is not proof.
      </h2>
      <p className="mt-5 max-w-[672px] text-lg leading-[1.6] text-body">
        Anyone can print a QR code. Real protection means knowing the exact item in your hand.
      </p>

      <div className="mt-10 md:mt-[55px]">
        <div className="rounded-2xl border border-line-strong px-5 pb-8 pt-6 sm:px-8 sm:pb-[47px] sm:pt-[34px]">
          <p className="text-sm font-medium leading-4 text-label">What most tools ask</p>
          <p className="mt-[18px] text-xl font-semibold leading-8 text-body sm:text-2xl">Does this QR code work?</p>
          <p className="mt-[25px] flex items-center gap-3 text-sm leading-5 text-label">
            <QrIcon className="size-5 shrink-0" />A copied code passes this test every time.
          </p>
        </div>

        <div className="mt-4 rounded-2xl bg-brand px-5 pb-[35px] pt-8 text-white sm:px-8">
          <p className="text-sm font-medium leading-4 text-white/80">What SKANPROOV asks</p>
          <ul className="mt-[21px] space-y-[15.5px]">
            {questions.map((q) => (
              <li key={q} className="flex min-h-7 items-center gap-3 text-base font-semibold leading-7 sm:text-xl">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/20">
                  <CheckIcon className="size-4" strokeWidth={3.5} />
                </span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
