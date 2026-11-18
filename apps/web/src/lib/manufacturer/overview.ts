import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getBatches } from "./batches";
import { getCodeRuns } from "./code-runs";
import { getProducts } from "./products";
import type { BatchListItem } from "./batch-shared";
import type { CodeRun } from "./code-run-shared";
import type { ProductListItem } from "./product-shared";

export interface OverviewActivity {
  id: string;
  kind: string;
  summary: string;
  actorName: string | null;
  createdAt: string;
  /** The code run behind a code-generation entry, while its files are still kept. */
  runId: string | null;
}

export interface ScanDay {
  /** Nigerian calendar day, YYYY-MM-DD. */
  day: string;
  authentic: number;
  repeat: number;
  other: number;
}

export interface ScanActivity {
  days: ScanDay[];
  total: number;
  authentic: number;
  repeat: number;
  other: number;
}

export interface Overview {
  products: { total: number; registered: number; pending: number; draft: number };
  batches: { total: number; productsWithBatches: number };
  codesThisMonth: { codes: number; runs: number };
  awaiting: { units: number; top: { batch: BatchListItem; remaining: number } | null };
  /** Batches whose codes are all generated but which are not released yet. */
  readyToRelease: BatchListItem[];
  drafts: ProductListItem[];
  pendingReview: ProductListItem[];
  recentBatches: { batch: BatchListItem; imagePath: string | null; latestRun: CodeRun | null; remaining: number }[];
  activity: OverviewActivity[] | null;
  /** Scans of this company's codes over the last 7 days; null when they could not be loaded. */
  scans: ScanActivity | null;
  /** The product with the most units still waiting for codes (or the most units declared). */
  focus: { product: ProductListItem; batches: number; declared: number; coded: number } | null;
}

const lagosMonth = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }).slice(0, 7);

/** What a batch still lacks: units declared minus codes made. Only an unreleased, active batch can still be generated for. */
function remainingOf(b: BatchListItem): number {
  if (b.status !== "active" || b.releasedAt || b.units == null) return 0;
  return Math.max(0, b.units - b.codesGenerated);
}

async function getActivity(): Promise<OverviewActivity[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_recent_activity", { p_limit: 5 });
  if (error) {
    // Roles without "view audit logs" are refused on purpose; their Overview simply has no activity panel.
    if (!/not allowed/i.test(error.message)) console.error("Could not load recent activity", error.message);
    return null;
  }
  return ((data ?? []) as { id: string; kind: string; summary: string; actor_name: string | null; created_at: string; run_id: string | null }[]).map((r) => ({
    id: r.id,
    kind: r.kind,
    summary: r.summary,
    actorName: r.actor_name,
    createdAt: r.created_at,
    runId: r.run_id,
  }));
}

async function getScans(): Promise<ScanActivity | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_scan_activity", { p_days: 7 });
  if (error) {
    console.error("Could not load scan activity", error.message);
    return null;
  }
  const days = ((data ?? []) as { day: string; authentic: number | string; repeat_scans: number | string; other: number | string }[]).map((r) => ({
    day: r.day,
    authentic: Number(r.authentic),
    repeat: Number(r.repeat_scans),
    other: Number(r.other),
  }));
  const authentic = days.reduce((n, d) => n + d.authentic, 0);
  const repeat = days.reduce((n, d) => n + d.repeat, 0);
  const other = days.reduce((n, d) => n + d.other, 0);
  return { days, total: authentic + repeat + other, authentic, repeat, other };
}

export const getOverview = cache(async (): Promise<Overview> => {
  const [products, batches, runs, activity, scans] = await Promise.all([getProducts(), getBatches(), getCodeRuns(), getActivity(), getScans()]);

  const thisMonth = lagosMonth(new Date().toISOString());
  const monthRuns = runs.filter((r) => lagosMonth(r.createdAt) === thisMonth);

  const withRemaining = batches.map((b) => ({ batch: b, remaining: remainingOf(b) }));
  const awaitingBatches = withRemaining.filter((x) => x.remaining > 0).sort((a, b) => b.remaining - a.remaining);
  const imageOf = new Map(products.map((p) => [p.id, p.imagePath]));
  const latestRunOf = new Map<string, CodeRun>();
  for (const r of runs) if (!latestRunOf.has(r.batchId)) latestRunOf.set(r.batchId, r); // runs are newest first

  // Per product: units declared, codes made, units still waiting.
  const perProduct = new Map<string, { batches: number; declared: number; coded: number; awaiting: number }>();
  for (const x of withRemaining) {
    const row = perProduct.get(x.batch.productId) ?? { batches: 0, declared: 0, coded: 0, awaiting: 0 };
    row.batches += 1;
    row.declared += x.batch.units ?? 0;
    row.coded += x.batch.codesGenerated;
    row.awaiting += x.remaining;
    perProduct.set(x.batch.productId, row);
  }
  const focusId = [...perProduct.entries()].sort((a, b) => b[1].awaiting - a[1].awaiting || b[1].declared - a[1].declared)[0]?.[0];
  const focusProduct = products.find((p) => p.id === focusId);
  const focusStats = focusId ? perProduct.get(focusId) : undefined;

  return {
    products: {
      total: products.length,
      registered: products.filter((p) => p.status === "registered").length,
      pending: products.filter((p) => p.status === "pending_review").length,
      draft: products.filter((p) => p.status === "draft").length,
    },
    batches: { total: batches.length, productsWithBatches: new Set(batches.map((b) => b.productId)).size },
    codesThisMonth: { codes: monthRuns.reduce((n, r) => n + r.quantity, 0), runs: monthRuns.length },
    awaiting: {
      units: awaitingBatches.reduce((n, x) => n + x.remaining, 0),
      top: awaitingBatches[0] ? { batch: awaitingBatches[0].batch, remaining: awaitingBatches[0].remaining } : null,
    },
    readyToRelease: batches.filter((b) => b.status === "active" && !b.releasedAt && b.codesGenerated > 0 && remainingOf(b) === 0),
    drafts: products.filter((p) => p.status === "draft"),
    pendingReview: products.filter((p) => p.status === "pending_review"),
    recentBatches: withRemaining.slice(0, 3).map((x) => ({
      batch: x.batch,
      imagePath: imageOf.get(x.batch.productId) ?? null,
      latestRun: latestRunOf.get(x.batch.id) ?? null,
      remaining: x.remaining,
    })),
    activity,
    scans,
    focus: focusProduct && focusStats ? { product: focusProduct, batches: focusStats.batches, declared: focusStats.declared, coded: focusStats.coded } : null,
  };
});
