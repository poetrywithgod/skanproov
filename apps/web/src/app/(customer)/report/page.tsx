import type { Metadata } from "next";
import { ReportForm } from "@/components/app/report-form";

export const metadata: Metadata = { title: "Report an issue", robots: { index: false } };

/** Public: a confidential tip should not need an account. */
export default async function ReportPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  return (
    <div className="space-y-4 px-3 pb-4 pt-5">
      <div className="px-2">
        <h1 className="text-[26px] font-bold leading-8 tracking-normal text-ink">Report an issue</h1>
        <p className="mt-0.5 text-[13px] text-body">
          Tell us about a product or shop that doesn&apos;t look right. You don&apos;t need an account.
        </p>
      </div>
      <ReportForm initialCode={(code ?? "").slice(0, 64)} />
    </div>
  );
}
