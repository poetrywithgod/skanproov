import { z } from "zod";

export const CODE_FILES_BUCKET = "code-files";

/** The most codes one generation can make. The database allows more; the label PDF is the limit here. */
export const CODE_RUN_MAX = 10_000;

export const CODE_FORMATS = ["qr_pin", "pin_only"] as const;
export type CodeFormat = (typeof CODE_FORMATS)[number];

export const CODE_FORMAT_LABELS: Record<CodeFormat, { title: string; note: string; summary: string }> = {
  qr_pin: { title: "QR code + PIN", note: "Scan or enter a 12-digit PIN", summary: "QR code + PIN" },
  pin_only: { title: "PIN only", note: "12-digit scratch-off verification", summary: "PIN only" },
};

export const generateCodesSchema = z.object({
  batchId: z.uuid({ error: "Choose a batch" }),
  quantity: z.coerce
    .number({ error: "Enter how many codes" })
    .int("Enter a whole number")
    .min(1, "Enter at least 1 code")
    .max(CODE_RUN_MAX, `You can generate up to ${CODE_RUN_MAX.toLocaleString("en-US")} codes at a time`),
  format: z.enum(CODE_FORMATS, { error: "Choose a verification format" }),
});
export type GenerateCodesInput = z.input<typeof generateCodesSchema>;

/** "GEN-00128" */
export function runCode(runNo: number): string {
  return `GEN-${String(runNo).padStart(5, "0")}`;
}
