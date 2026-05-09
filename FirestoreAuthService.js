/**
 * FirestoreAuthService.js
 * Firestore implementations for session and administrator management.
 * Used in hybrid mode: AuthService.js tries Firestore first, falls back to Sheets.
 *
 * Relies on helpers already defined in AuthService.js:
 *   _hashToken(token)    — SHA256 hex hash of token
 *   _generateToken()     — entropy-mixed token generator
 *   _sessionExpiry()     — Date object SESSION_TIMEOUT_HOURS from now
 */

// ─── Sessions ────────────────────────────────────────────────────────────────

function firestoreCreateSession(email, role) {
  var db        = getFirestore();
  var token     = _generateToken();
  var tokenHash = _hashToken(token);
  var now       = new Date();
  var expires   = _sessionExpiry();

  // Deactivate any existing active sessions for this user
  try {
    var existing = db.query('sessions').Where('email', '==', email).Where('active', '==', true).Execute();
    existing.forEach(function(doc) {
      db.updateDocument('sessions/' + doc.obj.token_hash, { active: false }, true);
    });
  } catch (e) {
    Logger.log('WARN firestoreCreateSession: could not deactivate old sessions: ' + e.message);
  }

  db.createDocument('sessions/' + tokenHash, {
    token_hash: tokenHash,
    email:      email,
    role:       role,
    created_at: now,
    expires_at: expires,
    active:     true
  });

  return token;
}

function firestoreValidateSession(token) {
  if (!token) return { valid: false };

  var db        = getFirestore();
  var tokenHash = _hashToken(token);

  try {
    var doc  = db.getDocument('sessions/' + tokenHash);
    var data = doc.obj;

    if (!data || !data.active) return { valid: false };

    var now     = new Date();
    var expires = new Date(data.expires_at);
    if (now > expires) {
      db.updateDocument('sessions/' + tokenHash, { active: false }, true);
      return { valid: false };
    }

    // Sliding window — refresh expiry on activity
    var newExpires = _sessionExpiry();
    db.updateDocument('sessions/' + tokenHash, { expires_at: newExpires }, true);

    return { valid: true, email: data.email, role: data.role };

  } catch (e) {
    // getDocument throws if document not found
    return { valid: false };
  }
}

function firestoreDeleteSession(token) {
  if (!token) return false;
  try {
    var tokenHash = _hashToken(token);
    getFirestore().updateDocument('sessions/' + tokenHash, { active: false }, true);
    return true;
  } catch (e) {
    Logger.log('ERROR firestoreDeleteSession: ' + e.message);
    return false;
  }
}

// ─── Administrators ───────────────────────────────────────────────────────────

function _firestoreNormalizeAdminEmail(email) {
  return String(email || '').toLowerCase().trim();
}

function _firestoreAdminDocToObj(doc) {
  var obj = doc && doc.obj ? doc.obj : doc;
  if (!obj) return null;
  if (obj.active === 'TRUE') obj.active = true;
  if (obj.active === 'FALSE') obj.active = false;
  return obj;
}

function firestoreGetAdministrator(email) {
  email = _firestoreNormalizeAdminEmail(email);
  if (!email) return null;
  try {
    var doc = getFirestore().getDocument('administrators/' + email);
    return _firestoreAdminDocToObj(doc);
  } catch (e) {
    return null;
  }
}

function firestoreGetAdministratorById(adminId) {
  if (!adminId) return null;
  try {
    var results = getFirestore()
      .query('administrators')
      .Where('admin_id', '==', adminId)
      .Execute();
    return results.length ? _firestoreAdminDocToObj(results[0]) : null;
  } catch (e) {
    Logger.log('ERROR firestoreGetAdministratorById: ' + e.message);
    return null;
  }
}

function firestoreListAdministrators() {
  try {
    var results = getFirestore().query('administrators').Execute();
    return results.map(function(doc) { return _firestoreAdminDocToObj(doc); }).filter(Boolean);
  } catch (e) {
    Logger.log('ERROR firestoreListAdministrators: ' + e.message);
    return [];
  }
}

