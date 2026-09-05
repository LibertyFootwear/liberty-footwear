import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/adminAuth";
import { sendSms, matchCustomerByPhone, normalizePhone, quoEnabled } from "@/lib/quo";

/** Send an SMS from the admin (click-to-text) and log it to the communications log. */
export async function POST(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  if (!quoEnabled) return NextResponse.json({ error: "Quo is not configured yet." }, { status: 400 });

  const b = await req.json();
  const to = String(b.to ?? "").trim();
  const content = String(b.content ?? "").trim();
  if (!to) return NextResponse.json({ error: "Recipient number required" }, { status: 400 });
  if (!content) return NextResponse.json({ error: "Message is empty" }, { status: 400 });

  const result = await sendSms(to, content);
  if (!result.ok) return NextResponse.json({ error: result.error ?? "Send failed" }, { status: 502 });

  // Log the outgoing message (webhook delivery events will fill in status later).
  const customerId = b.customerId ? String(b.customerId) : await matchCustomerByPhone(to);
  await getSupabase().from("communications").upsert({
    quo_id: result.id ?? `out-${crypto.randomUUID()}`,
    type: "sms",
    direction: "outgoing",
    status: "sent",
    customer_phone: to,
    customer_phone_norm: normalizePhone(to) ?? null,
    content,
    customer_id: customerId,
    occurred_at: new Date().toISOString(),
  }, { onConflict: "quo_id" });

  return NextResponse.json({ ok: true });
}
