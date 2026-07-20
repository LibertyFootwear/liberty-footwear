import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

export default async function AdminDashboard() {
  await requireAdmin();
  const sb = getSupabase();

  const [ordersRes, usersRes, revenueRes] = await Promise.all([
    sb.from("orders").select("id, status, total, created_at").order("created_at", { ascending: false }).limit(8),
    sb.from("users").select("id, name, email, created_at").order("created_at", { ascending: false }).limit(5),
    sb.from("orders").select("total, status"),
  ]);

  const orders = ordersRes.data ?? [];
  const recentUsers = usersRes.data ?? [];
  const allOrders = revenueRes.data ?? [];

  const totalRevenue = allOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const paidOrders = allOrders.filter((o) => o.status !== "cancelled").length;

  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => o.created_at?.slice(0, 10) === today);
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.total ?? 0), 0);

  const STATUS_COLOR: Record<string, string> = {
    paid:       "bg-blue-100 text-blue-700",
    processing: "bg-yellow-100 text-yellow-700",
    shipped:    "bg-purple-100 text-purple-700",
    delivered:  "bg-green-100 text-green-700",
    cancelled:  "bg-red-100 text-red-700",
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total Revenue", value: `$${totalRevenue.toFixed(0)}`, sub: "all time" },
          { label: "Total Orders", value: paidOrders, sub: "all time" },
          { label: "Today's Revenue", value: `$${todayRevenue.toFixed(0)}`, sub: today },
          { label: "Today's Orders", value: todayOrders.length, sub: "new today" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-3xl font-black text-navy">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent orders */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-black text-navy">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs font-bold text-navy hover:text-red transition">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {orders.length === 0 && <p className="px-6 py-8 text-sm text-gray-400 text-center">No orders yet.</p>}
            {orders.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition">
                <div>
                  <p className="text-sm font-semibold text-navy">#{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-600"}`}>{o.status}</span>
                  <span className="text-sm font-black text-gray-900">${o.total?.toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent customers */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-black text-navy">Recent Customers</h2>
            <Link href="/admin/customers" className="text-xs font-bold text-navy hover:text-red transition">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers.length === 0 && <p className="px-6 py-8 text-sm text-gray-400 text-center">No accounts yet.</p>}
            {recentUsers.map((u) => (
              <Link key={u.id} href={`/admin/customers/${u.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition">
                <div>
                  <p className="text-sm font-semibold text-navy">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
