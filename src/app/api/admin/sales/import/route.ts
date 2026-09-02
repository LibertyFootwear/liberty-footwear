import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/adminAuth";

export const maxDuration = 60;

/** Field → accepted header aliases (lowercased, non-alphanumerics except # stripped). */
const ALIASES: Record<string, string[]> = {
  sale_date:        ["date", "saledate", "sold", "solddate"],
  stock_no:         ["stock", "stockno", "stock#", "style", "styleno", "sku", "item", "itemno", "model"],
  size:             ["size", "sizelr", "sizelr#"],
  width:            ["width"],
  qty:              ["qty", "quantity", "pairs", "units"],
  paid:             ["paid", "yesno"],
  total:            ["total", "total$", "incltax", "price", "amount", "sale", "saleprice", "sellingprice"],
  payment:          ["payment", "pay", "paymentmethod", "method", "tender", "ccdc", "cashcheck"],
  customer_name:    ["customer", "customername", "name", "buyer"],
  phone:            ["phone", "phone#", "tel", "telephone", "phonenumber", "cell"],
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

  const { rows: allRows } = await req.json() as { rows?: string[][] };
  if (!Array.isArray(allRows) || allRows.length < 2) {
    return NextResponse.json({ error: "Empty file or no data rows." }, { status: 400 });
  }

  // Header row may not be the first line (banners/titles above it). Scan the first
  // several rows for the one that maps both a Date and a Stock # column.
  let hIdx = -1;
  let map: Record<number, string> = {};
  for (let i = 0; i < Math.min(allRows.length, 8); i++) {
    const m = mapHeaders(allRows[i]);
    const fields = new Set(Object.values(m));
    if (fields.has("sale_date") && fields.has("stock_no")) { hIdx = i; map = m; break; }
  }
  if (hIdx === -1) {
    return NextResponse.json({
      error: `Couldn't find a Date and Stock # column. First row headers: ${(allRows[0] ?? []).join(", ")}`,
    }, { status: 400 });
  }
  const rows = allRows.slice(hIdx + 1);

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

  const sb = getSupabase();

  // ── Idempotent import ──────────────────────────────────────────────────────
  // The sheet is re-exported and re-imported to add NEW sales, so we must not
  // re-insert rows already in the table. Match on a normalised content key
  // (case-insensitive name/payment, digits-only phone) so trivial differences
  // like "Cash" vs "cash" don't sneak a duplicate back in.
  const key = (r: Record<string, unknown>) => [
    r.sale_date ?? "",
    String(r.stock_no ?? "").trim().toLowerCase(),
    String(r.size ?? "").trim().toLowerCase(),
    String(r.width ?? "").trim().toLowerCase(),
    r.qty ?? "",
    r.total == null ? "" : String(r.total),
    String(r.customer_name ?? "").trim().toLowerCase(),
    String(r.phone ?? "").replace(/\D/g, ""),
    String(r.payment ?? "").trim().toLowerCase(),
  ].join("|");

  // Load every existing content key (paged) so re-imports only add what's new.
  const existing = new Set<string>();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from("retail_sales")
      .select("sale_date, stock_no, size, width, qty, total, customer_name, phone, payment")
      .range(from, from + PAGE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;
    for (const r of data) existing.add(key(r));
    if (data.length < PAGE) break;
  }

  // Keep only genuinely new rows — skip ones already in the DB and duplicates
  // within this same file.
  const seen = new Set<string>();
  const fresh: Record<string, unknown>[] = [];
  let duplicates = 0;
  for (const r of records) {
    const k = key(r);
    if (existing.has(k) || seen.has(k)) { duplicates++; continue; }
    seen.add(k);
    fresh.push(r);
  }

  let imported = 0;
  const INS = 500;
  for (let i = 0; i < fresh.length; i += INS) {
    const { data, error } = await sb.from("retail_sales").insert(fresh.slice(i, i + INS)).select("id");
    if (error) {
      return NextResponse.json({ error: error.message, imported }, { status: 500 });
    }
    imported += data?.length ?? 0;
  }

  return NextResponse.json({ ok: true, imported, skipped, duplicates });
}
