import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/adminAuth";
import { tryUpsertCustomer } from "@/lib/customersDb";
import { incrementInventory, decrementInventory } from "@/lib/inventoryDb";
import { syncRowToSheet, deleteRowFromSheet } from "@/lib/sheetsSync";

/** Register the sale's customer in the unified registry (deduped by email/phone). */
async function upsertSaleCustomer(b: Record<string, unknown>): Promise<string | undefined> {
  const name = b.customerName ? String(b.customerName).trim() : undefined;
  const phone = b.phone ? String(b.phone).trim() : undefined;
  const email = b.customerEmail ? String(b.customerEmail).trim() : undefined;
  if (!name && !phone && !email) return undefined;
  return tryUpsertCustomer({
    name,
    phone,
    email,
    employer: b.customerEmployer ? String(b.customerEmployer).trim() : undefined,
    referralSource: b.referralSource ? String(b.referralSource).trim() : undefined,
    source: "store",
    purchaseAt: b.saleDate ? new Date(String(b.saleDate) + "T12:00:00").toISOString() : undefined,
  });
}

interface StockLine { stockNo: string; size: string; qty: number }

/**
 * Build an inventory line from a sale's fields. Inventory keys boots by
 * "<width> <number>" (e.g. "M 9"), but the sales form stores width + size
 * separately, so recombine to match. Returns null when there's nothing to
 * adjust (no item or no size) — inc/decrementInventory also skip untracked
 * SKU/size combos, so non-boot rows are harmlessly no-ops.
 */
function stockLine(stockNo?: unknown, size?: unknown, width?: unknown, qty?: unknown): StockLine | null {
  const sku = stockNo ? String(stockNo).trim() : "";
  const sz = size ? String(size).trim() : "";
  if (!sku || !sz) return null;
  const w = width ? String(width).trim() : "";
  return { stockNo: sku, size: w ? `${w} ${sz}` : sz, qty: Math.max(1, parseInt(String(qty)) || 1) };
}

/** True when a row represents a return (negative total, or an explicit flag). */
function isReturnRow(total: unknown, flag?: unknown): boolean {
  const n = typeof total === "number" ? total : parseFloat(String(total));
  return flag === true || (Number.isFinite(n) && n < 0);
}

/** A sale takes a boot off the shelf; a return puts it back. No-op for null/untracked lines. */
async function applyStock(line: StockLine | null, isReturn: boolean): Promise<void> {
  if (!line) return;
  if (isReturn) await incrementInventory([line]);
  else await decrementInventory([line]);
}

export async function POST(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const b = await req.json();
  if (!b.saleDate || !b.stockNo?.trim()) {
    return NextResponse.json({ error: "Date and Stock # are required" }, { status: 400 });
  }
  const customerId = await upsertSaleCustomer(b);
  const { data, error } = await getSupabase().from("retail_sales").insert({
    customer_id: customerId ?? null,
    sale_date: b.saleDate,
    stock_no: String(b.stockNo).trim(),
    size: b.size ? String(b.size).trim() : null,
    width: b.width ? String(b.width).trim() : null,
    qty: Math.max(1, parseInt(b.qty) || 1),
    paid: b.paid === false ? false : true,
    total: typeof b.total === "number" ? b.total : (parseFloat(b.total) || null),
    payment: b.payment ? String(b.payment).trim() : null,
    customer_name: b.customerName ? String(b.customerName).trim() : null,
    phone: b.phone ? String(b.phone).trim() : null,
    customer_email: b.customerEmail ? String(b.customerEmail).trim() : null,
    customer_address: b.customerAddress ? String(b.customerAddress).trim() : null,
    customer_employer: b.customerEmployer ? String(b.customerEmployer).trim() : null,
    referral_source: b.referralSource ? String(b.referralSource).trim() : null,
    notes: b.notes ? String(b.notes).trim() : null,
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await applyStock(stockLine(b.stockNo, b.size, b.width, b.qty), isReturnRow(b.total, b.isReturn));
  if (data) await syncRowToSheet(data); // mirror the new row into the Google Sheet backup

  return NextResponse.json({ ok: true, id: data?.id });
}

export async function PATCH(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!b.saleDate || !b.stockNo?.trim()) {
    return NextResponse.json({ error: "Date and Stock # are required" }, { status: 400 });
  }
  const sb = getSupabase();

  // Read the pre-edit row so we can undo its old inventory effect before applying the new one.
  const { data: old } = await sb.from("retail_sales")
    .select("stock_no, size, width, qty, total").eq("id", b.id).maybeSingle();

  const customerId = await upsertSaleCustomer(b);
  const { data: updated, error } = await sb.from("retail_sales").update({
    customer_id: customerId ?? null,
    sale_date: b.saleDate,
    stock_no: String(b.stockNo).trim(),
    size: b.size ? String(b.size).trim() : null,
    width: b.width ? String(b.width).trim() : null,
    qty: Math.max(1, parseInt(b.qty) || 1),
    paid: b.paid === false ? false : true,
    total: typeof b.total === "number" ? b.total : (parseFloat(b.total) || null),
    payment: b.payment ? String(b.payment).trim() : null,
    customer_name: b.customerName ? String(b.customerName).trim() : null,
    phone: b.phone ? String(b.phone).trim() : null,
    customer_email: b.customerEmail ? String(b.customerEmail).trim() : null,
    customer_address: b.customerAddress ? String(b.customerAddress).trim() : null,
    customer_employer: b.customerEmployer ? String(b.customerEmployer).trim() : null,
    referral_source: b.referralSource ? String(b.referralSource).trim() : null,
    notes: b.notes ? String(b.notes).trim() : null,
  }).eq("id", b.id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Reconcile stock: reverse the old row's effect, then apply the edited row's.
  // (If item/size/qty/type are unchanged these cancel out to a net zero change.)
  if (old) await applyStock(stockLine(old.stock_no, old.size, old.width, old.qty), !isReturnRow(old.total));
  await applyStock(stockLine(b.stockNo, b.size, b.width, b.qty), isReturnRow(b.total, b.isReturn));
  if (updated) await syncRowToSheet(updated); // mirror the edit into the Google Sheet backup

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const sb = getSupabase();

  // Read the row first so deleting it can undo its inventory effect.
  const { data: old } = await sb.from("retail_sales")
    .select("stock_no, size, width, qty, total").eq("id", id).maybeSingle();

  const { error } = await sb.from("retail_sales").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Reverse the deleted row's stock effect: a sale returns to stock, a return leaves it.
  if (old) await applyStock(stockLine(old.stock_no, old.size, old.width, old.qty), !isReturnRow(old.total));
  await deleteRowFromSheet(id); // remove the row from the Google Sheet backup

  return NextResponse.json({ ok: true });
}
