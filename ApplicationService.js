/**
 * ============================================================
 * APPLICATIONSERVICE.GS
 * ============================================================
 * Membership application workflow management.
 *
 * This service handles the complete membership application
 * lifecycle from initial submission through activation:
 *
 * 1. Application form submission (Step 1)
 * 2. Document upload (Step 5)
 * 3. Board initial review (Step 6)
 * 4. RSO document review (Step 7-8)
 * 5. Board final approval (Step 9)
 * 6. Payment processing (Step 7)
 * 7. Treasurer activation (Step 10)
 *
 * Status progression:
 * awaiting_docs → board_initial_review →
 * rso_review → board_final_review → approved_pending_payment →
 * payment_submitted → activated
 * ============================================================
 */


/**
 * FUNCTION: createApplicationRecord
 * PURPOSE: Create a new membership application and auto-create household/individual records.
 *
 * STEPS:
 * 1. Validate required form fields
 * 2. Generate application_id (e.g., APP-2026-00001)
 * 3. Auto-create Household record (active=FALSE, application_status="Awaiting Documents")
 * 4. Auto-create primary Individual record (active=FALSE, with temp password)
 * 5. Append application row to Membership Applications sheet
 * 6. Send confirmation emails (applicant + board)
 * 7. Log audit entry
 *
 * @param {Object} formData Application form data from portal
 * @param {string} createdBy Email of person creating application (usually "applicant")
 * @returns {Object} { success, application_id, temp_password, household_id, individual_id, message }
 */
