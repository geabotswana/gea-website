/**
 * ============================================================
 * PAYMENTSERVICE.GS
 * ============================================================
 * Payment verification, treasurer review, and membership
 * activation workflow for dues collection.
 *
 * Handles member payment submissions, treasurer verification,
 * pro-ration calculations, and payment status tracking.
 * ============================================================
 */

/**
 * FUNCTION: submitPaymentVerification
 * PURPOSE: Member submits payment verification claim with proof
 * @param {Object} params - Payment submission parameters
 * @returns {Object} - Result with verification_id or error
 */
function submitPaymentVerification(params) {
  try {
    if (!params || !params.household_id || !params.membership_year || !params.payment_method) {
      return { ok: false, error: "Missing required fields", code: "INVALID_PARAM" };
    }

    // Validate currency and amount
    var currency = String(params.currency || "").toUpperCase();
    var amountPaid = Number(params.amount_paid || 0);
    if (currency !== "USD" && currency !== "BWP") {
      return { ok: false, error: "Invalid currency", code: "INVALID_CURRENCY" };
    }
    if (amountPaid <= 0) {
      return { ok: false, error: "Amount must be greater than 0", code: "INVALID_AMOUNT" };
    }

    // Validate transaction date
    var txDate = new Date(params.transaction_date);
    var now = new Date();
    var daysDiff = Math.floor((now - txDate) / (1000 * 60 * 60 * 24));
    if (daysDiff < 0) {
      return { ok: false, error: "Transaction date cannot be in future", code: "FUTURE_DATE" };
    }
    if (daysDiff > 60) {
      return { ok: false, error: "Transaction date too old (>60 days)", code: "DATE_TOO_OLD" };
    }

    // Get household info
    var household = getHouseholdById(params.household_id);
    if (!household) {
      return { ok: false, error: "Household not found", code: "NOT_FOUND" };
    }

    // Validate membership year is acceptable for payment
    var acceptableYears = _getAcceptablePaymentYears_(household.membership_level_id);
    if (acceptableYears.indexOf(params.membership_year) === -1) {
      return { ok: false, error: "Membership year not available for payment", code: "INVALID_YEAR" };
    }

    // Handle file upload if provided
    var fileId = null;
    var fileName = null;
    if (params.file_data_base64 && params.file_name) {
      try {
        var blob = Utilities.newBlob(
          Utilities.base64Decode(params.file_data_base64),
          params.file_content_type || "application/octet-stream",
          params.file_name
        );
        var folder = DriveApp.getFolderById(FOLDER_PAYMENT_CONFIRMATIONS);
        var file = folder.createFile(blob);
        fileId = file.getId();
        fileName = file.getName();
      } catch (e) {
        Logger.log("WARNING: Could not save payment proof file: " + e);
        // Continue without file
      }
    }

    // Create Payment Verifications record
    var verificationId = generateId("PV");
    var verificationsSheet = _getPaymentVerificationsSheet_();
    var payload = {
      verification_id: verificationId,
      household_id: params.household_id,
      household_name: household.household_name || "",
      member_email: params.member_email || "",
      membership_year: params.membership_year,
      payment_method: params.payment_method,
      currency: currency,
      amount_paid: amountPaid,
      transaction_date: txDate,
      file_id: fileId || "",
      file_name: fileName || "",
      notes: String(params.notes || "").substring(0, 500),
      status: "submitted",
      submitted_date: new Date(),
      submitted_by_email: params.member_email || ""
    };

    _appendRowByHeaders_(verificationsSheet, payload);

    // Send confirmation email to member (tpl_061)
    try {
      sendEmail("tpl_061", params.member_email, {
        VERIFICATION_ID: verificationId,
        HOUSEHOLD_NAME: household.household_name,
        MEMBERSHIP_YEAR: params.membership_year,
        PAYMENT_METHOD: params.payment_method,
        AMOUNT: amountPaid,
        CURRENCY: currency,
        TRANSACTION_DATE: formatDate(txDate, false),
        SUBMISSION_DATE: formatDate(new Date(), true)
      });
    } catch (e) {
      Logger.log("WARNING: Could not send member confirmation email: " + e);
    }

    // Send action email to treasurer (tpl_062)
    try {
      var member = getMemberByEmail(params.member_email);
      var memberName = member ? (member.first_name + " " + member.last_name) : params.member_email;
      sendEmail("tpl_062", TREASURER_EMAIL, {
        VERIFICATION_ID: verificationId,
        HOUSEHOLD_NAME: household.household_name,
        HOUSEHOLD_ID: params.household_id,
        FIRST_NAME: member ? member.first_name : "",
        LAST_NAME: member ? member.last_name : "",
        MEMBER_EMAIL: params.member_email,
        MEMBERSHIP_YEAR: params.membership_year,
        PAYMENT_METHOD: params.payment_method,
        AMOUNT: amountPaid,
        CURRENCY: currency,
        TRANSACTION_DATE: formatDate(txDate, false),
        SUBMISSION_DATE: formatDate(new Date(), true),
        FILE_NAME: fileName || "",
        NOTES: params.notes || "",
        ADMIN_PORTAL_LINK: ScriptApp.getService().getUrl()
      });
    } catch (e) {
      Logger.log("WARNING: Could not send treasurer notification email: " + e);
    }

    // Audit log
    logAuditEntry(params.member_email || "member", AUDIT_PAYMENT_SUBMITTED, "PaymentVerification", verificationId,
      "Payment verification submitted: " + params.payment_method + " - " + amountPaid + " " + currency);

    return { ok: true, verification_id: verificationId, message: "Payment verification submitted successfully" };
  } catch (e) {
    Logger.log("ERROR submitPaymentVerification: " + e);
    return { ok: false, error: String(e), code: "SERVER_ERROR" };
  }
}

