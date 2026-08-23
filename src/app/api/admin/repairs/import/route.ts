import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/adminAuth";
import { parseDue } from "@/lib/queue";

/**
 * Bulk-import the "Repairs & Resoles" sheet (CSV rows, incl. header row).
 * Columns are matched by header name so column order can vary:
 *   Ordered, Promised, Complete, Picked Up, Price Quoted, Paid,
 *   Job description, Tag No., First Name, Last Name, Contact, Details, Contact Notes
 */

const num = (v: string | undefined) => {
  if (!v) return null;
  const x = parseFloat(v.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(x) ? x : null;
};
const isoDate = (v: string | undefined) => (v ? parseDue(v).date : null);
const txt = (v: string | undefined) => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

export async function POST(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { rows } = (await req.json()) as { rows: string[][] };
  if (!Array.isArray(rows) || rows.length < 2) {
    return NextResponse.json({ error: "No data rows." }, { status: 400 });
  }

  // Header → column index (lowercased, trimmed).
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => {
    for (const n of names) {
      const i = header.findIndex((h) => h === n || h.includes(n));
      if (i !== -1) return i;
    }
    return -1;
  };
  const idx = {
    ordered:   col("ordered"),
    promised:  col("promised"),
    complete:  col("complete"),
    pickedUp:  col("picked up", "picked"),
    price:     col("price"),
    paid:      col("paid"),
    job:       col("job"),
    tag:       col("tag"),
    first:     col("first name", "first"),
    last:      col("last name", "last"),
    contact:   col("contact notes") === col("contact") ? -1 : col("contact"),
    details:   col("details"),
    notes:     col("contact notes", "notes"),
  };
  const at = (r: string[], i: number) => (i >= 0 ? r[i] : undefined);

  const toInsert = rows.slice(1).map((r) => {
    const promisedRaw = txt(at(r, idx.promised));
    return {
      ordered_date:   isoDate(at(r, idx.ordered)),
      // keep the promised value verbatim (it sometimes carries notes); the queue parser handles it
      promised:       promisedRaw,
      complete_date:  isoDate(at(r, idx.complete)),
      picked_up_date: isoDate(at(r, idx.pickedUp)),
      price_quote:    num(at(r, idx.price)),
      paid:           /^true$/i.test((at(r, idx.paid) ?? "").trim()),
      job:            txt(at(r, idx.job)),
      tag_no:         txt(at(r, idx.tag)),
      first_name:     txt(at(r, idx.first)),
      last_name:      txt(at(r, idx.last)),
      contact:        txt(at(r, idx.contact)),
      details:        txt(at(r, idx.details)),
      contact_notes:  txt(at(r, idx.notes)),
    };
  });

  // Drop rows with no identifying content (blank spacer rows in the sheet).
  const cleaned = toInsert.filter(
    (r) => r.first_name || r.last_name || r.tag_no || r.details || r.job || r.ordered_date
  );
  const skipped = toInsert.length - cleaned.length;

  if (cleaned.length === 0) {
    return NextResponse.json({ ok: true, imported: 0, skipped });
  }

  const { error } = await getSupabase().from("repairs").insert(cleaned);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, imported: cleaned.length, skipped });
}
