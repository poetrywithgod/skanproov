import type { ReportData } from "@skanproov/validation";
import { createClient } from "@/lib/supabase/browser";

export type ReportResult = { ok: true } | { ok: false; message: string };

/** Sends a report through the database function. Works with or without an account. */
export async function submitReport(input: ReportData): Promise<ReportResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("submit_report", {
    p_kind: input.kind,
    p_code: input.code,
    p_place: input.place,
    p_details: input.details,
  });
  if (error) {
    if (error.message.includes("too many reports")) {
      return { ok: false, message: "You've sent a lot of reports today. Please try again tomorrow." };
    }
    return { ok: false, message: "We couldn't send your report. Please try again." };
  }
  return { ok: true };
}
