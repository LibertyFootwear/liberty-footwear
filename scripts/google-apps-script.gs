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

// For two-way sync (Sheet → admin). Set to your site's write-back endpoint:
//   https://www.libertyfootwear.com/api/sheets/sales-pull
// Then add an INSTALLABLE trigger: Apps Script → Triggers (clock icon) →
//   Add Trigger → function: onSheetEdit, event source: From spreadsheet,
//   event type: On edit. (A simple onEdit can't call the network — must be installable.)
var ADMIN_PULL_URL = "https://www.libertyfootwear.com/api/sheets/sales-pull";

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

/**
 * Two-way sync: push a manually edited RetailSales row back to the admin DB.
 * Attach as an INSTALLABLE "On edit" trigger (see ADMIN_PULL_URL note above).
 * Programmatic writes from the web app (admin → sheet) do NOT fire this, so
 * there's no sync loop.
 */
function onSheetEdit(e) {
  try {
    if (!e || !e.range) return;
    var sheet = e.range.getSheet();
    if (sheet.getName() !== TAB_NAME) return;

    var startRow = e.range.getRow();
    var numRows = e.range.getNumRows();
    if (startRow + numRows - 1 < 2) return; // header only

    for (var r = Math.max(startRow, 2); r < startRow + numRows; r++) {
      pushRowToAdmin(sheet, r);
    }
  } catch (err) {
    // Never throw from a trigger — just log.
    console.error("onSheetEdit failed: " + err);
  }
}

function pushRowToAdmin(sheet, rowNum) {
  var values = sheet.getRange(rowNum, 1, 1, COLS.length).getValues()[0];
  var rowObj = {};
  for (var i = 0; i < COLS.length; i++) rowObj[COLS[i]] = values[i];

  // Skip blank rows (need at least a date and stock #).
  if (!rowObj.sale_date && !rowObj.stock_no) return;

  var res = UrlFetchApp.fetch(ADMIN_PULL_URL, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ secret: SECRET, row: rowObj }),
    muteHttpExceptions: true,
  });
  var out = {};
  try { out = JSON.parse(res.getContentText()); } catch (e2) { return; }

  // New row created in admin → write its id back into column A so future edits update it.
  if (out && out.id && !rowObj.id) {
    sheet.getRange(rowNum, 1).setValue(out.id);
  }
}
