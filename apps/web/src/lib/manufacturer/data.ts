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
