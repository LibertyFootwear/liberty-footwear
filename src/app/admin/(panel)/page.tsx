import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

export default async function AdminDashboard() {
  await requireAdmin();
  const sb = getSupabase();

  const [ordersRes, usersRes, revenueRes] = await Promise.all([
    sb.from("orders").select("id, status, total, created_at").order("created_at", { ascending: false }).limit(8),
    sb.from("users").select("id, name, email, created_at").order("created_at", { ascending: false }).limit(5),
    sb.from("orders").select("total, status, created_at"),
  ]);

  const orders = ordersRes.data ?? [];
  const recentUsers = usersRes.data ?? [];
  const allOrders = revenueRes.data ?? [];

  const totalRevenue = allOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const paidOrders = allOrders.filter((o) => o.status !== "cancelled").length;

  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => o.created_at?.slice(0, 10) === today);
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.total ?? 0), 0);

  // Monthly breakdown — last 6 months
  const now = new Date();
  const monthly: { key: string; label: string; revenue: number; orders: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    monthly.push({ key, label, revenue: 0, orders: 0 });
  }
  for (const o of allOrders) {
    if (o.status === "cancelled") continue;
    const key = (o.created_at ?? "").slice(0, 7);
    const m = monthly.find((x) => x.key === key);
    if (m) { m.revenue += o.total ?? 0; m.orders += 1; }
  }
  const maxRevenue = Math.max(1, ...monthly.map((m) => m.revenue));
  const thisMonth = monthly[monthly.length - 1];

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "This Month Revenue", value: `$${thisMonth.revenue.toFixed(0)}`, sub: thisMonth.label },
          { label: "This Month Orders", value: thisMonth.orders, sub: thisMonth.label },
          { label: "Total Revenue", value: `$${totalRevenue.toFixed(0)}`, sub: "all time" },
          { label: "Total Orders", value: paidOrders, sub: "all time" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-3xl font-black text-navy">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Today's snapshot */}
      <div className="flex flex-wrap gap-6 mb-10 text-sm">
        <span className="text-gray-500">Today ({today}): <span className="font-black text-navy">${todayRevenue.toFixed(0)}</span> revenue · <span className="font-black text-navy">{todayOrders.length}</span> orders</span>
      </div>

      {/* Monthly chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="font-black text-navy mb-6">Revenue — Last 6 Months</h2>
        <div className="flex items-end justify-between gap-3 h-48">
          {monthly.map((m) => (
            <div key={m.key} className="flex-1 flex flex-col items-center justify-end h-full">
              <p className="text-xs font-black text-navy mb-1">${m.revenue.toFixed(0)}</p>
              <div
                className="w-full bg-navy rounded-t-lg transition-all min-h-[2px]"
                style={{ height: `${(m.revenue / maxRevenue) * 100}%` }}
                title={`${m.orders} orders`}
              />
              <p className="text-xs text-gray-400 mt-2">{m.label}</p>
              <p className="text-xs text-gray-300">{m.orders} ord.</p>
            </div>
          ))}
        </div>
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
