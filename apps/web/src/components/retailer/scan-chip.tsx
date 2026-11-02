import { CHIP_TONES, scanChip, type ScanEntry } from "@/lib/retailer/format";

export function ScanChip({ scan }: { scan: Pick<ScanEntry, "status" | "received"> }) {
  const chip = scanChip(scan);
  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ${CHIP_TONES[chip.tone]}`}>
      {chip.label}
    </span>
  );
}
