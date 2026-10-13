/**
 * RINCEL | Registro del Sorteo de Inauguración — Google Apps Script
 *
 * Recibe registros SOLO desde la Cloudflare Pages Function (verificados con un secreto compartido),
 * revisa duplicados en la pestaña del Google Form y en «Registros Web», y agrega filas nuevas.
 *
 * Garantías:
 *  - Nunca borra, edita ni reordena filas existentes: solo escribe en la primera fila vacía de «Registros Web».
 *  - Nunca escribe en «Respuestas de formulario 1» (solo la lee).
 *  - No expone ninguna forma de leer o descargar participantes (doGet no devuelve datos).
 *  - Usa LockService para que dos envíos simultáneos del mismo número no generen dos registros.
 *
 * Propiedades del script (Configuración del proyecto → Propiedades del script):
 *  - SHARED_SECRET   (obligatoria, 32+ caracteres) el mismo valor que APPS_SCRIPT_SECRET en Cloudflare.
 *
 * El script debe crearse DESDE la hoja (Extensiones → Apps Script) para quedar vinculado a ella;
 * así solo pide permiso sobre ese archivo (alcance spreadsheets.currentonly).
 */

var FORM_SHEET_NAME = 'Respuestas de formulario 1';
var FORM_PHONE_COLUMN = 3; // C: Número de celular (10 dígitos)
var WEB_SHEET_NAME = 'Registros Web';
var WEB_PHONE_COLUMN = 3;
var WEB_HEADERS = [
  'Marca temporal',
  'Nombre completo',
  'Número de celular (10 dígitos)',
  'Acepta bases y aviso de privacidad',
  'Consentimiento promociones WhatsApp/SMS',
  'Estado de participación',
  'Origen',
  'ID de registro'
];
var TIMEZONE = 'America/Monterrey';
var LOCK_WAIT_MS = 20000;

var NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;

function doPost(e) {
  try {
    var body = parseBody_(e);
    if (!body) return respond_({ ok: false, code: 'bad_request' });
    if (!secretMatches_(body.secret)) return respond_({ ok: false, code: 'unauthorized' });

    var data = sanitize_(body);
    if (!data) return respond_({ ok: false, code: 'invalid' });

    return respond_(registerWithLock_(data));
  } catch (err) {
    // No se registran datos personales en el log.
    console.error('registro_error: ' + (err && err.message ? err.message : 'desconocido'));
    return respond_({ ok: false, code: 'server_error' });
  }
}

/** No hay lectura pública de datos. */
function doGet() {
  return respond_({ ok: false, code: 'method_not_allowed' });
}

function registerWithLock_(data) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) return { ok: false, code: 'busy' };
  try {
    var ss = getSpreadsheet_();
    var webSheet = ss.getSheetByName(WEB_SHEET_NAME);
    if (!webSheet) return { ok: false, code: 'not_configured' };

    if (phoneExists_(ss.getSheetByName(FORM_SHEET_NAME), FORM_PHONE_COLUMN, data.telefono) ||
        phoneExists_(webSheet, WEB_PHONE_COLUMN, data.telefono)) {
      return { ok: false, code: 'duplicate' };
    }

    var id = Utilities.getUuid();
    var row = [
      Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm:ss'),
      data.nombre,
      data.telefono,
      'Sí',
      data.aceptaPromociones ? 'Sí' : 'No',
      'Registrado',
      'Web',
      id
    ];

    var target = webSheet.getLastRow() + 1;
    var range = webSheet.getRange(target, 1, 1, row.length);
    range.setNumberFormat('@'); // todo como texto: conserva ceros y evita fórmulas
    range.setValues([row]);
    SpreadsheetApp.flush();

    // Confirma que la fila realmente quedó guardada antes de responder "created".
    var saved = webSheet.getRange(target, 1, 1, row.length).getValues()[0];
    if (String(saved[7]) !== id || normalizePhone_(saved[2]) !== data.telefono) {
      return { ok: false, code: 'write_failed' };
    }
    return { ok: true, code: 'created' };
  } finally {
    lock.releaseLock();
  }
}

