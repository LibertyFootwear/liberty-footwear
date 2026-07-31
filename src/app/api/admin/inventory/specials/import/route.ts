import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";
import { updateSiteSettings } from "@/lib/siteSettings";
import { bulkUpsertInventory, type ImportRow } from "@/lib/inventoryImport";

/**
 * Bulk-import a counted "specials" (defective/seconds) inventory into its own
 * table. Overwrites only the (stock_no, size) combos in the upload; records the
 * count date + who counted it separately from the regular inventory.
 */
export async function POST(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const body = await req.json().catch(() => null);
  const rows: ImportRow[] = Array.isArray(body?.rows) ? body.rows : [];
  const inventoryDate = typeof body?.inventoryDate === "string" ? body.inventoryDate : "";
  const responsibleBy = typeof body?.responsibleBy === "string" ? body.responsibleBy.trim() : "";

  const { imported, error } = await bulkUpsertInventory("inventory_specials", rows);
  if (error) return NextResponse.json({ error }, { status: imported === 0 ? 400 : 500 });

  try {
    await updateSiteSettings({
      ...(inventoryDate ? { lastSpecialsDate: inventoryDate } : {}),
      ...(responsibleBy ? { lastSpecialsBy: responsibleBy } : {}),
    });
  } catch (err) {
    console.error("Saved specials but failed to record count metadata:", err);
  }

  return NextResponse.json({ ok: true, imported });
}
