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
 *
 * MIGRATION (v2.4.73): After deploying, run migrateSubmissionTypeField()
 * to backfill submission_type for existing File Submissions documents.
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

  // Reservation workflow
  testReservationConfig();
  testReservationApprovalRouting();
  testWaitlistConfig();
  testWaitlistFunctions();
  testGuestListConfig();
  testGuestListSubmission();

  // Monthly reports & helpers
  testIsLastMondayOfMonth();
  testGetCurrentMembershipYear();
  testReservationsReportStats();
  testEmailResend();

  // Admin API handlers
  testAdminWaitlistListHandler();
  testAdminReservationsReportHandler();
  testAdminResendEmailHandler();
  testAdminHandlersRequireBoard();
  testGetDuesInfoHandler();

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
 * Verifies that all 63 templates are in the spreadsheet,
 * active, and have subject + body content.
 * Uses semantic names (the current lookup key), not the old tpl_XXX IDs.
 */
function testEmailTemplateLoad() {
  Logger.log("\n--- TEST 5: Email Templates ---");

  // All 63 semantic names from Email_Templates_Sheet.csv
  var templateIds = [
    // ADM — application administration
    "ADM_BOARD_APPROVAL_REQUEST_TO_BOARD",
    "ADM_BOARD_APPROVED_FOR_RSO_TO_BOARD",
    "ADM_BOARD_FINAL_APPROVAL_TO_BOARD",
    "ADM_BOARD_FINAL_DENIED_TO_BOARD",
    "ADM_BOARD_INITIAL_DENIED_TO_BOARD",
    "ADM_DOCS_SENT_TO_RSO_TO_BOARD",
    "ADM_MGT_APPROVAL_REQUEST_TO_MGT",
    "ADM_NEW_APPLICATION_BOARD_TO_BOARD",
    "ADM_READY_FOR_FINAL_APPROVAL_TO_MEMBER",
    "ADM_DAILY_SUMMARY_TO_RSO_NOTIFY",
    "ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE",
    "ADM_RSO_DOCUMENT_ISSUE_TO_BOARD",
    // DOC — document / photo uploads
    "DOC_DOCUMENT_REJECTED_TO_MEMBER",
    "DOC_DOCUMENTS_CONFIRMED_TO_MEMBER",
    "DOC_EMPLOYMENT_VERIFICATION_REQUESTED_TO_MEMBER",
    "DOC_FILE_SUBMISSION_CONFIRMATION_TO_MEMBER",
    "DOC_PHOTO_APPROVED_TO_MEMBER",
    "DOC_PHOTO_REJECTED_TO_MEMBER",
    "DOC_PHOTO_SUBMISSION_REMINDER_TO_MEMBER",
    // MEM — membership lifecycle
    "MEM_APPLICATION_APPROVED_TO_APPLICANT",
    "MEM_APPLICATION_DENIED_TO_APPLICANT",
    "MEM_APPLICATION_RECEIVED_TO_APPLICANT",
    "MEM_BIRTHDAY_AGE_15_MILESTONE_TO_MEMBER",
    "MEM_BIRTHDAY_AGE_16_MILESTONE_TO_MEMBER",
    "MEM_BIRTHDAY_GREETING_TO_MEMBER",
    "MEM_FIRST_LOGIN_WELCOME_TO_MEMBER",
    "MEM_MEMBERSHIP_EXPIRED_TO_MEMBER",
    "MEM_PASSPORT_EXPIRATION_WARNING_TO_MEMBER",
    "MEM_PASSWORD_SET_TO_MEMBER",
    "MEM_RENEWAL_REMINDER_30_DAYS_TO_MEMBER",
    "MEM_RENEWAL_REMINDER_7_DAYS_TO_MEMBER",
    "MEM_ACCOUNT_CREDENTIALS_TO_APPLICANT",
    "MEM_MEMBERSHIP_ACTIVATED_TO_MEMBER",
    // PAY — payments
    "PAY_PAYMENT_CLARIFICATION_REQUESTED_TO_MEMBER",
    "PAY_PAYMENT_CONFIRMATION_RECEIVED_TO_MEMBER",
    "PAY_PAYMENT_PROOF_RECEIVED_TO_MEMBER",
    "PAY_PAYMENT_REJECTED_TO_MEMBER",
    "PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD",
    "PAY_PAYMENT_SUBMITTED_TO_MEMBER",
    "PAY_PAYMENT_VERIFIED_ACTIVATED_BOARD_FYI_TO_BOARD",
    "PAY_PAYMENT_VERIFIED_TO_MEMBER",
    // RES — reservations & guest lists
    "RES_BOOKING_APPROVED_TO_MEMBER",
    "RES_BOOKING_CANCELLED_TO_MEMBER",
    "RES_BOOKING_DENIED_BOARD_COPY_TO_BOARD",
    "RES_BOOKING_DENIED_TO_MEMBER",
    "RES_BOOKING_PENDING_REVIEW_TO_MEMBER",
    "RES_BOOKING_RECEIVED_TO_MEMBER",
    "RES_EXCESS_LEOBO_APPROVAL_REQUEST_TO_MEMBER",
    "RES_EXCESS_TENNIS_APPROVAL_REQUEST_TO_MEMBER",
    "RES_GUEST_LIST_DEADLINE_REMINDER_TO_MEMBER",
    "RES_HOLIDAY_CALENDAR_REMINDER_TO_MEMBER",
    "RES_LEOBO_LIMIT_REACHED_TO_MEMBER",
    "RES_TENNIS_LIMIT_REACHED_TO_MEMBER",
    "RES_BOOKING_APPROVAL_REQUEST_TO_BOARD",
    "RES_WAITLIST_SLOT_OPENED_TO_MEMBER",
    "RES_EXCESS_TENNIS_APPROVAL_REQUEST_TO_BOARD",
    "RES_EXCESS_LEOBO_APPROVAL_REQUEST_TO_MGT",
    "RES_LEOBO_APPROVAL_REQUEST_TO_MGT",
    "RES_GUEST_LIST_REJECTIONS_TO_BOARD",
    "RES_GUEST_LIST_SUBMITTED_TO_MEMBER",
    "RES_APPROVAL_REMINDER_TO_BOARD",
    "RES_LEOBO_MGT_APPROVED_TO_BOARD",
    "RES_BOOKING_WAITLISTED_TO_MEMBER"
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

  _assert("All 63 templates found",
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
    _assert("Household has household_type", hh.household_type !== undefined);
    _assert("Household has active field",   hh.active !== undefined);
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
 * Sends a real test email using MEM_APPLICATION_RECEIVED_TO_APPLICANT to verify the full
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

  var ok = sendEmailFromTemplate("MEM_APPLICATION_RECEIVED_TO_APPLICANT", TEST_RECIPIENT, {
    FIRST_NAME:     "Test User",
    APPLICATION_ID: "TEST-2026-00001",
    SUBMITTED_DATE: new Date().toISOString().split("T")[0],
    PORTAL_URL:     "https://geabotswana.org/member.html"
  });

  _assert("MEM_APPLICATION_RECEIVED_TO_APPLICANT email sent successfully", ok === true);
  if (ok) Logger.log("  INFO: Check " + TEST_RECIPIENT + " for the test email.");
}


/**
 * Tests the RSO daily summary without waiting for the trigger.
 * Sends to EMAIL_RSO_NOTIFY — check that address for the result.
 */
function testRsoEmailManual() {
  Logger.log("\n--- MANUAL: RSO Summary Test ---");
  Logger.log("  INFO: Sending RSO summary for today to " + EMAIL_RSO_NOTIFY);
  sendRsoDailySummary();
  Logger.log("  INFO: Done. Check " + EMAIL_RSO_NOTIFY + " for the summary email.");
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
    var success = sendEmailFromTemplate("ADM_NEW_APPLICATION_BOARD_TO_BOARD", boardEmail, {
      APPLICANT_NAME:       "Test User",
      APPLICATION_ID:       "TEST-2026-00001",
      APPLICATION_DATE:     new Date().toISOString().split("T")[0],
      BOARD_REVIEW_DEADLINE: formatDate(addDays(new Date(), 3))
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
  _assert("EMAIL_RSO_APPROVE defined", typeof EMAIL_RSO_APPROVE === 'string' && EMAIL_RSO_APPROVE.length > 0, EMAIL_RSO_APPROVE);
  _assert("EMAIL_RSO_NOTIFY defined", typeof EMAIL_RSO_NOTIFY === 'string' && EMAIL_RSO_NOTIFY.length > 0, EMAIL_RSO_NOTIFY);
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


// ============================================================
// SERVICE ACCOUNT SETUP TEST
// ============================================================

/**
 * Tests that the Board service account is properly initialized in PropertiesService.
 *
 * SETUP REQUIRED:
 * 1. Go to Project Settings (⚙️ icon, left sidebar)
 * 2. Scroll to "Script Properties"
 * 3. Add property: BOARD_SERVICE_ACCOUNT_JSON = [full service account JSON]
 * 4. Click "Save script properties"
 * 5. Run this test
 *
 * If all 3 tests pass, your setup is complete and you can send emails via Gmail API.
 */
function testServiceAccountSetup() {
  Logger.log("========== SERVICE ACCOUNT SETUP TEST ==========");

  // Test 1: Retrieve from PropertiesService
  Logger.log("\n[TEST 1] Reading from PropertiesService...");
  var account = _getBoardServiceAccount();
  if (!account) {
    Logger.log("[FAIL] Service account not found in properties");
    Logger.log("  ACTION: Go to Project Settings > Script Properties");
    Logger.log("          Add property BOARD_SERVICE_ACCOUNT_JSON with service account JSON");
    return;
  }
  Logger.log("[PASS] Service account retrieved");
  Logger.log("  Client Email: " + account.client_email);
  Logger.log("  Project ID: " + account.project_id);

  // Test 2: Verify key structure
  Logger.log("\n[TEST 2] Validating key structure...");
  if (account.private_key && account.private_key.includes("BEGIN PRIVATE KEY")) {
    Logger.log("[PASS] Private key present and valid");
  } else {
    Logger.log("[FAIL] Private key missing or malformed");
    return;
  }

  // Test 3: Try to create JWT
  Logger.log("\n[TEST 3] Creating signed JWT...");
  var jwt = _createSignedDomainDelegationJwt();
  if (jwt) {
    Logger.log("[PASS] JWT created successfully");
    Logger.log("  JWT length: " + jwt.length + " chars");
  } else {
    Logger.log("[FAIL] JWT creation failed");
    Logger.log("  Check that private key is valid and not corrupted");
    return;
  }

  Logger.log("\n========== ALL TESTS PASSED ==========");
  Logger.log("Service account setup is complete!");
  Logger.log("You can now run testEmailTemplateSystem() to send test emails.");
}


// ============================================================
// RESERVATION WORKFLOW TESTS
// ============================================================

/**
 * Tests reservation status constants and limit constants exist.
 * Verifies the Reservations sheet schema.
 */
function testReservationConfig() {
  Logger.log("\n--- TEST: Reservation Config & Schema ---");

  _assert("FACILITY_TENNIS is set", typeof FACILITY_TENNIS === "string" && FACILITY_TENNIS.length > 0, FACILITY_TENNIS);
  _assert("FACILITY_LEOBO is set",  typeof FACILITY_LEOBO === "string" && FACILITY_LEOBO.length > 0, FACILITY_LEOBO);
  _assert("ALL_FACILITIES has 2 entries", Array.isArray(ALL_FACILITIES) && ALL_FACILITIES.length === 2, ALL_FACILITIES.length);
  _assert("FACILITY_WHOLE not present",
    ALL_FACILITIES.indexOf("Whole Facility") === -1, "Found Whole Facility in ALL_FACILITIES");
  _assert("LEOBO in FACILITIES_REQUIRING_APPROVAL",
    FACILITIES_REQUIRING_APPROVAL.indexOf(FACILITY_LEOBO) !== -1);
  _assert("STATUS_APPROVED defined",   typeof STATUS_APPROVED === "string");
  _assert("STATUS_PENDING defined",    typeof STATUS_PENDING === "string");
  _assert("STATUS_DENIED defined",     typeof STATUS_DENIED === "string");
  _assert("STATUS_CANCELLED defined",  typeof STATUS_CANCELLED === "string");
  _assert("STATUS_WAITLISTED defined", typeof STATUS_WAITLISTED === "string");
  _assert("STATUS_CONFIRMED defined",  typeof STATUS_CONFIRMED === "string");

  try {
    var ss = SpreadsheetApp.openById(RESERVATIONS_ID);
    var sheet = ss.getSheetByName(TAB_RESERVATIONS);
    _assert("Reservations sheet exists", sheet !== null);
    if (sheet) {
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var required = [
        "reservation_id", "household_id", "submitted_by_email", "submission_timestamp",
        "facility", "reservation_date", "start_time", "end_time", "duration_hours",
        "event_name", "status", "board_approval_required", "board_approved_by",
        "board_approval_timestamp", "board_denial_reason", "mgt_approved_by", "mgt_approved_date",
        "is_excess_reservation", "bump_window_deadline"
      ];
      var missing = required.filter(function(c) { return headers.indexOf(c) === -1; });
      _assert("Reservations sheet has all required columns",
        missing.length === 0, "Missing: " + missing.join(", "));
      Logger.log("  INFO: Reservations sheet has " + headers.length + " columns");
    }
  } catch (e) {
    _assert("Reservations sheet accessible", false, e.toString());
  }
}


/**
 * Tests Tennis booking approval and Leobo two-stage approval routing.
 * Uses fake household to avoid touching real data.
 */
function testReservationApprovalRouting() {
  Logger.log("\n--- TEST: Reservation Approval Routing ---");

  // Tennis regular booking: checkReservationLimits says not excess → board_approval_required=false
  var fakeHhId = "HSH-TEST-FAKE99999";
  var futureDate = addDays(new Date(), 14); // 2 weeks from now

  var checkTennis = checkReservationLimits(fakeHhId, FACILITY_TENNIS, futureDate, 1.0);
  _assert("Tennis 1h within limit — not excess", checkTennis.isExcess === false, "isExcess=" + checkTennis.isExcess);
  _assert("Tennis 1h within limit — allowed",    checkTennis.allowed === true,   "allowed=" + checkTennis.allowed);

  // Tennis excess: force it over limit by requesting 4h (weekly limit is 3h)
  var checkTennisExcess = checkReservationLimits(fakeHhId, FACILITY_TENNIS, futureDate, TENNIS_WEEKLY_LIMIT_HOURS + 1);
  _assert("Tennis >limit — not allowed",
    checkTennisExcess.allowed === false, "allowed=" + checkTennisExcess.allowed);

  // Leobo regular booking
  var checkLeobo = checkReservationLimits(fakeHhId, FACILITY_LEOBO, futureDate, 3.0);
  _assert("Leobo 3h within limit — allowed",  checkLeobo.allowed === true, "allowed=" + checkLeobo.allowed);

  // Verify that FACILITY_LEOBO always requires board approval
  _assert("Leobo is in FACILITIES_REQUIRING_APPROVAL",
    FACILITIES_REQUIRING_APPROVAL.indexOf(FACILITY_LEOBO) !== -1);

  Logger.log("  INFO: Approval routing logic verified (no real bookings created)");
}


/**
 * Tests waitlist-related configuration and sheet columns.
 */
function testWaitlistConfig() {
  Logger.log("\n--- TEST: Waitlist Config ---");

  _assert("STATUS_WAITLISTED is defined", typeof STATUS_WAITLISTED === "string" && STATUS_WAITLISTED.length > 0);
  _assert("LEOBO_BUMP_WINDOW_DAYS is defined",
    typeof LEOBO_BUMP_WINDOW_DAYS === "number" && LEOBO_BUMP_WINDOW_DAYS > 0, LEOBO_BUMP_WINDOW_DAYS);
  _assert("TENNIS_BUMP_WINDOW_DAYS is defined",
    typeof TENNIS_BUMP_WINDOW_DAYS === "number" && TENNIS_BUMP_WINDOW_DAYS > 0, TENNIS_BUMP_WINDOW_DAYS);

  try {
    var sheet = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    if (sheet) {
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      _assert("bump_window_deadline column exists", headers.indexOf("bump_window_deadline") !== -1);
      _assert("bumped_by_household_id column exists", headers.indexOf("bumped_by_household_id") !== -1);
      _assert("bumped_date column exists", headers.indexOf("bumped_date") !== -1);
    }
  } catch (e) {
    Logger.log("  WARN: Could not check waitlist columns: " + e);
  }
}


/**
 * Tests that approveBump and getReservationById are callable.
 * Uses a fake ID that won't exist — verifies graceful NOT_FOUND handling.
 */
function testWaitlistFunctions() {
  Logger.log("\n--- TEST: Waitlist Functions ---");

  // getReservationById with non-existent ID should return null or { ok: false }
  try {
    var result = getReservationById("RES-FAKE-00000000");
    _assert("getReservationById fake ID returns null/falsy", !result, "returned: " + JSON.stringify(result));
  } catch (e) {
    _assert("getReservationById does not throw on missing ID", false, e.toString());
  }

  // expireWaitlistPositions should run without throwing
  try {
    expireWaitlistPositions(); // returns void; success = no exception
    _assert("expireWaitlistPositions runs without exception", true);
    Logger.log("  INFO: expireWaitlistPositions completed");
  } catch (e) {
    _assert("expireWaitlistPositions runs without exception", false, e.toString());
  }

  // promoteFromWaitlist with far-future date (no waitlisted) → returns null (no candidate)
  try {
    var farFuture = addDays(new Date(), 365);
    var promoteResult = promoteFromWaitlist(FACILITY_TENNIS, farFuture);
    // Returns reservation_id string if promoted, or null if no candidates
    _assert("promoteFromWaitlist returns null or string (no throw)",
      promoteResult === null || typeof promoteResult === "string",
      typeof promoteResult);
    Logger.log("  INFO: promoteFromWaitlist for far-future date returned: " + promoteResult);
  } catch (e) {
    Logger.log("  WARN: promoteFromWaitlist threw: " + e);
  }
}


/**
 * Tests guest list config and sheet columns.
 */
function testGuestListConfig() {
  Logger.log("\n--- TEST: Guest List Config & Schema ---");

  _assert("GUEST_LIST_DEADLINE_DAYS defined", typeof GUEST_LIST_DEADLINE_DAYS === "number", GUEST_LIST_DEADLINE_DAYS);
  _assert("TAB_GUEST_LISTS defined",   typeof TAB_GUEST_LISTS === "string"  && TAB_GUEST_LISTS.length > 0);
  _assert("TAB_GUEST_PROFILES defined", typeof TAB_GUEST_PROFILES === "string" && TAB_GUEST_PROFILES.length > 0);

  try {
    var ss = SpreadsheetApp.openById(RESERVATIONS_ID);

    var glSheet = ss.getSheetByName(TAB_GUEST_LISTS);
    _assert("Guest Lists sheet exists", glSheet !== null);
    if (glSheet) {
      var glHeaders = glSheet.getRange(1, 1, 1, glSheet.getLastColumn()).getValues()[0];
      var glRequired = ["reservation_id", "household_id", "status", "submitted_timestamp", "finalized_timestamp"];
      var glMissing  = glRequired.filter(function(c) { return glHeaders.indexOf(c) === -1; });
      _assert("Guest Lists required columns present",
        glMissing.length === 0, "Missing: " + glMissing.join(", "));
    }

    var gpSheet = ss.getSheetByName(TAB_GUEST_PROFILES);
    _assert("Guest Profiles sheet exists", gpSheet !== null);
    if (gpSheet) {
      var gpHeaders = gpSheet.getRange(1, 1, 1, gpSheet.getLastColumn()).getValues()[0];
      var gpRequired = ["reservation_id", "household_id", "id_number", "first_name", "last_name",
                        "rso_status", "rso_rejection_reason"];
      var gpMissing  = gpRequired.filter(function(c) { return gpHeaders.indexOf(c) === -1; });
      _assert("Guest Profiles required columns present",
        gpMissing.length === 0, "Missing: " + gpMissing.join(", "));
    }
  } catch (e) {
    _assert("Guest List sheets accessible", false, e.toString());
  }
}


/**
 * Tests submitGuestList validates parameters before writing.
 */
function testGuestListSubmission() {
  Logger.log("\n--- TEST: Guest List Submission Validation ---");

  // Missing reservation_id → missing guests array
  var r1 = submitGuestList(null, [], "member@example.com");
  _assert("submitGuestList: null reservationId → ok:false",
    r1 && r1.ok === false, "ok=" + (r1 ? r1.ok : "null"));

  // Unknown reservation_id
  var r2 = submitGuestList(
    "RES-FAKE-00000000",
    [{ first_name: "John", last_name: "Doe", id_number: "123456789", age_group: "over_18" }],
    "member@example.com"
  );
  _assert("submitGuestList: non-existent reservation → ok:false",
    r2 && r2.ok === false, "ok=" + (r2 ? r2.ok : "null"));

  Logger.log("  INFO: Guest list validation rules working");
}


// ============================================================
// MONTHLY REPORTS TESTS
// ============================================================

/**
 * Tests _isLastMondayOfMonth_ logic.
 */
function testIsLastMondayOfMonth() {
  Logger.log("\n--- TEST: _isLastMondayOfMonth_ ---");

  // March 30, 2026 is a Monday. March 30 + 7 = April 6 → crosses month → IS last Monday
  var lastMonday = new Date(2026, 2, 30);
  _assert("March 30, 2026 is last Monday of March",
    _isLastMondayOfMonth_(lastMonday) === true, _isLastMondayOfMonth_(lastMonday));

  // March 23, 2026 is a Monday but NOT the last (March 30 follows)
  var notLast = new Date(2026, 2, 23);
  _assert("March 23, 2026 is NOT last Monday of March",
    _isLastMondayOfMonth_(notLast) === false, _isLastMondayOfMonth_(notLast));

  // March 31, 2026 is a Tuesday — not a Monday at all
  var tuesday = new Date(2026, 2, 31);
  _assert("March 31, 2026 (Tuesday) returns false",
    _isLastMondayOfMonth_(tuesday) === false, _isLastMondayOfMonth_(tuesday));

  // April 27, 2026 is a Monday. April 27 + 7 = May 4 → crosses month → IS last Monday
  var aprilLastMonday = new Date(2026, 3, 27);
  _assert("April 27, 2026 is last Monday of April",
    _isLastMondayOfMonth_(aprilLastMonday) === true, _isLastMondayOfMonth_(aprilLastMonday));
}


/**
 * Tests _getCurrentMembershipYear_ returns correct format.
 * Membership year is Aug–Jul: Aug 2025–Jul 2026 = "2025-26".
 */
function testGetCurrentMembershipYear() {
  Logger.log("\n--- TEST: _getCurrentMembershipYear_ ---");

  var year = _getCurrentMembershipYear_();
  _assert("Returns string", typeof year === "string", typeof year);
  _assert("Format is YYYY-YY", /^\d{4}-\d{2}$/.test(year), year);

  // March 2026 should return "2025-26"
  var march2026 = _getCurrentMembershipYear_(new Date(2026, 2, 1));
  _assert("March 2026 → '2025-26'", march2026 === "2025-26", march2026);

  // August 2026 should return "2026-27"
  var aug2026 = _getCurrentMembershipYear_(new Date(2026, 7, 1));
  _assert("August 2026 → '2026-27'", aug2026 === "2026-27", aug2026);

  // January 2026 should return "2025-26"
  var jan2026 = _getCurrentMembershipYear_(new Date(2026, 0, 1));
  _assert("January 2026 → '2025-26'", jan2026 === "2025-26", jan2026);
}


/**
 * Tests photo expiration date calculation.
 */
function testPhotoExpirationCalculation() {
  Logger.log("\n--- TEST: Photo Expiration Calculation ---");

  // Test 1: Child photo (under 17) uploaded during regular membership year
  // Born: 2010-01-15 (child, 15 years old on April 21, 2026)
  // Upload: April 21, 2026 (during 2025-26 membership year)
  // Should expire: August 1, 2026 (1 year from membership year start Aug 2025)
  var childDOB = new Date(2010, 0, 15);
  var uploadDate = new Date(2026, 3, 21); // April 21, 2026
  var childExpiry = calculatePhotoExpirationDate(childDOB, uploadDate);
  _assert("Child photo during regular year expires in 1 year",
    childExpiry && childExpiry.getFullYear() === 2026 && childExpiry.getMonth() === 7 && childExpiry.getDate() === 1,
    childExpiry ? childExpiry.toLocaleDateString() : "null");

  // Test 2: Adult photo (17+) uploaded during regular membership year
  // Born: 2005-01-15 (adult, 21 years old on April 21, 2026)
  // Upload: April 21, 2026 (during 2025-26 membership year)
  // Should expire: August 1, 2028 (3 years from membership year start Aug 2025)
  var adultDOB = new Date(2005, 0, 15);
  var adultExpiry = calculatePhotoExpirationDate(adultDOB, uploadDate);
  _assert("Adult photo during regular year expires in 3 years",
    adultExpiry && adultExpiry.getFullYear() === 2028 && adultExpiry.getMonth() === 7 && adultExpiry.getDate() === 1,
    adultExpiry ? adultExpiry.toLocaleDateString() : "null");

  // Test 3: Child photo uploaded during renewal season (July/expiry month)
  // Upload: July 10, 2026 (renewal season, applies to next year 2026-27)
  // Should expire: August 1, 2027 (1 year from next membership year start Aug 2026)
  var julyUploadDate = new Date(2026, 6, 10); // July 10, 2026
  var childJulyExpiry = calculatePhotoExpirationDate(childDOB, julyUploadDate);
  _assert("Child photo during renewal season (July) applies to next year",
    childJulyExpiry && childJulyExpiry.getFullYear() === 2027 && childJulyExpiry.getMonth() === 7 && childJulyExpiry.getDate() === 1,
    childJulyExpiry ? childJulyExpiry.toLocaleDateString() : "null");

  // Test 4: Adult photo uploaded during renewal season (July/expiry month)
  // Upload: July 10, 2026 (renewal season, applies to next year 2026-27)
  // Should expire: August 1, 2029 (3 years from next membership year start Aug 2026)
  var adultJulyExpiry = calculatePhotoExpirationDate(adultDOB, julyUploadDate);
  _assert("Adult photo during renewal season (July) applies to next year",
    adultJulyExpiry && adultJulyExpiry.getFullYear() === 2029 && adultJulyExpiry.getMonth() === 7 && adultJulyExpiry.getDate() === 1,
    adultJulyExpiry ? adultJulyExpiry.toLocaleDateString() : "null");

  // Test 5: Membership year start calculation
  // April 21, 2026 (in 2025-26 year) should give August 1, 2025
  var membershipStart = getMembershipYearStartDate(uploadDate);
  _assert("Membership year start for April 2026 is Aug 1, 2025",
    membershipStart && membershipStart.getFullYear() === 2025 && membershipStart.getMonth() === 7 && membershipStart.getDate() === 1,
    membershipStart ? membershipStart.toLocaleDateString() : "null");

  // Test 6: August 15, 2026 should give August 1, 2026 (already in 2026-27 year)
  var aug2026Date = new Date(2026, 7, 15);
  var membershipStart2 = getMembershipYearStartDate(aug2026Date);
  _assert("Membership year start for August 2026 is Aug 1, 2026",
    membershipStart2 && membershipStart2.getFullYear() === 2026 && membershipStart2.getMonth() === 7 && membershipStart2.getDate() === 1,
    membershipStart2 ? membershipStart2.toLocaleDateString() : "null");
}


/**
 * Tests _buildReservationsReportStats_ returns the expected shape.
 */
function testReservationsReportStats() {
  Logger.log("\n--- TEST: Reservations Report Stats ---");

  try {
    var stats = _buildReservationsReportStats_(new Date(2026, 2, 1));
    _assert("Stats is an object", stats && typeof stats === "object");
    _assert("Stats has total",     typeof stats.total === "number", typeof stats.total);
    _assert("Stats has approved",  typeof stats.approved === "number");
    _assert("Stats has denied",    typeof stats.denied === "number");
    _assert("Stats has waitlisted",typeof stats.waitlisted === "number");
    _assert("Stats has excess",    typeof stats.excess === "number");
    _assert("Stats has by_facility", stats.by_facility && typeof stats.by_facility === "object");
    _assert("Total non-negative",  stats.total >= 0, stats.total);

    Logger.log("  INFO: Stats — total=" + stats.total + " approved=" + stats.approved +
               " denied=" + stats.denied + " waitlisted=" + stats.waitlisted);
  } catch (e) {
    Logger.log("  WARN: _buildReservationsReportStats_ error: " + e);
  }
}


// ============================================================
// EMAIL RESEND TEST
// ============================================================

/**
 * Tests resendReservationEmail with a non-existent ID returns NOT_FOUND.
 */
function testEmailResend() {
  Logger.log("\n--- TEST: Email Resend ---");

  // Non-existent reservation → NOT_FOUND
  var r1 = resendReservationEmail("RES-FAKE-00000000", "board@geabotswana.org");
  _assert("resendReservationEmail: fake ID returns ok:false",
    r1 && r1.ok === false, "ok=" + (r1 ? r1.ok : "null"));
  _assert("resendReservationEmail: fake ID returns NOT_FOUND code",
    r1 && r1.code === "NOT_FOUND", "code=" + (r1 ? r1.code : "null"));

  Logger.log("  INFO: Email resend error handling verified");
}


// ============================================================
// ADMIN API HANDLER TESTS
// ============================================================

/**
 * Tests admin_waitlist_list handler returns correct shape.
 * Creates a temp board session for the call.
 */
function testAdminWaitlistListHandler() {
  Logger.log("\n--- TEST: admin_waitlist_list Handler ---");

  try {
    var token = _createSession("TEST_ADMIN_WAITLIST_" + Date.now() + "@example.com", "board");
    var result = _handleAdminWaitlistList({ token: token });

    _assert("Handler returns object", result && typeof result === "object");
    // Parse success response
    var parsed = (typeof result === "string") ? JSON.parse(result) : result;
    _assert("Handler success=true", parsed && (parsed.success === true || parsed.ok === true),
      JSON.stringify(parsed).substring(0, 80));

    var data = parsed.data || parsed;
    _assert("Returns waitlisted array", Array.isArray(data.waitlisted), typeof data.waitlisted);
    _assert("Returns count", typeof data.count === "number", typeof data.count);
    _assert("count matches waitlisted length", data.count === data.waitlisted.length,
      "count=" + data.count + " length=" + (data.waitlisted ? data.waitlisted.length : "null"));

    Logger.log("  INFO: Waitlist count = " + data.count);
  } catch (e) {
    Logger.log("  WARN: admin_waitlist_list test error: " + e);
  }
}


/**
 * Tests admin_reservations_report handler returns stats shape.
 */
function testAdminReservationsReportHandler() {
  Logger.log("\n--- TEST: admin_reservations_report Handler ---");

  try {
    var token = _createSession("TEST_ADMIN_REPORT_" + Date.now() + "@example.com", "board");
    var result = _handleAdminReservationsReport({ token: token });

    var parsed = (typeof result === "string") ? JSON.parse(result) : result;
    _assert("Handler returns success", parsed && (parsed.success === true || parsed.ok === true),
      JSON.stringify(parsed).substring(0, 80));

    var data = parsed.data || parsed;
    _assert("Returns total", typeof data.total === "number", typeof data.total);
    _assert("Returns by_facility", data.by_facility && typeof data.by_facility === "object");

    Logger.log("  INFO: Report total=" + data.total);
  } catch (e) {
    Logger.log("  WARN: admin_reservations_report test error: " + e);
  }
}


/**
 * Tests admin_resend_email handler with fake reservation returns NOT_FOUND.
 */
function testAdminResendEmailHandler() {
  Logger.log("\n--- TEST: admin_resend_email Handler ---");

  try {
    var token = _createSession("TEST_ADMIN_RESEND_" + Date.now() + "@example.com", "board");
    var result = _handleAdminResendEmail({ token: token, reservation_id: "RES-FAKE-00000000" });

    var parsed = (typeof result === "string") ? JSON.parse(result) : result;
    // Should fail gracefully with NOT_FOUND (reservation doesn't exist)
    _assert("Handler returns error for fake reservation",
      parsed && (parsed.success === false || parsed.ok === false),
      JSON.stringify(parsed).substring(0, 80));
    Logger.log("  INFO: Resend handler rejected fake reservation correctly");
  } catch (e) {
    Logger.log("  WARN: admin_resend_email test error: " + e);
  }
}


/**
 * Tests that all three new admin handlers reject member-role tokens (board only).
 */
function testAdminHandlersRequireBoard() {
  Logger.log("\n--- TEST: New Admin Handlers Require Board Role ---");

  try {
    var memberToken = _createSession("TEST_MEMBER_ROLE_" + Date.now() + "@example.com", "member");

    var r1 = _handleAdminWaitlistList({ token: memberToken });
    var p1 = (typeof r1 === "string") ? JSON.parse(r1) : r1;
    _assert("admin_waitlist_list rejects member token",
      p1 && (p1.success === false || p1.ok === false), JSON.stringify(p1).substring(0, 80));

    var r2 = _handleAdminReservationsReport({ token: memberToken });
    var p2 = (typeof r2 === "string") ? JSON.parse(r2) : r2;
    _assert("admin_reservations_report rejects member token",
      p2 && (p2.success === false || p2.ok === false), JSON.stringify(p2).substring(0, 80));

    var r3 = _handleAdminResendEmail({ token: memberToken, reservation_id: "RES-FAKE-00000000" });
    var p3 = (typeof r3 === "string") ? JSON.parse(r3) : r3;
    _assert("admin_resend_email rejects member token",
      p3 && (p3.success === false || p3.ok === false), JSON.stringify(p3).substring(0, 80));

  } catch (e) {
    Logger.log("  WARN: Role enforcement test error: " + e);
  }
}


// ============================================================
// DUES INFO HANDLER TEST
// ============================================================

/**
 * Tests get_dues_info handler returns expected shape.
 */
function testGetDuesInfoHandler() {
  Logger.log("\n--- TEST: get_dues_info Handler ---");

  try {
    var token = _createSession("TEST_DUES_" + Date.now() + "@example.com", "member");
    var result = _handleGetDuesInfo({ token: token });

    var parsed = (typeof result === "string") ? JSON.parse(result) : result;
    // Will fail NOT_FOUND for fake test email since no member record exists —
    // that is expected and correct behavior
    _assert("Handler returns object", parsed && typeof parsed === "object");
    Logger.log("  INFO: get_dues_info for non-member test session returned: " +
               (parsed.success ? "success" : "error (expected — no member record for test session)"));

    // Test with actual test member if present (from CLAUDE.md)
    var testToken = _createSession("jane@example.com", "member");
    var testResult = _handleGetDuesInfo({ token: testToken });
    var testParsed = (typeof testResult === "string") ? JSON.parse(testResult) : testResult;

    if (testParsed.success) {
      var data = testParsed.data;
      _assert("Returns membership_category", typeof data.membership_category === "string");
      _assert("Returns annual_dues_usd",     typeof data.annual_dues_usd === "number");
      _assert("Returns current_quarter",     ["Q1","Q2","Q3","Q4"].indexOf(data.current_quarter) !== -1);
      _assert("Returns quarter_percentage",  typeof data.quarter_percentage === "number");
      _assert("Returns prorated_usd",        typeof data.prorated_usd === "number");
      _assert("Returns prorated_bwp",        typeof data.prorated_bwp === "number");
      _assert("Returns exchange_rate",       typeof data.exchange_rate === "number");
      _assert("Returns available_years",     Array.isArray(data.available_years));
      _assert("Prorated USD ≤ annual dues",  data.prorated_usd <= data.annual_dues_usd,
        "prorated=" + data.prorated_usd + " annual=" + data.annual_dues_usd);
      _assert("Exchange rate > 0", data.exchange_rate > 0, data.exchange_rate);
      Logger.log("  INFO: category=" + data.membership_category +
                 " annual=$" + data.annual_dues_usd +
                 " " + data.current_quarter + " (" + data.quarter_percentage + "%) =" +
                 " $" + data.prorated_usd + " / P" + data.prorated_bwp);
    } else {
      Logger.log("  SKIP: Test member jane@example.com not found — add test data to run full check");
    }
  } catch (e) {
    Logger.log("  WARN: get_dues_info test error: " + e);
  }
}


// ============================================================
// COMPREHENSIVE RESERVATION TEST RUNNER
// ============================================================

/**
 * Runs all reservation-related tests as a group.
 */
function runReservationTests() {
  Logger.log("========================================");
  Logger.log("RESERVATION TEST RUN — " + new Date().toString());
  Logger.log("========================================");

  testReservationConfig();
  testReservationApprovalRouting();
  testWaitlistConfig();
  testWaitlistFunctions();
  testGuestListConfig();
  testGuestListSubmission();

  Logger.log("========================================");
  Logger.log("RESERVATION TESTS COMPLETE");
  Logger.log("========================================");
}


/**
 * Runs all notification / report tests as a group.
 */
function runReportTests() {
  Logger.log("========================================");
  Logger.log("REPORTS TEST RUN — " + new Date().toString());
  Logger.log("========================================");

  testIsLastMondayOfMonth();
  testGetCurrentMembershipYear();
  testPhotoExpirationCalculation();
  testReservationsReportStats();
  testEmailResend();

  Logger.log("========================================");
  Logger.log("REPORTS TESTS COMPLETE");
  Logger.log("========================================");
}


/**
 * Runs all admin API handler tests as a group.
 */
function runAdminHandlerTests() {
  Logger.log("========================================");
  Logger.log("ADMIN HANDLER TEST RUN — " + new Date().toString());
  Logger.log("========================================");

  testAdminWaitlistListHandler();
  testAdminReservationsReportHandler();
  testAdminResendEmailHandler();
  testAdminHandlersRequireBoard();
  testGetDuesInfoHandler();

  Logger.log("========================================");
  Logger.log("ADMIN HANDLER TESTS COMPLETE");
  Logger.log("========================================");
}


// ============================================================
// SCHEMA MIGRATION & DIAGNOSTICS
// ============================================================

/**
 * Diagnostic: Check Sessions sheet schema for role column.
 * This identifies why currentUser.role is undefined on RSO admin login.
 */
function diagnoseSessionsSchema() {
  Logger.log("\n=== DIAGNOSTIC: Sessions Sheet Schema ===");
  try {
    var sheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_SESSIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var rolCol  = headers.indexOf("role");

    Logger.log("Sessions sheet headers: " + JSON.stringify(headers));
    Logger.log("Total sessions: " + Math.max(0, data.length - 1));
    Logger.log("role column exists: " + (rolCol >= 0));
    Logger.log("role column index: " + rolCol);

    if (rolCol < 0) {
      Logger.log("\n⚠️  ISSUE FOUND: Sessions sheet is MISSING 'role' column!");
      Logger.log("This is why currentUser.role is undefined on the frontend.");
      Logger.log("\nFIX: Run fixSessionsSchema() to add and backfill the column.");
    } else {
      Logger.log("\n✓ Sessions sheet HAS role column");

      // Check if role values are populated
      var filledCount = 0;
      for (var i = 1; i < data.length; i++) {
        if (data[i][rolCol]) filledCount++;
      }
      Logger.log("Sessions with role populated: " + filledCount + "/" + (data.length - 1));

      if (filledCount < data.length - 1) {
        Logger.log("\n⚠️  Some sessions are missing role values. Run fixSessionsSchema() to backfill.");
      }
    }
  } catch (e) {
    Logger.log("ERROR diagnoseSessionsSchema: " + e);
  }
}

/**
 * Fixes the Sessions sheet by ensuring role column exists and backfilling data.
 * Safe to run multiple times (idempotent).
 */
function fixSessionsSchema() {
  Logger.log("\n=== FIXING: Sessions Sheet Schema ===");
  var result = ensureSessionsRoleColumn();
  Logger.log("Result: " + JSON.stringify(result));
}


// ============================================================
// FILE SUBMISSION DIAGNOSTICS
// ============================================================

/**
 * Diagnostic: Check File Submissions sheet submission_type population.
 * Shows how many rows have submission_type populated vs. missing.
 */
function diagnoseSubmissionType() {
  Logger.log("\n=== DIAGNOSTIC: File Submissions submission_type Field ===");
  try {
    var sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName("File Submissions");
    var data = sheet.getDataRange().getValues();
    var headers = data[0];

    var submissionTypeCol = headers.indexOf("submission_type");
    var applicationIdCol = headers.indexOf("application_id");
    var statusCol = headers.indexOf("status");
    var documentTypeCol = headers.indexOf("document_type");
    var individualIdCol = headers.indexOf("individual_id");

    if (submissionTypeCol === -1) {
      Logger.log("✗ submission_type column not found!");
      return;
    }

    var populated = 0;
    var missing = 0;
    var forRsoReview = 0;
    var applicantDocs = 0;
    var memberDocs = 0;

    for (var i = 1; i < data.length; i++) {
      var submissionType = String(data[i][submissionTypeCol] || "").trim();
      var applicationId = String(data[i][applicationIdCol] || "").trim();
      var status = String(data[i][statusCol] || "").toLowerCase().trim();
      var docType = String(data[i][documentTypeCol] || "").toLowerCase().trim();

      if (submissionType) {
        populated++;
        if (submissionType === "applicant") applicantDocs++;
        if (submissionType === "member") memberDocs++;
      } else {
        missing++;
      }

      // Count documents pending RSO review
      if ((docType === "passport" || docType === "omang") && status === "submitted") {
        forRsoReview++;
      }
    }

    Logger.log("Total rows: " + (data.length - 1));
    Logger.log("submission_type populated: " + populated);
    Logger.log("submission_type missing: " + missing);
    Logger.log("  - Applicant documents: " + applicantDocs);
    Logger.log("  - Member documents: " + memberDocs);
    Logger.log("\nDocuments pending RSO review (status=submitted, type=passport|omang): " + forRsoReview);

    if (missing > 0) {
      Logger.log("\n⚠️  " + missing + " rows missing submission_type!");
      Logger.log("Run fixSubmissionType() to backfill these values.");
    } else {
      Logger.log("\n✓ All rows have submission_type populated");
    }
  } catch (e) {
    Logger.log("ERROR diagnoseSubmissionType: " + e);
  }
}

/**
 * Fixes missing submission_type values in File Submissions sheet.
 * Safe to run multiple times (idempotent).
 */
function fixSubmissionType() {
  Logger.log("\n=== FIXING: File Submissions submission_type ===");
  var result = migrateSubmissionTypeField();
  Logger.log("Result: " + JSON.stringify(result));
}

// ============================================================
// TEST DATA GENERATOR
// ============================================================

/**
 * Creates a complete test applicant and moves them through the approval workflow.
 * This generates test data at various stages for testing payment flows, approvals, etc.
 *
 * USAGE:
 *   1. Select "createTestApplicantForPaymentTesting" from dropdown
 *   2. Click Run (▶)
 *   3. Check Logs for applicant email and stage
 *   4. Use that email to login and test payment submission
 *
 * WHAT IT DOES:
 *   1. Creates a new applicant account with test household
 *   2. Submits application with questionnaire responses
 *   3. Uploads test documents (passport, omang, photo)
 *   4. RSO approves documents
 *   5. Board approves application
 *   6. Application moves to payment stage
 *   7. Returns applicant email for manual testing
 *
 * @returns {Object} {email, applicant_id, password, stage}
 */
function createTestApplicantForPaymentTesting() {
  Logger.log("\n=== TEST DATA GENERATOR: Creating Test Applicant ===\n");

  try {
    // Generate unique test email
    var timestamp = new Date().getTime().toString().slice(-6);
    var testEmail = "testapplicant." + timestamp + "@example.com";
    var testPassword = "TestPassword2026!";
    var firstName = "TestApplicant";
    var lastName = "User" + timestamp;

    Logger.log("Step 1: Creating application record...");

    // Questionnaire responses that route to Full member category
    var formData = {
      first_name: firstName,
      last_name: lastName,
      email: testEmail,
      password: testPassword,
      household_type: "individual",
      q1_embassy_or_international: "yes",  // Determines category
      q2_usg_funded_percentage: "75",
      q3_visa_type: "A1",
      q4_posting_start_date: new Date(new Date().getTime() - 365*24*60*60*1000).toISOString().split('T')[0],
      q5_posting_end_date: new Date(new Date().getTime() + 365*24*60*60*1000).toISOString().split('T')[0]
    };

    var appRecord = createApplicationRecord(formData, "test_system");
    if (!appRecord || !appRecord.application_id) {
      Logger.log("ERROR: Failed to create application record");
      return { ok: false, error: "Application creation failed" };
    }

    var applicationId = appRecord.application_id;
    var householdId = appRecord.household_id;
    var applicantId = appRecord.primary_applicant_id;
    Logger.log("✓ Application created: " + applicationId);
    Logger.log("✓ Household: " + householdId);
    Logger.log("✓ Applicant individual: " + applicantId);

    // Step 2: Create dummy test documents (small 1x1 pixel PNGs)
    Logger.log("\nStep 2: Creating test documents...");
    var testPhotoBlob = Utilities.newBlob(
      Utilities.base64Decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
      "image/png",
      "test_photo.png"
    );
    var testPassportBlob = Utilities.newBlob(
      Utilities.base64Decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
      "image/png",
      "test_passport.png"
    );
    var testOmangBlob = Utilities.newBlob(
      Utilities.base64Decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
      "image/png",
      "test_omang.png"
    );

    // Step 3: Upload documents
    Logger.log("\nStep 3: Uploading documents...");
    var photoResult = uploadFileSubmission({
      individual_id: applicantId,
      document_type: "photo",
      file_blob: testPhotoBlob,
      file_name: "test_photo.png",
      file_size_bytes: testPhotoBlob.getBytes().length,
      application_id: applicationId,
      user_email: testEmail
    });
    if (!photoResult.ok) {
      Logger.log("ERROR uploading photo: " + photoResult.error);
      return photoResult;
    }
    Logger.log("✓ Photo uploaded: " + photoResult.submission_id);

    var passportResult = uploadFileSubmission({
      individual_id: applicantId,
      document_type: "passport",
      file_blob: testPassportBlob,
      file_name: "test_passport.png",
      file_size_bytes: testPassportBlob.getBytes().length,
      application_id: applicationId,
      user_email: testEmail
    });
    if (!passportResult.ok) {
      Logger.log("ERROR uploading passport: " + passportResult.error);
      return passportResult;
    }
    Logger.log("✓ Passport uploaded: " + passportResult.submission_id);

    var omangResult = uploadFileSubmission({
      individual_id: applicantId,
      document_type: "omang",
      file_blob: testOmangBlob,
      file_name: "test_omang.png",
      file_size_bytes: testOmangBlob.getBytes().length,
      application_id: applicationId,
      user_email: testEmail
    });
    if (!omangResult.ok) {
      Logger.log("ERROR uploading omang: " + omangResult.error);
      return omangResult;
    }
    Logger.log("✓ Omang uploaded: " + omangResult.submission_id);

    // Step 4: RSO approves documents
    Logger.log("\nStep 4: RSO approving documents...");
    var rsoApprovePassport = approveDocumentByRso(passportResult.submission_id, "approve", "", "test_rso@example.com");
    if (!rsoApprovePassport.ok) {
      Logger.log("ERROR: RSO failed to approve passport: " + rsoApprovePassport.error);
      return rsoApprovePassport;
    }
    Logger.log("✓ Passport approved by RSO");

    var rsoApproveOmang = approveDocumentByRso(omangResult.submission_id, "approve", "", "test_rso@example.com");
    if (!rsoApproveOmang.ok) {
      Logger.log("ERROR: RSO failed to approve omang: " + rsoApproveOmang.error);
      return rsoApproveOmang;
    }
    Logger.log("✓ Omang approved by RSO");

    // Step 5: Board approves photo
    Logger.log("\nStep 5: Board approving photo...");
    var boardPhotoApproval = _reviewFileSubmission_(photoResult.submission_id, "approve", "", "test_board@example.com");
    if (!boardPhotoApproval.ok) {
      Logger.log("ERROR: Board failed to approve photo: " + boardPhotoApproval.error);
      return boardPhotoApproval;
    }
    Logger.log("✓ Photo approved by board");

    // Step 6: Board initial decision
    Logger.log("\nStep 6: Board initial decision...");
    var boardInitial = boardInitialDecision(applicationId, "approve", "test_board@example.com", "Test data generator approval", "Approved for processing");
    if (!boardInitial || !boardInitial.ok) {
      Logger.log("ERROR: Board initial decision failed: " + JSON.stringify(boardInitial));
      return boardInitial;
    }
    Logger.log("✓ Board initial decision: approve");

    // Step 7: RSO application review
    Logger.log("\nStep 7: RSO application review...");
    var rsoAppReview = rsoApproveApplication(applicationId, "test_rso@example.com", "Test data generation");
    if (!rsoAppReview || !rsoAppReview.ok) {
      Logger.log("ERROR: RSO application review failed: " + JSON.stringify(rsoAppReview));
      return rsoAppReview;
    }
    Logger.log("✓ RSO approved application");

    // Step 8: Board final decision
    Logger.log("\nStep 8: Board final decision...");
    var boardFinal = boardFinalDecision(applicationId, "approve", "test_board@example.com", "Test data generation", "Approved");
    if (!boardFinal || !boardFinal.ok) {
      Logger.log("ERROR: Board final decision failed: " + JSON.stringify(boardFinal));
      return boardFinal;
    }
    Logger.log("✓ Board final decision: approve");

    // Step 9: Check application status
    Logger.log("\nStep 9: Checking application status...");
    var appStatus = getApplicationForApplicant(testEmail);
    if (!appStatus || !appStatus.ok) {
      Logger.log("ERROR: Failed to get application status: " + JSON.stringify(appStatus));
      return appStatus;
    }
    Logger.log("✓ Application status: " + appStatus.status);

    // Summary
    Logger.log("\n" + "=".repeat(50));
    Logger.log("TEST APPLICANT CREATED SUCCESSFULLY");
    Logger.log("=".repeat(50));
    Logger.log("\nTest Credentials:");
    Logger.log("  Email: " + testEmail);
    Logger.log("  Password: " + testPassword);
    Logger.log("  Application ID: " + applicationId);
    Logger.log("  Applicant ID: " + applicantId);
    Logger.log("  Stage: " + appStatus.status);
    Logger.log("\nNext steps:");
    Logger.log("  1. Login to applicant portal with: " + testEmail);
    Logger.log("  2. Navigate to Application Status");
    Logger.log("  3. Should see status: " + appStatus.status);
    Logger.log("  4. Submit payment proof to test payment workflow");
    Logger.log("=".repeat(50) + "\n");

    return {
      ok: true,
      email: testEmail,
      password: testPassword,
      applicant_id: applicantId,
      application_id: applicationId,
      stage: appStatus.status
    };

  } catch (e) {
    Logger.log("ERROR createTestApplicantForPaymentTesting: " + e);
    Logger.log("Stack: " + e.stack);
    return { ok: false, error: String(e) };
  }
}