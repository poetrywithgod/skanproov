import { z } from "zod";

/** Why a released batch is being recalled (a problem with the product). A recall can be lifted. */
export const RECALL_REASONS = [
  { value: "quality_issue", label: "Quality issue" },
  { value: "safety_concern", label: "Safety concern" },
  { value: "labelling_error", label: "Labelling error" },
  { value: "regulatory_action", label: "Regulatory action" },
  { value: "other", label: "Other" },
] as const;

/** Why a batch is being revoked for good (its codes can no longer be trusted, or the run was cancelled). */
export const REVOKE_REASONS = [
  { value: "codes_compromised", label: "Codes compromised" },
  { value: "issued_in_error", label: "Issued in error" },
  { value: "production_cancelled", label: "Production cancelled" },
  { value: "other", label: "Other" },
] as const;

export const BATCH_MESSAGE_MIN = 10;
export const BATCH_MESSAGE_MAX = 200;
export const BATCH_NOTE_MAX = 500;

const message = z
  .string()
  .trim()
  .min(BATCH_MESSAGE_MIN, `Write at least ${BATCH_MESSAGE_MIN} characters`)
  .max(BATCH_MESSAGE_MAX, `Keep this under ${BATCH_MESSAGE_MAX} characters`);
const note = z
  .string()
  .trim()
  .max(BATCH_NOTE_MAX, `Keep this under ${BATCH_NOTE_MAX} characters`)
  .transform((v) => (v === "" ? null : v));

export const recallBatchSchema = z.object({
  batchId: z.uuid(),
  reason: z.enum(RECALL_REASONS.map((r) => r.value) as [string, ...string[]], { error: "Choose a reason" }),
  message,
  note,
});

export const revokeBatchSchema = z.object({
  batchId: z.uuid(),
  reason: z.enum(REVOKE_REASONS.map((r) => r.value) as [string, ...string[]], { error: "Choose a reason" }),
  message,
  note,
});

export const batchReasonLabel = (value: string | null | undefined): string =>
  [...RECALL_REASONS, ...REVOKE_REASONS].find((r) => r.value === value)?.label ?? "Other";
