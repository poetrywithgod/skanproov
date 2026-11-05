"use client";

import { useEffect } from "react";
import { addToDelivery } from "@/lib/retailer/delivery";

/** Counts this carton in the delivery being received. Renders nothing. */
export function DeliveryTracker({ carton }: { carton: string }) {
  useEffect(() => {
    addToDelivery(carton);
  }, [carton]);
  return null;
}
