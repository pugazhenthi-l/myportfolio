/**
 * Newsletter subscribers -> Google Sheet
 *
 * Paste this into the sheet's Apps Script editor (Extensions > Apps Script).
 * The Cloudflare Worker (src/worker.js) POSTs each brand-new subscriber here.
 *
 * One-time setup (README.md has the full steps):
 *   1. Project Settings > Script properties > add TOKEN = the same random value
 *      you store in Cloudflare as the SHEETS_TOKEN secret.
 *   2. Run setup() once from the editor and allow access when Google asks.
 *   3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
 *      Copy the web app URL into Cloudflare as the SHEETS_WEBHOOK_URL secret.
 *
 * The secret token is never written in this file, so it is safe to keep in GitHub.
 */

const SHEET_NAME = 'Subscribers';
const HEADERS = ['Signed up (IST)', 'Email', 'Form', 'Country'];

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone('Asia/Kolkata');
  const sh = sheet_();
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  if (!PropertiesService.getScriptProperties().getProperty('TOKEN')) {
    throw new Error('Add the TOKEN script property first (Project Settings > Script properties).');
  }
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'bad_json' });
  }

  const token = PropertiesService.getScriptProperties().getProperty('TOKEN');
  if (!token || data.token !== token) return json_({ ok: false, error: 'forbidden' });

  const email = clean_(data.email);
  if (!email) return json_({ ok: false, error: 'no_email' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet_().appendRow([new Date(), email, clean_(data.source), clean_(data.country)]);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    const first = ss.getSheets()[0];
    // Reuse the blank first tab of a new spreadsheet instead of leaving an empty "Sheet1".
    sh = (ss.getSheets().length === 1 && first.getLastRow() === 0) ? first.setName(SHEET_NAME) : ss.insertSheet(SHEET_NAME);
  }
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  return sh;
}

// Stops a value like "=HYPERLINK(...)" from being treated as a formula.
function clean_(value) {
  const s = String(value == null ? '' : value).trim().slice(0, 254);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
