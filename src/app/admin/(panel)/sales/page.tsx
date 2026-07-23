import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { products } from "@/data/products";
import SalesTable, { SaleRow, CatalogItem } from "./SalesTable";

export const dynamic = "force-dynamic";

export default async function AdminSales() {
  await requireAdmin();

  const { data } = await getSupabase()
    .from("retail_sales")
    .select("*")
    .order("sale_date", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as SaleRow[];
  const catalog: CatalogItem[] = products.map((p) => ({
    stockNo: p.stockNo,
    ...(p.apparelSizes?.length ? { apparelSizes: p.apparelSizes } : {}),
  }));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-2">Retail Sales</h1>
      <p className="text-sm text-gray-400 mb-8">
        In-store sales log — same columns as your spreadsheet. Add a row for each item sold at the counter.
      </p>
      <SalesTable rows={rows} catalog={catalog} />
    </div>
  );
}
