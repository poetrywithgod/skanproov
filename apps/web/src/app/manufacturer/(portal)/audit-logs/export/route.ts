import { NextResponse } from "next/server";
import { auditCategory, auditRefType, parseAuditFilters } from "@/lib/manufacturer/audit-shared";
import { getAuditExport } from "@/lib/manufacturer/audit";
import { fmtDateTime } from "@/lib/manufacturer/team-shared";
import { site } from "@/lib/site";

/** A cell for a CSV. Text that a spreadsheet could read as a formula gets a quote in front. */
function cell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Downloads the audit log, with the same filters as the screen, as a CSV. Needs the export permission. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const back = new URL(site.manufacturer.audit, request.url);
  const filters = parseAuditFilters({
    ...(url.searchParams.get("q") !== null ? { q: url.searchParams.get("q") as string } : {}),
    ...(url.searchParams.get("type") !== null ? { type: url.searchParams.get("type") as string } : {}),
    ...(url.searchParams.get("range") !== null ? { range: url.searchParams.get("range") as string } : {}),
  });
  const rows = await getAuditExport(filters);
  if (!rows) return NextResponse.redirect(back);

  const header = ["Date and time (Africa/Lagos)", "Activity", "Category", "Performed by", "Role", "Reference type", "Reference", "Outcome"];
  const lines = [header.map(cell).join(",")];
  for (const r of rows) {
    lines.push(
      [fmtDateTime(r.createdAt), r.summary, auditCategory(r.kind), r.actorName ?? "Unknown", r.actorRole ?? "", auditRefType(r.kind) ?? "", r.refLabel ?? "", "Success"].map(cell).join(","),
    );
  }
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="skanproov-audit-log-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
