/**
 * ============================================================
 * GEA MEMBER PORTAL - CONFIGURATION FILE
 * ============================================================
 *
 * PURPOSE:
 * This file contains ALL settings, IDs, and constants that
 * the GEA system needs to function. If you need to update a
 * spreadsheet ID, change a business rule, or modify system
 * behavior, this is the ONLY file you should need to edit
 * for most changes.
 *
 * HOW TO FIND SPREADSHEET IDs:
 * Open the spreadsheet in Google Drive. Look at the URL:
 * https://docs.google.com/spreadsheets/d/[ID IS HERE]/edit
 * Copy the long string between /d/ and /edit
 *
 * HOW TO FIND FOLDER IDs:
 * Open the folder in Google Drive. Look at the URL:
 * https://drive.google.com/drive/folders/[ID IS HERE]
 * Copy the string after /folders/
 *
 * IMPORTANT: After editing this file, click the save icon
 * (or Ctrl+S / Cmd+S) before running any functions.
 *
 * SYSTEM: Gaborone Employee Association Management System
 * WEBSITE: www.geabotswana.org
 * LAST UPDATED: February 22, 2026
 * UPDATED BY: Claude Code (Sequential eligibility flow + sponsor requirements + exchange rate mechanism)
 * ============================================================
 */


// ============================================================
// SECTION 1: SPREADSHEET IDs
// ============================================================
// These are the unique identifiers for each Google Sheets
// document that the system uses to store data.
// To find: Open spreadsheet → look at URL between /d/ and /edit
// ============================================================

var MEMBER_DIRECTORY_ID   = "1sziizIl6-iOMDgVx5okS3uuu_s5P7caytJt650zWGKg";
var RESERVATIONS_ID       = "1ex842fsnFpAnlh-5QE-u6xaBMTO52JGQTsriaxjk2EI";
var SYSTEM_BACKEND_ID     = "1WvN4xU_ZxElwpkXQVdt0HlUkjXcCA_ZaImklSLvuzeI";
var PAYMENT_TRACKING_ID   = "1w6XxUwaEq_-sLAn3edy8JYkL2EBNwgDAfkz0GHlD8zg";

// Calender ID here
var CALENDAR_ID = "c_fda2222a95ea7079e2d0dffb7661c39a118076c5010848c2e9013ef44257df49db@group.calendar.google.com";

// ============================================================
// SECTION 2: SPREADSHEET TAB NAMES
// ============================================================
// These are the exact names of each tab (sheet) within the
// spreadsheets above. If you rename a tab, update it here.
// ============================================================

// GEA Member Directory tabs
var TAB_HOUSEHOLDS          = "Households";
var TAB_INDIVIDUALS         = "Individuals";
var TAB_FILE_SUBMISSIONS    = "File Submissions";
var TAB_MEMBERSHIP_LEVELS   = "Membership Levels";

// GEA Reservations tabs
var TAB_RESERVATIONS        = "Reservations";
var TAB_GUEST_LISTS         = "Guest Lists";
var TAB_USAGE_TRACKING      = "Usage Tracking";

// GEA System Backend tabs
var TAB_CONFIGURATION       = "Configuration";
var TAB_EMAIL_TEMPLATES     = "Email Templates";
var TAB_AUDIT_LOG           = "Audit Log";
var TAB_MEMBERSHIP_APPLICATIONS = "Membership Applications";
var TAB_HOLIDAY_CALENDAR    = "Holiday Calendar";
var TAB_SESSIONS            = "Sessions";

// GEA Payment Tracking tabs
var TAB_PAYMENTS            = "Payments";


// ============================================================
// SECTION 3: GOOGLE DRIVE FOLDER IDs
// ============================================================
// These are the unique identifiers for each folder in the
// GEA Administration Shared Drive.
// To find: Open folder → look at URL after /folders/
// ============================================================

