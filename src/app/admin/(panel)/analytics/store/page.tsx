import { requireAdmin } from "@/lib/adminAuth";
import { getAllOrders, getRetailSales, splitOrders, aggFromOrders, retailAgg, mergeAgg } from "@/lib/analytics";
import AnalyticsView from "../AnalyticsView";

export const dynamic = "force-dynamic";

export default async function RetailAnalytics() {
  await requireAdmin();
  const [orders, retail] = await Promise.all([getAllOrders(), getRetailSales()]);
  const { store } = splitOrders(orders);
  const agg = mergeAgg(retailAgg(retail), aggFromOrders(store));
  const subtitle = `In-store retail · live from the Retail Sales log + any store orders · ${agg.units.toLocaleString()} items · $${agg.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} revenue · updates as you record sales`;
  return <AnalyticsView agg={agg} active="retail" subtitle={subtitle} />;
}
