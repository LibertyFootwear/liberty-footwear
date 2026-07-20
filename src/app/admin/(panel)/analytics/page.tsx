import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { products } from "@/data/products";

export const dynamic = "force-dynamic";

interface OrderItem { stockNo: string; name: string; size?: string; price: number; qty: number }
interface OrderRow { items: OrderItem[]; total: number; status: string; created_at: string }

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Bar({ label, value, max, sub, color = "bg-navy" }: { label: string; value: number; max: number; sub?: string; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 flex-shrink-0 text-sm text-gray-600 truncate text-right">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
        <div className={`h-full ${color} rounded-full min-w-[2px] transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-24 flex-shrink-0 text-sm font-bold text-navy">{value}{sub ? <span className="text-gray-400 font-normal text-xs"> {sub}</span> : ""}</div>
    </div>
  );
}

export default async function AdminAnalytics() {
  await requireAdmin();

  const { data } = await getSupabase().from("orders").select("items, total, status, created_at");
  const orders = ((data ?? []) as OrderRow[]).filter((o) => o.status !== "cancelled");

  // Time-zone aware parts (store is in Michigan)
  const dayFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Detroit", weekday: "short" });
  const hourFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Detroit", hour: "2-digit", hour12: false });

  const productAgg: Record<string, { name: string; qty: number; revenue: number }> = {};
  const sizeAgg: Record<string, number> = {};
  const colorAgg: Record<string, number> = {};
  const dayAgg: Record<string, { orders: number; revenue: number }> = {};
  const hourAgg: Record<number, number> = {};
  let totalUnits = 0;

  for (const d of DAYS) dayAgg[d] = { orders: 0, revenue: 0 };

  for (const o of orders) {
    const dt = new Date(o.created_at);
    const day = dayFmt.format(dt);
    if (dayAgg[day]) { dayAgg[day].orders += 1; dayAgg[day].revenue += o.total ?? 0; }
    const hour = parseInt(hourFmt.format(dt), 10);
    if (!isNaN(hour)) hourAgg[hour] = (hourAgg[hour] ?? 0) + 1;

    for (const it of o.items ?? []) {
      const prod = products.find((p) => p.stockNo === it.stockNo);
      const key = it.stockNo || it.name;
      if (!productAgg[key]) productAgg[key] = { name: prod?.name ?? it.name, qty: 0, revenue: 0 };
      productAgg[key].qty += it.qty;
      productAgg[key].revenue += (it.price ?? prod?.price ?? 0) * it.qty;
      totalUnits += it.qty;

      if (it.size) sizeAgg[it.size] = (sizeAgg[it.size] ?? 0) + it.qty;
      const color = prod?.colorLeather ?? "Unknown";
      colorAgg[color] = (colorAgg[color] ?? 0) + it.qty;
    }
  }

  const topProducts = Object.values(productAgg).sort((a, b) => b.qty - a.qty).slice(0, 10);
  const topSizes = Object.entries(sizeAgg).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const topColors = Object.entries(colorAgg).sort((a, b) => b[1] - a[1]);
  const maxProduct = Math.max(1, ...topProducts.map((p) => p.qty));
  const maxSize = Math.max(1, ...topSizes.map(([, v]) => v));
  const maxColor = Math.max(1, ...topColors.map(([, v]) => v));
  const maxDay = Math.max(1, ...DAYS.map((d) => dayAgg[d].orders));
  const maxHour = Math.max(1, ...Object.values(hourAgg));

  const totalRevenue = orders.reduce((s, o) => s + (o.total ?? 0), 0);

  if (orders.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-black text-navy mb-4">Analytics</h1>
        <div className="flex gap-2 border-b border-gray-200 mb-8">
          <a href="/admin/analytics" className="px-4 py-2 text-sm font-bold text-navy border-b-2 border-navy -mb-px">Web (live)</a>
          <a href="/admin/analytics/store" className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-navy transition">Store (2017–2026)</a>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
          No web sales data yet. Charts will appear here automatically as orders come in. See the Store tab for historical retail sales.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-navy mb-4">Analytics</h1>
        <div className="flex gap-2 border-b border-gray-200 mb-4">
          <a href="/admin/analytics" className="px-4 py-2 text-sm font-bold text-navy border-b-2 border-navy -mb-px">Web (live)</a>
          <a href="/admin/analytics/store" className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-navy transition">Store (2017–2026)</a>
        </div>
        <p className="text-sm text-gray-400">Based on {orders.length} web orders · {totalUnits} units sold · ${totalRevenue.toFixed(0)} revenue · updates with every sale</p>
      </div>

      {/* Top products */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-black text-navy mb-5">Top Selling Products</h2>
        <div className="space-y-2.5">
          {topProducts.map((p) => (
            <Bar key={p.name} label={p.name} value={p.qty} max={maxProduct} sub={`· $${p.revenue.toFixed(0)}`} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sizes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-black text-navy mb-5">Best-Selling Sizes</h2>
          <div className="space-y-2.5">
            {topSizes.length === 0 && <p className="text-sm text-gray-400">No size data yet.</p>}
            {topSizes.map(([size, qty]) => (
              <Bar key={size} label={size} value={qty} max={maxSize} sub="pcs" color="bg-tan" />
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-black text-navy mb-5">Best-Selling Colors</h2>
          <div className="space-y-2.5">
            {topColors.map(([color, qty]) => (
              <Bar key={color} label={color} value={qty} max={maxColor} sub="pcs" color="bg-[#8A6D3B]" />
            ))}
          </div>
        </div>
      </div>

      {/* Day of week */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-black text-navy mb-5">Orders by Day of Week</h2>
        <div className="flex items-end justify-between gap-3 h-40">
          {DAYS.map((d) => (
            <div key={d} className="flex-1 flex flex-col items-center justify-end h-full">
              <p className="text-xs font-black text-navy mb-1">{dayAgg[d].orders}</p>
              <div className="w-full bg-navy rounded-t-lg min-h-[2px]" style={{ height: `${(dayAgg[d].orders / maxDay) * 100}%` }} title={`$${dayAgg[d].revenue.toFixed(0)}`} />
              <p className="text-xs text-gray-400 mt-2">{d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hour of day */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-black text-navy mb-1">Orders by Time of Day</h2>
        <p className="text-xs text-gray-400 mb-5">Store local time (Grand Rapids, MI)</p>
        <div className="flex items-end justify-between gap-0.5 h-32">
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="flex-1 flex flex-col items-center justify-end h-full group">
              <div className="w-full bg-tan rounded-t min-h-[1px] group-hover:bg-navy transition" style={{ height: `${((hourAgg[h] ?? 0) / maxHour) * 100}%` }} title={`${h}:00 — ${hourAgg[h] ?? 0} orders`} />
              {h % 3 === 0 && <p className="text-[10px] text-gray-400 mt-1">{h}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
