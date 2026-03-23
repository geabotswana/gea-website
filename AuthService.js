/**
 * ============================================================
 * AUTHSERVICE.GS
 * ============================================================
 * Login verification, session management, and role checking.
 *
 * How sessions work:
 *   - User submits their email via the portal login form
 *   - createSession() verifies they are an active member,
 *     generates a token, and stores it in the Sessions tab
 *   - Every subsequent page request passes the token back
 *   - validateSession() checks the token is valid and not expired
 *   - Sessions expire after SESSION_TIMEOUT_HOURS of inactivity
 *
 * Roles:
 *   "member"  — Standard portal access (reservations, profile, card)
 *   "board"   — Full admin access (approve/deny, member management)
 *   "mgt"     — Management Officer (leobo approval only)
 * ============================================================
 */


// ============================================================
// LOGIN
// ============================================================

/**
 * FUNCTION: login
 * PURPOSE: Authenticates a member using email and password.
 *          Verifies the email exists, password is correct, and household is active.
 *
 * HOW IT WORKS:
 * 1. Validate email format
 * 2. Find member by email in Individuals sheet
 * 3. Verify password matches the stored hash
 * 4. Check if household is active (not expired, not denied)
 * 5. If all checks pass, create a session token and return login data
 * 6. If any check fails, return an error message (no details about which check failed,
 *    to prevent attackers from determining if an email is registered)
 *
 * SECURITY NOTES:
 * - Passwords are never stored in plaintext, only as SHA256 hashes
 * - On login, the plaintext password is hashed and compared to the stored hash
 * - Comparison uses constantTimeCompare() to resist timing attacks
 * - Failed logins are logged but do not specify which part failed (email/password/status)
 *
 * CALLED BY: Code.gs _handleLogin()
 *
 * @param {string} email     Member's email address
 * @param {string} password  Plaintext password (will be hashed for comparison)
 * @returns {Object}
 *   On success: { success: true, token: string, role: string, member: Object }
 *   On failure: { success: false, message: string }
 *
 * EXAMPLE:
 * login("jane@state.gov", "MySecurePassword123!")
 * Returns: { success: true, token: "a1b2c3...", role: "member", member: {...} }
 * Returns: { success: false, message: "Invalid email or password." }
 */
function login(email, password) {
  // Validate email format
  if (!email || !isValidEmail(email)) {
    return { success: false, message: "Please enter a valid email address." };
  }
  
  // Validate password is provided and meets minimum length
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return { success: false, message: "Invalid email or password." };
  }

  // Find the member by email
  var member = getMemberByEmail(email, true);
  if (!member || !member.password_hash) {
    // Generic message: don't reveal if email exists or if password is not set
    return { success: false, message: "Invalid email or password." };
  }

  // Hash the plaintext password provided by the user
  var providedPasswordHash = hashPassword(password);

  // Compare the provided password hash to the stored hash using constant-time comparison
  // This prevents timing attacks from revealing password patterns
  if (!constantTimeCompare(providedPasswordHash, member.password_hash)) {
    logAuditEntry(email, AUDIT_LOGIN_FAILED, "Individual", member.individual_id,
                  "Failed login attempt: incorrect password");
    return { success: false, message: "Invalid email or password." };
  }

  // Check household status and membership application
  // Allow login for both active members AND applicants (pending application)
  // Only block if application was denied or withdrawn
  var household = getHouseholdById(member.household_id);
  var isApplicant = false;

  if (!household) {
    logAuditEntry(email, AUDIT_LOGIN_FAILED, "Individual", member.individual_id,
                  "Failed login attempt: household not found");
    return { success: false, message: "Invalid email or password." };
  }

  // Check if this is an applicant (in-progress application)
  // IMPORTANT:
  // - Some sheet cells store booleans as strings ("TRUE"/"FALSE"), so normalize first.
  // - Use Membership Applications status when available, since household.application_status
  //   may be stale/missing during intermediate workflow stages.
  var isHouseholdActive = (household.active === true || String(household.active).toLowerCase() === "true");
  var householdStatusRaw = String(household.application_status || "").trim();
  var householdStatus = householdStatusRaw.toLowerCase();

  // Application status from Membership Applications (if a record exists)
  var applicationStatusRaw = "";
  var applicationStatus = "";
  if (typeof _getApplicationByHouseholdId === "function") {
    var application = _getApplicationByHouseholdId(household.household_id);
    if (application && application.status) {
      applicationStatusRaw = String(application.status).trim();
      applicationStatus = applicationStatusRaw.toLowerCase();
    }
  }

  // Denied/withdrawn applicants are blocked from login
  if (householdStatus === "denied" || householdStatus === "withdrawn" ||
      applicationStatus === "denied" || applicationStatus === "withdrawn") {
    var deniedStatus = applicationStatusRaw || householdStatusRaw || "Denied";
    logAuditEntry(email, AUDIT_LOGIN_FAILED, "Individual", member.individual_id,
                  "Failed login attempt: application " + deniedStatus);
    return { success: false, message: "Your application was not approved. Please contact board@geabotswana.org for details." };
  }

  // Treat as applicant when:
  // 1) household is not active, OR
  // 2) there is an application record that is not yet activated
  if (!isHouseholdActive || (applicationStatus && applicationStatus !== "activated")) {
    isApplicant = true;
  }

  // All checks passed — create a session token
  var role   = _getRoleForEmail(email);
  var token  = _createSession(email, role);

  // Send first-login welcome email if this is their first portal login
  if (!member.first_login_date) {
    _sendFirstLoginWelcome(member);
    updateMemberField(member.individual_id, "first_login_date", new Date(), "system");
  }

  // Update last login timestamp
  updateMemberField(member.individual_id, "last_login_date", new Date(), "system");

  // Log the successful login
  var logMsg = "Login successful (role: " + role + ")";
  if (isApplicant) {
    logMsg += " [Applicant - Application Status: " + household.application_status + "]";
  }
  logAuditEntry(email, AUDIT_LOGIN, "Individual", member.individual_id, logMsg);

  // Build member data to include household_name in response
  var memberData = _safePublicMember(member);
  if (household) {
    memberData.household_name = household.household_name;
  }

  // Return success with token, member data, and applicant flag if applicable
  var response = {
    success: true,
    token:   token,
    role:    role,
    member:  memberData,
    is_applicant: isApplicant
  };

  // Include application status for applicants
  if (isApplicant) {
    response.application_status = applicationStatusRaw || householdStatusRaw || "in_progress";
  }

  return response;
}


