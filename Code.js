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

  // Serve the HTML portal shell (no auth needed)
  if (action === "serve") {
    return HtmlService.createHtmlOutputFromFile("Portal")
      .setTitle("GEA Member Portal")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // Serve the Admin interface
  if (action === "serve_admin") {
    return HtmlService.createHtmlOutputFromFile("Admin")
      .setTitle("GEA Admin Portal")
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
    case "login":  return _handleLogin(params);
    case "logout": return _handleLogout(params);


    // ── MEMBER ──────────────────────────────────────────────
    case "dashboard":    return _handleDashboard(params);
    case "profile":      return _handleProfile(params);
    case "reservations": return _handleReservations(params);
    case "book":         return _handleBook(params);
    case "cancel":       return _handleCancel(params);
    case "card":         return _handleCard(params);
    case "payment":      return _handlePaymentSubmit(params);
    case "updatePhoneNumbers": return _handleUpdatePhoneNumbers(params);

    // ── BOARD / ADMIN ────────────────────────────────────────
    case "admin_pending": return _handleAdminPending(params);
    case "admin_approve": return _handleAdminApprove(params);
    case "admin_deny":    return _handleAdminDeny(params);
    case "admin_members": return _handleAdminMembers(params);
    case "admin_photo":   return _handleAdminPhoto(params);
    case "admin_payment": return _handleAdminPayment(params);

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
  return successResponse({ 
    token: result.token, 
    role: result.role, 
    member: result.member 
  });
}

function _handleLogout(p) {
  logout(p.token || "");
  return successResponse({}, "Logged out successfully.");
}


// ============================================================
// MEMBER HANDLERS
// ============================================================

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
    exchange_rate: EXCHANGE_RATE_USD_TO_BWP
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

function _handlePaymentSubmit(p) {
  var auth = requireAuth(p.token);
  if (!auth.ok) return auth.response;

  var required = ["payment_method", "payment_reference", "payment_date", "amount_usd"];
  for (var i = 0; i < required.length; i++) {
    if (!p[required[i]]) return errorResponse("Missing: " + required[i], "MISSING_PARAM");
  }

  var member = getMemberByEmail(auth.session.email);
  var hh     = getHouseholdById(member.household_id);
  if (!member || !hh) return errorResponse(ERR_NOT_MEMBER, "NOT_FOUND");

  var paymentId = generateId("PAY");
  var now       = new Date();

  try {
    var sheet   = SpreadsheetApp.openById(PAYMENT_TRACKING_ID).getSheetByName(TAB_PAYMENTS);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row     = {
      payment_id:                paymentId,
      household_id:              member.household_id,
      household_name:            hh.household_name,
      primary_email:             auth.session.email,
      payment_method:            sanitizeInput(p.payment_method),
      payment_reference:         sanitizeInput(p.payment_reference),
      payment_date:              new Date(p.payment_date),
      amount_usd:                parseFloat(p.amount_usd),
      amount_bwp:                parseFloat(p.amount_bwp) || 0,
      currency:                  p.currency || "USD",
      status:                    "Pending Verification",
      payment_submitted_date:    now,
      notes:                     sanitizeInput(p.notes || "")
    };
    sheet.appendRow(headers.map(function(col) {
      return row[col] !== undefined ? row[col] : "";
    }));
  } catch (err) {
    Logger.log("ERROR _handlePaymentSubmit (write): " + err);
    return errorResponse("Failed to save payment. Please try again.", "SAVE_FAILED");
  }

  // Notify the board
  var level = getMembershipLevel(hh.membership_level_id);
  sendEmail("tpl_025", EMAIL_BOARD, {
    MEMBER_NAME:      hh.household_name,
    MEMBER_EMAIL:     auth.session.email,
    MEMBERSHIP_LEVEL: hh.membership_type,
    DUES_USD:         level ? level.annual_dues_usd : p.amount_usd,
    DUES_BWP:         level ? level.annual_dues_bwp : p.amount_bwp || "",
    PAYMENT_METHOD:   p.payment_method,
    PAYMENT_REFERENCE: p.payment_reference,
    PAYMENT_DATE:     formatDate(new Date(p.payment_date)),
    IF_NOTES:         p.notes ? "true" : "",
    PAYMENT_NOTES:    p.notes || "",
    CONFIRM_LINK:     URL_ADMIN_PORTAL + "?action=admin_payment&method=confirm&id=" + paymentId,
    NOT_FOUND_LINK:   URL_ADMIN_PORTAL + "?action=admin_payment&method=notfound&id=" + paymentId
  });

  logAuditEntry(auth.session.email, AUDIT_PAYMENT_SUBMITTED, "Payment", paymentId,
                p.payment_method + " " + p.payment_reference);

  return successResponse({ paymentId: paymentId },
                         "Payment confirmation submitted. The board will verify and activate your membership.");
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

    // Step 3: Filter for STATUS_PENDING only
    for (var i = 1; i < data.length; i++) {
      var res = rowToObject(headers, data[i]);
      if (res.status === STATUS_PENDING) {
        pending.push(res);
      }
    }

    // Step 4: Return the filtered list
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
  var ok = approveReservation(p.reservation_id, auth.session.email, p.notes || "");

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
 * ============================================================
 * HANDLER: _handleAdminPayment
 * ============================================================
 * PURPOSE:
 * Processes payment verification actions: confirm or mark-not-found.
 * Delegates to _confirmPayment() or _markPaymentNotFound().
 *
 * AUTHENTICATION:
 * Requires board role.
 *
 * PARAMETERS REQUIRED:
 *   token: session token
 *   payment_id: the payment to process
 *   action: "confirm" or "not_found"
 *
 * RESPONSE:
 * { "success": true, "data": {}, "message": "Payment confirmed and membership activated." }
 * ============================================================
 */
function _handleAdminPayment(p) {
  // Step 1: Verify caller is a board member
  var auth = requireAuth(p.token, "board");
  if (!auth.ok) return auth.response;

  // Step 2: Check required parameters
  if (!p.payment_id) {
    return errorResponse("payment_id is required.", "MISSING_PARAM");
  }
  if (!p.action) {
    return errorResponse("action is required (confirm or not_found).", "MISSING_PARAM");
  }

  // Step 3: Route to the appropriate payment processing function
  if (p.action === "confirm") {
    return _confirmPayment(p.payment_id, auth.session.email);
  }
  if (p.action === "not_found") {
    return _markPaymentNotFound(p.payment_id, auth.session.email);
  }

  // Unknown action
  return errorResponse("action must be 'confirm' or 'not_found'.", "INVALID_PARAM");
}


// ============================================================
// PAYMENT VERIFICATION
// ============================================================

function _confirmPayment(paymentId, verifiedBy) {
  try {
    var sheet = SpreadsheetApp.openById(PAYMENT_TRACKING_ID).getSheetByName(TAB_PAYMENTS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol   = headers.indexOf("payment_id");
    var stCol   = headers.indexOf("status");
    var vdCol   = headers.indexOf("payment_verified_date");
    var vbCol   = headers.indexOf("payment_verified_by");

    for (var i = 1; i < data.length; i++) {
      if (data[i][idCol] !== paymentId) continue;

      sheet.getRange(i + 1, stCol + 1).setValue("Verified");
      sheet.getRange(i + 1, vdCol + 1).setValue(new Date());
      sheet.getRange(i + 1, vbCol + 1).setValue(verifiedBy);

      var hhId  = data[i][headers.indexOf("household_id")];
      var email = data[i][headers.indexOf("primary_email")];
      var hh    = getHouseholdById(hhId);

      // Activate the household
      updateHouseholdField(hhId, "active", true, verifiedBy);
      updateHouseholdField(hhId, "application_status", "Approved", verifiedBy);

      // Set expiration date (1 year from today, or +duration for temporary)
      var expDate;
      if (hh && hh.membership_duration_months) {
        expDate = addDays(new Date(), hh.membership_duration_months * 30);
      } else {
        expDate = new Date(new Date().getFullYear(), 11, 31); // Dec 31 of current year
      }
      updateHouseholdField(hhId, "membership_expiration_date", expDate, verifiedBy);

      // Set activation date on all individual members
      var members = getHouseholdMembers(hhId);
      for (var j = 0; j < members.length; j++) {
        updateMemberField(members[j].individual_id, "activation_date", new Date(), verifiedBy);
      }

      // Send confirmation email to member
      var level = getMembershipLevel(hh ? hh.membership_level_id : null);
      sendEmail("tpl_026", email, {
        FIRST_NAME:       _getPrimaryFirstName(hhId),
        DUES_USD:         level ? level.annual_dues_usd : "",
        DUES_BWP:         level ? level.annual_dues_bwp : "",
        PAYMENT_METHOD:   data[i][headers.indexOf("payment_method")],
        PAYMENT_REFERENCE: data[i][headers.indexOf("payment_reference")],
        CONFIRMATION_DATE: formatDate(new Date()),
        MEMBERSHIP_LEVEL:  hh ? hh.membership_type : "",
        EXPIRATION_DATE:   formatDate(expDate),
        IF_NEW_MEMBER:     !hh || !hh.first_login_date ? "true" : ""
      });

      logAuditEntry(verifiedBy, AUDIT_PAYMENT_VERIFIED, "Payment", paymentId,
                    "Payment verified, household activated: " + hhId);
      return successResponse({}, "Payment confirmed and membership activated.");
    }
    return errorResponse("Payment record not found.", "NOT_FOUND");
  } catch (e) {
    Logger.log("ERROR _confirmPayment: " + e);
    return errorResponse("Could not confirm payment.", "SERVER_ERROR");
  }
}

function _markPaymentNotFound(paymentId, markedBy) {
  try {
    var sheet = SpreadsheetApp.openById(PAYMENT_TRACKING_ID).getSheetByName(TAB_PAYMENTS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol   = headers.indexOf("payment_id");
    var stCol   = headers.indexOf("status");

    for (var i = 1; i < data.length; i++) {
      if (data[i][idCol] !== paymentId) continue;
      sheet.getRange(i + 1, stCol + 1).setValue("Not Found");
      logAuditEntry(markedBy, AUDIT_PAYMENT_SUBMITTED, "Payment", paymentId,
                    "Payment not found in account");
      return successResponse({}, "Payment marked as not found.");
    }
    return errorResponse("Payment record not found.", "NOT_FOUND");
  } catch (e) {
    return errorResponse("Could not update payment.", "SERVER_ERROR");
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
  return {
    household_id:               hh.household_id,
    household_name:             hh.household_name,
    household_type:             hh.household_type,
    membership_type:            hh.membership_type,
    application_status:         hh.application_status,
    active:                     hh.active,
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