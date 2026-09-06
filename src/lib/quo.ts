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

/** Send an SMS and log it to the communications table (outgoing), matching a customer. */
export async function sendAndLogSms(to: string, content: string, customerId?: string | null): Promise<SendSmsResult> {
  const result = await sendSms(to, content);
  if (!result.ok) return result;
  const cid = customerId ?? (await matchCustomerByPhone(to));
  try {
    await getSupabase().from("communications").upsert({
      quo_id: result.id ?? `out-${crypto.randomUUID()}`,
      type: "sms",
      direction: "outgoing",
      status: "sent",
      customer_phone: to,
      customer_phone_norm: normalizePhone(to) ?? null,
      content,
      customer_id: cid,
      occurred_at: new Date().toISOString(),
    }, { onConflict: "quo_id" });
  } catch (e) {
    console.error("sendAndLogSms log failed:", e);
  }
  return result;
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

/** Group label applied to every contact we push, so they're filterable in Quo. */
export const QUO_CONTACT_SOURCE = "Liberty Footwear";

export interface QuoContactInput {
  firstName: string;
  lastName?: string | null;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  externalId?: string | null;
}

/** Create a contact in Quo (grouped by source). Returns the new contact id. */
export async function createQuoContact(c: QuoContactInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!env.QUO_API_KEY) return { ok: false, error: "Quo not configured" };
  const body = {
    defaultFields: {
      firstName: (c.firstName || "").trim() || "Customer",
      lastName: c.lastName?.trim() || null,
      company: c.company?.trim() || null,
      phoneNumbers: c.phone ? [{ name: "Mobile", value: c.phone }] : [],
      emails: c.email ? [{ name: "Email", value: c.email }] : [],
    },
    source: QUO_CONTACT_SOURCE,
    ...(c.externalId ? { externalId: c.externalId } : {}),
  };
  try {
    const res = await fetch(`${BASE}/contacts`, {
      method: "POST",
      headers: { Authorization: env.QUO_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok && res.status !== 201) return { ok: false, error: data?.message || `Quo error ${res.status}` };
    return { ok: true, id: data?.data?.id ?? data?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Create failed" };
  }
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
