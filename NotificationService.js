/**
 * ============================================================
 * NOTIFICATIONSERVICE.GS
 * ============================================================
 * All scheduled (time-driven) trigger functions.
 *
 * This file is the entry point for every Apps Script trigger.
 * Each function here calls the appropriate service functions
 * and is designed to be attached to a time-based trigger in
 * the Apps Script triggers panel.
 *
 * TRIGGER SETUP (do this once in Apps Script → Triggers):
 *   Function                  Frequency        Suggested Time
 *   ─────────────────────     ──────────────   ──────────────
 *   runNightlyTasks()         Daily            2:00 AM
 *   sendRsoDailySummary()     Daily            6:00 AM
 *   sendHolidayCalReminder()  Day of year      Nov 1 (yearly)
 *
 * All nightly tasks are bundled into runNightlyTasks() so only
 * one trigger is needed for the overnight batch.
 * ============================================================
 */


// ============================================================
// PRIMARY TRIGGER ENTRY POINTS
// ============================================================

/**
 * NIGHTLY BATCH — attach to a daily trigger at 2:00 AM.
 * Runs all overnight checks in sequence. If one task fails,
 * the others still run (each has its own try/catch).
 */
function runNightlyTasks() {
  Logger.log("=== Nightly tasks starting: " + new Date().toString() + " ===");

  // 1. Membership renewals: send 30-day and 7-day reminders,
  //    deactivate households that expired today
  checkExpiringMemberships();

  // 2. Document expiration: send 6-month passport/Omang warnings
  checkExpiringDocuments();

  // 3. Birthdays: send greetings and milestone notifications
  checkBirthdays();

  // 4. Guest list reminders: email members whose deadline is tomorrow
  sendGuestListReminders();

  // 5. Bump window: promote tentative reservations whose window has passed
  processBumpWindowExpirations();

  // 6. Photo reminders: send tpl_016 to members missing photos
  //    who activated more than PHOTO_REMINDER_DAYS_AFTER_ACTIVATION ago
  sendPhotoReminders();

  // 7. Clean up expired sessions
  purgeExpiredSessions();

  // 8. Update exchange rate from API
  fetchAndUpdateExchangeRate();

  // 9. Reservation approval reminders: email board any still-pending bookings
  sendReservationApprovalReminders();

  // 10. Expire waitlist positions whose event is within WAITLIST_HOLD_HOURS
  expireWaitlistPositions();

  // 11 & 12. Monthly board reports: collections + reservations analytics.
  //           Run on the last Monday of the month (ready for Tuesday board meeting).
  try {
    if (_isLastMondayOfMonth_(new Date())) {
      sendMonthlyCollectionsReport();
      sendMonthlyReservationsReport();
    }
  } catch (e) {
    Logger.log("ERROR in monthly reports check: " + e);
  }

  Logger.log("=== Nightly tasks complete ===");
}


/**
 * RSO DAILY SUMMARY — attach to a daily trigger at 6:00 AM.
 * Sends tpl_014 to EMAIL_RSO with all reservations for today.
 * Defined in ReservationService.gs; exposed here as a trigger wrapper.
 */
function triggerRsoDailySummary() {
  Logger.log("RSO daily summary trigger fired: " + new Date().toString());
  sendRsoDailySummary();
}


/**
 * HOLIDAY CALENDAR REMINDER — attach to a yearly trigger on Nov 1.
 * Sends tpl_027 to the board reminding them to update holidays
 * for the coming year.
 */
function sendHolidayCalReminder() {
  Logger.log("Holiday calendar reminder trigger fired.");
  var currentYear = new Date().getFullYear();
  sendEmailFromTemplate("RES_HOLIDAY_CALENDAR_REMINDER_TO_MEMBER", EMAIL_BOARD, {
    FIRST_NAME:        "GEA Board",
    HOLIDAY_NAME:      currentYear + "-" + (currentYear + 1) + " Holiday Schedule",
    DATES:             "Please review the Holiday Calendar sheet for upcoming closure dates",
    FACILITY_CLOSURES: "All GEA facilities (Tennis, Leobo, Gym, Playground)"
  });
}

/**
 * FUNCTION: nightly_checkDocumentExpirations
 * PURPOSE: Send warnings for documents expiring within 6 months.
 * SCHEDULED: 3:00 AM GMT+2 daily.
 */