var FOLDER_PHOTOS_PENDING           = "1NFdaFXAStYA2nYGLlZ2itbB-Ap9WMoy-";
var FOLDER_PHOTOS_APPROVED          = "1YU3C99eCyzU3DbW_iLw65bNSUiognOW3";
var FOLDER_DOCUMENTS                = "1z_u96Ooc45SluZkbL_Z4JQcgfd3WBpFK";
var FOLDER_MEMBERSHIP_APPLICATIONS  = "1NNSnUQElNRl1pDzr0pYVlTzXJod2aN6T";
var FOLDER_BRAND_ASSETS             = "1kxQ0hcFO3jQHIiOro2HksaJw56lpvDV0";
var FOLDER_PAYMENT_CONFIRMATIONS    = "1vmcu23niZhkC6b2Ctw6gmVLxwM2dKUee";
var FOLDER_PASSPORT_SCANS           = "1uNDYDRLo_NpHTgNMvdiobuni5Jm_6kk8";


// ============================================================
// SECTION 4: LOGO AND BRAND ASSET OBJECT PATHS (GCS)
// ============================================================
// Google Cloud Storage public bucket: gea-public-assets
// Format: https://storage.googleapis.com/gea-public-assets/[object-name]
// All images publicly readable (allUsers has Storage Object Viewer role)
// ============================================================

// Favicon - displayed in browser tab
var FAVICON_URL = "https://storage.googleapis.com/gea-public-assets/gea-logo-round-32.png";

// Logos - Round (used in headers, cards, email)
var LOGO_ROUND_80_URL = "https://storage.googleapis.com/gea-public-assets/gea-logo-round-80.png";     // 80px - email header
var LOGO_ROUND_120_URL = "https://storage.googleapis.com/gea-public-assets/gea-logo-round-120.png";   // 120px - membership card
var LOGO_ROUND_160_URL = "https://storage.googleapis.com/gea-public-assets/gea-logo-round-160.png";   // 160px - retina email
var LOGO_ROUND_200_URL = "https://storage.googleapis.com/gea-public-assets/gea-logo-round-200.png";   // 200px - website
var LOGO_ROUND_240_URL = "https://storage.googleapis.com/gea-public-assets/gea-logo-round-240.png";   // 240px - retina card

// Logotype - Light version (dark text, for white/light backgrounds)
var LOGO_TYPE_LIGHT_560_URL = "https://storage.googleapis.com/gea-public-assets/gea-logotype-light-560.png";   // email
var LOGO_TYPE_LIGHT_800_URL = "https://storage.googleapis.com/gea-public-assets/gea-logotype-light-800.png";   // website/print
var LOGO_TYPE_LIGHT_1120_URL = "https://storage.googleapis.com/gea-public-assets/gea-logotype-light-1120.png"; // retina email

// Logotype - Dark version (white text, for dark backgrounds)
var LOGO_TYPE_DARK_560_URL = "https://storage.googleapis.com/gea-public-assets/gea-logotype-dark-560.png";     // dark backgrounds
var LOGO_TYPE_DARK_800_URL = "https://storage.googleapis.com/gea-public-assets/gea-logotype-dark-800.png";     // website header
var LOGO_TYPE_DARK_1120_URL = "https://storage.googleapis.com/gea-public-assets/gea-logotype-dark-1120.png";   // dark retina


// ============================================================
// SECTION 5: BRAND COLORS
// ============================================================
// Official GEA color palette.
// Used in HTML emails and web app interfaces.
// ============================================================

// Primary brand colors
var COLOR_OLD_GLORY_BLUE  = "#0A3161";   // Primary: headers, buttons, headings
var COLOR_OLD_GLORY_RED   = "#B31942";   // Accent: decorative elements, alerts
var COLOR_WHITE           = "#FFFFFF";   // Backgrounds, text on dark
var COLOR_BOTSWANA_BLUE   = "#ABCAE9";   // Secondary: info boxes, subtle highlights
var COLOR_BLACK           = "#000000";   // Body text

// Functional colors (status indicators)
var COLOR_SUCCESS         = "#2E7D32";   // Approved, confirmed, valid, active
var COLOR_WARNING         = "#E65100";   // Pending, tentative, approaching deadlines
var COLOR_DANGER          = "#C62828";   // Denied, cancelled, urgent, overdue
var COLOR_INFO            = "#1565C0";   // Informational notices

