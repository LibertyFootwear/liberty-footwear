import { requireAdmin } from "@/lib/adminAuth";
import { isAnalyticsUnlocked } from "@/lib/analyticsLock";
import { getAllOrders, getRetailSales, aggFromOrders, retailAgg, mergeAgg } from "@/lib/analytics";
import AnalyticsView from "../AnalyticsView";
import AnalyticsGate from "@/components/AnalyticsGate";

export const dynamic = "force-dynamic";

export default async function AllAnalytics() {
  await requireAdmin();
  if (!(await isAnalyticsUnlocked())) return <AnalyticsGate />;
  // Everything: live retail-sales log + all live orders (web + in-store)
  const [orders, retail] = await Promise.all([getAllOrders(), getRetailSales()]);
  const agg = mergeAgg(retailAgg(retail), aggFromOrders(orders));
  const subtitle = `Everything combined · web + in-store · ${agg.units.toLocaleString()} items · $${agg.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} revenue`;
  return <AnalyticsView agg={agg} active="all" subtitle={subtitle} />;
}
