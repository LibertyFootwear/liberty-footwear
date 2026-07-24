import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = {};

  if (body.status !== undefined) {
    const valid = ["paid", "processing", "shipped", "delivered", "cancelled"];
    if (!valid.includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    update.status = body.status;
  }
  if (body.carrier !== undefined) update.carrier = String(body.carrier).trim() || null;
  if (body.trackingNumber !== undefined) update.tracking_number = String(body.trackingNumber).trim() || null;

  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  await getSupabase().from("orders").update(update).eq("id", id);
  return NextResponse.json({ ok: true });
}
