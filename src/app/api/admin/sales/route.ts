import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const b = await req.json();
  if (!b.saleDate || !b.stockNo?.trim()) {
    return NextResponse.json({ error: "Date and Stock # are required" }, { status: 400 });
  }
  const { data, error } = await getSupabase().from("retail_sales").insert({
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
  return NextResponse.json({ ok: true, id: data?.id });
}

export async function PATCH(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!b.saleDate || !b.stockNo?.trim()) {
    return NextResponse.json({ error: "Date and Stock # are required" }, { status: 400 });
  }
  const { error } = await getSupabase().from("retail_sales").update({
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
