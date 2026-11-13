import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/adminAuth";

export const maxDuration = 60;

/** Field → accepted header aliases (lowercased, non-alphanumerics except # stripped). */
const ALIASES: Record<string, string[]> = {
  ordered_date:   ["ordered", "ordereddate", "orderdate", "date"],
  promised:       ["promised", "promiseddate"],
  complete_date:  ["complete", "completed", "completedate", "completeddate", "madedate", "made"],
  picked_up_date: ["pickedup", "pickup", "pickeddate", "pickupdate"],
  price_quote:    ["pricequote", "price", "quote", "amount", "total", "cost"],
  paid:           ["paid"],
  stock_no:       ["stock", "stockno", "stock#", "stockno.", "style", "styleno", "sku", "item", "model"],
  size:           ["size", "sizelr", "sizelr#"],
  width:          ["width", "widthlr"],
  first_name:     ["firstname", "first"],
  last_name:      ["lastname", "last"],
  contact:        ["contact", "phone", "phone#", "tel", "telephone", "email"],
  details:        ["details", "detail", "description", "notes", "spec", "build"],
  contact_notes:  ["contactnotes", "customernotes", "comment", "comments", "remarks"],
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9#]/g, "");

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

function toDate(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { rows: allRows } = await req.json() as { rows?: string[][] };
  if (!Array.isArray(allRows) || allRows.length < 2) {
    return NextResponse.json({ error: "Empty file or no data rows." }, { status: 400 });
  }

  // Header row might not be the first line — scan the first few for a mappable one.
  let hIdx = -1;
  let map: Record<number, string> = {};
  for (let i = 0; i < Math.min(allRows.length, 8); i++) {
    const m = mapHeaders(allRows[i]);
    const fields = new Set(Object.values(m));
    // An open-order sheet needs at least a stock/name + some date/price to be useful.
    if ((fields.has("stock_no") || fields.has("first_name") || fields.has("last_name")) &&
        (fields.has("ordered_date") || fields.has("price_quote") || fields.has("details"))) {
      hIdx = i; map = m; break;
    }
  }
  if (hIdx === -1) {
    return NextResponse.json({
      error: `Couldn't map the header row. Expected columns like Ordered / Stock # / First Name / Price Quote. First row: ${(allRows[0] ?? []).join(", ")}`,
    }, { status: 400 });
  }
  const rows = allRows.slice(hIdx + 1);

  // Dedup key: same customer + stock + price + ordered date = same order.
  const numKey = (v: unknown) => {
    if (v == null || v === "") return "";
    const n = Number(v);
    return Number.isNaN(n) ? "" : String(n);
  };
  const key = (r: Record<string, unknown>) => [
    r.ordered_date ?? "",
    String(r.stock_no ?? "").trim().toLowerCase(),
    String(r.size ?? "").trim().toLowerCase(),
    String(r.width ?? "").trim().toLowerCase(),
    numKey(r.price_quote),
    String(r.first_name ?? "").trim().toLowerCase(),
    String(r.last_name ?? "").trim().toLowerCase(),
    String(r.contact ?? "").replace(/\s+/g, "").toLowerCase(),
  ].join("|");

  interface Item { row: Record<string, unknown>; k: string }
  const items: Item[] = [];
  let skipped = 0;
  for (const cells of rows) {
    const r: Record<string, string> = {};
    for (const [idx, field] of Object.entries(map)) r[field] = (cells[Number(idx)] ?? "").trim();

    // Require at least a customer name or a stock # — mirrors the single-row insert rule.
    const first = (r.first_name ?? "").trim();
    const last  = (r.last_name  ?? "").trim();
    const stock = (r.stock_no   ?? "").trim();
    const price = parseFloat((r.price_quote ?? "").replace(/[^0-9.\-]/g, ""));
    const details = (r.details ?? "").trim();
    if (!first && !last && !stock && !details && isNaN(price)) { skipped++; continue; }

    const paidRaw = (r.paid ?? "").toLowerCase();
    const row = {
      ordered_date: toDate(r.ordered_date ?? ""),
      promised: r.promised || null,
      complete_date: toDate(r.complete_date ?? ""),
      picked_up_date: toDate(r.picked_up_date ?? ""),
      price_quote: isNaN(price) ? null : price,
      paid: ["true", "yes", "y", "1", "paid"].includes(paidRaw),
      stock_no: stock || null,
      size: r.size || null,
      width: r.width || null,
      first_name: first || null,
      last_name: last || null,
      contact: r.contact || null,
      details: details || null,
      contact_notes: r.contact_notes || null,
    };
    items.push({ row, k: key(row) });
  }

  if (items.length === 0) {
    return NextResponse.json({ error: "No importable rows.", skipped }, { status: 400 });
  }

  const sb = getSupabase();

  // Load existing rows to dedupe against; open_orders is small (thousands at most).
  const existingKeys = new Set<string>();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from("open_orders")
      .select("ordered_date, stock_no, size, width, price_quote, first_name, last_name, contact")
      .range(from, from + PAGE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;
    for (const r of data) existingKeys.add(key(r));
    if (data.length < PAGE) break;
  }

  const seenKeys = new Set<string>();
  const fresh: Record<string, unknown>[] = [];
  let duplicates = 0;
  for (const it of items) {
    if (existingKeys.has(it.k) || seenKeys.has(it.k)) { duplicates++; continue; }
    fresh.push(it.row);
    seenKeys.add(it.k);
  }

  let imported = 0;
  const INS = 500;
  for (let i = 0; i < fresh.length; i += INS) {
    const { data, error } = await sb.from("open_orders").insert(fresh.slice(i, i + INS)).select("id");
    if (error) return NextResponse.json({ error: error.message, imported }, { status: 500 });
    imported += data?.length ?? 0;
  }

  return NextResponse.json({ ok: true, imported, skipped, duplicates });
}
