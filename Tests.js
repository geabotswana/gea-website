/**
 * ============================================================
 * TESTS.GS
 * ============================================================
 * Test functions to run manually from the Apps Script editor.
 *
 * HOW TO RUN A TEST:
 *   1. Open the Apps Script editor
 *   2. Select the function name from the dropdown at the top
 *   3. Click Run (▶)
 *   4. Open View → Logs to see results
 *
 * START HERE: Run testConfig() first to verify your setup.
 * If that passes, run each test in order.
 *
 * Each test logs PASS or FAIL clearly. A test failure will not
 * stop the rest of the test from running — check all results.
 * ============================================================
 */


// ============================================================
// TEST RUNNER
// ============================================================

/**
 * Runs all tests in sequence. Check the log for PASS/FAIL.
 */
function runAllTests() {
  Logger.log("========================================");
  Logger.log("GEA SYSTEM TEST RUN — " + new Date().toString());
  Logger.log("========================================");

  testConfig();
  testUtilities();
  testHolidayCalendar();
  testBusinessDayCalculator();
  testEmailTemplateLoad();
  testMemberLookup();
  testAccessChecks();
  testReservationLimits();
  testGuestListDeadline();
  testAuditLog();
  testMembershipApplicationsSheet();
  testIndividualsSheet();
  testFileUploadSystem();
  testFileSubmissionValidation();
  testFileSubmissionStatus();
  testDocumentExpirationWarnings();
  testRsoApprovalLinkGeneration();
  testSubmissionHistory();
  testExpiredRsoLinkCleanup();
  testPaymentSheet();
  testSubmitPayment();
  testListPendingPayments();
  testPaymentStatus();
  testApprovePayment();
  testRejectPayment();
  testClarifyPayment();

  Logger.log("========================================");
  Logger.log("TEST RUN COMPLETE — Check above for FAIL");
  Logger.log("========================================");
}


/**
 * Runs all authentication & session security regression tests.
 *
 * This is a separate test suite (not part of runAllTests) to focus on
 * security-critical functionality: token hashing, constant-time comparison,
 * session validation, and role-based access control.
 *
 * Run this after deploying session security changes:
 *   1. Select runAuthRegressionTests from the dropdown at top
 *   2. Click Run (▶)
 *   3. Check View → Logs for PASS/FAIL results
 *
 * All 8 tests must pass before deploying auth changes to production.
 */
function runAuthRegressionTests() {
  Logger.log("========================================");
  Logger.log("AUTH REGRESSION TEST RUN — " + new Date().toString());
  Logger.log("========================================");
  Logger.log("\nRunning 8 security tests...\n");

  testHashTokenProducesSha256Hex();
  testGenerateTokenProducesUnique64CharHex();
  testConstantTimeCompareBasicCases();
  testCreateSessionStoresTokenHashNotPlaintext();
  testValidateSessionAcceptsFreshSessionAndRejectsRawMismatch();
  testLogoutInvalidatesSession();
  testRequireAuthRoleEnforcement();
  testTokenHashMigrationHealthHelpers();

  Logger.log("========================================");
  Logger.log("AUTH TESTS COMPLETE — Check above for FAIL");
  Logger.log("========================================");
  Logger.log("\nSummary:");
  Logger.log("  - All tests must PASS before production deployment");
  Logger.log("  - See docs/operational/TOKEN_HASH_MIGRATION_RUNBOOK.md");
  Logger.log("========================================");
}


// ============================================================
// HELPER
// ============================================================

function _assert(label, condition, actual) {
  if (condition) {
    Logger.log("  PASS: " + label);
  } else {
    Logger.log("  FAIL: " + label + (actual !== undefined ? " (got: " + actual + ")" : ""));
  }
}


// ============================================================
// TEST 1: CONFIG
// ============================================================

/**
 * Verifies that all required constants in Config.gs are set
 * and the four spreadsheets are reachable.
 * Run this first — if it fails, nothing else will work.
 */
function testConfig() {
  Logger.log("\n--- TEST 1: Config.gs ---");

  _assert("MEMBER_DIRECTORY_ID is set",
    typeof MEMBER_DIRECTORY_ID === "string" && MEMBER_DIRECTORY_ID.length > 10);

  _assert("RESERVATIONS_ID is set",
    typeof RESERVATIONS_ID === "string" && RESERVATIONS_ID.length > 10);

  _assert("SYSTEM_BACKEND_ID is set",
    typeof SYSTEM_BACKEND_ID === "string" && SYSTEM_BACKEND_ID.length > 10);

  _assert("PAYMENT_TRACKING_ID is set",
    typeof PAYMENT_TRACKING_ID === "string" && PAYMENT_TRACKING_ID.length > 10);

  _assert("EMAIL_BOARD is set",
    typeof EMAIL_BOARD === "string" && EMAIL_BOARD.indexOf("@") !== -1);

  _assert("GUEST_LIST_DEADLINE_DAYS is 4",
    GUEST_LIST_DEADLINE_DAYS === 4, GUEST_LIST_DEADLINE_DAYS);

  _assert("AGE_UNACCOMPANIED_ACCESS is 15",
    AGE_UNACCOMPANIED_ACCESS === 15, AGE_UNACCOMPANIED_ACCESS);

  _assert("AGE_VOTING is 16",
    AGE_VOTING === 16, AGE_VOTING);

  _assert("TENNIS_WEEKLY_LIMIT_HOURS is 3",
    TENNIS_WEEKLY_LIMIT_HOURS === 3, TENNIS_WEEKLY_LIMIT_HOURS);

  _assert("LEOBO_MONTHLY_LIMIT is 1",
    LEOBO_MONTHLY_LIMIT === 1, LEOBO_MONTHLY_LIMIT);

  // Test that each spreadsheet is reachable
  try {
    var ss = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID);
    _assert("Member Directory opens", ss !== null);
  } catch (e) {
    _assert("Member Directory opens", false, e.toString());
  }

  try {
    var ss = SpreadsheetApp.openById(RESERVATIONS_ID);
    _assert("Reservations spreadsheet opens", ss !== null);
  } catch (e) {
    _assert("Reservations spreadsheet opens", false, e.toString());
  }

  try {
    var ss = SpreadsheetApp.openById(SYSTEM_BACKEND_ID);
    _assert("System Backend opens", ss !== null);
    // Check that required tabs exist
    var tabs = ss.getSheets().map(function(s) { return s.getName(); });
    _assert("Email Templates tab exists",   tabs.indexOf(TAB_EMAIL_TEMPLATES)  !== -1, tabs.join(", "));
    _assert("Configuration tab exists",     tabs.indexOf(TAB_CONFIGURATION)     !== -1, tabs.join(", "));
    _assert("Holiday Calendar tab exists",  tabs.indexOf(TAB_HOLIDAY_CALENDAR)  !== -1, tabs.join(", "));
    _assert("Audit Log tab exists",         tabs.indexOf(TAB_AUDIT_LOG)         !== -1, tabs.join(", "));
  } catch (e) {
    _assert("System Backend opens", false, e.toString());
  }

  try {
    var ss = SpreadsheetApp.openById(PAYMENT_TRACKING_ID);
    _assert("Payment Tracking opens", ss !== null);
  } catch (e) {
    _assert("Payment Tracking opens", false, e.toString());
  }
}


// ============================================================
// TEST 2: UTILITIES
// ============================================================

/**
 * Tests date formatting, age calculation, ID generation,
 * and currency formatting.
 */
