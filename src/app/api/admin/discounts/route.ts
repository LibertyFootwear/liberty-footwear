import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/adminAuth";
import { normalizeCode } from "@/lib/discounts";

/** Build a discount_codes row from the admin payload. */
function toRow(b: Record<string, unknown>) {
  const code = normalizeCode(b.code as string);
  const pct = b.percentOff != null && String(b.percentOff).trim() !== "" ? parseInt(String(b.percentOff), 10) : null;
  const amt = b.amountOff != null && String(b.amountOff).trim() !== "" ? parseFloat(String(b.amountOff)) : null;
  return {
    code,
    percent_off: pct && Number.isFinite(pct) ? pct : null,
    amount_off: amt && Number.isFinite(amt) ? amt : null,
    user_id: b.userId ? String(b.userId) : null,
    max_uses: b.maxUses != null && String(b.maxUses).trim() !== "" ? parseInt(String(b.maxUses), 10) : null,
    active: b.active === false ? false : true,
    note: b.note ? String(b.note).trim() : null,
  };
}

export async function POST(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const b = await req.json();
  const row = toRow(b);
  if (!row.code) return NextResponse.json({ error: "Code is required" }, { status: 400 });
  if (row.percent_off == null && row.amount_off == null) {
    return NextResponse.json({ error: "Set a percent-off or a dollar amount" }, { status: 400 });
  }
  if (row.percent_off != null && (row.percent_off < 1 || row.percent_off > 100)) {
    return NextResponse.json({ error: "Percent must be 1–100" }, { status: 400 });
  }
  const { error } = await getSupabase().from("discount_codes").insert(row);
  if (error) {
    const msg = /duplicate|unique/i.test(error.message) ? "That code already exists" : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  // Partial update — only `active` toggling is exposed from the UI, but accept the full row too.
  const patch: Record<string, unknown> = {};
  if (typeof b.active === "boolean") patch.active = b.active;
  if (b.note !== undefined) patch.note = b.note ? String(b.note).trim() : null;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  const { error } = await getSupabase().from("discount_codes").update(patch).eq("id", b.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { error } = await getSupabase().from("discount_codes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