// Supporting colors
var COLOR_LIGHT_GRAY      = "#F5F5F5";   // Page backgrounds, subtle separators
var COLOR_MEDIUM_GRAY     = "#757575";   // Secondary text, labels
var COLOR_BORDER_GRAY     = "#E0E0E0";   // Dividers, borders


// ============================================================
// SECTION 6: EMAIL ADDRESSES
// ============================================================
// Update these when board positions change hands.
// Distribution lists (Groups) are managed in Google Admin.
// ============================================================

// Board member accounts
var EMAIL_CHAIR           = "chair@geabotswana.org";
var EMAIL_TREASURER       = "treasurer@geabotswana.org";
var EMAIL_SECRETARY       = "secretary@geabotswana.org";

// Distribution lists (Google Groups)
var EMAIL_BOARD           = "board@geabotswana.org";
var EMAIL_MEMBERS         = "members@geabotswana.org";
var EMAIL_RSO             = "treasurer@geabotswana.org";
var EMAIL_MGT             = "mgt-notify@geabotswana.org";

// Legacy institutional email (recovery/backup only - do not use for operations)
var EMAIL_LEGACY          = "geaboard@gmail.com";

// System sender name (appears in "From" field of automated emails)
var EMAIL_SENDER_NAME     = "Gaborone Employee Association";


// ============================================================
// SECTION 7: ASSOCIATION INFORMATION
// ============================================================
// Basic information used in emails, cards, and the website.
// ============================================================

var ASSOCIATION_NAME          = "Gaborone Employee Association";
var ASSOCIATION_SHORT_NAME    = "GEA";
var ASSOCIATION_WEBSITE       = "www.geabotswana.org";
var ASSOCIATION_WEBSITE_FULL  = "https://www.geabotswana.org";
var ASSOCIATION_EMAIL         = "board@geabotswana.org";
var ASSOCIATION_LOCATION      = "U.S. Mission to Botswana, Gaborone";
var CURRENT_MEMBERSHIP_YEAR   = "2025-2026";  // Update each renewal cycle


// ============================================================
// SECTION 8: MEMBERSHIP CONFIGURATION
// ============================================================
// Membership category identifiers and business rules.
// Dues amounts are stored in the Membership Levels spreadsheet
// tab, but category names are referenced here for code logic.
// ============================================================

// Membership categories (must match membership_category column in Membership Levels tab)
var CATEGORY_FULL         = "Full";
var CATEGORY_AFFILIATE    = "Affiliate";
var CATEGORY_ASSOCIATE    = "Associate";
var CATEGORY_DIPLOMATIC   = "Diplomatic";
var CATEGORY_COMMUNITY    = "Community";
var CATEGORY_TEMPORARY    = "Temporary";

// Household types
var HOUSEHOLD_INDIVIDUAL  = "Individual";
var HOUSEHOLD_FAMILY      = "Family";

// Relationship types (must match relationship_to_primary column in Individuals tab)
var RELATIONSHIP_PRIMARY  = "Primary";
var RELATIONSHIP_SPOUSE   = "Spouse";
var RELATIONSHIP_CHILD    = "Child";
var RELATIONSHIP_STAFF    = "Staff";

// Membership categories that require a sponsor
// Sponsors must be PAID Full members (full_indiv or full_family)
// Temporary members do NOT require a sponsor
var CATEGORIES_REQUIRING_SPONSOR = [
  CATEGORY_AFFILIATE,
  CATEGORY_ASSOCIATE,
  CATEGORY_DIPLOMATIC,
  CATEGORY_COMMUNITY
];

// Maximum duration for Temporary membership (months)
var MAX_TEMPORARY_MONTHS  = 6;

// Sponsor requirements
var SPONSOR_MUST_BE_FULL      = true;    // Sponsor must be Full member
var SPONSOR_MUST_BE_PAID      = true;    // Sponsor membership dues must be paid
var SPONSOR_MUST_BE_ACTIVE    = true;    // Sponsor membership must be active (not expired)


// ============================================================
// SECTION 9: AGE THRESHOLDS
// ============================================================
// Age-based access rules. Stored as config parameters so
// future boards can adjust via the Admin Interface without
// changing code.
// These values should mirror the Configuration tab in
// GEA System Backend spreadsheet.
// ============================================================

