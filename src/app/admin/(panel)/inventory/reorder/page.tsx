import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { products } from "@/data/products";
import {
  buildForecast, combineSize, DEFAULT_PARAMS,
  type DemandEvent, type StockLevel, type ForecastParams,
} from "@/lib/forecast";
import InventoryTabs from "../InventoryTabs";
import { PageHeader } from "../../ui";
import ReorderTable from "./ReorderTable";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;

/** Read numeric query overrides so the buyer can tune lead time / responsiveness. */
function intParam(v: string | string[] | undefined, fallback: number): number {
  const n = parseInt(Array.isArray(v) ? v[0] : v ?? "");
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default async function ReorderForecast({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const params: ForecastParams = {
    windowDays: intParam(sp.window, DEFAULT_PARAMS.windowDays),
    halfLifeDays: intParam(sp.halfLife, DEFAULT_PARAMS.halfLifeDays),
    leadTimeDays: intParam(sp.lead, DEFAULT_PARAMS.leadTimeDays),
    safetyDays: intParam(sp.safety, DEFAULT_PARAMS.safetyDays),
    now: new Date(),
  };

  const sb = getSupabase();
  const cutoffIso = new Date(Date.now() - params.windowDays * DAY_MS).toISOString();
  const cutoffDate = cutoffIso.slice(0, 10);

  const [{ data: inv }, { data: sales }, { data: orders }] = await Promise.all([
    sb.from("inventory").select("stock_no, size, qty"),
    sb.from("retail_sales").select("stock_no, size, width, qty, total, sale_date").gte("sale_date", cutoffDate),
    sb.from("orders").select("items, created_at, status").gte("created_at", cutoffIso),
  ]);

  const stock: StockLevel[] = (inv ?? []).map((r) => ({
    stockNo: r.stock_no as string,
    size: r.size as string,
    qty: (r.qty as number) ?? 0,
  }));

  const demand: DemandEvent[] = [];

  // Store sales: negative total (or explicit return) puts stock back, so counts as negative demand.
  for (const s of sales ?? []) {
    const size = combineSize(s.width as string, s.size as string);
    if (!s.stock_no || !size) continue;
    const total = typeof s.total === "number" ? s.total : parseFloat(String(s.total));
    const isReturn = Number.isFinite(total) && total < 0;
    const qty = Math.max(1, (s.qty as number) || 1) * (isReturn ? -1 : 1);
    demand.push({ stockNo: s.stock_no as string, size, qty, date: `${s.sale_date}T12:00:00` });
  }

  // Web orders: each line item is one demand event on the order date.
  for (const o of orders ?? []) {
    const items = (o.items as { stockNo?: string; size?: string; qty?: number }[]) ?? [];
    for (const it of items) {
      if (!it.stockNo || !it.size) continue;
      demand.push({
        stockNo: it.stockNo,
        size: it.size,
        qty: Math.max(1, it.qty ?? 1),
        date: o.created_at as string,
      });
    }
  }

  const models = buildForecast(demand, stock, params);
  const names = Object.fromEntries(products.map((p) => [p.stockNo, p.name]));

  const totalToOrder = models.reduce((s, m) => s + m.recommendedOrder, 0);
  const urgentCount = models.filter((m) => m.status === "urgent").length;

  return (
    <div className="p-8">
      <PageHeader title="Reorder Forecast" />
      <InventoryTabs active="reorder" />

      <div className="mb-6 space-y-1">
        <p className="text-sm text-gray-400">
          Learns from the last {params.windowDays} days of store + web sales (recent sales weighted heavier,
          {" "}{params.halfLifeDays}-day half-life). Covers a {params.leadTimeDays}-day lead time plus
          {" "}{params.safetyDays} days of safety stock.
        </p>
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-navy">{urgentCount}</span> models will stock out before a reorder lands ·
          {" "}suggested to order <span className="font-semibold text-navy">{totalToOrder}</span> pairs total.
          Tune with URL params <code>?lead=45&amp;safety=21&amp;halfLife=45&amp;window=180</code>.
        </p>
      </div>

      <ReorderTable models={models} names={names} />
    </div>
  );
}
