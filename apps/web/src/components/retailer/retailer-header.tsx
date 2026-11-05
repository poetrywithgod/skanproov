import { AppHeader } from "@/components/app/app-header";
import { site } from "@/lib/site";
import { requireUser } from "@/lib/supabase/user";

/** The logo bar. Screens drawn with their own title bar leave it out. */
export async function RetailerHeader() {
  const user = await requireUser();
  return <AppHeader user={user} profileHref={site.retailer.profile} homeHref={site.retailer.home} />;
}
