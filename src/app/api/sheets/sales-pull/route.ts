import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { env } from "@/lib/env";
import { tryUpsertCustomer } from "@/lib/customersDb";
import { stockLine, isReturnRow, applyStock } from "@/lib/retailSalesStock";

/**
 * Google Sheet → admin write-back. Called by the RetailSales tab's installable
 * onEdit trigger (see scripts/google-apps-script.gs). Authenticated by the shared
 * SHEETS_WEBHOOK_SECRET, not an admin cookie.
 *
 * Bodies:
 *  - { row }   / { rows }  upsert by id (id-less row = insert, id returned so the sheet can store it)
 *  - { action: "delete", ids } delete rows (stock effect reversed)
 *
 * Mirrors what /api/admin/sales does: links the customer registry and reconciles
 * inventory. It intentionally does NOT mirror back to the Sheet — that would
 * clobber the user's in-progress edit.
 */

const MAX_DELETE = 25;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = Record<string, unknown>;
type Result = { id?: string; inserted?: boolean; error?: string };

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
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "") return true;
  return !["no", "false", "0", "unpaid", "n"].includes(s);
};
const toNum = (v: unknown): number | null => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (v == null || String(v).trim() === "") return null;
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? null : n;
};

async function saveRow(row: Row): Promise<Result> {
  const sale_date = toDate(row.sale_date);
  const stock_no = str(row.stock_no);
  if (!sale_date || !stock_no) return { error: "Row needs a valid date and stock #." };

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

  const customer_id =
    fields.customer_name || fields.phone || fields.customer_email
      ? (await tryUpsertCustomer({
          name: fields.customer_name ?? undefined,
          phone: fields.phone ?? undefined,
          email: fields.customer_email ?? undefined,
          employer: fields.customer_employer ?? undefined,
          referralSource: fields.referral_source ?? undefined,
          source: "store",
          purchaseAt: new Date(sale_date + "T12:00:00").toISOString(),
        })) ?? null
      : null;

  const sb = getSupabase();
  const id = str(row.id);

  if (id) {
    const { data: old } = await sb.from("retail_sales")
      .select("stock_no, size, width, qty, total").eq("id", id).maybeSingle();
    if (old) {
      const { error } = await sb.from("retail_sales").update({ ...fields, customer_id }).eq("id", id);
      if (error) return { error: error.message };
      // Reverse the old row's stock effect, apply the edited row's (net zero if unchanged).
      await applyStock(stockLine(old.stock_no, old.size, old.width, old.qty), !isReturnRow(old.total));
      await applyStock(stockLine(fields.stock_no, fields.size, fields.width, fields.qty), isReturnRow(fields.total));
      return { id };
    }
    // Unknown id (deleted in admin?) → fall through and insert as a fresh row.
  }

  // Keep the Sheet's UUID on insert so a bulk re-sync (e.g. after admin was emptied) stays idempotent.
  const insertRow = id && UUID.test(id) ? { id, ...fields, customer_id } : { ...fields, customer_id };
  const { data, error } = await sb.from("retail_sales").insert(insertRow).select("id").single();
  if (error) return { error: error.message };
  await applyStock(stockLine(fields.stock_no, fields.size, fields.width, fields.qty), isReturnRow(fields.total));
  return { id: data?.id, inserted: true };
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    secret?: string; action?: string; ids?: unknown[]; row?: Row; rows?: Row[];
  };

  if (!env.SHEETS_WEBHOOK_SECRET || body.secret !== env.SHEETS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Connection test from the Sheet menu (Liberty → Test connection): auth passed = secret matches.
  if (body.action === "ping") return NextResponse.json({ ok: true, ping: true });

  if (body.action === "delete") {
    if ((body.ids ?? []).length > MAX_DELETE) {
      return NextResponse.json({ error: `Refusing to delete more than ${MAX_DELETE} rows at once.` }, { status: 400 });
    }
    const sb = getSupabase();
    let deleted = 0;
    for (const id of (body.ids ?? []).map(String).filter(Boolean)) {
      const { data: old } = await sb.from("retail_sales")
        .select("stock_no, size, width, qty, total").eq("id", id).maybeSingle();
      if (!old) continue;
      const { error } = await sb.from("retail_sales").delete().eq("id", id);
      if (error) continue;
      await applyStock(stockLine(old.stock_no, old.size, old.width, old.qty), !isReturnRow(old.total));
      deleted++;
    }
    return NextResponse.json({ ok: true, deleted });
  }

  if (Array.isArray(body.rows)) {
    const results: Result[] = [];
    for (const r of body.rows) results.push(await saveRow(r));
    return NextResponse.json({ ok: true, results });
  }

  const r = await saveRow(body.row ?? {});
  if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true, ...r });
}
