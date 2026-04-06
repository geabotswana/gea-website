/**
 * ============================================================
 * CODE.GS
 * ============================================================
 * Web app entry point. All requests to the deployed Apps Script
 * URL come here first. doGet() reads the "action" parameter
 * and routes to the appropriate handler function.
 *
 * HOW THE WEB APP WORKS:
 *   1. Google Sites embeds the deployed Apps Script URL in an iframe
 *   2. The browser makes GET requests to this URL with parameters
 *      Example: ?action=login&email=jane@state.gov
 *   3. doGet() parses the parameters and calls the right handler
 *   4. The handler returns a JSON response via ContentService
 *   5. The browser JavaScript reads the JSON and updates the UI
 *
 * PUBLIC ROUTES (no token required):
 *   action=login          — Submit email to log in
 *   action=logout         — Invalidate session
 *   action=serve          — Return the HTML shell for the portal
 *
 * MEMBER ROUTES (valid token required):
 *   action=dashboard      — Member's home screen data
 *   action=profile        — View/edit profile
 *   action=reservations   — List member's reservations
 *   action=book           — Create a new reservation
 *   action=cancel         — Cancel a reservation
 *   action=card           — Digital membership card data
 *   action=payment        — Submit payment confirmation
 *
 * BOARD ROUTES (board role required):
 *   action=admin_pending     — List pending reservations
 *   action=admin_approve     — Approve a reservation
 *   action=admin_deny        — Deny a reservation
 *   action=admin_members     — List all members
 *   action=admin_photo       — Approve/reject photo
 *   action=admin_payment     — Verify a payment
 * ============================================================
 */


/**
 * Web app entry point. Every HTTP request arrives here.
 * Returns JSON responses for API calls, or HTML for the portal shell.
 *
 * @param {Object} e  The event object from Apps Script (e.parameter)
 * @returns {ContentService.TextOutput}
 */