var AGE_UNACCOMPANIED_ACCESS  = 15;  // Minimum age: unaccompanied rec center access
var AGE_FITNESS_CENTER        = 15;  // Minimum age: fitness center use
var AGE_VOTING                = 16;  // Minimum age: vote in elections
var AGE_OFFICE_ELIGIBLE       = 16;  // Minimum age: hold board position
var AGE_DOCUMENT_REQUIRED     = 16;  // Minimum age: passport/ID upload required
                                     // (under-16 policy pending board review)


// ============================================================
// SECTION 10: FACILITY RESERVATION RULES
// ============================================================
// Booking limits and business rules for each facility.
// ============================================================

// Tennis / Basketball Court
var TENNIS_WEEKLY_LIMIT_HOURS   = 3;      // Max hours per household per week
var TENNIS_SESSION_MAX_HOURS    = 2;      // Max hours per single session
var TENNIS_WALKIN_AVAILABLE     = true;   // Allow walk-up use when not reserved
var TENNIS_BUMP_WINDOW_DAYS     = 1;      // Calendar days before event: can be bumped

// Leobo (and Whole Facility)
var LEOBO_MONTHLY_LIMIT         = 1;      // Max reservations per household per month
var LEOBO_MAX_HOURS             = 6;      // Max hours per leobo reservation
var LEOBO_BUMP_WINDOW_DAYS      = 5;      // Business days before event: can be bumped

// Guest list
var GUEST_LIST_DEADLINE_DAYS    = 3;      // Business days before event for RSO notice

// Board approval
var BOARD_APPROVAL_HOURS        = 24;     // Expected turnaround for board approval (hours)

// Reservation statuses
// These are the valid values for the status column in the Reservations tab
var STATUS_PENDING      = "Pending";      // Awaiting approval
var STATUS_APPROVED     = "Approved";     // Approved standard reservation
var STATUS_TENTATIVE    = "Tentative";    // Approved excess reservation (subject to bumping)
var STATUS_CONFIRMED    = "Confirmed";    // Past bumping window - fully locked in
var STATUS_CANCELLED    = "Cancelled";    // Cancelled for any reason
var STATUS_COMPLETED    = "Completed";    // Event date has passed
var STATUS_WAITLISTED   = "Waitlisted";   // On waitlist for a taken slot

// Facilities (must match facility column in Reservations tab)
var FACILITY_TENNIS     = "Tennis Court";
var FACILITY_LEOBO      = "Leobo";
var FACILITY_WHOLE      = "Whole Facility";

// Facilities that require board/MGT approval
var FACILITIES_REQUIRING_APPROVAL = [
  FACILITY_LEOBO,
  FACILITY_WHOLE
];


// ============================================================
// SECTION 11: STAFF MEMBER RULES
// ============================================================
// Household staff (nannies, caregivers) have limited access.
// They are in the member database but have restricted privileges.
// ============================================================

var STAFF_MAX_CHILDREN          = 99;    // Max children staff can escort (99 = unlimited)
var STAFF_GUEST_CHILDREN        = false; // Can staff bring non-member children? NO
var STAFF_RESERVATION_ALLOWED   = false; // Can staff make reservations? NO
var STAFF_LEOBO_ACCESS          = false; // Can staff access leobo independently? NO
var STAFF_EMAIL_REQUIRED        = false; // Is email address required for staff? NO


// ============================================================
// SECTION 12: DOCUMENT VERIFICATION
// ============================================================
// Rules for passport/ID uploads during membership application.
// ============================================================

// Accepted document types by citizen category
var DOCS_BOTSWANA_CITIZENS      = ["Omang", "Passport"];   // Either accepted
var DOCS_OTHER_CITIZENS         = ["Passport"];             // Passport required
var DOCS_FULL_MEMBERS           = ["Passport", "Omang"];   // Required for all

// Document types (must match document_type column in Individuals tab)
var DOC_TYPE_PASSPORT   = "Passport";
var DOC_TYPE_OMANG      = "Omang";
var DOC_TYPE_NATIONAL   = "National ID";
var DOC_TYPE_NONE       = "None";