function createApplicationRecord(formData, createdBy) {
  try {
    Logger.log("[DEBUG] createApplicationRecord called with formData: " + JSON.stringify(formData));
    Logger.log("[DEBUG] createdBy: " + createdBy);
    Logger.log("[DEBUG] household_type from formData: " + formData.household_type);
    Logger.log("[DEBUG] HOUSEHOLD_FAMILY constant: " + HOUSEHOLD_FAMILY);
    Logger.log("[DEBUG] HOUSEHOLD_INDIVIDUAL constant: " + HOUSEHOLD_INDIVIDUAL);

    // Validate required fields
    var required = ["first_name", "last_name", "email", "country_code_primary", "phone_primary", "membership_category"];
    for (var i = 0; i < required.length; i++) {
      if (!formData[required[i]]) {
        Logger.log("[DEBUG] Missing required field: " + required[i]);
        return { success: false, message: "Missing required field: " + required[i] };
      }
    }

    // Validate email format
    if (!isValidEmail(formData.email)) {
      return { success: false, message: "Invalid email address." };
    }

    // Check if email already exists
    var existingMember = getMemberByEmail(formData.email, true);
    if (existingMember) {
      return { success: false, message: "An account with this email already exists." };
    }

    // Generate application_id
    var applicationId = generateId("APP");

    // Generate temporary password
    var tempPassword = _generateTemporaryPassword();

    // Create primary Individual record FIRST so we have the ID for household
    var individualId = generateId("IND");

    // Create Household record with three-part phone system
    var householdId = generateId("HSH");
    var householdType = formData.household_type || HOUSEHOLD_INDIVIDUAL;
    Logger.log("[DEBUG] Determined householdType: " + householdType + " (from formData.household_type: " + formData.household_type + ")");
    var primaryApplicantName = capitalizeName(formData.first_name) + " " + capitalizeName(formData.last_name);

    // Format dates as YYYY-MM-DD
    var today = new Date();
    var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    // Generate household name: check if there's a spouse with different last name
    var householdName = capitalizeName(formData.last_name) + " Household";
    if (householdType === HOUSEHOLD_FAMILY && formData.family_members && formData.family_members.length > 0) {
      var spouse = formData.family_members.find(function(fm) {
        return fm.relationship_to_primary === RELATIONSHIP_SPOUSE;
      });
      if (spouse && spouse.last_name && capitalizeName(spouse.last_name) !== capitalizeName(formData.last_name)) {
        householdName = capitalizeName(formData.last_name) + "-" + capitalizeName(spouse.last_name) + " Household";
      }
    }

    var householdData = {
      household_id: householdId,
      primary_member_id: individualId,
      household_name: householdName,
      household_type: householdType,
      membership_category: formData.membership_category,
      membership_level_id: _getMembershipLevelId(formData.membership_category, householdType),
      active: false,
      application_status: "Awaiting Documents",
      application_id: applicationId,
      application_date: todayStr,
      country_code_primary: formData.country_code_primary || "BW",
      phone_primary: formData.phone_primary || "",
      phone_primary_whatsapp: formData.phone_primary_whatsapp || false,
      membership_start_date: "",
      membership_expiration_date: "",
      approved_by: "",
      approved_date: "",
      created_date: todayStr,
      created_by: createdBy,
      notes: "Auto-created from membership application"
    };

    // Append household to Households tab
    var householdSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_HOUSEHOLDS);
    householdSheet.appendRow(_objectToRow(householdData, TAB_HOUSEHOLDS));
    var individualData = {
      individual_id: individualId,
      household_id: householdId,
      first_name: capitalizeName(formData.first_name),
      last_name: capitalizeName(formData.last_name),
      email: formData.email,
      relationship_to_primary: RELATIONSHIP_PRIMARY,
      active: false,
      date_of_birth: "",
      passport_number: "",
      omang_number: "",
      citizenship_country: formData.citizenship_country || "",
      country_code_primary: formData.country_code_primary || "BW",
      phone_primary: formData.phone_primary || "",
      phone_primary_whatsapp: formData.phone_primary_whatsapp || false,
      employment_office: formData.employment_office || "",
      employment_job_title: formData.employment_job_title || "",
      arrival_date: formData.employment_posting_date || "",
      departure_date: formData.employment_departure_date || "",
      password_hash: hashPassword(tempPassword),
      created_date: todayStr,
      created_by: createdBy
    };

    // Append individual to Individuals tab
    var individualSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_INDIVIDUALS);
    individualSheet.appendRow(_objectToRow(individualData, TAB_INDIVIDUALS));

    // Create household staff individual if provided
    if (formData.has_staff && formData.staff_first_name && formData.staff_last_name) {
      var staffIndividualId = generateId("IND");
      var staffIndividualData = {
        individual_id: staffIndividualId,
        household_id: householdId,
        first_name: capitalizeName(formData.staff_first_name),
        last_name: capitalizeName(formData.staff_last_name),
        email: "", // Staff members don't have email
        relationship_to_primary: RELATIONSHIP_STAFF,
        active: false,
        date_of_birth: "",
        passport_number: "",
        omang_number: "",
        citizenship_country: formData.staff_citizenship || "",
        country_code_primary: "",
        phone_primary: "",
        phone_primary_whatsapp: false,
        employment_office: "",
        employment_job_title: "",
        arrival_date: todayStr, // Auto-populate with application submission date (employment start date)
        departure_date: "",
        password_hash: "", // Staff don't log in
        created_date: todayStr,
        created_by: createdBy
      };
      individualSheet.appendRow(_objectToRow(staffIndividualData, TAB_INDIVIDUALS));
    }

    // Create family member individuals if provided
    if (formData.family_members && formData.family_members.length > 0) {
      formData.family_members.forEach(function(familyMember) {
        var familyIndividualId = generateId("IND");
        var familyIndividualData = {
          individual_id: familyIndividualId,
          household_id: householdId,
          first_name: capitalizeName(familyMember.first_name),
          last_name: capitalizeName(familyMember.last_name),
          email: "", // Family members don't have email during application
          relationship_to_primary: familyMember.relationship_to_primary || "Other",
          active: false,
          date_of_birth: "",
          passport_number: "",
          omang_number: "",
          citizenship_country: familyMember.citizenship_country || "",
          country_code_primary: "",
          phone_primary: "",
          phone_primary_whatsapp: false,
          employment_office: "",
          employment_job_title: "",
          arrival_date: "",
          departure_date: "",
          password_hash: "", // Family members don't log in during application
          created_date: todayStr,
          created_by: createdBy
        };
        individualSheet.appendRow(_objectToRow(familyIndividualData, TAB_INDIVIDUALS));
      });
    }

    // Create application record using the three-part phone system
    var applicationData = {
      application_id: applicationId,
      household_id: householdId,
      primary_individual_id: individualId,
      primary_applicant_name: primaryApplicantName,
      primary_applicant_first_name: capitalizeName(formData.first_name),
      primary_applicant_last_name: capitalizeName(formData.last_name),
      primary_applicant_email: formData.email,
      country_code_primary: formData.country_code_primary || "BW",
      phone_primary: formData.phone_primary || "",
      phone_primary_whatsapp: formData.phone_primary_whatsapp || false,
      membership_category: formData.membership_category,
      household_type: householdType,
      sponsor_name: capitalizeName(formData.sponsor_name) || "",
      sponsor_email: formData.sponsor_email || "",
      sponsor_verified: false,
      sponsor_verified_date: "",
      sponsor_verified_by: "",
      submitted_date: todayStr,
      status: APP_STATUS_AWAITING_DOCS,
      documents_confirmed_date: "",
      board_initial_status: "",
      board_initial_reviewed_by: "",
      board_initial_review_date: "",
      board_initial_notes: "",
      board_initial_denial_reason: "",
      rso_status: "",
      rso_reviewed_by: "",
      rso_review_date: "",
      rso_private_notes: "",
      board_final_status: "",
      board_final_reviewed_by: "",
      board_final_review_date: "",
      board_final_denial_reason: "",
      payment_status: "",
      payment_id: "",
      employment_job_title: formData.employment_job_title || "",
      employment_posting_date: formData.employment_posting_date || "",
      employment_departure_date: formData.employment_departure_date || "",
      dues_amount: 0,
      membership_start_date: "",
      membership_expiration_date: "",
      rules_agreement_accepted: formData.rules_agreement_accepted || false,
      rules_agreement_name: formData.rules_agreement_name || "",
      rules_agreement_date: (formData.rules_agreement_accepted ? todayStr : ""),
      created_date: todayStr,
      last_modified_date: todayStr,
      notes: ""
    };

    // Append application to Membership Applications tab (in Member Directory)
    var appSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
    appSheet.appendRow(_objectToRow(applicationData, TAB_MEMBERSHIP_APPLICATIONS));

    // Log audit entry
    logAuditEntry(formData.email, AUDIT_APPLICATION_CREATED, "Application", applicationId,
                  "New membership application submitted for " + householdType);

    // Send confirmation emails
    var boardEmail = getConfigValue("EMAIL_BOARD") || "board@geabotswana.org";
    Logger.log("[DEBUG] Sending emails - boardEmail: " + boardEmail);

    // Email to applicant: application received confirmation
    Logger.log("[DEBUG] Sending MEM_APPLICATION_RECEIVED_TO_APPLICANT to " + formData.email);
    sendEmailFromTemplate("MEM_APPLICATION_RECEIVED_TO_APPLICANT", formData.email, {
      "FIRST_NAME":     formData.first_name,
      "APPLICATION_ID": applicationId,
      "SUBMITTED_DATE": todayStr,
      "PORTAL_URL":     "https://geabotswana.org/member.html"
    });

    // Email to applicant: temporary login credentials
    Logger.log("[DEBUG] Sending MEM_ACCOUNT_CREDENTIALS_TO_APPLICANT to " + formData.email);
    sendEmailFromTemplate("MEM_ACCOUNT_CREDENTIALS_TO_APPLICANT", formData.email, {
      "FIRST_NAME":    formData.first_name,
      "EMAIL":         formData.email,
      "TEMP_PASSWORD": tempPassword,
      "LOGIN_URL":     "https://geabotswana.org/member.html"
    });

    // Email to board (sent FROM board@, so it arrives as incoming mail, not sent folder)
    Logger.log("[DEBUG] Sending ADM_NEW_APPLICATION_BOARD_TO_BOARD FROM board to " + boardEmail);
    var boardEmailVars = {
      "APPLICANT_NAME": formData.first_name + " " + formData.last_name,
      "MEMBERSHIP_CATEGORY": formData.membership_category,
      "HOUSEHOLD_TYPE": householdType,
      "APPLICATION_ID": applicationId,
      "SUBMITTED_DATE": formatDate(new Date(), true)
    };
    Logger.log("[DEBUG] Board email variables: " + JSON.stringify(boardEmailVars));
    sendEmailFromTemplate("ADM_NEW_APPLICATION_BOARD_TO_BOARD", boardEmail, {
      FIRST_NAME:            "Board",
      APPLICANT_NAME:        boardEmailVars["APPLICANT_NAME"],
      APPLICATION_ID:        boardEmailVars["APPLICATION_ID"],
      APPLICATION_DATE:      boardEmailVars["SUBMITTED_DATE"],
      BOARD_REVIEW_DEADLINE: formatDate(addDays(new Date(), 3))
    });

    return {
      success: true,
      application_id: applicationId,
      household_id: householdId,
      individual_id: individualId,
      temp_password: tempPassword,
      message: "Application submitted successfully. Check your email for login credentials."
    };

  } catch (e) {
    var errorMsg = "Error creating application: " + e.toString() + " | " + (e.stack || "no stack");
    Logger.log("[ERROR] " + errorMsg);
    logAuditEntry(createdBy, "APPLICATION_ERROR", "Application", "",
                  errorMsg);
    return { success: false, message: "Error creating application: " + e.toString() };
  }
}


/**
 * FUNCTION: getApplicationForApplicant
 * PURPOSE: Get application status, document checklist, and next steps for an applicant.
 *
 * @param {string} email Applicant's email address
 * @returns {Object} Application status, documents, payment info, next steps
 */
