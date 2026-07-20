import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

export async function PUT(req: NextRequest) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { sku, width, size, val } = await req.json();
  if (!sku || !width || !size || typeof val !== "string") {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  await getSupabase().from("uppers_inventory").upsert(
    { sku, width, size, val: val.trim(), updated_at: new Date().toISOString() },
    { onConflict: "sku,width,size" }
  );
  return NextResponse.json({ ok: true });
}
