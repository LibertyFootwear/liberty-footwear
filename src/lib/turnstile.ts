import "server-only";
import { env } from "@/lib/env";

/**
 * Verify a Cloudflare Turnstile token server-side.
 * - No secret configured → returns true (captcha disabled; honeypot still guards).
 * - Secret configured but token missing/invalid → returns false.
 */
export async function verifyTurnstile(token: string | undefined | null, ip?: string): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not set up yet — don't block real customers
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