/**
 * FUNCTION: getPaymentVerificationStatus
 * PURPOSE: Get payment status for a household/member
 * @param {string} householdId - Household ID
 * @param {string} membershipYear - Membership year to check
 * @returns {Object} - Payment status and history
 */
function getPaymentVerificationStatus(householdId, membershipYear) {
  try {
    var verifications = _getPaymentVerificationsForHousehold_(householdId);
    var relevantVerifications = verifications.filter(function(v) {
      return v.membership_year === membershipYear;
    });

    // Sort by submitted date (newest first)
    relevantVerifications.sort(function(a, b) {
      return new Date(b.submitted_date) - new Date(a.submitted_date);
    });

    var currentStatus = relevantVerifications.length > 0 ? relevantVerifications[0].status : "none";

    return {
      ok: true,
      household_id: householdId,
      membership_year: membershipYear,
      status: currentStatus,
      current_verification: relevantVerifications.length > 0 ? relevantVerifications[0] : null,
      history: relevantVerifications
    };
  } catch (e) {
    Logger.log("ERROR getPaymentVerificationStatus: " + e);
    return { ok: false, error: String(e) };
  }
}

/**
 * FUNCTION: listPendingPaymentVerifications
 * PURPOSE: Treasurer views all pending payment verifications
 * @returns {Object} - List of pending verifications
 */
function listPendingPaymentVerifications() {
  try {
    var verifications = _getAllPaymentVerifications_();
    var pending = verifications.filter(function(v) {
      return v.status === "submitted";
    });

    // Sort by submission date (newest first)
    pending.sort(function(a, b) {
      return new Date(b.submitted_date) - new Date(a.submitted_date);
    });

    return { ok: true, count: pending.length, verifications: pending };
  } catch (e) {
    Logger.log("ERROR listPendingPaymentVerifications: " + e);
    return { ok: false, error: String(e) };
  }
}

/**
 * FUNCTION: approvePaymentVerification
 * PURPOSE: Treasurer verifies and approves payment
 * @param {string} verificationId - Verification ID to approve
 * @param {string} treasurerEmail - Treasurer's email
 * @param {boolean} paidInFull - Is account fully paid?
 * @param {string} treasurerNotes - Optional notes
 * @returns {Object} - Result
 */
