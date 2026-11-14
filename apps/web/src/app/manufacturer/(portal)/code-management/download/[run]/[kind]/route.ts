import { CODE_FILES_BUCKET } from "@skanproov/validation";
import { NextResponse } from "next/server";
import { getCodeRuns } from "@/lib/manufacturer/code-runs";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

/** Sends the signed-in manufacturer to a short-lived link for one file of a run (csv or pdf). */
export async function GET(request: Request, { params }: { params: Promise<{ run: string; kind: string }> }) {
  const { run, kind } = await params;
  const back = new URL(site.manufacturer.codes, request.url);
  if (kind !== "csv" && kind !== "pdf") return NextResponse.redirect(back);

  // The list comes from a function that only returns this manufacturer's runs.
  const found = (await getCodeRuns()).find((r) => r.id === run);
  const path = kind === "csv" ? found?.csvPath : found?.pdfPath;
  if (!found || !path) return NextResponse.redirect(back);

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(CODE_FILES_BUCKET).createSignedUrl(path, 60, { download: path.split("/").at(-1) ?? true });
  if (error || !data) return NextResponse.redirect(back);
  return NextResponse.redirect(data.signedUrl);
}
