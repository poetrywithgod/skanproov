import Link from "next/link";
import { site } from "@/lib/site";
import { ChevronRightIcon } from "./app-icons";

interface Faq {
  q: string;
  a: React.ReactNode;
}

const SECTIONS: { title: string; items: Faq[] }[] = [
  {
    title: "Verifying a product",
    items: [
      {
        q: "How do I check a product?",
        a: "Tap the green scan button and point your camera at the QR code on the carton. Scanning starts by itself and takes a second or two.",
      },
      {
        q: "The QR code is smudged or won't scan. What now?",
        a: "Scratch off the silver coating on the seal to reveal a 12-digit backup PIN, then choose Enter Code Manually on the scan screen and type it in.",
      },
      {
        q: "Do I need an account to verify?",
        a: "No. Anyone can verify a product. Signing in lets you earn points, keep a history of your scans and receive notifications.",
      },
      {
        q: "The camera won't open.",
        a: "Allow camera access for this site in your browser settings and try again. The camera only works on secure (https) pages. If it still won't open, use the 12-digit backup PIN instead.",
      },
    ],
  },
  {
    title: "What the results mean",
    items: [
      {
        q: "Genuine product",
        a: "The code is registered with SKANPROOV and passed its checks. You'll see the manufacturer, batch number, NAFDAC number and dates.",
      },
      {
        q: "Duplicate code",
        a: "This code was already scanned by someone else, so it may have been copied. Look closely at the seal and think about where you bought it. If something looks wrong, report it.",
      },
      {
        q: "Not verified",
        a: "We couldn't confirm the code. That is not proof the product is fake: the code may have been mistyped, or the batch may not be registered yet. Don't use the product until you're sure, and tell us what you found.",
      },
      {
        q: "Recalled or expired",
        a: "A recalled batch has been pulled by its manufacturer, and an expired product is past its date. Don't use either one.",
      },
    ],
  },
  {
    title: "Reward points",
    items: [
      {
        q: "How do I earn points?",
        a: "When you're signed in, the first genuine scan of a code earns that product's points. Scanning the same code again doesn't earn more, and a duplicate code earns nothing.",
      },
      {
        q: "Where can I see my points?",
        a: "On the Home screen, and in History under Rewards Ledger.",
      },
      {
        q: "Can I spend my points yet?",
        a: "Not yet. Using points for rewards like mobile data and electricity is coming soon.",
      },
    ],
  },
  {
    title: "Your account",
    items: [
      {
        q: "How do I change my name or phone number?",
        a: (
          <>
            Go to Profile, then{" "}
            <Link href={site.links.editProfile} className="font-semibold text-brand underline">
              Edit Personal Details
            </Link>
            .
          </>
        ),
      },
      {
        q: "I forgot my password.",
        a: (
          <>
            Use{" "}
            <Link href={site.links.forgotPassword} className="font-semibold text-brand underline">
              Forgot password
            </Link>{" "}
            on the sign-in page and we&apos;ll e-mail you a link. If you&apos;re signed in, you can change it under Profile →
            Change Password.
          </>
        ),
      },
      {
        q: "What is saved when I scan?",
        a: "Only when you're signed in, we save the product you scanned, the result, the time and any points earned, so you can see them in History. Scanning without an account saves nothing.",
      },
    ],
  },
];

export function HelpView() {
  return (
    <div className="px-4 pb-4 pt-5">
      <h1 className="text-[26px] font-bold leading-8 tracking-normal text-ink">Help Center</h1>
      <p className="mt-0.5 text-[13px] text-body">Answers about verifying products and your account.</p>

      {SECTIONS.map((section) => (
        <section key={section.title} className="mt-6">
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-body">{section.title}</h2>
          <div className="divide-y divide-line rounded-2xl bg-white shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
            {section.items.map((item) => (
              <details key={item.q} className="group px-4">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-3 text-[15px] font-semibold text-ink [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-brand">
                  {item.q}
                  <ChevronRightIcon className="size-5 shrink-0 text-muted transition-transform group-open:rotate-90" />
                </summary>
                <div className="pb-4 text-sm leading-[1.55] text-body">{item.a}</div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
