import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { isBootItem } from "@/lib/analytics";
import Link from "next/link";

export default async function InStoreCustomers() {
  await requireAdmin();
  const sb = getSupabase();

  const [customersRes, ordersRes, salesRes] = await Promise.all([
    sb.from("customers")
      .select("id, name, email, phone, user_id, sources, newsletter, first_purchase_at, last_purchase_at, created_at")
      .contains("sources", ["store"])
      .order("last_purchase_at", { ascending: false, nullsFirst: false }),
    sb.from("orders").select("customer_id, total, items"),
    sb.from("retail_sales").select("customer_id, total, stock_no, qty"),
  ]);

  const customers = customersRes.data ?? [];
  const orders = ordersRes.data ?? [];
  const sales = salesRes.data ?? [];

  // Tally purchases + spend + boots per customer across both channels (same as All).
  const stats = new Map<string, { count: number; spent: number; boots: number }>();
  const add = (cid: unknown, total: unknown, boots: number, countable = true) => {
    if (!cid) return;
    const id = cid as string;
    const s = stats.get(id) ?? { count: 0, spent: 0, boots: 0 };
    if (countable) s.count += 1;
    s.spent += (total as number) ?? 0;
    s.boots += boots;
    stats.set(id, s);
  };
  for (const o of orders) {
    const boots = ((o.items as { stockNo?: string; qty?: number }[]) ?? [])
      .reduce((n, it) => n + (isBootItem(it.stockNo ?? "") ? (it.qty ?? 1) : 0), 0);
    add(o.customer_id, o.total, boots);
  }
  for (const s of sales) {
    const isReturn = ((s.total as number) ?? 0) < 0;
    const q = (s.qty as number) ?? 1;
    const boots = isBootItem((s.stock_no as string) ?? "") ? (isReturn ? -q : q) : 0;
    add(s.customer_id, s.total, boots, !isReturn);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-4">Customers</h1>

      <div className="flex gap-2 border-b border-gray-200 mb-6">
        <Link href="/admin/customers" className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-navy transition">All Customers</Link>
        <Link href="/admin/customers/in-store" className="px-4 py-2 text-sm font-bold text-navy border-b-2 border-navy -mb-px">From In-Store</Link>
        <Link href="/admin/customers/old" className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-navy transition">From Old Website</Link>
        <Link href="/admin/customers/contacts" className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-navy transition">Email Contacts from Old Website</Link>
      </div>

      <p className="text-sm text-gray-400 mb-6">
        {customers.length} in-store customers · recorded from retail sales
      </p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Name", "Email", "Phone", "Channel", "Account", "Purchases", "Boots", "Spent", "Last purchase", ""].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {customers.length === 0 && (
              <tr><td colSpan={10} className="px-5 py-12 text-center text-gray-400">No in-store customers yet. Record a retail sale to add one.</td></tr>
            )}
            {customers.map((c) => {
              const st = stats.get(c.id) ?? { count: 0, spent: 0, boots: 0 };
              const sources = (c.sources as string[]) ?? [];
              return (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 font-semibold text-navy">{c.name || "—"}</td>
                  <td className="px-5 py-3 text-gray-600">{c.email || "—"}</td>
                  <td className="px-5 py-3 text-gray-500">{c.phone || "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      {sources.includes("web") && sources.includes("store") ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">BOTH</span>
                      ) : sources.includes("store") ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">STORE</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {c.user_id ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">YES</span>
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">NO</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{st.count}</td>
                  <td className="px-5 py-3 text-gray-600">{st.boots || "—"}</td>
                  <td className="px-5 py-3 text-gray-600">{st.spent ? `$${st.spent.toFixed(2)}` : "—"}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {c.last_purchase_at ? new Date(c.last_purchase_at).toLocaleDateString("en-US") : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/customers/view/${c.id}`} className="text-xs font-bold text-navy hover:text-red transition">Detail →</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