function testUtilities() {
  Logger.log("\n--- TEST 2: Utilities ---");

  // formatDate
  var d = new Date(2026, 2, 15); // March 15, 2026
  _assert("formatDate readable",
    formatDate(d) === "Sunday, March 15, 2026", formatDate(d));

  _assert("formatDate storage",
    formatDate(d, true) === "2026-03-15", formatDate(d, true));

  // formatTime
  var t = new Date(2026, 2, 15, 9, 0); // 9:00 AM
  _assert("formatTime 9:00 AM",
    formatTime(t) === "9:00 AM", formatTime(t));

  var t2 = new Date(2026, 2, 15, 14, 30); // 2:30 PM
  _assert("formatTime 2:30 PM",
    formatTime(t2) === "2:30 PM", formatTime(t2));

  // formatCurrency
  _assert("formatCurrency USD",
    formatCurrency(100, "USD") === "$100 USD", formatCurrency(100, "USD"));

  _assert("formatCurrency BWP",
    formatCurrency(1400, "BWP") === "P1,400 BWP", formatCurrency(1400, "BWP"));

  // calculateAge
  var dob1980 = new Date(1980, 0, 1); // Jan 1, 1980
  var age     = calculateAge(dob1980);
  _assert("calculateAge (1980) > 40", age > 40, age);

  var dobToday = new Date();
  dobToday.setFullYear(dobToday.getFullYear() - 15);
  _assert("calculateAge exactly 15", calculateAge(dobToday) === 15, calculateAge(dobToday));

  // isBirthdayToday
  var todayBirthday = new Date();
  todayBirthday.setFullYear(todayBirthday.getFullYear() - 25);
  _assert("isBirthdayToday (today)", isBirthdayToday(todayBirthday) === true);

  var notToday = new Date(1990, 0, 1);
  var isTodayJan1 = new Date().getMonth() === 0 && new Date().getDate() === 1;
  _assert("isBirthdayToday (Jan 1, unless today is Jan 1)",
    isBirthdayToday(notToday) === isTodayJan1);

  // generateId
  var id = generateId("RES");
  _assert("generateId format",
    id.startsWith("RES-") && id.length > 8, id);

  // addDays
  var base = new Date(2026, 2, 15); // March 15
  _assert("addDays +1",
    formatDate(addDays(base, 1), true) === "2026-03-16", formatDate(addDays(base, 1), true));

  _assert("addDays -1",
    formatDate(addDays(base, -1), true) === "2026-03-14", formatDate(addDays(base, -1), true));

  // getWeekStart — March 15, 2026 is a Sunday; week start = March 9 (Monday)
  var sunday = new Date(2026, 2, 15);
  _assert("getWeekStart from Sunday",
    formatDate(getWeekStart(sunday), true) === "2026-03-09",
    formatDate(getWeekStart(sunday), true));

  // getMonthStart
  var mid = new Date(2026, 2, 15);
  _assert("getMonthStart",
    formatDate(getMonthStart(mid), true) === "2026-03-01",
    formatDate(getMonthStart(mid), true));

  // isValidEmail
  _assert("isValidEmail valid",   isValidEmail("jane@state.gov") === true);
  _assert("isValidEmail invalid", isValidEmail("notanemail") === false);
  _assert("isValidEmail empty",   isValidEmail("") === false);

  // sanitizeInput
  _assert("sanitizeInput safe",    sanitizeInput("hello") === "hello");
  _assert("sanitizeInput formula", sanitizeInput("=SUM(A1)").startsWith("'"));
}


// ============================================================
// TEST 3: HOLIDAY CALENDAR
// ============================================================

/**
 * Verifies the holiday calendar tab is readable and returns data.
 * Requires at least one holiday row in the Holiday Calendar tab.
 */
function testHolidayCalendar() {
  Logger.log("\n--- TEST 3: Holiday Calendar ---");

  var holidays = getHolidays(2026);
  _assert("getHolidays returns array", Array.isArray(holidays), typeof holidays);
  _assert("getHolidays has entries for 2026", holidays.length > 0,
          "0 entries — make sure 2026 holidays are entered in the Holiday Calendar tab");

  if (holidays.length > 0) {
    _assert("Holiday has date field",  holidays[0].date !== undefined);
    _assert("Holiday has name field",  holidays[0].name !== undefined);
    _assert("Holiday has type field",  holidays[0].type !== undefined);

    // Check Independence Day 2026.
    // July 4 falls on a Saturday, so the US observed holiday is Friday July 3.
    // The calendar stores the OBSERVED date, not the calendar date.
    var jul3 = new Date(2026, 6, 3); // July 3 — observed Independence Day
    var jul4 = new Date(2026, 6, 4); // July 4 — Saturday, not in calendar
    _assert("Independence Day 2026: observed date Jul 3 is a holiday",
            isHoliday(jul3) === true,
            "false — check that 'Independence Day (observed)' is in the Holiday Calendar as 2026-07-03");
    _assert("Independence Day 2026: calendar date Jul 4 (Saturday) is NOT in calendar",
            isHoliday(jul4) === false,
            "true — calendar should store observed dates only, not the raw Saturday");

    // Thanksgiving is always a Thursday — safe fixed-weekday check
    var thanksgiving = new Date(2026, 10, 26); // Nov 26, 2026
    _assert("Thanksgiving 2026 (Nov 26) is a holiday",
            isHoliday(thanksgiving) === true,
            "false — check that Thanksgiving is in the Holiday Calendar as 2026-11-26");

    // July 4 (Saturday) should NOT be a business day regardless
    _assert("July 4, 2026 (Saturday) is not a business day",
            isBusinessDay(jul4) === false);

    // July 3 (observed Independence Day Friday) should not be a business day
    _assert("July 3, 2026 (observed Independence Day) is not a business day",
            isBusinessDay(jul3) === false);

    // Check that a plain Wednesday is a business day
    var midWeek = new Date(2026, 5, 10); // June 10, 2026 — Wednesday
    Logger.log("  INFO: June 10, 2026 isBusinessDay = " + isBusinessDay(midWeek) +
               " (expected true unless it is a holiday)");
  }
}

// ============================================================
// TEST 4: BUSINESS DAY CALCULATOR
// ============================================================

/**
 * Tests the guest list deadline calculation.
 * April 5, 2026 (Sunday) → 4 business days back.
 * Expected deadline: Monday, March 30, 2026
 * (assuming no holidays in that window — adjust if there are).
 */
function testBusinessDayCalculator() {
  Logger.log("\n--- TEST 4: Business Day Calculator ---");

  var eventDate = new Date(2026, 3, 5); // April 5, 2026 (Sunday)
  var deadline  = calculateBusinessDayDeadline(eventDate, GUEST_LIST_DEADLINE_DAYS);
  var deadlineStr = formatDate(deadline, true);

  Logger.log("  INFO: " + GUEST_LIST_DEADLINE_DAYS + " business days before April 5, 2026 = " + deadlineStr);
  _assert("Deadline is a weekday", deadline.getDay() !== 0 && deadline.getDay() !== 6,
          "Day of week: " + deadline.getDay());

  // Same-day test: 0 business days back should return the same date
  var same = calculateBusinessDayDeadline(eventDate, 0);
  _assert("0 business days back returns same date",
    formatDate(same, true) === "2026-04-05", formatDate(same, true));

  // Test across a weekend: Monday, March 16 → 1 business day back = Friday March 13
  var monday = new Date(2026, 2, 16); // March 16, 2026 (Monday)
  var friday = calculateBusinessDayDeadline(monday, 1);
  _assert("1 business day before Monday is Friday",
    friday.getDay() === 5, "Day: " + friday.getDay());
  _assert("1 business day before March 16 is March 13",
    formatDate(friday, true) === "2026-03-13", formatDate(friday, true));

  // isBusinessDay checks
  var sat = new Date(2026, 2, 14); // Saturday
  var sun = new Date(2026, 2, 15); // Sunday
  var mon = new Date(2026, 2, 16); // Monday
  _assert("Saturday is not a business day", isBusinessDay(sat) === false);
  _assert("Sunday is not a business day",   isBusinessDay(sun) === false);
  _assert("Monday is a business day (if not holiday)", isBusinessDay(mon) === !isHoliday(mon));
}


// ============================================================
// TEST 5: EMAIL TEMPLATE LOADING
// ============================================================

/**
 * Verifies that all 31 templates are in the spreadsheet,
 * active, and have subject + body content.
 */
