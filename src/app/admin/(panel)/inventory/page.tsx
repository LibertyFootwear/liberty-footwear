import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { products, parseSizes } from "@/data/products";
import { getSiteSettings } from "@/lib/siteSettings";
import InventoryEditor, { type InvRow } from "./InventoryEditor";
import InventoryImport from "./InventoryImport";

/** Sort "M 9" / "EW 8.5" style size labels: M before EW, then ascending number. */
function sizeSort(a: { size: string }, b: { size: string }) {
  const [wa, na] = a.size.split(" ");
  const [wb, nb] = b.size.split(" ");
  if (wa !== wb) return wa === "M" ? -1 : wb === "M" ? 1 : wa.localeCompare(wb);
  return (parseFloat(na) || 0) - (parseFloat(nb) || 0);
}

export const dynamic = "force-dynamic";

export default async function AdminInventory() {
  await requireAdmin();

  const settings = await getSiteSettings();
  const { data } = await getSupabase().from("inventory").select("*");
  const stockMap: Record<string, number> = {};
  for (const row of data ?? []) {
    stockMap[`${row.stock_no}::${row.size}`] = row.qty;
  }

  // Build full size list per catalog product (boots only — apparel has its own sizing)
  const catalogRows: InvRow[] = products.filter((p) => p.category !== "Apparel").map((p) => {
    const sizeMap = parseSizes(p.sizes);
    const sizes: { size: string; qty: number }[] = [];
    for (const [width, nums] of Object.entries(sizeMap)) {
      for (const n of nums) {
        const sizeLabel = `${width} ${n}`;
        sizes.push({ size: sizeLabel, qty: stockMap[`${p.stockNo}::${sizeLabel}`] ?? 0 });
      }
    }
    return {
      stockNo: p.stockNo, name: p.name, colorLeather: p.colorLeather,
      outsoleType: p.outsoleType, colorOutsole: p.colorOutsole, image: p.image,
      onWebsite: true, sizes,
    };
  });

  // Models counted in inventory but not in the website catalog — show them too
  // (no image, no detail), so nothing gets hidden just because it isn't online.
  const catalogStocks = new Set(products.map((p) => p.stockNo));
  const extraMap = new Map<string, { size: string; qty: number }[]>();
  for (const row of data ?? []) {
    if (catalogStocks.has(row.stock_no)) continue;
    const arr = extraMap.get(row.stock_no) ?? [];
    arr.push({ size: row.size as string, qty: row.qty as number });
    extraMap.set(row.stock_no, arr);
  }
  const extraRows: InvRow[] = [...extraMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([stockNo, sizes]) => ({ stockNo, name: stockNo, onWebsite: false, image: null, sizes: sizes.sort(sizeSort) }));

  const rows = [...catalogRows, ...extraRows];
  const knownStocks = products.map((p) => p.stockNo);
  const lastCount = settings.lastInventoryDate
    ? `Last counted ${settings.lastInventoryDate}${settings.lastInventoryBy ? ` · by ${settings.lastInventoryBy}` : ""}`
    : null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-4">Inventory</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-8">
        <a href="/admin/inventory" className="px-4 py-2 text-sm font-bold text-navy border-b-2 border-navy -mb-px">Finished Boots</a>
        <a href="/admin/inventory/uppers" className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-navy transition">Uppers</a>
      </div>

      <InventoryImport knownStocks={knownStocks} />

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-400">Stock levels by product and size. Click a number to edit.</p>
        {lastCount && <p className="text-xs font-semibold text-gray-500">{lastCount}</p>}
      </div>
      <InventoryEditor rows={rows} />
    </div>
  );
}
