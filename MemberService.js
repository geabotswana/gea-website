/**
 * ============================================================
 * MEMBERSERVICE.GS
 * ============================================================
 * All functions for reading and writing member data.
 * This is the ONLY file that should directly access the
 * GEA Member Directory spreadsheet. All other files call
 * these functions rather than reading the spreadsheet directly.
 * ============================================================
 */


// ============================================================
// MEMBER LOOKUP — READ
// ============================================================

function testGetMemberByEmail() {
  var result = getMemberByEmail("jane@state.gov");
  if (result) {
    Logger.log("FOUND: " + JSON.stringify(result));
  } else {
    Logger.log("NOT FOUND");
  }
}

function testPasswordHash() {
  var plainPassword = "JanePassword2026!";
  var storedHash = "33961e39b0226f1365699d515c4fc3c0c19e421be541c07702a46559db4f9cee";
  
  var computedHash = hashPassword(plainPassword);
  
  Logger.log("Plain password: " + plainPassword);
  Logger.log("Stored hash:    " + storedHash);
  Logger.log("Computed hash:  " + computedHash);
  Logger.log("Match? " + (computedHash === storedHash));
}

function testFullLogin() {
  var email = "jane@state.gov";
  var password = "JanePassword2026!";
  
  Logger.log("=== TESTING FULL LOGIN ===");
  Logger.log("Email: " + email);
  Logger.log("Password: " + password);
  
  var result = login(email, password);
  
  Logger.log("Login result: " + JSON.stringify(result));
}

/**
 * Finds an active individual record by email address.
 * This is the primary lookup used by the login/auth flow.
 *
 * @param {string} email
 * @returns {Object|null}  All individual fields as named object, or null
 */
function getMemberByEmail(email) {
  if (!email) return null;
  try {
    var sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID)
                  .getSheetByName(TAB_INDIVIDUALS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var emailCol  = headers.indexOf("email");
    var activeCol = headers.indexOf("active");

    Logger.log("DEBUG: Looking for email: " + email);
    Logger.log("DEBUG: emailCol index: " + emailCol + ", activeCol index: " + activeCol);

    var target = email.toLowerCase().trim();
    for (var i = 1; i < data.length; i++) {
      var rowEmail = String(data[i][emailCol] || "").toLowerCase().trim();
      var rowActive = data[i][activeCol];
      
      if (i <= 5) {  // Log first few rows for debugging
        Logger.log("DEBUG: Row " + i + " - email: '" + rowEmail + "', active: " + rowActive);
      }
      
      if (rowEmail === target && rowActive === true) {
        Logger.log("DEBUG: Found matching member at row " + i);
        return rowToObject(headers, data[i]);
      }
    }
    Logger.log("DEBUG: No matching member found");
  } catch (e) { Logger.log("ERROR getMemberByEmail(" + email + "): " + e); }
  return null;
}

/**
 * Finds an individual record by individual_id.
 * @param {string} individualId
 * @returns {Object|null}
 */
function getMemberById(individualId) {
  if (!individualId) return null;
  try {
    var sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID)
                  .getSheetByName(TAB_INDIVIDUALS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol   = headers.indexOf("individual_id");
    for (var i = 1; i < data.length; i++) {
      if (data[i][idCol] === individualId) return rowToObject(headers, data[i]);
    }
  } catch (e) { Logger.log("ERROR getMemberById(" + individualId + "): " + e); }
  return null;
}

/**
 * Finds a household record by household_id.
 * @param {string} householdId
 * @returns {Object|null}
 */
function getHouseholdById(householdId) {
  if (!householdId) return null;
  try {
    var sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID)
                  .getSheetByName(TAB_HOUSEHOLDS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol   = headers.indexOf("household_id");
    for (var i = 1; i < data.length; i++) {
      if (data[i][idCol] === householdId) return rowToObject(headers, data[i]);
    }
  } catch (e) { Logger.log("ERROR getHouseholdById(" + householdId + "): " + e); }
  return null;
}

/**
 * Returns all active members of a household, sorted:
 * Primary → Spouse → Children (by age) → Staff.
 * @param {string} householdId
 * @returns {Array}
 */
