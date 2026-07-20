import { requireAdmin } from "@/lib/adminAuth";
import { products } from "@/data/products";
import store from "@/data/storeSales.json";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface StoreData {
  generated: string;
  yearRange: [number, number];
  totalUnits: number;
  totalRevenue: number;
  byStock: Record<string, number>;
  byOther: { name: string; units: number }[];
  bySize: Record<string, number>;
  byWidth: Record<string, number>;
  byDay: Record<string, number>;
  byMonth: Record<string, number>;
  byYear: Record<string, { units: number; revenue: number }>;
  byPay: Record<string, number>;
}

function Bar({ label, value, max, sub, color = "bg-navy" }: { label: string; value: number; max: number; sub?: string; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 flex-shrink-0 text-sm text-gray-600 truncate text-right">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
        <div className={`h-full ${color} rounded-full min-w-[2px]`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-24 flex-shrink-0 text-sm font-bold text-navy">{value}{sub ? <span className="text-gray-400 font-normal text-xs"> {sub}</span> : ""}</div>
    </div>
  );
}

export default async function StoreAnalytics() {
  await requireAdmin();
  const d = store as unknown as StoreData;

  // Top boots — map stock# to catalog name/color
  const topBoots = Object.entries(d.byStock)
    .map(([stockNo, units]) => {
      const p = products.find((x) => x.stockNo === stockNo);
      return { stockNo, units, name: p?.name ?? stockNo, color: p?.colorLeather };
    })
    .sort((a, b) => b.units - a.units)
    .slice(0, 15);

  // Colors — aggregate via catalog
  const colorAgg: Record<string, number> = {};
  for (const [stockNo, units] of Object.entries(d.byStock)) {
    const p = products.find((x) => x.stockNo === stockNo);
    if (p) colorAgg[p.colorLeather] = (colorAgg[p.colorLeather] ?? 0) + units;
  }
  const topColors = Object.entries(colorAgg).sort((a, b) => b[1] - a[1]);

  // Sizes (numeric, sorted)
  const sizes = Object.entries(d.bySize).map(([s, v]) => [parseFloat(s), v] as [number, number]).sort((a, b) => a[0] - b[0]);

  // Widths — consolidate messy specialty widths into "Other"
  const mW = d.byWidth["M"] ?? 0, ewW = d.byWidth["EW"] ?? 0;
  const otherW = Object.entries(d.byWidth).filter(([k]) => k !== "M" && k !== "EW").reduce((s, [, v]) => s + v, 0);
  const widths = [["Medium", mW], ["Extra Wide", ewW], ["Other / specialty", otherW]] as [string, number][];

  const topOther = [...d.byOther].sort((a, b) => b.units - a.units).slice(0, 10);
  const years = Object.keys(d.byYear).map(Number).sort((a, b) => a - b);

  const maxBoot = Math.max(1, ...topBoots.map((b) => b.units));
  const maxColor = Math.max(1, ...topColors.map(([, v]) => v));
  const maxSize = Math.max(1, ...sizes.map(([, v]) => v));
  const maxWidth = Math.max(1, ...widths.map(([, v]) => v));
  const maxMonth = Math.max(1, ...MONTHS.map((m) => d.byMonth[m] ?? 0));
  const maxDay = Math.max(1, ...DAYS.map((day) => d.byDay[day] ?? 0));
  const maxYearRev = Math.max(1, ...years.map((y) => d.byYear[y].revenue));
  const maxPay = Math.max(1, ...Object.values(d.byPay));
  const totalPay = Object.values(d.byPay).reduce((s, v) => s + v, 0);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-navy mb-4">Analytics</h1>
        <div className="flex gap-2 border-b border-gray-200 mb-4">
          <a href="/admin/analytics" className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-navy transition">Web (live)</a>
          <a href="/admin/analytics/store" className="px-4 py-2 text-sm font-bold text-navy border-b-2 border-navy -mb-px">Store (2017–2026)</a>
        </div>
        <p className="text-sm text-gray-400">
          In-store retail history · {d.totalUnits.toLocaleString()} items sold · ${d.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} revenue · {d.yearRange[0]}–{d.yearRange[1]}
          <span className="block text-xs mt-1">Snapshot exported {d.generated} — refreshes when a new export is imported.</span>
        </p>
      </div>

      {/* Revenue by year */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-black text-navy mb-5">Revenue by Year</h2>
        <div className="flex items-end justify-between gap-3 h-48">
          {years.map((y) => (
            <div key={y} className="flex-1 flex flex-col items-center justify-end h-full">
              <p className="text-xs font-black text-navy mb-1">${(d.byYear[y].revenue / 1000).toFixed(0)}k</p>
              <div className="w-full bg-navy rounded-t-lg min-h-[2px]" style={{ height: `${(d.byYear[y].revenue / maxYearRev) * 100}%` }} title={`${d.byYear[y].units} units`} />
              <p className="text-xs text-gray-400 mt-2">{y}</p>
              <p className="text-[10px] text-gray-300">{d.byYear[y].units}u</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top boots */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-black text-navy mb-5">Top Selling Boots (all-time)</h2>
        <div className="space-y-2.5">
          {topBoots.map((b) => (
            <Bar key={b.stockNo} label={b.stockNo} value={b.units} max={maxBoot} sub="pairs" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sizes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-black text-navy mb-5">Best-Selling Sizes</h2>
          <div className="space-y-2.5">
            {sizes.map(([s, v]) => (
              <Bar key={s} label={String(s)} value={v} max={maxSize} sub="pairs" color="bg-tan" />
            ))}
          </div>
        </div>

        {/* Colors + widths */}
        <div className="space-y-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-black text-navy mb-5">By Leather Color</h2>
            <div className="space-y-2.5">
              {topColors.map(([c, v]) => (
                <Bar key={c} label={c} value={v} max={maxColor} sub="pairs" color="bg-[#8A6D3B]" />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-black text-navy mb-5">By Width</h2>
            <div className="space-y-2.5">
              {widths.map(([w, v]) => (
                <Bar key={w} label={w} value={v} max={maxWidth} sub="pairs" color="bg-navy" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Seasonality — month */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-black text-navy mb-5">Sales by Month (seasonality)</h2>
        <div className="flex items-end justify-between gap-2 h-40">
          {MONTHS.map((m) => (
            <div key={m} className="flex-1 flex flex-col items-center justify-end h-full">
              <p className="text-xs font-black text-navy mb-1">{d.byMonth[m] ?? 0}</p>
              <div className="w-full bg-tan rounded-t-lg min-h-[2px]" style={{ height: `${((d.byMonth[m] ?? 0) / maxMonth) * 100}%` }} />
              <p className="text-xs text-gray-400 mt-2">{m}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Day of week */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-black text-navy mb-5">Sales by Day of Week</h2>
          <div className="flex items-end justify-between gap-2 h-36">
            {DAYS.map((day) => (
              <div key={day} className="flex-1 flex flex-col items-center justify-end h-full">
                <p className="text-xs font-black text-navy mb-1">{d.byDay[day] ?? 0}</p>
                <div className="w-full bg-navy rounded-t-lg min-h-[2px]" style={{ height: `${((d.byDay[day] ?? 0) / maxDay) * 100}%` }} />
                <p className="text-xs text-gray-400 mt-2">{day}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment methods */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-black text-navy mb-5">Payment Method</h2>
          <div className="space-y-2.5">
            {Object.entries(d.byPay).sort((a, b) => b[1] - a[1]).map(([m, v]) => (
              <Bar key={m} label={m} value={v} max={maxPay} sub={`· ${((v / totalPay) * 100).toFixed(0)}%`} color="bg-[#8A6D3B]" />
            ))}
          </div>
        </div>
      </div>

      {/* Accessories & services */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-black text-navy mb-1">Top Accessories & Services</h2>
        <p className="text-xs text-gray-400 mb-5">Footbeds, repairs, resoles and other non-boot line items</p>
        <div className="space-y-2.5">
          {topOther.map((o) => (
            <Bar key={o.name} label={o.name} value={o.units} max={Math.max(1, topOther[0].units)} sub="sold" color="bg-tan" />
          ))}
        </div>
      </div>
    </div>
  );
}
