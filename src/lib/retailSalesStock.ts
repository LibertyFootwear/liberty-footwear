import { incrementInventory, decrementInventory } from "@/lib/inventoryDb";

export interface StockLine { stockNo: string; size: string; qty: number }

/**
 * Build an inventory line from a sale's fields. Inventory keys boots by
 * "<width> <number>" (e.g. "M 9"), but the sales form stores width + size
 * separately, so recombine to match. Returns null when there's nothing to
 * adjust (no item or no size) — inc/decrementInventory also skip untracked
 * SKU/size combos, so non-boot rows are harmlessly no-ops.
 */
export function stockLine(stockNo?: unknown, size?: unknown, width?: unknown, qty?: unknown): StockLine | null {
  const sku = stockNo ? String(stockNo).trim() : "";
  const sz = size ? String(size).trim() : "";
  if (!sku || !sz) return null;
  const w = width ? String(width).trim() : "";
  return { stockNo: sku, size: w ? `${w} ${sz}` : sz, qty: Math.max(1, parseInt(String(qty)) || 1) };
}

/** True when a row represents a return (negative total, or an explicit flag). */
export function isReturnRow(total: unknown, flag?: unknown): boolean {
  const n = typeof total === "number" ? total : parseFloat(String(total));
  return flag === true || (Number.isFinite(n) && n < 0);
}

/** A sale takes a boot off the shelf; a return puts it back. No-op for null/untracked lines. */
export async function applyStock(line: StockLine | null, isReturn: boolean): Promise<void> {
  if (!line) return;
  if (isReturn) await incrementInventory([line]);
  else await decrementInventory([line]);
}

