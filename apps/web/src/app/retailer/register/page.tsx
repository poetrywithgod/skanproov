import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterShopForm } from "@/components/retailer/register-shop-form";
import { getRetailerContext } from "@/lib/retailer/data";
import { site } from "@/lib/site";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Register your shop", robots: { index: false } };

export default async function RegisterShopPage() {
  await requireUser();
  if (await getRetailerContext()) redirect(site.retailer.home);

  return (
    <AuthShell
      tone="soft"
      title="Register your shop"
      subtitle="Tell us about your business and your first branch."
    >
      <RegisterShopForm />
    </AuthShell>
  );
}