function getHouseholdMembers(householdId) {
  if (!householdId) return [];
  var members = [];
  try {
    var sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID)
                  .getSheetByName(TAB_INDIVIDUALS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var hhCol   = headers.indexOf("household_id");
    var actCol  = headers.indexOf("active");
    for (var i = 1; i < data.length; i++) {
      if (data[i][hhCol] === householdId && data[i][actCol] === true) {
        members.push(rowToObject(headers, data[i]));
      }
    }
  } catch (e) {
    Logger.log("ERROR getHouseholdMembers(" + householdId + "): " + e);
    return [];
  }
  var order = { Primary: 1, Spouse: 2, Child: 3, Staff: 4 };
  members.sort(function(a, b) {
    var oa = order[a.relationship_to_primary] || 5;
    var ob = order[b.relationship_to_primary] || 5;
    return oa !== ob ? oa - ob : 0;
  });
  return members;
}

/**
 * Convenience: returns the household for a member's email in one call.
 * @param {string} email
 * @returns {Object|null}
 */
function getHouseholdByMemberEmail(email) {
  var m = getMemberByEmail(email);
  return m ? getHouseholdById(m.household_id) : null;
}

/**
 * Returns the membership level config row for a given level_id.
 * @param {string} levelId
 * @returns {Object|null}
 */
function getMembershipLevel(levelId) {
  if (!levelId) return null;
  try {
    var sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID)
                  .getSheetByName(TAB_MEMBERSHIP_LEVELS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol   = headers.indexOf("level_id");
    var actCol  = headers.indexOf("active");
    for (var i = 1; i < data.length; i++) {
      if (data[i][idCol] === levelId && data[i][actCol] === true) {
        return rowToObject(headers, data[i]);
      }
    }
  } catch (e) { Logger.log("ERROR getMembershipLevel(" + levelId + "): " + e); }
  return null;
}


// ============================================================
// ACCESS CHECKS
// ============================================================

/**
 * Checks whether a member's household is currently active.
 * Called by AuthService before allowing any portal access.
 *
 * @param {string} email
 * @returns {Object} { isActive: bool, status: string, message: string }
 *   status: "active" | "expired" | "pending" | "denied" | "not_found"
 */
function isActiveMember(email) {
  var member = getMemberByEmail(email);
  if (!member) return { isActive: false, status: "not_found", message: ERR_NOT_MEMBER };

  var hh = getHouseholdById(member.household_id);
  if (!hh)     return { isActive: false, status: "not_found", message: ERR_NOT_MEMBER };

  if (hh.application_status === "Pending") {
    return { isActive: false, status: "pending", message: ERR_MEMBERSHIP_PENDING };
  }
  if (hh.application_status === "Denied" || !hh.active) {
    return { isActive: false, status: "denied", message: ERR_NOT_AUTHORIZED };
  }
  if (hh.membership_expiration_date) {
    if (new Date(hh.membership_expiration_date) < new Date()) {
      return { isActive: false, status: "expired", message: ERR_MEMBERSHIP_EXPIRED };
    }
  }
  return { isActive: true, status: "active", message: "OK" };
}

/**
 * Returns true if the member can access facilities unaccompanied.
 * Requires age >= AGE_UNACCOMPANIED_ACCESS.
 * @param {string} individualId
 * @returns {boolean}
 */
function canAccessUnaccompanied(individualId) {
  var m = getMemberById(individualId);
  if (!m || !m.date_of_birth) return false;
  return calculateAge(m.date_of_birth) >= AGE_UNACCOMPANIED_ACCESS;
}

/**
 * Returns true if the member is eligible for the fitness center.
 * @param {string} individualId
 * @returns {boolean}
 */
function isFitnessEligible(individualId) {
  var m = getMemberById(individualId);
  if (!m || !m.date_of_birth) return false;
  return calculateAge(m.date_of_birth) >= AGE_FITNESS_CENTER;
}

/**
 * Returns true if the member is eligible to vote.
 * Requires age >= AGE_VOTING AND Full Membership household.
 * @param {string} individualId
 * @returns {boolean}
 */
function isVotingEligible(individualId) {
  var m = getMemberById(individualId);
  if (!m || !m.date_of_birth) return false;
  if (calculateAge(m.date_of_birth) < AGE_VOTING) return false;
  var hh = getHouseholdById(m.household_id);
  return hh && hh.membership_type === CATEGORY_FULL;
}


// ============================================================
// WRITE FUNCTIONS
// ============================================================