// Passport expiration warning (months before expiry to notify member)
var PASSPORT_WARNING_MONTHS     = 6;

// Youth document policy
var YOUTH_DOCUMENT_REQUIRED     = false; // Require docs for under-16? (pending review)


// ============================================================
// SECTION 13: PAYMENT CONFIGURATION
// ============================================================
// Payment methods and account details.
// Dues amounts in USD and BWP are kept in GEA Member Directory.Membership Levels.
// ============================================================

// Payment methods (must match payment_method column in Payments tab)
var PAYMENT_SDFCU       = "SDFCU";
var PAYMENT_PAYPAL      = "PayPal";
var PAYMENT_ZELLE       = "Zelle";
var PAYMENT_ABSA        = "ABSA";
var PAYMENT_OTHER       = "Other";

// SDFCU (USD bank transfer - US-based)
var SDFCU_ACCOUNT_NAME  = "Gaborone Employee Association";
var SDFCU_BANK_ADDRESS  = "SDFCU - 1630 King Street, Alexandria, VA 22314";
var SDFCU_ACCOUNT_NUM   = "1010000268360";
var SDFCU_ROUTING_NUM   = "256075342";
var SDFCU_MEMBER_CODE   = "GEA2026";

// PayPal
var PAYPAL_LINK         = "https://www.paypal.biz/GEABoard";
var PAYPAL_EMAIL        = "Geaboard@gmail.com";

// Zelle
var ZELLE_EMAIL         = "Geaboard@gmail.com";

// ABSA (BWP bank transfer - Botswana-based)
var ABSA_ACCOUNT_NAME   = "U.S. Embassy - Gaborone Employee Association";
var ABSA_ACCOUNT_NUM    = "1005193";
var ABSA_BRANCH         = "02 (Government Enclave Branch)";
var ABSA_SWIFT          = "BARCBWGX";


// ============================================================
// SECTION 13B: CURRENCY EXCHANGE RATE
// ============================================================
// USD dues are canonical. BWP dues are calculated using a monthly
// exchange rate (1 USD = X BWP). Board sets the exchange rate
// monthly, typically mid-month or at board meeting.
//
// MECHANISM:
// - Dues are stored in MEMBERSHIP_LEVELS tab as USD (canonical)
// - When applicant pays in BWP, system multiplies: USD Dues × Exchange Rate
// - Example: Full indiv = $50 USD × 12.5 = P625 (vs. standard P700)
// - Exchange rate published monthly; members see both USD and calculated BWP amount
// ============================================================

// Current monthly exchange rate (USD to BWP)
// Update this value each month after board decision on rate
// Example: 1 USD = 13.5 BWP (use decimal value)
var EXCHANGE_RATE_USD_TO_BWP = 13.5;

// Month and year of last rate update (for reference)
var EXCHANGE_RATE_LAST_UPDATED = "February 22, 2026";

// Authorized board members who can update exchange rate
// (Consider implementing update restriction to board treasurer/secretary)
var EXCHANGE_RATE_UPDATE_ALLOWED_ROLES = ["treasurer", "secretary"];

// Decimal places for BWP display (typically 0 for pula amounts)
var CURRENCY_DECIMAL_PLACES_BWP = 0;
var CURRENCY_DECIMAL_PLACES_USD = 2;


// ============================================================
// SECTION 14: NOTIFICATION AND SCHEDULING
// ============================================================
// Settings for automated emails and scheduled tasks.
// All nightly checks run via Apps Script time-driven triggers.
// ============================================================

// Membership renewal reminders (days before expiration)
var RENEWAL_REMINDER_DAYS_1     = 30;    // First reminder: 30 days before expiry
var RENEWAL_REMINDER_DAYS_2     = 7;     // Second reminder: 7 days before expiry

// RSO daily summary
var RSO_SUMMARY_HOUR            = 6;     // Hour to send daily summary (6 = 6:00 AM)
var RSO_SUMMARY_TIMEZONE        = "Africa/Gaborone";

// Holiday calendar reminder
var HOLIDAY_REMINDER_MONTH      = 11;    // Month to send reminder (11 = November)
var HOLIDAY_REMINDER_DAY        = 1;     // Day of month to send reminder

