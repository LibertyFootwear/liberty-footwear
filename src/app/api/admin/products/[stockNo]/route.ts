import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/adminAuth";
import { products as baseProducts } from "@/data/products";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ stockNo: string }> }) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { stockNo } = await params;
  if (!baseProducts.some((p) => p.stockNo === stockNo)) {
    return NextResponse.json({ error: "Unknown product" }, { status: 404 });
  }
  const body = await req.json();
  const { error } = await getSupabase().from("product_overrides").upsert({
    stock_no: stockNo,
    price: typeof body.price === "number" ? body.price : null,
    description: body.description ?? null,
    short_description: body.shortDescription || null,
    is_new: typeof body.isNew === "boolean" ? body.isNew : null,
    popular: typeof body.popular === "boolean" ? body.popular : null,
    hidden: typeof body.hidden === "boolean" ? body.hidden : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "stock_no" });
  if (error) {
    return NextResponse.json({ error: `Database save failed: ${error.message}` }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ stockNo: string }> }) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { stockNo } = await params;
  const { error } = await getSupabase().from("product_overrides").delete().eq("stock_no", stockNo);
  if (error) {
    return NextResponse.json({ error: `Database reset failed: ${error.message}` }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
