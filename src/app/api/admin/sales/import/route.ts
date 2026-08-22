import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/adminAuth";
import { syncBatchToSheet } from "@/lib/sheetsSync";

export const maxDuration = 60;

/** Field → accepted header aliases (lowercased, non-alphanumerics stripped). */
const ALIASES: Record<string, string[]> = {
  sale_date:        ["date", "saledate", "sold", "solddate", "day"],
  stock_no:         ["stock", "stockno", "stock#", "style", "styleno", "sku", "item", "itemno", "model"],
  size:             ["size"],
  width:            ["width"],
  qty:              ["qty", "quantity", "pairs", "units"],
  paid:             ["paid"],
  total:            ["total", "price", "amount", "sale", "saleprice", "sellingprice"],
  payment:          ["payment", "pay", "paymentmethod", "method", "tender"],
  customer_name:    ["customer", "customername", "name", "buyer"],
  phone:            ["phone", "tel", "telephone", "phonenumber", "cell"],
  customer_email:   ["email", "customeremail", "mail"],
  customer_address: ["address", "customeraddress"],
  customer_employer:["employer", "company", "customeremployer"],
  referral_source:  ["referral", "referralsource", "source", "howdidyouhear", "how"],
  notes:            ["notes", "note", "comment", "comments", "remarks"],
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9#]/g, "");

/** Build header-index → field map from the CSV header row. */
function mapHeaders(headers: string[]): Record<number, string> {
  const map: Record<number, string> = {};
  headers.forEach((h, i) => {
    const key = norm(h);
    for (const [field, aliases] of Object.entries(ALIASES)) {
      if (field === key || aliases.includes(key)) { map[i] = field; break; }
    }
  });
  return map;
}

/** Normalize a date cell to YYYY-MM-DD, or null if unparseable. */
function toDate(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { headers, rows } = await req.json() as { headers?: string[]; rows?: string[][] };
  if (!Array.isArray(headers) || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Empty file or missing header row." }, { status: 400 });
  }

  const map = mapHeaders(headers);
  const mappedFields = new Set(Object.values(map));
  if (!mappedFields.has("sale_date") || !mappedFields.has("stock_no")) {
    return NextResponse.json({
      error: `Couldn't find a Date and Stock # column. Detected headers: ${headers.join(", ")}`,
    }, { status: 400 });
  }

  const records: Record<string, unknown>[] = [];
  let skipped = 0;
  for (const cells of rows) {
    const r: Record<string, string> = {};
    for (const [idx, field] of Object.entries(map)) r[field] = (cells[Number(idx)] ?? "").trim();

    const sale_date = toDate(r.sale_date ?? "");
    const stock_no = (r.stock_no ?? "").trim();
    if (!sale_date || !stock_no) { skipped++; continue; }

    const totalNum = parseFloat((r.total ?? "").replace(/[^0-9.\-]/g, ""));
    const paidRaw = (r.paid ?? "").toLowerCase();
    records.push({
      sale_date,
      stock_no,
      size: r.size || null,
      width: r.width || null,
      qty: Math.max(1, parseInt(r.qty ?? "") || 1),
      paid: paidRaw === "" ? true : !["no", "false", "0", "unpaid", "n"].includes(paidRaw),
      total: isNaN(totalNum) ? null : totalNum,
      payment: r.payment || null,
      customer_name: r.customer_name || null,
      phone: r.phone || null,
      customer_email: r.customer_email || null,
      customer_address: r.customer_address || null,
      customer_employer: r.customer_employer || null,
      referral_source: r.referral_source || null,
      notes: r.notes || null,
    });
  }

  if (records.length === 0) {
    return NextResponse.json({ error: "No importable rows (each needs a valid date and stock #).", skipped }, { status: 400 });
  }

  const { data, error } = await getSupabase().from("retail_sales").insert(records).select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mirror the freshly imported rows into the Google Sheet (best-effort).
  try {
    const inserted = data ?? [];
    for (let i = 0; i < inserted.length; i += 200) await syncBatchToSheet(inserted.slice(i, i + 200));
  } catch (err) { console.error("import sheet sync failed", err); }

  return NextResponse.json({ ok: true, imported: data?.length ?? 0, skipped });
}
