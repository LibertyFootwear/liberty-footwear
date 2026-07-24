import { requireAdmin, hasAnalyticsAccess } from "@/lib/adminAuth";
import AnalyticsLock from "../AnalyticsLock";

export default async function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  if (!(await hasAnalyticsAccess())) return <AnalyticsLock title="Analytics" />;
  return <>{children}</>;
}
