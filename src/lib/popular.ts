import { getSupabase } from "./supabase";

/**
 * A product earns the "Popular" badge once it has sold at least this many
 * units across all real (paid/fulfilled) orders. Tune as sales volume grows.
 */
export const POPULAR_MIN_UNITS = 8;

/** Cap the number of "Popular" products so the badge stays meaningful. */
export const POPULAR_MAX_COUNT = 8;

const TTL_MS = 5 * 60 * 1000;
let cache: { at: number; data: string[] } | null = null;

/**
 * Returns the stockNos of products popular enough to earn the badge,
 * best-sellers first. Computed from real order history in Supabase.
 * Returns [] if Supabase isn't configured (e.g. local dev without secrets).
 */
export async function getPopularStockNos(nowMs: number): Promise<string[]> {
  if (cache && nowMs - cache.at < TTL_MS) return cache.data;

  let rows: { items: { stockNo: string; qty?: number }[] | null }[] = [];
  try {
    const { data } = await getSupabase()
      .from("orders")
      .select("items,status")
      .in("status", ["paid", "processing", "shipped", "delivered"]);
    rows = (data ?? []) as typeof rows;
  } catch {
    return []; // Supabase not configured → no badges (don't cache the failure)
  }

  const units = new Map<string, number>();
  for (const row of rows) {
    for (const it of row.items ?? []) {
      if (!it?.stockNo) continue;
      units.set(it.stockNo, (units.get(it.stockNo) ?? 0) + (it.qty ?? 1));
    }
  }

  const result = [...units.entries()]
    .filter(([, n]) => n >= POPULAR_MIN_UNITS)
    .sort((a, b) => b[1] - a[1])
    .slice(0, POPULAR_MAX_COUNT)
    .map(([stockNo]) => stockNo);

  cache = { at: nowMs, data: result };
  return result;
}
