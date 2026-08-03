import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";

/**
 * Lightweight passcode lock for Dashboard + Analytics, on top of the admin login.
 * The unlock cookie stores an HMAC of the passcode, so changing the passcode
 * invalidates old unlocks. Low-security by design — a convenience lock, not auth.
 */

const COOKIE = "lf_analytics_unlock";
export const ANALYTICS_PASSCODE = env.ANALYTICS_PASSCODE;

/** Cookie value derived from the current passcode. */
function token(): string {
  return createHmac("sha256", env.JWT_SECRET).update(`analytics:${ANALYTICS_PASSCODE}`).digest("hex");
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
    secure: env.isProduction,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax" as const,
  };
}

/** Cookie descriptor that clears the unlock — used on admin login/logout so a new
 *  session must re-enter the passcode to see Dashboard/Analytics. */
export function clearUnlockCookie() {
  return {
    name: COOKIE,
    value: "",
    httpOnly: true,
    secure: env.isProduction,
    path: "/",
    maxAge: 0,
    sameSite: "lax" as const,
  };
}
