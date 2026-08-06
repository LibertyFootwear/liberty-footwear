import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import OpenOrdersTable, { OpenOrderRow } from "./OpenOrdersTable";

export const dynamic = "force-dynamic";

export default async function AdminOpenOrders() {
  await requireAdmin();

  const sb = getSupabase();
  const rows: OpenOrderRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from("open_orders")
      .select("*")
      .order("ordered_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    rows.push(...(data as OpenOrderRow[]));
    if (data.length < PAGE) break;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-2">Open Orders</h1>
      <p className="text-sm text-gray-400 mb-8">
        Custom orders from walk-in &amp; call-in customers — replaces the spreadsheet. Track each order from
        ordered → made → picked up.
      </p>
      <OpenOrdersTable rows={rows} />
    </div>
  );
}
