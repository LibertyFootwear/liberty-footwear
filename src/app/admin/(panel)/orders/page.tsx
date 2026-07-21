import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  paid:       "bg-blue-100 text-blue-700",
  processing: "bg-yellow-100 text-yellow-700",
  shipped:    "bg-purple-100 text-purple-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
};

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

export default async function AdminOrders() {
  await requireAdmin();
  const { data } = await getSupabase()
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  const orders = data ?? [];

  // Per-registered-customer order sequence numbers
  const seq: Record<string, { n: number; total: number }> = {};
  const byUser: Record<string, typeof orders> = {};
  for (const o of orders) {
    if (o.user_id) (byUser[o.user_id] ??= []).push(o);
  }
  for (const list of Object.values(byUser)) {
    const asc = [...list].sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
    asc.forEach((o, i) => { seq[o.id] = { n: i + 1, total: asc.length }; });
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-navy">Orders</h1>
        <Link href="/admin/orders/new" className="px-4 py-2 bg-navy text-white text-sm font-bold rounded-lg hover:bg-navy/80 transition">
          + Record Store Sale
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Order ID", "Date", "Source", "Customer", "Items", "Total", "Status", ""].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">No orders yet.</td></tr>
            )}
            {orders.map((o) => {
              const isStore = o.source === "store" || o.shipping_method === "store";
              const s = seq[o.id];
              return (
                <tr key={o.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">#{o.id.slice(0, 8)}</td>
                  <td className="px-5 py-3 text-gray-600">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    {isStore
                      ? <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">🏪 Store</span>
                      : <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700">🌐 Web</span>}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-navy">{o.shipping_name ?? "Guest"}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {o.user_id
                        ? <span className="text-[11px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">Registered</span>
                        : <span className="text-[11px] text-gray-400">Guest</span>}
                      {s && <span className="text-[11px] text-gray-500">· {ordinal(s.n)} of {s.total} orders</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{(o.items as unknown[])?.length ?? 0} items</td>
                  <td className="px-5 py-3 font-black text-gray-900">${o.total?.toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-600"}`}>{o.status}</span>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="text-xs font-bold text-navy hover:text-red transition">Detail →</Link>
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