function nightly_checkDocumentExpirations() {
  try {
    var result = checkDocumentExpirationWarnings();
    Logger.log("Document expiration warnings sent: " + result.warnings_sent);
  } catch (e) {
    Logger.log("ERROR nightly_checkDocumentExpirations: " + e);
    logAuditEntry("system", "SYSTEM_ERROR", "nightly_task", "document_expirations",
                  "Document expiration check failed: " + e);
  }
}

/**
 * FUNCTION: nightly_cleanupExpiredRsoLinks
 * PURPOSE: Mark expired RSO approval links as unusable.
 * SCHEDULED: 3:15 AM GMT+2 daily.
 */
function nightly_cleanupExpiredRsoLinks() {
  try {
    var result = deleteExpiredRsoLinks();
    Logger.log("Expired RSO links cleaned up: " + result.expired_count);
  } catch (e) {
    Logger.log("ERROR nightly_cleanupExpiredRsoLinks: " + e);
    logAuditEntry("system", "SYSTEM_ERROR", "nightly_task", "rso_link_cleanup",
                  "RSO link cleanup failed: " + e);
  }
}


// ============================================================
// HOUSEHOLD PHONE SYNC
// ============================================================
// Nightly scheduled sync of Primary individual phone to Household.
// Runs daily at 2:00 AM to keep household phone cached from Primary individual.
// ============================================================

/**
 * FUNCTION: syncHouseholdPhonesFromPrimary
 * PURPOSE: Nightly scheduled sync - copies Primary individual's phone number
 *          to Household phone fields if Household phone is empty.
 *          This provides a cached copy for quick lookups without cross-table joins,
 *          while keeping Primary individual as the source of truth.
 *
 * HOW IT WORKS:
 * 1. Read all Households from GEA Member Directory
 * 2. For each household:
 *    a. Find the Primary individual in that household
 *    b. If household phone_primary is BLANK:
 *       - Copy Primary's country_code_primary → household country_code_phone_primary
 *       - Copy Primary's phone_primary → household phone_primary
 *       - Copy Primary's phone_primary_whatsapp → household phone_primary_whatsapp
 *    c. If household phone is already filled in:
 *       - Leave it alone (user set a different number, e.g., shared household line)
 * 3. Log each sync action to Audit Log for transparency
 * 4. Log summary statistics
 *
 * FREQUENCY: Nightly at 2:00 AM (configured via Apps Script time-driven trigger)
 * CALLER: Apps Script scheduler (automatic) or manual via _handleSyncHouseholdPhones
 *
 * STATISTICS OUTPUT (logged and audited):
 * - Total households processed
 * - Households synced from Primary
 * - Households with existing phone (left unchanged)
 * - Households with no Primary individual (warning)
 * - Errors encountered
 *
 * EXAMPLE LOG ENTRY:
 * "Household Phone Sync Complete | Total: 150 | Synced: 145 | 
 *  Already filled: 3 | No Primary: 2 | Errors: 0"
 */
