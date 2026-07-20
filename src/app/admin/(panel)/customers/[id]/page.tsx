import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function AdminCustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [userRes, ordersRes] = await Promise.all([
    getSupabase().from("users").select("*").eq("id", id).single(),
    getSupabase().from("orders").select("id, total, status, created_at, items").eq("user_id", id).order("created_at", { ascending: false }),
  ]);

  if (!userRes.data) notFound();
  const u = userRes.data;
  const orders = ordersRes.data ?? [];
  const totalSpent = orders.reduce((s, o) => s + (o.total ?? 0), 0);

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/customers" className="text-sm text-gray-400 hover:text-navy transition">← Customers</Link>
        <h1 className="text-2xl font-black text-navy">{u.name}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Spent", value: `$${totalSpent.toFixed(2)}` },
          { label: "Orders", value: orders.length },
          { label: "Favorites", value: (u.favorites as string[])?.length ?? 0 },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-2xl font-black text-navy">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Contact Info</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-400 text-xs">Email</p><p className="font-semibold">{u.email}</p></div>
          <div><p className="text-gray-400 text-xs">Phone</p><p className="font-semibold">{u.phone || "—"}</p></div>
          <div><p className="text-gray-400 text-xs">Joined</p><p className="font-semibold">{new Date(u.created_at).toLocaleDateString()}</p></div>
          <div><p className="text-gray-400 text-xs">Newsletter</p><p className="font-semibold">{u.newsletter ? "Yes" : "No"}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide px-5 pt-5 mb-3">Order History</p>
        {orders.length === 0 && <p className="px-5 pb-5 text-sm text-gray-400">No orders yet.</p>}
        <div className="divide-y divide-gray-50">
          {orders.map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition">
              <div>
                <p className="text-sm font-semibold text-navy">#{o.id.slice(0, 8)}</p>
                <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()} · {(o.items as unknown[])?.length ?? 0} items</p>
              </div>
              <p className="font-black text-gray-900">${o.total?.toFixed(2)}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
