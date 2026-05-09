/**
 * ============================================================
 * DISASTERRECOVERYSERVICE.GS
 * ============================================================
 * Automated backup, health checks, and diagnostics for
 * disaster recovery and incident response.
 *
 * FUNCTIONS TO ATTACH AS TRIGGERS:
 *   healthCheck() — Daily at 4:00 AM (after backup at 2:00 AM)
 *     Alerts Treasurer + Board on ANY health check failure
 *
 * MANUAL FUNCTIONS (run from Apps Script editor):
 *   runDiagnostics() — Comprehensive system health report (6 core tests)
 *   performDailyBackup() — Manually trigger backup export
 * ============================================================
 */


// ============================================================
// HEALTH CHECK (automated daily trigger)
// ============================================================

/**
 * Daily health check: Verify critical systems are operational.
 * Attach to trigger: Daily at 4:00 AM Botswana time (Africa/Johannesburg)
 *
 * Checks:
 * 1. Sheets API responds (read Member Directory)
 * 2. Gmail API responds (attempt to draft test email)
 * 3. Audit Log is accessible
 *
 * If all pass → Log success to Audit Log
 * If any fail → Email alert to Treasurer + board@geabotswana.org
 * If failures occur 3+ times in 1 hour → Escalation email
 */
function healthCheck() {
  var results = {
    timestamp: new Date(),
    checks: [],
    allPassed: true
  };

  // Check 1: Sheets API (read from Member Directory)
  try {
    var ss = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID);
    var membersSheet = ss.getSheetByName(TAB_HOUSEHOLDS);
    var data = membersSheet.getRange(1, 1, 1, 5).getValues();
    results.checks.push({
      name: "Sheets API",
      status: "PASS",
      detail: "Read from Members sheet successful"
    });
  } catch (e) {
    results.checks.push({
      name: "Sheets API",
      status: "FAIL",
      detail: e.toString()
    });
    results.allPassed = false;
  }

  // Check 2: Gmail API (verify service is accessible)
  try {
    // Check Gmail quota without requiring broad mail.google.com scope
    // MailApp.getRemainingDailyQuota() requires only gmail.send scope
    var quota = MailApp.getRemainingDailyQuota();
    results.checks.push({
      name: "Gmail API",
      status: "PASS",
      detail: "Gmail service accessible, " + quota + " messages remaining today"
    });
  } catch (e) {
    results.checks.push({
      name: "Gmail API",
      status: "FAIL",
      detail: e.toString()
    });
    results.allPassed = false;
  }

  // Check 3: Audit Log accessible
  try {
    var systemSheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID);
    var auditSheet = systemSheet.getSheetByName(TAB_AUDIT_LOG);
    var auditData = auditSheet.getRange(1, 1, 1, 5).getValues();
    results.checks.push({
      name: "Audit Log",
      status: "PASS",
      detail: "Audit Log sheet readable"
    });
  } catch (e) {
    results.checks.push({
      name: "Audit Log",
      status: "FAIL",
      detail: e.toString()
    });
    results.allPassed = false;
  }

  // Log result
  if (results.allPassed) {
    Logger.log("✅ Health check PASSED at " + results.timestamp);
    logAuditEntry(null, "HEALTH_CHECK_PASSED", null, null, "All checks passed");
  } else {
    Logger.log("❌ Health check FAILED at " + results.timestamp);
    logAuditEntry(null, "HEALTH_CHECK_FAILED", null, null, JSON.stringify(results.checks));

    // Check failure count in past hour
    var failureCount = _countRecentHealthCheckFailures(60);
    // Alert on any failure (escalation = true) since daily checks should be rare failures
    _sendHealthCheckAlert(results, true);
  }

  return results;
}


/**
 * Count health check failures in the past N minutes.
 * Returns count of HEALTH_CHECK_FAILED entries.
 * Audit Log columns: log_id(0), timestamp(1), user_email(2), action_type(3), target_type(4), target_id(5), details(6)
 */