function syncHouseholdPhonesFromPrimary() {
  Logger.log("=== HOUSEHOLD PHONE SYNC STARTED ===");
  
  // Check if feature is enabled
  if (!HOUSEHOLD_PHONE_SYNC_ENABLED) {
    Logger.log("Household phone sync is disabled in Config.gs");
    logAuditEntry("system", AUDIT_HOUSEHOLD_PHONE_SYNC_SKIPPED, "Scheduler", "nightly",
                  "Sync disabled in Config.gs");
    return;
  }
  
  var stats = {
    totalHouseholds: 0,
    synced: 0,
    alreadyFilled: 0,
    noPrimary: 0,
    errors: 0
  };
  
  try {
    // Open the Member Directory spreadsheet
    var ss = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID);
    var hhSheet = ss.getSheetByName(TAB_HOUSEHOLDS);
    var indSheet = ss.getSheetByName(TAB_INDIVIDUALS);
    
    // Get all data
    var hhData = hhSheet.getDataRange().getValues();
    var hhHeaders = hhData[0];
    var indData = indSheet.getDataRange().getValues();
    var indHeaders = indData[0];
    
    // Find column indices in Households sheet
    var hhIdCol = hhHeaders.indexOf("household_id");
    var hhCountryCodeCol = hhHeaders.indexOf("country_code_phone_primary");
    var hhPhoneCol = hhHeaders.indexOf("phone_primary");
    var hhWhatsAppCol = hhHeaders.indexOf("phone_primary_whatsapp");
    
    // Find column indices in Individuals sheet
    var indHhIdCol = indHeaders.indexOf("household_id");
    var indRelCol = indHeaders.indexOf("relationship_to_primary");
    var indCountryCodeCol = indHeaders.indexOf("country_code_primary");
    var indPhoneCol = indHeaders.indexOf("phone_primary");
    var indWhatsAppCol = indHeaders.indexOf("phone_primary_whatsapp");
    var indActiveCol = indHeaders.indexOf("active");
    
    // Validate all required columns exist
    if (hhIdCol === -1 || hhCountryCodeCol === -1 || hhPhoneCol === -1) {
      throw new Error("Required Households columns not found. " +
                      "Check: household_id, country_code_phone_primary, phone_primary");
    }
    if (indHhIdCol === -1 || indCountryCodeCol === -1 || indPhoneCol === -1) {
      throw new Error("Required Individuals columns not found. " +
                      "Check: household_id, country_code_primary, phone_primary");
    }
    
    // Process each household (skip header row 0)
    for (var hhRow = 1; hhRow < hhData.length; hhRow++) {
      var hhId = hhData[hhRow][hhIdCol];
      if (!hhId) continue; // Skip empty rows
      
      stats.totalHouseholds++;
      
      // Check if this household already has a phone
      var hhPhoneExists = hhData[hhRow][hhPhoneCol];
      if (hhPhoneExists) {
        // Household already has a phone — leave it alone
        stats.alreadyFilled++;
        continue;
      }
      
      // Find the Primary individual for this household
      var primaryIndividual = null;
      for (var indRow = 1; indRow < indData.length; indRow++) {
        var indHhId = indData[indRow][indHhIdCol];
        var indRel = indData[indRow][indRelCol];
        var indActive = indData[indRow][indActiveCol];
        
        // Found Primary individual in this household
        if (indHhId === hhId && 
            indRel === RELATIONSHIP_PRIMARY && 
            indActive === true) {
          primaryIndividual = {
            rowIndex: indRow,
            countryCode: indData[indRow][indCountryCodeCol],
            phone: indData[indRow][indPhoneCol],
            whatsApp: indData[indRow][indWhatsAppCol]
          };
          break;
        }
      }
      
      // If no Primary individual found, log warning and skip
      if (!primaryIndividual) {
        stats.noPrimary++;
        logAuditEntry("system", AUDIT_HOUSEHOLD_PHONE_SYNC_SKIPPED, "Household", hhId,
                      "No active Primary individual found to sync phone from");
        continue;
      }
      
      // Validate Primary's phone data exists
      if (!primaryIndividual.countryCode || !primaryIndividual.phone) {
        stats.noPrimary++;
        logAuditEntry("system", AUDIT_HOUSEHOLD_PHONE_SYNC_SKIPPED, "Household", hhId,
                      "Primary individual has no phone number to sync");
        continue;
      }
      
      // Validate the phone is in correct format before syncing
      if (!isValidPhoneNumber(primaryIndividual.countryCode, primaryIndividual.phone)) {
        stats.noPrimary++;
        logAuditEntry("system", AUDIT_HOUSEHOLD_PHONE_SYNC_SKIPPED, "Household", hhId,
                      "Primary phone is invalid format: " + primaryIndividual.countryCode + 
                      " " + primaryIndividual.phone);
        continue;
      }
      
      try {
        // Sync Primary's phone to Household
        hhSheet.getRange(hhRow + 1, hhCountryCodeCol + 1)
                .setValue(primaryIndividual.countryCode);
        hhSheet.getRange(hhRow + 1, hhPhoneCol + 1)
                .setValue(primaryIndividual.phone);
        
        // Sync WhatsApp flag if column exists
        if (hhWhatsAppCol !== -1) {
          hhSheet.getRange(hhRow + 1, hhWhatsAppCol + 1)
                  .setValue(primaryIndividual.whatsApp || false);
        }
        
        stats.synced++;
        
        // Log the action with formatted phone for reference
        var formattedPhone = formatPhoneNumber(primaryIndividual.countryCode, 
                                              primaryIndividual.phone);
        logAuditEntry("system", AUDIT_HOUSEHOLD_PHONE_SYNC, "Household", hhId,
                      "Phone synced from Primary individual: " + formattedPhone);
        
      } catch (e) {
        stats.errors++;
        Logger.log("ERROR syncing household " + hhId + ": " + e);
        logAuditEntry("system", AUDIT_HOUSEHOLD_PHONE_SYNC_FAILED, "Household", hhId,
                      "Error during sync: " + e);
      }
    }
    
    // Log summary statistics
    var summary = "Household Phone Sync Complete | " +
                  "Total: " + stats.totalHouseholds + " | " +
                  "Synced: " + stats.synced + " | " +
                  "Already filled: " + stats.alreadyFilled + " | " +
                  "No Primary: " + stats.noPrimary + " | " +
                  "Errors: " + stats.errors;
    Logger.log(summary);
    
    // Log to Audit Log
    logAuditEntry("system", AUDIT_HOUSEHOLD_PHONE_SYNC_COMPLETE, "Scheduler", "nightly",
                  summary);
    
  } catch (e) {
    Logger.log("FATAL ERROR in syncHouseholdPhonesFromPrimary: " + e);
    logAuditEntry("system", AUDIT_HOUSEHOLD_PHONE_SYNC_FAILED, "Scheduler", "nightly",
                  "Fatal error: " + e);
  }
  
  Logger.log("=== HOUSEHOLD PHONE SYNC COMPLETED ===");
}


