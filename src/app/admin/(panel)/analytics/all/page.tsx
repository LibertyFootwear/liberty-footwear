import { requireAdmin } from "@/lib/adminAuth";
import { getAllOrders, aggFromOrders, historicalAgg, mergeAgg } from "@/lib/analytics";
import AnalyticsView from "../AnalyticsView";

export const dynamic = "force-dynamic";

export default async function AllAnalytics() {
  await requireAdmin();
  // Everything: historical retail export + all live orders (web + in-store)
  const agg = mergeAgg(historicalAgg(), aggFromOrders(await getAllOrders()));
  const subtitle = `Everything combined · web + in-store (historical + live) · ${agg.units.toLocaleString()} items · $${agg.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} revenue`;
  return <AnalyticsView agg={agg} active="all" subtitle={subtitle} />;
}
