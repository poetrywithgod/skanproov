import type { Metadata } from "next";
import { ResultView } from "@/components/app/result-view";
import { getAds } from "@/lib/ads";
import { verifyCode } from "@/lib/verify";

export const metadata: Metadata = { title: "Verification result", robots: { index: false } };

/** Public: anyone can verify a product without an account. */
export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw);
  const [result, ads] = await Promise.all([verifyCode(code), getAds("result_top")]);
  return <ResultView code={code} result={result} ads={ads} />;
}