function phoneExists_(sheet, column, phone) {
  if (!sheet) return false;
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var values = sheet.getRange(2, column, last - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (normalizePhone_(values[i][0]) === phone) return true;
  }
  return false;
}

/** Igual que normalizePhone en src/lib/validation.ts, tolerante a números guardados como Number. */
function normalizePhone_(value) {
  var s = String(value === null || value === undefined ? '' : value).replace(/[\s\-().]/g, '');
  if (/^\+?52\d{10}$/.test(s)) s = s.replace(/^\+?52/, '');
  return s;
}

function normalizeName_(value) {
  return String(value).normalize('NFC').replace(/\s+/g, ' ').trim();
}

/** Validación de servidor (mismas reglas que src/lib/validation.ts). */
function sanitize_(body) {
  if (typeof body.nombre !== 'string' || typeof body.telefono !== 'string') return null;
  if (body.aceptaBases !== true || typeof body.aceptaPromociones !== 'boolean') return null;

  var nombre = normalizeName_(body.nombre);
  var words = nombre.split(' ').filter(function (w) { return /\p{L}/u.test(w); });
  if (nombre.length < 5 || nombre.length > 80 || words.length < 2 || !NAME_PATTERN.test(nombre)) return null;

  var telefono = normalizePhone_(body.telefono);
  if (!/^\d{10}$/.test(telefono)) return null;

  return { nombre: nombre, telefono: telefono, aceptaPromociones: body.aceptaPromociones };
}

function parseBody_(e) {
  if (!e || !e.postData || typeof e.postData.contents !== 'string') return null;
  if (e.postData.contents.length > 4096) return null;
  try {
    var parsed = JSON.parse(e.postData.contents);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (err) {
    return null;
  }
}

function secretMatches_(provided) {
  var expected = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
  if (!expected || expected.length < 32 || typeof provided !== 'string') return false;
  // Comparación en tiempo constante
  var a = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, provided);
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, expected);
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function getSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function respond_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * EJECUTAR UNA SOLA VEZ, manualmente y con autorización (FASE 3).
 * Crea la pestaña «Registros Web» con encabezados si no existe. No toca ninguna otra pestaña.
 */
function setupRegistrosWeb() {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(WEB_SHEET_NAME);
  if (sheet) {
    console.log('La pestaña «' + WEB_SHEET_NAME + '» ya existe; no se modificó.');
    return;
  }
  sheet = ss.insertSheet(WEB_SHEET_NAME, ss.getSheets().length);
  sheet.getRange(1, 1, 1, WEB_HEADERS.length).setValues([WEB_HEADERS]).setFontWeight('bold');
  sheet.getRange(1, 1, sheet.getMaxRows(), WEB_HEADERS.length).setNumberFormat('@');
  sheet.setFrozenRows(1);
  console.log('Pestaña «' + WEB_SHEET_NAME + '» creada.');
}

/**
 * Diagnóstico de solo lectura (FASE 3): cuenta filas y duplicados sin mostrar datos personales.
 */
function diagnostico() {
  var ss = getSpreadsheet_();
  [FORM_SHEET_NAME, WEB_SHEET_NAME].forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) { console.log(name + ': no existe'); return; }
    var last = sheet.getLastRow();
    var phones = last < 2 ? [] : sheet.getRange(2, 3, last - 1, 1).getValues().map(function (r) { return normalizePhone_(r[0]); });
    var valid = phones.filter(function (p) { return /^\d{10}$/.test(p); });
    var unique = {};
    valid.forEach(function (p) { unique[p] = true; });
    console.log(name + ': ' + phones.length + ' filas, ' + valid.length + ' con 10 dígitos, ' +
      Object.keys(unique).length + ' números únicos, ' + (phones.length - valid.length) + ' con formato distinto.');
  });
}
