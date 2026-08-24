import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/adminAuth";
import { reconcileWorkSale } from "@/lib/bookSale";

/** Map the client payload (camelCase) to the open_orders row (snake_case). */
function toRow(b: Record<string, unknown>) {
  const s = (v: unknown) => (v != null && String(v).trim() !== "" ? String(v).trim() : null);
  const d = (v: unknown) => s(v); // dates arrive as YYYY-MM-DD strings; empty → null
  const n = (v: unknown) => {
    if (v == null || String(v).trim() === "") return null;
    const x = parseFloat(String(v));
    return Number.isFinite(x) ? x : null;
  };
  return {
    ordered_date: d(b.orderedDate),
    promised: s(b.promised),
    complete_date: d(b.completeDate),
    picked_up_date: d(b.pickedUpDate),
    price_quote: n(b.priceQuote),
    paid: b.paid === true,
    stock_no: s(b.stockNo),
    size: s(b.size),
    width: s(b.width),
    first_name: s(b.firstName),
    last_name: s(b.lastName),
    contact: s(b.contact),
    details: s(b.details),
    contact_notes: s(b.contactNotes),
  };
}

export async function POST(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const b = await req.json();
  const row = toRow(b);
  if (!row.first_name && !row.last_name && !row.stock_no) {
    return NextResponse.json({ error: "Add at least a customer name or a stock #" }, { status: 400 });
  }
  const { data, error } = await getSupabase().from("open_orders").insert(row).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data?.paid) await reconcileWorkSale("open_order", "open_orders", data); // prepaid at intake
  return NextResponse.json({ ok: true, id: data?.id });
}

export async function PATCH(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { data, error } = await getSupabase().from("open_orders").update(toRow(b)).eq("id", b.id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await reconcileWorkSale("open_order", "open_orders", data); // Paid flip → Retail Sales row
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { error } = await getSupabase().from("open_orders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
