import { z } from "zod";

export const BATCH_CERTIFICATE_BUCKET = "batch-certificates";
export const BATCH_CERTIFICATE_MAX_BYTES = 5 * 1024 * 1024;
export const BATCH_CERTIFICATE_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export const BATCH_MAX_UNITS = 100_000_000;

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => value || undefined);

const isoDate = (message: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, message);

/** Today in Nigeria (UTC+1, no daylight saving) as YYYY-MM-DD. */
export function todayInLagos(now = new Date()): string {
  return new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** A production batch, as declared on the "Declare Batch" screen. */
export const batchSchema = z
  .object({
    productId: z.uuid({ error: "Choose a product" }),
    batchNumber: z
      .string()
      .trim()
      .min(1, "Enter the batch number")
      .max(80, "Batch number is too long")
      .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/, "Use letters, numbers, dashes, dots or slashes only")
      .transform((value) => value.toUpperCase()),
    manufacturedOn: isoDate("Enter the production date"),
    expiresOn: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined)
      .pipe(isoDate("Enter a valid expiry date").optional()),
    units: z.coerce
      .number({ error: "Enter the number of units" })
      .int("Enter a whole number")
      .min(1, "Enter at least 1 unit")
      .max(BATCH_MAX_UNITS, "That is more than one batch can hold"),
    facility: optionalText(120, "That is too long"),
    notes: optionalText(500, "Keep it under 500 characters"),
    certificatePath: z.string().trim().max(300).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.manufacturedOn > todayInLagos()) {
      ctx.addIssue({ code: "custom", path: ["manufacturedOn"], message: "The production date cannot be in the future" });
    }
    if (data.expiresOn && data.expiresOn <= data.manufacturedOn) {
      ctx.addIssue({ code: "custom", path: ["expiresOn"], message: "The expiry date must be after the production date" });
    }
  });

export type BatchInput = z.input<typeof batchSchema>;
export type BatchData = z.output<typeof batchSchema>;
