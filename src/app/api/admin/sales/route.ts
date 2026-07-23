import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const b = await req.json();
  if (!b.saleDate || !b.stockNo?.trim()) {
    return NextResponse.json({ error: "Date and Stock # are required" }, { status: 400 });
  }
  const { data, error } = await getSupabase().from("retail_sales").insert({
    sale_date: b.saleDate,
    stock_no: String(b.stockNo).trim(),
    size: b.size ? String(b.size).trim() : null,
    width: b.width ? String(b.width).trim() : null,
    paid: b.paid === false ? false : true,
    total: typeof b.total === "number" ? b.total : (parseFloat(b.total) || null),
    payment: b.payment ? String(b.payment).trim() : null,
    customer_name: b.customerName ? String(b.customerName).trim() : null,
    phone: b.phone ? String(b.phone).trim() : null,
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data?.id });
}

export async function DELETE(req: NextRequest) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await getSupabase().from("retail_sales").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