/**
 * Updates a single field on an individual record and logs the change.
 * All member field updates should go through this function.
 *
 * @param {string} individualId
 * @param {string} fieldName    Column header name in Individuals tab
 * @param {*}      value
 * @param {string} updatedBy    Email of person making the change
 * @returns {boolean}
 */
function updateMemberField(individualId, fieldName, value, updatedBy) {
  return _updateField(
    MEMBER_DIRECTORY_ID, TAB_INDIVIDUALS, "individual_id",
    individualId, fieldName, value, updatedBy,
    AUDIT_MEMBER_UPDATED, "Individual"
  );
}

/**
 * Updates a single field on a household record and logs the change.
 * @param {string} householdId
 * @param {string} fieldName
 * @param {*}      value
 * @param {string} updatedBy
 * @returns {boolean}
 */
function updateHouseholdField(householdId, fieldName, value, updatedBy) {
  return _updateField(
    MEMBER_DIRECTORY_ID, TAB_HOUSEHOLDS, "household_id",
    householdId, fieldName, value, updatedBy,
    AUDIT_MEMBER_UPDATED, "Household"
  );
}

/**
 * Internal: shared update logic for any sheet/ID column.
 */
function _updateField(spreadsheetId, tabName, idColName, recordId,
                      fieldName, value, updatedBy, auditAction, auditTarget) {
  try {
    var sheet   = SpreadsheetApp.openById(spreadsheetId).getSheetByName(tabName);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol   = headers.indexOf(idColName);
    var fldCol  = headers.indexOf(fieldName);
    var modCol  = headers.indexOf("last_modified_date");

    if (fldCol === -1) {
      Logger.log("ERROR _updateField: column not found: " + fieldName + " in " + tabName);
      return false;
    }

    for (var i = 1; i < data.length; i++) {
      if (data[i][idCol] === recordId) {
        sheet.getRange(i + 1, fldCol + 1).setValue(value);
        if (modCol !== -1) sheet.getRange(i + 1, modCol + 1).setValue(new Date());
        logAuditEntry(updatedBy, auditAction, auditTarget, recordId,
                      "Updated " + fieldName + " → " + String(value));
        return true;
      }
    }
    Logger.log("ERROR _updateField: record not found: " + recordId + " in " + tabName);
    return false;
  } catch (e) {
    Logger.log("ERROR _updateField(" + recordId + ", " + fieldName + "): " + e);
    return false;
  }
}

/**
 * Creates a new household record and returns the new household_id.
 * @param {Object} householdData  Field values keyed by column name
 * @param {string} createdBy
 * @returns {string|null}  New household_id, or null on error
 */
function createHouseholdRecord(householdData, createdBy) {
  try {
    var sheet   = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_HOUSEHOLDS);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var id      = generateId("HSH");

    householdData.household_id         = id;
    householdData.created_date         = new Date();
    householdData.last_modified_date   = new Date();

    sheet.appendRow(headers.map(function(col) {
      return householdData[col] !== undefined ? householdData[col] : "";
    }));

    logAuditEntry(createdBy, AUDIT_MEMBER_CREATED, "Household", id,
                  "New household: " + (householdData.household_name || ""));
    return id;
  } catch (e) {
    Logger.log("ERROR createHouseholdRecord: " + e);
    return null;
  }
}

/**
 * Creates a new individual record and returns the new individual_id.
 * Automatically calculates age-based eligibility fields.
 * @param {string} householdId
 * @param {Object} individualData  Field values keyed by column name
 * @param {string} createdBy
 * @returns {string|null}  New individual_id, or null on error
 */
function createMemberRecord(householdId, individualData, createdBy) {
  try {
    var sheet   = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_INDIVIDUALS);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var id      = generateId("IND");

    individualData.individual_id       = id;
    individualData.household_id        = householdId;
    individualData.active              = true;
    individualData.photo_status        = PHOTO_STATUS_NONE;
    individualData.created_date        = new Date();
    individualData.last_modified_date  = new Date();

    // Calculate age-based fields
    if (individualData.date_of_birth) {
      var age = calculateAge(individualData.date_of_birth);
      individualData.can_access_unaccompanied = age >= AGE_UNACCOMPANIED_ACCESS;
      individualData.fitness_center_eligible  = age >= AGE_FITNESS_CENTER;
      individualData.voting_eligible          = age >= AGE_VOTING;
      individualData.office_eligible          = age >= AGE_OFFICE_ELIGIBLE;
    }

    sheet.appendRow(headers.map(function(col) {
      return individualData[col] !== undefined ? individualData[col] : "";
    }));

    logAuditEntry(createdBy, AUDIT_MEMBER_CREATED, "Individual", id,
                  "New member: " + (individualData.first_name || "") + " " +
                  (individualData.last_name || "") +
                  " [" + (individualData.relationship_to_primary || "") + "]");
    return id;
  } catch (e) {
    Logger.log("ERROR createMemberRecord: " + e);
    return null;
  }
}


