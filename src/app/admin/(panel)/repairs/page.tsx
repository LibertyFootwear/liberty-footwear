import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import RepairsTable, { RepairRow } from "./RepairsTable";

export const dynamic = "force-dynamic";

export default async function AdminRepairs() {
  await requireAdmin();

  const sb = getSupabase();
  const rows: RepairRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from("repairs")
      .select("*")
      .order("ordered_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    rows.push(...(data as RepairRow[]));
    if (data.length < PAGE) break;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-2">Repairs &amp; Resoles</h1>
      <p className="text-sm text-gray-400 mb-8">
        Shoes in the shop for repair, resole or stretching — track each from dropped off → done → picked up.
        Overdue jobs (past the promised date) show up first in the Work Queue.
      </p>
      <RepairsTable rows={rows} />
    </div>
  );
}