function getApplicationForApplicant(email) {
  try {
    var member = getMemberByEmail(email, true);
    if (!member) {
      return { success: false, message: "Member not found." };
    }

    var household = getHouseholdById(member.household_id);
    if (!household) {
      return { success: false, message: "Household not found." };
    }

    var application = _getApplicationByHouseholdId(household.household_id);
    if (!application) {
      return { success: false, message: "Application not found." };
    }

    // Get all individuals in household
    var individuals = _getIndividualsByHouseholdId(household.household_id);

    // Get file submissions for each individual
    var documents = {};
    for (var i = 0; i < individuals.length; i++) {
      var indId = individuals[i].individual_id;
      documents[indId] = _getFileSubmissionsForIndividual(indId);
    }

    // Build dues info for payment display (NMP.4)
    var duesInfo = null;
    if (household.membership_level_id) {
      var level = getMembershipLevel(household.membership_level_id);
      if (level && level.annual_dues_usd) {
        var annualDuesUsd = Number(level.annual_dues_usd) || 0;
        var qInfo = _getCurrentQuarterInfo_();
        var proratedUsd = Math.round(annualDuesUsd * (qInfo.percentage / 100) * 100) / 100;
        var exchangeRate = getExchangeRate();
        duesInfo = {
          membership_category: application.membership_category || household.membership_category || "",
          annual_dues_usd:    annualDuesUsd,
          current_quarter:    qInfo.name,
          quarter_percentage: qInfo.percentage,
          prorated_usd:       proratedUsd,
          exchange_rate:      exchangeRate,
          prorated_bwp:       Math.round(proratedUsd * exchangeRate * 100) / 100
        };
      }
    }

    return {
      success: true,
      application_id: application.application_id,
      status: application.status,
      household_type: application.household_type,
      membership_category: application.membership_category,
      submitted_date: application.submitted_date,
      individuals: individuals,
      documents: documents,
      payment_status: application.payment_status,
      payment_id: application.payment_id,
      approved_date: application.approved_date,
      dues_info: duesInfo
    };

  } catch (e) {
    return { success: false, message: "Error retrieving application data." };
  }
}


/**
 * FUNCTION: confirmDocumentsUploaded
 * PURPOSE: Applicant confirms all required documents have been uploaded.
 *
 * @param {string} applicationId Application ID
 * @param {string} email Applicant's email (for ownership verification)
 * @returns {Object} { success, message }
 */
function confirmDocumentsUploaded(applicationId, email) {
  try {
    var application = _getApplicationById(applicationId);
    if (!application) {
      return { success: false, message: "Application not found." };
    }

    // Verify ownership
    if (application.primary_applicant_email !== email) {
      return { success: false, message: "Unauthorized." };
    }

    // Update application status to board_initial_review (board must review before RSO)
    var appSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
    var appRow = _findApplicationRow(applicationId);
    if (appRow > 0) {
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "status")).setValue(APP_STATUS_BOARD_INITIAL_REVIEW);
    }

    logAuditEntry(email, AUDIT_APPLICATION_BOARD_INITIAL, "Application", applicationId,
                  "Documents submitted and ready for board review");

    var applicantName      = application.primary_applicant_name || "";
    var applicantFirstName = applicantName.split(" ")[0] || "Applicant";
    var boardEmail = getConfigValue("EMAIL_BOARD") || "board@geabotswana.org";

    // Notify board that documents are ready for their review (board reviews BEFORE RSO)
    sendEmailFromTemplate("ADM_DOCS_SENT_TO_BOARD_FOR_REVIEW_TO_BOARD", boardEmail, {
      FIRST_NAME:      "Board",
      APPLICANT_NAME:  applicantName,
      APPLICATION_ID:  applicationId,
      DOCUMENT_TYPES:  "Passport / Omang / Photo",
      SUBMISSION_DATE: formatDate(new Date())
    });

    // Notify applicant that documents have been confirmed and are under board review
    sendEmailFromTemplate("ADM_DOCS_SENT_TO_BOARD_FOR_REVIEW_TO_MEMBER", application.primary_applicant_email, {
      FIRST_NAME:      applicantFirstName,
      DOCUMENT_TYPES:  "Passport / Omang / Photo",
      SUBMISSION_DATE: formatDate(new Date())
    });

    return { success: true, message: "Documents confirmed and sent to board for review." };

  } catch (e) {
    return { success: false, message: "Error confirming documents." };
  }
}


/**
 * FUNCTION: listApplicationsForBoard
 * PURPOSE: List all applications for board view, optionally filtered by status.
 *
 * @param {string} statusFilter Optional status to filter by
 * @returns {Array} Array of application summaries
 */
function listApplicationsForBoard(statusFilter) {
  try {
    var appSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
    var data = appSheet.getDataRange().getValues();
    var headers = data[0];
    var applications = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var app = _rowToObject(row, headers);

      if (!app.application_id) continue;
      if (statusFilter && app.status !== statusFilter) continue;

      // Build applicant name from first_name and last_name fields (new schema)
      // with fallback to primary_applicant_name (old schema) for backward compatibility
      var applicantName;
      if (app.primary_applicant_first_name && app.primary_applicant_last_name) {
        applicantName = app.primary_applicant_first_name + " " + app.primary_applicant_last_name;
      } else if (app.primary_applicant_name) {
        applicantName = app.primary_applicant_name;
      } else {
        applicantName = "Applicant";
      }

      applications.push({
        application_id: app.application_id,
        applicant_name: applicantName,
        first_name: app.primary_applicant_first_name || "",
        last_name: app.primary_applicant_last_name || "",
        email: app.email,
        membership_category: app.membership_category,
        household_type: app.household_type,
        submitted_date: app.submitted_date,
        status: app.status,
        documents_confirmed_date: app.documents_confirmed_date
      });
    }

    return applications;

  } catch (e) {
    return [];
  }
}


/**
 * FUNCTION: getApplicationDetail
 * PURPOSE: Get full application details for board review page.
 *
 * @param {string} applicationId Application ID
 * @returns {Object} Full application data including documents
 */
function getApplicationDetail(applicationId) {
  try {
    var application = _getApplicationById(applicationId);
    if (!application) {
      return { success: false, message: "Application not found." };
    }

    var household = getHouseholdById(application.household_id);
    var individuals = _getIndividualsByHouseholdId(application.household_id);

    // Get documents for each individual
    var documentsByIndividual = {};
    for (var i = 0; i < individuals.length; i++) {
      documentsByIndividual[individuals[i].individual_id] = _getFileSubmissionsForIndividual(individuals[i].individual_id);
    }

    return {
      success: true,
      application: application,
      household: household,
      individuals: individuals,
      documents: documentsByIndividual
    };

  } catch (e) {
    return { success: false, message: "Error retrieving application details." };
  }
}


