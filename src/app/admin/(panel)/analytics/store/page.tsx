import { requireAdmin } from "@/lib/adminAuth";
import { getAllOrders, splitOrders, aggFromOrders, historicalAgg, mergeAgg } from "@/lib/analytics";
import AnalyticsView from "../AnalyticsView";

export const dynamic = "force-dynamic";

export default async function RetailAnalytics() {
  await requireAdmin();
  const { store } = splitOrders(await getAllOrders());
  const agg = mergeAgg(historicalAgg(), aggFromOrders(store));
  const subtitle = `In-store retail · historical 2017–2026 + live store sales · ${agg.units.toLocaleString()} items · $${agg.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} revenue · syncs as you record store sales`;
  return <AnalyticsView agg={agg} active="retail" subtitle={subtitle} />;
}