function firestoreCreateAdministrator(email, firstName, lastName, role, passwordHash, adminId, createdBy) {
  email = _firestoreNormalizeAdminEmail(email);
  if (!email || !role || !passwordHash) throw new Error('Required fields missing');

  var db = getFirestore();

  // Check for existing — getDocument throws if not found, so treat throw as "doesn't exist"
  try {
    var existing = db.getDocument('administrators/' + email);
    if (existing.obj) return false;
  } catch (e) { /* doesn't exist — proceed */ }

  db.createDocument('administrators/' + email, {
    admin_id:       adminId || generateId('ADM'),
    email:          email,
    first_name:     firstName || '',
    last_name:      lastName || '',
    role:           role,
    password_hash:  passwordHash,
    active:         true,
    first_login_date: null,
    created_by:     createdBy || '',
    created_date:   new Date(),
    deactivated_by: null,
    deactivated_date: null,
    created_at:     new Date(),
    updated_at:     new Date()
  });

  Logger.log('Administrator created in Firestore: ' + email);
  return true;
}

function firestoreUpdateAdministrator(email, updates) {
  email = _firestoreNormalizeAdminEmail(email);
  if (!email) return false;
  updates.updated_at = new Date();
  getFirestore().updateDocument('administrators/' + email, updates, true);
  return true;
}

function firestoreUpdateAdministratorById(adminId, updates) {
  var admin = firestoreGetAdministratorById(adminId);
  if (!admin || !admin.email) return false;
  return firestoreUpdateAdministrator(admin.email, updates);
}

function firestoreSetAdministratorActive(adminId, active, callerEmail) {
  var updates = { active: active };
  if (active) {
    updates.deactivated_by = null;
    updates.deactivated_date = null;
  } else {
    updates.deactivated_by = callerEmail || '';
    updates.deactivated_date = new Date();
  }
  return firestoreUpdateAdministratorById(adminId, updates);
}

function firestoreResetAdministratorPassword(adminId, passwordHash) {
  return firestoreUpdateAdministratorById(adminId, { password_hash: passwordHash });
}

function firestoreMarkAdminFirstLogin(email) {
  var admin = firestoreGetAdministrator(email);
  if (!admin || admin.first_login_date) return false;
  return firestoreUpdateAdministrator(email, { first_login_date: new Date() });
}

// ─── Migration ────────────────────────────────────────────────────────────────

/**
 * One-time migration: copy all admin records from the Administrators sheet
 * into the Firestore administrators collection.
 *
 * Safe to re-run — skips any email already present in Firestore.
 * Run from GAS editor; check execution log for results.
 */
function migrateAdministratorsToFirestore() {
  var sheet   = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_ADMINISTRATORS);
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var db      = getFirestore();

  var created = 0, skipped = 0, errors = 0;

  for (var i = 1; i < data.length; i++) {
    var row = {};
    headers.forEach(function(col, idx) { row[col] = data[i][idx]; });

    var email = (row.email || '').toString().toLowerCase().trim();
    if (!email) continue;

    // Skip if already in Firestore
    try {
      var existing = db.getDocument('administrators/' + email);
      if (existing.obj) {
        Logger.log('SKIP (exists): ' + email);
        skipped++;
        continue;
      }
    } catch (e) { /* not found — proceed */ }

    try {
      db.createDocument('administrators/' + email, {
        email:              email,
        first_name:         row.first_name        || '',
        last_name:          row.last_name         || '',
        role:               row.role              || '',
        active:             row.active === true || String(row.active).toLowerCase() === 'true',
        password_hash:      row.password_hash     || '',
        created_by:         row.created_by        || '',
        created_date:       row.created_date ? new Date(row.created_date) : null,
        deactivated_by:     row.deactivated_by    || null,
        deactivated_date:   row.deactivated_date ? new Date(row.deactivated_date) : null,
        first_login_date:   row.first_login_date ? new Date(row.first_login_date) : null
      });
      Logger.log('CREATED: ' + email + ' (' + row.role + ')');
      created++;
    } catch (e) {
      Logger.log('ERROR ' + email + ': ' + e.message);
      errors++;
    }
  }

  Logger.log('Migration complete — created: ' + created + ', skipped: ' + skipped + ', errors: ' + errors);
}
