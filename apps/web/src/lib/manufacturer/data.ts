import { manufacturerCompanySchema, type ManufacturerCompany } from "@skanproov/validation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface ManufacturerApplication {
  company: string;
  rcNumber: string;
  category: string;
  city: string;
  status: "pending" | "approved" | "rejected";
  reviewNote: string | null;
  submittedAt: string;
}

/** The signed-in person's manufacturer application, or null if they have not applied. */
export const getMyApplication = cache(async (): Promise<ManufacturerApplication | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_manufacturer_application");
  if (error) console.error("Could not load the application", error.message);
  const row = data?.[0];
  if (!row) return null;
  return {
    company: row.company_name,
    rcNumber: row.rc_number,
    category: row.category,
    city: row.city,
    status: row.status as ManufacturerApplication["status"],
    reviewNote: row.review_note,
    submittedAt: row.created_at,
  };
});

export interface UploadedDocument {
  kind: string;
  fileName: string;
  sizeBytes: number;
}

/** The documents the signed-in person has uploaded so far. */
export async function getMyDocuments(): Promise<UploadedDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_manufacturer_documents");
  if (error) console.error("Could not load the documents", error.message);
  return (data ?? []).map((row: { kind: string; file_name: string; size_bytes: number }) => ({
    kind: row.kind,
    fileName: row.file_name,
    sizeBytes: row.size_bytes,
  }));
}

/**
 * The company details typed on the sign-up page, kept in the person's sign-up data until they
 * confirmed their e-mail. Checked again here, because that data can be edited by the person.
 */
export async function getCompanyDraft(): Promise<ManufacturerCompany | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const parsed = manufacturerCompanySchema.safeParse(user?.user_metadata?.company_draft);
  return parsed.success ? parsed.data : null;
}
