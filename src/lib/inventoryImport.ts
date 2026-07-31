import { getSupabase } from "./supabase";

export interface ImportRow { stockNo: string; size: string; qty: number }

/**
 * Bulk-upsert counted inventory into `table` (keyed by stock_no+size).
 * Aggregates duplicate keys by summing — a stock number can appear in more than
 * one block of a sheet, and Postgres ON CONFLICT can't touch a row twice per call.
 * Only the listed (stock_no, size) combos are written; others are left untouched.
 */
export async function bulkUpsertInventory(
  table: "inventory" | "inventory_specials",
  rows: ImportRow[]
): Promise<{ imported: number; error?: string }> {
  const now = new Date().toISOString();
  const byKey = new Map<string, { stock_no: string; size: string; qty: number; updated_at: string }>();
  for (const r of rows) {
    const stock_no = String(r.stockNo ?? "").trim();
    const size = String(r.size ?? "").trim();
    const qty = Math.max(0, Math.round(Number(r.qty)));
    if (!stock_no || !size || !Number.isFinite(qty)) continue;
    const key = `${stock_no}::${size}`;
    const ex = byKey.get(key);
    if (ex) ex.qty += qty;
    else byKey.set(key, { stock_no, size, qty, updated_at: now });
  }
  const clean = [...byKey.values()];
  if (clean.length === 0) return { imported: 0, error: "No valid rows to import" };

  const sb = getSupabase();
  const CHUNK = 500;
  for (let i = 0; i < clean.length; i += CHUNK) {
    const { error } = await sb.from(table).upsert(clean.slice(i, i + CHUNK), { onConflict: "stock_no,size" });
    if (error) return { imported: 0, error: error.message };
  }
  return { imported: clean.length };
}