/**
 * FUNCTION: boardInitialDecision
 * PURPOSE: Board makes initial decision on membership application.
 *
 * DECISION: "approved" → Send to RSO for document review
 *          "denied" → Reject application, allow reapplication
 *
 * @param {string} applicationId Application ID
 * @param {string} decision "approved" or "denied"
 * @param {string} boardEmail Email of board member making decision
 * @param {string} notes Optional notes for internal record
 * @param {string} reason Optional public reason (for denials)
 * @returns {Object} { success, message }
 */
function boardInitialDecision(applicationId, decision, boardEmail, notes, reason) {
  try {
    var application = _getApplicationById(applicationId);
    if (!application) {
      return { success: false, message: "Application not found." };
    }

    var appSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
    var appRow = _findApplicationRow(applicationId);
    if (appRow === -1) {
      return { success: false, message: "Application row not found in sheet." };
    }

    if (decision === "approved") {
      // Board approves — send to RSO
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_initial_status")).setValue("approved");
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_initial_reviewed_by")).setValue(boardEmail);
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_initial_review_date")).setValue(new Date());
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_initial_notes")).setValue(notes || "");
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "status")).setValue(APP_STATUS_RSO_DOCS_REVIEW);

      logAuditEntry(boardEmail, AUDIT_APPLICATION_BOARD_INITIAL, "Application", applicationId, "Approved for RSO review");

      // Notify board (all members get informed of the approval)
      var _boardEmail = getConfigValue("EMAIL_BOARD") || "board@geabotswana.org";
      var _appName0      = application.primary_applicant_name || "";
      sendEmailFromTemplate("ADM_BOARD_INITIAL_APPROVAL_TO_BOARD", _boardEmail, {
        FIRST_NAME:       "Board",
        APPLICANT_NAME:   _appName0,
        APPLICATION_ID:   applicationId,
        APPROVED_BY_NAME: boardEmail,
        APPROVAL_DATE:    formatDate(new Date())
      });

      // Notify RSO and applicant
      var rsoEmail = EMAIL_RSO_APPROVE;
      var _appName1      = application.primary_applicant_name || "";
      var _appFirstName1 = _appName1.split(" ")[0] || "Applicant";
      sendEmailFromTemplate("ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE", rsoEmail, {
        FIRST_NAME:       "RSO Team",
        APPLICANT_NAME:   _appName1,
        APPLICATION_ID:   applicationId,
        DOCUMENT_TYPES:   "Passport / Omang / Photo",
        APPROVAL_DEADLINE: formatDate(addDays(new Date(), 5))
      });

      sendEmailFromTemplate("ADM_DOCS_SENT_TO_RSO_TO_MEMBER", application.primary_applicant_email, {
        FIRST_NAME:      _appFirstName1,
        DOCUMENT_TYPES:  "Passport / Omang / Photo",
        SUBMISSION_DATE: formatDate(new Date())
      });

    } else if (decision === "denied") {
      // Board denies application
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_initial_status")).setValue("denied");
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_initial_reviewed_by")).setValue(boardEmail);
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_initial_review_date")).setValue(new Date());
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_initial_denial_reason")).setValue(reason || "");
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "status")).setValue(APP_STATUS_DENIED);

      // Update household status
      var householdSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_HOUSEHOLDS);
      var hhRow = _findHouseholdRow(application.household_id);
      householdSheet.getRange(hhRow, _getColumnIndex(TAB_HOUSEHOLDS, "application_status")).setValue("Denied");

      logAuditEntry(boardEmail, AUDIT_APPLICATION_DENIED, "Application", applicationId, "Denied at initial review. Reason: " + (reason || ""));

      // Notify applicant
      var _appName2      = application.primary_applicant_name || "";
      var _appFirstName2 = _appName2.split(" ")[0] || "Applicant";
      sendEmailFromTemplate("MEM_APPLICATION_DENIED_TO_APPLICANT", application.primary_applicant_email, {
        FIRST_NAME:    _appFirstName2,
        APPLICATION_ID: applicationId,
        DENIAL_REASON: reason || "Your application does not meet membership requirements at this time.",
        CONTACT_EMAIL: "board@geabotswana.org"
      });
    }

    return { success: true, message: "Decision recorded." };

  } catch (e) {
    return { success: false, message: "Error recording decision: " + e.toString() };
  }
}


/**
 * FUNCTION: rsoDecision
 * PURPOSE: RSO reviews documents and approves or requests changes.
 *
 * @param {string} applicationId Application ID
 * @param {string} decision "approved" or "denied"
 * @param {string} rsoEmail Email of RSO member
 * @param {string} privateNotes Private notes for board (not shared with applicant)
 * @param {string} publicReason Public reason message (sent to applicant if denied)
 * @returns {Object} { success, message }
 */
function rsoDecision(applicationId, decision, rsoEmail, privateNotes, publicReason) {
  try {
    var application = _getApplicationById(applicationId);
    if (!application) {
      return { success: false, message: "Application not found." };
    }

    var appSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
    var appRow = _findApplicationRow(applicationId);
    if (appRow === -1) {
      return { success: false, message: "Application row not found in sheet." };
    }

    if (decision === "approved") {
      // RSO approves — ready for board final review
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_status")).setValue("approved");
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_reviewed_by")).setValue(rsoEmail);
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_review_date")).setValue(new Date());
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "status")).setValue(APP_STATUS_BOARD_FINAL_REVIEW);

      logAuditEntry(rsoEmail, AUDIT_APPLICATION_RSO_REVIEWED, "Application", applicationId, "RSO approved documents");

      // Notify board
      var boardEmail = getConfigValue("EMAIL_BOARD") || "board@geabotswana.org";
      sendEmailFromTemplate("ADM_BOARD_APPROVED_FOR_RSO_TO_BOARD", boardEmail, {
        FIRST_NAME:     "Board",
        APPLICANT_NAME: application.primary_applicant_name || "",
        APPLICATION_ID: applicationId,
        APPROVAL_DATE:  formatDate(new Date()),
        RSO_NEXT_STEPS: "RSO review and document verification complete. Ready for final board approval."
      });

    } else if (decision === "denied") {
      // RSO rejects — loops back to initial review with feedback
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_status")).setValue("denied");
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_reviewed_by")).setValue(rsoEmail);
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_review_date")).setValue(new Date());
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_private_notes")).setValue(privateNotes || "");
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "status")).setValue(APP_STATUS_BOARD_INITIAL_REVIEW);
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_initial_status")).setValue("");

      logAuditEntry(rsoEmail, AUDIT_APPLICATION_RSO_REVIEWED, "Application", applicationId, "RSO rejected - returned for resubmission");

      // Notify board and applicant
      var boardEmail = getConfigValue("EMAIL_BOARD") || "board@geabotswana.org";
      var _appName3      = application.primary_applicant_name || "";
      var _appFirstName3 = _appName3.split(" ")[0] || "Applicant";
      sendEmailFromTemplate("ADM_RSO_DOCUMENT_ISSUE_TO_BOARD", boardEmail, {
        FIRST_NAME:           "Board",
        APPLICANT_NAME:       _appName3,
        APPLICATION_ID:       applicationId,
        ISSUE_DESCRIPTION:    privateNotes || "RSO identified issues with the submitted documents.",
        DEADLINE_TO_RESOLVE:  formatDate(addDays(new Date(), 7))
      });

      sendEmailFromTemplate("DOC_DOCUMENT_REJECTED_TO_MEMBER", application.primary_applicant_email, {
        FIRST_NAME:        _appFirstName3,
        DOCUMENT_TYPE:     "Document",
        REJECTION_REASON:  publicReason || "Your submitted documents did not meet our security requirements.",
        RESUBMIT_DEADLINE: formatDate(addDays(new Date(), 7)),
        PORTAL_URL:        getConfigValue("PORTAL_URL") || ""
      });
    }

    return { success: true, message: "Decision recorded." };

  } catch (e) {
    return { success: false, message: "Error recording RSO decision: " + e.toString() };
  }
}


