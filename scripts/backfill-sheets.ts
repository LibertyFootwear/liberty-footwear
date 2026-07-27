/**
 * One-time backfill: push every existing retail_sales row into the Google Sheet
 * backup, in chunks. Safe to re-run — the Apps Script upserts by id (no dupes).
 *
 * Usage:
 *   npx tsx scripts/backfill-sheets.ts
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   SHEETS_WEBHOOK_URL, SHEETS_WEBHOOK_SECRET
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { syncBatchToSheet } from "../src/lib/sheetsSync";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnvLocal();

const PAGE = 1000;       // Supabase read cap per request
const CHUNK = 200;       // rows per webhook POST (keep Apps Script under its time limit)

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("✗ Supabase env vars missing."); process.exit(1); }
  if (!process.env.SHEETS_WEBHOOK_URL) { console.error("✗ SHEETS_WEBHOOK_URL missing."); process.exit(1); }
  const sb = createClient(url, key);

  const all: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb.from("retail_sales").select("*")
      .order("created_at", { ascending: true }).range(from, from + PAGE - 1);
    if (error) { console.error("✗ Read failed:", error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
  }
  console.log(`Backfilling ${all.length} rows to the sheet in chunks of ${CHUNK}…`);

  for (let i = 0; i < all.length; i += CHUNK) {
    const chunk = all.slice(i, i + CHUNK);
    await syncBatchToSheet(chunk);
    console.log(`  ${Math.min(i + CHUNK, all.length)}/${all.length}`);
  }
  console.log("✓ Backfill complete.");
}

main().catch((err) => { console.error("✗ Backfill failed:", err); process.exit(1); });
