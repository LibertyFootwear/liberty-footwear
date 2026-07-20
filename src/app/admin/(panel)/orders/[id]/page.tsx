import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import OrderStatusForm from "./OrderStatusForm";

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { data: o } = await getSupabase().from("orders").select("*").eq("id", id).single();
  if (!o) notFound();

  const items = (o.items ?? []) as { stockNo: string; name: string; price: number; qty: number }[];

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <a href="/admin/orders" className="text-sm text-gray-400 hover:text-navy transition">← Orders</a>
        <h1 className="text-2xl font-black text-navy">Order #{o.id.slice(0, 8)}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Customer</p>
          <p className="font-bold text-navy">{o.shipping_name ?? "Guest"}</p>
          <p className="text-sm text-gray-500">{o.shipping_email}</p>
          {o.phone && <p className="text-sm text-gray-500">{o.phone}</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Delivery</p>
          <p className="font-bold text-navy">{o.shipping_method === "pickup" ? "🏪 Store Pickup" : "📦 Shipping"}</p>
          {o.shipping_address && (
            <p className="text-sm text-gray-500 mt-1">
              {(o.shipping_address as Record<string, string>).address}, {(o.shipping_address as Record<string, string>).city}, {(o.shipping_address as Record<string, string>).state} {(o.shipping_address as Record<string, string>).zip}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">{new Date(o.created_at).toLocaleString()}</p>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide px-5 pt-5 mb-3">Items</p>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100">
            <tr>
              {["Product", "Stock No", "Size", "Qty", "Price"].map((h) => (
                <th key={h} className="text-left px-5 py-2 text-xs font-bold text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item, i) => (
              <tr key={i}>
                <td className="px-5 py-3 font-semibold text-navy">{item.name}</td>
                <td className="px-5 py-3 font-mono text-xs text-gray-500">{item.stockNo}</td>
                <td className="px-5 py-3 text-gray-600">{(item as unknown as Record<string, string>).size ?? "—"}</td>
                <td className="px-5 py-3 text-gray-600">{item.qty}</td>
                <td className="px-5 py-3 font-bold">${(item.price * item.qty).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <p className="font-black text-lg text-navy">Total: ${o.total?.toFixed(2)}</p>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Order Status</p>
        <OrderStatusForm orderId={o.id} currentStatus={o.status} />
      </div>
    </div>
  );
}
