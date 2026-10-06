/**
 * Taboo backend: a JSON API for the GitHub Pages frontend.
 *
 * Deploy as a web app with "Execute as: Me" and "Who has access: Anyone".
 *   GET  ?action=cards                          -> all cards + the OAuth Client ID (public)
 *   POST {action, idToken, ...} as text/plain   -> whoami / saveCard / deleteCard (signed in)
 *
 * Writes require a Google ID token issued for our OAuth Client ID, and the
 * token's email must be listed on the "Editors" sheet (managed from the Taboo menu).
 */

var CARDS_SHEET = 'Cards';
var EDITORS_SHEET = 'Editors';
var CLIENT_ID_PROP = 'OAUTH_CLIENT_ID';
var MAX_TABOO_WORDS = 5;

// ---------------------------------------------------------------------------
// Web app API
// ---------------------------------------------------------------------------

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'cards';
  try {
    if (action === 'cards') {
      return json_({ ok: true, cards: getCards_(), clientId: getClientId_() });
    }
    throw apiError_('BAD_REQUEST', 'Unknown action: ' + action);
  } catch (err) {
    return json_({ ok: false, code: err.code || 'SERVER', error: err.message });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var user = verifyIdToken_(body.idToken);
    var isEditor = isEditor_(user.email);

    if (body.action === 'whoami') {
      return json_({ ok: true, email: user.email, isEditor: isEditor });
    }
    if (!isEditor) {
      throw apiError_('FORBIDDEN', user.email + ' is not allowed to edit cards.');
    }

    switch (body.action) {
      case 'saveCard':
        saveCard_(body.card, user.email);
        break;
      case 'deleteCard':
        deleteCard_(body.word, body.deck);
        break;
      default:
        throw apiError_('BAD_REQUEST', 'Unknown action: ' + body.action);
    }
    return json_({ ok: true, cards: getCards_() });
  } catch (err) {
    return json_({ ok: false, code: err.code || 'SERVER', error: err.message });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function apiError_(code, message) {
  var err = new Error(message);
  err.code = code;
  return err;
}

// ---------------------------------------------------------------------------
// Authentication (Google ID tokens from Google Identity Services)
// ---------------------------------------------------------------------------

function getClientId_() {
  return PropertiesService.getScriptProperties().getProperty(CLIENT_ID_PROP) || '';
}

/**
 * Validates a Google ID token and returns {email, name}.
 * Successful checks are cached briefly so each save doesn't need a round trip to Google.
 */
function verifyIdToken_(idToken) {
  if (!idToken) throw apiError_('AUTH', 'Please sign in.');

  var clientId = getClientId_();
  if (!clientId) {
    throw apiError_('NOT_CONFIGURED', 'The OAuth Client ID has not been set. Use Taboo > Set OAuth Client ID in the Google Sheet.');
  }

  var cache = CacheService.getScriptCache();
  var cacheKey = 'idtoken_' + sha256Hex_(idToken);
  var cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  var res = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
    { muteHttpExceptions: true }
  );
  if (res.getResponseCode() !== 200) {
    throw apiError_('AUTH', 'Your sign-in is invalid or has expired. Please sign in again.');
  }

  var info = JSON.parse(res.getContentText());
  var nowSec = Math.floor(Date.now() / 1000);
  var exp = Number(info.exp);

  if (info.aud !== clientId) throw apiError_('AUTH', 'Sign-in was issued for a different app.');
  if (info.iss !== 'accounts.google.com' && info.iss !== 'https://accounts.google.com') {
    throw apiError_('AUTH', 'Sign-in was not issued by Google.');
  }
  if (!exp || exp <= nowSec) throw apiError_('AUTH', 'Your sign-in has expired. Please sign in again.');
  if (!info.email || String(info.email_verified) !== 'true') {
    throw apiError_('AUTH', 'Your Google account email is not verified.');
  }

  var user = { email: String(info.email).toLowerCase(), name: info.name || '' };
  var ttl = Math.min(exp - nowSec, 600);
  if (ttl > 0) cache.put(cacheKey, JSON.stringify(user), ttl);
  return user;
}