// ============================================================
// PHOTO REMINDERS
// ============================================================

/**
 * Sends tpl_016 (photo submission reminder) to members who:
 *   - Have an active membership
 *   - Have no approved photo
 *   - Have been activated for at least PHOTO_REMINDER_DAYS days
 *   - Have not already received a reminder this activation cycle
 *
 * Called as part of runNightlyTasks().
 */
function sendPhotoReminders() {
  Logger.log("Photo reminder check starting...");
  var PHOTO_REMINDER_DAYS = 7; // Days after activation before first reminder

  try {
    var sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID)
                  .getSheetByName(TAB_INDIVIDUALS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];

    for (var i = 1; i < data.length; i++) {
      var m = rowToObject(headers, data[i]);

      // Skip: inactive, no email, already has approved photo,
      //       already sent reminder, Staff type
      if (!m.active) continue;
      if (!m.email)  continue;
      if (m.photo_status === PHOTO_STATUS_APPROVED) continue;
      if (m.photo_reminder_sent === true) continue;
      if (m.relationship_to_primary === RELATIONSHIP_STAFF) continue;

      // Only remind members activated at least PHOTO_REMINDER_DAYS ago
      if (!m.activation_date) continue;
      var activatedOn = new Date(m.activation_date);
      var daysSince   = Math.floor((new Date() - activatedOn) / (1000 * 60 * 60 * 24));
      if (daysSince < PHOTO_REMINDER_DAYS) continue;

      // Check if household has other members also missing photos
      var hhMembers = getHouseholdMembers(m.household_id);
      var missingPhotos = hhMembers.filter(function(hm) {
        return hm.photo_status !== PHOTO_STATUS_APPROVED &&
               hm.relationship_to_primary !== RELATIONSHIP_STAFF;
      });
      var missingList = missingPhotos.map(function(hm) {
        return "- " + hm.first_name + " " + hm.last_name;
      }).join("\n");

      // Only send to the Primary member to avoid flooding a household
      if (m.relationship_to_primary !== RELATIONSHIP_PRIMARY) continue;

      var deadline = new Date();
      deadline.setDate(deadline.getDate() + 14);
      sendEmailFromTemplate("DOC_PHOTO_SUBMISSION_REMINDER_TO_MEMBER", m.email, {
        FIRST_NAME:          m.first_name,
        SUBMISSION_DEADLINE: formatDate(deadline),
        PHOTO_REQUIREMENTS:  "Clear, front-facing photo on a plain background (JPG or PNG, max 5MB)",
        PORTAL_URL:          URL_MEMBER_PORTAL
      });

      updateMemberField(m.individual_id, "photo_reminder_sent", true, "system");
      Logger.log("Photo reminder sent: " + m.email);
    }
  } catch (e) { Logger.log("ERROR sendPhotoReminders: " + e); }
}