/**
 * FUNCTION: boardFinalDecision
 * PURPOSE: Board makes final decision after RSO approval.
 *
 * @param {string} applicationId Application ID
 * @param {string} decision "approved" or "denied"
 * @param {string} boardEmail Email of board member
 * @param {string} notes Optional notes
 * @param {string} reason Optional denial reason
 * @returns {Object} { success, message }
 */
function boardFinalDecision(applicationId, decision, boardEmail, notes, reason) {
  try {
    var application = _getApplicationById(applicationId);
    if (!application) {
      return { success: false, message: "Application not found." };
    }

    // Verify application is in a state that allows final approval
    var currentStatus = String(application.status || "");
    var isValidState = (currentStatus === APP_STATUS_BOARD_FINAL_REVIEW);
    if (!isValidState) {
      return { success: false, message: "Application must be in board_final_review status. RSO must call rsoDecision first. Current status: " + currentStatus };
    }

    var appSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
    var appRow = _findApplicationRow(applicationId);
    if (appRow === -1) {
      return { success: false, message: "Application row not found in sheet." };
    }

    if (decision === "approved") {
      // Board final approval — applicant can now submit payment
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_final_status")).setValue("approved");
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_final_reviewed_by")).setValue(boardEmail);
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_final_review_date")).setValue(new Date());
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "status")).setValue(APP_STATUS_APPROVED_PENDING_PAYMENT);

      logAuditEntry(boardEmail, AUDIT_APPLICATION_BOARD_FINAL, "Application", applicationId, "Final approval granted - awaiting payment");

      // Generate payment reference and dues amount
      var _appName4      = application.primary_applicant_name || "";
      var _appFirstName4 = _appName4.split(" ")[0] || "Applicant";
      var _appLastName4  = _appName4.split(" ").slice(-1)[0] || "";
      var paymentRef = _generatePaymentReference(_appLastName4);
      var duesAmount = _calculateDuesAmount(applicationId);

      // Notify applicant with payment instructions
      sendEmailFromTemplate("MEM_APPLICATION_APPROVED_TO_APPLICANT", application.primary_applicant_email, {
        FIRST_NAME:       _appFirstName4,
        APPLICATION_ID:   applicationId,
        PAYMENT_AMOUNT:   duesAmount,
        PAYMENT_DEADLINE: formatDate(addDays(new Date(), 30)),
        PORTAL_URL:       getConfigValue("PORTAL_URL") || ""
      });

      // Notify treasurer
      var treasurerEmail = getConfigValue("TREASURER_EMAIL") || "treasurer@geabotswana.org";
      sendEmailFromTemplate("PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD", treasurerEmail, {
        FIRST_NAME:      "Treasurer",
        MEMBER_NAME:     _appName4,
        PAYMENT_ID:      paymentRef,
        AMOUNT:          duesAmount,
        CURRENCY:        "BWP",
        STATUS:          "Approved — payment expected",
        SUBMISSION_DATE: formatDate(new Date())
      });

    } else if (decision === "denied") {
      // Board final denial
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_final_status")).setValue("denied");
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_final_reviewed_by")).setValue(boardEmail);
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_final_review_date")).setValue(new Date());
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_final_denial_reason")).setValue(reason || "");
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "status")).setValue(APP_STATUS_DENIED);

      // Update household
      var householdSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_HOUSEHOLDS);
      var hhRow = _findHouseholdRow(application.household_id);
      householdSheet.getRange(hhRow, _getColumnIndex(TAB_HOUSEHOLDS, "application_status")).setValue("Denied");

      logAuditEntry(boardEmail, AUDIT_APPLICATION_DENIED, "Application", applicationId, "Final denial. Reason: " + (reason || ""));

      // Notify applicant
      var _appName5      = application.primary_applicant_name || "";
      var _appFirstName5 = _appName5.split(" ")[0] || "Applicant";
      sendEmailFromTemplate("MEM_APPLICATION_DENIED_TO_APPLICANT", application.primary_applicant_email, {
        FIRST_NAME:    _appFirstName5,
        APPLICATION_ID: applicationId,
        DENIAL_REASON: reason || "Your application was not approved for final membership.",
        CONTACT_EMAIL: "board@geabotswana.org"
      });
    }

    return { success: true, message: "Final decision recorded." };

  } catch (e) {
    return { success: false, message: "Error recording final decision: " + e.toString() };
  }
}


/**
 * FUNCTION: submitPaymentProof
 * PURPOSE: Applicant submits payment proof (receipt/confirmation) for treasurer verification.
 *
 * @param {string} applicationId Application ID
 * @param {string} email Applicant's email
 * @param {string} paymentMethod Method used (Bank Transfer, PayPal, SDFCU, Zelle, Cash)
 * @param {string} proofFileId Google Drive file ID of proof image
 * @param {string} notes Optional notes about payment
 * @returns {Object} { success, message }
 */
