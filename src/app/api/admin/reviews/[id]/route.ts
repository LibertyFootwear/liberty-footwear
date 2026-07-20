import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { setReviewApproval, deleteReview } from "@/lib/reviewsDb";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  const { approved } = await req.json();
  if (typeof approved !== "boolean") return NextResponse.json({ error: "Invalid" }, { status: 400 });
  await setReviewApproval(id, approved);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  await deleteReview(id);
  return NextResponse.json({ ok: true });
}
