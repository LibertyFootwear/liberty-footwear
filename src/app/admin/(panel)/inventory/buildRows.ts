import { products, parseSizes } from "@/data/products";
import type { InvRow } from "./InventoryEditor";

/** Sort "M 9" / "EW 8.5" size labels: M before EW, then ascending number. */
function sizeSort(a: { size: string }, b: { size: string }) {
  const [wa, na] = a.size.split(" ");
  const [wb, nb] = b.size.split(" ");
  if (wa !== wb) return wa === "M" ? -1 : wb === "M" ? 1 : wa.localeCompare(wb);
  return (parseFloat(na) || 0) - (parseFloat(nb) || 0);
}

export interface DbInvRow { stock_no: string; size: string; qty: number }

/**
 * Build inventory editor rows from a table's rows: every catalog boot (with its
 * full size grid, filled from the counts) followed by any counted models that
 * aren't in the website catalog (shown without image/detail).
 */
export function buildInventoryRows(dbRows: DbInvRow[]): InvRow[] {
  const stockMap: Record<string, number> = {};
  for (const row of dbRows) stockMap[`${row.stock_no}::${row.size}`] = row.qty;

  const catalogRows: InvRow[] = products.filter((p) => p.category !== "Apparel").map((p) => {
    const sizeMap = parseSizes(p.sizes);
    const sizes: { size: string; qty: number }[] = [];
    for (const [width, nums] of Object.entries(sizeMap)) {
      for (const n of nums) {
        const label = `${width} ${n}`;
        sizes.push({ size: label, qty: stockMap[`${p.stockNo}::${label}`] ?? 0 });
      }
    }
    return {
      stockNo: p.stockNo, name: p.name, colorLeather: p.colorLeather,
      outsoleType: p.outsoleType, colorOutsole: p.colorOutsole, image: p.image,
      onWebsite: true, sizes,
    };
  });

  const catalogStocks = new Set(products.map((p) => p.stockNo));
  const extraMap = new Map<string, { size: string; qty: number }[]>();
  for (const row of dbRows) {
    if (catalogStocks.has(row.stock_no)) continue;
    const arr = extraMap.get(row.stock_no) ?? [];
    arr.push({ size: row.size, qty: row.qty });
    extraMap.set(row.stock_no, arr);
  }
  const extraRows: InvRow[] = [...extraMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([stockNo, sizes]) => ({ stockNo, name: stockNo, onWebsite: false, image: null, sizes: sizes.sort(sizeSort) }));

  return [...catalogRows, ...extraRows];
}

/** All catalog stock numbers — used to flag off-catalog rows during import. */
export const knownStocks = products.map((p) => p.stockNo);
