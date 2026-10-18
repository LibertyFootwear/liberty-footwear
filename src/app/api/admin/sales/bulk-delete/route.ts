import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { deleteRowFromSheet } from "@/lib/sheetsSync";
import { stockLine, isReturnRow, applyStock } from "@/lib/retailSalesStock";

export const maxDuration = 60;

/**
 * Delete retail_sales rows in a sale_date range. Two-phase: `confirm:false` returns the count
 * (for the admin's confirmation dialog); `confirm:true` deletes, reverses stock for each row and
 * mirrors the deletion into the Google Sheet backup.
 */
export async function POST(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { from, to, confirm } = await req.json().catch(() => ({})) as { from?: string; to?: string; confirm?: boolean };

  const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (!from && !to) return NextResponse.json({ error: "Pick a date range." }, { status: 400 });
  if (from && !isDate(from)) return NextResponse.json({ error: "Invalid 'from' date." }, { status: 400 });
  if (to && !isDate(to)) return NextResponse.json({ error: "Invalid 'to' date." }, { status: 400 });

  const sb = getSupabase();
  let q = sb.from("retail_sales").select("id, stock_no, size, width, qty, total", { count: "exact" });
  if (from) q = q.gte("sale_date", from);
  if (to) q = q.lte("sale_date", to);

  if (!confirm) {
    const { count, error } = await q.limit(1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ count: count ?? 0 });
  }

  // Safety ceiling — delete at most 20 000 rows per call (plenty for any cleanup).
  const { data, error } = await q.limit(20000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = data ?? [];
  if (rows.length === 0) return NextResponse.json({ ok: true, deleted: 0 });

  const ids = rows.map((r) => r.id as string);
  const { error: delErr } = await sb.from("retail_sales").delete().in("id", ids);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  // Reverse the stock effect of each deleted row (sale → put back, return → take back out).
  for (const r of rows) {
    await applyStock(stockLine(r.stock_no, r.size, r.width, r.qty), !isReturnRow(r.total));
  }
  // Mirror into the Google Sheet (best-effort, in parallel).
  await Promise.allSettled(ids.map((id) => deleteRowFromSheet(id)));

  return NextResponse.json({ ok: true, deleted: rows.length });
}
