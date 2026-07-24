import { requireAdmin } from "@/lib/adminAuth";
import { getAllOrders, splitOrders, aggFromOrders } from "@/lib/analytics";
import AnalyticsView from "./AnalyticsView";

export const dynamic = "force-dynamic";

export default async function WebAnalytics() {
  await requireAdmin();
  const { web } = splitOrders(await getAllOrders());
  const agg = aggFromOrders(web);
  const subtitle = `Online store · ${agg.orders} web orders · ${agg.units} units · $${agg.revenue.toFixed(0)} revenue · updates with every online sale`;
  return <AnalyticsView agg={agg} active="web" subtitle={subtitle} />;
}
