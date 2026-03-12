/**
 * ============================================================
 * PAYMENTSERVICE.GS
 * ============================================================
 * Payment verification, treasurer review, and membership
 * activation workflow for dues collection.
 *
 * Handles member payment submissions, treasurer verification,
 * pro-ration calculations, and payment status tracking.
 *
 * Uses existing Payments sheet (GEA Payment Tracking workbook)
 * with verification status tracked via payment_verified_date.
 * ============================================================
 */

/**
 * FUNCTION: submitPaymentVerification
 * PURPOSE: Member submits payment proof to claim dues payment
 * @param {Object} params - Payment submission parameters
 * @returns {Object} - Result with payment_id or error
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
      } catch (e) {
        Logger.log("WARNING: Could not save payment proof file: " + e);
        // Continue without file
      }
    }

    // Create or update Payments sheet record
    // Phase 1: All payments are "Dues Payment"
    var paymentId = generateId("PAY");
    var paymentsSheet = _getPaymentsSheet_();
    var payload = {
      payment_id: paymentId,
      household_id: params.household_id,
      household_name: household.household_name || "",
      payment_date: txDate,
      payment_method: params.payment_method,
      currency: currency,
      amount: amountPaid,
      amount_usd: currency === "USD" ? amountPaid : Math.round(amountPaid / 13.45 * 100) / 100,
      amount_bwp: currency === "BWP" ? amountPaid : Math.round(amountPaid * 13.45 * 100) / 100,
      payment_type: "Dues Payment",
      applied_to_period: params.membership_year,
      payment_reference: params.payment_reference || "",
      payment_confirmation_file_id: fileId || "",
      payment_submitted_date: now,
      payment_verified_date: "",  // NULL until treasurer approves
      payment_verified_by: "",    // Empty until verified
      notes: String(params.notes || "").substring(0, 500)
    };

    _appendRowByHeaders_(paymentsSheet, payload);

    // Send confirmation email to member (tpl_061) - FROM board@
    try {
      sendEmailFromBoard("tpl_061", params.member_email, {
        PAYMENT_ID: paymentId,
        HOUSEHOLD_NAME: household.household_name,
        MEMBERSHIP_YEAR: params.membership_year,
        PAYMENT_METHOD: params.payment_method,
        AMOUNT: amountPaid,
        CURRENCY: currency,
        TRANSACTION_DATE: formatDate(txDate, false),
        SUBMISSION_DATE: formatDate(now, true)
      });
    } catch (e) {
      Logger.log("WARNING: Could not send member confirmation email: " + e);
    }

    // Send action email to treasurer (tpl_062) - FROM board@
    try {
      var member = getMemberByEmail(params.member_email);
      var memberName = member ? (member.first_name + " " + member.last_name) : params.member_email;
      sendEmailFromBoard("tpl_062", TREASURER_EMAIL, {
        PAYMENT_ID: paymentId,
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
        SUBMISSION_DATE: formatDate(now, true),
        NOTES: params.notes || "",
        ADMIN_PORTAL_LINK: ScriptApp.getService().getUrl()
      });
    } catch (e) {
      Logger.log("WARNING: Could not send treasurer notification email: " + e);
    }

    // Audit log
    logAuditEntry(params.member_email || "member", AUDIT_PAYMENT_SUBMITTED, "Payment", paymentId,
      "Payment submitted: " + params.payment_method + " - " + amountPaid + " " + currency);

    return { ok: true, payment_id: paymentId, message: "Payment submitted successfully" };
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
    var payments = _getPaymentsForHousehold_(householdId);
    var relevantPayments = payments.filter(function(p) {
      return p.applied_to_period === membershipYear && p.payment_type === "Dues Payment";
    });

    // Sort by submission date (newest first)
    relevantPayments.sort(function(a, b) {
      return new Date(b.payment_submitted_date) - new Date(a.payment_submitted_date);
    });

    // Determine current status
    var currentStatus = "none";
    var currentPayment = null;
    if (relevantPayments.length > 0) {
      currentPayment = relevantPayments[0];
      if (currentPayment.payment_verified_date) {
        currentStatus = "verified";
      } else if (currentPayment.notes && currentPayment.notes.indexOf("REJECTED:") === 0) {
        currentStatus = "rejected";
      } else if (currentPayment.notes && currentPayment.notes.indexOf("CLARIFICATION:") === 0) {
        currentStatus = "clarification_requested";
      } else {
        currentStatus = "submitted";
      }
    }

    return {
      ok: true,
      household_id: householdId,
      membership_year: membershipYear,
      status: currentStatus,
      current_payment: currentPayment,
      history: relevantPayments
    };
  } catch (e) {
    Logger.log("ERROR getPaymentVerificationStatus: " + e);
    return { ok: false, error: String(e) };
  }
}

/**
 * FUNCTION: listPendingPaymentVerifications
 * PURPOSE: Treasurer views all pending payment verifications (not yet verified)
 * @returns {Object} - List of pending verifications
 */
