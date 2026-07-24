import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminIdFromCookie } from "./adminJwt";

export class AdminUnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "AdminUnauthorizedError";
  }
}

/** For pages: redirect to login if not an authenticated admin. */
export async function requireAdmin() {
  const adminId = await getAdminIdFromCookie();
  if (!adminId) redirect("/admin/login");
}

/** For API routes: throw if not an authenticated admin. */
export async function assertAdmin() {
  const adminId = await getAdminIdFromCookie();
  if (!adminId) throw new AdminUnauthorizedError();
}

/** Extra gate for revenue-sensitive pages (Dashboard, Analytics). */
export async function hasAnalyticsAccess(): Promise<boolean> {
  const store = await cookies();
  return store.get("lf_analytics")?.value === "1";
}