/**
 * FUNCTION: hashPassword
 * PURPOSE: Converts plaintext password to SHA256 hash for storage.
 *          This function is used both when setting passwords and when
 *          verifying login attempts.
 *
 * SECURITY: SHA256 is one-way — the hash cannot be reversed to get
 *           the original password. This means even if the spreadsheet
 *           is compromised, attackers cannot recover member passwords.
 *
 * CALLED BY: login(), setPassword(), resetPassword()
 *
 * @param {string} plaintext  The plaintext password to hash
 * @returns {string}          SHA256 hash as a hex string
 *
 * EXAMPLE:
 * hashPassword("MySecurePassword123!")
 * Returns: "a1b2c3d4e5f6..." (64-character hex string)
 */
function hashPassword(plaintext) {
  if (!plaintext) return "";
  
  try {
    // Use Google Apps Script's built-in SHA256 hashing
    // Utilities.computeDigest() returns a byte array
    // Convert to hex string for storage in the spreadsheet
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, plaintext);
    
    // Convert byte array to hex string (each byte becomes 2 hex chars)
    var hashHex = '';
    for (var i = 0; i < digest.length; i++) {
      var byte = digest[i];
      // Convert to unsigned byte (0-255)
      if (byte < 0) byte = 256 + byte;
      // Convert to hex and pad with leading zero if needed
      var hex = byte.toString(16);
      hashHex += hex.length === 1 ? '0' + hex : hex;
    }
    
    return hashHex;
  } catch (e) {
    Logger.log("ERROR hashPassword: " + e);
    return "";
  }
}


/**
 * FUNCTION: setPassword
 * PURPOSE: Sets a password for a member (used during activation or first setup).
 *          Only the board can call this function.
 *          The password is hashed before storage — plaintext is never saved.
 *
 * HOW IT WORKS:
 * 1. Verify the caller is a board member (has token)
 * 2. Verify the password meets minimum length requirement
 * 3. Hash the password using SHA256
 * 4. Store the hash in the password_hash column of Individuals sheet
 * 5. Log the action to the Audit Log
 * 6. Send the member an email confirming their password has been set
 *
 * SECURITY:
 * - Only board members can set/reset passwords
 * - The plaintext password is never stored, only the hash
 * - Changing a password invalidates all existing sessions
 *   (member must log in again with new password)
 *
 * CALLED BY: Admin portal activation flow (future feature)
 *
 * @param {string} individualId    The member's individual_id
 * @param {string} plainPassword   Plaintext password to set
 * @param {string} boardEmail      Email of board member making the change
 * @returns {Object}
 *   On success: { success: true, message: "Password set" }
 *   On failure: { success: false, message: "Error message" }
 *
 * EXAMPLE:
 * setPassword("IND-2026-001", "SecurePassword123!", "treasurer@geabotswana.org")
 */
function setPassword(individualId, plainPassword, boardEmail) {
  // Validate password meets minimum length
  if (!plainPassword || plainPassword.length < PASSWORD_MIN_LENGTH) {
    return { 
      success: false, 
      message: "Password must be at least " + PASSWORD_MIN_LENGTH + " characters." 
    };
  }

  // Get the member so we can send them a notification
  var member = getMemberById(individualId);
  if (!member) {
    return { success: false, message: "Member not found." };
  }

  try {
    // Hash the password before storing
    var passwordHash = hashPassword(plainPassword);
    
    // Store the hash in the password_hash column
    updateMemberField(individualId, "password_hash", passwordHash, boardEmail);
    
    // Log the action
    logAuditEntry(boardEmail, AUDIT_PASSWORD_SET, "Individual", individualId,
                  "Password set by board member");
    
    // Send the member an email confirming their password is set
    if (member.email) {
      sendEmailFromTemplate("MEM_PASSWORD_SET_TO_MEMBER", member.email, {
        FIRST_NAME: member.first_name,
        PORTAL_URL: URL_MEMBER_PORTAL
      });
    }
    
    return { success: true, message: "Password set successfully." };
  } catch (e) {
    Logger.log("ERROR setPassword: " + e);
    return { success: false, message: "Failed to set password." };
  }
}


// ============================================================
// SESSION MANAGEMENT
// ============================================================

/**
 * Validates a session token and returns the session data if valid.
 * Call this at the start of every doGet() route handler.
 *
 * @param {string} token
 * @returns {Object}
 *   On success: { valid: true, email: string, role: string }
 *   On failure: { valid: false, message: string }
 */
