/**
 * Retail Sales → Google Sheets backup receiver.
 *
 * Deploy this INSIDE the target spreadsheet:
 *   1. Open your Google Sheet → Extensions → Apps Script.
 *   2. Paste this whole file over Code.gs. Set SECRET below to a long random string.
 *   3. Deploy → New deployment → type "Web app".
 *        - Execute as: Me
 *        - Who has access: Anyone
 *   4. Copy the Web app URL (ends in /exec).
 *   5. In Vercel set env vars:
 *        SHEETS_WEBHOOK_URL    = <the /exec URL>
 *        SHEETS_WEBHOOK_SECRET = <the same SECRET string>
 *
 * The script owns a tab named TAB_NAME and keys rows by column A (id). It writes
 * its own header row, so don't hand-edit that tab's structure.
 */

var SECRET = "CHANGE_ME_to_a_long_random_string";
var TAB_NAME = "RetailSales";

// Must match SHEET_COLUMNS in src/lib/sheetsSync.ts (same order).
var COLS = [
  "id", "sale_date", "stock_no", "size", "width", "qty", "paid", "total",
  "payment", "customer_name", "phone", "customer_email", "customer_address",
  "customer_employer", "referral_source", "notes", "created_at",
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // serialize concurrent writes
  try {
    var body = JSON.parse(e.postData.contents);
    if (String(body.secret || "") !== SECRET) {
      return json({ ok: false, error: "unauthorized" });
    }
    var sheet = getSheet();

    if (body.action === "delete") {
      deleteById(sheet, String(body.id));
      return json({ ok: true, action: "delete" });
    }
    if (body.action === "upsert") {
      upsertRow(sheet, body.row);
      return json({ ok: true, action: "upsert" });
    }
    if (body.action === "upsertBatch") {
      var rows = body.rows || [];
      for (var i = 0; i < rows.length; i++) upsertRow(sheet, rows[i]);
      return json({ ok: true, action: "upsertBatch", count: rows.length });
    }
    return json({ ok: false, error: "unknown action" });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TAB_NAME);
  if (!sheet) sheet = ss.insertSheet(TAB_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Row array from an incoming {col: value} object, in COLS order. */
function toArray(rowObj) {
  return COLS.map(function (c) {
    var v = rowObj[c];
    return v === null || v === undefined ? "" : v;
  });
}

/** 1-based sheet row index of the given id, or -1 if absent. */
function findRowIndex(sheet, id) {
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues(); // column A, skip header
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function upsertRow(sheet, rowObj) {
  if (!rowObj || !rowObj.id) return;
  var values = toArray(rowObj);
  var idx = findRowIndex(sheet, rowObj.id);
  if (idx === -1) {
    sheet.appendRow(values);
  } else {
    sheet.getRange(idx, 1, 1, COLS.length).setValues([values]);
  }
}

function deleteById(sheet, id) {
  var idx = findRowIndex(sheet, id);
  if (idx !== -1) sheet.deleteRow(idx);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