// ============================================================
// PHOTO MANAGEMENT
// ============================================================

/**
 * Updates photo status to "approved" or "rejected" and sends
 * the appropriate notification email to the member.
 *
 * @param {string} individualId
 * @param {string} status           "approved" or "rejected"
 * @param {string} decidedBy        Board member email
 * @param {string} rejectionReason  Required when status is "rejected"
 * @returns {boolean}
 */
function updatePhotoStatus(individualId, status, decidedBy, rejectionReason) {
  var m = getMemberById(individualId);
  if (!m) return false;

  updateMemberField(individualId, "photo_status", status, decidedBy);

  if (status === "approved") {
    updateMemberField(individualId, "photo_approved_by",   decidedBy,   decidedBy);
    updateMemberField(individualId, "photo_approved_date", new Date(), decidedBy);
    if (m.email) sendEmail("tpl_017", m.email, { FIRST_NAME: m.first_name });
    logAuditEntry(decidedBy, AUDIT_PHOTO_APPROVED, "Individual", individualId, "Photo approved");

  } else if (status === "rejected") {
    var reason = rejectionReason || "Photo did not meet requirements";
    updateMemberField(individualId, "photo_rejection_reason", reason, decidedBy);
    if (m.email) sendEmail("tpl_018", m.email, {
      FIRST_NAME:       m.first_name,
      REJECTION_REASON: reason
    });
    logAuditEntry(decidedBy, AUDIT_PHOTO_REJECTED, "Individual", individualId,
                  "Photo rejected: " + reason);
  }
  return true;
}


// ============================================================
// NIGHTLY SCHEDULED CHECKS
// ============================================================

/**
 * Checks for birthdays today and sends the appropriate email.
 * Standard birthday for most. Special email for members
 * turning AGE_UNACCOMPANIED_ACCESS (15) or AGE_VOTING (16).
 * Triggered nightly at BIRTHDAY_CHECK_HOUR.
 */
function checkBirthdays() {
  Logger.log("Birthday check starting...");
  try {
    var sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID)
                  .getSheetByName(TAB_INDIVIDUALS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];

    for (var i = 1; i < data.length; i++) {
      var m = rowToObject(headers, data[i]);
      if (!m.active || !m.date_of_birth || !m.email) continue;
      if (m.relationship_to_primary === RELATIONSHIP_STAFF) continue;
      if (!isBirthdayToday(m.date_of_birth)) continue;

      var age = calculateAge(m.date_of_birth);
      var hh  = getHouseholdById(m.household_id);

      if (age === AGE_UNACCOMPANIED_ACCESS) {
        var parentEmail = _getPrimaryEmail(m.household_id);
        var recipients  = parentEmail && parentEmail !== m.email
                          ? [m.email, parentEmail] : [m.email];
        sendEmail("tpl_023", recipients, {
          FIRST_NAME:  m.first_name,
          PARENT_NAME: _getPrimaryFullName(m.household_id),
          IF_NO_EMAIL: !m.email ? "true" : ""
        });

      } else if (age === AGE_VOTING && hh && hh.membership_type === CATEGORY_FULL) {
        sendEmail("tpl_024", m.email, { FIRST_NAME: m.first_name });

      } else {
        sendEmail("tpl_022", m.email, { FIRST_NAME: m.first_name });
      }
      Logger.log("Birthday email sent: " + m.email + " (age " + age + ")");
    }
  } catch (e) { Logger.log("ERROR checkBirthdays: " + e); }
}

/**
 * Checks for members whose documents expire within
 * PASSPORT_WARNING_MONTHS and sends a courtesy warning.
 * Triggered nightly.
 */
