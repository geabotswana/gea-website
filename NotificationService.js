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
  sendEmail("tpl_027", EMAIL_BOARD, {
    CURRENT_YEAR: currentYear,
    NEXT_YEAR:    currentYear + 1
  });
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

      sendEmail("tpl_016", m.email, {
        FIRST_NAME:              m.first_name,
        IF_FAMILY_MISSING_PHOTOS: missingPhotos.length > 1 ? "true" : "",
        MISSING_PHOTOS_LIST:     missingList
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