// Waitlist slot hold time
var WAITLIST_HOLD_HOURS         = 24;    // Hours to hold a slot for waitlisted member

// Birthday notifications
var BIRTHDAY_CHECK_HOUR         = 7;     // Hour to send birthday emails (7 = 7:00 AM)

// Photo submission reminder
var PHOTO_REMINDER_DAYS_AFTER   = 7;     // Days after activation to remind if no photo

// Session duration
var SESSION_TIMEOUT_HOURS       = 24;     // Sessions expire after 24 hours of inactivity

// ============================================================
// SECTION 15: HOLIDAY CALENDAR
// ============================================================
// Holiday types used in the Holiday Calendar tab.
// Business day calculations exclude weekends + these holidays.
// Admin can update holidays annually via Admin Interface.
// ============================================================

var HOLIDAY_TYPE_US         = "US Federal";       // US federal holidays
var HOLIDAY_TYPE_BOTSWANA   = "Botswana Public";  // Botswana public holidays
var HOLIDAY_TYPE_ONEOFF     = "One-Off";           // Ad hoc declared holidays

// Holiday calendar scope
var HOLIDAY_CALENDARS = ["US Federal", "Botswana Public", "One-Off"];


// ============================================================
// SECTION 16: PHOTO MANAGEMENT
// ============================================================
// Rules for member photo uploads and approval.
// ============================================================

// Photo statuses (must match photo_status column in Individuals tab)
var PHOTO_STATUS_NONE       = "none";
var PHOTO_STATUS_PENDING    = "pending";
var PHOTO_STATUS_APPROVED   = "approved";
var PHOTO_STATUS_REJECTED   = "rejected";

// Photo upload constraints
var PHOTO_MAX_SIZE_MB       = 2;                      // Maximum file size in MB
var PHOTO_ACCEPTED_TYPES    = ["image/jpeg",
                               "image/png"];           // Accepted file types

// Photo rejection reasons (shown to member in rejection email)
var PHOTO_REJECTION_REASONS = [
  "Not passport-style (full face not clearly visible)",
  "Photo quality too low",
  "Background not suitable",
  "Not a recent photo",
  "Inappropriate content",
  "Other"
];


// ============================================================
// SECTION 17: PORTAL AND WEBSITE URLs
// ============================================================
// URLs used in emails and the web app for navigation links.
// Update if page structure of the Google Site changes.
// ============================================================

var URL_HOME            = "https://www.geabotswana.org";
var URL_MEMBER_PORTAL   = "https://www.geabotswana.org/member-portal";
var URL_ADMIN_PORTAL    = "https://www.geabotswana.org/admin";
var URL_RESERVATION     = "https://www.geabotswana.org/reservations";
var URL_MEMBERSHIP_CARD = "https://www.geabotswana.org/my-card";
var URL_PAYMENT         = "https://www.geabotswana.org/payment";
var URL_GUEST_LIST      = "https://www.geabotswana.org/guest-list";
var URL_VERIFY          = "https://www.geabotswana.org/verify"; // QR code verification

// NOTE: These URLs will be updated once the Apps Script web app
// is deployed and embedded in Google Sites. The exact URLs
// depend on how the web app is published.


// ============================================================
// SECTION 18: AUDIT LOG
// ============================================================
// Action types recorded in the Audit Log tab.
// Used for accountability and troubleshooting.
// ============================================================

