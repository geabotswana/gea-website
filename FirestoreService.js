/**
 * FirestoreService.js
 * Core Firestore connection helper used by all Firestore service modules.
 *
 * Requires: FirestoreApp library (ID: 1VUSl4b1r1eoNcRWotZM3e87ygkxvXltOgyDZhixqncz9lQ3MjfT1iKFw)
 * Credentials stored in Script Properties as FIRESTORE_SERVICE_ACCOUNT_JSON.
 *
 * FirestoreApp API uses path-based access, not .collection().doc() chaining:
 *   Read:   db.getDocument('collection/docId')
 *   Write:  db.createDocument('collection/docId', fields)
 *   Update: db.updateDocument('collection/docId', fields)
 *   Delete: db.deleteDocument('collection/docId')
 *   Query:  db.query('collection').where('field', '==', value).execute()
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
    var results = db.query('sessions').execute();
    Logger.log('SUCCESS: Firestore connection working!');
    Logger.log('Sessions returned: ' + results.length);
    return { success: true };
  } catch (error) {
    Logger.log('ERROR: ' + error.message);
    return { success: false, message: error.message };
  }
}
