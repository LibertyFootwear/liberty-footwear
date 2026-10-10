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

// Column R (right after the data) shows a "⚠ error" if admin rejected an edited row.
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

/** Cell value → plain JSON value (Dates become yyyy-MM-dd in the sheet's timezone, no UTC shift). */
function normalize(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, SpreadsheetApp.getActive().getSpreadsheetTimeZone(), "yyyy-MM-dd");
  }
  return v;
}

function rowToObj(values) {
  var o = {};
  for (var i = 0; i < COLS.length; i++) o[COLS[i]] = normalize(values[i]);
  return o;
}

function callAdmin(payload) {
  payload.secret = SECRET;
  var res = UrlFetchApp.fetch(ADMIN_PULL_URL, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
  try { return JSON.parse(res.getContentText()); } catch (e) { return {}; }
}

/**
 * Two-way sync: push manually edited/pasted RetailSales rows back to the admin DB.
 * Attach as an INSTALLABLE "On edit" trigger (see ADMIN_PULL_URL note above).
 * Programmatic writes from the web app (admin → sheet) do NOT fire this, so
 * there's no sync loop. New rows get their id written back into column A.
 */
function onSheetEdit(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (!e || !e.range) return;
    var sheet = e.range.getSheet();
    if (sheet.getName() !== TAB_NAME) return;

    var first = Math.max(e.range.getRow(), 2); // never the header
    var last = e.range.getRow() + e.range.getNumRows() - 1;
    if (last < first) return;

    var data = sheet.getRange(first, 1, last - first + 1, COLS.length).getValues();
    var rows = [], rowNums = [];
    for (var i = 0; i < data.length; i++) {
      var o = rowToObj(data[i]);
      if (!o.sale_date && !o.stock_no) continue; // blank row
      rows.push(o);
      rowNums.push(first + i);
    }
    if (!rows.length) return;

    var out = callAdmin({ rows: rows });
    var results = out.results || [];
    for (var j = 0; j < results.length; j++) {
      var r = results[j];
      if (r && r.id && String(r.id) !== String(rows[j].id)) sheet.getRange(rowNums[j], 1).setValue(r.id);
      if (r && r.error) sheet.getRange(rowNums[j], COLS.length + 1).setValue("⚠ " + r.error);
      else if (r) sheet.getRange(rowNums[j], COLS.length + 1).clearContent();
    }
  } catch (err) {
    console.error("onSheetEdit failed: " + err); // never throw from a trigger
  } finally {
    lock.releaseLock();
  }
}

/** Menu: Liberty → Delete selected rows from admin (also reverses their stock effect). */
function onOpen() {
  SpreadsheetApp.getUi().createMenu("Liberty")
    .addItem("Delete selected rows from admin", "deleteSelectedFromAdmin")
    .addToUi();
}

function deleteSelectedFromAdmin() {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== TAB_NAME) { ui.alert("Open the " + TAB_NAME + " tab first."); return; }
  var range = sheet.getActiveRange();
  var first = Math.max(range.getRow(), 2);
  var last = range.getRow() + range.getNumRows() - 1;
  if (last < first) return;
  if (last - first + 1 > 25) { ui.alert("Select at most 25 rows at a time."); return; }
  var ids = sheet.getRange(first, 1, last - first + 1, 1).getValues()
    .map(function (r) { return String(r[0]); }).filter(String);
  if (ui.alert("Delete " + (last - first + 1) + " row(s) from the sheet AND admin? Stock will be adjusted.",
      ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  if (ids.length) callAdmin({ action: "delete", ids: ids });
  sheet.deleteRows(first, last - first + 1);
}
