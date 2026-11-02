"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

/**
 * For people who turned on GPS scan geotagging: asks the browser for the device's location once
 * and attaches it to this scan. Silent. If the browser blocks it, the scan simply has no location.
 */
export function LocationTagger({ code }: { code: string }) {
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await createClient().rpc("attach_scan_location", {
            p_code: code,
            p_lat: position.coords.latitude,
            p_lng: position.coords.longitude,
          });
        } catch {
          // Location is a bonus; never disturb the result screen.
        }
      },
      () => {},
      { maximumAge: 60_000, timeout: 10_000 },
    );
  }, [code]);

  return null;
}