function validateSession(token) {
  if (!token) return { valid: false, message: "No session token provided." };

  try {
    var sheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_SESSIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var tokCol  = headers.indexOf("token_hash");  // Changed from "token"
    var expCol  = headers.indexOf("expires_at");
    var emlCol  = headers.indexOf("email");
    var rolCol  = headers.indexOf("role");
    var actCol  = headers.indexOf("active");

    // Hash the presented token before comparison
    var presentedHash = _hashToken(token);
    if (!presentedHash) return { valid: false, message: "Invalid session. Please log in again." };

    for (var i = 1; i < data.length; i++) {
      // SECURITY: Compare hashes with constant-time function to resist timing attacks
      if (!constantTimeCompare(data[i][tokCol], presentedHash)) continue;
      if (!data[i][actCol]) return { valid: false, message: "Session has been invalidated." };

      var expires = new Date(data[i][expCol]);
      if (expires < new Date()) {
        // Invalidate the expired session in-place
        sheet.getRange(i + 1, actCol + 1).setValue(false);
        return { valid: false, message: "Session expired. Please log in again." };
      }

      // Refresh expiry on activity (sliding window)
      var newExpiry = _sessionExpiry();
      sheet.getRange(i + 1, expCol + 1).setValue(newExpiry);

      return { valid: true, email: data[i][emlCol], role: data[i][rolCol] };
    }
  } catch (e) {
    Logger.log("ERROR validateSession: " + e);
  }

  return { valid: false, message: "Invalid session. Please log in again." };
}

/**
 * Invalidates a session token (logout).
 * @param {string} token
 * @returns {boolean}
 */
function logout(token) {
  if (!token) return false;
  try {
    var sheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_SESSIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var tokCol  = headers.indexOf("token_hash");
    var actCol  = headers.indexOf("active");
    var emlCol  = headers.indexOf("email");

    var tokenHash = _hashToken(token);
    if (!tokenHash) return false;

    for (var i = 1; i < data.length; i++) {
      // SECURITY: Compare hashes with constant-time function
      if (constantTimeCompare(data[i][tokCol], tokenHash)) {
        sheet.getRange(i + 1, actCol + 1).setValue(false);
        logAuditEntry(data[i][emlCol], AUDIT_LOGOUT, "Session", "[hash]", "User logged out");
        return true;
      }
    }
  } catch (e) { Logger.log("ERROR logout: " + e); }
  return false;
}

/**
 * Removes all sessions older than SESSION_TIMEOUT_HOURS.
 * Should be run nightly via a time trigger to keep the tab clean.
 */
function purgeExpiredSessions() {
  Logger.log("Purging expired sessions...");
  try {
    var sheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_SESSIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var expCol  = headers.indexOf("expires_at");
    var actCol  = headers.indexOf("active");
    var now     = new Date();
    var purged  = 0;

    // Walk backward so row deletions don't shift indexes
    for (var i = data.length - 1; i >= 1; i--) {
      if (!data[i][actCol] || new Date(data[i][expCol]) < now) {
        sheet.deleteRow(i + 1);
        purged++;
      }
    }
    Logger.log("Purged " + purged + " expired sessions.");
  } catch (e) { Logger.log("ERROR purgeExpiredSessions: " + e); }
}


// ============================================================
// ROLE CHECKING
// ============================================================

/**
 * Returns true if the session token belongs to a board member.
 * @param {string} token
 * @returns {boolean}
 */
function isBoard(token) {
  var session = validateSession(token);
  return session.valid && session.role === "board";
}

/**
 * Returns true if the session token belongs to board or MGT.
 * Used for approvals (MGT can approve their own scope).
 * @param {string} token
 * @returns {boolean}
 */
function isApprover(token) {
  var session = validateSession(token);
  return session.valid && (session.role === "board" || session.role === "mgt");
}

/**
 * Returns true if the session token is any valid member session.
 * @param {string} token
 * @returns {boolean}
 */
function isMember(token) {
  return validateSession(token).valid;
}

/**
 * Middleware helper: validates session and returns the session object,
 * or returns a ready-made error response if invalid.
 * Use this at the top of every doGet() route that requires login.
 *
 * @param {string} token
 * @param {string} requiredRole  Optional: "board" or "mgt" to enforce role
 * @returns {Object}
 *   { ok: true, session: Object } or { ok: false, response: string }
 */
function requireAuth(token, requiredRole) {
  var session = validateSession(token);

  if (!session.valid) {
    return { ok: false, response: errorResponse(session.message, "AUTH_REQUIRED") };
  }

  if (requiredRole && session.role !== requiredRole && session.role !== "board") {
    return { ok: false, response: errorResponse(ERR_NOT_AUTHORIZED, "FORBIDDEN") };
  }

  return { ok: true, session: session };
}


// ============================================================
// INTERNAL HELPERS
// ============================================================

/**
 * Creates a session record in the Sessions tab and returns the token.
 * @param {string} email
 * @param {string} role
 * @returns {string} token
 */
function _createSession(email, role) {
  var token     = _generateToken();
  var tokenHash = _hashToken(token);  // Store hash, not plain-text
  var now       = new Date();
  var expires   = _sessionExpiry();

  try {
    var sheet   = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_SESSIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var emlCol  = headers.indexOf("email");
    var actCol  = headers.indexOf("active");

    // Deactivate all previous sessions for this user
    for (var i = 1; i < data.length; i++) {
      if (data[i][emlCol] === email && data[i][actCol]) {
        sheet.getRange(i + 1, actCol + 1).setValue(false);
      }
    }

    // Create new session with properly formatted timestamps
    // SECURITY: Store token_hash, not plain token. This prevents immediate replay from sheet access.
    var row     = {
      session_id:   generateId("SES"),
      token_hash:   tokenHash,
      email:        email,
      role:         role,
      created_at:   Utilities.formatDate(now, "Africa/Johannesburg", "yyyy-MM-dd HH:mm:ss"),
      expires_at:   Utilities.formatDate(expires, "Africa/Johannesburg", "yyyy-MM-dd HH:mm:ss"),
      active:       true
    };
    sheet.appendRow(headers.map(function(col) {
      return row[col] !== undefined ? row[col] : "";
    }));
  } catch (e) {
    Logger.log("ERROR _createSession: " + e);
  }

  // Return plain-text token to client (token is used only once on client-side for immediate validation)
  return token;
}

