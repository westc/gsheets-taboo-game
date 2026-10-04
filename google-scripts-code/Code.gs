function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Taboo')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * Creates a custom menu when the Google Sheet is opened.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Taboo')
    .addItem('Verify Password', 'verifyPasswordFromMenu')
    .addItem('Change Password', 'changePasswordFromMenu')
    .addToUi();
}

/**
 * Helper to compute SHA-256 hash combined with a salt.
 */
function computeHash_(password, salt) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + salt, Utilities.Charset.UTF_8);
  var output = "";
  for (var i = 0; i < rawHash.length; i++) {
    var byteValue = rawHash[i];
    if (byteValue < 0) byteValue += 256;
    var byteString = byteValue.toString(16);
    if (byteString.length == 1) byteString = "0" + byteString;
    output += byteString;
  }
  return output;
}

/**
 * Initializes or updates the password with a random salt.
 */
function setPassword_(password) {
  var salt = Math.floor(Math.random() * 1000000000).toString();
  var hash = computeHash_(password, salt);
  var props = PropertiesService.getScriptProperties();
  props.setProperties({
    'passwordHash': hash,
    'passwordSalt': salt
  });
}

/**
 * Verifies password entered from the Sheet menu.
 */
function verifyPasswordFromMenu() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt('Verify Password', 'Enter the editor password:', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() == ui.Button.OK) {
    var password = response.getResponseText();
    if (checkPassword_(password)) {
      ui.alert('Success', 'Password is correct!', ui.ButtonSet.OK);
    } else {
      ui.alert('Error', 'Incorrect password.', ui.ButtonSet.OK);
    }
  }
}

/**
 * Changes password from the Sheet menu.
 */
function changePasswordFromMenu() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt('Change Password', 'Enter the new editor password:', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() == ui.Button.OK) {
    var password = response.getResponseText();
    if (password) {
      setPassword_(password);
      ui.alert('Success', 'Password has been successfully changed!', ui.ButtonSet.OK);
    } else {
      ui.alert('Error', 'Password cannot be empty.', ui.ButtonSet.OK);
    }
  }
}

function checkPassword_(password) {
  var props = PropertiesService.getScriptProperties();
  var storedHash = props.getProperty('passwordHash');
  var salt = props.getProperty('passwordSalt');
  
  // Default fallback password if none is set yet
  if (!storedHash || !salt) {
    setPassword_('admin');
    storedHash = props.getProperty('passwordHash');
    salt = props.getProperty('passwordSalt');
  }
  
  var inputHash = computeHash_(password, salt);
  return inputHash === storedHash;
}

/**
 * Called from frontend when opening the editor. Returns the hash if correct.
 */
function verifyEditorPassword(password) {
  var props = PropertiesService.getScriptProperties();
  var storedHash = props.getProperty('passwordHash');
  var salt = props.getProperty('passwordSalt');
  
  if (!storedHash || !salt) {
    setPassword_('admin');
    storedHash = props.getProperty('passwordHash');
    salt = props.getProperty('passwordSalt');
  }
  
  var inputHash = computeHash_(password, salt);
  if (inputHash === storedHash) {
    return storedHash;
  } else {
    throw new Error("Incorrect password.");
  }
}

/**
 * Checks if the passed client hash matches the stored password hash.
 */
function checkHashAccess_(clientHash) {
  var props = PropertiesService.getScriptProperties();
  var storedHash = props.getProperty('passwordHash');
  if (!storedHash || clientHash !== storedHash) {
    throw new Error("Access denied. Invalid session or incorrect credentials.");
  }
}

function getCards() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cards');
  var data = sheet.getDataRange().getValues();
  var cards = [];
  
  for (var i = 1; i < data.length; i++) {
    var word = data[i][0];
    var tabooStr = data[i][1];
    var difficulty = parseInt(data[i][2]) || 1; 
    var deck = String(data[i][3] || 'Standard');
    
    if (word) {
      var tabooList = tabooStr ? String(tabooStr).split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [];
      cards.push({
        word: word,
        taboo: tabooList,
        difficulty: difficulty,
        deck: deck
      });
    }
  }
  return cards;
}

function deleteCard(word, deck, passwordHash) {
  checkHashAccess_(passwordHash); // Protect backend write operation
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cards");
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString().toLowerCase() === word.toString().toLowerCase() && 
        String(data[i][3]) === String(deck)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  throw new Error("Card not found");
}

function saveCard(cardData, passwordHash) {
  checkHashAccess_(passwordHash); // Protect backend write operation
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cards");
  var data = sheet.getDataRange().getValues();
  
  var targetRow = -1;
  if (cardData.originalWord) {
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString().toLowerCase() === cardData.originalWord.toString().toLowerCase() &&
          String(data[i][3]) === String(cardData.deck)) {
        targetRow = i + 1;
        break;
      }
    }
  }

  var tabooStr = cardData.taboo.join(", ");

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1).setValue(cardData.word);
    sheet.getRange(targetRow, 2).setValue(tabooStr);
    sheet.getRange(targetRow, 3).setValue(cardData.difficulty);
    sheet.getRange(targetRow, 4).setValue(cardData.deck);
  } else {
    sheet.appendRow([cardData.word, tabooStr, cardData.difficulty, cardData.deck]);
  }
}