function sha256Hex_(text) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  var output = '';
  for (var i = 0; i < rawHash.length; i++) {
    var byteValue = rawHash[i];
    if (byteValue < 0) byteValue += 256;
    var byteString = byteValue.toString(16);
    if (byteString.length == 1) byteString = '0' + byteString;
    output += byteString;
  }
  return output;
}

// ---------------------------------------------------------------------------
// Editors (who may change cards)
// ---------------------------------------------------------------------------

/**
 * Returns the Editors sheet, creating it (seeded with the current user) if needed.
 */
function getEditorsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(EDITORS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(EDITORS_SHEET);
    sheet.appendRow(['Email', 'Name', 'Added By', 'Added On']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    var me = Session.getEffectiveUser().getEmail();
    if (me) sheet.appendRow([asText_(me.toLowerCase()), 'Owner', asText_(me.toLowerCase()), new Date()]);
  }
  return sheet;
}

function listEditors_() {
  var data = getEditorsSheet_().getDataRange().getValues();
  var editors = [];
  for (var i = 1; i < data.length; i++) {
    var email = String(data[i][0] || '').trim().toLowerCase();
    if (!email) continue;
    editors.push({
      email: email,
      name: String(data[i][1] || ''),
      addedBy: String(data[i][2] || ''),
      addedOn: data[i][3] instanceof Date ? data[i][3].toISOString() : String(data[i][3] || '')
    });
  }
  return editors;
}

function isEditor_(email) {
  email = String(email || '').toLowerCase();
  return listEditors_().some(function(editor) { return editor.email === email; });
}

// ---------------------------------------------------------------------------
// Sheet menu + admin dialog
// ---------------------------------------------------------------------------

/**
 * Creates a custom menu when the Google Sheet is opened.
 */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Taboo')
    .addItem('Manage editors…', 'showEditorsDialog')
    .addSeparator()
    .addItem('Set OAuth Client ID…', 'setClientIdFromMenu')
    .addItem('Check setup', 'checkSetupFromMenu')
    .addToUi();
}

function showEditorsDialog() {
  getEditorsSheet_();
  var html = HtmlService.createHtmlOutputFromFile('Admin').setWidth(440).setHeight(560);
  SpreadsheetApp.getUi().showModalDialog(html, 'Taboo editors');
}

// The admin* functions are called from Admin.html. They run as the person using the
// menu, so they can only change the Editors sheet if that person can edit the spreadsheet.

function adminListEditors() {
  return listEditors_();
}

function adminAddEditor(email, name) {
  email = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
  if (isEditor_(email)) throw new Error(email + ' is already an editor.');

  var addedBy = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  getEditorsSheet_().appendRow([asText_(email), asText_(name || ''), asText_(addedBy), new Date()]);
  return listEditors_();
}

function adminRemoveEditor(email) {
  email = String(email || '').trim().toLowerCase();
  var sheet = getEditorsSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0] || '').trim().toLowerCase() === email) sheet.deleteRow(i + 1);
  }
  return listEditors_();
}

function setClientIdFromMenu() {
  var ui = SpreadsheetApp.getUi();
  var current = getClientId_();
  var response = ui.prompt(
    'Set OAuth Client ID',
    'Paste the Web application Client ID from Google Cloud Console (ends in .apps.googleusercontent.com).' +
      (current ? '\n\nCurrent: ' + current : ''),
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() != ui.Button.OK) return;

  var clientId = response.getResponseText().trim();
  if (!/\.apps\.googleusercontent\.com$/.test(clientId)) {
    ui.alert('Error', 'That does not look like an OAuth Client ID.', ui.ButtonSet.OK);
    return;
  }
  var props = PropertiesService.getScriptProperties();
  props.setProperty(CLIENT_ID_PROP, clientId);
  // Remove settings left over from the old shared-password login.
  props.deleteProperty('passwordHash');
  props.deleteProperty('passwordSalt');
  ui.alert('Success', 'OAuth Client ID saved.', ui.ButtonSet.OK);
}

