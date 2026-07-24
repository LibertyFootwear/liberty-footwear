import { getSupabase } from "./supabase";
import { products } from "@/data/products";
import storeJson from "@/data/storeSales.json";

export interface OrderItem { stockNo: string; name: string; size?: string; price: number; qty: number }
export interface OrderRow { items: OrderItem[]; total: number; status: string; created_at: string; source?: string | null }

/** A unified sales aggregate that both live orders and the historical export map into. */
export interface Agg {
  orders: number;
  units: number;
  revenue: number;
  byStock: Record<string, number>;   // units by stockNo
  byColor: Record<string, number>;   // units by leather color
  bySize: Record<string, number>;    // units by numeric size
  byWidth: Record<string, number>;   // units by width (M / EW / Other)
  byPay: Record<string, number>;
  byDay: Record<string, number>;     // Mon..Sun (orders for live, units for historical)
  byHour: Record<number, number>;    // orders by hour (live only)
  byMonth: Record<string, number>;   // Jan..Dec units
  byYear: Record<string, { units: number; revenue: number }>;
  hasHour: boolean;                  // hour-of-day granularity available (live)
  hasYear: boolean;                  // multi-year history available (historical)
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function emptyAgg(): Agg {
  return {
    orders: 0, units: 0, revenue: 0,
    byStock: {}, byColor: {}, bySize: {}, byWidth: {}, byPay: {}, byDay: {}, byHour: {}, byMonth: {}, byYear: {},
    hasHour: false, hasYear: false,
  };
}

/** Split a cart size label ("M 10", "EW 10.5", "10", "L") into width + numeric size. */
function parseSize(raw?: string): { width: string | null; size: string | null } {
  if (!raw) return { width: null, size: null };
  const t = raw.trim();
  const m = t.match(/^(M|EW)\s+(.+)$/i);
  if (m) return { width: m[1].toUpperCase(), size: m[2] };
  if (/^\d/.test(t)) return { width: null, size: t };
  return { width: null, size: null }; // apparel (S/M/L) — not a boot size
}

const dayFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Detroit", weekday: "short" });
const hourFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Detroit", hour: "2-digit", hour12: false });

/** Build an aggregate from raw live order rows. */
export function aggFromOrders(rows: OrderRow[]): Agg {
  const a = emptyAgg();
  a.hasHour = true;
  for (const o of rows) {
    if (o.status === "cancelled") continue;
    a.orders += 1;
    a.revenue += o.total ?? 0;

    const dt = new Date(o.created_at);
    const day = dayFmt.format(dt);
    a.byDay[day] = (a.byDay[day] ?? 0) + 1;
    const hour = parseInt(hourFmt.format(dt), 10);
    if (!isNaN(hour)) a.byHour[hour] = (a.byHour[hour] ?? 0) + 1;
    const year = String(dt.getFullYear());
    const monthKey = MONTHS[dt.getMonth()];

    for (const it of o.items ?? []) {
      const prod = products.find((p) => p.stockNo === it.stockNo);
      const key = it.stockNo || it.name;
      a.byStock[key] = (a.byStock[key] ?? 0) + it.qty;
      a.units += it.qty;

      const color = prod?.colorLeather ?? "Unknown";
      a.byColor[color] = (a.byColor[color] ?? 0) + it.qty;

      const { width, size } = parseSize(it.size);
      if (size) a.bySize[size] = (a.bySize[size] ?? 0) + it.qty;
      if (width) a.byWidth[width] = (a.byWidth[width] ?? 0) + it.qty;

      a.byMonth[monthKey] = (a.byMonth[monthKey] ?? 0) + it.qty;
      if (!a.byYear[year]) a.byYear[year] = { units: 0, revenue: 0 };
      a.byYear[year].units += it.qty;
      a.byYear[year].revenue += (it.price ?? prod?.price ?? 0) * it.qty;
    }
  }
  return a;
}

interface StoreJson {
  totalUnits: number; totalRevenue: number;
  byStock: Record<string, number>; bySize: Record<string, number>; byWidth: Record<string, number>;
  byPay: Record<string, number>; byDay: Record<string, number>; byMonth: Record<string, number>;
  byYear: Record<string, { units: number; revenue: number }>;
}

/** Map the historical 2017–2026 retail export into the unified aggregate shape. */
export function historicalAgg(): Agg {
  const d = storeJson as unknown as StoreJson;
  const a = emptyAgg();
  a.hasYear = true;
  a.units = d.totalUnits ?? 0;
  a.revenue = d.totalRevenue ?? 0;
  a.byStock = { ...(d.byStock ?? {}) };
  a.bySize = { ...(d.bySize ?? {}) };
  for (const [k, v] of Object.entries(d.byWidth ?? {})) {
    const key = k === "M" || k === "EW" ? k : "Other";
    a.byWidth[key] = (a.byWidth[key] ?? 0) + v;
  }
  a.byPay = { ...(d.byPay ?? {}) };
  a.byDay = { ...(d.byDay ?? {}) };
  a.byMonth = { ...(d.byMonth ?? {}) };
  a.byYear = { ...(d.byYear ?? {}) };
  for (const [stockNo, units] of Object.entries(d.byStock ?? {})) {
    const p = products.find((x) => x.stockNo === stockNo);
    if (p) a.byColor[p.colorLeather] = (a.byColor[p.colorLeather] ?? 0) + units;
  }
  return a;
}

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface RetailSaleRow {
  sale_date: string;
  stock_no: string;
  size: string | null;
  width: string | null;
  qty: number | null;
  total: number | null;
  payment: string | null;
}

/** Fetch every in-store retail sale (the spreadsheet-style log). [] if Supabase is unavailable. */
export async function getRetailSales(): Promise<RetailSaleRow[]> {
  try {
    const { data } = await getSupabase()
      .from("retail_sales")
      .select("sale_date, stock_no, size, width, qty, total, payment");
    return (data ?? []) as RetailSaleRow[];
  } catch {
    return [];
  }
}

/** Aggregate the live retail_sales table into the unified shape (replaces the static export). */
export function retailAgg(rows: RetailSaleRow[]): Agg {
  const a = emptyAgg();
  a.hasYear = true;
  for (const r of rows) {
    const qty = r.qty ?? 1;
    a.units += qty;
    a.revenue += r.total ?? 0;

    const stock = r.stock_no || "Unknown";
    a.byStock[stock] = (a.byStock[stock] ?? 0) + qty;
    const p = products.find((x) => x.stockNo === stock);
    if (p) a.byColor[p.colorLeather] = (a.byColor[p.colorLeather] ?? 0) + qty;

    if (r.size) {
      const n = parseFloat(r.size);
      if (!isNaN(n)) a.bySize[String(n)] = (a.bySize[String(n)] ?? 0) + qty;
    }
    if (r.width) {
      const key = r.width === "M" || r.width === "EW" ? r.width : "Other";
      a.byWidth[key] = (a.byWidth[key] ?? 0) + qty;
    }
    if (r.payment) a.byPay[r.payment] = (a.byPay[r.payment] ?? 0) + qty;

    const parts = (r.sale_date ?? "").split("-").map(Number);
    if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
      const [y, m, d] = parts;
      const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
      a.byDay[DAYS_SHORT[dow]] = (a.byDay[DAYS_SHORT[dow]] ?? 0) + qty;
      a.byMonth[MONTHS[m - 1]] = (a.byMonth[MONTHS[m - 1]] ?? 0) + qty;
      const yk = String(y);
      if (!a.byYear[yk]) a.byYear[yk] = { units: 0, revenue: 0 };
      a.byYear[yk].units += qty;
      a.byYear[yk].revenue += r.total ?? 0;
    }
  }
  return a;
}

