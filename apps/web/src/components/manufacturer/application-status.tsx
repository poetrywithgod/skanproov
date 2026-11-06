import Link from "next/link";
import type { ManufacturerApplication } from "@/lib/manufacturer/data";
import { site } from "@/lib/site";

const COPY = {
  pending: {
    title: "We are checking your details",
    body: "This usually takes one to two working days. We will e-mail you as soon as your manufacturer account is ready.",
    tone: "bg-brand-soft text-brand-900",
  },
  approved: {
    title: "You are approved",
    body: "Your manufacturer account is ready. The manufacturer dashboard is coming soon; we will e-mail you when it opens.",
    tone: "bg-brand-soft text-brand-900",
  },
  rejected: {
    title: "We could not approve this application",
    body: "Check the details below and send it again.",
    tone: "bg-warn-soft text-warn",
  },
} as const;

/** Where a manufacturer waits after applying. */
export function ApplicationStatus({ application }: { application: ManufacturerApplication }) {
  const copy = COPY[application.status];
  return (
    <div className="mt-8 space-y-4">
      <div role="status" className={`rounded-xl px-5 py-5 ${copy.tone}`}>
        <h2 className="text-lg font-semibold tracking-tight">{copy.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-body">{copy.body}</p>
        {application.reviewNote ? <p className="mt-2 text-sm font-medium text-ink">{application.reviewNote}</p> : null}
      </div>

      <dl className="divide-y divide-row-line rounded-xl border border-line bg-white text-[15px]">
        {[
          ["Company", application.company],
          ["RC number", application.rcNumber],
          ["Makes", application.category],
          ["City", application.city],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <Link href={site.links.scan} className="block text-center text-sm font-semibold text-brand hover:underline">
        Scan a product in the meantime
      </Link>
    </div>
  );
}
