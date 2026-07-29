import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Re-lock the Dashboard + Analytics passcode as soon as the admin navigates away.
 * The unlock cookie is dropped on any real navigation to an admin page outside the
 * locked section, so re-entering Dashboard/Analytics always asks for the code again.
 * Prefetch requests are ignored so hovering a link doesn't clear the unlock.
 */

const UNLOCK_COOKIE = "lf_analytics_unlock";

/** Dashboard (/admin exactly) + all Analytics tabs. */
function isLockedSection(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/analytics");
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPrefetch =
    req.headers.get("next-router-prefetch") === "1" ||
    req.headers.get("purpose") === "prefetch";

  // Only act on genuine navigations into the admin panel.
  if (isPrefetch || !pathname.startsWith("/admin") || pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Leaving the locked section → clear the unlock so the code is required next time.
  if (!isLockedSection(pathname) && req.cookies.get(UNLOCK_COOKIE)) {
    const res = NextResponse.next();
    res.cookies.delete(UNLOCK_COOKIE);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