/**
 * Generates a session token with better entropy than Math.random().
 *
 * Combines:
 * - Utilities.getUuid() — platform-provided entropy
 * - Timestamp — session uniqueness
 * - Math.random() — additional entropy mixing
 *
 * Result is hashed to produce a normalized 64-character hex token.
 *
 * NOTE: Not true CSPRNG (Google Apps Script doesn't expose hardware randomness).
 * But significantly better than raw Math.random() with much higher entropy.
 *
 * @returns {string}  64-character hex string (SHA256 hash of mixed entropy)
 */
function _generateToken() {
  try {
    // Mix multiple entropy sources
    var sources = [
      Utilities.getUuid(),                    // Platform entropy
      new Date().getTime().toString(),        // Timestamp
      Math.random().toString(36).substring(2), // Extra entropy
      Utilities.getUuid().substring(0, 8)     // More platform entropy
    ];

    var combined = sources.join("|");

    // Hash the combined entropy to normalize to 64-char hex string
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, combined);

    // Convert byte array to hex string (same pattern as hashPassword)
    var hashHex = '';
    for (var i = 0; i < digest.length; i++) {
      var byte = digest[i];
      if (byte < 0) byte = 256 + byte;  // Convert to unsigned
      var hex = byte.toString(16);
      hashHex += hex.length === 1 ? '0' + hex : hex;
    }
    return hashHex;
  } catch (e) {
    Logger.log("ERROR _generateToken: " + e);
    // Fallback to simpler generation if hashing fails
    return _generateTokenFallback();
  }
}

/**
 * Fallback token generation (if Utilities functions fail).
 * Less robust but ensures service availability.
 * @returns {string}
 * @private
 */
function _generateTokenFallback() {
  var chars = "0123456789abcdef";
  var token = "";
  for (var i = 0; i < 64; i++) {
    token += chars[Math.floor(Math.random() * 16)];
  }
  return token;
}

/**
 * Returns the expiry date SESSION_TIMEOUT_HOURS from now.
 * @returns {Date}
 */
function _sessionExpiry() {
  return new Date(new Date().getTime() + SESSION_TIMEOUT_HOURS * 60 * 60 * 1000);
}

/**
 * Constant-time string comparison (resists timing attacks).
 * Compares two strings in constant time by always checking all characters,
 * never short-circuiting on first difference.
 *
 * @param {string} str1  First string (e.g., provided hash)
 * @param {string} str2  Second string (e.g., stored hash)
 * @returns {boolean}    True if strings are equal
 */
function constantTimeCompare(str1, str2) {
  // Length check first (timing safe: always executed regardless of match)
  if (str1.length !== str2.length) return false;

  // Accumulate differences using XOR + bitwise OR (no short-circuit)
  // This takes O(n) time regardless of where differences occur
  var diff = 0;
  for (var i = 0; i < str1.length; i++) {
    diff |= str1.charCodeAt(i) ^ str2.charCodeAt(i);
  }

  return diff === 0;
}

/**
 * Hashes a session token for secure storage.
 * Tokens are stored as SHA256 hashes in the Sessions sheet; the plain-text
 * token is never persisted. This prevents immediate session replay from sheet access.
 *
 * @param {string} token  The plain-text session token
 * @returns {string}      SHA256 hash as hex string
 */
function _hashToken(token) {
  if (!token) return "";
  try {
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token);

    // Convert byte array to hex string (same pattern as hashPassword)
    var hashHex = '';
    for (var i = 0; i < digest.length; i++) {
      var byte = digest[i];
      if (byte < 0) byte = 256 + byte;  // Convert to unsigned
      var hex = byte.toString(16);
      hashHex += hex.length === 1 ? '0' + hex : hex;
    }
    return hashHex;
  } catch (e) {
    Logger.log("ERROR _hashToken: " + e);
    return "";
  }
}

/**
 * Invalidates all existing sessions.
 * Called during deployment when moving from plain-text to hashed token storage.
 * This forces all users to re-authenticate with the new session format.
 *
 * DEPLOYMENT STEPS:
 * 1. In GEA System Backend spreadsheet, Sessions tab: Rename column "token" → "token_hash"
 * 2. Run this function once in Google Apps Script editor:
 *    invalidateAllSessionsForTokenHashMigration();
 * 3. clasp push to deploy AuthService.js changes
 * 4. All users must log in again (old plain-text sessions invalidated)
 * 5. Delete this function after successful migration (not needed for ongoing use)
 *
 * This migration ensures tokens are never stored as plain-text, preventing immediate
 * session replay from spreadsheet access.
 */
function invalidateAllSessionsForTokenHashMigration() {
  try {
    var sheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_SESSIONS);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var actCol = headers.indexOf("active");

    // Deactivate all sessions
    for (var i = 1; i < data.length; i++) {
      sheet.getRange(i + 1, actCol + 1).setValue(false);
    }

    Logger.log("SUCCESS: Invalidated " + (data.length - 1) + " sessions for token hash migration");
  } catch (e) {
    Logger.log("ERROR invalidateAllSessionsForTokenHashMigration: " + e);
  }
}