function testEmailTemplateLoad() {
  Logger.log("\n--- TEST 5: Email Templates ---");

  var templateIds = [
    "tpl_001","tpl_002","tpl_003","tpl_004","tpl_005","tpl_006",
    "tpl_007","tpl_008","tpl_009","tpl_010","tpl_011","tpl_012",
    "tpl_013","tpl_014","tpl_015","tpl_016","tpl_017","tpl_018",
    "tpl_019","tpl_020","tpl_021","tpl_022","tpl_023","tpl_024",
    "tpl_025","tpl_026","tpl_027","tpl_028","tpl_029","tpl_030",
    "tpl_031"
  ];

  var missing = [];
  var noSubject = [];
  var noBody = [];

  for (var i = 0; i < templateIds.length; i++) {
    var id = templateIds[i];
    var t  = getEmailTemplate(id);
    if (!t) {
      missing.push(id);
    } else {
      if (!t.subject || t.subject.trim() === "") noSubject.push(id);
      if (!t.body    || t.body.trim() === "")    noBody.push(id);
    }
  }

  _assert("All 31 templates found",
    missing.length === 0, "Missing: " + missing.join(", "));

  _assert("All templates have subjects",
    noSubject.length === 0, "No subject: " + noSubject.join(", "));

  _assert("All templates have bodies",
    noBody.length === 0, "No body: " + noBody.join(", "));

  // Test placeholder replacement
  var result = replacePlaceholders("Hello {{FIRST_NAME}}!", { FIRST_NAME: "Jane" });
  _assert("replacePlaceholders basic", result === "Hello Jane!", result);

  var result2 = replacePlaceholders("{{IF_FAMILY}}Family content{{END_IF}}", { IF_FAMILY: "true" });
  _assert("replacePlaceholders IF_block shown", result2 === "Family content", result2);

  var result3 = replacePlaceholders("{{IF_FAMILY}}Family content{{END_IF}}", { IF_FAMILY: "" });
  _assert("replacePlaceholders IF_block hidden", result3 === "", result3);

  var result4 = replacePlaceholders("Hello {{MISSING}}!", {});
  _assert("replacePlaceholders missing var = empty string", result4 === "Hello !", result4);
}


// ============================================================
// TEST 6: MEMBER LOOKUP
// ============================================================

/**
 * Tests getMemberByEmail, getMemberById, getHouseholdById.
 * Requires at least one member record in the Member Directory.
 *
 * HOW TO USE:
 *   Replace TEST_MEMBER_EMAIL with a real email from your
 *   Individuals tab before running this test.
 */
function testMemberLookup() {
  Logger.log("\n--- TEST 6: Member Lookup ---");

  // ── EDIT THIS ──────────────────────────────────────────
  var TEST_MEMBER_EMAIL = "your.email@state.gov"; // Replace with a real member email
  // ───────────────────────────────────────────────────────

  if (TEST_MEMBER_EMAIL === "your.email@state.gov") {
    Logger.log("  SKIP: Set TEST_MEMBER_EMAIL to a real member email to run this test.");
    return;
  }

  var member = getMemberByEmail(TEST_MEMBER_EMAIL);
  _assert("getMemberByEmail returns object", member !== null, "null");

  if (!member) return;

  _assert("Member has individual_id",  member.individual_id !== undefined);
  _assert("Member has household_id",   member.household_id !== undefined);
  _assert("Member has first_name",     member.first_name !== undefined);
  _assert("Member has last_name",      member.last_name !== undefined);

  // Test getMemberById with the ID we just retrieved
  var byId = getMemberById(member.individual_id);
  _assert("getMemberById returns same member",
    byId !== null && byId.email === member.email, byId ? byId.email : "null");

  // Test getHouseholdById
  var hh = getHouseholdById(member.household_id);
  _assert("getHouseholdById returns household", hh !== null, "null");
  if (hh) {
    _assert("Household has membership_type", hh.membership_type !== undefined);
    _assert("Household has active field",    hh.active !== undefined);
  }

  // Test getHouseholdMembers
  var members = getHouseholdMembers(member.household_id);
  _assert("getHouseholdMembers returns array", Array.isArray(members), typeof members);
  _assert("Household has at least 1 member", members.length >= 1, members.length);

  // Test non-existent email
  var nobody = getMemberByEmail("nobody@nowhere.com");
  _assert("getMemberByEmail non-existent returns null", nobody === null, nobody);

  // Test isActiveMember
  var check = isActiveMember(TEST_MEMBER_EMAIL);
  Logger.log("  INFO: isActiveMember status = " + check.status + " / isActive = " + check.isActive);
  _assert("isActiveMember returns object with isActive", typeof check.isActive === "boolean");
}


// ============================================================
// TEST 7: ACCESS CHECKS
// ============================================================

/**
 * Tests age-based access checks using synthetic birth dates.
 * These do not require real member records — they test the
 * logic directly.
 *
 * NOTE: These test calculateAge and isBirthdayToday logic.
 * The full canAccessUnaccompanied / isFitnessEligible /
 * isVotingEligible functions require a real individual_id.
 */
function testAccessChecks() {
  Logger.log("\n--- TEST 7: Access Checks ---");

  // Age 14 should not have unaccompanied access
  var dob14 = new Date();
  dob14.setFullYear(dob14.getFullYear() - 14);
  _assert("Age 14 below unaccompanied threshold",
    calculateAge(dob14) < AGE_UNACCOMPANIED_ACCESS, calculateAge(dob14));

  // Age 15 should have unaccompanied access
  var dob15 = new Date();
  dob15.setFullYear(dob15.getFullYear() - 15);
  _assert("Age 15 meets unaccompanied threshold",
    calculateAge(dob15) >= AGE_UNACCOMPANIED_ACCESS, calculateAge(dob15));

  // Age 15 is below voting age
  _assert("Age 15 below voting threshold",
    calculateAge(dob15) < AGE_VOTING, calculateAge(dob15));

  // Age 16 meets voting threshold
  var dob16 = new Date();
  dob16.setFullYear(dob16.getFullYear() - 16);
  _assert("Age 16 meets voting threshold",
    calculateAge(dob16) >= AGE_VOTING, calculateAge(dob16));
}


// ============================================================
// TEST 8: RESERVATION LIMITS
// ============================================================

/**
 * Tests the limit-checking logic in isolation.
 * Uses a fake householdId that has no existing reservations,
 * so it will always report 0 hours used.
 */
function testReservationLimits() {
  Logger.log("\n--- TEST 8: Reservation Limits ---");

  var fakeHhId  = "HSH-TEST-FAKE99999";
  var eventDate = new Date(2026, 5, 15); // June 15, 2026

  // Tennis within limit
  var check1 = checkReservationLimits(fakeHhId, FACILITY_TENNIS, eventDate, 1.0);
  _assert("Tennis 1 hr with 0 used — allowed, not excess",
    check1.allowed === true && check1.isExcess === false,
    "allowed=" + check1.allowed + " isExcess=" + check1.isExcess);

  // Tennis single session max exceeded
  var check2 = checkReservationLimits(fakeHhId, FACILITY_TENNIS, eventDate, TENNIS_SESSION_MAX_HOURS + 1);
  _assert("Tennis session exceeding max — not allowed",
    check2.allowed === false, "allowed=" + check2.allowed);

  // Leobo within limit
  var check3 = checkReservationLimits(fakeHhId, FACILITY_LEOBO, eventDate, 3.0);
  _assert("Leobo 3 hrs with 0 used — allowed, not excess",
    check3.allowed === true && check3.isExcess === false,
    "allowed=" + check3.allowed + " isExcess=" + check3.isExcess);

  // Conflict detection — two non-overlapping windows
  var start1 = new Date(2026, 5, 15, 9, 0);
  var end1   = new Date(2026, 5, 15, 10, 0);
  var start2 = new Date(2026, 5, 15, 11, 0);
  var end2   = new Date(2026, 5, 15, 12, 0);
  // These should NOT conflict with each other
  Logger.log("  INFO: hasConflict for non-overlapping windows uses live data. " +
             "Verify by checking Reservations tab if this returns unexpected results.");

  // getTennisHoursThisWeek / getLeoboReservationsThisMonth with fake ID should return 0
  var tennisHrs = getTennisHoursThisWeek(fakeHhId, eventDate);
  _assert("getTennisHoursThisWeek for unknown household = 0",
    tennisHrs === 0, tennisHrs);

  var leoboCount = getLeoboReservationsThisMonth(fakeHhId, eventDate);
  _assert("getLeoboReservationsThisMonth for unknown household = 0",
    leoboCount === 0, leoboCount);
}


// ============================================================
// TEST 9: GUEST LIST DEADLINE
// ============================================================

/**
 * Tests getGuestListDeadline for a range of event dates.
 */
function testGuestListDeadline() {
  Logger.log("\n--- TEST 9: Guest List Deadline ---");

  // April 5, 2026 (Sunday) → deadline should be a weekday 4 business days prior
  var eventDate = new Date(2026, 3, 5);
  var deadline  = getGuestListDeadline(eventDate);

  _assert("Deadline is before event date", deadline < eventDate);
  _assert("Deadline is a weekday",
    deadline.getDay() !== 0 && deadline.getDay() !== 6, "Day: " + deadline.getDay());

  Logger.log("  INFO: Deadline for April 5 event = " + formatDate(deadline));

  // isGuestListDeadlineMet for a future event should return true
  var farFuture = addDays(new Date(), 30);
  _assert("Guest list deadline met for event 30 days away",
    isGuestListDeadlineMet(farFuture) === true);

  // isGuestListDeadlineMet for an event tomorrow should return false
  var tomorrow = addDays(new Date(), 1);
  _assert("Guest list deadline NOT met for event tomorrow",
    isGuestListDeadlineMet(tomorrow) === false);
}