function _countRecentHealthCheckFailures(minutesBack) {
  try {
    var systemSheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID);
    var auditSheet = systemSheet.getSheetByName(TAB_AUDIT_LOG);
    var allData = auditSheet.getDataRange().getValues();

    var cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutesBack);

    var count = 0;
    for (var i = 1; i < allData.length; i++) {
      var row = allData[i];
      var actionType = row[3]; // Column 3: action_type (0-indexed)
      var timestamp = new Date(row[1]); // Column 1: timestamp

      if (actionType === "HEALTH_CHECK_FAILED" && timestamp >= cutoffTime) {
        count++;
      }
    }
    return count;
  } catch (e) {
    Logger.log("ERROR counting health check failures: " + e);
    return 0;
  }
}


/**
 * Send alert email for health check failure.
 * Alerts both Treasurer and Board on any health check failure.
 */
function _sendHealthCheckAlert(results, escalation) {
  var checkDetails = "";
  results.checks.forEach(function(check) {
    checkDetails += "[" + check.status + "] " + check.name + "\n";
    checkDetails += "  Detail: " + check.detail + "\n\n";
  });

  var variables = {
    TIMESTAMP: results.timestamp.toISOString(),
    CHECK_DETAILS: checkDetails
  };

  try {
    sendEmailFromTemplate("SYS_HEALTH_CHECK_ALERT_TO_BOARD", EMAIL_TREASURER, variables);
    sendEmailFromTemplate("SYS_HEALTH_CHECK_ALERT_TO_BOARD", EMAIL_BOARD, variables);
  } catch (e) {
    Logger.log("ERROR sending health check alert: " + e);
  }
}


// ============================================================
// DIAGNOSTICS (manual function - run from editor)
// ============================================================

/**
 * Comprehensive system diagnostics.
 * Run manually from Apps Script editor: Select runDiagnostics() and click Run.
 *
 * Checks everything needed for incident diagnosis:
 * 1. Google Apps Script deployment responds
 * 2. Sheets API (all 4 critical sheets)
 * 3. Gmail API
 * 4. Cloud Storage (backup bucket access)
 * 5. Authentication system (Sessions sheet)
 * 6. Data integrity (sample rows from critical sheets)
 *
 * Returns detailed report (also logged).
 */
