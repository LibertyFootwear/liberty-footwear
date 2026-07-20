import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { products, parseSizes } from "@/data/products";
import InventoryEditor from "./InventoryEditor";

export default async function AdminInventory() {
  await requireAdmin();

  const { data } = await getSupabase().from("inventory").select("*");
  const stockMap: Record<string, number> = {};
  for (const row of data ?? []) {
    stockMap[`${row.stock_no}::${row.size}`] = row.qty;
  }

  // Build full size list per product
  const rows = products.map((p) => {
    const sizeMap = parseSizes(p.sizes);
    const sizes: { size: string; qty: number }[] = [];
    for (const [width, nums] of Object.entries(sizeMap)) {
      for (const n of nums) {
        const sizeLabel = `${width} ${n}`;
        sizes.push({ size: sizeLabel, qty: stockMap[`${p.stockNo}::${sizeLabel}`] ?? 0 });
      }
    }
    return { product: p, sizes };
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-2">Inventory</h1>
      <p className="text-sm text-gray-400 mb-8">Stock levels by product and size. Click a number to edit.</p>
      <InventoryEditor rows={rows} />
    </div>
  );
}