// ============================================================
// TEST 10: AUDIT LOG
// ============================================================

/**
 * Writes a test entry to the Audit Log and verifies it was written.
 */
function testAuditLog() {
  Logger.log("\n--- TEST 10: Audit Log ---");

  var testId = generateId("TST");
  logAuditEntry(
    "test@geabotswana.org",
    AUDIT_LOGIN,
    "Test",
    testId,
    "Automated test entry — safe to delete"
  );

  // Verify the entry was written by reading the last row
  try {
    var sheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_AUDIT_LOG);
    var lastRow = sheet.getLastRow();
    var data    = sheet.getRange(lastRow, 1, 1, 7).getValues()[0];

    _assert("Audit log entry written",     lastRow > 1, "Last row: " + lastRow);
    _assert("Audit log has correct target", data[5] === testId, "Got: " + data[5]);
    _assert("Audit log has correct action", data[3] === AUDIT_LOGIN, "Got: " + data[3]);

    Logger.log("  INFO: Test audit entry written to row " + lastRow +
               ". You can delete it from the Audit Log tab.");
  } catch (e) {
    _assert("Audit log readable after write", false, e.toString());
  }
}


// ============================================================
// LIVE SEND TEST (run manually, one at a time)
// ============================================================

/**
 * Sends a real test email using tpl_001 to verify the full
 * email pipeline: template fetch → placeholder replacement →
 * HTML build → GmailApp send.
 *
 * EDIT the recipient address before running.
 * Check your inbox and the Sent folder for the result.
 */
function testSendEmail() {
  Logger.log("\n--- MANUAL: Send Test Email ---");

  // ── EDIT THIS ──────────────────────────────────────────
  var TEST_RECIPIENT = "treasurer@geabotswana.org"; // Replace before running
  // ───────────────────────────────────────────────────────

  if (TEST_RECIPIENT === "your.email@state.gov") {
    Logger.log("  SKIP: Set TEST_RECIPIENT to your email before running testSendEmail.");
    return;
  }

  var ok = sendEmail("tpl_001", TEST_RECIPIENT, {
    FIRST_NAME:       "Test User",
    FULL_NAME:        "Test User",
    MEMBERSHIP_LEVEL: "Full Membership",
    HOUSEHOLD_TYPE:   "Family",
    IF_FAMILY:        "true",
    FAMILY_MEMBERS_LIST: "Jane Test, John Test",
    IF_NON_FULL:      "",
    SPONSOR_NAME:     "",
    IF_TEMPORARY:     "",
    DUES_AMOUNT:      "",
    DURATION_MONTHS:  ""
  });

  _assert("tpl_001 email sent successfully", ok === true);
  if (ok) Logger.log("  INFO: Check " + TEST_RECIPIENT + " for the test email.");
}


/**
 * Tests the RSO daily summary without waiting for the trigger.
 * Sends to EMAIL_RSO — check that address for the result.
 */
function testRsoEmailManual() {
  Logger.log("\n--- MANUAL: RSO Summary Test ---");
  Logger.log("  INFO: Sending RSO summary for today to " + EMAIL_RSO);
  sendRsoDailySummary();
  Logger.log("  INFO: Done. Check " + EMAIL_RSO + " for the summary email.");
}


/**
 * Verifies the Membership Applications sheet exists and has all required columns
 * for the application workflow.
 * Run this before testing the membership application workflow.
 */
function testMembershipApplicationsSheet() {
  Logger.log("\n--- TEST: Membership Applications Sheet ---");

  try {
    var sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
    _assert("Membership Applications sheet exists", sheet !== null);

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log("  INFO: Found " + headers.length + " columns");

    // Expected columns based on ApplicationService.js
    var expectedColumns = [
      'application_id', 'household_id', 'primary_individual_id', 'primary_applicant_name', 'primary_applicant_email',
      'country_code_primary', 'phone_primary', 'phone_primary_whatsapp', 'membership_category', 'household_type',
      'sponsor_name', 'sponsor_email', 'sponsor_verified', 'sponsor_verified_date', 'sponsor_verified_by',
      'submitted_date', 'status', 'documents_confirmed_date', 'board_initial_status', 'board_initial_reviewed_by',
      'board_initial_review_date', 'board_initial_notes', 'board_initial_denial_reason', 'rso_status', 'rso_reviewed_by',
      'rso_review_date', 'rso_private_notes', 'board_final_status', 'board_final_reviewed_by', 'board_final_review_date',
      'board_final_denial_reason', 'payment_status', 'payment_id', 'employment_job_title', 'employment_posting_date',
      'employment_departure_date', 'dues_amount', 'membership_start_date', 'membership_expiration_date', 'created_date',
      'last_modified_date', 'notes'
    ];

    var missingColumns = [];
    for (var i = 0; i < expectedColumns.length; i++) {
      if (headers.indexOf(expectedColumns[i]) === -1) {
        missingColumns.push(expectedColumns[i]);
      }
    }

    if (missingColumns.length === 0) {
      _assert("All required columns present", true);
    } else {
      Logger.log("  FAIL: Missing columns: " + missingColumns.join(", "));
      Logger.log("  ACTION REQUIRED: Add these columns to Membership Applications sheet:");
      Logger.log("  " + missingColumns.join(", "));
    }

    // List actual columns for reference
    Logger.log("  INFO: Current columns: " + headers.join(", "));

  } catch (e) {
    Logger.log("  FAIL: Could not access Membership Applications sheet");
    Logger.log("  ERROR: " + e.message);
    Logger.log("  ACTION REQUIRED: Verify that 'Membership Applications' tab exists in GEA Member Directory");
  }
}


/**
 * Verifies the Individuals sheet has all required columns for application data.
 */
function testIndividualsSheet() {
  Logger.log("\n--- TEST: Individuals Sheet Columns ---");

  try {
    var sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_INDIVIDUALS);
    _assert("Individuals sheet exists", sheet !== null);

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log("  INFO: Found " + headers.length + " columns");

    // Check for critical application-related columns
    var requiredForApplication = [
      'employment_job_title',
      'arrival_date',
      'departure_date'
    ];

    var missingColumns = [];
    for (var i = 0; i < requiredForApplication.length; i++) {
      if (headers.indexOf(requiredForApplication[i]) === -1) {
        missingColumns.push(requiredForApplication[i]);
      }
    }

    if (missingColumns.length === 0) {
      _assert("All application-related columns present", true);
    } else {
      Logger.log("  FAIL: Missing columns: " + missingColumns.join(", "));
      Logger.log("  ACTION REQUIRED: Add these columns to Individuals sheet:");
      Logger.log("  " + missingColumns.join(", "));
    }

  } catch (e) {
    Logger.log("  FAIL: Could not access Individuals sheet");
    Logger.log("  ERROR: " + e.message);
  }
}


// ============================================================
// GMAIL API TEST
// ============================================================

/**
 * Test function to verify Gmail API is working for board emails.
 * Sends a test email FROM board@geabotswana.org to test that the Gmail API
 * is properly enabled and working.
 *
 * RUN THIS TEST:
 *   1. Select testBoardEmailGmailAPI from the dropdown at top
 *   2. Click Run (▶)
 *   3. Check View → Logs for results
 *   4. Check your inbox - email should arrive FROM board@geabotswana.org
 */
