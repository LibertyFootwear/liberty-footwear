import { env } from "@/lib/env";

/**
 * Mirror retail_sales rows into a Google Sheet (backup) via a Google Apps Script
 * web-app webhook. Best-effort: a Sheets hiccup must never break a sale, so every
 * call swallows its errors. No-op when SHEETS_WEBHOOK_URL is unset (local/script env).
 *
 * Setup: deploy scripts/google-apps-script.gs as a Sheets-bound web app, then set
 *   SHEETS_WEBHOOK_URL / SHEETS_WEBHOOK_SECRET in .env.local (see src/lib/env.ts).
 */

/** Column order shared with the Apps Script. Keep in sync on both sides. */
export const SHEET_COLUMNS = [
  "id", "sale_date", "stock_no", "size", "width", "qty", "paid", "total",
  "payment", "customer_name", "phone", "customer_email", "customer_address",
  "customer_employer", "referral_source", "notes", "created_at",
] as const;

export type SheetRow = Record<(typeof SHEET_COLUMNS)[number], unknown>;

/** Pick only the mirrored columns from a full DB row, so we never leak extra fields. */
export function toSheetRow(dbRow: Record<string, unknown>): SheetRow {
  const out = {} as SheetRow;
  for (const c of SHEET_COLUMNS) out[c] = dbRow[c] ?? null;
  return out;
}

async function post(body: Record<string, unknown>): Promise<void> {
  const url = env.SHEETS_WEBHOOK_URL;
  if (!url) return; // not configured — mirroring is optional
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: env.SHEETS_WEBHOOK_SECRET ?? "", ...body }),
      // Apps Script /exec responds 302→200; follow it.
      redirect: "follow",
    });
    if (!res.ok) console.error("Sheets sync non-OK:", res.status, await res.text().catch(() => ""));
  } catch (err) {
    console.error("Sheets sync failed (sale still recorded):", err);
  }
}

/** Insert-or-update a single row in the sheet, keyed by id. */
export async function syncRowToSheet(dbRow: Record<string, unknown>): Promise<void> {
  if (!dbRow?.id) return;
  await post({ action: "upsert", row: toSheetRow(dbRow) });
}

/** Remove a row from the sheet by id. */
export async function deleteRowFromSheet(id: string): Promise<void> {
  if (!id) return;
  await post({ action: "delete", id });
}

/** Bulk insert-or-update (used by the one-time backfill). Send in chunks. */
export async function syncBatchToSheet(dbRows: Record<string, unknown>[]): Promise<void> {
  if (!dbRows.length) return;
  await post({ action: "upsertBatch", rows: dbRows.map(toSheetRow) });
}