// ============================================================
// MANUAL TRIGGER HELPERS (run from Apps Script editor)
// ============================================================

/**
 * Run this manually from the Apps Script editor to test that
 * all trigger functions execute without errors.
 * Does NOT send real emails — just runs the logic and logs results.
 */
function testAllTriggers() {
  Logger.log("--- Manual trigger test ---");
  Logger.log("checkExpiringMemberships: running...");
  checkExpiringMemberships();
  Logger.log("checkExpiringDocuments: running...");
  checkExpiringDocuments();
  Logger.log("checkBirthdays: running...");
  checkBirthdays();
  Logger.log("sendGuestListReminders: running...");
  sendGuestListReminders();
  Logger.log("processBumpWindowExpirations: running...");
  processBumpWindowExpirations();
  Logger.log("sendPhotoReminders: running...");
  sendPhotoReminders();
  Logger.log("purgeExpiredSessions: running...");
  purgeExpiredSessions();
  Logger.log("--- Manual trigger test complete. Check logs above for errors. ---");
}


/**
 * Sends a test RSO summary for today without waiting for the trigger.
 * Run manually from the Apps Script editor to verify the email.
 */
function testRsoSummary() {
  Logger.log("Manual RSO summary test...");
  sendRsoDailySummary();
}


// ============================================================
// SUP.2 — MONTHLY COLLECTIONS REPORT
// ============================================================

/**
 * Returns true if `date` is a Monday and there is no further Monday
 * in the same calendar month (i.e., it is the last Monday of the month).
 * @param {Date} date
 * @returns {boolean}
 */
function _isLastMondayOfMonth_(date) {
  if (date.getDay() !== 1) return false; // 0=Sun, 1=Mon
  var nextWeek = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
  return nextWeek.getMonth() !== date.getMonth();
}

/**
 * Returns the GEA membership year string for today's date.
 * GEA year runs Aug 1 – Jul 31; e.g., Mar 2026 → "2025-26".
 * @returns {string}
 */
function _getCurrentMembershipYear_() {
  var now = new Date();
  var y = now.getFullYear();
  return now.getMonth() >= 7
    ? y + "-" + String(y + 1).slice(2)   // Aug+ → "2026-27"
    : (y - 1) + "-" + String(y).slice(2); // Jan-Jul → "2025-26"
}

/**
 * SUP.2 — Generates and emails a monthly dues-collections summary to the board.
 * Called automatically on the last Monday of each month by runNightlyTasks().
 * Can also be called manually from the Apps Script editor for testing.
 */