function checkExpiringDocuments() {
  Logger.log("Document expiration check starting...");
  var warnBefore = addDays(new Date(), PASSPORT_WARNING_MONTHS * 30);
  try {
    var sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID)
                  .getSheetByName(TAB_INDIVIDUALS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];

    for (var i = 1; i < data.length; i++) {
      var m = rowToObject(headers, data[i]);
      if (!m.active || !m.email || !m.document_expiration_date) continue;
      if (m.expiration_warning_sent === true) continue;

      var expDate = new Date(m.document_expiration_date);
      if (expDate <= warnBefore && expDate > new Date()) {
        sendEmail("tpl_015", m.email, {
          FIRST_NAME:               m.first_name,
          DOCUMENT_TYPE:            m.document_type || "Passport",
          DOCUMENT_NUMBER:          m.document_number || "",
          DOCUMENT_EXPIRATION_DATE: formatDate(expDate)
        });
        updateMemberField(m.individual_id, "expiration_warning_sent", true,  "system");
        updateMemberField(m.individual_id, "expiration_warning_date", new Date(), "system");
        Logger.log("Document warning sent: " + m.email);
      }
    }
  } catch (e) { Logger.log("ERROR checkExpiringDocuments: " + e); }
}

/**
 * Checks for memberships expiring in 30 days, 7 days, or today.
 * Sends the appropriate renewal reminder and deactivates expired households.
 * Triggered nightly.
 */
function checkExpiringMemberships() {
  Logger.log("Membership expiration check starting...");
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var in30  = addDays(today, RENEWAL_REMINDER_DAYS_1);
  var in7   = addDays(today, RENEWAL_REMINDER_DAYS_2);

  try {
    var sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID)
                  .getSheetByName(TAB_HOUSEHOLDS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];

    for (var i = 1; i < data.length; i++) {
      var hh = rowToObject(headers, data[i]);
      if (!hh.active || !hh.membership_expiration_date) continue;

      var expDate = new Date(hh.membership_expiration_date);
      expDate.setHours(0, 0, 0, 0);

      var primaryEmail = _getPrimaryEmail(hh.household_id);
      if (!primaryEmail) continue;

      var level  = getMembershipLevel(hh.membership_level_id);
      var vars = {
        FIRST_NAME:       _getPrimaryFirstName(hh.household_id),
        FULL_NAME:        hh.household_name,
        MEMBERSHIP_LEVEL: hh.membership_type,
        EXPIRATION_DATE:  formatDate(expDate),
        DUES_USD:         level ? level.annual_dues_usd : "",
        DUES_BWP:         level ? level.annual_dues_bwp : ""
      };

      if (expDate.getTime() === in30.getTime()) {
        sendEmail("tpl_004", primaryEmail, vars);
        Logger.log("30-day renewal reminder: " + primaryEmail);
      }
      if (expDate.getTime() === in7.getTime()) {
        sendEmail("tpl_005", primaryEmail, vars);
        Logger.log("7-day renewal reminder: " + primaryEmail);
      }
      if (expDate.getTime() === today.getTime()) {
        sendEmail("tpl_006", primaryEmail, vars);
        updateHouseholdField(hh.household_id, "active", false, "system");
        Logger.log("Expired + deactivated: " + hh.household_id);
      }
    }
  } catch (e) { Logger.log("ERROR checkExpiringMemberships: " + e); }
}


// ============================================================
// INTERNAL HELPERS
// ============================================================

function _getPrimaryEmail(householdId) {
  var members = getHouseholdMembers(householdId);
  for (var i = 0; i < members.length; i++) {
    if (members[i].relationship_to_primary === RELATIONSHIP_PRIMARY) return members[i].email;
  }
  return null;
}

function _getPrimaryFirstName(householdId) {
  var members = getHouseholdMembers(householdId);
  for (var i = 0; i < members.length; i++) {
    if (members[i].relationship_to_primary === RELATIONSHIP_PRIMARY) return members[i].first_name;
  }
  return "";
}

function _getPrimaryFullName(householdId) {
  var members = getHouseholdMembers(householdId);
  for (var i = 0; i < members.length; i++) {
    if (members[i].relationship_to_primary === RELATIONSHIP_PRIMARY) {
      return members[i].first_name + " " + members[i].last_name;
    }
  }
  return "";
}