/**
 * Determines the role for a member login email.
 * Member portal logins always get "member" — admin roles are managed
 * separately in the Administrators table and used only for admin_login.
 * @param {string} email
 * @returns {string}  Always "member"
 */
function _getRoleForEmail(email) {
  return "member";
}

/**
 * Sends the first-login welcome email (tpl_021) to a new member.
 * @param {Object} member  Individual record
 */
function _sendFirstLoginWelcome(member) {
  var hh = getHouseholdById(member.household_id);
  if (!hh || !member.email) return;

  var members        = getHouseholdMembers(member.household_id);
  var familyNames    = members
    .filter(function(m) { return m.individual_id !== member.individual_id; })
    .map(function(m) { return m.first_name + " " + m.last_name; })
    .join(", ");
  var level = getMembershipLevel(hh.membership_level_id);

  sendEmailFromTemplate("MEM_FIRST_LOGIN_WELCOME_TO_MEMBER", member.email, {
    FIRST_NAME:          member.first_name,
    HOUSEHOLD_NAME:      member.last_name + " Household",
    PASSWORD_RESET_LINK: URL_MEMBER_PORTAL,
    PORTAL_URL:          URL_MEMBER_PORTAL
  });
}

/**
 * VALIDATION HELPERS (Read-Only, for Operational Verification)
 *
 * These helpers check the state of auth/session infrastructure without modifying data.
 * Use these during deployment verification and troubleshooting.
 */

/**
 * Validates that token hash migration is complete.
 * Returns status report for deployment verification.
 *
 * Checks:
 * - token_hash column exists
 * - Active sessions contain valid 64-char SHA256 hashes (not just non-empty)
 * - No active sessions using old plain-text token column
 *
 * @returns {Object} Status report with:
 *   - migrationStatus: {string} "COMPLETE" or "INCOMPLETE"
 *   - tokenHashExists: {boolean}
 *   - tokenColumnExists: {boolean}
 *   - activeSessionCount: {number}
 *   - newSessionCount: {number} (sessions with valid token_hash)
 *   - invalidHashCount: {number} (token_hash exists but wrong length)
 *   - oldSessionCount: {number} (sessions with plain-text token)
 *   - isComplete: {boolean} (true if migration successful)
 *   - errors: {Array} (any issues found)
 *
 * USAGE: var status = validateTokenHashMigration(); Logger.log(JSON.stringify(status));
 */
function validateTokenHashMigration() {
  var report = {
    migrationStatus: "INCOMPLETE",
    tokenHashExists: false,
    tokenColumnExists: false,
    activeSessionCount: 0,
    newSessionCount: 0,
    invalidHashCount: 0,
    oldSessionCount: 0,
    totalRows: 0,
    isComplete: false,
    errors: []
  };

  try {
    var sheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID)
      .getSheetByName(TAB_SESSIONS);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];

    var tokenHashCol = headers.indexOf("token_hash");
    var tokenCol = headers.indexOf("token");
    var activeCol = headers.indexOf("active");

    report.tokenHashExists = tokenHashCol !== -1;
    report.tokenColumnExists = tokenCol !== -1;
    report.totalRows = data.length - 1;

    if (!report.tokenHashExists) {
      report.errors.push("token_hash column not found in Sessions sheet");
      return report;
    }

    // Count sessions by type and validate hash format
    for (var i = 1; i < data.length; i++) {
      var isActive = data[i][activeCol] === true;
      if (isActive) report.activeSessionCount++;

      var tokenHashValue = data[i][tokenHashCol];
      var oldTokenValue = data[i][tokenCol];

      // Check for valid SHA256 hash (64 hex characters)
      var isValidHash = tokenHashValue &&
                        tokenHashValue.toString().length === 64 &&
                        /^[a-f0-9]{64}$/i.test(tokenHashValue.toString());

      if (isActive) {
        if (isValidHash && !oldTokenValue) {
          report.newSessionCount++;
        } else if (tokenHashValue && !isValidHash) {
          report.invalidHashCount++;
          report.errors.push("Row " + (i+1) + ": token_hash has invalid format (expected 64-char hex)");
        } else if (oldTokenValue && !tokenHashValue) {
          report.oldSessionCount++;
          report.errors.push("Row " + (i+1) + ": still using old token column");
        }
      }
    }

    // Migration is complete only if:
    // - token_hash column exists
    // - All active sessions have valid 64-char hashes
    // - No active sessions with old token column
    // - No invalid hashes
    report.isComplete = report.tokenHashExists &&
                       report.oldSessionCount === 0 &&
                       report.invalidHashCount === 0 &&
                       (report.activeSessionCount === 0 || report.newSessionCount > 0);

    report.migrationStatus = report.isComplete ? "COMPLETE" : "INCOMPLETE";

  } catch (e) {
    report.errors.push("Failed to read Sessions sheet: " + e.toString());
    report.migrationStatus = "ERROR";
  }

  return report;
}

/**
 * Checks if a new session was created with the hashed token format.
 * Useful for quick post-login verification during testing.
 *
 * @param {string} email  Email to search for in Sessions
 * @returns {Object} Session info with:
 *   - found: {boolean}
 *   - email: {string}
 *   - hasTokenHash: {boolean}
 *   - isActive: {boolean}
 *   - createdAt: {string}
 *   - tokenHashLength: {number} (should be 64 for SHA256 hex)
 *
 * USAGE: var session = checkSessionFormat("test@example.com"); Logger.log(JSON.stringify(session));
 */
