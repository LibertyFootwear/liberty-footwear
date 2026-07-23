import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { products } from "@/data/products";
import SalesTable, { SaleRow } from "./SalesTable";

export const dynamic = "force-dynamic";

export default async function AdminSales() {
  await requireAdmin();

  const { data } = await getSupabase()
    .from("retail_sales")
    .select("*")
    .order("sale_date", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as SaleRow[];
  const stockOptions = products.map((p) => p.stockNo);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-2">Retail Sales</h1>
      <p className="text-sm text-gray-400 mb-8">
        In-store sales log — same columns as your spreadsheet. Add a row for each pair sold at the counter.
      </p>
      <SalesTable rows={rows} stockOptions={stockOptions} />
    </div>
  );
}
