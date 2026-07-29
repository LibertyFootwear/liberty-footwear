import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Lightweight passcode lock for Dashboard + Analytics, on top of the admin login.
 * The passcode defaults to "1234" and can be overridden with ANALYTICS_PASSCODE.
 * The unlock cookie stores an HMAC of the passcode, so changing the passcode
 * invalidates old unlocks. Low-security by design — a convenience lock, not auth.
 */

const COOKIE = "lf_analytics_unlock";
export const ANALYTICS_PASSCODE = process.env.ANALYTICS_PASSCODE || "1234";

/** Cookie value derived from the current passcode. */
function token(): string {
  const secret = process.env.JWT_SECRET || "lf-analytics-lock";
  return createHmac("sha256", secret).update(`analytics:${ANALYTICS_PASSCODE}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** True when the submitted code matches the passcode. */
export function verifyPasscode(code: string): boolean {
  return safeEqual(String(code ?? ""), ANALYTICS_PASSCODE);
}

/** True when the current request carries a valid unlock cookie. */
export async function isAnalyticsUnlocked(): Promise<boolean> {
  const store = await cookies();
  const v = store.get(COOKIE)?.value;
  return !!v && safeEqual(v, token());
}

/** Cookie descriptor to set after a correct passcode (30-day unlock). */
export function unlockCookie() {
  return {
    name: COOKIE,
    value: token(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax" as const,
  };
}