function submitPaymentProof(applicationId, email, paymentMethod, proofFileId, notes) {
  try {
    var application = _getApplicationById(applicationId);
    if (!application) {
      return { success: false, message: "Application not found." };
    }

    if (application.primary_applicant_email !== email) {
      return { success: false, message: "Unauthorized." };
    }

    if (application.status !== APP_STATUS_APPROVED_PENDING_PAYMENT) {
      return { success: false, message: "Application is not in payment stage." };
    }

    // Create Payment record
    var paymentId = generateId("PAY");

    var duesAmount = _calculateDuesAmount(applicationId);
    var exchangeRate = getExchangeRate();
    var now = new Date();

    // Create payment using proper field mapping
    var paymentSheet = SpreadsheetApp.openById(PAYMENT_TRACKING_ID).getSheetByName(TAB_PAYMENTS);
    var headers = paymentSheet.getRange(1, 1, 1, paymentSheet.getLastColumn()).getValues()[0];

    // Log headers for diagnostics
    Logger.log("[DEBUG submitPaymentProof] Sheet headers: " + JSON.stringify(headers));

    var paymentData = {
      payment_id: paymentId,
      household_id: application.household_id,
      household_name: application.household_name || "",
      payment_date: now,
      payment_method: paymentMethod,
      currency: "BWP",
      amount: duesAmount,
      amount_usd: Math.round(duesAmount / exchangeRate * 100) / 100,
      amount_bwp: duesAmount,
      payment_type: "Dues Payment",
      applied_to_period: getConfigValue("CURRENT_MEMBERSHIP_YEAR") || "",
      payment_reference: "",
      payment_confirmation_file_id: proofFileId || "",
      payment_submitted_date: now,
      payment_verified_date: "",
      payment_verified_by: "",
      notes: String(notes || "").substring(0, 500)
    };

    Logger.log("[DEBUG submitPaymentProof] PaymentData keys: " + JSON.stringify(Object.keys(paymentData)));

    // Build row using header mapping and validate all headers are found
    var row = [];
    var missingKeys = [];
    for (var i = 0; i < headers.length; i++) {
      var headerName = headers[i];
      if (paymentData[headerName] !== undefined) {
        row.push(paymentData[headerName]);
      } else {
        row.push("");
        if (!headerName.match(/^journal_entry_id|^recorded_by/)) {
          missingKeys.push(headerName);
        }
      }
    }

    if (missingKeys.length > 0) {
      Logger.log("[WARN submitPaymentProof] Missing keys in paymentData: " + JSON.stringify(missingKeys));
    }

    Logger.log("[DEBUG submitPaymentProof] Row length: " + row.length + ", Headers length: " + headers.length);
    paymentSheet.appendRow(row);

    // Update application with payment info
    var appSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
    var appRow = _findApplicationRow(applicationId);
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "payment_status")).setValue("submitted");
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "payment_id")).setValue(paymentId);
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "status")).setValue(APP_STATUS_PAYMENT_SUBMITTED);

    logAuditEntry(email, AUDIT_APPLICATION_PAYMENT_SUBMITTED, "Application", applicationId,
                  "Payment submitted: " + paymentMethod);

    // Notify applicant and treasurer
    var _appName6      = application.primary_applicant_name || "";
    var _appFirstName6 = _appName6.split(" ")[0] || "Applicant";
    sendEmailFromTemplate("PAY_PAYMENT_PROOF_RECEIVED_TO_MEMBER", email, {
      FIRST_NAME:      _appFirstName6,
      PAYMENT_ID:      paymentId,
      AMOUNT:          paymentData.amount,
      SUBMISSION_DATE: formatDate(new Date()),
      PORTAL_URL:      getConfigValue("PORTAL_URL") || ""
    });

    var treasurerEmail = getConfigValue("TREASURER_EMAIL") || "treasurer@geabotswana.org";
    sendEmailFromTemplate("PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD", treasurerEmail, {
      FIRST_NAME:      "Treasurer",
      MEMBER_NAME:     _appName6,
      PAYMENT_ID:      paymentId,
      AMOUNT:          paymentData.amount,
      CURRENCY:        "BWP",
      STATUS:          "submitted",
      SUBMISSION_DATE: formatDate(new Date())
    });

    return { success: true, message: "Payment proof submitted for verification." };

  } catch (e) {
    return { success: false, message: "Error submitting payment proof: " + e.toString() };
  }
}


/**
 * FUNCTION: verifyAndActivateMembership
 * PURPOSE: Treasurer verifies payment and activates membership.
 *
 * STEPS:
 * 1. Mark payment as verified
 * 2. Activate household (active=TRUE, set membership dates)
 * 3. Activate all individuals in household
 * 4. Update application status to activated
 * 5. Send welcome emails
 * 6. Log audit entry
 *
 * @param {string} applicationId Application ID
 * @param {string} treasurerEmail Email of treasurer verifying
 * @returns {Object} { success, message }
 */
function verifyAndActivateMembership(applicationId, treasurerEmail) {
  try {
    var application = _getApplicationById(applicationId);
    if (!application) {
      return { success: false, message: "Application not found." };
    }

    if (application.status !== APP_STATUS_PAYMENT_SUBMITTED) {
      return { success: false, message: "Application is not in payment submitted stage." };
    }

    // Mark payment as verified
    var paymentSheet = SpreadsheetApp.openById(PAYMENT_TRACKING_ID).getSheetByName(TAB_PAYMENTS);
    var paymentRow = _findPaymentRow(application.payment_id);
    if (paymentRow > 0) {
      paymentSheet.getRange(paymentRow, _getColumnIndex(TAB_PAYMENTS, "payment_verified_date")).setValue(new Date());
      paymentSheet.getRange(paymentRow, _getColumnIndex(TAB_PAYMENTS, "payment_verified_by")).setValue(treasurerEmail);
    }

    // Calculate membership expiration (next July 31)
    var expirationDate = _calculateMembershipExpiration();

    // Activate household
    var householdSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_HOUSEHOLDS);
    var hhRow = _findHouseholdRow(application.household_id);
    householdSheet.getRange(hhRow, _getColumnIndex(TAB_HOUSEHOLDS, "active")).setValue(true);
    householdSheet.getRange(hhRow, _getColumnIndex(TAB_HOUSEHOLDS, "membership_start_date")).setValue(new Date());
    householdSheet.getRange(hhRow, _getColumnIndex(TAB_HOUSEHOLDS, "membership_expiration_date")).setValue(expirationDate);
    householdSheet.getRange(hhRow, _getColumnIndex(TAB_HOUSEHOLDS, "approved_by")).setValue(treasurerEmail);
    householdSheet.getRange(hhRow, _getColumnIndex(TAB_HOUSEHOLDS, "approved_date")).setValue(new Date());
    householdSheet.getRange(hhRow, _getColumnIndex(TAB_HOUSEHOLDS, "application_status")).setValue("Approved");

    // Activate all individuals in household
    var individuals = _getIndividualsByHouseholdId(application.household_id);
    var individualSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_INDIVIDUALS);

    for (var i = 0; i < individuals.length; i++) {
      var indRow = _findIndividualRow(individuals[i].individual_id);
      if (indRow > 0) {
        individualSheet.getRange(indRow, _getColumnIndex(TAB_INDIVIDUALS, "active")).setValue(true);
      }
    }

    // Update application
    var appSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
    var appRow = _findApplicationRow(applicationId);
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "status")).setValue(APP_STATUS_ACTIVATED);
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "payment_status")).setValue("verified");
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "approved_date")).setValue(new Date());

    logAuditEntry(treasurerEmail, AUDIT_APPLICATION_ACTIVATED, "Application", applicationId,
                  "Membership activated by Treasurer");

    // Send welcome emails
    var boardEmail     = getConfigValue("EMAIL_BOARD") || "board@geabotswana.org";
    var _appName7      = application.primary_applicant_name || "";
    var _appFirstName7 = _appName7.split(" ")[0] || "Applicant";

    // Send membership activation email with handbook attachment (if handbook file ID is configured)
    var handbookFileId = getConfigValue("MEMBERSHIP_HANDBOOK_FILE_ID");
    if (handbookFileId) {
      // Send email with handbook attachment
      sendEmailFromTemplateWithAttachment("MEM_MEMBERSHIP_ACTIVATED_TO_MEMBER", application.primary_applicant_email, {
        APPLICANT_NAME: _appFirstName7
      }, handbookFileId);
    } else {
      // Fallback: send email without attachment if handbook not configured
      sendEmailFromTemplate("MEM_MEMBERSHIP_ACTIVATED_TO_MEMBER", application.primary_applicant_email, {
        APPLICANT_NAME: _appFirstName7
      });
    }

    sendEmailFromTemplate("ADM_BOARD_FINAL_APPROVAL_TO_BOARD", boardEmail, {
      FIRST_NAME:       "Board",
      APPLICANT_NAME:   _appName7,
      APPLICATION_ID:   applicationId,
      MEMBERSHIP_TYPE:  application.membership_category + " – " + (application.household_type || ""),
      APPROVAL_DATE:    formatDate(new Date()),
      ACTIVATION_DATE:  formatDate(new Date())
    });

    return { success: true, message: "Membership activated successfully." };

  } catch (e) {
    return { success: false, message: "Error activating membership: " + e.toString() };
  }
}


