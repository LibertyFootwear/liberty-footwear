import { getSupabase } from "./supabase";

/**
 * Decrement finished-boot inventory for purchased items.
 * Only decrements rows that already exist (untracked SKU/size combos are skipped),
 * and never goes below zero. Safe to call once per order.
 */
export async function decrementInventory(items: { stockNo: string; size?: string; qty: number }[]): Promise<void> {
  const sb = getSupabase();
  for (const item of items) {
    if (!item.stockNo || !item.size) continue;
    const { data: row } = await sb
      .from("inventory")
      .select("qty")
      .eq("stock_no", item.stockNo)
      .eq("size", item.size)
      .single();
    if (!row) continue; // untracked — skip
    const newQty = Math.max(0, (row.qty ?? 0) - item.qty);
    await sb
      .from("inventory")
      .update({ qty: newQty, updated_at: new Date().toISOString() })
      .eq("stock_no", item.stockNo)
      .eq("size", item.size);
  }
}
