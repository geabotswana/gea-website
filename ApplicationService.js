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
 * awaiting_docs → docs_confirmed → board_initial_review →
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
    Logger.log("[DEBUG] createApplicationRecord called with formData:", JSON.stringify(formData));
    Logger.log("[DEBUG] createdBy:", createdBy);

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
    var existingMember = getMemberByEmail(formData.email);
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
    var primaryApplicantName = capitalizeName(formData.first_name) + " " + capitalizeName(formData.last_name);

    // Format dates as YYYY-MM-DD
    var today = new Date();
    var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    var householdData = {
      household_id: householdId,
      primary_member_id: individualId,
      household_name: capitalizeName(formData.last_name) + " Household",
      membership_type: formData.membership_category,
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
        relationship_to_primary: "Household Staff",
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
      logAuditEntry(createdBy, AUDIT_APPLICATION_CREATED, "Household Staff", staffIndividualId,
                    "Household staff member added: " + formData.staff_first_name + " " + formData.staff_last_name);
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
        logAuditEntry(createdBy, AUDIT_APPLICATION_CREATED, "Family Member", familyIndividualId,
                      "Family member added: " + familyMember.first_name + " " + familyMember.last_name +
                      " (" + familyMember.relationship_to_primary + ")");
      });
    }

    // Create application record using the three-part phone system
    var applicationData = {
      application_id: applicationId,
      household_id: householdId,
      primary_individual_id: individualId,
      primary_applicant_name: primaryApplicantName,
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
    var boardEmail = getConfigValue("BOARD_EMAIL") || "board@geabotswana.org";
    Logger.log("[DEBUG] Sending emails - boardEmail: " + boardEmail);

    // Email to applicant with credentials
    Logger.log("[DEBUG] Sending tpl_040 to " + formData.email);
    sendEmail("tpl_040", formData.email, {
      "FIRST_NAME": formData.first_name,
      "APPLICATION_ID": applicationId
    });

    Logger.log("[DEBUG] Sending tpl_041 to " + formData.email);
    sendEmail("tpl_041", formData.email, {
      "FIRST_NAME": formData.first_name,
      "EMAIL": formData.email,
      "TEMP_PASSWORD": tempPassword,
      "TEMP_PASSWORD_DISPLAY": "<strong style=\"font-family: monospace; background: #f0f0f0; padding: 4px 8px; border-radius: 3px;\">" + tempPassword + "</strong>",
      "LOGIN_URL": "https://geabotswana.org/member.html"
    });

    // Email to board
    Logger.log("[DEBUG] Sending tpl_042 to " + boardEmail);
    var boardEmailVars = {
      "APPLICANT_NAME": formData.first_name + " " + formData.last_name,
      "MEMBERSHIP_CATEGORY": formData.membership_category,
      "HOUSEHOLD_TYPE": householdType,
      "APPLICATION_ID": applicationId,
      "SUBMITTED_DATE": formatDate(new Date(), true)
    };
    Logger.log("[DEBUG] Board email variables:", JSON.stringify(boardEmailVars));
    sendEmail("tpl_042", boardEmail, boardEmailVars);

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
    var member = getMemberByEmail(email);
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
      approved_date: application.approved_date
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
    if (application.email !== email) {
      return { success: false, message: "Unauthorized." };
    }

    // Update application
    var appSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
    var appRow = _findApplicationRow(applicationId);
    if (appRow > 0) {
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "documents_confirmed_date")).setValue(new Date());
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "status")).setValue(APP_STATUS_DOCS_CONFIRMED);
    }

    logAuditEntry(email, AUDIT_APPLICATION_DOCS_CONFIRMED, "Application", applicationId,
                  "Documents confirmed for review");

    // Notify board
    var boardEmail = getConfigValue("BOARD_EMAIL") || "board@geabotswana.org";
    sendEmail("tpl_043", boardEmail, {
      "APPLICANT_NAME": application.first_name + " " + application.last_name,
      "APPLICATION_ID": applicationId,
      "MEMBERSHIP_CATEGORY": application.membership_category
    });

    return { success: true, message: "Documents confirmed for review." };

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

      applications.push({
        application_id: app.application_id,
        applicant_name: app.first_name + " " + app.last_name,
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

    if (decision === "approved") {
      // Board approves — send to RSO
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_initial_status")).setValue("approved");
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_initial_reviewed_by")).setValue(boardEmail);
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_initial_review_date")).setValue(new Date());
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_initial_notes")).setValue(notes || "");
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "status")).setValue(APP_STATUS_RSO_REVIEW);

      logAuditEntry(boardEmail, AUDIT_APPLICATION_BOARD_INITIAL, "Application", applicationId, "Approved for RSO review");

      // Notify RSO and applicant
      var rsoEmail = getConfigValue("RSO_EMAIL") || "rso@geabotswana.org";
      sendEmail("tpl_044", rsoEmail, {
        "APPLICANT_NAME": application.first_name + " " + application.last_name,
        "APPLICATION_ID": applicationId,
        "EMAIL": application.email
      });

      sendEmail("tpl_044", application.email, {
        "APPLICANT_NAME": application.first_name,
        "APPLICATION_ID": applicationId,
        "STATUS": "Your documents have been forwarded to our security team for review."
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
      sendEmail("tpl_045", application.email, {
        "APPLICANT_NAME": application.first_name,
        "REASON": reason || "Your application does not meet membership requirements at this time.",
        "CONTACT": "board@geabotswana.org"
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

    if (decision === "approved") {
      // RSO approves — ready for board final review
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_status")).setValue("approved");
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_reviewed_by")).setValue(rsoEmail);
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_review_date")).setValue(new Date());
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "status")).setValue(APP_STATUS_BOARD_FINAL_REVIEW);

      logAuditEntry(rsoEmail, AUDIT_APPLICATION_RSO_REVIEWED, "Application", applicationId, "RSO approved documents");

      // Notify board
      var boardEmail = getConfigValue("BOARD_EMAIL") || "board@geabotswana.org";
      sendEmail("tpl_047", boardEmail, {
        "APPLICANT_NAME": application.first_name + " " + application.last_name,
        "APPLICATION_ID": applicationId
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
      var boardEmail = getConfigValue("BOARD_EMAIL") || "board@geabotswana.org";
      sendEmail("tpl_046", boardEmail, {
        "APPLICANT_NAME": application.first_name + " " + application.last_name,
        "APPLICATION_ID": applicationId,
        "RSO_NOTES": privateNotes || ""
      });

      sendEmail("tpl_046", application.email, {
        "APPLICANT_NAME": application.first_name,
        "REASON": publicReason || "Your submitted documents did not meet our security requirements.",
        "NEXT_STEP": "Please resubmit corrected documents through the member portal."
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

    var appSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
    var appRow = _findApplicationRow(applicationId);

    if (decision === "approved") {
      // Board final approval — applicant can now submit payment
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_final_status")).setValue("approved");
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_final_reviewed_by")).setValue(boardEmail);
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_final_review_date")).setValue(new Date());
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "status")).setValue(APP_STATUS_APPROVED_PENDING_PAYMENT);

      logAuditEntry(boardEmail, AUDIT_APPLICATION_BOARD_FINAL, "Application", applicationId, "Final approval granted - awaiting payment");

      // Generate payment reference and dues amount
      var paymentRef = _generatePaymentReference(application.last_name);
      var duesAmount = _calculateDuesAmount(application.membership_category, application.household_type);

      // Notify applicant with payment instructions
      sendEmail("tpl_048", application.email, {
        "APPLICANT_NAME": application.first_name,
        "PAYMENT_REFERENCE": paymentRef,
        "DUES_AMOUNT": duesAmount,
        "BANK_ACCOUNT": getConfigValue("BANK_ACCOUNT_INFO") || "",
        "PAYPAL": getConfigValue("PAYPAL_EMAIL") || "",
        "SDFCU": getConfigValue("SDFCU_INFO") || "",
        "ZELLE": getConfigValue("ZELLE_INFO") || ""
      });

      // Notify treasurer
      var treasurerEmail = getConfigValue("TREASURER_EMAIL") || "treasurer@geabotswana.org";
      sendEmail("tpl_050", treasurerEmail, {
        "APPLICANT_NAME": application.first_name + " " + application.last_name,
        "APPLICATION_ID": applicationId,
        "PAYMENT_REFERENCE": paymentRef,
        "DUES_AMOUNT": duesAmount
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
      sendEmail("tpl_049", application.email, {
        "APPLICANT_NAME": application.first_name,
        "REASON": reason || "Your application was not approved for final membership.",
        "CONTACT": "board@geabotswana.org"
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

    if (application.email !== email) {
      return { success: false, message: "Unauthorized." };
    }

    if (application.status !== APP_STATUS_APPROVED_PENDING_PAYMENT) {
      return { success: false, message: "Application is not in payment stage." };
    }

    // Create Payment record
    var paymentId = generateId("PAY");
    var paymentSheet = SpreadsheetApp.openById(PAYMENT_TRACKING_ID).getSheetByName(TAB_PAYMENTS);

    var paymentData = {
      payment_id: paymentId,
      household_id: application.household_id,
      payment_method: paymentMethod,
      amount_paid: _calculateDuesAmount(application.membership_category, application.household_type),
      payment_date: new Date(),
      submission_timestamp: new Date(),
      proof_file_id: proofFileId,
      notes: notes || "",
      status: "submitted",
      verified_by: "",
      verification_timestamp: "",
      created_date: new Date()
    };

    paymentSheet.appendRow(_objectToRow(paymentData, TAB_PAYMENTS));

    // Update application with payment info
    var appSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
    var appRow = _findApplicationRow(applicationId);
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "payment_status")).setValue("submitted");
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "payment_id")).setValue(paymentId);
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "status")).setValue(APP_STATUS_PAYMENT_SUBMITTED);

    logAuditEntry(email, AUDIT_APPLICATION_PAYMENT_SUBMITTED, "Application", applicationId,
                  "Payment submitted: " + paymentMethod);

    // Notify applicant and treasurer
    sendEmail("tpl_050", email, {
      "APPLICANT_NAME": application.first_name,
      "PAYMENT_METHOD": paymentMethod,
      "PAYMENT_DATE": formatDate(new Date(), "GMT+2", "yyyy-MM-dd"),
      "NEXT_STEP": "Your payment will be verified by our Treasurer within 2 business days."
    });

    var treasurerEmail = getConfigValue("TREASURER_EMAIL") || "treasurer@geabotswana.org";
    sendEmail("tpl_050", treasurerEmail, {
      "APPLICANT_NAME": application.first_name + " " + application.last_name,
      "APPLICATION_ID": applicationId,
      "PAYMENT_METHOD": paymentMethod,
      "AMOUNT": paymentData.amount_paid,
      "PROOF_FILE_ID": proofFileId
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
      paymentSheet.getRange(paymentRow, _getColumnIndex(TAB_PAYMENTS, "status")).setValue("verified");
      paymentSheet.getRange(paymentRow, _getColumnIndex(TAB_PAYMENTS, "verified_by")).setValue(treasurerEmail);
      paymentSheet.getRange(paymentRow, _getColumnIndex(TAB_PAYMENTS, "verification_timestamp")).setValue(new Date());
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
    var boardEmail = getConfigValue("BOARD_EMAIL") || "board@geabotswana.org";

    sendEmail("tpl_051", application.email, {
      "APPLICANT_NAME": application.first_name,
      "MEMBERSHIP_CATEGORY": application.membership_category,
      "EXPIRATION_DATE": formatDate(expirationDate, "GMT+2", "MMMM dd, yyyy"),
      "PORTAL_URL": "https://geabotswana.org/member.html"
    });

    sendEmail("tpl_052", boardEmail, {
      "APPLICANT_NAME": application.first_name + " " + application.last_name,
      "MEMBERSHIP_CATEGORY": application.membership_category,
      "HOUSEHOLD_TYPE": application.household_type
    });

    return { success: true, message: "Membership activated successfully." };

  } catch (e) {
    return { success: false, message: "Error activating membership: " + e.toString() };
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

function _calculateDuesAmount(category, householdType) {
  // This would look up in Membership Levels sheet
  // For now, returning a default value
  // Actual implementation would query the sheet
  return 200;  // Placeholder
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

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
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
