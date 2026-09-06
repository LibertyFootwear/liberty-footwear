import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";
import { sendAndLogSms, quoEnabled } from "@/lib/quo";

/** Send an SMS from the admin (click-to-text) and log it to the communications log. */
export async function POST(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  if (!quoEnabled) return NextResponse.json({ error: "Quo is not configured yet." }, { status: 400 });

  const b = await req.json();
  const to = String(b.to ?? "").trim();
  const content = String(b.content ?? "").trim();
  if (!to) return NextResponse.json({ error: "Recipient number required" }, { status: 400 });
  if (!content) return NextResponse.json({ error: "Message is empty" }, { status: 400 });

  const result = await sendAndLogSms(to, content, b.customerId ? String(b.customerId) : undefined);
  if (!result.ok) return NextResponse.json({ error: result.error ?? "Send failed" }, { status: 502 });

  return NextResponse.json({ ok: true });
}