function approvePaymentVerification(verificationId, treasurerEmail, paidInFull, treasurerNotes) {
  try {
    var found = _findPaymentVerificationById_(verificationId);
    if (!found) {
      return { ok: false, error: "Verification not found", code: "NOT_FOUND" };
    }

    // Update verification record
    _setPaymentVerificationFields_(found, {
      status: "verified",
      verified_by_email: treasurerEmail,
      verified_date: new Date(),
      paid_in_full: paidInFull === true,
      balance_remaining: paidInFull === true ? 0 : null,
      treasurer_notes: treasurerNotes || ""
    });

    // Send verification email to member (tpl_063)
    try {
      var household = getHouseholdById(found.obj.household_id);
      sendEmail("tpl_063", found.obj.member_email, {
        VERIFICATION_ID: verificationId,
        HOUSEHOLD_NAME: household ? household.household_name : found.obj.household_name,
        MEMBERSHIP_YEAR: found.obj.membership_year,
        AMOUNT_PAID: found.obj.amount_paid,
        CURRENCY: found.obj.currency,
        VERIFICATION_DATE: formatDate(new Date(), true)
      });
    } catch (e) {
      Logger.log("WARNING: Could not send member verification email: " + e);
    }

    // Audit log
    logAuditEntry(treasurerEmail, AUDIT_PAYMENT_VERIFIED, "PaymentVerification", verificationId,
      "Payment approved - " + found.obj.amount_paid + " " + found.obj.currency);

    return { ok: true, verification_id: verificationId, status: "verified" };
  } catch (e) {
    Logger.log("ERROR approvePaymentVerification: " + e);
    return { ok: false, error: String(e), code: "SERVER_ERROR" };
  }
}

/**
 * FUNCTION: rejectPaymentVerification
 * PURPOSE: Treasurer rejects payment with reason
 * @param {string} verificationId - Verification ID to reject
 * @param {string} treasurerEmail - Treasurer's email
 * @param {string} reason - Rejection reason
 * @returns {Object} - Result
 */
function rejectPaymentVerification(verificationId, treasurerEmail, reason) {
  try {
    var found = _findPaymentVerificationById_(verificationId);
    if (!found) {
      return { ok: false, error: "Verification not found", code: "NOT_FOUND" };
    }

    // Update verification record
    _setPaymentVerificationFields_(found, {
      status: "not_verified",
      verified_by_email: treasurerEmail,
      verified_date: new Date(),
      treasurer_notes: reason || "Rejected"
    });

    // Send rejection email to member (tpl_064)
    try {
      var household = getHouseholdById(found.obj.household_id);
      sendEmail("tpl_064", found.obj.member_email, {
        VERIFICATION_ID: verificationId,
        HOUSEHOLD_NAME: household ? household.household_name : found.obj.household_name,
        MEMBERSHIP_YEAR: found.obj.membership_year,
        REJECTION_REASON: reason || "Payment verification failed. Please contact the treasurer for details.",
        RESUBMIT_LINK: ScriptApp.getService().getUrl()
      });
    } catch (e) {
      Logger.log("WARNING: Could not send member rejection email: " + e);
    }

    // Audit log
    logAuditEntry(treasurerEmail, AUDIT_PAYMENT_REJECTED, "PaymentVerification", verificationId,
      "Payment rejected: " + reason);

    return { ok: true, verification_id: verificationId, status: "not_verified" };
  } catch (e) {
    Logger.log("ERROR rejectPaymentVerification: " + e);
    return { ok: false, error: String(e), code: "SERVER_ERROR" };
  }
}

/**
 * FUNCTION: requestPaymentClarification
 * PURPOSE: Treasurer requests clarification from member
 * @param {string} verificationId - Verification ID
 * @param {string} treasurerEmail - Treasurer's email
 * @param {string} clarificationRequest - What clarification needed
 * @returns {Object} - Result
 */
function requestPaymentClarification(verificationId, treasurerEmail, clarificationRequest) {
  try {
    var found = _findPaymentVerificationById_(verificationId);
    if (!found) {
      return { ok: false, error: "Verification not found", code: "NOT_FOUND" };
    }

    // Update verification record
    _setPaymentVerificationFields_(found, {
      status: "clarification_requested",
      verified_by_email: treasurerEmail,
      verified_date: new Date(),
      treasurer_notes: clarificationRequest || "Clarification requested"
    });

    // Send clarification email to member (tpl_065)
    try {
      var household = getHouseholdById(found.obj.household_id);
      sendEmail("tpl_065", found.obj.member_email, {
        VERIFICATION_ID: verificationId,
        HOUSEHOLD_NAME: household ? household.household_name : found.obj.household_name,
        MEMBERSHIP_YEAR: found.obj.membership_year,
        CLARIFICATION_REQUEST: clarificationRequest || "Please provide additional information about your payment.",
        DEADLINE: formatDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), false)
      });
    } catch (e) {
      Logger.log("WARNING: Could not send member clarification email: " + e);
    }

    // Audit log
    logAuditEntry(treasurerEmail, AUDIT_PAYMENT_CLARIFICATION, "PaymentVerification", verificationId,
      "Clarification requested: " + clarificationRequest);

    return { ok: true, verification_id: verificationId, status: "clarification_requested" };
  } catch (e) {
    Logger.log("ERROR requestPaymentClarification: " + e);
    return { ok: false, error: String(e), code: "SERVER_ERROR" };
  }
}

