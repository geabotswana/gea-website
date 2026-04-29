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
 * @param {boolean=} includeInactive If true, includes inactive records (used for applicant login/application flow)
 * @returns {Object|null}  All individual fields as named object, or null
 */
function getMemberByEmail(email, includeInactive) {
  if (!email) return null;
  includeInactive = includeInactive === true;
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

      // Return member if email matches (regardless of active status)
      // AuthService.login() handles applicants (active=false) separately
      if (rowEmail === target) {
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
    for (var i = 1; i < data.length; i++) {
      if (data[i][hhCol] === householdId) {
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

  if (hh.membership_status === MEMBERSHIP_STATUS_APPLICANT) {
    return { isActive: false, status: "pending", message: ERR_MEMBERSHIP_PENDING };
  }
  if (hh.membership_status === MEMBERSHIP_STATUS_EXPELLED || hh.membership_status === MEMBERSHIP_STATUS_RESIGNED || !hh.active) {
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
  return hh && hh.membership_category === CATEGORY_FULL;
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
      // Auto-create the missing column so schema evolves gracefully
      var nextCol = headers.length + 1;
      sheet.getRange(1, nextCol).setValue(fieldName);
      fldCol = headers.length;  // 0-based index of the new column
      Logger.log("_updateField: created missing column '" + fieldName + "' in " + tabName + " at position " + nextCol);
    }

    for (var i = 1; i < data.length; i++) {
      if (data[i][idCol] === recordId) {
        sheet.getRange(i + 1, fldCol + 1).setValue(value);
        if (modCol !== -1) sheet.getRange(i + 1, modCol + 1).setValue(formatDate(new Date(), true));
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
      individualData.can_access_unaccompanied = age >= AGE_REC_CENTER_UNACCOMPANIED;
      individualData.fitness_center_eligible  = age >= AGE_GYM_USAGE;
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
    Logger.log("ERROR createMemberRecord: " + e.toString() + " | Stack: " + e.stack);
    Logger.log("createMemberRecord details - householdId: " + householdId +
               " | firstName: " + individualData.first_name +
               " | lastName: " + individualData.last_name +
               " | dob: " + individualData.date_of_birth);
    return null;
  }
}


// ============================================================
// HOUSEHOLD MEMBER MANAGEMENT
// ============================================================

/**
 * Deactivates a household member by setting active=false.
 * Cannot be used on PRIMARY members.
 *
 * @param {string} individualId   The individual_id to deactivate
 * @param {string} actingBy       Email of the user performing the action (for audit log)
 * @returns {{ ok: boolean, error?: string }}
 */
function deactivateMember(individualId, actingBy) {
  try {
    var m = getMemberById(individualId);
    if (!m) return { ok: false, error: "Member not found." };

    if (m.relationship_to_primary === RELATIONSHIP_PRIMARY) {
      return { ok: false, error: "Cannot deactivate the primary member of a household." };
    }

    updateMemberField(individualId, "active", false, actingBy);
    logAuditEntry(actingBy, AUDIT_MEMBER_DEACTIVATED, "Individual", individualId,
                  "Deactivated: " + (m.first_name || "") + " " + (m.last_name || ""));
    return { ok: true };
  } catch (e) {
    Logger.log("ERROR deactivateMember(" + individualId + "): " + e);
    return { ok: false, error: "Failed to deactivate member." };
  }
}

/**
 * Deletes a member record from the Individuals sheet entirely.
 * Used for removing members during the application phase before household activation.
 * @param {string} individualId
 * @param {string} deletedBy
 * @returns {boolean}
 */
function deleteMemberRecord(individualId, deletedBy) {
  try {
    var sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID)
                  .getSheetByName(TAB_INDIVIDUALS);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol = headers.indexOf("individual_id");

    // Find the row with this individual_id
    for (var i = 1; i < data.length; i++) {
      if (data[i][idCol] === individualId) {
        sheet.deleteRow(i + 1); // Google Sheets uses 1-based indexing
        logAuditEntry(deletedBy, "MEMBER_DELETED", "Individual", individualId,
                      "Deleted member record: " + (data[i][headers.indexOf("first_name")] || "") +
                      " " + (data[i][headers.indexOf("last_name")] || ""));
        return true;
      }
    }
  } catch (e) {
    Logger.log("ERROR deleteMemberRecord(" + individualId + "): " + e);
  }
  return false;
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
    if (m.email) sendEmailFromTemplate("DOC_PHOTO_APPROVED_TO_MEMBER", m.email, {
      FIRST_NAME:         m.first_name,
      APPROVED_DATE:      formatDate(new Date()),
      PHOTO_COUNT:        1,
      CARD_ISSUANCE_DATE: ""
    });
    logAuditEntry(decidedBy, AUDIT_PHOTO_APPROVED, "Individual", individualId, "Photo approved");

  } else if (status === "rejected") {
    var reason = rejectionReason || "Photo did not meet requirements";
    updateMemberField(individualId, "photo_rejection_reason", reason, decidedBy);
    if (m.email) sendEmailFromTemplate("DOC_PHOTO_REJECTED_TO_MEMBER", m.email, {
      FIRST_NAME:         m.first_name,
      REJECTION_REASON:   reason,
      RESUBMIT_DEADLINE:  formatDate(addBusinessDays(new Date(), 14)),
      PHOTO_GUIDELINES_URL: URL_MEMBER_PORTAL
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
 * Standard birthday for most. Special milestone emails for:
 *   - Age 14: Recreation center independence
 *   - Age 15: Fitness center equipment usage
 *   - Age 16: Transition stage (generic greeting)
 *   - Age 17: Adult membership with voting rights (AGE_VOTING)
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
      var primaryEmail = _getPrimaryEmail(m.household_id);
      var primaryFirstName = _getPrimaryFirstName(m.household_id);

      // Determine recipients: send to primary member's email
      // (for child milestones, primary member makes decisions like portal account creation)
      var recipients = primaryEmail ? [primaryEmail] : [m.email];

      // Age 14: Recreation center independence milestone
      if (age === AGE_REC_CENTER_UNACCOMPANIED) {
        sendEmailFromTemplate("MEM_BIRTHDAY_AGE_14_MILESTONE_TO_MEMBER", recipients, {
          FIRST_NAME:        primaryFirstName,
          CHILD_FIRST_NAME:  m.first_name,
          BIRTHDAY_DATE:     formatDate(new Date(m.date_of_birth))
        });

      // Age 15: Fitness center equipment usage milestone
      } else if (age === AGE_GYM_USAGE) {
        sendEmailFromTemplate("MEM_BIRTHDAY_AGE_15_MILESTONE_TO_MEMBER", recipients, {
          FIRST_NAME:        primaryFirstName,
          CHILD_FIRST_NAME:  m.first_name,
          BIRTHDAY_DATE:     formatDate(new Date(m.date_of_birth))
        });

      // Age 16: Transition stage - generic birthday greeting
      } else if (age === 16) {
        sendEmailFromTemplate("MEM_BIRTHDAY_AGE_16_MILESTONE_TO_MEMBER", recipients, {
          FIRST_NAME:        primaryFirstName,
          CHILD_FIRST_NAME:  m.first_name,
          BIRTHDAY_DATE:     formatDate(new Date(m.date_of_birth))
        });

      // Age 17: Adult membership with voting rights
      } else if (age === AGE_VOTING) {
        sendEmailFromTemplate("MEM_BIRTHDAY_AGE_17_MILESTONE_TO_MEMBER", recipients, {
          FIRST_NAME:        primaryFirstName,
          CHILD_FIRST_NAME:  m.first_name,
          BIRTHDAY_DATE:     formatDate(new Date(m.date_of_birth))
        });

      } else {
        sendEmailFromTemplate("MEM_BIRTHDAY_GREETING_TO_MEMBER", recipients, {
          FIRST_NAME:    m.first_name,
          BIRTHDAY_DATE: formatDate(new Date(m.date_of_birth))
        });
      }
      Logger.log("Birthday email sent: " + recipients.join(",") + " (age " + age + ")");
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
        sendEmailFromTemplate("MEM_PASSPORT_EXPIRATION_WARNING_TO_MEMBER", m.email, {
          FIRST_NAME:      m.first_name,
          EXPIRATION_DATE: formatDate(expDate),
          RENEWAL_URL:     URL_MEMBER_PORTAL
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
        MEMBERSHIP_LEVEL: hh.membership_category,
        EXPIRATION_DATE:  formatDate(expDate),
        DUES_USD:         level ? level.annual_dues_usd : "",
        DUES_BWP:         level ? level.annual_dues_bwp : ""
      };

      var membershipYear = (expDate.getFullYear() - 1) + "-" + expDate.getFullYear();
      var renewalVars = {
        FIRST_NAME:       vars.FIRST_NAME,
        RENEWAL_DEADLINE: formatDate(expDate),
        MEMBERSHIP_YEAR:  membershipYear,
        PORTAL_URL:       URL_MEMBER_PORTAL
      };

      if (expDate.getTime() === in30.getTime()) {
        sendEmailFromTemplate("MEM_RENEWAL_REMINDER_30_DAYS_TO_MEMBER", primaryEmail, renewalVars);
        Logger.log("30-day renewal reminder: " + primaryEmail);
      }
      if (expDate.getTime() === in7.getTime()) {
        sendEmailFromTemplate("MEM_RENEWAL_REMINDER_7_DAYS_TO_MEMBER", primaryEmail, renewalVars);
        Logger.log("7-day renewal reminder: " + primaryEmail);
      }

      // Grace period: Check if grace period has ended (expiration + RENEWAL_GRACE_PERIOD_DAYS)
      var graceEndDate = addDays(expDate, RENEWAL_GRACE_PERIOD_DAYS);
      if (today.getTime() === graceEndDate.getTime()) {
        // Grace period ended - lapse the membership
        sendEmailFromTemplate("MEM_MEMBERSHIP_LAPSED_TO_MEMBER", primaryEmail, {
          FIRST_NAME:           vars.FIRST_NAME,
          EXPIRED_DATE:         formatDate(expDate),
          GRACE_END_DATE:       formatDate(graceEndDate),
          RENEWAL_PORTAL_URL:   URL_MEMBER_PORTAL,
          DUES_USD:             vars.DUES_USD,
          DUES_BWP:             vars.DUES_BWP
        });
        updateHouseholdField(hh.household_id, "active", false, "system");
        updateHouseholdField(hh.household_id, "membership_status", MEMBERSHIP_STATUS_LAPSED, "system");
        updateHouseholdField(hh.household_id, "lapsed_date", today, "system");
        Logger.log("Grace period ended, member lapsed: " + hh.household_id);
      }
    }
  } catch (e) { Logger.log("ERROR checkExpiringMemberships: " + e); }
}


function checkLapsedMembersForAutoTermination() {
  Logger.log("Lapsed member auto-termination check starting...");
  var today = new Date(); today.setHours(0, 0, 0, 0);

  try {
    var sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID)
                  .getSheetByName(TAB_HOUSEHOLDS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];

    for (var i = 1; i < data.length; i++) {
      var hh = rowToObject(headers, data[i]);
      if (hh.membership_status !== MEMBERSHIP_STATUS_LAPSED || !hh.lapsed_date) continue;

      var lapsedDate = new Date(hh.lapsed_date);
      lapsedDate.setHours(0, 0, 0, 0);

      // Calculate termination date (lapsed_date + LAPSED_TERMINATION_MONTHS)
      var termDate = new Date(lapsedDate);
      termDate.setMonth(termDate.getMonth() + LAPSED_TERMINATION_MONTHS);
      termDate.setHours(0, 0, 0, 0);

      if (today.getTime() >= termDate.getTime()) {
        // Auto-terminate lapsed membership
        var primaryEmail = _getPrimaryEmail(hh.household_id);
        if (primaryEmail) {
          sendEmailFromTemplate("MEM_MEMBERSHIP_AUTO_TERMINATED_TO_MEMBER", primaryEmail, {
            FIRST_NAME:        _getPrimaryFirstName(hh.household_id),
            LAPSED_DATE:       formatDate(lapsedDate),
            TERMINATION_DATE:  formatDate(today),
            TERMINATION_REASON: "No renewal received after " + LAPSED_TERMINATION_MONTHS + " months of lapsed status"
          });
        }
        updateHouseholdField(hh.household_id, "membership_status", MEMBERSHIP_STATUS_RESIGNED, "system");
        updateHouseholdField(hh.household_id, "termination_date", today, "system");
        updateHouseholdField(hh.household_id, "termination_reason", "Auto-terminated after grace period expiration", "system");
        Logger.log("Lapsed member auto-terminated: " + hh.household_id);
      }
    }
  } catch (e) { Logger.log("ERROR checkLapsedMembersForAutoTermination: " + e); }
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
