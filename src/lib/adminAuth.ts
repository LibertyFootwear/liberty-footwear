import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const store = await cookies();
  const token = store.get("lf_admin")?.value;
  if (token !== "1") redirect("/admin/login");
}

/** Extra gate for revenue-sensitive pages (Dashboard, Analytics). */
export async function hasAnalyticsAccess(): Promise<boolean> {
  const store = await cookies();
  return store.get("lf_analytics")?.value === "1";
}