/** Sum any number of aggregates bucket-by-bucket. */
export function mergeAgg(...aggs: Agg[]): Agg {
  const out = emptyAgg();
  const addMap = (target: Record<string, number>, src: Record<string, number>) => {
    for (const [k, v] of Object.entries(src)) target[k] = (target[k] ?? 0) + v;
  };
  for (const a of aggs) {
    out.orders += a.orders;
    out.units += a.units;
    out.revenue += a.revenue;
    out.hasHour = out.hasHour || a.hasHour;
    out.hasYear = out.hasYear || a.hasYear;
    addMap(out.byStock, a.byStock);
    addMap(out.byColor, a.byColor);
    addMap(out.bySize, a.bySize);
    addMap(out.byWidth, a.byWidth);
    addMap(out.byPay, a.byPay);
    addMap(out.byDay, a.byDay);
    for (const [k, v] of Object.entries(a.byHour)) out.byHour[+k] = (out.byHour[+k] ?? 0) + v;
    addMap(out.byMonth, a.byMonth);
    for (const [k, v] of Object.entries(a.byYear)) {
      if (!out.byYear[k]) out.byYear[k] = { units: 0, revenue: 0 };
      out.byYear[k].units += v.units;
      out.byYear[k].revenue += v.revenue;
    }
  }
  return out;
}

/** Fetch all live orders (web + store) once. Returns [] if Supabase is unavailable. */
export async function getAllOrders(): Promise<OrderRow[]> {
  try {
    const { data } = await getSupabase().from("orders").select("items, total, status, created_at, source");
    return (data ?? []) as OrderRow[];
  } catch {
    return [];
  }
}

/** Split live orders into web (source ≠ store) and in-store (source = store). */
export function splitOrders(rows: OrderRow[]) {
  return {
    web: rows.filter((o) => o.source !== "store"),
    store: rows.filter((o) => o.source === "store"),
  };
}
