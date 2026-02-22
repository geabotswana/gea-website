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

  Logger.log("========================================");
  Logger.log("TEST RUN COMPLETE — Check above for FAIL");
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