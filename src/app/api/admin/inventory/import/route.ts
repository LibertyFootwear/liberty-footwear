import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/adminAuth";
import { updateSiteSettings } from "@/lib/siteSettings";

interface ImportRow { stockNo: string; size: string; qty: number }

/**
 * Bulk-import a counted finished-boot inventory. Overwrites only the (stock_no,
 * size) combinations present in the upload — sizes not listed are left untouched.
 * Also records who counted it and when.
 */
export async function POST(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const body = await req.json().catch(() => null);
  const rows: ImportRow[] = Array.isArray(body?.rows) ? body.rows : [];
  const inventoryDate = typeof body?.inventoryDate === "string" ? body.inventoryDate : "";
  const responsibleBy = typeof body?.responsibleBy === "string" ? body.responsibleBy.trim() : "";

  const clean = rows
    .map((r) => ({
      stock_no: String(r.stockNo ?? "").trim(),
      size: String(r.size ?? "").trim(),
      qty: Math.max(0, Math.round(Number(r.qty))),
      updated_at: new Date().toISOString(),
    }))
    .filter((r) => r.stock_no && r.size && Number.isFinite(r.qty));

  if (clean.length === 0) return NextResponse.json({ error: "No valid rows to import" }, { status: 400 });

  const sb = getSupabase();
  // Upsert in chunks to stay well under any payload limits.
  const CHUNK = 500;
  for (let i = 0; i < clean.length; i += CHUNK) {
    const { error } = await sb.from("inventory").upsert(clean.slice(i, i + CHUNK), { onConflict: "stock_no,size" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Record the count metadata (best-effort — the import itself already succeeded).
  try {
    await updateSiteSettings({
      ...(inventoryDate ? { lastInventoryDate: inventoryDate } : {}),
      ...(responsibleBy ? { lastInventoryBy: responsibleBy } : {}),
    });
  } catch (err) {
    console.error("Saved inventory but failed to record count metadata:", err);
  }

  return NextResponse.json({ ok: true, imported: clean.length });
}
