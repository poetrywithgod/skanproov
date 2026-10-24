import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Batch, ProductCode, Repository } from "../repository";

export interface SupabaseConfig {
  url: string;
  /** Server-side only. Never import this adapter into browser bundles. */
  serviceRoleKey: string;
}

export function createSupabaseRepository(config: SupabaseConfig): Repository {
  const client: SupabaseClient = createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false },
  });

  return {
    async getBatchById(id) {
      const { data, error } = await client.from("batches").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data as Batch | null) ?? null;
    },
    async getCodeByPublicCode(publicCode) {
      const { data, error } = await client
        .from("product_codes")
        .select("*")
        .eq("public_code", publicCode)
        .maybeSingle();
      if (error) throw error;
      return (data as ProductCode | null) ?? null;
    },
  };
}
