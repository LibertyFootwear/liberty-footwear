import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

export async function PUT(req: NextRequest) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { stockNo, size, qty } = await req.json();
  if (!stockNo || !size || typeof qty !== "number") return NextResponse.json({ error: "Invalid" }, { status: 400 });
  await getSupabase().from("inventory").upsert({ stock_no: stockNo, size, qty, updated_at: new Date().toISOString() }, { onConflict: "stock_no,size" });
  return NextResponse.json({ ok: true });
}
