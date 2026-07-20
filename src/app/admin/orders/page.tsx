import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

const STATUS_COLOR: Record<string, string> = {
  paid:       "bg-blue-100 text-blue-700",
  processing: "bg-yellow-100 text-yellow-700",
  shipped:    "bg-purple-100 text-purple-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
};

export default async function AdminOrders() {
  await requireAdmin();
  const { data } = await getSupabase()
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  const orders = data ?? [];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-8">Orders</h1>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Order ID", "Date", "Customer", "Items", "Total", "Shipping", "Status", ""].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">No orders yet.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3 font-mono text-xs text-gray-500">#{o.id.slice(0, 8)}</td>
                <td className="px-5 py-3 text-gray-600">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3">
                  <p className="font-semibold text-navy">{o.shipping_name ?? "Guest"}</p>
                  <p className="text-xs text-gray-400">{o.shipping_email ?? ""}</p>
                </td>
                <td className="px-5 py-3 text-gray-600">{(o.items as unknown[])?.length ?? 0} items</td>
                <td className="px-5 py-3 font-black text-gray-900">${o.total?.toFixed(2)}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">{o.shipping_method === "pickup" ? "🏪 Pickup" : "📦 Ship"}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-600"}`}>{o.status}</span>
                </td>
                <td className="px-5 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="text-xs font-bold text-navy hover:text-red transition">Detail →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