/**
 * FUNCTION: withdrawApplication
 * PURPOSE: Applicant withdraws their membership application.
 *
 * STEPS:
 * 1. Validate application exists and is in withdrawable state (not activated/denied)
 * 2. Update application status to withdrawn
 * 3. Send confirmation email to applicant
 * 4. Send notification email to board
 * 5. Log audit entry
 *
 * @param {string} applicationId Application ID
 * @param {string} applicantEmail Email of applicant withdrawing
 * @param {string} withdrawalReason Optional reason for withdrawal
 * @returns {Object} { success, message }
 */
function withdrawApplication(applicationId, applicantEmail, withdrawalReason) {
  try {
    var application = _getApplicationById(applicationId);
    if (!application) {
      return { success: false, message: "Application not found." };
    }

    // Check if application is in a terminal state (already decided)
    if (application.status === APP_STATUS_ACTIVATED ||
        application.status === APP_STATUS_DENIED ||
        application.status === APP_STATUS_WITHDRAWN) {
      return { success: false, message: "This application cannot be withdrawn (already " + application.status + ")." };
    }

    // Update application status to withdrawn
    var appSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
    var appRow = _findApplicationRow(applicationId);
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "status")).setValue(APP_STATUS_WITHDRAWN);
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "withdrawal_date")).setValue(new Date());
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "withdrawal_reason")).setValue(withdrawalReason || "");

    logAuditEntry(applicantEmail, AUDIT_APPLICATION_WITHDRAWN, "Application", applicationId,
                  "Application withdrawn by applicant" + (withdrawalReason ? ": " + withdrawalReason : ""));

    // Send confirmation to applicant
    var _appName = application.primary_applicant_name || "";
    var _appFirstName = _appName.split(" ")[0] || "Applicant";

    sendEmailFromTemplate("MEM_APPLICATION_WITHDRAWN_TO_MEMBER", application.primary_applicant_email, {
      APPLICANT_NAME: _appFirstName,
      APPLICATION_ID: applicationId,
      WITHDRAWAL_DATE: formatDate(new Date()),
      WITHDRAWAL_REASON: withdrawalReason || "No reason provided"
    });

    // Send notification to board
    var boardEmail = getConfigValue("EMAIL_BOARD") || "board@geabotswana.org";
    sendEmailFromTemplate("ADM_APPLICATION_WITHDRAWN_TO_BOARD", boardEmail, {
      APPLICANT_NAME: _appName,
      APPLICATION_ID: applicationId,
      WITHDRAWAL_DATE: formatDate(new Date()),
      WITHDRAWAL_REASON: withdrawalReason || "No reason provided"
    });

    return { success: true, message: "Application withdrawn successfully." };

  } catch (e) {
    return { success: false, message: "Error withdrawing application: " + e.toString() };
  }
}


// ============================================================
// HELPER FUNCTIONS
// ============================================================