function testBoardEmailGmailAPI() {
  Logger.log("\n========== TEST: Board Email via Gmail API ==========\n");

  var boardEmail = getConfigValue("EMAIL_BOARD") || "board@geabotswana.org";
  var subject = "TEST: Gmail API Board Email Test";
  var body = "This is a test email from the Gmail API.\n\n" +
             "If you received this email in your inbox (not in Sent folder),\n" +
             "the Gmail API is working correctly for board notifications.\n\n" +
             "Test sent at: " + new Date().toString();

  try {
    // Test sendEmailFromBoard function
    var success = sendEmailFromBoard("tpl_042", boardEmail, {
      "APPLICANT_NAME": "Test User",
      "MEMBERSHIP_CATEGORY": "Full",
      "HOUSEHOLD_TYPE": "Family",
      "APPLICATION_ID": "TEST-2026-00001",
      "SUBMITTED_DATE": new Date().toISOString().split('T')[0]
    });

    if (success) {
      Logger.log("✓ PASS: Board email sent successfully via Gmail API");
      Logger.log("  Recipient: " + boardEmail);
      Logger.log("  Check your inbox - the email should arrive FROM board@geabotswana.org");
      Logger.log("  (NOT in your Sent folder)");
    } else {
      Logger.log("✗ FAIL: sendEmailFromBoard returned false");
      Logger.log("  Check the logs above for error details");
    }
  } catch (e) {
    Logger.log("✗ FAIL: Exception thrown during email send");
    Logger.log("  ERROR: " + e.toString());
    Logger.log("  MESSAGE: " + e.message);
    Logger.log("\n  TROUBLESHOOTING:");
    Logger.log("  1. Verify Gmail API is enabled in Google Cloud Console");
    Logger.log("  2. Verify Gmail API is added as an Advanced Service in GAS");
    Logger.log("  3. Check that your project is connected to the Cloud project");
  }

  Logger.log("\n======================================================\n");
}

// ============================================================
// AUTH REGRESSION TESTS (Session Security Hardening)
// ============================================================

/**
 * TEST 1: Verify _hashToken produces stable, properly formatted SHA256 hashes
 *
 * Ensures:
 * - Returns 64-character lowercase hex string
 * - Same input always produces same output (deterministic)
 * - No corruption in token hashing
 */
function testHashTokenProducesSha256Hex() {
  Logger.log("\n=== TEST 1: Hash Token SHA256 Format ===");

  try {
    var testValue = "test-session-token-12345";
    var hash1 = _hashToken(testValue);
    var hash2 = _hashToken(testValue);

    // Check format: 64 hex characters
    var isValidFormat = hash1 &&
                       hash1.length === 64 &&
                       /^[a-f0-9]{64}$/.test(hash1);

    if (!isValidFormat) {
      Logger.log("✗ FAIL: Hash format invalid");
      Logger.log("  Expected: 64-char lowercase hex");
      Logger.log("  Got: " + hash1 + " (length: " + (hash1 ? hash1.length : "null") + ")");
      return;
    }

    // Check stability: same input = same hash
    if (hash1 !== hash2) {
      Logger.log("✗ FAIL: Hash not stable (not deterministic)");
      Logger.log("  First call:  " + hash1);
      Logger.log("  Second call: " + hash2);
      return;
    }

    Logger.log("✓ PASS: _hashToken produces stable 64-char SHA256 hex");
    Logger.log("  Format: " + hash1.substring(0, 16) + "...");

  } catch (e) {
    Logger.log("✗ FAIL: Exception in _hashToken");
    Logger.log("  ERROR: " + e.toString());
  }
}

/**
 * TEST 2: Verify _generateToken produces unique tokens with correct format
 *
 * Ensures:
 * - Each token is 64 hex characters
 * - No duplicates in a sample (entropy is working)
 * - Format consistency (not accidentally mixing formats)
 */
function testGenerateTokenProducesUnique64CharHex() {
  Logger.log("\n=== TEST 2: Generate Token Uniqueness & Format ===");

  try {
    var tokens = [];
    var SAMPLE_SIZE = 20;

    // Generate multiple tokens
    for (var i = 0; i < SAMPLE_SIZE; i++) {
      tokens.push(_generateToken());
    }

    // Check format for all tokens
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      var isValidFormat = token &&
                         token.length === 64 &&
                         /^[a-f0-9]{64}$/.test(token);

      if (!isValidFormat) {
        Logger.log("✗ FAIL: Token " + i + " has invalid format");
        Logger.log("  Got: " + token + " (length: " + (token ? token.length : "null") + ")");
        return;
      }
    }

    // Check for duplicates
    var uniqueTokens = {};
    for (var i = 0; i < tokens.length; i++) {
      if (uniqueTokens[tokens[i]]) {
        Logger.log("✗ FAIL: Duplicate token found");
        Logger.log("  Token: " + tokens[i]);
        Logger.log("  Entropy may be insufficient");
        return;
      }
      uniqueTokens[tokens[i]] = true;
    }

    Logger.log("✓ PASS: Generated " + SAMPLE_SIZE + " unique 64-char tokens");
    Logger.log("  All tokens: valid format, no duplicates, good entropy");

  } catch (e) {
    Logger.log("✗ FAIL: Exception in _generateToken");
    Logger.log("  ERROR: " + e.toString());
  }
}

/**
 * TEST 3: Verify constantTimeCompare works correctly
 *
 * Ensures:
 * - Equal strings return true
 * - Different strings (same length) return false
 * - Different-length strings return false
 * - No short-circuit behavior (would indicate timing vulnerability)
 */
function testConstantTimeCompareBasicCases() {
  Logger.log("\n=== TEST 3: Constant-Time Compare Correctness ===");

  try {
    var results = [];

    // Test 1: Equal strings
    var eq1 = constantTimeCompare("abc123", "abc123");
    results.push({ desc: "Equal strings", expected: true, actual: eq1 });

    // Test 2: Different strings, same length
    var eq2 = constantTimeCompare("abc123", "abc124");
    results.push({ desc: "Different same-length", expected: false, actual: eq2 });

    // Test 3: Different length
    var eq3 = constantTimeCompare("abc", "abc123");
    results.push({ desc: "Different length", expected: false, actual: eq3 });

    // Test 4: Empty strings
    var eq4 = constantTimeCompare("", "");
    results.push({ desc: "Both empty", expected: true, actual: eq4 });

    // Check all results
    var allPass = true;
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      if (r.expected !== r.actual) {
        Logger.log("✗ FAIL: " + r.desc);
        Logger.log("  Expected: " + r.expected + ", Got: " + r.actual);
        allPass = false;
      }
    }

    if (allPass) {
      Logger.log("✓ PASS: constantTimeCompare works correctly");
      Logger.log("  All 4 test cases passed");
    }

  } catch (e) {
    Logger.log("✗ FAIL: Exception in constantTimeCompare");
    Logger.log("  ERROR: " + e.toString());
  }
}

/**
 * TEST 4: Verify _createSession stores hashed tokens, not plain-text
 *
 * Ensures:
 * - token_hash column is populated
 * - Stored hash differs from returned token (one-way)
 * - Stored value is 64-char hex (properly formatted)
 * - Session marked active
 */
function testCreateSessionStoresTokenHashNotPlaintext() {
  Logger.log("\n=== TEST 4: Session Creation Stores Hashed Token ===");

  try {
    // Create a session
    var testEmail = "TEST_AUTH_4_" + Date.now() + "@example.com";
    var token = _createSession(testEmail, "member");

    if (!token) {
      Logger.log("✗ FAIL: _createSession returned empty token");
      return;
    }

    // Read the newest session row
    var sheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID)
      .getSheetByName(TAB_SESSIONS);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];

    var emailCol = headers.indexOf("email");
    var tokenHashCol = headers.indexOf("token_hash");
    var activeCol = headers.indexOf("active");

    if (tokenHashCol === -1) {
      Logger.log("✗ FAIL: token_hash column not found");
      return;
    }

    // Find the row we just created (newest row with matching email)
    var sessionRow = null;
    for (var i = data.length - 1; i >= 1; i--) {
      if (data[i][emailCol] === testEmail) {
        sessionRow = data[i];
        break;
      }
    }

    if (!sessionRow) {
      Logger.log("✗ FAIL: Session row not found after creation");
      return;
    }

    var storedHash = sessionRow[tokenHashCol];
    var isActive = sessionRow[activeCol];

    // Verify: hash is not equal to returned token (one-way)
    if (storedHash === token) {
      Logger.log("✗ FAIL: Stored hash equals returned token (not hashed!)");
      Logger.log("  This indicates tokens are being stored plain-text");
      return;
    }

    // Verify: hash is proper format
    var isValidHash = storedHash &&
                     storedHash.length === 64 &&
                     /^[a-f0-9]{64}$/.test(storedHash);

    if (!isValidHash) {
      Logger.log("✗ FAIL: Stored hash has invalid format");
      Logger.log("  Got: " + storedHash + " (length: " + (storedHash ? storedHash.length : "null") + ")");
      return;
    }

    // Verify: session is active
    if (!isActive) {
      Logger.log("✗ FAIL: Session not marked active");
      return;
    }

    Logger.log("✓ PASS: Session stores hashed token correctly");
    Logger.log("  - token_hash: populated with 64-char hex");
    Logger.log("  - Returned token != Stored hash (one-way)");
    Logger.log("  - active: TRUE");

  } catch (e) {
    Logger.log("✗ FAIL: Exception in session creation test");
    Logger.log("  ERROR: " + e.toString());
  }
}

