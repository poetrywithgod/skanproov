"use client";

import { useSyncExternalStore } from "react";

/**
 * The cartons checked in the delivery being received right now.
 *
 * It only drives the "This delivery" counter on the scan screen, so it lives in sessionStorage:
 * it survives moving between the scan and result screens and is gone when the tab closes or the
 * delivery is finished. Every scan is still saved to History on the server. Storage can be
 * blocked, so each access is guarded and the screens work (counting 0) without it.
 */
const KEY = "skanproov.retailer.delivery";
const EVENT = "skanproov:delivery";

function read(): string[] {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function write(codes: string[]) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(codes));
  } catch {
    // Storage blocked: the counter just stays at 0.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Counts a carton once; checking it again in the same delivery does not count twice. */
export function addToDelivery(carton: string) {
  const key = carton.toUpperCase();
  const cartons = read();
  if (!cartons.includes(key)) write([...cartons, key]);
}

export function clearDelivery() {
  write([]);
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

/** How many cartons have been checked in this delivery. */
export function useDeliveryCount(): number {
  return useSyncExternalStore(subscribe, () => read().length, () => 0);
}
