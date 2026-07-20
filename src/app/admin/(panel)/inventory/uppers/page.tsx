import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import uppersData from "@/data/uppers.json";
import UppersEditor from "./UppersEditor";

export const dynamic = "force-dynamic";

interface Upper {
  sku: string;
  name: string;
  m: Record<string, string>;
  ew: Record<string, string>;
}

export default async function AdminUppers() {
  await requireAdmin();
  const { date, sizes, products } = uppersData as { date: string; sizes: string[]; products: Upper[] };

  // Merge DB overrides onto the base JSON
  const { data } = await getSupabase().from("uppers_inventory").select("*");
  const overrides = new Map<string, string>();
  for (const row of data ?? []) {
    overrides.set(`${row.sku}::${row.width}::${row.size}`, row.val as string);
  }

  const merged: Upper[] = products.map((p) => {
    const m = { ...p.m }, ew = { ...p.ew };
    for (const s of sizes) {
      const mo = overrides.get(`${p.sku}::M::${s}`);
      const eo = overrides.get(`${p.sku}::EW::${s}`);
      if (mo !== undefined) m[s] = mo;
      if (eo !== undefined) ew[s] = eo;
    }
    return { ...p, m, ew };
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-4">Inventory</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-8">
        <a href="/admin/inventory" className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-navy transition">Finished Boots</a>
        <a href="/admin/inventory/uppers" className="px-4 py-2 text-sm font-bold text-navy border-b-2 border-navy -mb-px">Uppers</a>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">Upper parts stock · {merged.length} SKUs · originally as of {date} · click any cell to edit</p>
        <p className="text-xs text-gray-400">
          <span className="text-amber-600 font-semibold">+1R / +1L</span> = extra single right/left upper
        </p>
      </div>

      <UppersEditor sizes={sizes} products={merged} />
    </div>
  );
}
