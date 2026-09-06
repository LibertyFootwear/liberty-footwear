import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { env } from "@/lib/env";
import { sendAndLogSms, quoEnabled } from "@/lib/quo";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** YYYY-MM-DD, N days before today. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function reviewText(firstName?: string | null): string {
  const link = env.NEXT_PUBLIC_REVIEW_URL || env.NEXT_PUBLIC_BASE_URL;
  const who = firstName ? `, ${firstName}` : "";
  return `Thanks for choosing Liberty Footwear${who}! If you have a minute, we'd really appreciate a quick review: ${link}`;
}

/**
 * Daily: text customers a review request a few days after pickup. Idempotent via
 * review_sms_at; only fires within a trailing window so a first run doesn't blast
 * old history. Secured by CRON_SECRET (Vercel Cron sends it as a Bearer token).
 */
export async function GET(req: NextRequest) {
  if (!env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!quoEnabled) return NextResponse.json({ ok: true, skipped: "Quo not configured" });

  const delay = Math.max(0, parseInt(env.REVIEW_SMS_DELAY_DAYS || "3", 10) || 3);
  const upper = daysAgo(delay);        // picked up at least `delay` days ago
  const lower = daysAgo(delay + 14);   // …but within the last 2 weeks (don't spam old pickups)
  const sb = getSupabase();

  let sent = 0;
  const CAP = 100;

  for (const table of ["repairs", "open_orders"] as const) {
    if (sent >= CAP) break;
    const { data } = await sb
      .from(table)
      .select("id, first_name, contact, picked_up_date, review_sms_at")
      .not("picked_up_date", "is", null)
      .lte("picked_up_date", upper)
      .gte("picked_up_date", lower)
      .is("review_sms_at", null)
      .not("contact", "is", null)
      .limit(CAP - sent);

    for (const r of data ?? []) {
      const res = await sendAndLogSms(r.contact as string, reviewText(r.first_name as string));
      // Mark as handled either way so a persistently bad number isn't retried daily.
      await sb.from(table).update({ review_sms_at: new Date().toISOString() }).eq("id", r.id);
      if (res.ok) sent++;
      await new Promise((x) => setTimeout(x, 120)); // rate limit
    }
  }

  return NextResponse.json({ ok: true, sent, window: { from: lower, to: upper } });
}