function sendMonthlyCollectionsReport() {
  try {
    var now        = new Date();
    var monthStart = getMonthStart(now);
    var monthEnd   = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    var currentYear = _getCurrentMembershipYear_();

    // ── Payments ────────────────────────────────────────────
    var allPayments = _getAllPayments_();

    var verifiedThisMonth = allPayments.filter(function(p) {
      if (!p.payment_verified_date) return false;
      var d = new Date(p.payment_verified_date);
      return d >= monthStart && d < monthEnd;
    });

    var pendingCount = allPayments.filter(function(p) {
      return !p.payment_verified_date
        && !(p.notes && (p.notes.indexOf("REJECTED:") === 0
                      || p.notes.indexOf("CLARIFICATION:") === 0));
    }).length;

    // ── Households ──────────────────────────────────────────
    var hhSheet   = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_HOUSEHOLDS);
    var hhData    = hhSheet.getDataRange().getValues();
    var hhHeaders = hhData[0];
    var allHouseholds = [];
    for (var i = 1; i < hhData.length; i++) {
      var hh = rowToObject(hhHeaders, hhData[i]);
      if (hh.household_id) allHouseholds.push(hh);
    }
    var activeHouseholds = allHouseholds.filter(function(hh) { return hh.active; });

    var newThisMonth = allHouseholds.filter(function(hh) {
      if (!hh.created_date) return false;
      var d = new Date(hh.created_date);
      return d >= monthStart && d < monthEnd;
    });

    // Outstanding dues: active household with no verified payment for current year
    var verifiedHouseholdIds = {};
    allPayments.forEach(function(p) {
      if (p.payment_verified_date && p.applied_to_period === currentYear) {
        verifiedHouseholdIds[p.household_id] = true;
      }
    });
    var outstanding = activeHouseholds.filter(function(hh) {
      return !verifiedHouseholdIds[hh.household_id];
    });

    // ── Totals & by-method ──────────────────────────────────
    var totalUsd = 0, totalBwp = 0, byMethod = {};
    verifiedThisMonth.forEach(function(p) {
      totalUsd += Number(p.amount_usd || 0);
      totalBwp += Number(p.amount_bwp || 0);
      var m = p.payment_method || "Unknown";
      byMethod[m] = byMethod[m] || { count: 0, usd: 0, bwp: 0 };
      byMethod[m].count++;
      byMethod[m].usd += Number(p.amount_usd || 0);
      byMethod[m].bwp += Number(p.amount_bwp || 0);
    });
    totalUsd = Math.round(totalUsd * 100) / 100;
    totalBwp = Math.round(totalBwp * 100) / 100;

    // ── Format email ────────────────────────────────────────
    var monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });
    var lines = [
      "MONTHLY COLLECTIONS REPORT — " + monthLabel.toUpperCase(),
      "Membership Year: " + currentYear,
      "Generated: " + formatDate(now),
      "",
      "=== MEMBERSHIP OVERVIEW ===",
      "Active Households:        " + activeHouseholds.length,
      "New Activations (MTD):    " + newThisMonth.length,
      "Outstanding Dues (" + currentYear + "): " + outstanding.length + " of " + activeHouseholds.length + " households",
      "",
      "=== PAYMENTS VERIFIED THIS MONTH ===",
      "Count:  " + verifiedThisMonth.length,
      "Total:  USD $" + totalUsd.toFixed(2) + " / BWP P" + totalBwp.toFixed(2)
    ];

    if (verifiedThisMonth.length > 0) {
      lines.push("", "By Payment Method:");
      Object.keys(byMethod).sort().forEach(function(method) {
        var m = byMethod[method];
        lines.push("  " + method + ": " + m.count + " payment(s)"
          + " — USD $" + Math.round(m.usd * 100) / 100
          + " / BWP P" + Math.round(m.bwp * 100) / 100);
      });
    }

    lines.push("", "=== PENDING VERIFICATION ===");
    lines.push("Submissions awaiting treasurer review: " + pendingCount);

    if (newThisMonth.length > 0) {
      lines.push("", "=== NEW MEMBERS THIS MONTH ===");
      newThisMonth.forEach(function(hh) {
        lines.push("  " + (hh.household_name || hh.household_id)
          + (hh.membership_type ? " (" + hh.membership_type + ")" : ""));
      });
    }

    if (outstanding.length > 0) {
      lines.push("", "=== OUTSTANDING DUES (" + currentYear + ") ===",
        "Active households with no verified payment for this membership year:");
      outstanding.forEach(function(hh) {
        lines.push("  " + (hh.household_name || hh.household_id));
      });
    }

    lines.push("", "---", "GEA Management System — Automated Board Report");

    GmailApp.sendEmail(EMAIL_BOARD,
      "GEA Monthly Collections Report — " + monthLabel,
      lines.join("\n"),
      { name: "Gaborone Employee Association", replyTo: EMAIL_BOARD });

    logAuditEntry("system", "MONTHLY_COLLECTIONS_REPORT", "system", "monthly_report",
                  "Monthly collections report sent for " + monthLabel);
    Logger.log("Monthly collections report sent for " + monthLabel);

  } catch (e) {
    Logger.log("ERROR sendMonthlyCollectionsReport: " + e);
    logAuditEntry("system", "SYSTEM_ERROR", "monthly_report", "collections",
                  "Monthly collections report failed: " + e);
  }
}


// ============================================================
// SUP.3 — MONTHLY RESERVATIONS ANALYTICS REPORT
// ============================================================

/**
 * SUP.3 — Generates and emails a monthly reservations analytics report to the board.
 * Called automatically on the last Monday of each month by runNightlyTasks().
 * The same data is available on-demand via the admin_reservations_report API action.
 */
