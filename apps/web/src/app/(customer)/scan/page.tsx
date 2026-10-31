import type { Metadata } from "next";
import { ScanScreen } from "@/components/app/scan-screen";

export const metadata: Metadata = { title: "Scan a product" };

/** Public on purpose: shoppers can scan without an account. */
export default async function ScanPage({ searchParams }: { searchParams: Promise<{ manual?: string }> }) {
  const { manual } = await searchParams;
  return <ScanScreen initialManual={manual === "1"} />;
}