var AUDIT_MEMBER_CREATED        = "MEMBER_CREATED";
var AUDIT_MEMBER_UPDATED        = "MEMBER_UPDATED";
var AUDIT_MEMBER_DEACTIVATED    = "MEMBER_DEACTIVATED";
var AUDIT_PAYMENT_RECORDED      = "PAYMENT_RECORDED";
var AUDIT_PAYMENT_VERIFIED      = "PAYMENT_VERIFIED";
var AUDIT_RESERVATION_CREATED   = "RESERVATION_CREATED";
var AUDIT_RESERVATION_APPROVED  = "RESERVATION_APPROVED";
var AUDIT_RESERVATION_DENIED    = "RESERVATION_DENIED";
var AUDIT_RESERVATION_CANCELLED = "RESERVATION_CANCELLED";
var AUDIT_RESERVATION_BUMPED    = "RESERVATION_BUMPED";
var AUDIT_PHOTO_SUBMITTED       = "PHOTO_SUBMITTED";
var AUDIT_PHOTO_APPROVED        = "PHOTO_APPROVED";
var AUDIT_PHOTO_REJECTED        = "PHOTO_REJECTED";
var AUDIT_LOGIN                 = "LOGIN";
var AUDIT_GUEST_LIST_SUBMITTED  = "GUEST_LIST_SUBMITTED";
var AUDIT_APPLICATION_SUBMITTED = "APPLICATION_SUBMITTED";
var AUDIT_APPLICATION_APPROVED  = "APPLICATION_APPROVED";
var AUDIT_APPLICATION_DENIED    = "APPLICATION_DENIED";
var AUDIT_CONFIG_UPDATED        = "CONFIG_UPDATED";
var AUDIT_HOLIDAY_UPDATED       = "HOLIDAY_UPDATED";
var AUDIT_LOGIN_FAILED          = "LOGIN_FAILED";
var AUDIT_PASSWORD_SET          = "PASSWORD_SET";
var AUDIT_PASSWORD_RESET        = "PASSWORD_RESET";


// ============================================================
// SECTION 19: ERROR MESSAGES
// ============================================================
// User-facing error messages displayed in the web app.
// Centralizing them here makes future text updates easy.
// ============================================================

var ERR_NOT_MEMBER          = "Your email address is not registered as a GEA member. " +
                              "Please apply for membership or contact board@geabotswana.org.";
var ERR_MEMBERSHIP_EXPIRED  = "Your GEA membership has expired. " +
                              "Please renew your membership to access the portal.";
var ERR_MEMBERSHIP_PENDING  = "Your GEA membership application is still under review. " +
                              "You will receive an email when a decision has been made.";
var ERR_NOT_AUTHORIZED      = "You are not authorized to perform this action. " +
                              "Please contact board@geabotswana.org if you believe this is an error.";
var ERR_TENNIS_LIMIT        = "Your household has reached the weekly tennis court booking " +
                              "limit of " + TENNIS_WEEKLY_LIMIT_HOURS + " hours. " +
                              "Additional bookings this week require board approval.";
var ERR_LEOBO_LIMIT         = "Your household has reached the monthly leobo booking limit. " +
                              "Additional bookings this month require Management Officer approval.";
var ERR_GUEST_LIST_LATE     = "Guest lists must be submitted at least " +
                              GUEST_LIST_DEADLINE_DAYS + " business days before your event. " +
                              "Please contact board@geabotswana.org for assistance.";
var ERR_CONFLICT            = "This time slot is already reserved. " +
                              "Please choose a different date or time.";
var ERR_INDIVIDUAL_FAMILY   = "Individual memberships cover one person only. " +
                              "Please upgrade to a Family membership to add household members.";
var ERR_SPOUSE_EXISTS       = "A spouse/partner is already registered for this household. " +
                              "Please contact board@geabotswana.org to make changes.";
var ERR_STAFF_EXISTS        = "A household staff member is already registered for this household. " +
                              "Only one staff member is permitted per household.";
var ERR_EMERGENCY_CONTACT   = "Your emergency contact cannot be a member of your household. " +
                              "Please provide a contact outside your household.";
var ERR_INVALID_DURATION    = "Temporary membership duration must be between 1 and " +
                              MAX_TEMPORARY_MONTHS + " months.";
var ERR_YOUTH_UNACCOMPANIED = "Members under age " + AGE_UNACCOMPANIED_ACCESS +
                              " must be accompanied by an adult household member to access GEA facilities.";


// ============================================================
// SECTION 19B: PASSWORD SECURITY
// ============================================================
// Password hashing and validation rules.
// All member passwords are hashed — the system never stores plaintext.
// Hashing is one-way: a hash cannot be reversed, only verified by 
// re-hashing the plaintext password and comparing the results.
// ============================================================

// Minimum password length (security requirement)
// Enforced on both frontend (user-friendly) and backend (security)
var PASSWORD_MIN_LENGTH     = 12;        // Minimum 12 characters required

