import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  const { status } = await req.json();
  const valid = ["paid", "processing", "shipped", "delivered", "cancelled"];
  if (!valid.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  await getSupabase().from("orders").update({ status }).eq("id", id);
  return NextResponse.json({ ok: true });
}
