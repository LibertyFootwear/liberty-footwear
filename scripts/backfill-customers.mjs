/**
 * Backfill the unified `customers` registry from existing data.
 *
 * Merges, deduplicating by normalized email then phone:
 *   1. users        → account holders (linked via user_id; not counted as a purchase)
 *   2. orders        → web + in-store orders (source from the row; sets orders.customer_id)
 *   3. retail_sales  → manual in-store sales log (sets retail_sales.customer_id)
 *
 * Prerequisites:
 *   1. Run scripts/sql/create-customers-table.sql in the Supabase SQL Editor first.
 *   2. .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *      (SUPABASE_SECRET_KEY also works).
 *
 * Usage:
 *   node scripts/backfill-customers.mjs           # apply
 *   node scripts/backfill-customers.mjs --dry-run # report only, no writes
 *
 * Idempotent: re-running dedups against existing customers and only fills
 * customer_id where it is still null. Rows with neither email nor phone are
 * skipped (nothing to identify the customer by).
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();
const DRY = process.argv.includes("--dry-run");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const sb = createClient(url, key);

/** Fetch every row from a table (Supabase caps each select at 1000 rows). */
async function fetchAll(table, columns) {
  const out = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb.from(table).select(columns).range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return out;
}

const normEmail = (e) => {
  const v = (e ?? "").toLowerCase().trim();
  return v || undefined;
};
const normPhone = (p) => {
  const d = (p ?? "").replace(/\D/g, "");
  return d.length >= 7 ? d : undefined;
};
const normName = (n) => {
  const v = (n ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  if (!v || v.startsWith("?")) return undefined;
  return (v.match(/[a-z]/g) ?? []).length >= 2 ? v : undefined;
};
const minDate = (a, b) => (!a ? b : !b ? a : a < b ? a : b);
const maxDate = (a, b) => (!a ? b : !b ? a : a > b ? a : b);

async function findExisting(emailN, phoneN, nameN) {
  if (emailN) {
    const { data } = await sb.from("customers").select("*").eq("email", emailN).maybeSingle();
    if (data) return data;
  }
  if (phoneN) {
    const { data } = await sb.from("customers").select("*").eq("phone_norm", phoneN).limit(1).maybeSingle();
    if (data) return data;
  }
  if (!emailN && !phoneN && nameN) {
    const { data } = await sb.from("customers").select("*").eq("name_norm", nameN).limit(1).maybeSingle();
    if (data) return data;
  }
  return null;
}

let created = 0;
let merged = 0;

/** Upsert a customer; returns its id (or null in dry-run when it would be created). */
async function upsert({ name, email, phone, address, employer, referralSource, userId, source, newsletter, purchaseAt, isPurchase = true }) {
  const emailN = normEmail(email);
  const phoneN = normPhone(phone);
  const nameN = normName(name);
  if (!emailN && !phoneN && !nameN) return null; // nothing to identify the customer by
  const pAt = isPurchase ? purchaseAt : undefined;

  const existing = await findExisting(emailN, phoneN, nameN);
  if (existing) {
    const upd = {};
    if (!existing.name && name?.trim()) upd.name = name.trim();
    if (!existing.name_norm && nameN) upd.name_norm = nameN;
    if (!existing.email && emailN) upd.email = emailN;
    if (!existing.phone && phone?.trim()) { upd.phone = phone.trim(); upd.phone_norm = phoneN ?? null; }
    if (!existing.address && address) upd.address = address;
    if (!existing.employer && employer?.trim()) upd.employer = employer.trim();
    if (!existing.referral_source && referralSource?.trim()) upd.referral_source = referralSource.trim();
    if (!existing.user_id && userId) upd.user_id = userId;
    if (newsletter && !existing.newsletter) upd.newsletter = true;
    const sources = existing.sources ?? [];
    if (!sources.includes(source)) upd.sources = [...sources, source];
    if (pAt) {
      const first = minDate(existing.first_purchase_at, pAt);
      const last = maxDate(existing.last_purchase_at, pAt);
      if (first !== existing.first_purchase_at) upd.first_purchase_at = first;
      if (last !== existing.last_purchase_at) upd.last_purchase_at = last;
    }
    if (!DRY && Object.keys(upd).length) await sb.from("customers").update(upd).eq("id", existing.id);
    merged++;
    return existing.id;
  }

  if (DRY) { created++; return null; }
  const { data, error } = await sb.from("customers").insert({
    name: name?.trim() ?? "",
    name_norm: nameN ?? null,
    email: emailN ?? null,
    phone: phone?.trim() ?? null,
    phone_norm: phoneN ?? null,
    address: address ?? null,
    employer: employer?.trim() ?? null,
    referral_source: referralSource?.trim() ?? null,
    user_id: userId ?? null,
    sources: [source],
    newsletter: newsletter ?? false,
    first_purchase_at: pAt ?? null,
    last_purchase_at: pAt ?? null,
  }).select("id").single();
  if (error) throw new Error(error.message);
  created++;
  return data.id;
}

async function run() {
  console.log(DRY ? "DRY RUN — no writes\n" : "Applying backfill\n");

  // 1. Account holders
  const users = await fetchAll("users", "id, name, email, phone, address, newsletter");
  for (const u of users) {
    await upsert({
      name: u.name, email: u.email, phone: u.phone, address: u.address,
      userId: u.id, source: "web", newsletter: u.newsletter, isPurchase: false,
    });
  }
  console.log(`users:        ${users.length} processed`);

  // 2. Orders (web + store)
  const orders = await fetchAll(
    "orders",
    "id, user_id, customer_id, source, shipping_name, shipping_email, phone, shipping_address, created_at"
  );
  let orderLinks = 0;
  for (const o of orders) {
    const source = o.source === "store" ? "store" : "web";
    const id = await upsert({
      name: o.shipping_name, email: o.shipping_email, phone: o.phone,
      address: o.shipping_address, userId: o.user_id ?? undefined,
      source, purchaseAt: o.created_at,
    });
    if (id && !o.customer_id) {
      if (!DRY) await sb.from("orders").update({ customer_id: id }).eq("id", o.id);
      orderLinks++;
    }
  }
  console.log(`orders:       ${orders.length} processed, ${orderLinks} linked`);

  // 3. Retail sales
  const sales = await fetchAll(
    "retail_sales",
    "id, customer_id, customer_name, phone, customer_email, customer_employer, referral_source, sale_date"
  );
  let saleLinks = 0;
  for (const s of sales) {
    const id = await upsert({
      name: s.customer_name, email: s.customer_email, phone: s.phone,
      employer: s.customer_employer, referralSource: s.referral_source,
      source: "store",
      purchaseAt: s.sale_date ? new Date(s.sale_date + "T12:00:00").toISOString() : undefined,
    });
    if (id && !s.customer_id) {
      if (!DRY) await sb.from("retail_sales").update({ customer_id: id }).eq("id", s.id);
      saleLinks++;
    }
  }
  console.log(`retail_sales: ${sales.length} processed, ${saleLinks} linked`);

  console.log(`\nDone. Customers created: ${created}, merged into existing: ${merged}`);
  if (DRY) console.log("(dry run — nothing was written)");
}

run().catch((e) => { console.error(e); process.exit(1); });
