import type { Metadata } from "next";
import { HelpView } from "@/components/app/help-view";

export const metadata: Metadata = { title: "Help Center" };

/** Public: shoppers can read this without an account. */
export default function HelpPage() {
  return <HelpView />;
}