// Password hashing algorithm
// Uses Utilities.computeDigest() with SHA256
// SHA256 is cryptographically secure and one-way
var PASSWORD_HASH_ALGORITHM = "SHA256";


// ============================================================
// SECTION 19C: PHONE NUMBER SYSTEM
// ============================================================
// Three-field phone storage: country_code + phone_number + phone_whatsapp
// Provides international support with dropdown validation and
// ready-made formatting for SMS/WhatsApp integrations.
//
// FORMAT:
// - country_code: Two-letter ISO country code (US, GB, BW, ZA, etc.)
// - phone_number: Numeric-only phone digits (no + - or spaces)
// - phone_whatsapp: Boolean (TRUE if number is on WhatsApp)
//
// EXAMPLE:
// - Country: Botswana (BW), Code: +267, Phone: 71234567
// - Stored as: country_code="BW", phone_number="71234567", phone_whatsapp=TRUE
// - Displayed as: +267 71234567 (via formatPhoneNumber function)
// ============================================================

// ISO country codes supported in dropdown
// Format: "CC" (two-letter ISO code)
// Used to populate the intl-tel-input dropdown
var SUPPORTED_COUNTRIES = [
  "BW",  // Botswana
  "US",  // United States
  "GB",  // United Kingdom
  "ZA",  // South Africa
  "AU",  // Australia
  "IE",  // Ireland
  "TZ"   // Tanzania
];

// Country code to dial code mapping
// Used when intl-tel-input returns country code, we need dial code for display
var COUNTRY_CODE_TO_DIAL_CODE = {
  "BW": "267",
  "US": "1",
  "GB": "44",
  "ZA": "27",
  "AU": "61",
  "IE": "353",
  "TZ": "255"
};

// Dial code to country code mapping (reverse lookup)
// Used when we have a dial code, we need the country code
var DIAL_CODE_TO_COUNTRY_CODE = {
  "267": "BW",
  "1": "US",
  "44": "GB",
  "27": "ZA",
  "61": "AU",
  "353": "IE",
  "255": "TZ"
};

// Phone number length constraints by country
// intl-tel-input handles most validation, but we do backend checks too
var PHONE_LENGTH_CONSTRAINTS = {
  "BW": { min: 7, max: 8 },    // Botswana: 7 digits landline, 8 digits cell
  "US": { min: 10, max: 10 },  // USA: 10 digits
  "GB": { min: 10, max: 11 },  // UK: 10-11 digits
  "ZA": { min: 9, max: 9 },    // South Africa: 9 digits
  "AU": { min: 9, max: 10 },   // Australia: 9-10 digits
  "IE": { min: 9, max: 10 },   // Ireland: 9-10 digits
  "TZ": { min: 9, max: 10 }    // Tanzania: 9-10 digits
};

// Preferred countries (shown at top of intl-tel-input dropdown)
// For Embassy staff, this puts their most likely countries first
var PREFERRED_COUNTRIES = ["BW", "US", "GB"];

// Household phone sync setting
var HOUSEHOLD_PHONE_SYNC_ENABLED = true;  // Enable nightly sync
var HOUSEHOLD_PHONE_SYNC_HOUR = 2;        // Runs at 2:00 AM (server timezone)
var HOUSEHOLD_PHONE_SYNC_MINUTE = 0;      // Runs at :00 minutes past the hour


// ============================================================
// SECTION 20: SYSTEM METADATA
// ============================================================
// Information about the system itself.
// Useful for troubleshooting and documentation.
// ============================================================

var SYSTEM_NAME             = "GEA Association Platform";
var SYSTEM_VERSION          = "1.0.7";
var SYSTEM_BUILD_DATE       = "2026-02-22";
var SYSTEM_DEVELOPER        = "Michael Raney, GEA Treasurer";
var SYSTEM_CONTACT          = "treasurer@geabotswana.org";
var SYSTEM_LAST_FEATURE     = "Sequential membership eligibility flow with sponsor requirements and monthly exchange rate mechanism";

// ============================================================
// END OF CONFIGURATION FILE
// ============================================================
// If you have made changes, save this file before continuing.
// Questions about this file? Contact: treasurer@geabotswana.org
// ============================================================