/**
 * FUNCTION: calculateProratedDues
 * PURPOSE: Calculate pro-rated dues based on membership year and current quarter
 * @param {number} annualDuesUsd - Annual dues in USD
 * @returns {number} - Pro-rated amount in USD
 */
function calculateProratedDues(annualDuesUsd) {
  var now = new Date();
  var month = now.getMonth(); // 0=Jan, 7=Aug

  // Membership year is Aug-Jul
  // Q1: Aug-Oct (100%), Q2: Nov-Jan (75%), Q3: Feb-Apr (50%), Q4: May-Jul (25%)
  var quarterPercentage;
  if (month >= 7) { // Aug-Oct
    quarterPercentage = 100;
  } else if (month >= 10) { // Nov-Jan (impossible in this branch)
    quarterPercentage = 75;
  } else if (month >= 1) { // Feb-Apr
    quarterPercentage = 50;
  } else { // May-Jul
    quarterPercentage = 25;
  }

  // If August-October (month 7-9), it's Q1 (100%)
  if (month >= 7 && month <= 9) {
    quarterPercentage = 100;
  }
  // If November-January (month 10-0), it's Q2 (75%)
  else if (month === 10 || month === 11 || month === 0) {
    quarterPercentage = 75;
  }
  // If February-April (month 1-3), it's Q3 (50%)
  else if (month >= 1 && month <= 3) {
    quarterPercentage = 50;
  }
  // If May-July (month 4-6), it's Q4 (25%)
  else {
    quarterPercentage = 25;
  }

  return Math.round(annualDuesUsd * (quarterPercentage / 100) * 100) / 100;
}

/**
 * HELPER: Get acceptable payment years for a household
 */
function _getAcceptablePaymentYears_(membershipLevelId) {
  try {
    var pricingSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_PRICING);
    var data = pricingSheet.getDataRange().getValues();
    var headers = data[0];
    var years = {};

    for (var i = 1; i < data.length; i++) {
      var rowObj = rowToObject(headers, data[i]);
      if (rowObj.membership_level_id === membershipLevelId && rowObj.active_for_payment === true) {
        years[rowObj.membership_year] = true;
      }
    }

    return Object.keys(years);
  } catch (e) {
    Logger.log("WARNING: Could not get acceptable payment years: " + e);
    return [];
  }
}

/**
 * HELPER: Get Payment Verifications sheet
 */
function _getPaymentVerificationsSheet_() {
  return SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_PAYMENT_VERIFICATIONS);
}

/**
 * HELPER: Append row to sheet by headers
 */
function _appendRowByHeaders_(sheet, obj) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = [];
  for (var i = 0; i < headers.length; i++) row.push(obj[headers[i]] !== undefined ? obj[headers[i]] : "");
  sheet.appendRow(row);
}

/**
 * HELPER: Find payment verification by ID
 */
function _findPaymentVerificationById_(verificationId) {
  var sheet = _getPaymentVerificationsSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  for (var i = 1; i < data.length; i++) {
    var obj = rowToObject(headers, data[i]);
    if (obj.verification_id === verificationId) {
      return { sheet: sheet, headers: headers, rowIndex: i + 1, obj: obj };
    }
  }
  return null;
}

/**
 * HELPER: Set payment verification fields
 */
function _setPaymentVerificationFields_(found, patch) {
  var headers = found.headers;
  for (var key in patch) {
    if (!patch.hasOwnProperty(key)) continue;
    var col = headers.indexOf(key) + 1;
    if (col > 0) {
      found.sheet.getRange(found.rowIndex, col).setValue(patch[key]);
      found.obj[key] = patch[key];
    }
  }
}

/**
 * HELPER: Get all payment verifications
 */
function _getAllPaymentVerifications_() {
  var sheet = _getPaymentVerificationsSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var out = [];
  for (var i = 1; i < data.length; i++) out.push(rowToObject(headers, data[i]));
  return out;
}

/**
 * HELPER: Get payment verifications for a household
 */
function _getPaymentVerificationsForHousehold_(householdId) {
  var all = _getAllPaymentVerifications_();
  return all.filter(function(v) { return v.household_id === householdId; });
}