function checkSetupFromMenu() {
  var ui = SpreadsheetApp.getUi();
  var cardsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CARDS_SHEET);
  var lines = [
    'OAuth Client ID: ' + (getClientId_() || 'NOT SET (use Taboo > Set OAuth Client ID)'),
    'Cards sheet: ' + (cardsSheet ? getCards_().length + ' cards' : 'MISSING (create a sheet named "Cards")'),
    'Editors: ' + listEditors_().map(function(e) { return e.email; }).join(', '),
    'Web app URL: ' + (ScriptApp.getService().getUrl() || 'not deployed yet')
  ];
  ui.alert('Taboo setup', lines.join('\n\n'), ui.ButtonSet.OK);
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

function getCardsSheet_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CARDS_SHEET);
  if (!sheet) throw apiError_('SERVER', 'The spreadsheet has no "Cards" sheet.');
  return sheet;
}

function getCards_() {
  var data = getCardsSheet_().getDataRange().getValues();
  var cards = [];

  for (var i = 1; i < data.length; i++) {
    var word = data[i][0];
    var tabooStr = data[i][1];
    var difficulty = parseInt(data[i][2]) || 1;
    var deck = String(data[i][3] || 'Standard');

    if (String(word).trim() !== '') {
      var tabooList = tabooStr ? String(tabooStr).split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [];
      cards.push({
        word: String(word),
        taboo: tabooList,
        difficulty: difficulty,
        deck: deck
      });
    }
  }
  return cards;
}

function findCardRow_(data, word, deck) {
  var target = String(word).toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === target && String(data[i][3] || 'Standard') === String(deck)) {
      return i + 1;
    }
  }
  return -1;
}

/**
 * Stores user text exactly as typed. Without the leading apostrophe, Sheets reads values
 * the way it reads typing: "=SUM(1)" becomes a formula, "FALSE" a boolean, "007" the
 * number 7 and "3/4" a date. The apostrophe is not part of the stored value.
 */
function asText_(value) {
  return "'" + String(value).trim();
}

function deleteCard_(word, deck) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getCardsSheet_();
    var row = findCardRow_(sheet.getDataRange().getValues(), word, deck);
    if (row < 0) throw apiError_('NOT_FOUND', 'Card not found. It may have already been deleted.');
    sheet.deleteRow(row);
  } finally {
    lock.releaseLock();
  }
}

function saveCard_(card, editorEmail) {
  card = card || {};
  var word = String(card.word || '').trim();
  var deck = String(card.deck || '').trim();
  var difficulty = parseInt(card.difficulty);
  var taboo = (Array.isArray(card.taboo) ? card.taboo : [])
    .map(function(s) { return String(s).replace(/,/g, ' ').replace(/\s+/g, ' ').trim(); })
    .filter(Boolean);

  if (!word) throw apiError_('BAD_REQUEST', 'A target word is required.');
  if (!deck) throw apiError_('BAD_REQUEST', 'A deck name is required.');
  if (!(difficulty >= 1 && difficulty <= 3)) throw apiError_('BAD_REQUEST', 'Difficulty must be 1, 2 or 3.');
  if (taboo.length > MAX_TABOO_WORDS) throw apiError_('BAD_REQUEST', 'A card can have at most ' + MAX_TABOO_WORDS + ' taboo words.');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getCardsSheet_();
    var data = sheet.getDataRange().getValues();

    var targetRow = card.originalWord ? findCardRow_(data, card.originalWord, deck) : -1;
    var existingRow = findCardRow_(data, word, deck);
    if (existingRow > 0 && existingRow !== targetRow) {
      throw apiError_('DUPLICATE', '"' + word + '" already exists in the ' + deck + ' deck.');
    }

    var rowValues = [asText_(word), asText_(taboo.join(', ')), difficulty, asText_(deck)];

    // Record who changed the card in columns E/F, unless those columns already hold something else.
    var auditHeader = sheet.getRange(1, 5, 1, 2).getValues()[0];
    var auditFree = auditHeader[0] === '' && auditHeader[1] === '';
    if (auditFree) sheet.getRange(1, 5, 1, 2).setValues([['Updated By', 'Updated At']]);
    if (auditFree || (auditHeader[0] === 'Updated By' && auditHeader[1] === 'Updated At')) {
      rowValues.push(asText_(editorEmail), new Date());
    }

    if (targetRow > 0) {
      sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
  } finally {
    lock.releaseLock();
  }
}
