import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { products } from "@/data/products";
import SalesTable, { SaleRow, CatalogItem } from "./SalesTable";
import SyncSheetButton from "./SyncSheetButton";

export const dynamic = "force-dynamic";

export default async function AdminSales() {
  await requireAdmin();

  // Paginate — Supabase caps a single response at 1000 rows.
  const sb = getSupabase();
  const rows: SaleRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from("retail_sales")
      .select("*")
      .order("sale_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    rows.push(...(data as SaleRow[]));
    if (data.length < PAGE) break;
  }
  const catalog: CatalogItem[] = products.map((p) => ({
    stockNo: p.stockNo,
    name: `${p.name}${p.colorLeather ? ` — ${p.colorLeather}` : ""}`,
    ...(p.apparelSizes?.length ? { apparelSizes: p.apparelSizes } : {}),
  }));

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="text-2xl font-black text-navy mb-2">Retail Sales</h1>
          <p className="text-sm text-gray-400">
            In-store sales log — same columns as your spreadsheet. Add a row for each item sold at the counter.
          </p>
        </div>
        <SyncSheetButton />
      </div>
      <SalesTable rows={rows} catalog={catalog} />
    </div>
  );
}
