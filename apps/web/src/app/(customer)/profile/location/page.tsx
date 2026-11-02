import type { Metadata } from "next";
import { LocationSettings } from "@/components/app/location-settings";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "GPS scan geotagging", robots: { index: false } };

export default async function LocationPage() {
  const user = await requireUser();
  return (
    <div className="space-y-4 px-3 pb-4 pt-5">
      <div className="px-2">
        <h1 className="text-[26px] font-bold leading-8 tracking-normal text-ink">GPS scan geotagging</h1>
        <p className="mt-0.5 text-[13px] text-body">Choose whether your scans include where you were.</p>
      </div>
      <LocationSettings userId={user.id} initiallyOn={user.geotagScans} />
    </div>
  );
}