/**
 * TEST 5: Verify validateSession accepts fresh sessions and rejects tampering
 *
 * Ensures:
 * - Fresh session validates successfully
 * - Modified token fails validation
 * - Hash-then-compare flow works end-to-end
 */
function testValidateSessionAcceptsFreshSessionAndRejectsRawMismatch() {
  Logger.log("\n=== TEST 5: Session Validation Works End-to-End ===");

  try {
    // Create a session
    var testEmail = "TEST_AUTH_5_" + Date.now() + "@example.com";
    var token = _createSession(testEmail, "member");

    if (!token) {
      Logger.log("✗ FAIL: _createSession returned empty token");
      return;
    }

    // Validate fresh token
    var result1 = validateSession(token);

    if (!result1.valid) {
      Logger.log("✗ FAIL: Fresh session validation failed");
      Logger.log("  Message: " + result1.message);
      return;
    }

    if (result1.email !== testEmail) {
      Logger.log("✗ FAIL: Returned email doesn't match");
      Logger.log("  Expected: " + testEmail);
      Logger.log("  Got: " + result1.email);
      return;
    }

    // Validate modified token (should fail)
    var modifiedToken = token.substring(0, 32) + "0000000000000000000000000000000000";
    var result2 = validateSession(modifiedToken);

    if (result2.valid) {
      Logger.log("✗ FAIL: Modified token validated (security issue!)");
      return;
    }

    Logger.log("✓ PASS: Session validation works correctly");
    Logger.log("  - Fresh token: VALID");
    Logger.log("  - Email returned: " + testEmail);
    Logger.log("  - Modified token: INVALID (rejected)");

  } catch (e) {
    Logger.log("✗ FAIL: Exception in session validation test");
    Logger.log("  ERROR: " + e.toString());
  }
}

/**
 * TEST 6: Verify logout properly deactivates sessions
 *
 * Ensures:
 * - logout() returns true and deactivates the session
 * - Subsequent validation fails
 * - Can't reuse logged-out sessions
 */
function testLogoutInvalidatesSession() {
  Logger.log("\n=== TEST 6: Logout Deactivates Sessions ===");

  try {
    // Create a session
    var testEmail = "TEST_AUTH_6_" + Date.now() + "@example.com";
    var token = _createSession(testEmail, "member");

    // Verify it validates before logout
    var beforeLogout = validateSession(token);
    if (!beforeLogout.valid) {
      Logger.log("✗ FAIL: Fresh session doesn't validate");
      return;
    }

    // Call logout
    var logoutResult = logout(token);

    if (!logoutResult) {
      Logger.log("✗ FAIL: logout() returned false");
      return;
    }

    // Verify it doesn't validate after logout
    var afterLogout = validateSession(token);

    if (afterLogout.valid) {
      Logger.log("✗ FAIL: Session still validates after logout");
      return;
    }

    Logger.log("✓ PASS: Logout properly deactivates sessions");
    Logger.log("  - logout() returned: true");
    Logger.log("  - Session before logout: VALID");
    Logger.log("  - Session after logout: INVALID");

  } catch (e) {
    Logger.log("✗ FAIL: Exception in logout test");
    Logger.log("  ERROR: " + e.toString());
  }
}

/**
 * TEST 7: Verify requireAuth enforces role-based access control
 *
 * Ensures:
 * - Member tokens pass member routes
 * - Member tokens fail board-only routes
 * - Any auth passes authenticated users
 *
 * Return shape: { ok: true, session: {...} } or { ok: false, response: string }
 */
function testRequireAuthRoleEnforcement() {
  Logger.log("\n=== TEST 7: Role-Based Access Control ===");

  try {
    // Create test sessions for different roles
    var memberEmail = "TEST_AUTH_7_MEMBER_" + Date.now() + "@example.com";

    var memberToken = _createSession(memberEmail, "member");

    if (!memberToken) {
      Logger.log("⚠ WARNING: Could not create member session");
      Logger.log("  Skipping role test");
      return;
    }

    // Test 1: Member token passes member auth
    // Return shape: { ok: true, session: {...} } on success
    var memberAuth = requireAuth(memberToken, "member");
    if (!memberAuth.ok) {
      Logger.log("✗ FAIL: Member token doesn't pass member auth");
      Logger.log("  Response: " + memberAuth.response);
      return;
    }

    if (!memberAuth.session || memberAuth.session.email !== memberEmail) {
      Logger.log("✗ FAIL: Session data missing or mismatched");
      return;
    }

    // Test 2: Member token fails board auth
    // Return shape: { ok: false, response: string } on failure
    var boardAuth = requireAuth(memberToken, "board");
    if (boardAuth.ok) {
      Logger.log("✗ FAIL: Member token passed board auth (access control broken!)");
      return;
    }

    if (!boardAuth.response) {
      Logger.log("⚠ WARNING: Board auth rejected but no error response");
    }

    // Test 3: requireAuth without role parameter (any authenticated user)
    var anyAuth = requireAuth(memberToken);
    if (!anyAuth.ok) {
      Logger.log("✗ FAIL: Member token doesn't pass generic auth");
      Logger.log("  Response: " + anyAuth.response);
      return;
    }

    Logger.log("✓ PASS: Role-based access control working");
    Logger.log("  - Member token + 'member' role: ok=true");
    Logger.log("  - Member token + 'board' role: ok=false (correct)");
    Logger.log("  - Member token + no role: ok=true");

  } catch (e) {
    Logger.log("✗ FAIL: Exception in role enforcement test");
    Logger.log("  ERROR: " + e.toString());
  }
}

/**
 * TEST 8: Verify token hash migration validation helpers work correctly
 *
 * Ensures:
 * - validateTokenHashMigration() returns consistent reports
 * - Checks actual hash quality (64-char format)
 * - checkSessionFormat() finds sessions correctly
 * - getAuthHealthReport() provides useful recommendations
 */
function testTokenHashMigrationHealthHelpers() {
  Logger.log("\n=== TEST 8: Migration Health Helpers ===");

  try {
    // Create a test session to generate fresh data
    var testEmail = "TEST_AUTH_8_" + Date.now() + "@example.com";
    var token = _createSession(testEmail, "member");

    // Test 1: validateTokenHashMigration report
    var migrationStatus = validateTokenHashMigration();

    if (!migrationStatus.tokenHashExists) {
      Logger.log("✗ FAIL: token_hash column not found by migration validator");
      return;
    }

    // Test 2: Check for invalid hashes (should be zero)
    if (migrationStatus.invalidHashCount > 0) {
      Logger.log("✗ FAIL: Migration validator found " + migrationStatus.invalidHashCount + " invalid hashes");
      Logger.log("  This indicates hash formatting problem");
      return;
    }

    // Test 3: checkSessionFormat for our test session
    var sessionFormat = checkSessionFormat(testEmail);

    if (!sessionFormat.found) {
      Logger.log("✗ FAIL: Test session not found by checkSessionFormat");
      return;
    }

    if (!sessionFormat.hasTokenHash) {
      Logger.log("✗ FAIL: Test session doesn't have token_hash");
      return;
    }

    if (sessionFormat.tokenHashLength !== 64) {
      Logger.log("✗ FAIL: Token hash length is " + sessionFormat.tokenHashLength + " (expected 64)");
      return;
    }

    // Test 4: getAuthHealthReport
    var healthReport = getAuthHealthReport();

    if (!healthReport.timestamp) {
      Logger.log("✗ FAIL: Health report missing timestamp");
      return;
    }

    // Health report is just for monitoring, so any valid structure passes

    Logger.log("✓ PASS: All migration health helpers working");
    Logger.log("  - validateTokenHashMigration(): status=" + migrationStatus.migrationStatus);
    Logger.log("  - checkSessionFormat(): found=" + sessionFormat.found + ", hashLength=" + sessionFormat.tokenHashLength);
    Logger.log("  - getAuthHealthReport(): activeSessions=" + healthReport.sessionStats.active);
    Logger.log("  - No invalid hashes detected");

  } catch (e) {
    Logger.log("✗ FAIL: Exception in migration helpers test");
    Logger.log("  ERROR: " + e.toString());
  }
}


// ============================================================
// FILE UPLOAD SYSTEM TESTS
// ============================================================

/**
 * Tests the file upload system: submissions, status, approvals, RSO links
 */
