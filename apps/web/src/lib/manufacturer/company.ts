import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface Company {
  name: string;
  registeredName: string | null;
  rcNumber: string | null;
  address: string | null;
  verifiedAt: string | null;
  createdAt: string;
  tin: string | null;
  regulatoryNumber: string | null;
  category: string | null;
  contactName: string | null;
  contactRole: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  qualityEmail: string | null;
  website: string | null;
}

type Row = {
  name: string; registered_name: string | null; rc_number: string | null; address: string | null;
  verified_at: string | null; created_at: string; tin: string | null; regulatory_number: string | null;
  category: string | null; contact_name: string | null; contact_role: string | null; contact_email: string | null;
  contact_phone: string | null; quality_email: string | null; website: string | null;
};

/** The company's profile and contact details, for any active member. */
export const getCompany = cache(async (): Promise<Company | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_company");
  if (error) {
    console.error("Could not load the company", error.message);
    return null;
  }
  const r = ((data ?? []) as Row[])[0];
  if (!r) return null;
  return {
    name: r.name,
    registeredName: r.registered_name,
    rcNumber: r.rc_number,
    address: r.address,
    verifiedAt: r.verified_at,
    createdAt: r.created_at,
    tin: r.tin,
    regulatoryNumber: r.regulatory_number,
    category: r.category,
    contactName: r.contact_name,
    contactRole: r.contact_role,
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone,
    qualityEmail: r.quality_email,
    website: r.website,
  };
});
