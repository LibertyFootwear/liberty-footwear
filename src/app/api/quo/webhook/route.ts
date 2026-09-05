import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { verifyQuoWebhook, matchCustomerByPhone, normalizePhone } from "@/lib/quo";

// Signature verification needs the exact raw body, so keep the Node runtime and
// read the body as text (never parse before verifying).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Json = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v : undefined);
const num = (v: unknown) => (typeof v === "number" ? v : undefined);

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyQuoWebhook(raw, req.headers)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: Json;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  const type = String(body.type ?? "");
  const data = (body.data ?? {}) as Json;
  const resource = (data.resource ?? {}) as Json;
  const context = (data.context ?? {}) as Json;

  const isCall = type.startsWith("call");
  const isMessage = type.startsWith("message");
  if (!isCall && !isMessage) return NextResponse.json({ ok: true }); // ignore contact/task events

  const direction = str(resource.direction); // incoming | outgoing
  const incoming = direction !== "outgoing";

  // Locate the external (customer) number + our workspace number.
  let customerPhone: string | undefined;
  let ourNumber: string | undefined;
  if (isMessage) {
    const sender = str(context.senderIdentifier);
    const recipients = Array.isArray(context.recipientIdentifiers) ? (context.recipientIdentifiers as string[]) : [];
    customerPhone = incoming ? sender : recipients[0];
    ourNumber = incoming ? recipients[0] : sender;
  } else {
    const participants = (context.participants ?? {}) as Json;
    const external = Array.isArray(participants.external) ? (participants.external as string[]) : [];
    const workspace = Array.isArray(participants.workspace) ? (participants.workspace as string[]) : [];
    customerPhone = external[0];
    ourNumber = workspace[0];
  }

  const recordings = Array.isArray(resource.recordings) ? (resource.recordings as Json[]) : [];
  const recordingUrl = str(recordings[0]?.url);

  // Recording/transcript events reference the call via callId — merge into the
  // same row as the call itself so the recording lands on the call log entry.
  const quoId = str(resource.callId) ?? str(resource.id);
  if (!quoId) return NextResponse.json({ ok: true });

  const customerId = await matchCustomerByPhone(customerPhone);

  // Build only the fields this event carries, so later events don't null earlier data.
  const row: Json = { quo_id: quoId, type: isCall ? (type.includes("voicemail") ? "voicemail" : "call") : "sms" };
  if (direction) row.direction = direction;
  if (str(resource.status)) row.status = str(resource.status);
  if (customerPhone) { row.customer_phone = customerPhone; row.customer_phone_norm = normalizePhone(customerPhone) ?? null; }
  if (ourNumber) row.our_number = ourNumber;
  if (str(resource.text)) row.content = str(resource.text);
  if (str(resource.summary)) row.content = str(resource.summary);
  if (num(resource.duration) !== undefined) row.duration = num(resource.duration);
  if (recordingUrl) row.recording_url = recordingUrl;
  if (customerId) row.customer_id = customerId;
  const occurred = str(resource.completedAt) ?? str(resource.createdAt);
  if (occurred) row.occurred_at = occurred;

  const { error } = await getSupabase().from("communications").upsert(row, { onConflict: "quo_id" });
  if (error) { console.error("Quo webhook upsert failed:", error.message); return NextResponse.json({ error: "DB" }, { status: 500 }); }

  return NextResponse.json({ ok: true });
}
