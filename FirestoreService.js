/**
 * FirestoreService.js
 * Core Firestore connection helper used by all Firestore service modules.
 *
 * Requires: FirestoreApp library (script ID: 1VUSl4b1r1eoNcRWotZM3e87ybkVxJyTGKzCFzBRv7R5k7BYbkx5eVkM)
 * Credentials stored in Script Properties as FIRESTORE_SERVICE_ACCOUNT_JSON.
 */

function getFirestore() {
  var creds = JSON.parse(
    PropertiesService.getScriptProperties().getProperty('FIRESTORE_SERVICE_ACCOUNT_JSON')
  );
  return FirestoreApp.getFirestore(creds.client_email, creds.private_key, creds.project_id);
}

function testFirestoreConnection() {
  try {
    var db = getFirestore();
    var query = db.collection('sessions').limit(1).get();
    Logger.log('SUCCESS: Firestore connection working!');
    Logger.log('Sessions collection size: ' + query.size);
    return { success: true };
  } catch (error) {
    Logger.log('ERROR: ' + error.message);
    return { success: false, message: error.message };
  }
}