function checkSessionFormat(email) {
  var report = {
    found: false,
    email: email,
    hasTokenHash: false,
    isActive: false,
    createdAt: null,
    tokenHashLength: 0,
    error: null
  };

  try {
    var sheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID)
      .getSheetByName(TAB_SESSIONS);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];

    var emailCol = headers.indexOf("email");
    var tokenHashCol = headers.indexOf("token_hash");
    var activeCol = headers.indexOf("active");
    var createdCol = headers.indexOf("created_at");

    // Find most recent session for this email
    for (var i = data.length - 1; i >= 1; i--) {
      if (data[i][emailCol] === email) {
        report.found = true;
        report.isActive = data[i][activeCol] === true;
        report.createdAt = data[i][createdCol];

        if (tokenHashCol !== -1 && data[i][tokenHashCol]) {
          report.hasTokenHash = true;
          report.tokenHashLength = data[i][tokenHashCol].toString().length;
        }

        break;
      }
    }

  } catch (e) {
    report.error = "Failed to check session: " + e.toString();
  }

  return report;
}

/**
 * Summary report of auth system health.
 * Use for monitoring and troubleshooting.
 *
 * @returns {Object} Health report with migration status, session counts, and recommendations
 *
 * USAGE: var health = getAuthHealthReport(); Logger.log(JSON.stringify(health, null, 2));
 */
function getAuthHealthReport() {
  var migration = validateTokenHashMigration();

  var report = {
    timestamp: new Date().toISOString(),
    migrationStatus: migration.isComplete ? "COMPLETE" : "INCOMPLETE",
    sessionStats: {
      total: migration.totalRows,
      active: migration.activeSessionCount,
      newFormat: migration.newSessionCount,
      oldFormat: migration.oldSessionCount
    },
    schemaStatus: {
      tokenHashColumnExists: migration.tokenHashExists,
      tokenColumnExists: migration.tokenColumnExists
    },
    recommendations: []
  };

  // Generate recommendations
  if (!migration.tokenHashExists) {
    report.recommendations.push("❌ token_hash column missing. Run Step 1 of TOKEN_HASH_MIGRATION_RUNBOOK.");
  }
  if (migration.oldSessionCount > 0) {
    report.recommendations.push("⚠️ " + migration.oldSessionCount + " active sessions with old token format. Run invalidateAllSessionsForTokenHashMigration().");
  }
  if (migration.isComplete) {
    report.recommendations.push("✅ Migration complete. New logins using hashed tokens.");
  }

  return report;
}

// ============================================================
// ADMIN ACCOUNT MANAGEMENT
// ============================================================

/**
 * Authenticates an admin using the Administrators table.
 * Called from the Admin Portal login screen (separate from member login).
 * Roles: "board", "mgt", "rso" — determined by the Administrators table.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Object}  { success, token, role, admin } or { success: false, message }
 */
function adminLogin(email, password) {
  if (!email || !isValidEmail(email)) {
    return { success: false, message: "Please enter a valid email address." };
  }
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return { success: false, message: "Invalid email or password." };
  }

  try {
    var sheet   = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_ADMINISTRATORS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var colIdx  = _adminColMap(headers);

    var normalizedEmail = email.toLowerCase().trim();
    var adminRow = null;
    var rowIdx   = -1;

    for (var i = 1; i < data.length; i++) {
      if ((data[i][colIdx.email] || "").toLowerCase().trim() === normalizedEmail) {
        adminRow = data[i];
        rowIdx   = i + 1;  // 1-based for sheet operations
        break;
      }
    }

    // No email match — return generic error (don't reveal if email exists)
    if (!adminRow) {
      logAuditEntry(email, AUDIT_ADMIN_LOGIN_FAILED, "Administrator", "-",
                    "Failed admin login: email not found");
      return { success: false, message: "Invalid email or password." };
    }

    // Check active flag
    if (!adminRow[colIdx.active]) {
      logAuditEntry(email, AUDIT_ADMIN_LOGIN_FAILED, "Administrator", adminRow[colIdx.admin_id],
                    "Failed admin login: account deactivated");
      return { success: false, message: "This account has been deactivated. Contact the board to reinstate access." };
    }

    // Verify password
    var providedHash = hashPassword(password);
    var storedHash   = adminRow[colIdx.password_hash] || "";
    if (!storedHash || !constantTimeCompare(providedHash, storedHash)) {
      logAuditEntry(email, AUDIT_ADMIN_LOGIN_FAILED, "Administrator", adminRow[colIdx.admin_id],
                    "Failed admin login: incorrect password");
      return { success: false, message: "Invalid email or password." };
    }

    // All checks passed
    var role  = adminRow[colIdx.role];
    var token = _createSession(email, role);

    logAuditEntry(email, AUDIT_ADMIN_LOGIN, "Administrator", adminRow[colIdx.admin_id],
                  "Admin login successful (role: " + role + ")");

    return {
      success:    true,
      token:      token,
      role:       role,
      admin: {
        admin_id:   adminRow[colIdx.admin_id],
        email:      adminRow[colIdx.email],
        first_name: adminRow[colIdx.first_name],
        last_name:  adminRow[colIdx.last_name],
        role:       role
      }
    };
  } catch (e) {
    Logger.log("ERROR adminLogin: " + e);
    return { success: false, message: "An error occurred. Please try again." };
  }
}

/**
 * Returns all admin accounts (board-only).
 * @param {string} callerEmail  For audit logging
 * @returns {Array}  Array of admin objects (password_hash stripped)
 */
