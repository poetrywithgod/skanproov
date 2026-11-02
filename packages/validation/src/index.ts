import { z } from "zod";

/** Outcome of a consumer scan. Rules for reaching a verdict live in @skanproov/core. */
export const verdictSchema = z.enum(["genuine", "not_verified"]);
export type Verdict = z.infer<typeof verdictSchema>;

export * from "./auth";
export * from "./retailer";
