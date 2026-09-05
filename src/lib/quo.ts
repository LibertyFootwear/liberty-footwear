import "server-only";
import crypto from "crypto";
import { env } from "@/lib/env";
import { getSupabase } from "@/lib/supabase";
import { normalizePhone } from "@/lib/customersDb";

/**
 * Quo (formerly OpenPhone) telephony integration — SMS + call logging.
 * Docs: https://www.quo.com/docs · Base https://api.quo.com/v1 · auth is the raw
 * API key in the Authorization header (no "Bearer" prefix).
 */
const BASE = "https://api.quo.com/v1";

export const quoEnabled = !!env.QUO_API_KEY;

export interface SendSmsResult { ok: boolean; id?: string; error?: string }

/** Send an SMS via Quo. `from` defaults to QUO_PHONE_NUMBER. */
export async function sendSms(to: string, content: string, from?: string): Promise<SendSmsResult> {
  if (!env.QUO_API_KEY) return { ok: false, error: "Quo not configured" };
  const fromNumber = from || env.QUO_PHONE_NUMBER;
  if (!fromNumber) return { ok: false, error: "No Quo 'from' number configured" };
  const text = (content ?? "").trim();
  if (!text) return { ok: false, error: "Empty message" };

  try {
    const res = await fetch(`${BASE}/messages`, {
      method: "POST",
      headers: { Authorization: env.QUO_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromNumber, to: [to], content: text }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status !== 202 && !res.ok) {
      return { ok: false, error: data?.message || `Quo error ${res.status}` };
    }
    return { ok: true, id: data?.data?.id ?? data?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" };
  }
}

/**
 * Verify a Quo webhook signature (svix scheme). Signs `{id}.{timestamp}.{body}`
 * with HMAC-SHA256 using the base64-decoded secret (after the whsec_ prefix).
 * Pass the RAW request body (bytes as received) — a re-serialized JSON will fail.
 */
export function verifyQuoWebhook(rawBody: string, headers: Headers): boolean {
  const secret = env.QUO_WEBHOOK_SECRET;
  if (!secret) return false;
  const id = headers.get("webhook-id");
  const ts = headers.get("webhook-timestamp");
  const sigHeader = headers.get("webhook-signature");
  if (!id || !ts || !sigHeader) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = crypto.createHmac("sha256", key).update(`${id}.${ts}.${rawBody}`).digest("base64");

  // Header is a space-separated list of "v1,<sig>" entries.
  for (const part of sigHeader.split(" ")) {
    const sig = part.includes(",") ? part.split(",")[1] : part;
    try {
      if (sig && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return true;
    } catch { /* length mismatch — keep checking */ }
  }
  return false;
}

/** Find the customer id whose stored phone matches this number (digits-only match). */
export async function matchCustomerByPhone(phone: string | null | undefined): Promise<string | null> {
  const norm = normalizePhone(phone);
  if (!norm) return null;
  const { data } = await getSupabase()
    .from("customers")
    .select("id")
    .eq("phone_norm", norm)
    .limit(1)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

export { normalizePhone };