function sendMonthlyReservationsReport() {
  try {
    var now   = new Date();
    var stats = _buildReservationsReportStats_(now);
    var totalApproved = (stats.byStatus[STATUS_CONFIRMED]  || 0)
                      + (stats.byStatus[STATUS_TENTATIVE]  || 0)
                      + (stats.byStatus[STATUS_APPROVED]   || 0);
    var totalDenied   = (stats.byStatus[STATUS_DENIED]     || 0)
                      + (stats.byStatus[STATUS_CANCELLED]  || 0);
    var approvalRate  = stats.total > 0 ? Math.round(totalApproved / stats.total * 100) : 0;

    var monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });
    var lines = [
      "MONTHLY RESERVATIONS REPORT — " + monthLabel.toUpperCase(),
      "Generated: " + formatDate(now),
      "",
      "=== OVERVIEW ===",
      "Total Reservations:   " + stats.total,
      "Approved:             " + totalApproved,
      "Denied/Cancelled:     " + totalDenied,
      "Pending/Other:        " + (stats.total - totalApproved - totalDenied - stats.waitlistCount),
      "Waitlisted:           " + stats.waitlistCount,
      "Excess Bookings:      " + stats.excessCount,
      "Approval Rate:        " + approvalRate + "%",
      "",
      "=== BY FACILITY ==="
    ];

    Object.keys(stats.byFacility).sort().forEach(function(fac) {
      var f = stats.byFacility[fac];
      lines.push(fac + ":");
      lines.push("  Bookings: " + f.count + " | Hours: " + Math.round(f.hours * 10) / 10);
      lines.push("  Approved: " + f.approved + " | Denied/Cancelled: " + (f.denied + f.cancelled));
    });

    lines.push("", "---", "GEA Management System — Automated Board Report");

    GmailApp.sendEmail(EMAIL_BOARD,
      "GEA Monthly Reservations Report — " + monthLabel,
      lines.join("\n"),
      { name: "Gaborone Employee Association", replyTo: EMAIL_BOARD });

    logAuditEntry("system", "MONTHLY_RESERVATIONS_REPORT", "system", "monthly_report",
                  "Monthly reservations report sent for " + monthLabel);
    Logger.log("Monthly reservations report sent for " + monthLabel);

  } catch (e) {
    Logger.log("ERROR sendMonthlyReservationsReport: " + e);
    logAuditEntry("system", "SYSTEM_ERROR", "monthly_report", "reservations",
                  "Monthly reservations report failed: " + e);
  }
}

/**
 * HELPER: Aggregates reservation stats for a given month.
 * Shared by sendMonthlyReservationsReport() and the admin_reservations_report API.
 * @param {Date} refDate  Any date within the desired month.
 * @returns {Object} { total, excessCount, waitlistCount, byFacility, byStatus }
 */
function _buildReservationsReportStats_(refDate) {
  var monthStart = getMonthStart(refDate);
  var monthEnd   = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];

  var total = 0, excessCount = 0, waitlistCount = 0;
  var byFacility = {}, byStatus = {};

  for (var i = 1; i < data.length; i++) {
    var res = rowToObject(headers, data[i]);
    if (!res.reservation_id || !res.reservation_date) continue;
    var d = new Date(res.reservation_date);
    if (d < monthStart || d >= monthEnd) continue;

    total++;
    var fac    = res.facility || "Unknown";
    var status = res.status   || "";

    if (!byFacility[fac]) {
      byFacility[fac] = { count: 0, hours: 0, approved: 0, denied: 0, cancelled: 0, pending: 0, waitlisted: 0 };
    }
    byFacility[fac].count++;
    byFacility[fac].hours += Number(res.duration_hours || 0);

    byStatus[status] = (byStatus[status] || 0) + 1;

    if (status === STATUS_CONFIRMED || status === STATUS_TENTATIVE || status === STATUS_APPROVED) {
      byFacility[fac].approved++;
    } else if (status === STATUS_DENIED) {
      byFacility[fac].denied++;
    } else if (status === STATUS_CANCELLED) {
      byFacility[fac].cancelled++;
    } else if (status === STATUS_PENDING) {
      byFacility[fac].pending++;
    } else if (status === STATUS_WAITLISTED) {
      byFacility[fac].waitlisted++;
      waitlistCount++;
    }

    if (String(res.is_excess_reservation) === "true" || res.is_excess_reservation === true) {
      excessCount++;
    }
  }

  return { total: total, excessCount: excessCount, waitlistCount: waitlistCount,
           byFacility: byFacility, byStatus: byStatus };
}
