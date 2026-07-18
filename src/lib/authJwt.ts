import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET env var is required");
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const COOKIE = "lf_auth";

export async function signToken(payload: { userId: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: string };
  } catch {
    return null;
  }
}

export async function getAuthUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId ?? null;
}

export function setAuthCookie(token: string) {
  return {
    name: COOKIE,
    value: token,
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax" as const,
  };
}

export function clearAuthCookie() {
  return { name: COOKIE, value: "", httpOnly: true, path: "/", maxAge: 0 };
}
