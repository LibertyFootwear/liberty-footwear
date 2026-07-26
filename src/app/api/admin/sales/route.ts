import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/adminAuth";
import { tryUpsertCustomer } from "@/lib/customersDb";
import { incrementInventory } from "@/lib/inventoryDb";

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
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // A return (negative total) puts the item back on the shelf — add it to inventory
  // if that SKU + size is tracked (untracked combos are skipped).
  const totalNum = typeof b.total === "number" ? b.total : parseFloat(b.total);
  const isReturn = b.isReturn === true || (Number.isFinite(totalNum) && totalNum < 0);
  if (isReturn && b.size) {
    // Inventory keys boots by "<width> <number>" (e.g. "M 9"); the sales form
    // stores width + size separately, so recombine to match. Non-boot returns
    // have no width and no inventory row, so they're harmlessly skipped.
    const size = b.width ? `${String(b.width).trim()} ${String(b.size).trim()}` : String(b.size).trim();
    await incrementInventory([{
      stockNo: String(b.stockNo).trim(),
      size,
      qty: Math.max(1, parseInt(b.qty) || 1),
    }]);
  }

  return NextResponse.json({ ok: true, id: data?.id });
}

export async function PATCH(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!b.saleDate || !b.stockNo?.trim()) {
    return NextResponse.json({ error: "Date and Stock # are required" }, { status: 400 });
  }
  const customerId = await upsertSaleCustomer(b);
  const { error } = await getSupabase().from("retail_sales").update({
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
  }).eq("id", b.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await getSupabase().from("retail_sales").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