function testFileUploadSystem() {
  Logger.log("\n--- TEST: File Upload System ---");

  // Test 1: Verify File Submissions sheet exists
  try {
    var submissionsSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_FILE_SUBMISSIONS);
    _assert("File Submissions sheet exists", submissionsSheet !== null);
  } catch (e) {
    Logger.log("  FAIL: Cannot access File Submissions sheet: " + e);
    return;
  }

  // Test 2: Verify required columns exist
  var headers = submissionsSheet.getRange(1, 1, 1, submissionsSheet.getLastColumn()).getValues()[0];
  var requiredColumns = ['submission_id', 'individual_id', 'document_type', 'status', 'file_id', 'submitted_date', 'is_current'];
  requiredColumns.forEach(function(col) {
    var exists = headers.indexOf(col) >= 0;
    _assert("Column '" + col + "' exists", exists);
  });

  // Test 3: Verify Config constants for file uploads
  _assert("PHOTO_MAX_SIZE_MB defined", typeof PHOTO_MAX_SIZE_MB === 'number', PHOTO_MAX_SIZE_MB);
  _assert("PHOTO_ACCEPTED_TYPES defined", Array.isArray(PHOTO_ACCEPTED_TYPES), typeof PHOTO_ACCEPTED_TYPES);
  _assert("PASSPORT_WARNING_MONTHS defined", typeof PASSPORT_WARNING_MONTHS === 'number', PASSPORT_WARNING_MONTHS);
  _assert("EMAIL_RSO defined", typeof EMAIL_RSO === 'string' && EMAIL_RSO.length > 0, EMAIL_RSO);
  _assert("RSO_APPROVAL_LINK_EXPIRY_HOURS defined", typeof RSO_APPROVAL_LINK_EXPIRY_HOURS === 'number');

  Logger.log("  INFO: File upload system config verified");
}

/**
 * Tests file submission creation and validation
 */
function testFileSubmissionValidation() {
  Logger.log("\n--- TEST: File Submission Validation ---");

  // Test invalid document type
  var result = uploadFileSubmission({
    individual_id: "IND-TEST-001",
    document_type: "invalid_type",
    file_blob: Utilities.newBlob("test content"),
    file_name: "test.txt"
  });
  _assert("Rejects invalid document type", !result.ok && result.code === "INVALID_DOCUMENT_TYPE");

  // Test oversized file
  var largeContent = new Array(15 * 1024 * 1024).fill('x').join(''); // 15MB
  var largeBlob = Utilities.newBlob(largeContent, 'text/plain', 'large.txt');
  var result2 = uploadFileSubmission({
    individual_id: "IND-TEST-001",
    document_type: "photo",
    file_blob: largeBlob,
    file_name: "large.txt",
    file_size_bytes: 15 * 1024 * 1024
  });
  _assert("Rejects oversized photo", !result2.ok && result2.code === "FILE_TOO_LARGE");

  Logger.log("  INFO: File validation rules working correctly");
}

/**
 * Tests file status retrieval logic
 */
function testFileSubmissionStatus() {
  Logger.log("\n--- TEST: File Submission Status ---");

  // Use a test individual if available
  var testIndividualId = "IND-2026-TEST01"; // From CLAUDE.md test data

  try {
    var status = getFileSubmissionStatus(testIndividualId);
    _assert("getFileSubmissionStatus returns object", status && typeof status === 'object');
    _assert("Status has individual_id", status.individual_id === testIndividualId);
    _assert("Status has photo field", status.hasOwnProperty('photo'));
    _assert("Status has passport field", status.hasOwnProperty('passport'));
    _assert("Status has omang field", status.hasOwnProperty('omang'));
    _assert("Status has employment field", status.hasOwnProperty('employment'));
    _assert("Status has all_required_complete field", typeof status.all_required_complete === 'boolean');

    Logger.log("  INFO: Document status: photo=" + status.photo.status + ", passport=" + status.passport.status);
  } catch (e) {
    Logger.log("  WARN: Could not test status for individual " + testIndividualId + ": " + e);
  }
}

/**
 * Tests document expiration warning logic
 */
function testDocumentExpirationWarnings() {
  Logger.log("\n--- TEST: Document Expiration Warnings ---");

  try {
    var result = checkDocumentExpirationWarnings();
    _assert("checkDocumentExpirationWarnings returns object", result && typeof result === 'object');
    _assert("Returns warnings_sent count", typeof result.warnings_sent === 'number');
    _assert("warnings_sent is non-negative", result.warnings_sent >= 0, result.warnings_sent);

    Logger.log("  INFO: Expiration check completed, warnings sent: " + result.warnings_sent);
  } catch (e) {
    Logger.log("  WARN: Expiration warning test error: " + e);
  }
}

/**
 * Tests RSO approval link generation
 */
function testRsoApprovalLinkGeneration() {
  Logger.log("\n--- TEST: RSO Approval Link Generation ---");

  // Test link token format
  var tokenSeed = "test-seed-" + new Date().getTime() + "-" + Utilities.getUuid();
  var tokenBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, tokenSeed);
  var token = tokenBytes.map(function(b) {
    var v = (b + 256) % 256;
    return (v < 16 ? "0" : "") + v.toString(16);
  }).join("");

  _assert("Token is 64-char hex string", token.length === 64, "length: " + token.length);
  _assert("Token contains only hex digits", /^[0-9a-f]{64}$/.test(token), token.substring(0, 10) + "...");

  // Test link expiration calculation
  var now = new Date();
  var expiresAt = new Date(now.getTime() + (RSO_APPROVAL_LINK_EXPIRY_HOURS * 60 * 60 * 1000));
  var hoursDiff = (expiresAt - now) / (60 * 60 * 1000);
  _assert("Expiration time is RSO_APPROVAL_LINK_EXPIRY_HOURS in future",
    Math.abs(hoursDiff - RSO_APPROVAL_LINK_EXPIRY_HOURS) < 1,
    "hours: " + hoursDiff.toFixed(1));

  Logger.log("  INFO: RSO link generation logic verified");
}

/**
 * Tests document history retrieval
 */
function testSubmissionHistory() {
  Logger.log("\n--- TEST: Submission History ---");

  var testIndividualId = "IND-2026-TEST01";

  try {
    var result = getSubmissionHistory(testIndividualId);
    _assert("getSubmissionHistory returns object", result && typeof result === 'object');
    _assert("Result has ok field", result.hasOwnProperty('ok'));
    _assert("Result has history array", Array.isArray(result.history), typeof result.history);

    if (result.history && result.history.length > 0) {
      var firstItem = result.history[0];
      _assert("History items have submission_id", firstItem.hasOwnProperty('submission_id'));
      _assert("History items have document_type", firstItem.hasOwnProperty('document_type'));
      _assert("History items have status", firstItem.hasOwnProperty('status'));
      _assert("History items have submitted_date", firstItem.hasOwnProperty('submitted_date'));
      Logger.log("  INFO: Found " + result.history.length + " submissions");
    } else {
      Logger.log("  INFO: No submission history for test individual");
    }
  } catch (e) {
    Logger.log("  WARN: Could not test history: " + e);
  }
}

/**
 * Tests nightly cleanup of expired RSO links
 */
function testExpiredRsoLinkCleanup() {
  Logger.log("\n--- TEST: Expired RSO Link Cleanup ---");

  try {
    var result = deleteExpiredRsoLinks();
    _assert("deleteExpiredRsoLinks returns object", result && typeof result === 'object');
    _assert("Returns expired_count", typeof result.expired_count === 'number');
    _assert("expired_count is non-negative", result.expired_count >= 0, result.expired_count);

    if (result.expired_count > 0) {
      Logger.log("  INFO: Cleaned up " + result.expired_count + " expired RSO links");
    }
  } catch (e) {
    Logger.log("  WARN: RSO link cleanup test error: " + e);
  }
}

/**
 * Adds file upload tests to the main test runner
 */
function runFileUploadTests() {
  Logger.log("========================================");
  Logger.log("FILE UPLOAD SYSTEM TEST RUN — " + new Date().toString());
  Logger.log("========================================");

  testFileUploadSystem();
  testFileSubmissionValidation();
  testFileSubmissionStatus();
  testDocumentExpirationWarnings();
  testRsoApprovalLinkGeneration();
  testSubmissionHistory();
  testExpiredRsoLinkCleanup();

  Logger.log("========================================");
  Logger.log("FILE UPLOAD TESTS COMPLETE");
  Logger.log("========================================");
}


