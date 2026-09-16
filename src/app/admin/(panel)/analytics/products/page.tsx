import { requireAdmin } from "@/lib/adminAuth";
import { isAnalyticsUnlocked } from "@/lib/analyticsLock";
import { getAllOrders, getRetailSales } from "@/lib/analytics";
import { products } from "@/data/products";
import AnalyticsGate from "@/components/AnalyticsGate";
import Link from "next/link";
import { PageHeader, StatCard } from "../../ui";
import { TABS } from "../AnalyticsView";
import ProductSalesFilter from "./ProductSalesFilter";

export const dynamic = "force-dynamic";

interface Row {
  code: string; name: string; color: string;
  onlinePairs: number; retailPairs: number; onlineRev: number; retailRev: number;
}

const norm = (s: string) => (s ?? "").toUpperCase().replace(/\s+/g, "").trim();

// stockNo -> {name, color} from the catalog, with a longest-prefix fallback for variants.
const META = new Map(products.map((p) => [norm(p.stockNo), { name: p.name, color: p.colorLeather ?? "" }]));
function resolve(code: string): { name: string; color: string } {
  const exact = META.get(code);
  if (exact) return exact;
  let best: { name: string; color: string } | undefined;
  let bestLen = 0;
  for (const [k, v] of META) if (code.startsWith(k) && k.length > bestLen) { best = v; bestLen = k.length; }
  return best ?? { name: code, color: "" };
}

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export default async function ProductSalesAnalytics({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; q?: string }> }) {
  await requireAdmin();
  if (!(await isAnalyticsUnlocked())) return <AnalyticsGate />;

  const sp = await searchParams;
  const from = sp.from ?? "";
  const to = sp.to ?? "";
  const q = (sp.q ?? "").trim().toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);

  const [orders, retail] = await Promise.all([getAllOrders(), getRetailSales()]);

  const map = new Map<string, Row>();
  const get = (code: string): Row => {
    let r = map.get(code);
    if (!r) { const m = resolve(code); r = { code, name: m.name, color: m.color, onlinePairs: 0, retailPairs: 0, onlineRev: 0, retailRev: 0 }; map.set(code, r); }
    return r;
  };

  // Retail (net of returns)
  for (const s of retail) {
    const d = (s.sale_date ?? "").slice(0, 10);
    if (from && d < from) continue;
    if (to && d > to) continue;
    const code = norm(s.stock_no || "");
    if (!code) continue;
    const qty = Number(s.qty) || 1;
    const total = Number(s.total) || 0;
    const r = get(code);
    r.retailPairs += total < 0 ? -qty : qty;
    r.retailRev += total;
  }

  // Online (web + in-store orders, excl. cancelled)
  for (const o of orders) {
    if ((o.status ?? "") === "cancelled") continue;
    const d = (o.created_at ?? "").slice(0, 10);
    if (from && d < from) continue;
    if (to && d > to) continue;
    for (const it of o.items ?? []) {
      const code = norm(it.stockNo || "");
      if (!code) continue;
      const qty = Number(it.qty) || 1;
      const r = get(code);
      r.onlinePairs += qty;
      r.onlineRev += (Number(it.price) || 0) * qty;
    }
  }

  const base = terms.length
    ? [...map.values()].filter((r) => {
        const hay = `${r.name} ${r.color} ${r.code}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      })
    : [...map.values()];
  const rows = base
    .map((r) => ({ ...r, totalPairs: r.onlinePairs + r.retailPairs, totalRev: r.onlineRev + r.retailRev }))
    .filter((r) => r.totalPairs !== 0)
    .sort((a, b) => b.totalPairs - a.totalPairs);

  const sum = (k: "onlinePairs" | "retailPairs" | "totalPairs" | "totalRev") => rows.reduce((s, r) => s + r[k], 0);

  const th = "px-3 py-2 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap";
  const thR = th + " text-right";
  const td = "px-3 py-2 text-sm text-gray-700";
  const tdR = td + " text-right tabular-nums";

  return (
    <div className="p-8">
      <PageHeader title="Analytics" />

      <div className="flex gap-2 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <Link key={t.key} href={t.href}
            className={`px-4 py-2 text-sm font-bold transition whitespace-nowrap ${t.key === "products" ? "text-navy border-b-2 border-navy -mb-px" : "text-gray-400 hover:text-navy"}`}>
            {t.label}
          </Link>
        ))}
      </div>

      <p className="text-sm text-gray-400 mb-6">
        How many of each boot sold — online + retail — for a date range. Search a model or colour (e.g. &quot;gary russet&quot;) or a stock #.
      </p>

      <ProductSalesFilter from={from} to={to} q={sp.q ?? ""} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pairs sold" value={sum("totalPairs").toLocaleString()} sub={`${rows.length} product${rows.length !== 1 ? "s" : ""}`} />
        <StatCard label="Online" value={sum("onlinePairs").toLocaleString()} sub="web pairs" />
        <StatCard label="Retail" value={sum("retailPairs").toLocaleString()} sub="in-store pairs" />
        <StatCard label="Revenue" value={money(sum("totalRev"))} sub="product sales" />
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className={th}>Boot</th>
              <th className={th}>Stock #</th>
              <th className={thR}>Online</th>
              <th className={thR}>Retail</th>
              <th className={thR}>Total pairs</th>
              <th className={thR}>Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.length === 0 && (
              <tr><td className={td} colSpan={6}><span className="text-gray-400">No sales match this filter.</span></td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.code} className="hover:bg-gray-50">
                <td className={td}><span className="font-semibold text-navy">{r.name}</span>{r.color ? <span className="text-gray-400"> · {r.color}</span> : null}</td>
                <td className={`${td} font-mono text-xs`}>{r.code}</td>
                <td className={tdR}>{r.onlinePairs.toLocaleString()}</td>
                <td className={tdR}>{r.retailPairs.toLocaleString()}</td>
                <td className={`${tdR} font-black text-navy`}>{r.totalPairs.toLocaleString()}</td>
                <td className={tdR}>{money(r.totalRev)}</td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-black text-navy">
                <td className={td} colSpan={2}>Total</td>
                <td className={tdR}>{sum("onlinePairs").toLocaleString()}</td>
                <td className={tdR}>{sum("retailPairs").toLocaleString()}</td>
                <td className={tdR}>{sum("totalPairs").toLocaleString()}</td>
                <td className={tdR}>{money(sum("totalRev"))}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