function _getApplicationById(applicationId) {
  try {
    var appSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
    var data = appSheet.getDataRange().getValues();
    var headers = data[0];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var appId = row[_getHeaderIndex(headers, "application_id")];
      if (appId === applicationId) {
        return _rowToObject(row, headers);
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

function _getApplicationByHouseholdId(householdId) {
  try {
    var appSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
    var data = appSheet.getDataRange().getValues();
    var headers = data[0];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var hhId = row[_getHeaderIndex(headers, "household_id")];
      if (hhId === householdId) {
        return _rowToObject(row, headers);
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

function _findApplicationRow(applicationId) {
  try {
    var appSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
    var data = appSheet.getDataRange().getValues();
    var headers = data[0];
    var appIdIndex = _getHeaderIndex(headers, "application_id");

    for (var i = 1; i < data.length; i++) {
      if (data[i][appIdIndex] === applicationId) {
        return i + 1;  // 1-indexed for getRange()
      }
    }
    return -1;
  } catch (e) {
    return -1;
  }
}

function _findHouseholdRow(householdId) {
  try {
    var hhSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_HOUSEHOLDS);
    var data = hhSheet.getDataRange().getValues();
    var headers = data[0];
    var hhIdIndex = _getHeaderIndex(headers, "household_id");

    for (var i = 1; i < data.length; i++) {
      if (data[i][hhIdIndex] === householdId) {
        return i + 1;
      }
    }
    return -1;
  } catch (e) {
    return -1;
  }
}

function _findIndividualRow(individualId) {
  try {
    var indSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_INDIVIDUALS);
    var data = indSheet.getDataRange().getValues();
    var headers = data[0];
    var indIdIndex = _getHeaderIndex(headers, "individual_id");

    for (var i = 1; i < data.length; i++) {
      if (data[i][indIdIndex] === individualId) {
        return i + 1;
      }
    }
    return -1;
  } catch (e) {
    return -1;
  }
}

function _findPaymentRow(paymentId) {
  try {
    var paySheet = SpreadsheetApp.openById(PAYMENT_TRACKING_ID).getSheetByName(TAB_PAYMENTS);
    var data = paySheet.getDataRange().getValues();
    var headers = data[0];
    var payIdIndex = _getHeaderIndex(headers, "payment_id");

    for (var i = 1; i < data.length; i++) {
      if (data[i][payIdIndex] === paymentId) {
        return i + 1;
      }
    }
    return -1;
  } catch (e) {
    return -1;
  }
}

function _getIndividualsByHouseholdId(householdId) {
  try {
    var indSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_INDIVIDUALS);
    var data = indSheet.getDataRange().getValues();
    var headers = data[0];
    var hhIdIndex = _getHeaderIndex(headers, "household_id");
    var individuals = [];

    for (var i = 1; i < data.length; i++) {
      if (data[i][hhIdIndex] === householdId) {
        individuals.push(_rowToObject(data[i], headers));
      }
    }
    return individuals;
  } catch (e) {
    return [];
  }
}

function _getFileSubmissionsForIndividual(individualId) {
  try {
    var submissionSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_FILE_SUBMISSIONS);
    var data = submissionSheet.getDataRange().getValues();
    var headers = data[0];
    var indIdIndex = _getHeaderIndex(headers, "individual_id");
    var submissions = [];

    for (var i = 1; i < data.length; i++) {
      if (data[i][indIdIndex] === individualId) {
        submissions.push(_rowToObject(data[i], headers));
      }
    }
    return submissions;
  } catch (e) {
    return [];
  }
}

function _generatePaymentReference(lastName) {
  var year = new Date().getFullYear();
  var nextYear = year + 1;
  var yearStr = year.toString().slice(-2) + "-" + nextYear.toString().slice(-2);
  return (lastName || "MEMBER").toUpperCase() + "_" + yearStr;
}

function _getMembershipLevelId(category, householdType) {
  // Look up membership level ID from Membership Levels sheet based on category and household type
  // Format: category_householdtype (e.g., "full_indiv", "full_family", "community_indiv")
  try {
    var levelType = (householdType === 'Family' ? 'family' : 'indiv').toLowerCase();
    var levelId = (category || 'Community').toLowerCase() + '_' + levelType;
    return levelId;
  } catch (e) {
    return 'community_indiv'; // Default fallback
  }
}

/**
 * HELPER: Returns the current GEA membership quarter name and percentage.
 * GEA membership year: Aug 1 – Jul 31.
 * Q1 Aug–Oct 100%, Q2 Nov–Jan 75%, Q3 Feb–Apr 50%, Q4 May–Jul 25%.
 * @returns {{ name: string, percentage: number }}
 */
function _getCurrentQuarterInfo_() {
  var month = new Date().getMonth(); // 0=Jan … 11=Dec
  if (month >= 7 && month <= 9)                    return { name: "Q1 (Aug–Oct)", percentage: 100 };
  if (month === 10 || month === 11 || month === 0) return { name: "Q2 (Nov–Jan)", percentage: 75 };
  if (month >= 1 && month <= 3)                    return { name: "Q3 (Feb–Apr)", percentage: 50 };
  return { name: "Q4 (May–Jul)", percentage: 25 };
}

/**
 * HELPER: Calculate pro-rated dues amount for an application
 * Looks up membership level by application ID, retrieves annual dues from Membership Pricing sheet,
 * and applies pro-ration based on current quarter.
 *
 * @param {string} applicationId - Application ID (e.g., "APP-2026-00001")
 * @returns {number} Pro-rated dues in USD, or 0 if not found
 */
function _calculateDuesAmount(applicationId) {
  try {
    var app = _getApplicationById(applicationId);
    if (!app || !app.household_id) {
      Logger.log("WARNING: Could not find application: " + applicationId);
      return 0;
    }

    var household = getHouseholdById(app.household_id);
    if (!household || !household.membership_level_id) {
      Logger.log("WARNING: Could not find household for application: " + applicationId);
      return 0;
    }

    var level = getMembershipLevel(household.membership_level_id);
    if (!level || !level.annual_dues_usd) {
      Logger.log("WARNING: Could not find membership level or annual_dues_usd for level: " + household.membership_level_id);
      return 0;
    }

    var annualDuesUsd = Number(level.annual_dues_usd) || 0;
    if (annualDuesUsd === 0) {
      Logger.log("WARNING: Annual dues is 0 for membership level: " + household.membership_level_id);
      return 0;
    }

    // Use existing pro-ration function from PaymentService
    var proratedAmount = calculateProratedDues(annualDuesUsd);
    return proratedAmount;
  } catch (e) {
    Logger.log("ERROR calculating dues for application " + applicationId + ": " + e);
    return 0;
  }
}

function _calculateMembershipExpiration() {
  var today = new Date();
  var expiryMonth = MEMBERSHIP_EXPIRY_MONTH - 1;  // JavaScript months are 0-indexed
  var expiryDay = MEMBERSHIP_EXPIRY_DAY;

  var nextExpiry = new Date(today.getFullYear(), expiryMonth, expiryDay);

  // If today is after July 31, expiration is next year
  if (today > nextExpiry) {
    nextExpiry = new Date(today.getFullYear() + 1, expiryMonth, expiryDay);
  }

  return nextExpiry;
}

function _generateTemporaryPassword() {
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  var password = "";
  for (var i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function _getHeaderIndex(headers, columnName) {
  for (var i = 0; i < headers.length; i++) {
    if (headers[i] === columnName) {
      return i;
    }
  }
  return -1;
}

function _getColumnIndex(tabName, columnName) {
  // Gets the column index (1-indexed) for a column name in a given tab
  var sheet;
  if (tabName.includes("Membership Applications") || tabName === TAB_MEMBERSHIP_APPLICATIONS) {
    sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
  } else if (tabName === TAB_HOUSEHOLDS) {
    sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_HOUSEHOLDS);
  } else if (tabName === TAB_INDIVIDUALS) {
    sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_INDIVIDUALS);
  } else if (tabName === TAB_PAYMENTS) {
    sheet = SpreadsheetApp.openById(PAYMENT_TRACKING_ID).getSheetByName(TAB_PAYMENTS);
  }

  if (!sheet) return -1;

  var firstRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (var i = 0; i < firstRow.length; i++) {
    if (firstRow[i] === columnName) {
      return i + 1;  // Convert to 1-indexed
    }
  }
  return -1;
}

// Caches sheet header rows within a single execution so _objectToRow does not
// re-read headers from the API on every call (submit_application calls it 3–8+
// times, many on the same Individuals sheet).
var _objectToRowHeaderCache = {};

function _objectToRow(obj, tabName) {
  // Convert object to array row, maintaining column order from sheet
  var sheet;
  if (tabName === TAB_MEMBERSHIP_APPLICATIONS) {
    sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
  } else if (tabName === TAB_HOUSEHOLDS) {
    sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_HOUSEHOLDS);
  } else if (tabName === TAB_INDIVIDUALS) {
    sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_INDIVIDUALS);
  } else if (tabName === TAB_PAYMENTS) {
    sheet = SpreadsheetApp.openById(PAYMENT_TRACKING_ID).getSheetByName(TAB_PAYMENTS);
  }

  if (!sheet) return [];

  if (!_objectToRowHeaderCache[tabName]) {
    _objectToRowHeaderCache[tabName] = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  var headers = _objectToRowHeaderCache[tabName];
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    row.push(obj[headers[i]] || "");
  }
  return row;
}

function _rowToObject(row, headers) {
  var obj = {};
  for (var i = 0; i < headers.length && i < row.length; i++) {
    obj[headers[i]] = row[i];
  }
  return obj;
}