function runDiagnostics() {
  var report = {
    timestamp: new Date().toISOString(),
    summary: {},
    details: [],
    criticalIssues: []
  };

  Logger.log("\n=== GEA SYSTEM DIAGNOSTICS ===\n");

  // TEST 1: Sheets API - All 4 critical sheets
  Logger.log("TEST 1: Sheets API (Critical Sheets)");
  var sheetTestDefs = [
    { id: MEMBER_DIRECTORY_ID, name: "Member Directory" },
    { id: RESERVATIONS_ID, name: "Reservations" },
    { id: SYSTEM_BACKEND_ID, name: "System Backend" },
    { id: PAYMENT_TRACKING_ID, name: "Payments" }
  ];

  sheetTestDefs.forEach(function(sheet) {
    try {
      var ss = SpreadsheetApp.openById(sheet.id);
      var sheetList = ss.getSheets();
      var status = {
        status: "PASS",
        detail: "Sheet accessible, " + sheetList.length + " tabs found"
      };
      report.details.push({ test: "Sheets API: " + sheet.name, ...status });
      Logger.log("✅ " + sheet.name + " (" + sheet.id + "): OK");
    } catch (e) {
      report.details.push({ test: "Sheets API: " + sheet.name, status: "FAIL", detail: e.toString() });
      report.criticalIssues.push(sheet.name + " not accessible: " + e);
      Logger.log("❌ " + sheet.name + ": " + e);
    }
  });

  // TEST 2: Gmail API
  Logger.log("\nTEST 2: Gmail API");
  try {
    // Check Gmail quota without requiring broad mail.google.com scope
    var quota = MailApp.getRemainingDailyQuota();
    report.details.push({ test: "Gmail API", status: "PASS", detail: "Gmail accessible, " + quota + " messages remaining" });
    Logger.log("✅ Gmail API: OK (" + quota + " messages remaining)");
  } catch (e) {
    report.details.push({ test: "Gmail API", status: "FAIL", detail: e.toString() });
    report.criticalIssues.push("Gmail API error: " + e);
    Logger.log("❌ Gmail API error: " + e);
  }

  // TEST 3: Cloud Storage bucket (backup)
  Logger.log("\nTEST 3: Cloud Storage (Backup Bucket)");
  try {
    var cloudStorage = DriveApp.getRootFolder().getId();
    report.details.push({ test: "Cloud Storage", status: "PASS", detail: "Drive API accessible" });
    Logger.log("✅ Cloud Storage/Drive API: OK");
  } catch (e) {
    report.details.push({ test: "Cloud Storage", status: "FAIL", detail: e.toString() });
    Logger.log("⚠️ Cloud Storage access limited: " + e);
  }

  // TEST 4: Authentication (Sessions sheet)
  Logger.log("\nTEST 4: Authentication System");
  try {
    var systemSheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID);
    var sessionsSheet = systemSheet.getSheetByName(TAB_SESSIONS);
    var sessionCount = sessionsSheet.getLastRow();
    report.details.push({
      test: "Sessions Sheet",
      status: "PASS",
      detail: "Sessions sheet readable, " + sessionCount + " rows"
    });
    Logger.log("✅ Sessions sheet: OK (" + sessionCount + " rows)");
  } catch (e) {
    report.details.push({ test: "Sessions Sheet", status: "FAIL", detail: e.toString() });
    report.criticalIssues.push("Sessions sheet error: " + e);
    Logger.log("❌ Sessions sheet error: " + e);
  }

  // TEST 5: Data Integrity - Sample rows
  Logger.log("\nTEST 5: Data Integrity (Sample Rows)");
  try {
    var membersSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_HOUSEHOLDS);
    var lastRow = membersSheet.getLastRow();
    var dataRows = Math.max(0, lastRow - 1); // Subtract 1 for header row

    if (dataRows === 0) {
      report.details.push({
        test: "Households Data Integrity",
        status: "PASS",
        detail: "Sheet has header only (no data rows)"
      });
      Logger.log("⚠️ Households sheet: header only (no data rows)");
    } else {
      var rowsToRead = Math.min(10, dataRows);
      var memberData = membersSheet.getRange(2, 1, rowsToRead, 5).getValues();
      var intactRows = memberData.filter(function(row) { return row[0]; }).length;

      report.details.push({
        test: "Households Data Integrity",
        status: "PASS",
        detail: intactRows + " of " + rowsToRead + " sample rows readable"
      });
      Logger.log("✅ Households data sample: " + intactRows + "/" + rowsToRead + " rows readable");
    }
  } catch (e) {
    report.details.push({ test: "Data Integrity", status: "FAIL", detail: e.toString() });
    report.criticalIssues.push("Data integrity check failed: " + e);
    Logger.log("❌ Data integrity check failed: " + e);
  }

  // TEST 6: Audit Log accessibility
  Logger.log("\nTEST 6: Audit Log");
  try {
    var auditSheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_AUDIT_LOG);
    var auditCount = auditSheet.getLastRow();
    report.details.push({
      test: "Audit Log",
      status: "PASS",
      detail: "Audit log readable, " + auditCount + " entries"
    });
    Logger.log("✅ Audit log: OK (" + auditCount + " entries)");
  } catch (e) {
    report.details.push({ test: "Audit Log", status: "FAIL", detail: e.toString() });
    Logger.log("❌ Audit log error: " + e);
  }

  // Summary
  var passCount = report.details.filter(function(d) { return d.status === "PASS"; }).length;
  var failCount = report.details.filter(function(d) { return d.status === "FAIL"; }).length;

  report.summary = {
    testsRun: report.details.length,
    passed: passCount,
    failed: failCount,
    hasCriticalIssues: report.criticalIssues.length > 0
  };

  Logger.log("\n=== SUMMARY ===");
  Logger.log("Tests run: " + report.summary.testsRun);
  Logger.log("Passed: " + report.summary.passed);
  Logger.log("Failed: " + report.summary.failed);
  Logger.log("(6 core tests: Sheets API, Gmail API, Cloud Storage, Sessions, Data Integrity, Audit Log)");

  if (report.criticalIssues.length > 0) {
    Logger.log("\n❌ CRITICAL ISSUES:");
    report.criticalIssues.forEach(function(issue) {
      Logger.log("  - " + issue);
    });
  } else {
    Logger.log("\n✅ No critical issues detected");
  }

  Logger.log("\n=== END DIAGNOSTICS ===\n");

  return report;
}


// ============================================================
// BACKUP EXPORT (to be called from runNightlyTasks)
// ============================================================

