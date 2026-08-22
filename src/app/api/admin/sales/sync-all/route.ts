import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/adminAuth";
import { syncBatchToSheet } from "@/lib/sheetsSync";
import { env } from "@/lib/env";

export const maxDuration = 60;

/** One-time backfill: push every retail_sales row into the Google Sheet mirror. */
export async function POST() {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  if (!env.SHEETS_WEBHOOK_URL) {
    return NextResponse.json({ error: "Google Sheet is not connected (SHEETS_WEBHOOK_URL is not set)." }, { status: 400 });
  }

  const sb = getSupabase();
  const rows: Record<string, unknown>[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb.from("retail_sales").select("*").range(from, from + PAGE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
  }

  // Send in chunks so no single webhook payload gets too large.
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await syncBatchToSheet(rows.slice(i, i + CHUNK));
  }

  return NextResponse.json({ ok: true, synced: rows.length });
}
