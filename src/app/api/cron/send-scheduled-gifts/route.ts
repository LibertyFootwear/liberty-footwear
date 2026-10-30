import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { listDueGifts, markGiftSent } from "@/lib/giftDeliveryDb";
import { sendGiftRecipientEmail } from "@/lib/orderEmail";
import { publicEnv } from "@/lib/publicEnv";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Hourly cron: deliver scheduled gift cards whose `scheduled_for` has arrived.
 * Idempotent — rows get `sent_at` only after a successful send, so a transient failure retries.
 */
export async function GET(req: NextRequest) {
  if (!env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const due = await listDueGifts(new Date().toISOString());
  let sent = 0; const failed: string[] = [];
  for (const g of due) {
    if (!g.recipientEmail) continue;
    try {
      await sendGiftRecipientEmail({
        to: g.recipientEmail, code: g.code, amount: g.amount,
        recipientName: g.recipientName, fromName: g.fromName ?? g.buyerName, message: g.message,
        baseUrl: publicEnv.NEXT_PUBLIC_BASE_URL,
      });
      await markGiftSent(g.code);
      sent++;
    } catch (err) { console.error("Scheduled gift send failed for", g.code, err); failed.push(g.code); }
  }
  return NextResponse.json({ ok: true, sent, failed: failed.length, due: due.length });
}
