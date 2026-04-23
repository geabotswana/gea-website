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
    var exchangeRate = getExchangeRate();
    var payload = {
      payment_id: paymentId,
      household_id: params.household_id,
      household_name: household.household_name || "",
      payment_date: txDate,
      payment_method: params.payment_method,
      currency: currency,
      amount: amountPaid,
      amount_usd: currency === "USD" ? amountPaid : Math.round(amountPaid / exchangeRate * 100) / 100,
      amount_bwp: currency === "BWP" ? amountPaid : Math.round(amountPaid * exchangeRate * 100) / 100,
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

    // Look up member for email personalization
    var member = getMemberByEmail(params.member_email);
    var memberFirstName = member ? member.first_name : "";
    var memberName = member ? (member.first_name + " " + member.last_name) : params.member_email;

    // Send confirmation email to member
    try {
      sendEmailFromTemplate("PAY_PAYMENT_SUBMITTED_TO_MEMBER", params.member_email, {
        FIRST_NAME: memberFirstName,
        PAYMENT_ID: paymentId,
        AMOUNT: amountPaid,
        CURRENCY: currency,
        SUBMISSION_DATE: formatDate(now, true),
        NEXT_STEP: "The GEA Treasurer will review your payment within 5 business days. You will be notified by email when your payment is verified."
      });
    } catch (e) {
      Logger.log("WARNING: Could not send member confirmation email: " + e);
    }

    // Send FYI email to treasurer
    try {
      sendEmailFromTemplate("PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD", TREASURER_EMAIL, {
        FIRST_NAME: "Treasurer",
        MEMBER_NAME: memberName,
        PAYMENT_ID: paymentId,
        AMOUNT: amountPaid,
        CURRENCY: currency,
        STATUS: "Submitted — awaiting review"
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
 * PURPOSE: Treasurer verifies and approves payment with actual amount received
 * @param {string} paymentId - Payment ID to approve
 * @param {string} treasurerEmail - Treasurer's email
 * @param {Object} params - Verification details {actual_amount_received, payment_status, balance_due_amount, verification_notes}
 * @returns {Object} - Result
 */
function approvePaymentVerification(paymentId, treasurerEmail, params) {
  try {
    var found = _findPaymentById_(paymentId);
    if (!found) {
      return { ok: false, error: "Payment not found", code: "NOT_FOUND" };
    }

    // Handle backward compatibility: if params is a string, treat as notes
    if (typeof params === 'string') {
      params = { verification_notes: params };
    }
    params = params || {};

    var actualAmount = Number(params.actual_amount_received || 0);
    var paymentStatus = String(params.payment_status || "paid_in_full").toLowerCase();
    var exchangeRate = getExchangeRate();
    var originalCurrency = found.obj.currency || "USD";

    // Validate payment status
    if (paymentStatus !== "paid_in_full" && paymentStatus !== "balance_due") {
      return { ok: false, error: "Invalid payment_status. Must be 'paid_in_full' or 'balance_due'", code: "INVALID_PARAM" };
    }

    var now = new Date();

    // Calculate actual amounts in both currencies
    var updatePayload = {
      payment_verified_date: now,
      payment_verified_by: treasurerEmail,
      actual_amount_received: actualAmount,
      payment_status: paymentStatus,
      verification_notes: String(params.verification_notes || "").substring(0, 500)
    };

    // Calculate actual_amount_usd and actual_amount_bwp based on currency
    if (originalCurrency === "USD") {
      updatePayload.actual_amount_usd = actualAmount;
      updatePayload.actual_amount_bwp = Math.round(actualAmount * exchangeRate * 100) / 100;
    } else if (originalCurrency === "BWP") {
      updatePayload.actual_amount_bwp = actualAmount;
      updatePayload.actual_amount_usd = Math.round(actualAmount / exchangeRate * 100) / 100;
    }

    // If balance_due, store the amount
    if (paymentStatus === "balance_due" && params.balance_due_amount) {
      updatePayload.balance_due_amount = Number(params.balance_due_amount);
    }

    _setPaymentFields_(found, updatePayload);

    // Send verification email to member
    try {
      var household = getHouseholdById(found.obj.household_id);
      var primaryMember = household ? getMemberById(household.primary_member_id) : null;
      var memberEmail = primaryMember ? primaryMember.email : "";

      if (memberEmail) {
        var templateName = paymentStatus === "balance_due" ? "PAY_PAYMENT_PARTIAL_TO_MEMBER" : "PAY_PAYMENT_VERIFIED_TO_MEMBER";
        sendEmailFromTemplate(templateName, memberEmail, {
          FIRST_NAME: primaryMember ? primaryMember.first_name : "",
          PAYMENT_ID: paymentId,
          AMOUNT: actualAmount,
          CURRENCY: found.obj.currency,
          VERIFICATION_DATE: formatDate(now, true),
          BALANCE_DUE: params.balance_due_amount || 0,
          MEMBERSHIP_ACTIVATED: paymentStatus === "paid_in_full" ? "Active" : "Pending"
        });
      }
    } catch (e) {
      Logger.log("WARNING: Could not send member verification email: " + e);
    }

    // Audit log
    logAuditEntry(treasurerEmail, AUDIT_PAYMENT_VERIFIED, "Payment", paymentId,
      "Payment verified: " + actualAmount + " " + found.obj.currency + " (" + paymentStatus + ")");

    return { ok: true, payment_id: paymentId, status: paymentStatus };
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

    // Send rejection email to member
    try {
      var household = getHouseholdById(found.obj.household_id);
      var primaryMember = household ? getMemberById(household.primary_member_id) : null;
      var memberEmail = primaryMember ? primaryMember.email : "";

      if (memberEmail) {
        sendEmailFromTemplate("PAY_PAYMENT_REJECTED_TO_MEMBER", memberEmail, {
          FIRST_NAME: primaryMember ? primaryMember.first_name : "",
          PAYMENT_ID: paymentId,
          REJECTION_REASON: reason || "Payment verification failed. Please contact the treasurer for details.",
          RESUBMIT_DEADLINE: formatDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), false),
          CONTACT_EMAIL: TREASURER_EMAIL
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

    // Send clarification email to member
    try {
      var household = getHouseholdById(found.obj.household_id);
      var primaryMember = household ? getMemberById(household.primary_member_id) : null;
      var memberEmail = primaryMember ? primaryMember.email : "";

      if (memberEmail) {
        sendEmailFromTemplate("PAY_PAYMENT_CLARIFICATION_REQUESTED_TO_MEMBER", memberEmail, {
          FIRST_NAME: primaryMember ? primaryMember.first_name : "",
          PAYMENT_ID: paymentId,
          CLARIFICATION_NEEDED: clarificationRequest || "Please provide additional information about your payment.",
          DEADLINE: formatDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), false),
          CONTACT_EMAIL: TREASURER_EMAIL
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

  // If August-October (month 7-9), it's Q1 (100%)
  if (month >= 7 && month <= 9) {
    quarterPercentage = QUARTER_PERCENTAGES["Q1"];
  }
  // If November-January (month 10-0), it's Q2 (75%)
  else if (month === 10 || month === 11 || month === 0) {
    quarterPercentage = QUARTER_PERCENTAGES["Q2"];
  }
  // If February-April (month 1-3), it's Q3 (50%)
  else if (month >= 1 && month <= 3) {
    quarterPercentage = QUARTER_PERCENTAGES["Q3"];
  }
  // If May-July (month 4-6), it's Q4 (25%)
  else {
    quarterPercentage = QUARTER_PERCENTAGES["Q4"];
  }

  return Math.round(annualDuesUsd * (quarterPercentage / 100) * 100) / 100;
}

/**
 * HELPER: Get acceptable payment years for a household
 */
function _getAcceptablePaymentYears_(membershipLevelId) {
  try {
    var pricingSheet = SpreadsheetApp.openById(PAYMENT_TRACKING_ID).getSheetByName(TAB_MEMBERSHIP_PRICING);
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
 * HELPER: Append row to sheet by headers with validation
 */
function _appendRowByHeaders_(sheet, obj) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Log headers and data for diagnostics
  var missingKeys = [];
  for (var i = 0; i < headers.length; i++) {
    if (headers[i] && obj[headers[i]] === undefined &&
        !headers[i].match(/^journal_entry_id|^recorded_by/)) {
      missingKeys.push(headers[i]);
    }
  }

  if (missingKeys.length > 0) {
    Logger.log("[WARN] _appendRowByHeaders_: Missing keys in obj: " + JSON.stringify(missingKeys) +
      "\n  Expected headers: " + JSON.stringify(headers) +
      "\n  Provided keys: " + JSON.stringify(Object.keys(obj)));
  }

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

/**
 * FUNCTION: fetchAndUpdateExchangeRate
 * PURPOSE: Fetch current USD to BWP exchange rate from API, save to Configuration sheet,
 *          and append a daily row to the Rates sheet.
 * Called nightly by runNightlyTasks() to keep exchange rate current.
 * @returns {Object} - { ok, rate } or { ok: false, error, using_default: true }
 */
function fetchAndUpdateExchangeRate() {
  try {
    var response = UrlFetchApp.fetch(EXCHANGE_RATE_API_URL, { muteHttpExceptions: true });
    var httpCode = response.getResponseCode();

    if (httpCode !== 200) {
      Logger.log("WARNING: Exchange rate API returned status " + httpCode);
      logAuditEntry("system", "PAYMENT_CONFIG", "Exchange Rate", "fetch_failed",
        "Exchange rate API call failed with status " + httpCode + ". Using default rate.");
      return { ok: false, error: "API returned status " + httpCode, using_default: true };
    }

    var json = JSON.parse(response.getContentText());
    if (!json.rates || !json.rates.BWP) {
      Logger.log("WARNING: Exchange rate API response missing BWP rate");
      logAuditEntry("system", "PAYMENT_CONFIG", "Exchange Rate", "invalid_response",
        "Exchange rate API response invalid or missing BWP rate");
      return { ok: false, error: "Invalid API response", using_default: true };
    }

    var newRate = json.rates.BWP;
    var now = new Date();

    // 1. Update Configuration sheet (current rate — read by getExchangeRate())
    setConfigValue("exchange_rate_usd_to_bwp", newRate);
    setConfigValue("exchange_rate_last_updated", now);

    // 2. Append daily row to Rates sheet
    _appendRateRow_(formatDate(now, true), newRate, now.getDay() === 0, now, "open.er-api.com");

    logAuditEntry("system", "PAYMENT_CONFIG", "Exchange Rate", "updated",
      "Exchange rate updated: 1 USD = " + newRate + " BWP");

    Logger.log("Exchange rate updated: 1 USD = " + newRate + " BWP");
    return { ok: true, rate: newRate };
  } catch (e) {
    Logger.log("ERROR fetchAndUpdateExchangeRate: " + e);
    logAuditEntry("system", "PAYMENT_CONFIG", "Exchange Rate", "error",
      "Failed to fetch exchange rate: " + String(e));
    return { ok: false, error: String(e), using_default: true };
  }
}

/**
 * FUNCTION: _appendRateRow_
 * PURPOSE: Append one row to the Rates sheet. Skips silently if a row for that
 *          date already exists (safe to call repeatedly / during backfill).
 * @param {string}  rateDateStr  "YYYY-MM-DD"
 * @param {number}  usdToBwp    Exchange rate
 * @param {boolean} isSundayRate True if the rate_date is a Sunday
 * @param {Date}    timestamp   When the rate was recorded
 * @param {string}  source      e.g. "open.er-api.com" or "api.frankfurter.app (backfill)"
 * @returns {boolean} true if written, false if skipped (date exists)
 */
function _appendRateRow_(rateDateStr, usdToBwp, isSundayRate, timestamp, source) {
  try {
    var sheet = SpreadsheetApp.openById(PAYMENT_TRACKING_ID).getSheetByName(TAB_RATES);
    if (!sheet) {
      Logger.log("WARNING: Rates sheet not found in Payment Tracking spreadsheet");
      return false;
    }

    // Skip if a row for this date already exists
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var dateCol = headers.indexOf("rate_date");
    for (var i = 1; i < data.length; i++) {
      var existing = data[i][dateCol];
      if (existing instanceof Date) existing = formatDate(existing, true);
      else existing = String(existing).substring(0, 10);
      if (existing === rateDateStr) return false; // already present
    }

    // Build row in header order
    var row = [];
    for (var j = 0; j < headers.length; j++) {
      switch (headers[j]) {
        case "rate_date":     row.push(rateDateStr);   break;
        case "usd_to_bwp":   row.push(usdToBwp);      break;
        case "is_sunday_rate": row.push(isSundayRate); break;
        case "timestamp":    row.push(timestamp);      break;
        case "source":       row.push(source);         break;
        default:             row.push("");
      }
    }
    sheet.appendRow(row);
    return true;
  } catch (e) {
    Logger.log("ERROR _appendRateRow_(" + rateDateStr + "): " + e);
    return false;
  }
}

/**
 * FUNCTION: backfillExchangeRates
 * PURPOSE:  Populate the Rates sheet with historical USD→BWP data.
 *
 *           Uses the fawaz currency API (jsDelivr CDN, completely free, no key,
 *           covers 150+ currencies including BWP, data back to 2024-01-01).
 *           One HTTP call per calendar day; weekends get the rate from the most
 *           recent weekday (markets closed). Already-present dates are skipped,
 *           so it is safe to re-run.
 *
 *           GAS execution limit is 6 minutes (~300 s). At ~0.5 s/call this
 *           handles up to ~200 days per run. For longer ranges call in chunks:
 *             backfillExchangeRates("2025-08-01", "2025-11-30")  // chunk 1
 *             backfillExchangeRates("2025-12-01", "2026-03-19")  // chunk 2
 *
 * HOW TO RUN:
 *   Option A — use the default range (Aug 1 2025 → yesterday):
 *     Select backfillExchangeRates in the Apps Script dropdown and click Run.
 *
 *   Option B — call with explicit dates from a one-off wrapper:
 *     function runBackfill() { backfillExchangeRates("2025-08-01", "2026-03-19"); }
 *
 * @param {string} startDateStr  "YYYY-MM-DD" (default "2025-08-01")
 * @param {string} endDateStr    "YYYY-MM-DD" (default: yesterday)
 */
function backfillExchangeRates(startDateStr, endDateStr) {
  startDateStr = startDateStr || "2025-08-01";

  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  endDateStr = endDateStr || formatDate(yesterday, true);

  Logger.log("=== Exchange Rate Backfill ===");
  Logger.log("Range: " + startDateStr + " → " + endDateStr);
  Logger.log("Source: cdn.jsdelivr.net/@fawazahmed0/currency-api (USD/BWP per day)");

  var cursor   = new Date(startDateStr + "T12:00:00");
  var endDate  = new Date(endDateStr   + "T12:00:00");
  var lastRate = null; // filled on first successful weekday fetch
  var written  = 0;
  var skipped  = 0;
  var errors   = 0;

  while (cursor <= endDate) {
    var cursorStr = formatDate(cursor, true);
    var dayOfWeek = cursor.getDay(); // 0=Sun, 6=Sat
    var isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    var isSunday  = (dayOfWeek === 0);

    if (!isWeekend) {
      // Fetch this weekday's rate from fawaz CDN
      // Primary:  https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@DATE/v1/currencies/usd/bwp.json
      // Fallback: https://DATE.currency-api.pages.dev/v1/currencies/usd/bwp.json
      var rate = _fetchFawazRate_(cursorStr);
      if (rate !== null) {
        lastRate = rate;
      } else {
        errors++;
        Logger.log("  WARN: No rate for " + cursorStr + " — using last known rate (" + lastRate + ")");
      }
    }
    // Weekend: reuse lastRate (Friday's rate)

    if (lastRate !== null) {
      var ts       = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 2, 0, 0);
      var source   = isWeekend ? "fawaz/weekend-carry" : "fawaz/currency-api";
      var didWrite = _appendRateRow_(cursorStr, lastRate, isSunday, ts, source);
      if (didWrite) written++; else skipped++;
    } else {
      Logger.log("  SKIP: " + cursorStr + " — no rate available yet");
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  Logger.log("Backfill complete — written: " + written +
             ", skipped (already existed): " + skipped +
             ", fetch errors: " + errors);
  return { ok: true, written: written, skipped: skipped, errors: errors };
}

/**
 * HELPER: Fetch a single day's USD→BWP rate from the fawaz currency CDN.
 * Tries jsDelivr first, falls back to Cloudflare Pages mirror.
 * Returns the rate as a number, or null on failure.
 * @param {string} dateStr "YYYY-MM-DD"
 * @returns {number|null}
 */
function _fetchFawazRate_(dateStr) {
  // /usd.json (all currencies) is the only path that exists in the npm package.
  // /usd/bwp.json (single-currency) does not exist — confirmed by diagnostic.
  var url = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@" + dateStr + "/v1/currencies/usd.json";
  try {
    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (resp.getResponseCode() === 200) {
      var json = JSON.parse(resp.getContentText());
      // Response shape: { "date": "YYYY-MM-DD", "usd": { "bwp": 13.57, ... } }
      if (json.usd && json.usd.bwp) {
        return Number(json.usd.bwp);
      }
    }
  } catch (e) {
    Logger.log("ERROR _fetchFawazRate_(" + dateStr + "): " + e);
  }
  return null;
}

/**
 * DIAGNOSTIC: Run this first to find out exactly what the exchange rate APIs
 * return from GAS servers. Logs HTTP status + first 300 chars of body for
 * several candidate URLs.
 *
 * HOW TO RUN: select debugExchangeRateApis in the dropdown and click Run.
 */
function debugExchangeRateApis() {
  var testDate = "2025-10-01"; // known weekday

  var candidates = [
    // fawaz — single-currency endpoint
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@" + testDate + "/v1/currencies/usd/bwp.json",
    // fawaz — all-currencies endpoint (different file, same package)
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@" + testDate + "/v1/currencies/usd.json",
    // fawaz — "latest" single-currency (no date, proves CDN reachability)
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd/bwp.json",
    // fawaz — Cloudflare Pages fallback (date as subdomain)
    "https://" + testDate + ".currency-api.pages.dev/v1/currencies/usd/bwp.json",
    // fawaz — Cloudflare Pages "latest"
    "https://latest.currency-api.pages.dev/v1/currencies/usd/bwp.json",
    // existing working API — proves UrlFetchApp itself is fine
    "https://open.er-api.com/v6/latest/USD"
  ];

  Logger.log("=== Exchange Rate API Diagnostics ===");
  Logger.log("Test date: " + testDate);
  Logger.log("");

  for (var i = 0; i < candidates.length; i++) {
    var url = candidates[i];
    Logger.log("[" + (i + 1) + "] " + url);
    try {
      var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      var code = resp.getResponseCode();
      var body = resp.getContentText().substring(0, 300);
      Logger.log("    HTTP " + code);
      Logger.log("    Body: " + body);
    } catch (e) {
      Logger.log("    EXCEPTION: " + e);
    }
    Logger.log("");
  }

  Logger.log("=== Done ===");
}

/**
 * FUNCTION: getExchangeRate
 * PURPOSE: Get current exchange rate from Configuration sheet or default
 * @returns {number} - Exchange rate (USD to BWP)
 */
function getExchangeRate() {
  try {
    var rate = getConfigValue("exchange_rate_usd_to_bwp");
    if (rate && !isNaN(rate)) {
      return Number(rate);
    }
  } catch (e) {
    Logger.log("WARNING: Could not read exchange rate from config: " + e);
  }

  // Fall back to default
  return EXCHANGE_RATE_DEFAULT;
}

/**
 * FUNCTION: getPaymentReport
 * PURPOSE: Generate payment history report with optional filters
 * @param {Object} filters - Optional filters: { membership_year, status }
 * @returns {Object} - Report data with payments, summary, and ok flag
 */
function getPaymentReport(filters) {
  try {
    filters = filters || {};
    var payments = _getAllPayments_();

    // Filter by membership year if provided
    if (filters.membership_year) {
      payments = payments.filter(function(p) {
        return p.applied_to_period === filters.membership_year;
      });
    }

    // Filter by status if provided (verified, submitted, rejected, clarification_requested)
    if (filters.status) {
      payments = payments.filter(function(p) {
        if (filters.status === "verified") {
          return p.payment_verified_date;
        } else if (filters.status === "submitted") {
          return !p.payment_verified_date && !p.notes;
        } else if (filters.status === "rejected") {
          return p.notes && p.notes.indexOf("REJECTED:") === 0;
        } else if (filters.status === "clarification_requested") {
          return p.notes && p.notes.indexOf("CLARIFICATION:") === 0;
        }
        return false;
      });
    }

    // Calculate summary
    var summary = {
      total_payments: payments.length,
      verified_count: 0,
      submitted_count: 0,
      rejected_count: 0,
      clarification_count: 0,
      total_collected_usd: 0,
      total_collected_bwp: 0
    };

    payments.forEach(function(p) {
      if (p.payment_verified_date) {
        summary.verified_count++;
        summary.total_collected_usd += Number(p.amount_usd || 0);
        summary.total_collected_bwp += Number(p.amount_bwp || 0);
      } else if (p.notes && p.notes.indexOf("REJECTED:") === 0) {
        summary.rejected_count++;
      } else if (p.notes && p.notes.indexOf("CLARIFICATION:") === 0) {
        summary.clarification_count++;
      } else {
        summary.submitted_count++;
      }
    });

    // Round financial totals
    summary.total_collected_usd = Math.round(summary.total_collected_usd * 100) / 100;
    summary.total_collected_bwp = Math.round(summary.total_collected_bwp * 100) / 100;

    return {
      ok: true,
      payments: payments,
      summary: summary
    };
  } catch (e) {
    Logger.log("ERROR getPaymentReport: " + e);
    return { ok: false, error: String(e) };
  }
}
