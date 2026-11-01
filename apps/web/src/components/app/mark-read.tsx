"use client";

import { useEffect } from "react";
import { markAllReadAction } from "@/app/(customer)/notifications/actions";

/** Opening the Notifications screen counts as reading them. */
export function MarkRead() {
  useEffect(() => {
    void markAllReadAction();
  }, []);
  return null;
}
