import { products } from "@/data/products";
import { Agg, MONTHS } from "@/lib/analytics";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TABS = [
  { key: "web", href: "/admin/analytics", label: "Web" },
  { key: "retail", href: "/admin/analytics/store", label: "Retail Sales" },
  { key: "all", href: "/admin/analytics/all", label: "All Combined" },
];

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-xl sm:text-2xl font-black text-navy mt-1">{value}</p>
      {sub && <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function Bar({ label, value, max, sub, color = "bg-navy" }: { label: string; value: number; max: number; sub?: string; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="w-14 sm:w-28 flex-shrink-0 text-xs sm:text-sm text-gray-600 truncate text-right">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-5 sm:h-6 overflow-hidden">
        <div className={`h-full ${color} rounded-full min-w-[2px]`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-16 sm:w-24 flex-shrink-0 text-xs sm:text-sm font-bold text-navy">{value.toLocaleString()}{sub ? <span className="text-gray-400 font-normal text-[10px] sm:text-xs"> {sub}</span> : ""}</div>
    </div>
  );
}

export default function AnalyticsView({ agg, active, subtitle }: { agg: Agg; active: string; subtitle: string }) {
  const topProducts = Object.entries(agg.byStock)
    .map(([stockNo, units]) => ({ stockNo, units, name: products.find((p) => p.stockNo === stockNo)?.name ?? stockNo }))
    .sort((a, b) => b.units - a.units).slice(0, 12);
  const sizes = Object.entries(agg.bySize).map(([s, v]) => [parseFloat(s), v] as [number, number])
    .filter(([s]) => !isNaN(s)).sort((a, b) => a[0] - b[0]);
  const colors = Object.entries(agg.byColor).sort((a, b) => b[1] - a[1]);
  const widths = [["Medium", agg.byWidth["M"] ?? 0], ["Extra Wide", agg.byWidth["EW"] ?? 0], ["Other / specialty", agg.byWidth["Other"] ?? 0]] as [string, number][];
  const pays = Object.entries(agg.byPay).sort((a, b) => b[1] - a[1]);
  const years = Object.keys(agg.byYear).map(Number).sort((a, b) => a - b);

  const maxProduct = Math.max(1, ...topProducts.map((p) => p.units));
  const maxSize = Math.max(1, ...sizes.map(([, v]) => v));
  const maxColor = Math.max(1, ...colors.map(([, v]) => v));
  const maxWidth = Math.max(1, ...widths.map(([, v]) => v));
  const maxPay = Math.max(1, ...pays.map(([, v]) => v));
  const totalPay = pays.reduce((s, [, v]) => s + v, 0);
  const maxDay = Math.max(1, ...DAYS.map((d) => agg.byDay[d] ?? 0));
  const maxMonth = Math.max(1, ...MONTHS.map((m) => agg.byMonth[m] ?? 0));
  const maxHour = Math.max(1, ...Object.values(agg.byHour));
  const maxYearRev = Math.max(1, ...years.map((y) => agg.byYear[y].revenue));

  // Headline KPIs (computed from the same aggregate). Orders/AOV only apply to
  // web orders — retail sales are line items, not baskets — so hide them at 0.
  const money0 = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const aov = agg.orders > 0 ? agg.revenue / agg.orders : 0;
  const perPair = agg.units > 0 ? agg.revenue / agg.units : 0;
  const kpis: { label: string; value: string; sub?: string }[] = [
    { label: "Revenue", value: money0(agg.revenue) },
    ...(agg.orders > 0 ? [{ label: "Orders", value: agg.orders.toLocaleString() }] : []),
    { label: "Pairs sold", value: agg.units.toLocaleString() },
    ...(agg.orders > 0 ? [{ label: "Avg order value", value: money0(aov) }] : []),
    ...(agg.units > 0 ? [{ label: "Avg $ / pair", value: money0(perPair) }] : []),
  ];

  const hasWidth = widths.some(([, v]) => v > 0);
  const hasMonth = MONTHS.some((m) => (agg.byMonth[m] ?? 0) > 0);
  // Hour-of-day is only meaningful where records carry a timestamp (web orders).
  // In-store retail sales are dated only, so hide it on the retail tab.
  const hasHour = agg.hasHour && Object.keys(agg.byHour).length > 0 && active !== "retail";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-black text-navy mb-4">Analytics</h1>
        <div className="flex gap-2 border-b border-gray-200 mb-4 overflow-x-auto">
          {TABS.map((t) => (
            <a key={t.key} href={t.href}
              className={`px-4 py-2 text-sm font-bold transition whitespace-nowrap ${active === t.key ? "text-navy border-b-2 border-navy -mb-px" : "text-gray-400 hover:text-navy"}`}>
              {t.label}
            </a>
          ))}
        </div>
        <p className="text-sm text-gray-400">{subtitle}</p>
      </div>

      {agg.units === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
          No sales data in this view yet.
        </div>
      ) : (
        <>
          {/* Headline KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {kpis.map((k) => <Kpi key={k.label} label={k.label} value={k.value} sub={k.sub} />)}
          </div>

          {/* Revenue by year (historical / combined) */}
          {agg.hasYear && years.length > 1 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <h2 className="font-black text-navy mb-5">Revenue by Year</h2>
              <div className="overflow-x-auto">
                <div className="flex items-end justify-between gap-3 h-48 min-w-[320px]">
                  {years.map((y) => (
                    <div key={y} className="flex-1 flex flex-col items-center justify-end h-full">
                      <p className="text-xs font-black text-navy mb-1">${(agg.byYear[y].revenue / 1000).toFixed(0)}k</p>
                      <div className="w-full bg-navy rounded-t-lg min-h-[2px]" style={{ height: `${(agg.byYear[y].revenue / maxYearRev) * 100}%` }} title={`${agg.byYear[y].units} units`} />
                      <p className="text-xs text-gray-400 mt-2">{y}</p>
                      <p className="text-[10px] text-gray-300">{agg.byYear[y].units}u</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Top products */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <h2 className="font-black text-navy mb-5">Top Selling Products</h2>
            <div className="space-y-2.5">
              {topProducts.map((p) => (
                <Bar key={p.stockNo} label={p.stockNo} value={p.units} max={maxProduct} sub="pairs" />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sizes */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <h2 className="font-black text-navy mb-5">Best-Selling Sizes</h2>
              <div className="space-y-2.5">
                {sizes.length === 0 && <p className="text-sm text-gray-400">No size data yet.</p>}
                {sizes.map(([s, v]) => (
                  <Bar key={s} label={String(s)} value={v} max={maxSize} sub="pairs" color="bg-tan" />
                ))}
              </div>
            </div>

            {/* Colors + widths */}
            <div className="space-y-8">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <h2 className="font-black text-navy mb-5">Best-Selling Colors</h2>
                <div className="space-y-2.5">
                  {colors.map(([c, v]) => (
                    <Bar key={c} label={c} value={v} max={maxColor} sub="pairs" color="bg-[#8A6D3B]" />
                  ))}
                </div>
              </div>
              {hasWidth && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
                  <h2 className="font-black text-navy mb-5">By Width</h2>
                  <div className="space-y-2.5">
                    {widths.map(([w, v]) => (
                      <Bar key={w} label={w} value={v} max={maxWidth} sub="pairs" color="bg-navy" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Month seasonality */}
          {hasMonth && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <h2 className="font-black text-navy mb-5">Sales by Month (seasonality)</h2>
              <div className="overflow-x-auto">
                <div className="flex items-end justify-between gap-2 h-40 min-w-[560px]">
                  {MONTHS.map((m) => (
                    <div key={m} className="flex-1 flex flex-col items-center justify-end h-full">
                      <p className="text-xs font-black text-navy mb-1">{agg.byMonth[m] ?? 0}</p>
                      <div className="w-full bg-tan rounded-t-lg min-h-[2px]" style={{ height: `${((agg.byMonth[m] ?? 0) / maxMonth) * 100}%` }} />
                      <p className="text-xs text-gray-400 mt-2">{m}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Day of week */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <h2 className="font-black text-navy mb-5">Sales by Day of Week</h2>
              <div className="overflow-x-auto">
                <div className="flex items-end justify-between gap-2 h-36 min-w-[340px]">
                  {DAYS.map((day) => (
                    <div key={day} className="flex-1 flex flex-col items-center justify-end h-full">
                      <p className="text-xs font-black text-navy mb-1">{agg.byDay[day] ?? 0}</p>
                      <div className="w-full bg-navy rounded-t-lg min-h-[2px]" style={{ height: `${((agg.byDay[day] ?? 0) / maxDay) * 100}%` }} />
                      <p className="text-xs text-gray-400 mt-2">{day}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment methods */}
            {pays.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <h2 className="font-black text-navy mb-5">Payment Method</h2>
                <div className="space-y-2.5">
                  {pays.map(([m, v]) => (
                    <Bar key={m} label={m} value={v} max={maxPay} sub={`· ${((v / totalPay) * 100).toFixed(0)}%`} color="bg-[#8A6D3B]" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hour of day (live only) */}
          {hasHour && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <h2 className="font-black text-navy mb-1">Sales by Time of Day</h2>
              <p className="text-xs text-gray-400 mb-5">Store local time (Grand Rapids, MI)</p>
              <div className="overflow-x-auto">
                <div className="flex items-end justify-between gap-0.5 h-32 min-w-[600px]">
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="flex-1 flex flex-col items-center justify-end h-full group">
                      <div className="w-full bg-tan rounded-t min-h-[1px] group-hover:bg-navy transition" style={{ height: `${((agg.byHour[h] ?? 0) / maxHour) * 100}%` }} title={`${h}:00 — ${agg.byHour[h] ?? 0}`} />
                      {h % 3 === 0 && <p className="text-[10px] text-gray-400 mt-1">{h}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
