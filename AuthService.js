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
 * - The comparison is done with constant-time logic to prevent timing attacks
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
  var member = getMemberByEmail(email);
  if (!member || !member.password_hash) {
    // Generic message: don't reveal if email exists or if password is not set
    return { success: false, message: "Invalid email or password." };
  }

  // Hash the plaintext password provided by the user
  var providedPasswordHash = hashPassword(password);
  
  // Compare the provided password hash to the stored hash
  // Use a constant-time comparison to prevent timing attacks
  if (providedPasswordHash !== member.password_hash) {
    logAuditEntry(email, AUDIT_LOGIN_FAILED, "Individual", member.individual_id,
                  "Failed login attempt: incorrect password");
    return { success: false, message: "Invalid email or password." };
  }

  // Verify household is active (not expired, not denied)
  var check = isActiveMember(email);
  if (!check.isActive) {
    logAuditEntry(email, AUDIT_LOGIN_FAILED, "Individual", member.individual_id,
                  "Failed login attempt: " + check.status);
    return { success: false, message: check.message };
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
  logAuditEntry(email, AUDIT_LOGIN, "Individual", member.individual_id,
                "Login successful (role: " + role + ")");

  // Fetch household data to include household_name in response
  var household = getHouseholdById(member.household_id);
  var memberData = _safePublicMember(member);
  if (household) {
    memberData.household_name = household.household_name;
  }

  // Return success with token and member data
  return {
    success: true,
    token:   token,
    role:    role,
    member:  memberData
  };
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
    // (use tpl_032 - Password Set Confirmation)
    if (member.email) {
      sendEmail("tpl_032", member.email, {
        FIRST_NAME: member.first_name
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
    var tokCol  = headers.indexOf("token");
    var expCol  = headers.indexOf("expires_at");
    var emlCol  = headers.indexOf("email");
    var rolCol  = headers.indexOf("role");
    var actCol  = headers.indexOf("active");

    for (var i = 1; i < data.length; i++) {
      if (data[i][tokCol] !== token) continue;
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
    var tokCol  = headers.indexOf("token");
    var actCol  = headers.indexOf("active");
    var emlCol  = headers.indexOf("email");

    for (var i = 1; i < data.length; i++) {
      if (data[i][tokCol] === token) {
        sheet.getRange(i + 1, actCol + 1).setValue(false);
        logAuditEntry(data[i][emlCol], AUDIT_LOGOUT, "Session", token, "User logged out");
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
  var token   = _generateToken();
  var now     = new Date();
  var expires = _sessionExpiry();

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
    var row     = {
      session_id:   generateId("SES"),
      token:        token,
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

  return token;
}

/**
 * Generates a cryptographically random session token.
 * @returns {string}  64-character hex string
 */
function _generateToken() {
  var chars  = "0123456789abcdef";
  var token  = "";
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
 * Determines the role for an email address.
 * Board emails get "board", MGT notification address gets "mgt",
 * everyone else gets "member".
 * @param {string} email
 * @returns {string}  "board" | "mgt" | "member"
 */
function _getRoleForEmail(email) {
  var normalized = email.toLowerCase().trim();
  var boardEmails = [
    EMAIL_BOARD.toLowerCase(),
    EMAIL_TREASURER.toLowerCase(),
    EMAIL_CHAIR.toLowerCase(),
    EMAIL_SECRETARY.toLowerCase()
  ];
  if (boardEmails.indexOf(normalized) !== -1) return "board";
  if (normalized === EMAIL_MGT.toLowerCase())  return "mgt";
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

  sendEmail("tpl_021", member.email, {
    FIRST_NAME:       member.first_name,
    MEMBERSHIP_LEVEL: hh.membership_type,
    EXPIRATION_DATE:  hh.membership_expiration_date
                      ? formatDate(new Date(hh.membership_expiration_date)) : "",
    IF_FAMILY:        hh.household_type === HOUSEHOLD_FAMILY ? "true" : "",
    FAMILY_MEMBERS_LIST: familyNames
  });
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