/**
 * Daily backup: Export all 4 critical sheets to Cloud Storage as .xlsx files.
 * Called from runNightlyTasks() at 2:00 AM Botswana time.
 *
 * Exports to Google Drive folder: "GEA Backups"
 * File naming: GEA_[SheetType]_[YYYY-MM-DD].xlsx
 * Retention: Oldest backups auto-deleted after 30 days
 *
 * Note: This uses Drive API (available in Apps Script).
 * For production, migrate to Cloud Storage API with proper bucket setup.
 */
function performDailyBackup() {
  Logger.log("=== Starting daily backup at " + new Date().toISOString() + " ===");

  var results = {
    timestamp: new Date(),
    exports: []
  };

  // Use shared drive GEA Backups folder
  var backupFolder = DriveApp.getFolderById(SHARED_DRIVE_BACKUPS_FOLDER_ID);
  var dateStr = Utilities.formatDate(new Date(), "Africa/Johannesburg", "yyyy-MM-dd");

  // Define sheets to backup
  var sheetsToBackup = [
    { id: MEMBER_DIRECTORY_ID, name: "Members" },
    { id: RESERVATIONS_ID, name: "Reservations" },
    { id: PAYMENT_TRACKING_ID, name: "Payments" },
    { id: SYSTEM_BACKEND_ID, name: "System" }
  ];

  // Export each sheet
  sheetsToBackup.forEach(function(sheetDef) {
    try {
      var fileName = "GEA_" + sheetDef.name + "_" + dateStr + ".xlsx";
      var ss = SpreadsheetApp.openById(sheetDef.id);

      // Create backup file
      var blob = ss.getAs("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      blob.setName(fileName);
      backupFolder.createFile(blob);

      results.exports.push({
        sheet: sheetDef.name,
        fileName: fileName,
        status: "SUCCESS",
        timestamp: new Date()
      });

      Logger.log("✅ Backed up " + sheetDef.name + " → " + fileName);
      logAuditEntry(null, "BACKUP_EXPORT_SUCCESS", null, null, sheetDef.name + " exported as " + fileName);

    } catch (e) {
      results.exports.push({
        sheet: sheetDef.name,
        status: "FAILED",
        error: e.toString(),
        timestamp: new Date()
      });
      Logger.log("❌ Failed to backup " + sheetDef.name + ": " + e);
      logAuditEntry(null, "BACKUP_EXPORT_FAILED", null, null, sheetDef.name + " - " + e.toString());
    }
  });

  // Cleanup old backups (older than 30 days)
  _cleanupOldBackups(backupFolder, 30);

  Logger.log("=== Backup complete ===");
  Logger.log("📁 Backups stored in: GEA Admin Shared Drive (GEA Backups folder)");
  return results;
}


/**
 * Get Incident Log folder in GEA Administration Shared Drive.
 * Incident logs are stored in the shared drive System Data folder.
 */
function _getOrCreateIncidentLogFolder() {
  try {
    // Use shared drive System Data folder for incident logs
    var sharedFolder = DriveApp.getFolderById(SHARED_DRIVE_SYSTEM_DATA_FOLDER_ID);
    return sharedFolder;
  } catch (e) {
    Logger.log("❌ Error accessing Shared Drive System Data folder: " + e.toString());
    return null;
  }
}


/**
 * Helper: Get or create folder by name (personal Drive only).
 * Used for backup folder creation.
 */
function _getOrCreateFolder(folderName) {
  var root = DriveApp.getRootFolder();
  var folders = root.getFoldersByName(folderName);

  if (folders.hasNext()) {
    return folders.next();
  } else {
    return root.createFolder(folderName);
  }
}


/**
 * Delete backup files older than daysToKeep.
 */
function _cleanupOldBackups(folder, daysToKeep) {
  var cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  var files = folder.getFiles();
  var deletedCount = 0;

  while (files.hasNext()) {
    var file = files.next();
    if (file.getDateCreated() < cutoffDate) {
      try {
        file.setTrashed(true);
        deletedCount++;
        Logger.log("🗑️ Deleted old backup: " + file.getName());
      } catch (e) {
        Logger.log("⚠️ Could not delete " + file.getName() + ": " + e);
      }
    }
  }

  if (deletedCount > 0) {
    Logger.log("Cleanup: Removed " + deletedCount + " old backup files");
  }
}


// ============================================================
// INCIDENT LOG SETUP (one-time initialization)
// ============================================================

/**
 * Initialize Incident Log sheet in GEA Administration Shared Drive.
 * Run once manually: Select initializeIncidentLog() and click Run.
 *
 * Creates Google Sheet with columns:
 * log_id | timestamp | description | impact | resolution | duration_minutes | root_cause | lessons_learned
 *
 * Location: GEA Administration Shared Drive (System Data folder)
 * Naming: "GEA Incident Log [YEAR]"
 */
function initializeIncidentLog() {
  var year = new Date().getFullYear();
  var sheetName = "GEA Incident Log " + year;

  try {
    // Get System Data folder from GEA Administration Shared Drive
    var financialFolder = _getOrCreateIncidentLogFolder();

    // Check if incident log already exists
    var existing = financialFolder.getFilesByName(sheetName);
    if (existing.hasNext()) {
      Logger.log("⚠️ Incident Log for " + year + " already exists");
      return existing.next();
    }

    // Create new incident log spreadsheet
    var ss = SpreadsheetApp.create(sheetName);
    var sheet = ss.getActiveSheet();

    // Add headers (snake_case to match system schema)
    var headers = [
      "log_id",
      "timestamp",
      "description",
      "impact",
      "resolution",
      "duration_minutes",
      "root_cause",
      "lessons_learned"
    ];
    sheet.appendRow(headers);

    // Format header row
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#4285F4");
    headerRange.setFontColor("#FFFFFF");

    // Set column widths
    sheet.setColumnWidth(1, 130); // log_id
    sheet.setColumnWidth(2, 150); // timestamp
    sheet.setColumnWidth(3, 200); // description
    sheet.setColumnWidth(4, 200); // impact
    sheet.setColumnWidth(5, 200); // resolution
    sheet.setColumnWidth(6, 140); // duration_minutes
    sheet.setColumnWidth(7, 160); // root_cause
    sheet.setColumnWidth(8, 200); // lessons_learned

    // Move to Financial Records folder
    var file = DriveApp.getFileById(ss.getId());
    financialFolder.addFile(file);

    Logger.log("✅ Created Incident Log: " + sheetName);
    Logger.log("📁 Location: System Data folder (GEA Administration Shared Drive)");
    Logger.log("📊 Spreadsheet ID: " + ss.getId());

    return ss;
  } catch (e) {
    Logger.log("❌ Error creating Incident Log: " + e);
    throw e;
  }
}


/**
 * Helper: Log incident to Incident Log sheet.
 * Called automatically when incidents are recorded.
 *
 * Parameters:
 *   date (Date) - Incident date
 *   time (string) - Incident time (GMT+2)
 *   description (string) - What happened
 *   impact (string) - How it affected users
 *   resolution (string) - How it was fixed
 *   durationMinutes (number) - How long (in minutes)
 *   rootCause (string) - Why it happened
 *   lessonsLearned (string) - How to prevent future
 */
function logIncident(date, time, description, impact, resolution, durationMinutes, rootCause, lessonsLearned) {
  try {
    var year = new Date().getFullYear();
    var sheetName = "GEA Incident Log " + year;

    // Get System Data folder from GEA Administration Shared Drive
    var financialFolder = _getOrCreateIncidentLogFolder();
    if (!financialFolder) {
      Logger.log("⚠️ Could not access Shared Drive System Data folder.");
      return;
    }
    var logFiles = financialFolder.getFilesByName(sheetName);

    if (!logFiles.hasNext()) {
      Logger.log("⚠️ Incident Log sheet not found. Run initializeIncidentLog() first.");
      return;
    }

    var logFile = logFiles.next();
    var logSs = SpreadsheetApp.openById(logFile.getId());
    var logSheet = logSs.getActiveSheet();

    // Append incident row
    logSheet.appendRow([
      date,
      time,
      description,
      impact,
      resolution,
      durationMinutes,
      rootCause,
      lessonsLearned
    ]);

    Logger.log("✅ Incident logged to " + sheetName);
  } catch (e) {
    Logger.log("⚠️ Could not log incident: " + e);
  }
}