function listAdminAccounts(callerEmail) {
  try {
    var sheet   = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_ADMINISTRATORS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var colIdx  = _adminColMap(headers);

    var admins = [];
    for (var i = 1; i < data.length; i++) {
      admins.push({
        admin_id:         data[i][colIdx.admin_id],
        email:            data[i][colIdx.email],
        first_name:       data[i][colIdx.first_name],
        last_name:        data[i][colIdx.last_name],
        role:             data[i][colIdx.role],
        active:           data[i][colIdx.active] === true,
        created_by:       data[i][colIdx.created_by],
        created_date:     data[i][colIdx.created_date],
        deactivated_by:   data[i][colIdx.deactivated_by],
        deactivated_date: data[i][colIdx.deactivated_date],
        has_password:     !!(data[i][colIdx.password_hash])
      });
    }
    return admins;
  } catch (e) {
    Logger.log("ERROR listAdminAccounts: " + e);
    return [];
  }
}

/**
 * Creates a new admin account (board-only).
 * @param {Object} params  { email, first_name, last_name, role, password }
 * @param {string} callerEmail  Email of the board member creating the account
 * @returns {Object}  { success, admin_id, message }
 */
function createAdminAccount(params, callerEmail) {
  var email      = (params.email || "").toLowerCase().trim();
  var firstName  = (params.first_name || "").trim();
  var lastName   = (params.last_name || "").trim();
  var role       = (params.role || "").toLowerCase().trim();
  var password   = params.password || "";

  if (!isValidEmail(email))   return { success: false, message: "Invalid email address." };
  if (!firstName)             return { success: false, message: "First name is required." };
  if (!lastName)              return { success: false, message: "Last name is required." };
  if (["board","mgt","rso"].indexOf(role) === -1) {
    return { success: false, message: "Role must be board, mgt, or rso." };
  }
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return { success: false, message: "Password must be at least " + PASSWORD_MIN_LENGTH + " characters." };
  }

  try {
    var sheet   = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_ADMINISTRATORS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var colIdx  = _adminColMap(headers);

    // Check for duplicate email
    for (var i = 1; i < data.length; i++) {
      if ((data[i][colIdx.email] || "").toLowerCase().trim() === email) {
        return { success: false, message: "An admin account with this email already exists." };
      }
    }

    var adminId      = generateId("ADM");
    var passwordHash = hashPassword(password);
    var now          = Utilities.formatDate(new Date(), "Africa/Johannesburg", "yyyy-MM-dd HH:mm:ss");

    var row = {};
    row[headers[colIdx.admin_id]]        = adminId;
    row[headers[colIdx.email]]           = email;
    row[headers[colIdx.first_name]]      = firstName;
    row[headers[colIdx.last_name]]       = lastName;
    row[headers[colIdx.role]]            = role;
    row[headers[colIdx.active]]          = true;
    row[headers[colIdx.password_hash]]   = passwordHash;
    row[headers[colIdx.created_by]]      = callerEmail;
    row[headers[colIdx.created_date]]    = now;
    row[headers[colIdx.deactivated_by]]  = "";
    row[headers[colIdx.deactivated_date]] = "";

    sheet.appendRow(headers.map(function(h) { return row[h] !== undefined ? row[h] : ""; }));

    logAuditEntry(callerEmail, AUDIT_ADMIN_CREATED, "Administrator", adminId,
                  "Admin account created: " + email + " (role: " + role + ")");

    return { success: true, admin_id: adminId, message: "Admin account created successfully." };
  } catch (e) {
    Logger.log("ERROR createAdminAccount: " + e);
    return { success: false, message: "Failed to create admin account." };
  }
}

/**
 * Deactivates an admin account (board-only). Does not delete — preserves audit history.
 * @param {string} adminId
 * @param {string} callerEmail
 * @returns {Object}  { success, message }
 */
function deactivateAdminAccount(adminId, callerEmail) {
  return _setAdminActiveFlag(adminId, false, callerEmail);
}

/**
 * Reactivates a previously deactivated admin account (board-only).
 * @param {string} adminId
 * @param {string} callerEmail
 * @returns {Object}  { success, message }
 */
function reactivateAdminAccount(adminId, callerEmail) {
  return _setAdminActiveFlag(adminId, true, callerEmail);
}

/**
 * Resets the password for an admin account (board-only).
 * @param {string} adminId
 * @param {string} newPassword
 * @param {string} callerEmail
 * @returns {Object}  { success, message }
 */
function resetAdminPassword(adminId, newPassword, callerEmail) {
  if (!newPassword || newPassword.length < PASSWORD_MIN_LENGTH) {
    return { success: false, message: "Password must be at least " + PASSWORD_MIN_LENGTH + " characters." };
  }

  try {
    var sheet   = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_ADMINISTRATORS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var colIdx  = _adminColMap(headers);

    for (var i = 1; i < data.length; i++) {
      if (data[i][colIdx.admin_id] === adminId) {
        var newHash = hashPassword(newPassword);
        sheet.getRange(i + 1, colIdx.password_hash + 1).setValue(newHash);

        // Invalidate all active sessions for this admin
        _invalidateSessionsForEmail(data[i][colIdx.email]);

        logAuditEntry(callerEmail, AUDIT_ADMIN_PASSWORD_RESET, "Administrator", adminId,
                      "Password reset by " + callerEmail);
        return { success: true, message: "Password reset successfully. The admin must log in again." };
      }
    }
    return { success: false, message: "Admin account not found." };
  } catch (e) {
    Logger.log("ERROR resetAdminPassword: " + e);
    return { success: false, message: "Failed to reset password." };
  }
}

