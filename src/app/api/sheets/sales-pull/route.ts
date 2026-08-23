import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { env } from "@/lib/env";

/**
 * Google Sheet → admin write-back. Called by the RetailSales tab's installable
 * onEdit trigger (see scripts/google-apps-script.gs). Authenticated by the shared
 * SHEETS_WEBHOOK_SECRET, not an admin cookie. Upserts a single row into
 * retail_sales, keyed by id; a new (id-less) row is inserted and its id returned
 * so the sheet can write it back into column A.
 *
 * Note: this path intentionally does NOT mirror back to the Sheet — the row is
 * already what the user typed there, and re-writing it could clobber their edit.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { secret?: string; row?: Record<string, unknown> };

  if (!env.SHEETS_WEBHOOK_SECRET || body.secret !== env.SHEETS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const row = body.row ?? {};

  const str = (v: unknown) => {
    const s = v == null ? "" : String(v).trim();
    return s === "" ? null : s;
  };
  const toDate = (v: unknown): string | null => {
    const s = v == null ? "" : String(v).trim();
    if (!s) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  };
  const toBool = (v: unknown): boolean => {
    const s = String(v ?? "").trim().toLowerCase();
    if (s === "") return true;
    return !["no", "false", "0", "unpaid", "n"].includes(s);
  };
  const toNum = (v: unknown): number | null => {
    if (v == null || String(v).trim() === "") return null;
    const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? null : n;
  };

  const sale_date = toDate(row.sale_date);
  const stock_no = str(row.stock_no);
  if (!sale_date || !stock_no) {
    return NextResponse.json({ error: "Row needs a valid date and stock #." }, { status: 400 });
  }

  const fields = {
    sale_date,
    stock_no,
    size: str(row.size),
    width: str(row.width),
    qty: Math.max(1, parseInt(String(row.qty ?? "")) || 1),
    paid: toBool(row.paid),
    total: toNum(row.total),
    payment: str(row.payment),
    customer_name: str(row.customer_name),
    phone: str(row.phone),
    customer_email: str(row.customer_email),
    customer_address: str(row.customer_address),
    customer_employer: str(row.customer_employer),
    referral_source: str(row.referral_source),
    notes: str(row.notes),
  };

  const sb = getSupabase();
  const id = str(row.id);

  if (id) {
    const { data, error } = await sb.from("retail_sales").update(fields).eq("id", id).select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // If the id wasn't found (deleted?), fall through to insert a fresh row.
    if (data && data.length > 0) return NextResponse.json({ ok: true, id });
  }

  const { data, error } = await sb.from("retail_sales").insert(fields).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data?.id, inserted: true });
}