function listPendingPaymentVerifications() {
  try {
    var payments = _getAllPayments_();
    // Pending = submitted but not yet verified (payment_verified_date is empty)
    var pending = payments.filter(function(p) {
      return p.payment_type === "Dues Payment" && !p.payment_verified_date;
    });

    // Sort by submission date (newest first)
    pending.sort(function(a, b) {
      return new Date(b.payment_submitted_date) - new Date(a.payment_submitted_date);
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
 * @param {string} paymentId - Payment ID to approve
 * @param {string} treasurerEmail - Treasurer's email
 * @param {string} treasurerNotes - Optional notes
 * @returns {Object} - Result
 */
function approvePaymentVerification(paymentId, treasurerEmail, treasurerNotes) {
  try {
    var found = _findPaymentById_(paymentId);
    if (!found) {
      return { ok: false, error: "Payment not found", code: "NOT_FOUND" };
    }

    var now = new Date();
    // Update payment record
    _setPaymentFields_(found, {
      payment_verified_date: now,
      payment_verified_by: treasurerEmail,
      notes: String(treasurerNotes || "").substring(0, 500)
    });

    // Send verification email to member (tpl_063) - FROM board@
    try {
      var household = getHouseholdById(found.obj.household_id);
      var primaryMember = household ? getMemberById(household.primary_member_id) : null;
      var memberEmail = primaryMember ? primaryMember.email : "";

      if (memberEmail) {
        sendEmailFromBoard("tpl_063", memberEmail, {
          PAYMENT_ID: paymentId,
          HOUSEHOLD_NAME: household ? household.household_name : found.obj.household_name,
          MEMBERSHIP_YEAR: found.obj.applied_to_period,
          AMOUNT_PAID: found.obj.amount,
          CURRENCY: found.obj.currency,
          VERIFICATION_DATE: formatDate(now, true)
        });
      }
    } catch (e) {
      Logger.log("WARNING: Could not send member verification email: " + e);
    }

    // Audit log
    logAuditEntry(treasurerEmail, AUDIT_PAYMENT_VERIFIED, "Payment", paymentId,
      "Payment approved - " + found.obj.amount + " " + found.obj.currency);

    return { ok: true, payment_id: paymentId, status: "verified" };
  } catch (e) {
    Logger.log("ERROR approvePaymentVerification: " + e);
    return { ok: false, error: String(e), code: "SERVER_ERROR" };
  }
}

/**
 * FUNCTION: rejectPaymentVerification
 * PURPOSE: Treasurer rejects payment with reason
 * @param {string} paymentId - Payment ID to reject
 * @param {string} treasurerEmail - Treasurer's email
 * @param {string} reason - Rejection reason
 * @returns {Object} - Result
 */
function rejectPaymentVerification(paymentId, treasurerEmail, reason) {
  try {
    var found = _findPaymentById_(paymentId);
    if (!found) {
      return { ok: false, error: "Payment not found", code: "NOT_FOUND" };
    }

    // Mark as rejected in notes field
    var rejectionNote = "REJECTED: " + (reason || "Payment verification failed");
    _setPaymentFields_(found, {
      notes: rejectionNote.substring(0, 500)
    });

    // Send rejection email to member (tpl_064) - FROM board@
    try {
      var household = getHouseholdById(found.obj.household_id);
      var primaryMember = household ? getMemberById(household.primary_member_id) : null;
      var memberEmail = primaryMember ? primaryMember.email : "";

      if (memberEmail) {
        sendEmailFromBoard("tpl_064", memberEmail, {
          PAYMENT_ID: paymentId,
          HOUSEHOLD_NAME: household ? household.household_name : found.obj.household_name,
          MEMBERSHIP_YEAR: found.obj.applied_to_period,
          REJECTION_REASON: reason || "Payment verification failed. Please contact the treasurer for details.",
          RESUBMIT_LINK: ScriptApp.getService().getUrl()
        });
      }
    } catch (e) {
      Logger.log("WARNING: Could not send member rejection email: " + e);
    }

    // Audit log
    logAuditEntry(treasurerEmail, AUDIT_PAYMENT_REJECTED, "Payment", paymentId,
      "Payment rejected: " + reason);

    return { ok: true, payment_id: paymentId, status: "rejected" };
  } catch (e) {
    Logger.log("ERROR rejectPaymentVerification: " + e);
    return { ok: false, error: String(e), code: "SERVER_ERROR" };
  }
}

/**
 * FUNCTION: requestPaymentClarification
 * PURPOSE: Treasurer requests clarification from member
 * @param {string} paymentId - Payment ID
 * @param {string} treasurerEmail - Treasurer's email
 * @param {string} clarificationRequest - What clarification needed
 * @returns {Object} - Result
 */
function requestPaymentClarification(paymentId, treasurerEmail, clarificationRequest) {
  try {
    var found = _findPaymentById_(paymentId);
    if (!found) {
      return { ok: false, error: "Payment not found", code: "NOT_FOUND" };
    }

    // Mark as clarification requested in notes field
    var clarNote = "CLARIFICATION: " + (clarificationRequest || "Please provide additional information");
    _setPaymentFields_(found, {
      notes: clarNote.substring(0, 500)
    });

    // Send clarification email to member (tpl_065) - FROM board@
    try {
      var household = getHouseholdById(found.obj.household_id);
      var primaryMember = household ? getMemberById(household.primary_member_id) : null;
      var memberEmail = primaryMember ? primaryMember.email : "";

      if (memberEmail) {
        sendEmailFromBoard("tpl_065", memberEmail, {
          PAYMENT_ID: paymentId,
          HOUSEHOLD_NAME: household ? household.household_name : found.obj.household_name,
          MEMBERSHIP_YEAR: found.obj.applied_to_period,
          CLARIFICATION_REQUEST: clarificationRequest || "Please provide additional information about your payment.",
          DEADLINE: formatDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), false)
        });
      }
    } catch (e) {
      Logger.log("WARNING: Could not send member clarification email: " + e);
    }

    // Audit log
    logAuditEntry(treasurerEmail, AUDIT_PAYMENT_CLARIFICATION, "Payment", paymentId,
      "Clarification requested: " + clarificationRequest);

    return { ok: true, payment_id: paymentId, status: "clarification_requested" };
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
 * HELPER: Get Payments sheet
 */
function _getPaymentsSheet_() {
  return SpreadsheetApp.openById(PAYMENT_TRACKING_ID).getSheetByName(TAB_PAYMENTS);
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
 * HELPER: Find payment by ID
 */
function _findPaymentById_(paymentId) {
  var sheet = _getPaymentsSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  for (var i = 1; i < data.length; i++) {
    var obj = rowToObject(headers, data[i]);
    if (obj.payment_id === paymentId) {
      return { sheet: sheet, headers: headers, rowIndex: i + 1, obj: obj };
    }
  }
  return null;
}

/**
 * HELPER: Set payment fields
 */
function _setPaymentFields_(found, patch) {
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
 * HELPER: Get all payments
 */
function _getAllPayments_() {
  var sheet = _getPaymentsSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var out = [];
  for (var i = 1; i < data.length; i++) out.push(rowToObject(headers, data[i]));
  return out;
}

/**
 * HELPER: Get payments for a household
 */
function _getPaymentsForHousehold_(householdId) {
  var all = _getAllPayments_();
  return all.filter(function(p) { return p.household_id === householdId; });
}