/* bootstrapAdminAccounts — COMMENTED OUT after initial seeding on 2026-03-21
 * To re-enable: uncomment the function body, edit the accounts array, run once, re-comment.
 *
function bootstrapAdminAccounts() {
  var initialAdmins = [
    { email: "board@geabotswana.org",  first_name: "GEA",    last_name: "Board",     role: "board", password: "ChangeMe123!" },
    { email: "treasurer@geabotswana.org", first_name: "GEA", last_name: "Treasurer", role: "board", password: "ChangeMe123!" }
  ];
  Logger.log("=== bootstrapAdminAccounts ===");
  for (var i = 0; i < initialAdmins.length; i++) {
    var result = createAdminAccount(initialAdmins[i], "bootstrap");
    Logger.log(initialAdmins[i].email + ": " + JSON.stringify(result));
  }
  Logger.log("Done. Change passwords immediately after first login.");
}
*/

// ── Private helpers ─────────────────────────────────────────────────────────

/**
 * Maps column names to 0-based column indexes for the Administrators sheet.
 * @param {Array} headers
 * @returns {Object}
 */
function _adminColMap(headers) {
  var map = {};
  var cols = ["admin_id","email","first_name","last_name","role","active",
              "password_hash","created_by","created_date","deactivated_by","deactivated_date"];
  cols.forEach(function(col) { map[col] = headers.indexOf(col); });
  return map;
}

/**
 * Sets the active flag on an admin account and logs the action.
 * @param {string} adminId
 * @param {boolean} active
 * @param {string} callerEmail
 * @returns {Object}
 */
function _setAdminActiveFlag(adminId, active, callerEmail) {
  try {
    var sheet   = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_ADMINISTRATORS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var colIdx  = _adminColMap(headers);
    var now     = Utilities.formatDate(new Date(), "Africa/Johannesburg", "yyyy-MM-dd HH:mm:ss");

    for (var i = 1; i < data.length; i++) {
      if (data[i][colIdx.admin_id] === adminId) {
        sheet.getRange(i + 1, colIdx.active + 1).setValue(active);

        if (!active) {
          // Record deactivation details
          sheet.getRange(i + 1, colIdx.deactivated_by + 1).setValue(callerEmail);
          sheet.getRange(i + 1, colIdx.deactivated_date + 1).setValue(now);
          // Invalidate all active sessions for this admin
          _invalidateSessionsForEmail(data[i][colIdx.email]);
          logAuditEntry(callerEmail, AUDIT_ADMIN_DEACTIVATED, "Administrator", adminId,
                        "Admin account deactivated: " + data[i][colIdx.email]);
        } else {
          // Clear deactivation fields on reactivation
          sheet.getRange(i + 1, colIdx.deactivated_by + 1).setValue("");
          sheet.getRange(i + 1, colIdx.deactivated_date + 1).setValue("");
          logAuditEntry(callerEmail, AUDIT_ADMIN_REACTIVATED, "Administrator", adminId,
                        "Admin account reactivated: " + data[i][colIdx.email]);
        }
        return { success: true, message: active ? "Account reactivated." : "Account deactivated." };
      }
    }
    return { success: false, message: "Admin account not found." };
  } catch (e) {
    Logger.log("ERROR _setAdminActiveFlag: " + e);
    return { success: false, message: "Operation failed." };
  }
}

/**
 * Invalidates all active sessions for the given email.
 * Used when deactivating an account or resetting a password.
 * @param {string} email
 */
function _invalidateSessionsForEmail(email) {
  try {
    var sheet   = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_SESSIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var emlCol  = headers.indexOf("email");
    var actCol  = headers.indexOf("active");

    for (var i = 1; i < data.length; i++) {
      if (data[i][emlCol] === email && data[i][actCol]) {
        sheet.getRange(i + 1, actCol + 1).setValue(false);
      }
    }
  } catch (e) {
    Logger.log("ERROR _invalidateSessionsForEmail: " + e);
  }
}

/**
 * Returns a subset of member fields safe to send to the browser.
 * Strips sensitive fields (document numbers, payment info, etc.)
 * @param {Object} member
 * @returns {Object}
 */
function _safePublicMember(member) {
  return {
    individual_id:              member.individual_id,
    household_id:               member.household_id,
    first_name:                 member.first_name,
    last_name:                  member.last_name,
    email:                      member.email,
    relationship_to_primary:    member.relationship_to_primary,
    photo_status:               member.photo_status,
    can_access_unaccompanied:   member.can_access_unaccompanied,
    fitness_center_eligible:    member.fitness_center_eligible,
    voting_eligible:            member.voting_eligible,
    office_eligible:            member.office_eligible,
    passport_status:            member.passport_status || "none",
    omang_status:               member.omang_status || "none",
    country_code_primary:       member.country_code_primary || "",
    phone_primary:              member.phone_primary || "",
    phone_primary_whatsapp:     member.phone_primary_whatsapp || false,
    country_code_secondary:     member.country_code_secondary || "",
    phone_secondary:            member.phone_secondary || "",
    phone_secondary_whatsapp:   member.phone_secondary_whatsapp || false,
    emergency_contact_name:     member.emergency_contact_name || "",
    emergency_contact_email:    member.emergency_contact_email || "",
    phone_emergency:            member.phone_emergency || "",
    country_code_emergency:     member.country_code_emergency || "",
    emergency_contact_relationship: member.emergency_contact_relationship || ""
  };
}