function doGet(e) {
  var params = e.parameter || {};
  var action = params.action || "serve";

  // Public deployment metadata endpoint (JSONP for cross-origin)
  if (action === "deployment_info_jsonp") {
    return _handleDeploymentInfoJsonp(params);
  }

  // Public config value endpoint (JSONP for cross-origin wrappers)
  if (action === "config_value_jsonp") {
    return _handleConfigValueJsonp(params);
  }

  // Serve the HTML portal shell (no auth needed)
  // Uses template evaluation to inject deployment metadata
  if (action === "serve") {
    var t = HtmlService.createTemplateFromFile("Portal");
    t.GEA_DEPLOYMENT_TIMESTAMP = DEPLOYMENT_TIMESTAMP;
    t.GEA_SYSTEM_VERSION = SYSTEM_VERSION;
    t.GEA_BUILD_ID = BUILD_ID;
    t.GEA_DEPLOYMENT_ID = _getDeploymentIdFromUrl_();

    return t.evaluate()
      .setTitle("GEA Member Portal")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // Serve the Admin interface
  // Must use createTemplateFromFile (not createHtmlOutputFromFile) so that
  // scriptlets like <?= ScriptApp.getService().getUrl() ?> are evaluated.
  if (action === "serve_admin") {
    return HtmlService.createTemplateFromFile("Admin")
      .evaluate()
      .setTitle("GEA Admin Portal")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  if (action === "serve_documents") {
    return HtmlService.createHtmlOutputFromFile("DocumentUploadPortal")
      .setTitle("GEA Documents & Photos")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // Serve the image diagnostic page as HTML
  if (action === "image_diagnostic") {
    return _handleImageDiagnostic(params);
  }
 
   // Serve proxied Drive images as real image responses (binary)
   // Usage: ?action=img&id=<DRIVE_FILE_ID>
   if (action === "img") {
     return _handleImageProxy(params);
   }

  // All other actions return JSON
  var result;
  try {
    result = _routeAction(action, params);
  } catch (err) {
    Logger.log("UNCAUGHT ERROR in doGet (action=" + action + "): " + err);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: err.toString(),
        code: "DEBUG_ERROR"
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // If a handler accidentally returns an object, stringify it safely
  if (typeof result !== "string") result = JSON.stringify(result);

  return ContentService
    .createTextOutput(result)
    .setMimeType(ContentService.MimeType.JSON);
}


/**
 * google.script.run handler for Portal API calls.
 * Called from Portal.html via google.script.run to avoid CORS issues.
 * @param {string} action - The API action
 * @param {Object} params - Request parameters
 * @returns {Object} JSON response object
 */
function handlePortalApi(action, params) {
  try {
    var result = _routeAction(action, params);
    // Parse the result if it's a JSON string
    if (typeof result === 'string') {
      return JSON.parse(result);
    }
    return result;
  } catch (err) {
    Logger.log("ERROR in handlePortalApi (action=" + action + "): " + err);
    return {
      success: false,
      message: err.toString(),
      code: "ERROR"
    };
  }
}


/**
 * Routes an action to its handler function.
 * @param {string} action
 * @param {Object} params
 * @returns {string} JSON response string
 */
function _routeAction(action, params) {
  switch (action) {

    // ── PUBLIC ──────────────────────────────────────────────
    case "login":       return _handleLogin(params);
    case "admin_login": return _handleAdminLogin(params);
    case "admin_session": return _handleAdminSession(params);
    case "logout":      return _handleLogout(params);
    case "password_reset_request": return _handlePasswordResetRequest(params);
    case "password_reset_complete": return _handlePasswordResetComplete(params);
    case "password_reset_confirm": return _handlePasswordResetConfirm(params);
    case "change_password": return _handleChangePassword(params);
    case "deployment_info": return _handleDeploymentInfo();
    case "get_config_value": return _handleGetConfigValue(params);
    case "get_rules": return _handleGetRules(params);
    case "submit_application": return _handleSubmitApplication(params);


    // ── MEMBER & APPLICANT ───────────────────────────────────
    case "dashboard":    return _handleDashboard(params);
    case "profile":      return _handleProfile(params);
    case "reservations": return _handleReservations(params);
    case "book":         return _handleBook(params);
    case "cancel":       return _handleCancel(params);
    case "card":         return _handleCard(params);
    case "submit_payment_verification": return _handleSubmitPaymentVerification(params);
    case "get_payment_status": return _handleGetPaymentStatus(params);
    case "get_dues_info":      return _handleGetDuesInfo(params);
    case "updatePhoneNumbers": return _handleUpdatePhoneNumbers(params);

    // Applicant routes (pending membership)
    case "application_status":  return _handleApplicationStatus(params);
    case "withdraw_application": return _handleWithdrawApplication(params);
    case "confirm_documents":   return _handleConfirmDocuments(params);
    case "upload_document":     return _handleUploadDocument(params);
    case "remove_document":     return _handleRemoveDocument(params);
    case "submit_payment_proof": return _handleSubmitPaymentProof(params);
    case "upload_file": return _handleFileUpload(params);
    case "get_file_status": return _handleGetFileStatus(params);
    case "approve_file": return _handleApproveFileSubmission(params);
    case "reject_file": return _handleRejectFileSubmission(params);
    case "request_employment": return _handleRequestEmploymentVerification(params);
    case "get_submission_history": return _handleGetSubmissionHistory(params);
    case "rso_approve": return _handleRsoApprovalLink(params);
    case "send_contact_message":     return _handleSendContactMessage(params);
    case "get_household_members":    return _handleGetHouseholdMembers(params);
    case "add_household_member":     return _handleAddHouseholdMember(params);
    case "remove_household_member":  return _handleRemoveHouseholdMember(params);
    case "edit_household_member":    return _handleEditHouseholdMember(params);
    case "submit_guest_list":        return _handleSubmitGuestList(params);
    case "get_guest_list":           return _handleGetGuestList(params);
    case "get_guest_profiles":       return _handleGetGuestProfiles(params);

    // ── BOARD / ADMIN ────────────────────────────────────────
    case "admin_pending":      return _handleAdminPending(params);
    case "admin_approve":      return _handleAdminApprove(params);
    case "admin_deny":         return _handleAdminDeny(params);
    case "admin_waitlist":      return _handleAdminWaitlist(params);
    case "admin_approve_bump":  return _handleAdminApproveBump(params);
    case "admin_waitlist_list": return _handleAdminWaitlistList(params);
    case "admin_guest_lists":              return _handleAdminGuestLists(params);
    case "admin_save_guest_list_draft":    return _handleAdminSaveGuestListDraft(params);
    case "admin_finalize_guest_list":      return _handleAdminFinalizeGuestList(params);
    case "admin_guest_histories":          return _handleAdminGuestHistories(params);
    case "admin_rso_pending_documents":    return _handleAdminRsoPendingDocuments(params);
    case "admin_rso_approve_document":     return _handleAdminRsoApproveDocument(params);
    case "admin_rso_approved_calendar":    return _handleAdminRsoApprovedCalendar(params);
    case "admin_rso_approved_guest_lists": return _handleAdminRsoApprovedGuestLists(params);
    case "admin_calendar":                 return _handleAdminCalendar(params);
    case "admin_members": return _handleAdminMembers(params);
    case "admin_photo":   return _handleAdminPhoto(params);
    case "admin_pending_photos": return _handleAdminPendingPhotos(params);
    case "admin_applications":       return _handleAdminApplications(params);
    case "admin_application_detail": return _handleAdminApplicationDetail(params);
    case "admin_approve_application": return _handleAdminApproveApplication(params);
    case "admin_deny_application":    return _handleAdminDenyApplication(params);
    case "admin_verify_payment":      return _handleAdminVerifyPayment(params);
    case "admin_pending_payments": return _handleAdminPendingPayments(params);
    case "admin_approve_payment": return _handleAdminApprovePayment(params);
    case "admin_reject_payment": return _handleAdminRejectPayment(params);
    case "admin_clarify_payment": return _handleAdminClarifyPayment(params);
    case "admin_payment_report": return _handleAdminPaymentReport(params);
    case "admin_dashboard_stats": return _handleAdminDashboardStats(params);
    case "admin_reservations_report": return _handleAdminReservationsReport(params);
    case "admin_resend_email":        return _handleAdminResendEmail(params);

    // ── RULES MANAGEMENT (board-only) ────────────────────────
    case "admin_get_rules":     return _handleAdminGetRules(params);
    case "admin_save_rule":     return _handleAdminSaveRule(params);
    case "admin_delete_rule":   return _handleAdminDeleteRule(params);

    // ── ADMIN ACCOUNT MANAGEMENT (board-only) ────────────────
    case "admin_list_admins":           return _handleAdminListAdmins(params);
    case "admin_create_admin":          return _handleAdminCreateAdmin(params);
    case "admin_deactivate_admin":      return _handleAdminDeactivateAdmin(params);
    case "admin_reactivate_admin":      return _handleAdminReactivateAdmin(params);
    case "admin_reset_admin_password":  return _handleAdminResetAdminPassword(params);

    // ── DIAGNOSTICS ──────────────────────────────────────────
    case "image_diagnostic":  return _handleImageDiagnostic(params);

    default:
      return errorResponse("Unknown action: " + action, "NOT_FOUND");
  }
}



 
  // ============================================================
  // IMAGE PROXY (Drive -> WebApp)
  // ============================================================
  
  /**
   * HANDLER: _handleImageProxy
   * PURPOSE: Return a Drive file as an image response so it can be embedded via <img src="...">
   *          even inside a Google Sites iframe (avoids Drive hotlink/preview issues).
   *
   * USAGE:
   *   ?action=img&id=<DRIVE_FILE_ID>
   *
   * SECURITY:
   * - If these assets are intended to be public (logos/favicon), leaving it unauthenticated is ok.
   * - If you ever proxy private images, require a token and enforce requireAuth() here.
   *
   * @param {Object} p
   * @returns {ContentService.TextOutput}
   */
  function _handleImageProxy(p) {
    if (!p || !p.id) {
      return ContentService
        .createTextOutput("Missing required parameter: id")
        .setMimeType(ContentService.MimeType.TEXT);
    }
  
    try {
      var file = DriveApp.getFileById(String(p.id).trim());
      var blob = file.getBlob();
      var bytes = blob.getBytes(); // byte[]
  
      return ContentService
        // Apps Script accepts byte[] here; it returns raw bytes with the selected mime type.
        .createTextOutput(bytes)
        .setMimeType(_mimeTypeEnumFromContentType_(blob.getContentType()));
    } catch (e) {
      Logger.log("ERROR _handleImageProxy (id=" + p.id + "): " + e);
      return ContentService
        .createTextOutput("Could not load image for id=" + p.id)
        .setMimeType(ContentService.MimeType.TEXT);
    }
  }
  
  /**
   * Maps a blob Content-Type string to a ContentService.MimeType enum.
   * ContentService supports only a small set, so we collapse to PNG/JPEG/GIF.
   */
  function _mimeTypeEnumFromContentType_(contentType) {
    var ct = String(contentType || "").toLowerCase();
    if (ct.indexOf("jpeg") >= 0 || ct.indexOf("jpg") >= 0) return ContentService.MimeType.JPEG;
    if (ct.indexOf("gif")  >= 0) return ContentService.MimeType.GIF;
    // default/fallback (includes png, svg, webp, etc.)
    return ContentService.MimeType.PNG;
  }
  
  /**
   * Extract a Drive fileId from common Drive URL formats.
   * Supports:
   * - https://drive.google.com/file/d/<ID>/view
   * - https://drive.google.com/file/d/<ID>/preview
   * - https://drive.google.com/open?id=<ID>
   * - https://drive.google.com/uc?id=<ID>...
   */
  function _extractDriveFileId_(url) {
    if (!url) return "";
    var s = String(url);
  
    // /file/d/<ID>/
    var m = s.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})\//);
    if (m && m[1]) return m[1];
  
    // ?id=<ID>
    m = s.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
    if (m && m[1]) return m[1];
  
    return "";
  }
  
  /**
   * Convert a Drive URL (or fileId-like URL) into a proxied image URL on this webapp.
   * If no Drive fileId is detected, returns the original URL unchanged.
   */
  function _toProxiedImageUrl_(url) {
    var id = _extractDriveFileId_(url);
    if (!id) return url;
    var base = _getWebAppBaseUrl_();
    return base + "?action=img&id=" + encodeURIComponent(id);
  }
  
  /**
   * Returns the deployed web app URL base for this script.
   * NOTE: This returns a valid URL only when the script is deployed as a web app.
   */
  function _getWebAppBaseUrl_() {
    return ScriptApp.getService().getUrl();
  } 


// ============================================================
// PUBLIC HANDLERS
// ============================================================

/**
 * TEMPORARY SETUP FUNCTION - Remove after initial member activation
 * Sets initial passwords for test members.
 * In production, passwords are set during member activation by the board
 * via the Admin Portal's activation workflow.
 */
function _setupTestPasswords() {
  // Password for jane@state.gov
  setPassword("IND-2026-TEST01", "JanePassword2026!", "system");
  
  // Password for john@state.gov  
  setPassword("IND-2026-TEST02", "JohnPassword2026!", "system");
  
  // Password for treasurer
  setPassword("[TREASURER_INDIVIDUAL_ID]", "TreasurerPassword2026!", "system");
  
  Logger.log("Test passwords set. Remove this function after verification.");
}


/**
 * HANDLER: _handleLogin
 * PURPOSE: Processes login requests from the Member Portal.
 *          Accepts email and password, delegates to AuthService.login()
 *          for verification, and returns a session token on success.
 *
 * CALLED BY: doGet() when action=login
 *
 * REQUIRED PARAMETERS:
 * - email: Member's email address
 * - password: Member's password (plaintext, sent over HTTPS)
 *
 * RETURNS:
 * - On success: { success: true, data: { token, role, member } }
 * - On failure: { success: false, message: "Error message" }
 */
function _handleLogin(p) {
  // Validate required parameters
  if (!p.email) {
    return errorResponse("Email is required.", "MISSING_PARAM");
  }
  if (!p.password) {
    return errorResponse("Password is required.", "MISSING_PARAM");
  }

  // Call the login function with both email and password
  var result = login(p.email, p.password);
  
  if (!result.success) {
    return errorResponse(result.message, "AUTH_FAILED");
  }
  
  // Return success with token and member data
  var responseData = {
    token: result.token,
    role: result.role,
    member: result.member,
    is_applicant: result.is_applicant || false
  };
  if (result.application_status) {
    responseData.application_status = result.application_status;
  }
  return successResponse(responseData);
}

function _handleLogout(p) {
  logout(p.token || "");
  return successResponse({}, "Logged out successfully.");
}

/**
 * Admin Portal login — checks Administrators table, not Individuals.
 * Returns role (board/mgt/rso) from the database, not from hardcoded email list.
 */
function _handleAdminLogin(p) {
  if (!p.email)    return errorResponse("Email is required.", "MISSING_PARAM");
  if (!p.password) return errorResponse("Password is required.", "MISSING_PARAM");

  var result = adminLogin(p.email, p.password);
  if (!result.success) return errorResponse(result.message, "AUTH_FAILED");

  return successResponse({ token: result.token, role: result.role, admin: result.admin });
}

/**
 * Retrieves admin account data from a valid session token.
 * Used when the admin portal refreshes to restore the user's name in the header.
 */
function _handleAdminSession(p) {
  if (!p.token) return errorResponse("No session token provided.", "MISSING_PARAM");

  var result = getAdminByToken(p.token);
  if (!result.success) {
    return errorResponse(result.message, "AUTH_FAILED");
  }

  return successResponse({ admin: result.admin, role: result.role });
}

/**
 * HANDLER: _handlePasswordResetRequest
 * PURPOSE: Processes password reset requests from login screens.
 *          User provides email address, backend generates reset token and sends email.
 *
 * CALLED BY: doGet() when action=password_reset_request
 *
 * PARAMETERS:
 * - email: User's email address
 * - user_type: "member" or "admin" (determines which sheet to reset password in)
 *
 * RETURNS:
 * - On success: { success: true, message: "Check email..." }
 * - On failure: { success: false, message: "Error message" }
 */
function _handlePasswordResetRequest(p) {
  if (!p.email) {
    return errorResponse("Email is required.", "MISSING_PARAM");
  }

  var userType = p.user_type || "member";
  if (userType !== "member" && userType !== "admin") {
    return errorResponse("Invalid user type.", "INVALID_PARAM");
  }

  var result = requestPasswordReset(p.email, userType);
  if (!result.success) {
    return errorResponse(result.message, "PASSWORD_RESET_FAILED");
  }

  return successResponse({ message: result.message }, result.message);
}

/**
 * HANDLER: _handlePasswordResetComplete
 * PURPOSE: Completes the password reset by validating token and updating password.
 *
 * CALLED BY: doGet() when action=password_reset_complete
 *
 * PARAMETERS:
 * - token: Reset token from email link
 * - email: User's email address (must match token record)
 * - password: New plaintext password (will be hashed)
 *
 * RETURNS:
 * - On success: { success: true, message: "Password reset successfully" }
 * - On failure: { success: false, message: "Error message" }
 */
function _handlePasswordResetComplete(p) {
  if (!p.token || !p.email || !p.password) {
    return errorResponse("Token, email, and password are required.", "MISSING_PARAM");
  }

  var result = completePasswordReset(p.token, p.email, p.password);
  if (!result.success) {
    return errorResponse(result.message, "PASSWORD_RESET_FAILED");
  }

  return successResponse({ message: result.message }, result.message);
}

/**
 * HANDLER: _handlePasswordResetConfirm
 * PURPOSE: Confirm password reset using only the token (from email link).
 *          Looks up the email from the token, then completes the reset.
 *
 * CALLED BY: Portal.html password reset form (when user clicks email link)
 *
 * PARAMETERS:
 * - token: Password reset token from email
 * - new_password: User's new password
 *
 * RETURNS:
 * - Success: { success: true, message: "..." }
 * - Failure: { success: false, message: "Error reason" }
 */
function _handlePasswordResetConfirm(p) {
  if (!p.token || !p.new_password) {
    return errorResponse("Token and new password are required.", "MISSING_PARAM");
  }

  // Look up email from reset token
  var email = _getEmailFromResetToken(p.token);
  if (!email) {
    return errorResponse("Invalid or expired reset link. Request a new one.", "INVALID_TOKEN");
  }

  // Use existing completePasswordReset function
  var result = completePasswordReset(p.token, email, p.new_password);
  if (!result.success) {
    return errorResponse(result.message, "PASSWORD_RESET_FAILED");
  }

  return successResponse({ message: result.message }, result.message);
}

/**
 * HANDLER: _handleChangePassword
 * PURPOSE: Allow authenticated user to change their password.
 *          Verifies the current password before allowing change.
 *          Used for first-login password change and voluntary updates.
 *
 * REQUIRED PARAMS:
 *   - token (string): Current session token for authentication
 *   - current_password (string): User's current password
 *   - new_password (string): User's new password
 *
 * RETURNS:
 *   On success: { success: true, message: "Password changed successfully..." }
 *   On failure: { success: false, message: "Error message" }
 *
 * CALLED BY: Portal.html and Admin.html password change form
 */
function _handleChangePassword(p) {
  if (!p.token || !p.current_password || !p.new_password) {
    return errorResponse("Token, current password, and new password are required.", "MISSING_PARAM");
  }

  // Validate session and get user info
  var auth = requireAuth(p.token);
  if (!auth.ok) return auth.response;

  // Determine user type based on role
  var userType = (auth.session.role === "board" || auth.session.role === "rso_approve" || auth.session.role === "rso_notify" || auth.session.role === "mgt") ? "admin" : "member";

  var result = changePassword(auth.session.email, p.current_password, p.new_password, userType);
  if (!result.success) {
    return errorResponse(result.message, "PASSWORD_CHANGE_FAILED");
  }

  return successResponse({ message: result.message }, result.message);
}

// ── Admin Account Management Handlers (board-only) ───────────────────────────

function _handleAdminListAdmins(p) {
  var auth = requireAuth(p.token, "board");
  if (!auth.ok) return auth.response;

  var admins = listAdminAccounts(auth.session.email);
  return successResponse({ admins: admins });
}

function _handleAdminCreateAdmin(p) {
  var auth = requireAuth(p.token, "board");
  if (!auth.ok) return auth.response;

  var result = createAdminAccount({
    email:      p.email,
    first_name: p.first_name,
    last_name:  p.last_name,
    role:       p.role,
    password:   p.password
  }, auth.session.email);

  if (!result.success) return errorResponse(result.message, "INVALID_PARAM");
  return successResponse({ admin_id: result.admin_id }, result.message);
}

function _handleAdminDeactivateAdmin(p) {
  var auth = requireAuth(p.token, "board");
  if (!auth.ok) return auth.response;
  if (!p.admin_id) return errorResponse("admin_id is required.", "MISSING_PARAM");

  var result = deactivateAdminAccount(p.admin_id, auth.session.email);
  if (!result.success) return errorResponse(result.message, "NOT_FOUND");
  return successResponse({}, result.message);
}

function _handleAdminReactivateAdmin(p) {
  var auth = requireAuth(p.token, "board");
  if (!auth.ok) return auth.response;
  if (!p.admin_id) return errorResponse("admin_id is required.", "MISSING_PARAM");

  var result = reactivateAdminAccount(p.admin_id, auth.session.email);
  if (!result.success) return errorResponse(result.message, "NOT_FOUND");
  return successResponse({}, result.message);
}

function _handleAdminResetAdminPassword(p) {
  var auth = requireAuth(p.token, "board");
  if (!auth.ok) return auth.response;
  if (!p.admin_id)     return errorResponse("admin_id is required.", "MISSING_PARAM");
  if (!p.new_password) return errorResponse("new_password is required.", "MISSING_PARAM");

  var result = resetAdminPassword(p.admin_id, p.new_password, auth.session.email);
  if (!result.success) return errorResponse(result.message, "INVALID_PARAM");
  return successResponse({}, result.message);
}

/**
 * Returns deployment information (timestamp, version)
 * Public endpoint - no authentication required
 */
function _handleDeploymentInfo() {
  return successResponse({
    timestamp: DEPLOYMENT_TIMESTAMP,
    version: SYSTEM_VERSION,
    name: SYSTEM_NAME
  });
}


// ============================================================
// MEMBER HANDLERS
// ============================================================

/**
 * Returns a single configuration value by key.
 * Public endpoint used by wrappers/portals for runtime UI toggles.
 * @param {{key:string}} p
 * @returns {string}
 */
function _handleGetConfigValue(p) {
  if (!p || !p.key) {
    return errorResponse("Missing required parameter: key", "VALIDATION_ERROR");
  }

  var value = getConfigValue(String(p.key));
  return successResponse({ key: String(p.key), value: value });
}


/**
 * PUBLIC: Get Rules & Regulations in HTML format
 * Used by both Portal.html and index.html (GitHub Pages)
 * No authentication required - rules are public information
 */
function _handleGetRules(p) {
  try {
    var rulesHtml = getRulesHTMLDisplay();
    return successResponse({
      rules_html: rulesHtml,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    Logger.log("ERROR in _handleGetRules: " + error);
    return errorResponse("Failed to load rules: " + error.message, "SERVER_ERROR");
  }
}

function _handleDashboard(p) {
  var auth = requireAuth(p.token);
  if (!auth.ok) return auth.response;

  var member = getMemberByEmail(auth.session.email);
  if (!member) return errorResponse(ERR_NOT_MEMBER, "NOT_FOUND");

  var hh          = getHouseholdById(member.household_id);
  var hhMembers   = getHouseholdMembers(member.household_id);
  var level       = hh ? getMembershipLevel(hh.membership_level_id) : null;
  var upcomingRes = _getMemberUpcomingReservations(member.household_id);

  // Facility usage quotas
  var today = new Date();
  var tennisHours = getTennisHoursThisWeek(hh.household_id, today);
  var leoboCount  = getLeoboReservationsThisMonth(hh.household_id, today);
  var leoboHours  = getLeoboHoursThisMonth(hh.household_id, today);

  return successResponse({
    member:        _safePublicMember(member),
    household:     _safePublicHousehold(hh),
    members:       hhMembers.map(_safePublicMember),
    level:         level,
    reservations:  upcomingRes,
    photoRequired: hhMembers.some(function(m) {
                     return m.photo_status !== PHOTO_STATUS_APPROVED &&
                            m.relationship_to_primary !== RELATIONSHIP_STAFF;
                   }),
    quotas: {
      tennis: { hours_used: tennisHours, hours_limit: TENNIS_WEEKLY_LIMIT_HOURS },
      leobo:  { count_used: leoboCount, count_limit: LEOBO_MONTHLY_LIMIT,
                hours_used: leoboHours, hours_limit: LEOBO_MAX_HOURS }
    },
    exchange_rate: getExchangeRate() || EXCHANGE_RATE_DEFAULT
  });
}

function _handleProfile(p) {
  var auth = requireAuth(p.token);
  if (!auth.ok) return auth.response;

  var member = getMemberByEmail(auth.session.email);
  if (!member) return errorResponse(ERR_NOT_MEMBER, "NOT_FOUND");

  // If method=update, apply changes
  if (p.method === "update") {
    var allowed = ["phone", "emergency_contact_name", "emergency_contact_phone",
                   "emergency_contact_email"];
    for (var i = 0; i < allowed.length; i++) {
      var field = allowed[i];
      if (p[field] !== undefined) {
        updateMemberField(member.individual_id, field, sanitizeInput(p[field]),
                          auth.session.email);
      }
    }
    member = getMemberByEmail(auth.session.email); // re-fetch
  }

  var hh = getHouseholdById(member.household_id);
  return successResponse({
    member:    _safePublicMember(member),
    household: _safePublicHousehold(hh)
  });
}

function _handleReservations(p) {
  var auth = requireAuth(p.token);
  if (!auth.ok) return auth.response;

  var member = getMemberByEmail(auth.session.email);
  if (!member) return errorResponse(ERR_NOT_MEMBER, "NOT_FOUND");

  var reservations = _getMemberAllReservations(member.household_id);
  return successResponse({ reservations: reservations });
}

function _handleBook(p) {
  var auth = requireAuth(p.token);
  if (!auth.ok) return auth.response;

  // Validate required parameters
  var required = ["facility", "event_date", "start_time", "end_time",
                  "duration_hours", "event_name"];
  for (var i = 0; i < required.length; i++) {
    if (!p[required[i]]) {
      return errorResponse("Missing required field: " + required[i], "MISSING_PARAM");
    }
  }

  var member = getMemberByEmail(auth.session.email);
  if (!member) return errorResponse(ERR_NOT_MEMBER, "NOT_FOUND");

  // Staff members cannot make reservations
  if (member.relationship_to_primary === RELATIONSHIP_STAFF) {
    return errorResponse(ERR_STAFF_RESERVATION, "FORBIDDEN");
  }

  var facility = p.facility;
  var eventDate = new Date(p.event_date);

  // Validate facility name
  if (ALL_FACILITIES.indexOf(facility) === -1) {
    return errorResponse("Invalid facility name.", "INVALID_PARAM");
  }

  // Validate event is in the future
  if (eventDate < new Date()) {
    return errorResponse("Reservation date must be in the future.", "INVALID_PARAM");
  }

  var result = createReservation({
    householdId:             member.household_id,
    primaryEmail:            auth.session.email,
    facility:                facility,
    eventDate:               eventDate,
    startTime:               new Date(p.start_time),
    endTime:                 new Date(p.end_time),
    durationHours:           parseFloat(p.duration_hours),
    eventName:               p.event_name,
    hasGuests:               p.has_guests === "true",
    guestCount:              parseInt(p.guest_count) || 0,
    noFundraisingConfirmed:  p.no_fundraising === "true"
  });

  if (!result.success) return errorResponse(result.message, "BOOKING_FAILED");
  return successResponse({
    reservationId: result.reservationId,
    status:        result.status
  }, result.message);
}

/**
 * HANDLER: _handleUpdatePhoneNumbers
 * PURPOSE: Processes phone number updates from the member portal.
 *          Receives country_code + phone_number + whatsapp flag for primary/secondary.
 *          Validates data, stores to Individuals sheet, logs audit entry.
 *
 * CALLED BY: Portal.html when member clicks "Save Phone Numbers"
 *
 * REQUIRED PARAMETERS (via POST):
 * - country_code_primary: ISO country code (BW, US, GB)
 * - phone_primary: Numeric phone (no +, spaces, or dashes)
 * - phone_primary_whatsapp: Boolean
 * - country_code_secondary: (optional)
 * - phone_secondary: (optional)
 * - phone_secondary_whatsapp: (optional)
 *
 * RETURNS:
 * - On success: { success: true, data: { updated_fields: [...] } }
 * - On failure: { success: false, message: "Error message" }
 */
function _handleUpdatePhoneNumbers(p) {
  // Verify user is authenticated
  var auth = requireAuth(p.token);
  if (!auth.ok) return auth.response;
  
  // Validate primary phone is provided
  if (!p.country_code_primary || !p.phone_primary) {
    return errorResponse("Primary phone is required.", "MISSING_PARAM");
  }
  
  // Get the member from auth
  var member = getMemberByEmail(auth.session.email);
  if (!member) {
    return errorResponse("Member not found.", "NOT_FOUND");
  }
  
  // Validate phone numbers using utility function
  if (!isValidPhoneNumber(p.country_code_primary, p.phone_primary)) {
    return errorResponse("Primary phone format is invalid.", "INVALID_PHONE");
  }
  
  if (p.phone_secondary && 
      !isValidPhoneNumber(p.country_code_secondary, p.phone_secondary)) {
    return errorResponse("Secondary phone format is invalid.", "INVALID_PHONE");
  }
  
  try {
    // Update primary phone fields
    updateMemberField(member.individual_id, "country_code_primary", 
                     p.country_code_primary, auth.session.email);
    updateMemberField(member.individual_id, "phone_primary", 
                     p.phone_primary, auth.session.email);
    updateMemberField(member.individual_id, "phone_primary_whatsapp", 
                     p.phone_primary_whatsapp === "true" || p.phone_primary_whatsapp === true,
                     auth.session.email);
    
    // Update secondary phone fields if provided
    if (p.phone_secondary) {
      updateMemberField(member.individual_id, "country_code_secondary", 
                       p.country_code_secondary, auth.session.email);
      updateMemberField(member.individual_id, "phone_secondary", 
                       p.phone_secondary, auth.session.email);
      updateMemberField(member.individual_id, "phone_secondary_whatsapp", 
                       p.phone_secondary_whatsapp === "true" || p.phone_secondary_whatsapp === true,
                       auth.session.email);
    }
    
    // Log the update
    var formattedPhone = formatPhoneNumber(p.country_code_primary, p.phone_primary);
    logAuditEntry(auth.session.email, AUDIT_MEMBER_UPDATED, "Individual", 
                 member.individual_id,
                 "Updated phone numbers: " + formattedPhone + 
                 (p.phone_secondary ? " / " + formatPhoneNumber(p.country_code_secondary, 
                                                                 p.phone_secondary) : ""));
    
    return successResponse({ 
      updated_fields: ["country_code_primary", "phone_primary", "phone_primary_whatsapp",
                       "country_code_secondary", "phone_secondary", "phone_secondary_whatsapp"]
    }, "Phone numbers updated successfully.");
    
  } catch (e) {
    Logger.log("ERROR _handleUpdatePhoneNumbers: " + e);
    return errorResponse("Failed to update phone numbers.", "SERVER_ERROR");
  }
}

function _handleCancel(p) {
  var auth = requireAuth(p.token);
  if (!auth.ok) return auth.response;
  if (!p.reservation_id) return errorResponse("reservation_id required.", "MISSING_PARAM");

  // Verify the reservation belongs to this member's household
  var member = getMemberByEmail(auth.session.email);
  var res    = getReservationById(p.reservation_id);
  if (!res || res.household_id !== member.household_id) {
    return errorResponse(ERR_NOT_AUTHORIZED, "FORBIDDEN");
  }

  var ok = cancelReservation(p.reservation_id, auth.session.email, p.reason || "");
  return ok
    ? successResponse({}, "Reservation cancelled.")
    : errorResponse("Could not cancel reservation.", "CANCEL_FAILED");
}

function _handleCard(p) {
  var auth = requireAuth(p.token);
  if (!auth.ok) return auth.response;

  var member = getMemberByEmail(auth.session.email);
  if (!member) return errorResponse(ERR_NOT_MEMBER, "NOT_FOUND");

  var hh      = getHouseholdById(member.household_id);
  var members = getHouseholdMembers(member.household_id);
  var level   = hh ? getMembershipLevel(hh.membership_level_id) : null;

  // Build card data for every active member in the household
  var cards = members.map(function(m) {
    return {
      individual_id:      m.individual_id,
      name:               m.first_name + " " + m.last_name,
      relationship:       m.relationship_to_primary,
      membership_type:    hh ? hh.membership_type : "",
      household_type:     hh ? hh.household_type : "",
      expiration_date:    hh ? formatDate(new Date(hh.membership_expiration_date)) : "",
      photo_status:       m.photo_status,
      photo_url:          m.photo_approved_url || "",
      can_access_unaccompanied: m.can_access_unaccompanied,
      fitness_eligible:   m.fitness_center_eligible,
      voting_eligible:    m.voting_eligible,
      status:             hh && hh.active ? "ACTIVE" : "INACTIVE"
    };
  });

  return successResponse({ cards: cards });
}

// ============================================================
// BOARD / ADMIN HANDLERS
// ============================================================

/**
 * ============================================================
 * HANDLER: _handleAdminPending
 * ============================================================
 * PURPOSE:
 * Returns all pending reservations awaiting board approval.
 * Used by the Admin dashboard to populate the Pending Reservations page.
 *
 * AUTHENTICATION:
 * Requires board role. Rejects members and MGT users.
 *
 * RESPONSE FORMAT:
 * {
 *   "success": true,
 *   "data": {
 *     "reservations": [
 *       {
 *         "reservation_id": "RES-2026-001",
 *         "event_date": "2026-02-14",
 *         "facility": "Tennis Courts",
 *         "member_name": "John Smith",
 *         "email": "john@state.gov",
 *         "guest_count": 2,
 *         "status": "STATUS_PENDING"
 *       }
 *     ]
 *   }
 * }
 * ============================================================
 */
function _handleAdminPending(p) {
  // Step 1: Verify caller is a board member
  var auth = requireAuth(p.token, "board");
  if (!auth.ok) return auth.response;

  try {
    // Step 2: Read all reservations from the Reservations sheet
    var sheet = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var pending = [];

    // Step 3: Filter for STATUS_PENDING and STATUS_WAITLISTED
    for (var i = 1; i < data.length; i++) {
      var res = rowToObject(headers, data[i]);
      if (res.status === STATUS_PENDING || res.status === STATUS_WAITLISTED) {
        pending.push(res);
      }
    }

    // Step 4: Sort by reservation_date ascending
    pending.sort(function(a, b) {
      return new Date(a.reservation_date) - new Date(b.reservation_date);
    });

    return successResponse({
      reservations: pending,
      count: pending.length
    });
  } catch (e) {
    Logger.log("ERROR _handleAdminPending: " + e);
    return errorResponse("Could not load pending reservations.", "READ_FAILED");
  }
}


/**
 * ============================================================
 * HANDLER: _handleAdminApprove
 * ============================================================
 * PURPOSE:
 * Approves a pending reservation after board review.
 * Changes status from STATUS_PENDING to STATUS_CONFIRMED.
 * Sends a confirmation email to the member.
 *
 * AUTHENTICATION:
 * Requires board role (can approve tennis or leobo).
 * MGT users can only approve Leobo reservations (checked in approveReservation()).
 *
 * PARAMETERS REQUIRED:
 *   token: session token
 *   reservation_id: the reservation to approve
 *   notes: (optional) internal notes about the approval
 *
 * RESPONSE:
 * { "success": true, "data": {}, "message": "Reservation approved." }
 * ============================================================
 */
function _handleAdminApprove(p) {
  // Step 1: Verify caller is authenticated and has board or MGT role
  var auth = requireAuth(p.token);
  if (!auth.ok) return auth.response;

  // Step 2: Only board or MGT can approve; others are forbidden
  if (auth.session.role !== "board" && auth.session.role !== "mgt") {
    return errorResponse(ERR_NOT_AUTHORIZED, "FORBIDDEN");
  }

  // Step 3: Check that reservation_id parameter was provided
  if (!p.reservation_id) {
    return errorResponse("reservation_id is required.", "MISSING_PARAM");
  }

  // Step 4: Call ReservationService to approve the reservation
  // This handles all the business logic: status update, email, audit log
  var ok = approveReservation(p.reservation_id, auth.session.email, p.notes || "", auth.session.role);

  if (!ok) {
    return errorResponse("Could not approve reservation.", "APPROVE_FAILED");
  }

  return successResponse({}, "Reservation approved.");
}


/**
 * ============================================================
 * HANDLER: _handleAdminDeny
 * ============================================================
 * PURPOSE:
 * Denies a pending reservation with an optional reason.
 * Changes status to STATUS_CANCELLED.
 * Sends a denial email to the member with the reason if provided.
 *
 * AUTHENTICATION:
 * Requires board role.
 *
 * PARAMETERS REQUIRED:
 *   token: session token
 *   reservation_id: the reservation to deny
 *   reason: (optional) reason for denial, shown to member
 *
 * RESPONSE:
 * { "success": true, "data": {}, "message": "Reservation denied." }
 * ============================================================
 */
function _handleAdminDeny(p) {
  // Step 1: Verify caller is a board member
  var auth = requireAuth(p.token, "board");
  if (!auth.ok) return auth.response;

  // Step 2: Check that reservation_id parameter was provided
  if (!p.reservation_id) {
    return errorResponse("reservation_id is required.", "MISSING_PARAM");
  }

  // Step 3: Call ReservationService to deny the reservation
  // This handles: status update, email with reason, audit log
  var ok = denyReservation(p.reservation_id, auth.session.email, p.reason || "");

  if (!ok) {
    return errorResponse("Could not deny reservation.", "DENY_FAILED");
  }

  return successResponse({}, "Reservation denied.");
}


/**
 * ============================================================
 * HANDLER: _handleAdminWaitlist
 * ============================================================
 * PURPOSE:
 * Board action: places a PENDING reservation onto the waitlist
 * instead of approving or denying outright.
 *
 * AUTHENTICATION:
 * Requires board role.
 *
 * PARAMETERS REQUIRED:
 *   token: session token
 *   reservation_id: the reservation to waitlist
 *   notes: (optional)
 * ============================================================
 */
function _handleAdminWaitlist(p) {
  var auth = requireAuth(p.token, "board");
  if (!auth.ok) return auth.response;

  if (!p.reservation_id) return errorResponse("reservation_id is required.", "MISSING_PARAM");

  var ok = addToWaitlist(p.reservation_id, auth.session.email, p.notes || "");
  if (!ok) return errorResponse("Could not waitlist reservation.", "WAITLIST_FAILED");

  return successResponse({}, "Reservation placed on waitlist.");
}


/**
 * ============================================================
 * HANDLER: _handleAdminApproveBump
 * ============================================================
 * PURPOSE:
 * Board action: manually promotes a WAITLISTED reservation
 * to confirmed (or tentative if excess).
 *
 * AUTHENTICATION:
 * Requires board role.
 *
 * PARAMETERS REQUIRED:
 *   token: session token
 *   reservation_id: the waitlisted reservation to promote
 *   notes: (optional)
 * ============================================================
 */
function _handleAdminApproveBump(p) {
  var auth = requireAuth(p.token, "board");
  if (!auth.ok) return auth.response;

  if (!p.reservation_id) return errorResponse("reservation_id is required.", "MISSING_PARAM");

  var ok = approveBump(p.reservation_id, auth.session.email, p.notes || "");
  if (!ok) return errorResponse("Could not approve bump.", "BUMP_FAILED");

  return successResponse({}, "Waitlisted reservation promoted.");
}


/**
 * ============================================================
 * HANDLER: _handleAdminWaitlistList (RES.5.4)
 * ============================================================
 * PURPOSE:
 * Returns all STATUS_WAITLISTED reservations sorted by facility
 * then by submission_timestamp (earliest = position 1).
 * Used by the Waitlist management page in Admin.html.
 *
 * AUTHENTICATION: Requires board role.
 */
function _handleAdminWaitlistList(p) {
  var auth = requireAuth(p.token, "board");
  if (!auth.ok) return auth.response;

  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var waitlisted = [];

    for (var i = 1; i < data.length; i++) {
      var res = rowToObject(headers, data[i]);
      if (res.status === STATUS_WAITLISTED && res.reservation_id) {
        waitlisted.push(res);
      }
    }

    // Sort: facility asc, then reservation_date asc, then submission_timestamp asc
    waitlisted.sort(function(a, b) {
      if (a.facility < b.facility) return -1;
      if (a.facility > b.facility) return  1;
      var da = new Date(a.reservation_date), db = new Date(b.reservation_date);
      if (da - db !== 0) return da - db;
      return new Date(a.submission_timestamp) - new Date(b.submission_timestamp);
    });

    return successResponse({ waitlisted: waitlisted, count: waitlisted.length });
  } catch (e) {
    Logger.log("ERROR _handleAdminWaitlistList: " + e);
    return errorResponse("Could not load waitlist.", "SERVER_ERROR");
  }
}


/**
 * ============================================================
 * HANDLER: _handleAdminMembers
 * ============================================================
 * PURPOSE:
 * Returns all member households in a list the board can search and filter.
 * Each household includes: name, type, status, expiration date, email.
 *
 * AUTHENTICATION:
 * Requires board role.
 *
 * RESPONSE FORMAT:
 * {
 *   "success": true,
 *   "data": {
 *     "households": [
 *       {
 *         "household_id": "HH-2026-001",
 *         "household_name": "Smith Family",
 *         "membership_type": "ACTIVE",
 *         "status": "Approved",
 *         "membership_expiration_date": "Dec 31, 2026",
 *         "email": "john@state.gov"
 *       }
 *     ],
 *     "count": 47
 *   }
 * }
 * ============================================================
 */
function _handleAdminMembers(p) {
  // Step 1: Verify caller is a board member
  var auth = requireAuth(p.token, "board");
  if (!auth.ok) return auth.response;

  try {
    // Step 2: Read all households from the Households sheet
    var sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_HOUSEHOLDS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var households = [];

    // Step 3: Convert each row to a safe public object and collect
    for (var i = 1; i < data.length; i++) {
      var hh = rowToObject(headers, data[i]);
      // Skip rows with no household_id (empty rows)
      if (!hh.household_id) continue;
      // Add only safe fields to the response
      households.push(_safePublicHousehold(hh));
    }

    // Step 4: Return the list with count
    return successResponse({
      households: households,
      count: households.length
    });
  } catch (e) {
    Logger.log("ERROR _handleAdminMembers: " + e);
    return errorResponse("Could not load members.", "READ_FAILED");
  }
}


/**
 * ============================================================
 * HANDLER: _handleAdminPhoto
 * ============================================================
 * PURPOSE:
 * Approves or rejects a pending member photo submission.
 * Updates the individual member's photo_status field.
 * Sends email notification to the member.
 *
 * AUTHENTICATION:
 * Requires board role.
 *
 * PARAMETERS REQUIRED:
 *   token: session token
 *   individual_id: the member whose photo to review
 *   decision: "approved" or "rejected"
 *   reason: (optional) reason for rejection, shown to member if rejected
 *
 * RESPONSE:
 * { "success": true, "data": {}, "message": "Photo approved." }
 * ============================================================
 */
function _handleAdminPhoto(p) {
  // Step 1: Verify caller is a board member
  var auth = requireAuth(p.token, "board");
  if (!auth.ok) return auth.response;

  // Step 2: Check required parameters
  if (!p.individual_id) {
    return errorResponse("individual_id is required.", "MISSING_PARAM");
  }
  if (!p.decision) {
    return errorResponse("decision is required (approved or rejected).", "MISSING_PARAM");
  }

  // Step 3: Validate decision is one of the allowed values
  if (p.decision !== "approved" && p.decision !== "rejected") {
    return errorResponse("decision must be 'approved' or 'rejected'.", "INVALID_PARAM");
  }

  // Step 4: Call MemberService to update photo status
  // This handles: status update, email notification, audit log
  var ok = updatePhotoStatus(p.individual_id, p.decision,
                             auth.session.email, p.reason || "");

  if (!ok) {
    return errorResponse("Could not update photo status.", "UPDATE_FAILED");
  }

  return successResponse({}, "Photo " + p.decision + ".");
}


/**
 * HANDLER: _handleAdminPendingPhotos
 * Returns list of photos pending board approval (status = "submitted")
 */
function _handleAdminPendingPhotos(p) {
  var auth = requireAuth(p.token, "board");
  if (!auth.ok) return auth.response;

  try {
    var fileSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_FILE_SUBMISSIONS);
    var fileData = fileSheet.getDataRange().getValues();
    var fileHeaders = fileData[0];
    var photos = [];

    for (var i = 1; i < fileData.length; i++) {
      var file = rowToObject(fileHeaders, fileData[i]);
      // Only include photos with status = "submitted"
      if (file.submission_id && file.document_type === "photo" && file.status === "submitted") {
        var individual = getMemberById(file.individual_id);
        if (individual) {
          photos.push({
            submission_id: file.submission_id,
            individual_id: file.individual_id,
            individual_name: individual.first_name + " " + individual.last_name,
            household_id: individual.household_id,
            submitted_date: file.submitted_date,
            status: file.status
          });
        }
      }
    }

    return successResponse({
      photos: photos,
      count: photos.length
    });

  } catch (e) {
    Logger.log("ERROR _handleAdminPendingPhotos: " + e);
    return errorResponse("Could not load photos.", "SERVER_ERROR");
  }
}

// ============================================================
// SHARED PRIVATE HELPERS
// ============================================================

/**
 * Returns upcoming reservations for a household (future, not cancelled).
 */
function _getMemberUpcomingReservations(householdId) {
  var today = new Date(); today.setHours(0, 0, 0, 0);
  try {
    var sheet = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var results = [];

    for (var i = 1; i < data.length; i++) {
      var res = rowToObject(headers, data[i]);
      if (res.household_id !== householdId) continue;
      if (res.status === STATUS_CANCELLED) continue;
      if (new Date(res.event_date) < today) continue;
      results.push(res);
    }
    results.sort(function(a, b) { return new Date(a.event_date) - new Date(b.event_date); });
    return results;
  } catch (e) {
    Logger.log("ERROR _getMemberUpcomingReservations: " + e);
    return [];
  }
}

/**
 * Returns all reservations for a household (all statuses, sorted newest first).
 */
function _getMemberAllReservations(householdId) {
  try {
    var sheet = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var results = [];

    for (var i = 1; i < data.length; i++) {
      var res = rowToObject(headers, data[i]);
      if (res.household_id !== householdId) continue;
      results.push(res);
    }
    results.sort(function(a, b) { return new Date(b.event_date) - new Date(a.event_date); });
    return results;
  } catch (e) {
    Logger.log("ERROR _getMemberAllReservations: " + e);
    return [];
  }
}

/**
 * HANDLER: _handleImageDiagnostic
 * PURPOSE: Serve a live diagnostic page showing all image assets defined in Config.gs.
 *          (These URLs should now point at Google Cloud Storage objects, not Google Drive.)
 *
 * WHAT IT DOES:
 * 1. Pulls all image URLs from Config.gs constants (logos, favicon, etc.)
 * 2. Renders an HTML page with a grid of image cards
 * 3. Each card displays the image and its constant name
 * 4. Visual indicators show which images load successfully (✓ green) vs fail (✗ red)
 * 5. Displays the full URL for each constant for easy debugging
 *
 * CALLED BY: doGet() when action=image_diagnostic
 *
 * @param {object} p - Query parameters (unused for this handler)
 * @returns {HtmlOutput} Diagnostic page with live image tests
 */
function _handleImageDiagnostic(params) {
  // Original Config.gs URLs
  var rawImageConstants = getImageConstants();

  // For Drive-hosted assets, prefer proxied URLs so <img> loads reliably in Google Sites iframes
  var imageConstants = {};
  Object.keys(rawImageConstants).forEach(function(k) {
    imageConstants[k] = _toProxiedImageUrl_(rawImageConstants[k]);
  });
 
  var html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GEA Image Diagnostic (Config.gs → GCS URLs)</title>

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        h1 {
            color: #0A3161;
            margin-bottom: 10px;
            border-bottom: 4px solid #B31942;
            padding-bottom: 10px;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        
        .image-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .image-card {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .image-card.error {
            border-left: 5px solid #C62828;
        }
        
        .image-card.success {
            border-left: 5px solid #2E7D32;
        }
        
        .image-preview {
            width: 100%;
            height: 200px;
            background: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #999;
            overflow: hidden;
        }
        
        .image-preview img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 10px;
        }
        
        .image-info {
            padding: 15px;
        }
        
        .constant-name {
            font-weight: 700;
            color: #0A3161;
            margin-bottom: 8px;
            word-break: break-word;
            font-size: 13px;
        }
        
        .url-field {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 10px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            color: #333;
            word-break: break-all;
            max-height: 80px;
            overflow-y: auto;
            border: 1px solid #e0e0e0;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-badge.ok {
            background: #E8F5E9;
            color: #2E7D32;
            border: 1px solid #C8E6C9;
        }
        
        .status-badge.error {
            background: #FFEBEE;
            color: #C62828;
            border: 1px solid #FFCDD2;
        }
        
        .error-message {
            color: #C62828;
            font-size: 11px;
            margin-top: 8px;
            padding: 8px;
            background: #FFEBEE;
            border-radius: 3px;
            border-left: 3px solid #C62828;
        }
        
        .summary {
            background: white;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .summary-item {
            text-align: center;
            padding: 10px;
            border-radius: 4px;
        }
        
        .summary-item.working {
            background: #E8F5E9;
        }
        
        .summary-item.broken {
            background: #FFEBEE;
        }
        
        .summary-count {
            font-size: 28px;
            font-weight: 700;
            display: block;
            margin-bottom: 5px;
        }
        
        .summary-label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>GEA Image Diagnostic</h1>
        <p class="subtitle">Live test — URLs pulled from Config.gs (expected: Google Cloud Storage object URLs)</p>
        
        <div class="summary">
            <div class="summary-item working" id="workingCount">
                <span class="summary-count" id="countWorking">0</span>
                <span class="summary-label">Working ✓</span>
            </div>
            <div class="summary-item broken" id="brokenCount">
                <span class="summary-count" id="countBroken">0</span>
                <span class="summary-label">Broken ✗</span>
            </div>
        </div>
        
        <div class="image-grid" id="imageGrid">
            <!-- Images will be populated here -->
        </div>
    </div>

    <script>
        // Image constants pulled from Code.gs
        const imageConstants = ${JSON.stringify(imageConstants)};
        
        // Track status
        const imageStatus = {};
        let totalLoaded = 0;
        let totalFailed = 0;
        
        // Initialize
        Object.keys(imageConstants).forEach(key => {
            imageStatus[key] = 'loading';
        });
        
        function renderImages() {
            const grid = document.getElementById('imageGrid');
            grid.innerHTML = '';
            
            Object.entries(imageConstants).forEach(([constantName, url]) => {
                const status = imageStatus[constantName];
                const isError = status === 'error';
                
                const card = document.createElement('div');
                card.className = 'image-card ' + (isError ? 'error' : 'success');
                card.id = 'card-' + constantName;
                
                const statusBadge = isError ? 
                    '<span class="status-badge error">✗ Failed</span>' :
                    '<span class="status-badge ok">✓ Loaded</span>';
                
                const errorMsg = isError ? 
                    '<div class="error-message">Image failed to load - URL may be invalid</div>' :
                    '';
                
                card.innerHTML = \`
                    <div class="image-preview" id="preview-\${constantName}">
                        <img src="\${url}" 
                             onerror="handleImageError('\${constantName}')" 
                             onload="handleImageLoad('\${constantName}')"
                             alt="\${constantName}">
                    </div>
                    <div class="image-info">
                        <div class="constant-name">\${constantName}</div>
                        <div style="margin-bottom: 10px;">\${statusBadge}</div>
                        <div class="url-field">\${escapeHtml(url)}</div>
                        \${errorMsg}
                    </div>
                \`;
                
                grid.appendChild(card);
            });
        }
        
        function handleImageLoad(constantName) {
            imageStatus[constantName] = 'ok';
            totalLoaded++;
            updateSummary();
            updateCard(constantName);
        }
        
        function handleImageError(constantName) {
            imageStatus[constantName] = 'error';
            totalFailed++;
            updateSummary();
            updateCard(constantName);
        }
        
        function updateCard(constantName) {
            const card = document.getElementById('card-' + constantName);
            if (!card) return;
            
            const isError = imageStatus[constantName] === 'error';
            card.className = 'image-card ' + (isError ? 'error' : 'success');
        }
        
        function updateSummary() {
            document.getElementById('countWorking').textContent = totalLoaded;
            document.getElementById('countBroken').textContent = totalFailed;
        }
        
        function escapeHtml(text) {
            const map = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'};
            return text.replace(/[&<>"']/g, m => map[m]);
        }
        
        // Render on load
        renderImages();
    </script>
</body>
</html>
  `;

  return HtmlService.createHtmlOutput(html)
    .setTitle("GEA Image Diagnostic (GCS)")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/**
 * HELPER: getImageConstants
 * PURPOSE: Collect all image URL constants from Config.gs.
 *
 * DETAILS:
 * - These constants are public HTTPS URLs pointing to Google Cloud Storage.
 * - The gea-public-assets bucket is publicly readable (allUsers has Storage Object Viewer role).
 * - No authentication or signed URLs required.
 *
 * RETURNS:
 *   Object<string,string> mapping constant name -> HTTPS URL
 *
 * Used by:
 *   - _handleImageDiagnostic() to display all configured image assets and test loading.
 */
function getImageConstants() {
  return {
    'FAVICON_URL': FAVICON_URL,
    'LOGO_ROUND_80_URL': LOGO_ROUND_80_URL,
    'LOGO_ROUND_120_URL': LOGO_ROUND_120_URL,
    'LOGO_ROUND_160_URL': LOGO_ROUND_160_URL,
    'LOGO_ROUND_200_URL': LOGO_ROUND_200_URL,
    'LOGO_ROUND_240_URL': LOGO_ROUND_240_URL,
    'LOGO_TYPE_LIGHT_560_URL': LOGO_TYPE_LIGHT_560_URL,
    'LOGO_TYPE_LIGHT_800_URL': LOGO_TYPE_LIGHT_800_URL,
    'LOGO_TYPE_LIGHT_1120_URL': LOGO_TYPE_LIGHT_1120_URL,
    'LOGO_TYPE_DARK_560_URL': LOGO_TYPE_DARK_560_URL,
    'LOGO_TYPE_DARK_800_URL': LOGO_TYPE_DARK_800_URL,
    'LOGO_TYPE_DARK_1120_URL': LOGO_TYPE_DARK_1120_URL
  };
}


/**
 * Returns a subset of household fields safe to send to the browser.
 */
function _safePublicHousehold(hh) {
  if (!hh) return null;

  // Get primary member's email
  var primaryEmail = "";
  if (hh.primary_member_id) {
    try {
      var member = getMemberById(hh.primary_member_id);
      if (member) {
        primaryEmail = member.email || "";
      }
    } catch (e) {
      Logger.log("Warning: Could not fetch primary member email for household " + hh.household_id);
    }
  }

  return {
    household_id:               hh.household_id,
    household_name:             hh.household_name,
    household_type:             hh.household_type || "",
    membership_type:            hh.membership_type,
    application_status:         hh.application_status,
    active:                     hh.active,
    email:                      primaryEmail,
    membership_expiration_date: hh.membership_expiration_date
                                ? formatDate(new Date(hh.membership_expiration_date)) : "",
    membership_start_date:      hh.membership_start_date
                                ? formatDate(new Date(hh.membership_start_date)) : "",
    dues_amount_usd:            hh.dues_amount || 0,
    dues_paid_amount_usd:       hh.dues_paid_amount || 0,
    balance_due_usd:            hh.balance_due || 0,
    sponsor_name:               hh.sponsor_name || "",
    sponsor_verified:           hh.sponsor_verified || false,
    address_street:             hh.address_street || "",
    address_city:               hh.address_city || "",
    address_country:            hh.address_country || "",
    country_code_primary:       hh.country_code_primary || "",
    phone_primary:              hh.phone_primary || "",
    phone_primary_whatsapp:     hh.phone_primary_whatsapp || false
  };
}


// ============================================================
// MEMBERSHIP APPLICATION HANDLERS
// ============================================================

/**
 * HANDLER: _handleSubmitApplication
 * PURPOSE: Submit a new membership application (public, no auth required)
 */
function _handleSubmitApplication(p) {
  try {
    var result = createApplicationRecord(p, "applicant");
    if (result.success) {
      return successResponse({
        application_id: result.application_id,
        household_id: result.household_id,
        individual_id: result.individual_id,
        temp_password: result.temp_password,
        message: result.message
      });
    } else {
      Logger.log("Application submission validation error: " + result.message);
      return errorResponse(result.message, "VALIDATION_FAILED");
    }
  } catch (e) {
    var errorMsg = "Error: " + e.toString();
    logAuditEntry("applicant", "APPLICATION_ERROR", "Application", "", errorMsg);
    return errorResponse("Error submitting application.", "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleApplicationStatus
 * PURPOSE: Get applicant's application status, documents, and next steps
 */
function _handleApplicationStatus(p) {
  try {
    var auth = requireAuth(p.token);
    if (!auth.ok) return auth.response;

    var result = getApplicationForApplicant(auth.session.email);
    if (result.success) {
      return successResponse(result);
    } else {
      return errorResponse(result.message, "NOT_FOUND");
    }
  } catch (e) {
    return errorResponse("Error retrieving application status.", "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleWithdrawApplication
 * PURPOSE: Applicant withdraws their membership application
 */
function _handleWithdrawApplication(p) {
  try {
    var auth = requireAuth(p.token);
    if (!auth.ok) return auth.response;

    if (!p.application_id) {
      return errorResponse("application_id is required.", "INVALID_PARAM");
    }

    var result = withdrawApplication(p.application_id, auth.session.email, p.reason || "");
    if (result.success) {
      return successResponse(result);
    } else {
      return errorResponse(result.message, "OPERATION_FAILED");
    }
  } catch (e) {
    return errorResponse("Error withdrawing application: " + e.toString(), "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleConfirmDocuments
 * PURPOSE: Applicant confirms all documents have been uploaded
 */
function _handleConfirmDocuments(p) {
  try {
    var auth = requireAuth(p.token);
    if (!auth.ok) return auth.response;

    var result = confirmDocumentsUploaded(p.application_id, auth.session.email);
    if (result.success) {
      return successResponse(result);
    } else {
      return errorResponse(result.message, "OPERATION_FAILED");
    }
  } catch (e) {
    return errorResponse("Error confirming documents.", "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleRemoveDocument
 * PURPOSE: Applicant removes a just-uploaded document that has not yet entered RSO review
 */
function _handleRemoveDocument(p) {
  var auth = requireAuth(p.token);
  if (!auth.ok) return auth.response;
  if (!p.individual_id || !p.document_type) return errorResponse("Missing individual_id or document_type.", "INVALID_PARAM");
  var validTypes = ["passport", "omang", "photo"];
  if (validTypes.indexOf(p.document_type) === -1) return errorResponse("Invalid document type.", "INVALID_PARAM");
  return removeDocumentSubmission(p.individual_id, p.document_type, auth.email);
}

/**
 * HANDLER: _handleUploadDocument
 * PURPOSE: Applicant uploads a required document (passport, omang, photo)
 */
function _handleUploadDocument(p) {
  try {
    var auth = requireAuth(p.token);
    if (!auth.ok) return auth.response;

    // Validate required fields
    if (!p.individual_id || !p.document_type || !p.file_data_base64 || !p.file_name) {
      return errorResponse("Missing required document fields.", "INVALID_PARAM");
    }

    // Validate document type
    var validTypes = ["passport", "omang", "photo"];
    if (validTypes.indexOf(p.document_type) === -1) {
      return errorResponse("Invalid document type.", "INVALID_PARAM");
    }

    // Decode base64 and create file with a meaningful name
    var ext = p.file_name.indexOf('.') !== -1 ? p.file_name.split('.').pop().toLowerCase() : 'bin';
    var dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd');
    var meaningfulName = p.individual_id + '_' + p.document_type + '_' + dateStr + '.' + ext;
    var blob = Utilities.newBlob(Utilities.base64Decode(p.file_data_base64), "application/octet-stream", meaningfulName);
    var folder = DriveApp.getFolderById(_getSubmissionFolderId_(p.document_type));
    var file = folder.createFile(blob);

    // Create File Submission record
    var submissionId = generateId("SUB");
    var submissionData = {
      submission_id: submissionId,
      individual_id: p.individual_id,
      document_type: p.document_type,
      status: "submitted",
      file_id: file.getId(),
      file_name: meaningfulName,
      submitted_date: new Date(),
      doc_number: p.doc_number || "",
      doc_expiry_date: p.doc_expiry || "",
      doc_country: p.doc_country || "",
      passport_type: p.passport_type || "",
      is_current: true,
      rso_reviewed_by: "",
      rso_review_date: "",
      gea_reviewed_by: "",
      gea_review_date: "",
      rejection_reason: "",
      cloud_storage_path: ""
    };

    var submissionSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_FILE_SUBMISSIONS);
    submissionSheet.appendRow(_objectToSubmissionRow(submissionData));

    logAuditEntry(auth.session.email, AUDIT_FILE_SUBMISSION_CREATED, "FileSubmission", submissionId,
                  "Uploaded " + p.document_type);

    return successResponse({
      submission_id: submissionId,
      file_id: file.getId(),
      message: "Document uploaded successfully."
    });

  } catch (e) {
    return errorResponse("Error uploading document: " + e.toString(), "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleSubmitPaymentProof
 * PURPOSE: Applicant submits payment proof for treasurer verification
 */
function _handleSubmitPaymentProof(p) {
  try {
    var auth = requireAuth(p.token);
    if (!auth.ok) return auth.response;

    var proofFileId = p.proof_file_id || '';

    // Accept optional inline file payload for payment proof uploads.
    if (!proofFileId && p.file_data_base64 && p.file_name) {
      var proofBlob = Utilities.newBlob(
        Utilities.base64Decode(p.file_data_base64),
        p.file_content_type || "application/octet-stream",
        p.file_name
      );
      var proofsFolder = DriveApp.getFolderById(FOLDER_DOCUMENTS);
      var proofFile = proofsFolder.createFile(proofBlob);
      proofFileId = proofFile.getId();
    }

    var result = submitPaymentProof(
      p.application_id,
      auth.session.email,
      p.payment_method,
      proofFileId,
      p.notes
    );

    if (result.success) {
      return successResponse(result);
    } else {
      return errorResponse(result.message, "OPERATION_FAILED");
    }
  } catch (e) {
    return errorResponse("Error submitting payment proof: " + e.toString(), "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleFileUpload
 * PURPOSE: Upload document/photo/employment file for current member.
 */
function _handleFileUpload(p) {
  try {
    var auth = requireAuth(p.token);
    if (!auth.ok) return auth.response;

    if (!p.individual_id || !p.document_type || !p.file_data_base64 || !p.file_name) {
      return errorResponse("Missing required fields.", "INVALID_PARAM");
    }

    var blob = Utilities.newBlob(
      Utilities.base64Decode(p.file_data_base64),
      p.file_content_type || "application/octet-stream",
      p.file_name
    );

    var result = uploadFileSubmission({
      individual_id: p.individual_id,
      document_type: p.document_type,
      file_blob: blob,
      file_name: p.file_name,
      file_size_bytes: Number(p.file_size_bytes || 0),
      upload_device_type: p.upload_device_type || "web",
      user_email: auth.session.email
    });

    if (!result.ok) return errorResponse(result.error, result.code || "UPLOAD_FAILED");
    return successResponse(result);
  } catch (e) {
    return errorResponse("Error uploading file: " + e.toString(), "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleGetFileStatus
 * PURPOSE: Get per-individual file submission status dashboard data.
 */
function _handleGetFileStatus(p) {
  try {
    var auth = requireAuth(p.token);
    if (!auth.ok) return auth.response;
    if (!p.individual_id) return errorResponse("individual_id is required.", "INVALID_PARAM");

    var result = getFileSubmissionStatus(p.individual_id);
    if (result.ok === false) return errorResponse(result.error || "Could not load status", "NOT_FOUND");
    return successResponse(result);
  } catch (e) {
    return errorResponse("Error retrieving file status: " + e.toString(), "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleApproveFileSubmission
 * PURPOSE: Board/admin approves a file submission.
 */
function _handleApproveFileSubmission(p) {
  try {
    var auth = requireAuth(p.token, "board");
    if (!auth.ok) return auth.response;
    if (!p.submission_id) return errorResponse("submission_id is required.", "INVALID_PARAM");

    var result = approveFileSubmission(p.submission_id, auth.session.email);
    if (!result.ok) return errorResponse(result.error || "Approval failed", "APPROVAL_FAILED");
    return successResponse(result);
  } catch (e) {
    return errorResponse("Error approving file: " + e.toString(), "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleRejectFileSubmission
 * PURPOSE: Board/admin rejects a file submission.
 */
function _handleRejectFileSubmission(p) {
  try {
    var auth = requireAuth(p.token, "board");
    if (!auth.ok) return auth.response;
    if (!p.submission_id || !p.rejection_reason) {
      return errorResponse("submission_id and rejection_reason are required.", "INVALID_PARAM");
    }

    var result = rejectFileSubmission(p.submission_id, p.rejection_reason, auth.session.email);
    if (!result.ok) return errorResponse(result.error || "Rejection failed", "REJECTION_FAILED");
    return successResponse(result);
  } catch (e) {
    return errorResponse("Error rejecting file: " + e.toString(), "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleRequestEmploymentVerification
 * PURPOSE: Board/admin requests employment verification files for a household.
 */
function _handleRequestEmploymentVerification(p) {
  try {
    var auth = requireAuth(p.token, "board");
    if (!auth.ok) return auth.response;
    if (!p.household_id || !p.individual_ids) {
      return errorResponse("household_id and individual_ids are required.", "INVALID_PARAM");
    }

    var ids = p.individual_ids;
    if (typeof ids === "string") {
      try { ids = JSON.parse(ids); } catch (ignore) { ids = ids.split(","); }
    }

    var result = requestEmploymentVerification(p.household_id, ids, p.request_reason || "");
    if (!result.ok) return errorResponse(result.error || "Request failed", "REQUEST_FAILED");
    return successResponse(result);
  } catch (e) {
    return errorResponse("Error requesting employment verification: " + e.toString(), "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleGetSubmissionHistory
 * PURPOSE: Return submission history entries for a member.
 */
function _handleGetSubmissionHistory(p) {
  try {
    var auth = requireAuth(p.token);
    if (!auth.ok) return auth.response;
    if (!p.individual_id) return errorResponse("individual_id is required.", "INVALID_PARAM");
    var result = getSubmissionHistory(p.individual_id);
    if (!result.ok) return errorResponse(result.error || "History fetch failed", "HISTORY_FAILED");
    return successResponse(result);
  } catch (e) {
    return errorResponse("Error retrieving submission history: " + e.toString(), "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleRsoApprovalLink
 * PURPOSE: Public one-time RSO approval endpoint.
 */
function _handleRsoApprovalLink(p) {
  try {
    if (!p.token) return errorResponse("token is required.", "INVALID_PARAM");
    var result = handleRsoApprovalLink(p.token, p.decision || p.action_decision || "approve", p.rejection_reason || "");
    if (!result.ok) return errorResponse(result.error || "RSO action failed", "RSO_ACTION_FAILED");
    return successResponse(result);
  } catch (e) {
    return errorResponse("Error processing RSO approval link: " + e.toString(), "SERVER_ERROR");
  }
}

// ============================================================
// CONTACT FORM HANDLER
// ============================================================

/**
 * HANDLER: _handleSendContactMessage
 * PURPOSE: Send a contact form message from a portal user to the Treasurer.
 *          Logs the action to the Audit Log.
 *
 * @param {Object} p  { token, subject, message, urgent }
 * @returns {Object}  {}
 */
function _handleSendContactMessage(p) {
  var auth = requireAuth(p.token);
  if (!auth.ok) return auth.response;

  try {
    var subject = sanitizeInput(String(p.subject || "").trim());
    var message = sanitizeInput(String(p.message || "").trim());

    if (!subject) return errorResponse("subject is required.", "INVALID_PARAM");
    if (!message) return errorResponse("message is required.", "INVALID_PARAM");
    if (message.length > 1000) {
      return errorResponse("message must be 1000 characters or fewer.", "INVALID_PARAM");
    }

    var member = getMemberByEmail(auth.session.email);
    var senderName  = member ? (member.first_name + " " + member.last_name).trim() : auth.session.email;
    var senderEmail = member ? (member.email || auth.session.email) : auth.session.email;
    var replyTo     = p.reply_email ? sanitizeInput(String(p.reply_email).trim()) : senderEmail;
    var urgent      = p.urgent === true || p.urgent === "true";

    var emailSubject = (urgent ? "[URGENT] " : "") + "GEA Portal: " + subject;
    var emailBody    =
      "Message from GEA Member Portal\n" +
      "================================\n\n" +
      "From: " + senderName + "\n" +
      "Email: " + replyTo + "\n" +
      "Subject: " + subject + "\n" +
      (urgent ? "Urgent: Yes\n" : "") +
      "\n" +
      "Message:\n" +
      message + "\n\n" +
      "--------------------------------\n" +
      "Sent via GEA Member Portal. Reply directly to this email to respond.";

    MailApp.sendEmail({
      to:       EMAIL_TREASURER,
      subject:  emailSubject,
      body:     emailBody,
      replyTo:  replyTo
    });

    logAuditEntry(auth.session.email, AUDIT_CONTACT_MESSAGE_SENT, "ContactForm", "",
                  "Subject: " + subject + (urgent ? " [URGENT]" : ""));

    return successResponse({}, "Your message has been sent to the Treasurer.");
  } catch (e) {
    Logger.log("ERROR _handleSendContactMessage: " + e);
    return errorResponse("Could not send message. Please try again.", "SERVER_ERROR");
  }
}


// ============================================================
// HOUSEHOLD MEMBER MANAGEMENT HANDLERS
// ============================================================

/**
 * HANDLER: _handleGetHouseholdMembers
 * PURPOSE: Return all members of the authenticated user's household,
 *          along with per-member document submission status.
 *
 * @param {Object} p  { token }
 * @returns {Object}  { household, members[], self_id }
 */
function _handleGetHouseholdMembers(p) {
  var auth = requireAuth(p.token);
  if (!auth.ok) return auth.response;

  try {
    var member = getMemberByEmail(auth.session.email);
    if (!member) return errorResponse(ERR_NOT_MEMBER, "NOT_FOUND");

    var hh = getHouseholdById(member.household_id);
    if (!hh) return errorResponse("Household not found.", "NOT_FOUND");

    var members = getHouseholdMembers(member.household_id);

    // Fetch primary member details using the household's primary_member_id
    var primaryMember = null;
    if (hh.primary_member_id) {
      primaryMember = getMemberById(hh.primary_member_id);
    }

    var membersOut = members.map(function(m) {
      var docStatus = getFileSubmissionStatus(m.individual_id) || {};
      return {
        individual_id:             m.individual_id,
        first_name:                m.first_name || "",
        last_name:                 m.last_name  || "",
        email:                     m.email      || "",
        relationship_to_primary:   m.relationship_to_primary || "",
        date_of_birth:             m.date_of_birth ? formatDate(new Date(m.date_of_birth)) : "",
        country_code_primary:      m.country_code_primary  || "",
        phone_primary:             m.phone_primary         || "",
        phone_primary_whatsapp:    m.phone_primary_whatsapp || false,
        omang_number:              m.omang_number          || "",
        employment_role:           m.employment_role       || "",
        employment_start_date:     m.employment_start_date ? formatDate(new Date(m.employment_start_date)) : "",
        employment_end_date:       m.employment_end_date   ? formatDate(new Date(m.employment_end_date))   : "",
        doc_status: {
          photo:    docStatus.photo      || null,
          passport: docStatus.passport   || null,
          omang:    docStatus.omang      || null
        }
      };
    });

    // Include primary member details in household response
    var householdOut = _safePublicHousehold(hh);
    if (primaryMember) {
      householdOut.primary_first_name = primaryMember.first_name || "";
      householdOut.primary_last_name = primaryMember.last_name || "";
      householdOut.primary_email = primaryMember.email || "";
    }

    return successResponse({
      household: householdOut,
      members:   membersOut,
      self_id:   member.individual_id
    });
  } catch (e) {
    Logger.log("ERROR _handleGetHouseholdMembers: " + e);
    return errorResponse("Could not load household members.", "SERVER_ERROR");
  }
}


/**
 * HANDLER: _handleAddHouseholdMember
 * PURPOSE: Add a new spouse, child, or staff member to the authenticated user's household.
 *
 * @param {Object} p  { token, relationship, first_name, last_name, ... }
 * @returns {Object}  { individual_id }
 */
function _handleAddHouseholdMember(p) {
  var auth = requireAuth(p.token);
  if (!auth.ok) return auth.response;

  try {
    var member = getMemberByEmail(auth.session.email);
    if (!member) return errorResponse(ERR_NOT_MEMBER, "NOT_FOUND");

    var hh = getHouseholdById(member.household_id);
    if (!hh) return errorResponse("Household not found.", "NOT_FOUND");

    var rel = sanitizeInput(String(p.relationship || "").trim());
    var validRels = [RELATIONSHIP_SPOUSE, RELATIONSHIP_CHILD, RELATIONSHIP_STAFF];
    if (validRels.indexOf(rel) === -1) {
      return errorResponse("relationship must be Spouse, Child, or Staff.", "INVALID_PARAM");
    }

    if (!p.first_name || !p.last_name) {
      return errorResponse("first_name and last_name are required.", "INVALID_PARAM");
    }

    var existing = getHouseholdMembers(member.household_id);

    if (rel === RELATIONSHIP_SPOUSE) {
      if (hh.household_type !== HOUSEHOLD_FAMILY) {
        return errorResponse("A spouse can only be added to a Family household.", "BUSINESS_RULE");
      }
      var spouseExists = false;
      for (var i = 0; i < existing.length; i++) {
        if (existing[i].relationship_to_primary === RELATIONSHIP_SPOUSE) { spouseExists = true; break; }
      }
      if (spouseExists) {
        return errorResponse("This household already has an active spouse.", "BUSINESS_RULE");
      }
    }

    if (rel === RELATIONSHIP_CHILD && !p.date_of_birth) {
      return errorResponse("date_of_birth is required for a child.", "INVALID_PARAM");
    }

    if (rel === RELATIONSHIP_STAFF) {
      var staffExists = false;
      for (var j = 0; j < existing.length; j++) {
        if (existing[j].relationship_to_primary === RELATIONSHIP_STAFF) { staffExists = true; break; }
      }
      if (staffExists) {
        return errorResponse("This household already has an active staff member.", "BUSINESS_RULE");
      }
      if (!p.omang_number || !p.phone_primary || !p.employment_role) {
        return errorResponse(
          "omang_number, phone_primary, and employment_role are required for staff.", "INVALID_PARAM");
      }
    }

    var data = {
      first_name:              sanitizeInput(p.first_name),
      last_name:               sanitizeInput(p.last_name),
      relationship_to_primary: rel,
      date_of_birth:           p.date_of_birth         || "",
      email:                   p.email                 ? sanitizeInput(p.email)           : "",
      country_code_primary:    p.country_code_primary  ? sanitizeInput(p.country_code_primary) : "",
      phone_primary:           p.phone_primary         ? sanitizeInput(p.phone_primary)   : "",
      phone_primary_whatsapp:  p.phone_primary_whatsapp === true || p.phone_primary_whatsapp === "true",
      omang_number:            p.omang_number          ? sanitizeInput(p.omang_number)    : "",
      employment_role:         p.employment_role       ? sanitizeInput(p.employment_role) : "",
      employment_start_date:   p.employment_start_date || "",
      employment_end_date:     p.employment_end_date   || ""
    };

    var newId = createMemberRecord(member.household_id, data, auth.session.email);
    if (!newId) return errorResponse("Failed to create member record.", "SERVER_ERROR");

    return successResponse({ individual_id: newId }, "Member added successfully.");
  } catch (e) {
    Logger.log("ERROR _handleAddHouseholdMember: " + e);
    return errorResponse("Could not add household member.", "SERVER_ERROR");
  }
}


/**
 * HANDLER: _handleRemoveHouseholdMember
 * PURPOSE: Deactivate a household member. Cannot remove Primary or self.
 *
 * @param {Object} p  { token, individual_id }
 * @returns {Object}  {}
 */
function _handleRemoveHouseholdMember(p) {
  var auth = requireAuth(p.token);
  if (!auth.ok) return auth.response;

  try {
    if (!p.individual_id) return errorResponse("individual_id is required.", "INVALID_PARAM");

    var member = getMemberByEmail(auth.session.email);
    if (!member) return errorResponse(ERR_NOT_MEMBER, "NOT_FOUND");

    if (p.individual_id === member.individual_id) {
      return errorResponse("You cannot remove yourself from the household.", "BUSINESS_RULE");
    }

    var target = getMemberById(p.individual_id);
    if (!target || target.household_id !== member.household_id) {
      return errorResponse("Member not found in your household.", "NOT_FOUND");
    }

    if (target.relationship_to_primary === RELATIONSHIP_PRIMARY) {
      return errorResponse("The primary member cannot be removed.", "BUSINESS_RULE");
    }

    var result = deactivateMember(p.individual_id, auth.session.email);
    if (!result.ok) return errorResponse(result.error, "SERVER_ERROR");

    return successResponse({}, "Member removed from household.");
  } catch (e) {
    Logger.log("ERROR _handleRemoveHouseholdMember: " + e);
    return errorResponse("Could not remove household member.", "SERVER_ERROR");
  }
}


/**
 * HANDLER: _handleEditHouseholdMember
 * PURPOSE: Update editable fields for a member of the authenticated user's household.
 *          Allowed fields vary by relationship type.
 *
 * @param {Object} p  { token, individual_id, ...fields }
 * @returns {Object}  { updated_fields }
 */
function _handleEditHouseholdMember(p) {
  var auth = requireAuth(p.token);
  if (!auth.ok) return auth.response;

  try {
    if (!p.individual_id) return errorResponse("individual_id is required.", "INVALID_PARAM");

    var member = getMemberByEmail(auth.session.email);
    if (!member) return errorResponse(ERR_NOT_MEMBER, "NOT_FOUND");

    var target = getMemberById(p.individual_id);
    if (!target || target.household_id !== member.household_id) {
      return errorResponse("Member not found in your household.", "NOT_FOUND");
    }

    var rel = target.relationship_to_primary;
    var allowed = ["first_name", "last_name", "email",
                   "country_code_primary", "phone_primary", "phone_primary_whatsapp"];
    if (rel === RELATIONSHIP_CHILD) {
      allowed.push("date_of_birth");
    }
    if (rel === RELATIONSHIP_STAFF) {
      allowed = allowed.concat(["omang_number", "employment_role",
                                "employment_start_date", "employment_end_date"]);
    }

    var updated = 0;
    for (var i = 0; i < allowed.length; i++) {
      var field = allowed[i];
      if (p[field] !== undefined) {
        var val = (field === "phone_primary_whatsapp")
          ? (p[field] === true || p[field] === "true")
          : sanitizeInput(String(p[field]));
        updateMemberField(p.individual_id, field, val, auth.session.email);
        updated++;
      }
    }

    if (updated === 0) return errorResponse("No valid fields provided.", "INVALID_PARAM");
    return successResponse({ updated_fields: updated }, "Member updated.");
  } catch (e) {
    Logger.log("ERROR _handleEditHouseholdMember: " + e);
    return errorResponse("Could not edit household member.", "SERVER_ERROR");
  }
}


/**
 * HANDLER: _handleAdminApplications
 * PURPOSE: Get list of applications for board view
 */
function _handleAdminApplications(p) {
  try {
    var auth = requireAuth(p.token, "board");
    if (!auth.ok) return auth.response;

    var applications = listApplicationsForBoard(p.status_filter);
    return successResponse({
      applications: applications,
      total: applications.length
    });

  } catch (e) {
    return errorResponse("Error retrieving applications.", "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleAdminApplicationDetail
 * PURPOSE: Get full details for an application
 */
function _handleAdminApplicationDetail(p) {
  try {
    var auth = requireAuth(p.token, "board");
    if (!auth.ok) return auth.response;

    var result = getApplicationDetail(p.application_id);
    if (result.success) {
      return successResponse(result);
    } else {
      return errorResponse(result.message, "NOT_FOUND");
    }
  } catch (e) {
    return errorResponse("Error retrieving application details.", "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleAdminApproveApplication
 * PURPOSE: Board makes an approval decision (initial or final)
 */
function _handleAdminApproveApplication(p) {
  try {
    var auth = requireAuth(p.token, "board");
    if (!auth.ok) return auth.response;

    var result;

    if (p.stage === "board_initial") {
      result = boardInitialDecision(
        p.application_id,
        "approved",
        auth.session.email,
        p.notes,
        ""
      );
    } else if (p.stage === "board_final") {
      result = boardFinalDecision(
        p.application_id,
        "approved",
        auth.session.email,
        p.notes,
        ""
      );
    } else {
      return errorResponse("Invalid stage.", "INVALID_PARAM");
    }

    if (result.success) {
      return successResponse(result);
    } else {
      return errorResponse(result.message, "OPERATION_FAILED");
    }
  } catch (e) {
    return errorResponse("Error approving application: " + e.toString(), "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleAdminDenyApplication
 * PURPOSE: Board denies an application (initial or final)
 */
function _handleAdminDenyApplication(p) {
  try {
    var auth = requireAuth(p.token, "board");
    if (!auth.ok) return auth.response;

    var result;

    if (p.stage === "board_initial") {
      result = boardInitialDecision(
        p.application_id,
        "denied",
        auth.session.email,
        p.notes,
        p.reason
      );
    } else if (p.stage === "board_final") {
      result = boardFinalDecision(
        p.application_id,
        "denied",
        auth.session.email,
        p.notes,
        p.reason
      );
    } else if (p.stage === "rso") {
      result = rsoDecision(
        p.application_id,
        "denied",
        auth.session.email,
        p.private_notes,
        p.public_reason
      );
    } else {
      return errorResponse("Invalid stage.", "INVALID_PARAM");
    }

    if (result.success) {
      return successResponse(result);
    } else {
      return errorResponse(result.message, "OPERATION_FAILED");
    }
  } catch (e) {
    return errorResponse("Error denying application: " + e.toString(), "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleAdminVerifyPayment
 * PURPOSE: Treasurer verifies payment and activates membership
 */
function _handleAdminVerifyPayment(p) {
  try {
    var auth = requireAuth(p.token, "board");
    if (!auth.ok) return auth.response;

    var result = verifyAndActivateMembership(p.application_id, auth.session.email);
    if (result.success) {
      return successResponse(result);
    } else {
      return errorResponse(result.message, "OPERATION_FAILED");
    }
  } catch (e) {
    return errorResponse("Error verifying payment: " + e.toString(), "SERVER_ERROR");
  }
}


// Helper function to convert submission object to row
function _objectToSubmissionRow(obj) {
  var submissionSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_FILE_SUBMISSIONS);
  var headers = submissionSheet.getRange(1, 1, 1, submissionSheet.getLastColumn()).getValues()[0];
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    row.push(obj[headers[i]] || "");
  }
  return row;
}

/**
 * TEST FUNCTION: Send all email templates to treasurer@geabotswana.org
 * Reads all templates from the Email Templates sheet and sends them with test variables
 * Run this via: Apps Script Editor → Select function → Run
 * Check the Logs to see results
 */
function testSendSingleEmailTemplate(templateId) {
  if (!templateId) templateId = "MEM_APPLICATION_RECEIVED_TO_APPLICANT"; // Default to Application Received
  var testEmail = "treasurer@geabotswana.org";

  // Common test variables used for templates
  var commonVars = {
    FIRST_NAME: "John",
    FULL_NAME: "John Test",
    EMAIL: "john@example.com",
    PHONE: "+267 71234567",
    MEMBERSHIP_LEVEL: "Full",
    HOUSEHOLD_TYPE: "Individual",
    APPLICATION_ID: "APP-2026-00001",
    FAMILY_MEMBERS_COUNT: "1",
    SPONSOR_NAME: "Jane Smith",
    SPONSOR_EMAIL: "jane@example.com",
    TEMP_PASSWORD: "TempPass123456!",
    PORTAL_URL: "https://geabotswana.org/member.html",
    SUBMITTED_DATE: new Date().toLocaleDateString(),
    CONFIRMED_DATE: new Date().toLocaleDateString(),
    DOCUMENTS_LIST: "- Passport\n- Photo\n- Employment Verification",
    DENIAL_REASON: "Eligibility requirements not met.",
    RSO_ISSUES: "- Passport photo quality insufficient",
    RSO_APPROVAL_DATE: new Date().toLocaleDateString(),
    APPROVAL_DATE: new Date().toLocaleDateString(),
    DUES_USD: "50",
    DUES_BWP: "680",
    PAYMENT_REFERENCE: "TEST_25-26",
    PAYMENT_METHOD: "Bank Transfer",
    PAYMENT_DATE: new Date().toLocaleDateString(),
    START_DATE: new Date().toLocaleDateString(),
    EXPIRATION_DATE: "July 31, 2027",
    ACTIVATION_DATE: new Date().toLocaleDateString()
  };

  try {
    Logger.log("=== SINGLE EMAIL TEMPLATE TEST ===");
    Logger.log("Testing template: " + templateId);
    Logger.log("Recipient: " + testEmail);
    Logger.log("");

    sendEmail(templateId, testEmail, commonVars);

    Logger.log("✓ SUCCESS: " + templateId + " sent to " + testEmail);
    Logger.log("Check your email inbox to verify formatting and content.");
    return { success: true, template: templateId, message: "Email sent successfully to " + testEmail };

  } catch (e) {
    Logger.log("✗ ERROR: " + e.toString());
    Logger.log("Stack trace: " + e.stack);
    return { success: false, template: templateId, error: e.toString() };
  }
}

function testSendAllEmailTemplates() {
  var testEmail = "treasurer@geabotswana.org";
  var results = [];

  // Common test variables used for all templates
  var commonVars = {
    FIRST_NAME: "John",
    FULL_NAME: "John Test",
    EMAIL: "john@example.com",
    PHONE: "+267 71234567",
    MEMBERSHIP_LEVEL: "Full",
    HOUSEHOLD_TYPE: "Individual",
    APPLICATION_ID: "APP-2026-00001",
    FAMILY_MEMBERS_COUNT: "1",
    SPONSOR_NAME: "Jane Smith",
    SPONSOR_EMAIL: "jane@example.com",
    TEMP_PASSWORD: "TempPass123456!",
    PORTAL_URL: "https://geabotswana.org/member.html",
    SUBMITTED_DATE: new Date().toLocaleDateString(),
    CONFIRMED_DATE: new Date().toLocaleDateString(),
    DOCUMENTS_LIST: "- Passport\n- Photo\n- Employment Verification",
    DENIAL_REASON: "Eligibility requirements not met.",
    RSO_ISSUES: "- Passport photo quality insufficient",
    RSO_APPROVAL_DATE: new Date().toLocaleDateString(),
    APPROVAL_DATE: new Date().toLocaleDateString(),
    DUES_USD: "50",
    DUES_BWP: "680",
    PAYMENT_REFERENCE: "TEST_25-26",
    PAYMENT_METHOD: "Bank Transfer",
    PAYMENT_DATE: new Date().toLocaleDateString(),
    START_DATE: new Date().toLocaleDateString(),
    EXPIRATION_DATE: "July 31, 2027",
    ACTIVATION_DATE: new Date().toLocaleDateString()
  };

  // Read all templates from Email Templates sheet
  try {
    var systemBackendSheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_EMAIL_TEMPLATES);
    var data = systemBackendSheet.getRange(2, 1, systemBackendSheet.getLastRow() - 1, systemBackendSheet.getLastColumn()).getValues();

    Logger.log("=== EMAIL TEMPLATE TEST START ===");
    Logger.log("Reading templates from Email Templates sheet...");
    Logger.log("Test recipient: " + testEmail);
    Logger.log("");

    var sentCount = 0;
    var failedCount = 0;

    for (var i = 0; i < data.length; i++) {
      var templateId = data[i][0];

      // Skip empty rows
      if (!templateId) continue;

      try {
        sendEmail(templateId, testEmail, commonVars);
        results.push("✓ " + templateId + " sent successfully");
        Logger.log("✓ " + templateId + " sent successfully");
        sentCount++;
      } catch (e) {
        results.push("✗ " + templateId + " FAILED: " + e.toString());
        Logger.log("✗ " + templateId + " FAILED: " + e.toString());
        failedCount++;
      }
    }

    Logger.log("");
    Logger.log("=== TEST SUMMARY ===");
    Logger.log("Total templates tested: " + (sentCount + failedCount));
    Logger.log("Successfully sent: " + sentCount);
    Logger.log("Failed: " + failedCount);
    Logger.log("Test email: " + testEmail);

  } catch (e) {
    Logger.log("ERROR: " + e.toString());
    Logger.log("Make sure TAB_EMAIL_TEMPLATES is defined in Config.js");
  }

  return results;
}

/**
 * Extract deployment ID from the current GAS script URL
 * Used by Portal.html to determine which deployment it's running in
 * @returns {string} The deployment ID or "unknown"
 */
function _getDeploymentIdFromUrl_() {
  try {
    var url = ScriptApp.getService().getUrl();
    var match = String(url).match(/\/s\/([^/]+)\/exec/);
    return match ? match[1] : "unknown";
  } catch (e) {
    Logger.log("Warning: Could not extract deployment ID from URL: " + e.toString());
    return "unknown";
  }
}

/**
 * Public JSONP endpoint for deployment metadata
 * Called by member.html wrapper to query deployment info without relying on postMessage
 * @param {Object} params - Query parameters including callback name
 * @returns {ContentService.TextOutput} JSONP response
 */
function _handleDeploymentInfoJsonp(params) {
  var callback = params.callback || "callback";

  // Validate callback name (prevent injection)
  if (!/^[A-Za-z0-9_.]+$/.test(callback)) {
    return ContentService
      .createTextOutput("Invalid callback name")
      .setMimeType(ContentService.MimeType.TEXT);
  }

  var payload = {
    deploymentId: _getDeploymentIdFromUrl_(),
    version: SYSTEM_VERSION,
    buildId: BUILD_ID,
    timestamp: DEPLOYMENT_TIMESTAMP
  };

  return ContentService
    .createTextOutput(callback + "(" + JSON.stringify(payload) + ");")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

/**
 * Public JSONP endpoint for one configuration value.
 * Used by wrapper pages to read runtime switches across origins.
 * @param {Object} params
 * @returns {ContentService.TextOutput}
 */
function _handleConfigValueJsonp(params) {
  var callback = params.callback || "callback";
  var key = params.key || "";

  if (!/^[A-Za-z0-9_.]+$/.test(callback)) {
    return ContentService
      .createTextOutput("Invalid callback name")
      .setMimeType(ContentService.MimeType.TEXT);
  }

  var payload = {
    success: true,
    key: key,
    value: key ? getConfigValue(String(key)) : null
  };

  return ContentService
    .createTextOutput(callback + "(" + JSON.stringify(payload) + ");")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

// ============================================================
// PAYMENT VERIFICATION HANDLERS
// ============================================================

/**
 * HANDLER: _handleSubmitPaymentVerification
 * PURPOSE: Member submits payment verification
 */
function _handleSubmitPaymentVerification(p) {
  try {
    var auth = requireAuth(p.token);
    if (!auth.ok) return auth.response;

    if (!p.household_id || !p.membership_year || !p.payment_method || !p.amount_paid) {
      return errorResponse("Missing required fields.", "INVALID_PARAM");
    }

    var result = submitPaymentVerification({
      household_id: p.household_id,
      membership_year: p.membership_year,
      payment_method: p.payment_method,
      currency: p.currency || "USD",
      amount_paid: Number(p.amount_paid),
      transaction_date: p.transaction_date || new Date(),
      file_data_base64: p.file_data_base64 || null,
      file_name: p.file_name || null,
      file_content_type: p.file_content_type || null,
      notes: p.notes || "",
      member_email: auth.session.email
    });

    if (!result.ok) return errorResponse(result.error || "Submission failed", result.code || "FAILED");
    return successResponse(result);
  } catch (e) {
    return errorResponse("Error submitting payment verification: " + e.toString(), "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleGetPaymentStatus
 * PURPOSE: Member checks their payment status
 */
function _handleGetPaymentStatus(p) {
  try {
    var auth = requireAuth(p.token);
    if (!auth.ok) return auth.response;

    if (!p.household_id || !p.membership_year) {
      return errorResponse("household_id and membership_year are required.", "INVALID_PARAM");
    }

    var result = getPaymentVerificationStatus(p.household_id, p.membership_year);
    if (!result.ok) return errorResponse(result.error || "Could not load status", "NOT_FOUND");
    return successResponse(result);
  } catch (e) {
    return errorResponse("Error retrieving payment status: " + e.toString(), "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleGetDuesInfo
 * PURPOSE: Returns dues amount, proration, exchange rate, and available years for current member
 */
function _handleGetDuesInfo(p) {
  try {
    var auth = requireAuth(p.token);
    if (!auth.ok) return auth.response;

    var member = getMemberByEmail(auth.session.email);
    if (!member) return errorResponse(ERR_NOT_MEMBER, "NOT_FOUND");

    var hh = getHouseholdById(member.household_id);
    if (!hh) return errorResponse("Household not found", "NOT_FOUND");

    // Fetch annual dues and available years from Membership Pricing sheet
    var pricingSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID)
      .getSheetByName(TAB_MEMBERSHIP_PRICING);
    var pricingData = pricingSheet ? pricingSheet.getDataRange().getValues() : [];
    var pricingHeaders = pricingData.length ? pricingData[0] : [];

    var annualDuesUsd = 0;
    var membershipCategory = hh.membership_type || "";
    var availableYears = [];

    for (var i = 1; i < pricingData.length; i++) {
      var row = rowToObject(pricingHeaders, pricingData[i]);
      if (row.membership_level_id === hh.membership_level_id) {
        if (annualDuesUsd === 0) annualDuesUsd = row.annual_dues_usd || 0;
        if (row.active_for_payment === true || row.active_for_payment === "TRUE") {
          availableYears.push(row.membership_year);
        }
      }
    }

    // Determine current quarter
    var month = new Date().getMonth(); // 0=Jan
    var quarter, quarterPct;
    if (month >= 7 && month <= 9)                          { quarter = "Q1"; quarterPct = QUARTER_PERCENTAGES["Q1"]; }
    else if (month === 10 || month === 11 || month === 0)  { quarter = "Q2"; quarterPct = QUARTER_PERCENTAGES["Q2"]; }
    else if (month >= 1 && month <= 3)                     { quarter = "Q3"; quarterPct = QUARTER_PERCENTAGES["Q3"]; }
    else                                                   { quarter = "Q4"; quarterPct = QUARTER_PERCENTAGES["Q4"]; }

    var proratedUsd = Math.round(annualDuesUsd * (quarterPct / 100) * 100) / 100;
    var exchangeRate = getExchangeRate() || EXCHANGE_RATE_DEFAULT;
    var proratedBwp = Math.round(proratedUsd * exchangeRate * 100) / 100;

    return successResponse({
      membership_category: membershipCategory,
      annual_dues_usd:     annualDuesUsd,
      current_quarter:     quarter,
      quarter_percentage:  quarterPct,
      prorated_usd:        proratedUsd,
      exchange_rate:       exchangeRate,
      prorated_bwp:        proratedBwp,
      available_years:     availableYears,
      household_name:      hh.household_name || "",
      household_id:        hh.household_id
    });
  } catch (e) {
    return errorResponse("Error retrieving dues info: " + e.toString(), "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleAdminPendingPayments
 * PURPOSE: Treasurer views pending payment verifications
 */
function _handleAdminPendingPayments(p) {
  try {
    var auth = requireAuth(p.token, "board");
    if (!auth.ok) return auth.response;

    var result = listPendingPaymentVerifications();
    if (!result.ok) return errorResponse(result.error || "Could not load payments", "FAILED");
    return successResponse(result);
  } catch (e) {
    return errorResponse("Error retrieving pending payments: " + e.toString(), "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleAdminApprovePayment
 * PURPOSE: Treasurer approves payment
 */
function _handleAdminApprovePayment(p) {
  try {
    var auth = requireAuth(p.token, "board");
    if (!auth.ok) return auth.response;

    if (!p.payment_id) {
      return errorResponse("payment_id is required.", "INVALID_PARAM");
    }

    var result = approvePaymentVerification(
      p.payment_id,
      auth.session.email,
      p.notes || ""
    );

    if (!result.ok) return errorResponse(result.error || "Approval failed", "FAILED");
    return successResponse(result);
  } catch (e) {
    return errorResponse("Error approving payment: " + e.toString(), "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleAdminRejectPayment
 * PURPOSE: Treasurer rejects payment
 */
function _handleAdminRejectPayment(p) {
  try {
    var auth = requireAuth(p.token, "board");
    if (!auth.ok) return auth.response;

    if (!p.payment_id || !p.reason) {
      return errorResponse("payment_id and reason are required.", "INVALID_PARAM");
    }

    var result = rejectPaymentVerification(p.payment_id, auth.session.email, p.reason);
    if (!result.ok) return errorResponse(result.error || "Rejection failed", "FAILED");
    return successResponse(result);
  } catch (e) {
    return errorResponse("Error rejecting payment: " + e.toString(), "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleAdminClarifyPayment
 * PURPOSE: Treasurer requests clarification
 */
function _handleAdminClarifyPayment(p) {
  try {
    var auth = requireAuth(p.token, "board");
    if (!auth.ok) return auth.response;

    if (!p.payment_id || !p.clarification_request) {
      return errorResponse("payment_id and clarification_request are required.", "INVALID_PARAM");
    }

    var result = requestPaymentClarification(
      p.payment_id,
      auth.session.email,
      p.clarification_request
    );

    if (!result.ok) return errorResponse(result.error || "Request failed", "FAILED");
    return successResponse(result);
  } catch (e) {
    return errorResponse("Error requesting clarification: " + e.toString(), "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleAdminPaymentReport
 * PURPOSE: Board views payment history report with filters
 */
function _handleAdminPaymentReport(p) {
  try {
    var auth = requireAuth(p.token, "board");
    if (!auth.ok) return auth.response;

    var filters = {
      membership_year: p.membership_year || null,
      status: p.status || null
    };

    var result = getPaymentReport(filters);
    if (!result.ok) return errorResponse(result.error || "Could not load report", "FAILED");
    return successResponse(result);
  } catch (e) {
    return errorResponse("Error generating report: " + e.toString(), "SERVER_ERROR");
  }
}


/**
 * LEGACY SETUP FUNCTION — do not run again.
 * Originally added payment email template rows (tpl_061-tpl_065) to the Email Templates sheet.
 * Those templates have since been superseded by semantic-named Drive templates:
 *   PAY_PAYMENT_SUBMITTED_TO_MEMBER, PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD,
 *   PAY_PAYMENT_VERIFIED_TO_MEMBER, PAY_PAYMENT_REJECTED_TO_MEMBER,
 *   PAY_PAYMENT_CLARIFICATION_REQUESTED_TO_MEMBER
 * Kept for historical reference only.
 */
function addPaymentTemplates() {
  try {
    var sheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_EMAIL_TEMPLATES);

    var newTemplates = [
      {
        template_id: 'tpl_061',
        template_name: 'Payment Submitted',
        subject: 'GEA Payment Submitted - Confirmation {{PAYMENT_ID}}',
        body: 'Dear {{FIRST_NAME}},\n\nThank you for submitting your membership dues payment.\n\nPAYMENT SUBMISSION DETAILS:\nPayment Reference: {{PAYMENT_ID}}\nMembership Year: {{MEMBERSHIP_YEAR}}\nAmount Submitted: {{AMOUNT}} {{CURRENCY}}\nPayment Method: {{PAYMENT_METHOD}}\nTransaction Date: {{TRANSACTION_DATE}}\nSubmission Date: {{SUBMISSION_DATE}}\n\nWHAT HAPPENS NEXT:\nOur treasurer will verify receipt of your payment. This typically takes 2-3 business days. Once verified, your membership status will be updated in the portal.\n\nYou will receive a confirmation email once verification is complete.\n\nQUESTIONS?\nIf you have questions about your payment submission, please contact board@geabotswana.org.\n\nGaborone Employee Association\nwww.geabotswana.org\nboard@geabotswana.org',
        active: true
      },
      {
        template_id: 'tpl_062',
        template_name: 'Payment Submitted (Board)',
        subject: '[ACTION REQUIRED] Payment Verification Needed - {{MEMBER_EMAIL}}',
        body: 'GEA Board,\n\nA member has submitted payment proof for verification.\n\nPAYMENT DETAILS:\nPayment ID: {{PAYMENT_ID}}\nMember: {{FIRST_NAME}} {{LAST_NAME}} ({{MEMBER_EMAIL}})\nHousehold: {{HOUSEHOLD_NAME}} ({{HOUSEHOLD_ID}})\nMembership Year: {{MEMBERSHIP_YEAR}}\nAmount: {{AMOUNT}} {{CURRENCY}}\nPayment Method: {{PAYMENT_METHOD}}\nTransaction Date: {{TRANSACTION_DATE}}\nSubmission Date: {{SUBMISSION_DATE}}\n\nACTION REQUIRED:\nPlease verify receipt of this payment in the member\'s account and confirm in the Admin Portal.\n\nVERIFY PAYMENT: Log in to Board Admin Portal and navigate to Payments section.\n\nOnce verified, the member will be notified and their membership activated.\n\nGEA System',
        active: true
      },
      {
        template_id: 'tpl_063',
        template_name: 'Payment Verified',
        subject: 'GEA Payment Confirmed - Membership Active',
        body: 'Dear {{FIRST_NAME}},\n\nExcellent news! We have verified your payment and your membership is now fully active.\n\nPAYMENT VERIFIED:\nPayment ID: {{PAYMENT_ID}}\nAmount: {{AMOUNT_PAID}} {{CURRENCY}}\nMembership Year: {{MEMBERSHIP_YEAR}}\nVerified By: {{PAYMENT_VERIFIED_BY}}\nVerification Date: {{VERIFICATION_DATE}}\n\nMEMBERSHIP STATUS:\nStatus: ACTIVE\nValid Through: {{MEMBERSHIP_EXPIRATION_DATE}}\n\nYOUR NEXT STEPS:\n[ ] Log in to the Member Portal: www.geabotswana.org\n[ ] Download your digital membership card\n[ ] Explore facility reservations and events\n[ ] Update your profile information if needed\n\nYou now have full access to all GEA facilities and member benefits. Enjoy!\n\nQUESTIONS?\nIf you have any questions, please contact board@geabotswana.org.\n\nGaborone Employee Association\nwww.geabotswana.org\nboard@geabotswana.org',
        active: true
      },
      {
        template_id: 'tpl_064',
        template_name: 'Payment Rejected',
        subject: 'GEA Payment Verification - Action Required',
        body: 'Dear {{FIRST_NAME}},\n\nWe have reviewed your payment submission and are unable to verify it at this time.\n\nPAYMENT STATUS:\nPayment ID: {{PAYMENT_ID}}\nMembership Year: {{MEMBERSHIP_YEAR}}\nStatus: NOT VERIFIED\n\nREASON FOR REJECTION:\n{{REJECTION_REASON}}\n\nWHAT TO DO:\nPlease resubmit your payment. Make sure to include:\n1. A clear receipt or screenshot of your transaction\n2. The transaction confirmation details (date, amount, reference number)\n3. Any relevant bank or payment provider information\n\nHOW TO RESUBMIT:\nLog in to the Member Portal at www.geabotswana.org and submit your payment verification again. You can use the same submission form and upload an updated receipt.\n\nNEED HELP?\nIf you believe this rejection was in error or need assistance, please contact board@geabotswana.org with your payment reference and details.\n\nGaborone Employee Association\nwww.geabotswana.org\nboard@geabotswana.org',
        active: true
      },
      {
        template_id: 'tpl_065',
        template_name: 'Payment Clarification Requested',
        subject: 'GEA Payment Verification - Additional Information Needed',
        body: 'Dear {{FIRST_NAME}},\n\nThank you for submitting your membership dues payment. We are reviewing it and need some additional information before we can verify it.\n\nPAYMENT DETAILS:\nPayment ID: {{PAYMENT_ID}}\nMembership Year: {{MEMBERSHIP_YEAR}}\nAmount: {{AMOUNT}} {{CURRENCY}}\n\nCLARIFICATION NEEDED:\n{{CLARIFICATION_REQUEST}}\n\nDEADLINE:\nPlease provide the requested information by {{DEADLINE}}.\n\nHOW TO RESPOND:\nLog in to the Member Portal at www.geabotswana.org and resubmit your payment verification with the additional details or documentation requested above.\n\nQUESTIONS?\nIf you have questions about what information is needed, please contact board@geabotswana.org and reference your Payment ID.\n\nThank you for your prompt attention to this matter.\n\nGaborone Employee Association\nwww.geabotswana.org\nboard@geabotswana.org',
        active: true
      }
    ];

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    for (var i = 0; i < newTemplates.length; i++) {
      var row = [];
      for (var j = 0; j < headers.length; j++) {
        var header = headers[j];
        row.push(newTemplates[i][header] || '');
      }
      sheet.appendRow(row);
    }

    Logger.log('SUCCESS: Added 5 new payment verification templates (tpl_061 - tpl_065)');
  } catch (e) {
    Logger.log('ERROR adding templates: ' + e);
  }
}


/**
 * Setup: Sync standardized email templates from repo
 *
 * All 65 email templates have been standardized with:
 * - Consistent greetings (Dear {{FIRST_NAME}}, GEA Board, etc.)
 * - Standard signature blocks (Gaborone Employee Association / www.geabotswana.org / board@geabotswana.org)
 * - Footer: "This is an automated message from the GEA Management System. Feel free to reply if you have any questions or comments."
 *
 * The authoritative source is: GEA System Backend.xlsx (in repo root)
 *
 * INSTRUCTIONS TO SYNC:
 * 1. Open the GEA System Backend.xlsx file from the repo root
 * 2. Copy the entire "Email Templates" sheet (all rows including header)
 * 3. In Google Sheets (GEA System Backend spreadsheet):
 *    a. Go to "Email Templates" tab
 *    b. Select all data (Ctrl+A)
 *    c. Delete all content except header row
 *    d. Paste the copied data
 * 4. Or, use the Apps Script Data import feature if available
 *
 * Reference document: EMAIL_TEMPLATES_REFERENCE.md (in repo root)
 */
// ============================================================
// GUEST LIST HANDLERS
// ============================================================

/**
 * HANDLER: _handleSubmitGuestList
 * PURPOSE: Member submits their guest list for an approved reservation.
 *
 * REQUIRED PARAMS: token, reservation_id, guests (JSON string of [{first_name,last_name,age_group,id_number,save_to_profile}])
 * RETURNS: { success, data: { guestListId, lateSubmission } }
 */
function _handleSubmitGuestList(p) {
  var auth = requireAuth(p.token);
  if (!auth.ok) return auth.response;

  if (!p.reservation_id) return errorResponse("reservation_id required.", "MISSING_PARAM");
  if (!p.guests)         return errorResponse("guests required.", "MISSING_PARAM");

  var guests;
  try { guests = JSON.parse(p.guests); } catch (e) {
    return errorResponse("guests must be a valid JSON array.", "INVALID_PARAM");
  }
  if (!Array.isArray(guests) || guests.length === 0) {
    return errorResponse("At least one guest is required.", "INVALID_PARAM");
  }

  // Confirm reservation belongs to this member's household
  var member = getMemberByEmail(auth.session.email);
  var res    = getReservationById(p.reservation_id);
  if (!res || !member || res.household_id !== member.household_id) {
    return errorResponse(ERR_NOT_AUTHORIZED, "FORBIDDEN");
  }

  var result = submitGuestList(p.reservation_id, guests, auth.session.email);
  if (!result.ok) return errorResponse(result.message, "SUBMIT_FAILED");

  return successResponse({
    guestListId:   result.guestListId,
    lateSubmission: result.lateSubmission
  }, result.message);
}

/**
 * HANDLER: _handleGetGuestList
 * PURPOSE: Returns the current guest list for one of the member's reservations.
 *
 * REQUIRED PARAMS: token, reservation_id
 * RETURNS: { success, data: { guestList: {...} | null } }
 */
function _handleGetGuestList(p) {
  var auth = requireAuth(p.token);
  if (!auth.ok) return auth.response;

  if (!p.reservation_id) return errorResponse("reservation_id required.", "MISSING_PARAM");

  var member = getMemberByEmail(auth.session.email);
  var res    = getReservationById(p.reservation_id);
  if (!res || !member || res.household_id !== member.household_id) {
    return errorResponse(ERR_NOT_AUTHORIZED, "FORBIDDEN");
  }

  var gl = getGuestListForReservation(p.reservation_id);
  return successResponse({ guestList: gl });
}

/**
 * HANDLER: _handleGetGuestProfiles
 * PURPOSE: Member retrieves their household's saved guest profiles.
 *
 * REQUIRED PARAMS: token
 * RETURNS: { success, data: { profiles: [...] } }
 */
function _handleGetGuestProfiles(p) {
  var auth = requireAuth(p.token);
  if (!auth.ok) return auth.response;

  var member = getMemberByEmail(auth.session.email);
  if (!member) return errorResponse(ERR_NOT_AUTHORIZED, "FORBIDDEN");

  var profiles = getGuestProfiles(member.household_id);
  return successResponse({ profiles: profiles });
}

/**
 * HANDLER: _handleAdminGuestLists
 * PURPOSE: RSO views guest lists awaiting review (submitted or in_review).
 *
 * OPTIONAL PARAMS: status
 * RETURNS: { success, data: { guestLists: [...] } }
 */
function _handleAdminGuestLists(p) {
  var auth = requireAuth(p.token, ["board", "rso_approve", "rso"]);
  if (!auth.ok) return auth.response;

  // Default: show both submitted and in_review
  var status = p.status || null;
  var guestLists;
  if (status) {
    guestLists = getGuestListsByStatus(status);
  } else {
    var submitted = getGuestListsByStatus(GUEST_LIST_STATUS_SUBMITTED);
    var inReview  = getGuestListsByStatus(GUEST_LIST_STATUS_IN_REVIEW);
    guestLists = submitted.concat(inReview);
    guestLists.sort(function(a, b) { return new Date(a.event_date) - new Date(b.event_date); });
  }
  return successResponse({ guestLists: guestLists, count: guestLists.length });
}

/**
 * HANDLER: _handleAdminSaveGuestListDraft
 * PURPOSE: RSO saves interim per-guest decisions without finalizing.
 *
 * REQUIRED PARAMS: token, guest_list_id, decisions (JSON string)
 */
function _handleAdminSaveGuestListDraft(p) {
  var auth = requireAuth(p.token, ["board", "rso_approve", "rso"]);
  if (!auth.ok) return auth.response;

  if (!p.guest_list_id) return errorResponse("guest_list_id required.", "MISSING_PARAM");
  if (!p.decisions)     return errorResponse("decisions required.", "MISSING_PARAM");

  var decisions;
  try { decisions = JSON.parse(p.decisions); } catch (e) {
    return errorResponse("decisions must be a valid JSON array.", "INVALID_PARAM");
  }

  var ok = saveGuestListDraft(p.guest_list_id, decisions, auth.session.email);
  return ok
    ? successResponse({}, "Draft decisions saved.")
    : errorResponse("Could not save draft.", "FAILED");
}

/**
 * HANDLER: _handleAdminFinalizeGuestList
 * PURPOSE: RSO finalizes per-guest decisions. Sends RSO summary + board rejection notice if needed.
 *
 * REQUIRED PARAMS: token, guest_list_id, decisions (JSON string)
 */
function _handleAdminFinalizeGuestList(p) {
  var auth = requireAuth(p.token, ["board", "rso_approve", "rso"]);
  if (!auth.ok) return auth.response;

  if (!p.guest_list_id) return errorResponse("guest_list_id required.", "MISSING_PARAM");
  if (!p.decisions)     return errorResponse("decisions required.", "MISSING_PARAM");

  var decisions;
  try { decisions = JSON.parse(p.decisions); } catch (e) {
    return errorResponse("decisions must be a valid JSON array.", "INVALID_PARAM");
  }

  var result = finalizeGuestListReview(p.guest_list_id, decisions, auth.session.email);
  if (!result.ok) return errorResponse(result.message, "FINALIZE_FAILED");

  return successResponse({
    approvedCount: result.approvedCount,
    rejectedCount: result.rejectedCount
  }, result.message);
}

/**
 * HANDLER: _handleAdminGuestHistories
 * PURPOSE: RSO looks up approval/rejection history for multiple guests by ID number.
 *
 * REQUIRED PARAMS: token, id_numbers (JSON string array)
 * RETURNS: { success, data: { histories: { id_number: [{...}] } } }
 */
function _handleAdminGuestHistories(p) {
  var auth = requireAuth(p.token, ["board", "rso_approve", "rso"]);
  if (!auth.ok) return auth.response;

  if (!p.id_numbers) return errorResponse("id_numbers required.", "MISSING_PARAM");

  var idNumbers;
  try { idNumbers = JSON.parse(p.id_numbers); } catch (e) {
    return errorResponse("id_numbers must be a valid JSON array.", "INVALID_PARAM");
  }

  var histories = getGuestHistoryByIdNumbers(idNumbers);
  return successResponse({ histories: histories });
}


// ============================================================
// HANDLER: _handleAdminReservationsReport (SUP.3)
// ============================================================
/**
/**
 * ADMIN: Get all rules for editing in Admin Portal
 * Returns array of rules sorted by category and sort order
 * Used by Rules Editor table in Admin.html
 */
function _handleAdminGetRules(p) {
  var auth = requireAuth(p.token, "board");
  if (!auth.ok) return auth.response;

  try {
    var rulesSheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_RULES);
    var data = rulesSheet.getDataRange().getValues();

    if (data.length < 2) {
      return successResponse({ rules: [] });
    }

    var rules = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0]) continue; // Skip empty rows

      rules.push({
        rule_id: row[0] || '',
        rule_category: row[1] || '',
        rule_category_sort: row[2] ? Number(row[2]) : 999,
        rule_text: row[3] || '',
        row_index: i + 1  // For updates, we need the spreadsheet row number
      });
    }

    // Sort by category, then by sort order
    rules.sort(function(a, b) {
      if (a.rule_category !== b.rule_category) {
        return a.rule_category.localeCompare(b.rule_category);
      }
      return a.rule_category_sort - b.rule_category_sort;
    });

    return successResponse({ rules: rules });
  } catch (error) {
    Logger.log("ERROR in _handleAdminGetRules: " + error);
    return errorResponse("Failed to load rules: " + error.message, "SERVER_ERROR");
  }
}

/**
 * ADMIN: Save or update a rule
 * Updates existing rule or creates new rule if rule_id is empty
 */
function _handleAdminSaveRule(p) {
  var auth = requireAuth(p.token, "board");
  if (!auth.ok) return auth.response;

  try {
    if (!p.rule_category || !p.rule_text) {
      return errorResponse("Missing required fields: rule_category, rule_text", "VALIDATION_ERROR");
    }

    var rulesSheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_RULES);
    var rule_sort = p.rule_category_sort ? Number(p.rule_category_sort) : 999;

    if (p.rule_id && p.rule_id.trim()) {
      // Update existing rule
      var data = rulesSheet.getDataRange().getValues();
      var found = false;

      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === p.rule_id) {
          rulesSheet.getRange(i + 1, 1, 1, 4).setValues([[
            p.rule_id,
            p.rule_category,
            rule_sort,
            p.rule_text
          ]]);
          found = true;
          break;
        }
      }

      if (!found) {
        return errorResponse("Rule not found: " + p.rule_id, "NOT_FOUND");
      }
    } else {
      // Create new rule with auto-generated ID
      var newRuleId = "RULE-" + String(Math.floor(Math.random() * 100000)).padStart(4, '0');
      rulesSheet.appendRow([newRuleId, p.rule_category, rule_sort, p.rule_text]);
      p.rule_id = newRuleId;
    }

    // Log the change
    Utilities.logAuditEntry({
      timestamp: new Date().toISOString(),
      user_email: auth.session.email,
      action_type: 'rule_updated',
      target_id: p.rule_id,
      details: 'Category: ' + p.rule_category + '; Sort: ' + rule_sort,
      ip_address: ''
    });

    return successResponse({
      success: true,
      rule_id: p.rule_id,
      message: "Rule saved successfully"
    });
  } catch (error) {
    Logger.log("ERROR in _handleAdminSaveRule: " + error);
    return errorResponse("Failed to save rule: " + error.message, "SERVER_ERROR");
  }
}

/**
 * ADMIN: Delete a rule
 */
function _handleAdminDeleteRule(p) {
  var auth = requireAuth(p.token, "board");
  if (!auth.ok) return auth.response;

  try {
    if (!p.rule_id) {
      return errorResponse("Missing required field: rule_id", "VALIDATION_ERROR");
    }

    var rulesSheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_RULES);
    var data = rulesSheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === p.rule_id) {
        rulesSheet.deleteRow(i + 1);

        // Log the deletion
        Utilities.logAuditEntry({
          timestamp: new Date().toISOString(),
          user_email: auth.session.email,
          action_type: 'rule_deleted',
          target_id: p.rule_id,
          details: 'Deleted by board admin',
          ip_address: ''
        });

        return successResponse({
          success: true,
          message: "Rule deleted successfully"
        });
      }
    }

    return errorResponse("Rule not found: " + p.rule_id, "NOT_FOUND");
  } catch (error) {
    Logger.log("ERROR in _handleAdminDeleteRule: " + error);
    return errorResponse("Failed to delete rule: " + error.message, "SERVER_ERROR");
  }
}

// ============================================================
// HANDLER: _handleAdminDashboardStats
// ============================================================
/**
 * Returns dashboard statistics for the admin panel.
 * Counts: pending applications (total and board-pending), active members,
 * unverified payments, and today's reservations.
 */
function _handleAdminDashboardStats(p) {
  try {
    var auth = requireAuth(p.token, "board");
    if (!auth.ok) return auth.response;

    // Count active members (individuals with active=TRUE)
    var activeMembers = 0;
    var indSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_INDIVIDUALS);
    var indData = indSheet.getDataRange().getValues();
    var indHeaders = indData[0];
    for (var i = 1; i < indData.length; i++) {
      var member = rowToObject(indHeaders, indData[i]);
      if (member.individual_id && member.active === true) {
        activeMembers++;
      }
    }

    // Count pending applications (not activated, denied, or withdrawn)
    var pendingApps = 0;
    var boardPendingApps = 0;
    var appSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
    var appData = appSheet.getDataRange().getValues();
    var appHeaders = appData[0];
    for (var i = 1; i < appData.length; i++) {
      var app = rowToObject(appHeaders, appData[i]);
      if (!app.application_id) continue;

      // Pending = not in terminal states
      if (app.status !== APP_STATUS_ACTIVATED &&
          app.status !== APP_STATUS_DENIED &&
          app.status !== APP_STATUS_WITHDRAWN) {
        pendingApps++;

        // Board-pending = awaiting board decision at initial or final stage
        if (app.status === APP_STATUS_BOARD_INITIAL_REVIEW ||
            app.status === APP_STATUS_BOARD_FINAL_REVIEW) {
          boardPendingApps++;
        }
      }
    }

    // Count unverified payments (payment_verified_date is empty)
    var unverifiedPayments = 0;
    var paySheet = SpreadsheetApp.openById(PAYMENT_TRACKING_ID).getSheetByName(TAB_PAYMENTS);
    var payData = paySheet.getDataRange().getValues();
    var payHeaders = payData[0];
    for (var i = 1; i < payData.length; i++) {
      var pay = rowToObject(payHeaders, payData[i]);
      if (pay.payment_id && !pay.payment_verified_date) {
        unverifiedPayments++;
      }
    }

    // Count today's reservations
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    var todayReservations = 0;
    var resSheet = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var resData = resSheet.getDataRange().getValues();
    var resHeaders = resData[0];
    for (var i = 1; i < resData.length; i++) {
      var res = rowToObject(resHeaders, resData[i]);
      if (!res.reservation_id || res.status === "Cancelled") continue;

      var eventDate = res.event_date ? new Date(res.event_date) : null;
      if (eventDate) {
        eventDate.setHours(0, 0, 0, 0);
        if (eventDate.getTime() === today.getTime()) {
          todayReservations++;
        }
      }
    }

    // Count pending photos (status = "submitted")
    var pendingPhotos = 0;
    var fileSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_FILE_SUBMISSIONS);
    var fileData = fileSheet.getDataRange().getValues();
    var fileHeaders = fileData[0];
    for (var i = 1; i < fileData.length; i++) {
      var file = rowToObject(fileHeaders, fileData[i]);
      if (file.submission_id && file.document_type === "photo" && file.status === "submitted") {
        pendingPhotos++;
      }
    }

    return successResponse({
      pending_applications: pendingApps,
      board_pending_applications: boardPendingApps,
      active_members: activeMembers,
      unverified_payments: unverifiedPayments,
      reservations_today: todayReservations,
      pending_photos: pendingPhotos
    });

  } catch (e) {
    Logger.log("ERROR in _handleAdminDashboardStats: " + e);
    return errorResponse("Error retrieving dashboard stats: " + e.toString(), "SERVER_ERROR");
  }
}

// ============================================================
// HANDLER: _handleAdminReservationsReport (SUP.3)
// ============================================================
/**
 * Returns aggregated reservation statistics for a given month.
 * Used by the Reports page in Admin.html.
 * Query param: month (ISO date string for any day in desired month; defaults to today)
 */
function _handleAdminReservationsReport(p) {
  var auth = requireAuth(p.token, "board");
  if (!auth.ok) return auth.response;
  try {
    var refDate = p.month ? new Date(p.month) : new Date();
    var stats = _buildReservationsReportStats_(refDate);
    return successResponse({
      month:         formatDate(getMonthStart(refDate)),
      total:         stats.total,
      excessCount:   stats.excessCount,
      waitlistCount: stats.waitlistCount,
      byFacility:    stats.byFacility,
      byStatus:      stats.byStatus
    });
  } catch (e) {
    Logger.log("ERROR _handleAdminReservationsReport: " + e);
    return errorResponse("Could not generate reservations report.", "SERVER_ERROR");
  }
}


// ============================================================
// HANDLER: _handleAdminResendEmail (SUP.4)
// ============================================================
/**
 * Re-sends the member booking confirmation or waitlist email for a reservation.
 * Only works for Approved / Confirmed / Tentative / Waitlisted reservations.
 */
function _handleAdminResendEmail(p) {
  var auth = requireAuth(p.token, "board");
  if (!auth.ok) return auth.response;
  if (!p.reservation_id) return errorResponse("reservation_id required", "INVALID_PARAM");
  var result = resendReservationEmail(p.reservation_id, auth.session.email);
  return result.ok
    ? successResponse({ message: "Email resent." })
    : errorResponse(result.error, result.code);
}


// ============================================================
// RSO PORTAL HANDLERS
// ============================================================

/**
 * HANDLER: _handleAdminRsoPendingDocuments
 * PURPOSE: rso_approve views passport/omang documents awaiting RSO review.
 * RETURNS: { success, data: { documents: [...], count } }
 */
function _handleAdminRsoPendingDocuments(p) {
  var auth = requireAuth(p.token, "rso_approve");
  if (!auth.ok) return auth.response;
  try {
    var docs = getDocumentsForRsoReview(p.document_type || null);
    return successResponse({ documents: docs, count: docs.length });
  } catch (e) {
    Logger.log("ERROR _handleAdminRsoPendingDocuments: " + e);
    return errorResponse("Could not load documents.", "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleAdminRsoApproveDocument
 * PURPOSE: rso_approve approves or rejects a single document submission.
 * REQUIRED PARAMS: submission_id, decision ("approve"|"reject"), rejection_reason (if rejecting)
 * RETURNS: { success, data: { submission_id, new_status } }
 */
function _handleAdminRsoApproveDocument(p) {
  var auth = requireAuth(p.token, "rso_approve");
  if (!auth.ok) return auth.response;
  if (!p.submission_id) return errorResponse("submission_id required.", "MISSING_PARAM");
  if (!p.decision || ["approve","reject"].indexOf(p.decision) === -1) {
    return errorResponse("decision must be 'approve' or 'reject'.", "INVALID_PARAM");
  }
  if (p.decision === "reject" && !p.rejection_reason) {
    return errorResponse("rejection_reason required when rejecting.", "MISSING_PARAM");
  }
  try {
    var result = approveDocumentByRso(p.submission_id, p.decision, p.rejection_reason || "", auth.session.email);
    if (!result.ok) return errorResponse(result.error || "Could not process decision.", "OPERATION_FAILED");
    return successResponse({ submission_id: p.submission_id, new_status: result.new_status });
  } catch (e) {
    Logger.log("ERROR _handleAdminRsoApproveDocument: " + e);
    return errorResponse("Could not process decision.", "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleAdminRsoApprovedCalendar
 * PURPOSE: rso_approve & rso_notify view approved reservations for a given month.
 * OPTIONAL PARAMS: month (YYYY-MM), facility ("all"|"Leobo"|"Tennis Court/Basketball")
 * RETURNS: { success, data: { events: [...], count } }
 */
function _handleAdminRsoApprovedCalendar(p) {
  var auth = requireAuth(p.token, ["rso_approve", "rso_notify"]);
  if (!auth.ok) return auth.response;
  try {
    var events = getApprovedReservationsForCalendar(p.month || null, p.facility || null);
    return successResponse({ events: events, count: events.length });
  } catch (e) {
    Logger.log("ERROR _handleAdminRsoApprovedCalendar: " + e);
    return errorResponse("Could not load calendar.", "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleAdminCalendar
 * PURPOSE: Board/mgt calendar view of ALL reservations for a given month.
 *          Unlike the RSO calendar (approved-only), this returns every status so
 *          the board can see pending, confirmed, tentative, waitlisted, and cancelled
 *          reservations on a single grid.
 *
 * AUTHENTICATION: board or mgt role required.
 *
 * OPTIONAL PARAMS:
 *   month    — "YYYY-MM" string; defaults to current month
 *   facility — facility name or "all"; defaults to all
 *   status   — status value or "all"; defaults to all
 *
 * RETURNS: { success, data: { events: [...], count, month } }
 */
function _handleAdminCalendar(p) {
  var auth = requireAuth(p.token, "board");
  if (!auth.ok) return auth.response;
  try {
    var events = getAllReservationsForCalendar(
      p.month    || null,
      p.facility || null,
      p.status   || null
    );
    return successResponse({ events: events, count: events.length, month: p.month || null });
  } catch (e) {
    Logger.log("ERROR _handleAdminCalendar: " + e);
    return errorResponse("Could not load reservation calendar.", "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleAdminRsoApprovedGuestLists
 * PURPOSE: rso_approve & rso_notify view finalized guest lists for upcoming events.
 * OPTIONAL PARAMS: month (YYYY-MM), facility
 * RETURNS: { success, data: { guestLists: [...], count } }
 */
function _handleAdminRsoApprovedGuestLists(p) {
  var auth = requireAuth(p.token, ["rso_approve", "rso_notify"]);
  if (!auth.ok) return auth.response;
  try {
    var lists = getApprovedGuestListsForRsoNotify(p.month || null, p.facility || null);
    return successResponse({ guestLists: lists, count: lists.length });
  } catch (e) {
    Logger.log("ERROR _handleAdminRsoApprovedGuestLists: " + e);
    return errorResponse("Could not load guest lists.", "SERVER_ERROR");
  }
}

function setupEmailTemplates_Instructions() {
  Logger.log("Email templates standardization complete!");
  Logger.log("");
  Logger.log("All 65 templates now have:");
  Logger.log("- Consistent greetings");
  Logger.log("- Standard signature blocks");
  Logger.log("- Footer explaining it's an automated message that accepts replies");
  Logger.log("");
  Logger.log("Authoritative source: GEA System Backend.xlsx");
  Logger.log("Reference guide: EMAIL_TEMPLATES_REFERENCE.md");
  Logger.log("");
  Logger.log("To sync to Google Sheets, copy the Email Templates sheet from the .xlsx");
  Logger.log("and paste it into the Google Sheets version.");
}