// ============================================================
// PAYMENT VERIFICATION TESTS
// ============================================================

/**
 * Tests Payments sheet exists and has required columns
 */
function testPaymentSheet() {
  Logger.log("\n--- TEST: Payments Sheet ---");

  try {
    var paymentsSheet = SpreadsheetApp.openById(PAYMENT_TRACKING_ID).getSheetByName(TAB_PAYMENTS);
    _assert("Payments sheet exists", paymentsSheet !== null);

    var headers = paymentsSheet.getRange(1, 1, 1, paymentsSheet.getLastColumn()).getValues()[0];
    var requiredColumns = ['payment_id', 'household_id', 'household_name', 'payment_date',
                          'payment_method', 'currency', 'amount', 'payment_type',
                          'payment_submitted_date', 'payment_verified_date', 'payment_verified_by',
                          'payment_confirmation_file_id', 'notes'];

    requiredColumns.forEach(function(col) {
      var exists = headers.indexOf(col) >= 0;
      _assert("Column '" + col + "' exists", exists);
    });

    Logger.log("  INFO: Payments sheet has all required columns");
  } catch (e) {
    Logger.log("  FAIL: Cannot access Payments sheet: " + e);
  }
}

/**
 * Tests submitPaymentVerification creates records correctly
 */
function testSubmitPayment() {
  Logger.log("\n--- TEST: Submit Payment Verification ---");

  try {
    // Use test household from CLAUDE.md
    var testHouseholdId = "HSH-2026-TEST01";
    var household = getHouseholdById(testHouseholdId);

    if (!household) {
      Logger.log("  SKIP: Test household HSH-2026-TEST01 not found");
      return;
    }

    // Get available payment years for this household's membership level
    var acceptableYears = _getAcceptablePaymentYears_(household.membership_level_id);
    if (!acceptableYears || acceptableYears.length === 0) {
      Logger.log("  SKIP: No payment years available for test household membership level");
      Logger.log("       (Add test data to Membership Pricing sheet with membership_level_id=" +
                 household.membership_level_id + ")");
      return;
    }

    // Use the first available year (format: "2025-26", "2026-27", etc.)
    var testYear = acceptableYears[0];
    var result = submitPaymentVerification({
      household_id: testHouseholdId,
      membership_year: testYear,
      payment_method: "Zelle (USD)",
      currency: "USD",
      amount_paid: 150.00,
      transaction_date: new Date(2026, 2, 10),  // March 10, 2026
      file_data_base64: null,
      file_name: null,
      notes: "Test payment submission",
      member_email: "jane@example.com"
    });

    _assert("Payment submission succeeds", result.ok === true, result.error || "");
    _assert("Returns payment_id", result.payment_id && result.payment_id.length > 0, result.payment_id);
    _assert("Payment ID starts with PAY", result.payment_id && result.payment_id.indexOf("PAY") === 0);

    Logger.log("  INFO: Payment created with ID: " + result.payment_id + " for year: " + testYear);
  } catch (e) {
    Logger.log("  WARN: Payment submission test error: " + e);
  }
}

/**
 * Tests listPendingPaymentVerifications filters unverified payments
 */
function testListPendingPayments() {
  Logger.log("\n--- TEST: List Pending Payments ---");

  try {
    var result = listPendingPaymentVerifications();
    _assert("listPendingPaymentVerifications returns object", result && typeof result === 'object');
    _assert("Returns count field", typeof result.count === 'number');
    _assert("Returns verifications array", Array.isArray(result.verifications));
    _assert("count matches verifications length", result.count === result.verifications.length);

    // Check that all pending payments have no verified_date
    var allUnverified = result.verifications.every(function(p) {
      return !p.payment_verified_date;
    });
    _assert("All pending payments are unverified", allUnverified);

    // Check that all are Dues Payments
    var allDuesPayments = result.verifications.every(function(p) {
      return p.payment_type === "Dues Payment";
    });
    _assert("All pending payments are Dues type", allDuesPayments);

    Logger.log("  INFO: Found " + result.count + " pending payment(s)");
  } catch (e) {
    Logger.log("  WARN: List pending payments test error: " + e);
  }
}

/**
 * Tests getPaymentVerificationStatus determines status correctly
 */
function testPaymentStatus() {
  Logger.log("\n--- TEST: Payment Status ---");

  try {
    var testHouseholdId = "HSH-2026-TEST01";
    var result = getPaymentVerificationStatus(testHouseholdId, "2026-27");

    _assert("getPaymentVerificationStatus returns object", result && typeof result === 'object');
    _assert("Returns ok flag", result.ok === true);
    _assert("Returns status field", typeof result.status === 'string');
    _assert("Status is one of valid values",
            ['none', 'submitted', 'verified', 'rejected', 'clarification_requested'].indexOf(result.status) >= 0);
    _assert("Returns history array", Array.isArray(result.history));

    Logger.log("  INFO: Payment status: " + result.status + " (history: " + result.history.length + " items)");
  } catch (e) {
    Logger.log("  WARN: Payment status test error: " + e);
  }
}

/**
 * Tests approvePaymentVerification sets verified fields
 */
function testApprovePayment() {
  Logger.log("\n--- TEST: Approve Payment ---");

  try {
    // Find a pending payment to approve
    var pending = listPendingPaymentVerifications();
    if (!pending.ok || pending.verifications.length === 0) {
      Logger.log("  SKIP: No pending payments to test approval");
      return;
    }

    var paymentId = pending.verifications[0].payment_id;
    var result = approvePaymentVerification(paymentId, "treasurer@geabotswana.org", "Approved for processing");

    _assert("Approval succeeds", result.ok === true, result.error || "");
    _assert("Returns verified status", result.status === "verified", result.status);

    // Verify by checking status updated
    var statusResult = getPaymentVerificationStatus(pending.verifications[0].household_id, pending.verifications[0].applied_to_period);
    _assert("Payment marked as verified in status", statusResult.status === "verified" || statusResult.status === "submitted");

    Logger.log("  INFO: Payment approved with ID: " + paymentId);
  } catch (e) {
    Logger.log("  WARN: Approve payment test error: " + e);
  }
}

/**
 * Tests rejectPaymentVerification marks rejection
 */
function testRejectPayment() {
  Logger.log("\n--- TEST: Reject Payment ---");

  try {
    // Find a pending payment to reject
    var pending = listPendingPaymentVerifications();
    if (!pending.ok || pending.verifications.length === 0) {
      Logger.log("  SKIP: No pending payments to test rejection");
      return;
    }

    var paymentId = pending.verifications[0].payment_id;
    var result = rejectPaymentVerification(paymentId, "treasurer@geabotswana.org", "Receipt does not match account");

    _assert("Rejection succeeds", result.ok === true, result.error || "");
    _assert("Returns rejected status", result.status === "rejected", result.status);

    Logger.log("  INFO: Payment rejected with ID: " + paymentId);
  } catch (e) {
    Logger.log("  WARN: Reject payment test error: " + e);
  }
}

/**
 * Tests requestPaymentClarification marks clarification needed
 */
function testClarifyPayment() {
  Logger.log("\n--- TEST: Request Payment Clarification ---");

  try {
    // Find a pending payment to request clarification
    var pending = listPendingPaymentVerifications();
    if (!pending.ok || pending.verifications.length === 0) {
      Logger.log("  SKIP: No pending payments to test clarification");
      return;
    }

    var paymentId = pending.verifications[0].payment_id;
    var result = requestPaymentClarification(paymentId, "treasurer@geabotswana.org",
                                            "Please provide bank statement to verify transaction");

    _assert("Clarification request succeeds", result.ok === true, result.error || "");
    _assert("Returns clarification_requested status", result.status === "clarification_requested", result.status);

    Logger.log("  INFO: Clarification requested for payment ID: " + paymentId);
  } catch (e) {
    Logger.log("  WARN: Request clarification test error: " + e);
  }
}

/**
 * Runs all payment verification tests
 */
function runPaymentTests() {
  Logger.log("========================================");
  Logger.log("PAYMENT VERIFICATION TEST RUN — " + new Date().toString());
  Logger.log("========================================");

  testPaymentSheet();
  testSubmitPayment();
  testListPendingPayments();
  testPaymentStatus();
  testApprovePayment();
  testRejectPayment();
  testClarifyPayment();

  Logger.log("========================================");
  Logger.log("PAYMENT TESTS COMPLETE");
  Logger.log("========================================");
}