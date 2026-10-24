import Link from "next/link";
import { ShieldIcon } from "./icons";

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-bold tracking-tight" aria-label="SKANPROOV home">
      <ShieldIcon className="size-5 text-brand" />
      <span className={tone === "light" ? "text-white" : "text-ink"}>
        SKAN<span className="text-brand">PROOV</span>
      </span>
    </Link>
  );
}
