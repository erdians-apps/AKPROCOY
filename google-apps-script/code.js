/**
 * ============================================================================
 * GOOGLE APPS SCRIPT - AKUNTANSI PRO ENTERPRISE BACKEND
 * ============================================================================
 *
 * PANDUAN SETUP LENGKAP:
 * ============================================================================
 *
 * LANGKAH 1: BUAT GOOGLE SPREADSHEET
 * ------------------------------------------
 * 1. Buka https://sheets.google.com dan buat Spreadsheet baru
 * 2. Beri nama: "Akuntansi Pro Enterprise - Database"
 * 3. Buat sheet-sheet berikut (tab di bagian bawah):
 *    - "coa"             : Chart of Accounts
 *    - "jurnal"          : Jurnal Umum
 *    - "jurnal_lines"   : Baris-baris jurnal (detail debit/kredit)
 *    - "mutasi"          : Mutasi Kas/Bank
 *    - "kontak"          : Kontak Bisnis (Pelanggan & Supplier)
 *    - "aset"            : Aset Tetap
 *    - "kategori_mutasi" : Kategori Mutasi
 *    - "kategori_akun"   : Kategori Akun
 *    - "hutang"          : Hutang Usaha (AP)
 *    - "piutang"         : Piutang Usaha (AR)
 *
 * 4. Pada setiap sheet, baris pertama (row 1) harus berisi HEADER kolom:
 *
 *    Sheet "coa":             kode | nama | tipe | kategori2 | saldoNormal
 *    Sheet "jurnal":          id | tgl | desc
 *    Sheet "jurnal_lines":    jurnalId | kodeAkun | debit | kredit
 *    Sheet "mutasi":          id | tgl | desc | akunKas | katTransaksi | tipe | nominal | status
 *    Sheet "kontak":          id | no | nama | alamat | telp | tipe
 *    Sheet "aset":            id | jurnalRef | masaManfaat | tipeMasa
 *    Sheet "kategori_mutasi": id | nama | iconName
 *    Sheet "kategori_akun":   id | nama | tipe
 *    Sheet "hutang":          id | tgl | kontakId | deskripsi | nominalTotal | nominalTerbayar | status
 *    Sheet "piutang":         id | tgl | kontakId | deskripsi | nominalTotal | nominalTerbayar | status
 *
 * LANGKAH 2: BUKA APPS SCRIPT EDITOR
 * ------------------------------------------
 * 1. Di Spreadsheet, klik menu: Extensions > Apps Script
 * 2. Hapus semua kode default di file "Code.gs"
 * 3. Copy-paste SELURUH isi file ini ke dalam "Code.gs"
 * 4. Klik ikon Save (floppy disk) di toolbar
 *
 * LANGKAH 3: DEPLOY SEBAGAI WEB APP
 * ------------------------------------------
 * 1. Klik "Deploy" > "New deployment"
 * 2. Klik gear ikon > pilih "Web app"
 * 3. Konfigurasi:
 *    - Description: "Akuntansi Pro API v1"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 4. Klik "Deploy" > Authorize access
 * 5. Salin URL Web App (format: https://script.google.com/macros/s/XXXXXX/exec)
 *
 * LANGKAH 4: KONFIGURASI FRONTEND
 * ------------------------------------------
 * 1. Buka file .env di project Next.js
 * 2. Tambahkan: NEXT_PUBLIC_GSHEET_URL=https://script.google.com/macros/s/XXXXXX/exec
 * 3. Restart dev server Next.js
 *
 * LANGKAH 5: UPDATE DEPLOYMENT
 * ------------------------------------------
 * 1. Buka Apps Script Editor > "Deploy" > "Manage deployments"
 * 2. Klik ikon pensil > ubah versi ke "New version"
 * 3. Klik "Deploy" (URL tetap sama)
 * ============================================================================
 */

function getSheetData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      var val = data[i][j];
      if (val instanceof Date) val = val.toISOString().split('T')[0];
      row[headers[j]] = val;
    }
    rows.push(row);
  }
  return rows;
}

function replaceSheetData(sheetName, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  sheet.clearContents();
  if (!data || data.length === 0) return { success: true, message: 'Sheet cleared' };
  var headers = Object.keys(data[0]);
  var rows = [headers];
  for (var i = 0; i < data.length; i++) {
    var row = [];
    for (var j = 0; j < headers.length; j++) {
      row.push(data[i][headers[j]] !== undefined ? data[i][headers[j]] : '');
    }
    rows.push(row);
  }
  var range = sheet.getRange(1, 1, rows.length, headers.length);
  range.setValues(rows);
  return { success: true, message: 'Data replaced', rows: data.length };
}

var SHEET_ACTIONS = [
  'coa', 'jurnal', 'jurnal_lines', 'mutasi', 'kontak',
  'aset', 'kategori_mutasi', 'kategori_akun', 'hutang', 'piutang'
];

function doGet(e) {
  var action = e.parameter.action || '';
  var result;
  try {
    if (action === 'all') {
      var allData = {};
      for (var i = 0; i < SHEET_ACTIONS.length; i++) {
        allData[SHEET_ACTIONS[i]] = getSheetData(SHEET_ACTIONS[i]);
      }
      result = { success: true, data: allData };
    } else if (action === 'ping') {
      result = { success: true, message: 'Akuntansi Pro API is running', timestamp: new Date().toISOString() };
    } else if (SHEET_ACTIONS.indexOf(action) >= 0) {
      result = { success: true, data: getSheetData(action) };
    } else {
      result = { success: false, error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Invalid JSON body' })).setMimeType(ContentService.MimeType.JSON);
  }
  var action = body.action || '';
  var payload = body.payload || [];
  var result;
  try {
    if (action === 'sync_all') {
      var syncResult = {};
      for (var i = 0; i < SHEET_ACTIONS.length; i++) {
        var key = SHEET_ACTIONS[i];
        if (payload[key]) syncResult[key] = replaceSheetData(key, payload[key]);
      }
      result = { success: true, data: syncResult };
    } else if (SHEET_ACTIONS.indexOf(action) >= 0) {
      result = replaceSheetData(action, payload);
    } else {
      result = { success: false, error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
