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
 * LAST UPDATED: March 12, 2026
 * UPDATED BY: Claude Code (Payment verification system + email templates)
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
var TAB_MEMBERSHIP_APPLICATIONS = "Membership Applications";  // NOTE: In MEMBER_DIRECTORY_ID, not SYSTEM_BACKEND_ID

// GEA Reservations tabs
var TAB_RESERVATIONS        = "Reservations";
var TAB_GUEST_LISTS         = "Guest Lists";
var TAB_GUEST_PROFILES      = "Guest Profiles";
var TAB_USAGE_TRACKING      = "Usage Tracking";

// GEA System Backend tabs
var TAB_CONFIGURATION       = "Configuration";
var TAB_EMAIL_TEMPLATES     = "Email Templates";
var TAB_AUDIT_LOG           = "Audit Log";
var TAB_HOLIDAY_CALENDAR    = "Holiday Calendar";
var TAB_SESSIONS            = "Sessions";
var TAB_PASSWORD_RESET_TOKENS = "Password Reset Tokens";
var TAB_ADMINISTRATORS      = "Administrators";  // Admin account table (board/mgt/rso logins)
var TAB_RULES               = "Rules";  // Rules & Regulations (editable by board)

// GEA Payment Tracking tabs
var TAB_PAYMENTS            = "Payments";
var TAB_MEMBERSHIP_PRICING  = "Membership Pricing";
var TAB_RATES               = "Rates";


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
var FOLDER_IDENTIFICATION_SCANS     = "1uNDYDRLo_NpHTgNMvdiobuni5Jm_6kk8";  // Rename Drive folder: "Passport Scans" → "Identification Scans"
var FOLDER_EMPLOYMENT_VERIFICATION  = "1Ee9acuyKpbfEv7NVHCJqfRcaBExJHOEs";
var FOLDER_FILE_SUBMISSION_ARCHIVE  = "1r-G03qnH-kN_1FBaze5OAtq3WfjyDYuy";


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
var TREASURER_EMAIL       = EMAIL_TREASURER;  // Alias for payment processing
var EMAIL_SECRETARY       = "secretary@geabotswana.org";

// Distribution lists (Google Groups)
var EMAIL_BOARD           = "board@geabotswana.org";
var EMAIL_MEMBERS         = "members@geabotswana.org";
var EMAIL_RSO_APPROVE     = "rso-approve@geabotswana.org";  // RSO officers/investigators: application & guest list approvals
var EMAIL_RSO_NOTIFY      = "rso-notify@geabotswana.org";   // All RSO incl. local guards: event day information & daily summaries
var EMAIL_MGT             = "mgt-notify@geabotswana.org";

// System no-reply address (for board notifications - replies redirect here, not to current user)
var EMAIL_NOREPLY         = "noreply@geabotswana.org";

// Legacy institutional email (recovery/backup only - do not use for operations)
var EMAIL_LEGACY          = "geaboard@gmail.com";

// System sender name (appears in "From" field of automated emails)
var EMAIL_SENDER_NAME     = "Gaborone Employee Association";

// Board email service account settings (used by sendEmailFromBoard / sendEmailFromTemplate)
// BOARD_EMAIL_TO_SEND_FROM: The "From" address for board-originated system emails
var BOARD_EMAIL_TO_SEND_FROM      = "board@geabotswana.org";
// BOARD_EMAIL_DISPLAY_NAME: The display name shown alongside BOARD_EMAIL_TO_SEND_FROM
var BOARD_EMAIL_DISPLAY_NAME      = "Gaborone Employee Association";
// BOARD_EMAIL_DELEGATED_USER: The Google Workspace user impersonated via domain-wide delegation
// (must have "Send As" permission for board@ and be authorized in the service account)
var BOARD_EMAIL_DELEGATED_USER    = "treasurer@geabotswana.org";
// BOARD_SERVICE_ACCOUNT_EMAIL: Fallback client_email if PropertiesService JSON lacks the field
// Set the real value via initializeBoardServiceAccount() in EmailService.js
var BOARD_SERVICE_ACCOUNT_EMAIL   = "";


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

// Leobo
var LEOBO_MONTHLY_LIMIT         = 1;      // Max reservations per household per month
var LEOBO_MAX_HOURS             = 6;      // Max hours per leobo reservation
var LEOBO_BUMP_WINDOW_DAYS      = 5;      // Business days before event: can be bumped

// Guest list
var GUEST_LIST_DEADLINE_DAYS              = 4;  // Business days before event for RSO notice (matches Config sheet)
var GUEST_LIST_FINAL_CALL_DAYS_BEFORE_DEADLINE = 1; // Days before deadline to send final-call reminder
var RSO_APPROVAL_DEADLINE_DAYS            = 5;  // Business days RSO has to review a guest list

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
var FACILITY_TENNIS       = "Tennis Court";
var FACILITY_LEOBO        = "Leobo";
var FACILITY_PLAYGROUND   = "Playground";   // Walk-up only, no reservations
var FACILITY_GYM          = "Fitness Center"; // Walk-up only, no reservations

// All valid facility names (used for input validation)
var ALL_FACILITIES = [
  FACILITY_TENNIS,
  FACILITY_LEOBO,
  FACILITY_PLAYGROUND,
  FACILITY_GYM
];

// Facilities that require board/MGT approval
var FACILITIES_REQUIRING_APPROVAL = [
  FACILITY_LEOBO
];

// Google Calendar event color IDs for reservation status
// See: https://developers.google.com/apps-script/reference/calendar/event-color
var CALENDAR_COLOR_PENDING  = CalendarApp.EventColor.YELLOW;  // Pending approval
var CALENDAR_COLOR_APPROVED = CalendarApp.EventColor.GREEN;   // Approved / confirmed
var CALENDAR_COLOR_DENIED   = CalendarApp.EventColor.RED;     // Denied
var CALENDAR_COLOR_TENTATIVE = CalendarApp.EventColor.CYAN;   // Tentative (excess, bump window)


// ============================================================
// SECTION 10B: PAYMENT SYSTEM
// ============================================================
// Payment methods, pro-ration, and exchange rates.
// ============================================================

var PAYMENT_METHODS = [
  "PayPal (USD)",
  "SDFCU Member2Member (USD)",
  "Zelle (USD)",
  "Absa (BWP)"
];

// Pro-ration by quarter (membership year is Aug-Jul)
var QUARTER_PERCENTAGES = {
  "Q1": 100,  // Aug-Oct
  "Q2": 75,   // Nov-Jan
  "Q3": 50,   // Feb-Apr
  "Q4": 25    // May-Jul
};

// Default exchange rate (USD to BWP) - overridden by daily exchange rate updates
var EXCHANGE_RATE_DEFAULT = 13.45;

// Payment verification rules
var PAYMENT_MAX_AGE_DAYS = 60;  // Payments older than this are rejected
var PAYMENT_MAX_AMOUNT_USD = 500;
var PAYMENT_MAX_AMOUNT_BWP = 5000;


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

// Cloud Storage settings
var CLOUD_STORAGE_MEMBER_DATA_BUCKET = "gea-member-data";
var CLOUD_STORAGE_PUBLIC_BUCKET      = "gea-public-assets";
var CLOUD_STORAGE_REGION             = "us-central1";

// One-time link expiry for RSO approval workflow
var RSO_APPROVAL_LINK_EXPIRY_HOURS   = 336;


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

// Exchange rate API for automatic daily updates (USD to BWP)
// Free tier: 1500 requests/month, no API key required
var EXCHANGE_RATE_API_URL = "https://open.er-api.com/v6/latest/USD";

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
var REMINDER_TIME_MORNING       = 6;     // Hour (GMT+2) for morning approval reminder runs (matches rso_summary_hour)

// Holiday calendar reminder
var HOLIDAY_REMINDER_MONTH      = 11;    // Month to send reminder (11 = November)
var HOLIDAY_REMINDER_DAY        = 1;     // Day of month to send reminder

// Waitlist slot hold time
var WAITLIST_HOLD_HOURS             = 24;    // Hours to hold a slot for waitlisted member
var WAITLIST_AUTO_PROMOTION_ENABLED = true;  // Auto-promote waitlisted bookings when slot opens

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
var PHOTO_MAX_SIZE_MB       = 5;                      // Maximum file size in MB
var PHOTO_PREVIEW_WIDTH_PX  = 600;
var PHOTO_PREVIEW_HEIGHT_PX = 600;
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
var AUDIT_PAYMENT_SUBMITTED     = "PAYMENT_SUBMITTED";
var AUDIT_PAYMENT_VERIFIED      = "PAYMENT_VERIFIED";
var AUDIT_PAYMENT_REJECTED      = "PAYMENT_REJECTED";
var AUDIT_PAYMENT_CLARIFICATION = "PAYMENT_CLARIFICATION";
var AUDIT_RESERVATION_CREATED   = "RESERVATION_CREATED";
var AUDIT_RESERVATION_APPROVED  = "RESERVATION_APPROVED";
var AUDIT_RESERVATION_DENIED    = "RESERVATION_DENIED";
var AUDIT_RESERVATION_CANCELLED = "RESERVATION_CANCELLED";
var AUDIT_RESERVATION_BUMPED    = "RESERVATION_BUMPED";
var AUDIT_PHOTO_SUBMITTED       = "PHOTO_SUBMITTED";
var AUDIT_PHOTO_APPROVED        = "PHOTO_APPROVED";
var AUDIT_PHOTO_REJECTED        = "PHOTO_REJECTED";
var AUDIT_LOGIN                 = "LOGIN";
var AUDIT_LOGOUT                = "LOGOUT";
var AUDIT_GUEST_LIST_SUBMITTED      = "GUEST_LIST_SUBMITTED";
var AUDIT_GUEST_LIST_DRAFT_SAVED    = "GUEST_LIST_DRAFT_SAVED";
var AUDIT_GUEST_LIST_FINALIZED      = "GUEST_LIST_FINALIZED";
var AUDIT_GUEST_PROFILE_SAVED       = "GUEST_PROFILE_SAVED";

// Guest list submission status values (stored in Guest Lists sheet)
var GUEST_LIST_STATUS_SUBMITTED     = "submitted";
var GUEST_LIST_STATUS_IN_REVIEW     = "in_review";
var GUEST_LIST_STATUS_FINALIZED     = "finalized";
var AUDIT_APPLICATION_SUBMITTED = "APPLICATION_SUBMITTED";
var AUDIT_APPLICATION_APPROVED  = "APPLICATION_APPROVED";
var AUDIT_APPLICATION_DENIED    = "APPLICATION_DENIED";
var AUDIT_CONFIG_UPDATED        = "CONFIG_UPDATED";
var AUDIT_HOLIDAY_UPDATED       = "HOLIDAY_UPDATED";
var AUDIT_LOGIN_FAILED          = "LOGIN_FAILED";
var AUDIT_PASSWORD_SET          = "PASSWORD_SET";
var AUDIT_PASSWORD_RESET        = "PASSWORD_RESET";
var AUDIT_HOUSEHOLD_PHONE_SYNC  = "HOUSEHOLD_PHONE_SYNC";
var AUDIT_HOUSEHOLD_PHONE_SYNC_SKIPPED  = "HOUSEHOLD_PHONE_SYNC_SKIPPED";
var AUDIT_HOUSEHOLD_PHONE_SYNC_COMPLETE = "HOUSEHOLD_PHONE_SYNC_COMPLETE";
var AUDIT_HOUSEHOLD_PHONE_SYNC_FAILED   = "HOUSEHOLD_PHONE_SYNC_FAILED";
var AUDIT_APPLICATION_CREATED             = "APPLICATION_CREATED";
var AUDIT_APPLICATION_DOCS_CONFIRMED      = "APPLICATION_DOCS_CONFIRMED";
var AUDIT_APPLICATION_BOARD_INITIAL       = "APPLICATION_BOARD_INITIAL";
var AUDIT_APPLICATION_RSO_REVIEWED        = "APPLICATION_RSO_REVIEWED";
var AUDIT_APPLICATION_BOARD_FINAL         = "APPLICATION_BOARD_FINAL";
var AUDIT_APPLICATION_PAYMENT_SUBMITTED   = "APPLICATION_PAYMENT_SUBMITTED";
var AUDIT_APPLICATION_ACTIVATED           = "APPLICATION_ACTIVATED";
var AUDIT_APPLICATION_DENIED              = "APPLICATION_DENIED";
var AUDIT_FILE_SUBMISSION_CREATED         = "FILE_SUBMISSION_CREATED";
var AUDIT_FILE_SUBMISSION_RSO_APPROVED    = "FILE_SUBMISSION_RSO_APPROVED";
var AUDIT_FILE_SUBMISSION_RSO_REJECTED    = "FILE_SUBMISSION_RSO_REJECTED";
var AUDIT_FILE_SUBMISSION_GEA_APPROVED    = "FILE_SUBMISSION_GEA_APPROVED";
var AUDIT_FILE_SUBMISSION_GEA_REJECTED    = "FILE_SUBMISSION_GEA_REJECTED";

// Contact form
var AUDIT_CONTACT_MESSAGE_SENT            = "CONTACT_MESSAGE_SENT";

// Admin account management
var AUDIT_ADMIN_CREATED       = "ADMIN_CREATED";
var AUDIT_ADMIN_DEACTIVATED   = "ADMIN_DEACTIVATED";
var AUDIT_ADMIN_REACTIVATED   = "ADMIN_REACTIVATED";
var AUDIT_ADMIN_LOGIN         = "ADMIN_LOGIN";
var AUDIT_ADMIN_LOGIN_FAILED  = "ADMIN_LOGIN_FAILED";
var AUDIT_ADMIN_PASSWORD_RESET = "ADMIN_PASSWORD_RESET";

// Email template system (Drive-based pipeline)
var AUDIT_EMAIL_TEMPLATE_LOADED           = "EMAIL_TEMPLATE_LOADED";
var AUDIT_EMAIL_TEMPLATE_NOT_FOUND        = "EMAIL_TEMPLATE_NOT_FOUND";
var AUDIT_EMAIL_SENT_FROM_TEMPLATE        = "EMAIL_SENT_FROM_TEMPLATE";
var AUDIT_EMAIL_SEND_FAILED               = "EMAIL_SEND_FAILED";
var AUDIT_EMAIL_MISSING_VARIABLES         = "EMAIL_MISSING_VARIABLES";


// ============================================================
// SECTION 18A: MEMBERSHIP APPLICATION STATUSES
// ============================================================
// Application workflow stages and status values.
// Used to track membership applications from submission through activation.
// ============================================================

var APP_STATUS_AWAITING_DOCS            = "awaiting_docs";
var APP_STATUS_DOCS_CONFIRMED           = "docs_confirmed";
var APP_STATUS_BOARD_INITIAL_REVIEW     = "board_initial_review";
var APP_STATUS_RSO_REVIEW               = "rso_review";
var APP_STATUS_BOARD_FINAL_REVIEW       = "board_final_review";
var APP_STATUS_APPROVED_PENDING_PAYMENT = "approved_pending_payment";
var APP_STATUS_PAYMENT_SUBMITTED        = "payment_submitted";
var APP_STATUS_PAYMENT_VERIFIED         = "payment_verified";
var APP_STATUS_ACTIVATED                = "activated";
var APP_STATUS_DENIED                   = "denied";
var APP_STATUS_WITHDRAWN                = "withdrawn";

// Payment reference format for membership dues
// Format: {LAST_NAME}_{MEMBERSHIP_YEAR}
// Example: RANEY_25-26 for 2025-2026 membership year
var PAYMENT_REFERENCE_FORMAT = "{LAST_NAME}_{MEMBERSHIP_YEAR}";

// Membership year configuration
// All memberships expire on July 31
var MEMBERSHIP_EXPIRY_MONTH  = 7;   // July
var MEMBERSHIP_EXPIRY_DAY    = 31;  // 31


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

// Password reset configuration (self-serve reset feature)
// Users can request password reset via email, complete reset with token
var PASSWORD_RESET_WINDOW_MINUTES = 15;        // Token validity window (15 minutes)
var PASSWORD_RESET_MAX_REQUESTS_PER_HOUR = 3;  // Abuse prevention: max 3 requests per email per hour
var PASSWORD_RESET_MAX_ATTEMPTS = 3;           // Max 3 failed validation attempts per token

// Audit action types for password reset
var AUDIT_PASSWORD_RESET_REQUESTED = "PASSWORD_RESET_REQUESTED";
var AUDIT_PASSWORD_RESET_COMPLETED = "PASSWORD_RESET_COMPLETED";
var AUDIT_PASSWORD_RESET_FAILED = "PASSWORD_RESET_FAILED";
var AUDIT_PASSWORD_RESET_RATE_LIMITED = "PASSWORD_RESET_RATE_LIMITED";
var AUDIT_PASSWORD_CHANGED = "PASSWORD_CHANGED";
var AUDIT_PASSWORD_CHANGE_FAILED = "PASSWORD_CHANGE_FAILED";

// Email template semantic names for password reset
var TPL_PASSWORD_RESET_REQUEST_MEMBER = "MEM_PASSWORD_RESET_REQUEST_TO_MEMBER";
var TPL_PASSWORD_RESET_COMPLETE_MEMBER = "MEM_PASSWORD_RESET_COMPLETE_TO_MEMBER";
var TPL_PASSWORD_RESET_REQUEST_ADMIN = "SYS_PASSWORD_RESET_REQUEST_TO_ADMIN";
var TPL_PASSWORD_RESET_COMPLETE_ADMIN = "SYS_PASSWORD_RESET_COMPLETE_TO_ADMIN";


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
// SECTION 20: STATIC RULES CACHE
// ============================================================
// Fallback rules document cached at startup.
// Used when Rules sheet is inaccessible (network issues, sheet deleted, etc.)
// Cache is created nightly via notificationService.runNightlyTasks()
// ============================================================

var CACHED_RULES_HTML = null; // Set during runtime; fallback to hardcoded if null
var CACHED_RULES_TIMESTAMP = null; // When cache was last updated

// Default hardcoded rules (used if cache cannot be populated)
// This ensures users can always see rules even if spreadsheet is completely down
var DEFAULT_RULES_SECTIONS = [
  {
    number: "1",
    title: "General Membership Rules",
    content: [
      "An active membership is required to access GEA facilities and events.",
      "Members must follow all posted rules and conduct themselves respectfully.",
      "Guests must be accompanied by a GEA member and adhere to all guidelines. Guests may not be left at the facility in the absence of an active member escort.",
      "The GEA Board reserves the right to modify rules and revoke access for violations."
    ]
  },
  {
    number: "2",
    title: "Recreation Center Rules",
    content: [
      "Open to members and registered guests only, and only during the hours of 7am to 8pm. Everyone must depart by 8pm.",
      "Children under 14 must be supervised by an adult.",
      "Respect noise levels, shared spaces, and dispose of trash properly.",
      "Report any damage, maintenance needs, or safety concerns to board@geabotswana.org."
    ],
    subsections: [
      {
        title: "Leobo & Event Space",
        content: [
          "Members may reserve the space once per month for up to 6 hours.",
          "Official Embassy events take precedence over GEA member reservations.",
          "Leobo reservations are subject to approval by the Embassy and may be cancelled at any time.",
          "Reservations must include setup and cleanup time (these count toward your 6-hour maximum).",
          "Events must maintain respectful noise levels and conclude by 8pm to respect neighboring residents.",
          "No fundraising is allowed at the Rec Center.",
          "Guest lists must be submitted 3 business days in advance to board@geabotswana.org. For large events (30+ people), guest lists should be submitted 5 business days in advance.",
          "Parking inside is limited and subject to security directives; guest parking is outside."
        ]
      },
      {
        title: "Basketball & Tennis Courts",
        content: [
          "Reservations are limited to 2 hours per day per member-family.",
          "No food is allowed on the courts (water and sports drinks are permitted).",
          "Members must clean up after use and follow supervision rules for minors."
        ]
      }
    ]
  },
  {
    number: "3",
    title: "Fitness Center Rules",
    content: [
      "Use at your own risk – GEA and the U.S. Embassy are not liable for injuries or accidents.",
      "Minimum age for use: 15 years old.",
      "No children under 10 are allowed inside the fitness center; children 11-14 may enter under supervision but may not use the equipment.",
      "The door code is for members only – do not share it.",
      "Personal trainers are allowed, but the code must not be disclosed.",
      "Wipe down equipment after use and return it to its place.",
      "Limit electronic equipment use (treadmills, ellipticals, etc.) to 30 minutes when others are waiting.",
      "Turn off air conditioning, lights, and unplug machines before leaving and close the door securely.",
      "No alcohol, drugs, or smoking allowed in the Fitness Center.",
      "Report equipment issues to board@geabotswana.org."
    ],
    subsections: [
      {
        title: "Fitness Center Liability Waiver",
        content: [
          "By using the Fitness Center, you acknowledge that physical activity involves inherent risks. The Gaborone Employee Association (GEA) and the U.S. Embassy Gaborone assume no responsibility for injuries, accidents, or loss of property. Members agree to use the facilities at their own risk and waive all claims against GEA and its affiliates."
        ]
      }
    ]
  },
  {
    number: "4",
    title: "Events & Conduct",
    content: [
      "RSVP is required for some events; fees are non-refundable unless stated otherwise.",
      "Guests may attend certain events — guidelines will be provided.",
      "Children must be supervised by an adult at all times.",
      "Disruptive behavior may result in removal from events and facility restrictions."
    ]
  },
  {
    number: "5",
    title: "Compliance & Enforcement",
    content: [
      "Failure to comply with these rules may result in suspension or termination of membership privileges. The GEA Board reserves the right to enforce all policies to maintain a safe and welcoming environment.",
      "These rules and regulations are subject to change by agreement of the Board of Directors. Members will be notified of any changes.",
      "For questions, reservations, or concerns, contact board@geabotswana.org."
    ]
  }
];

// ============================================================
// Information about the system itself.
// Useful for troubleshooting and documentation.
// ============================================================

var SYSTEM_NAME             = "GEA Association Platform";
var SYSTEM_VERSION          = "2.2.0";
var SYSTEM_BUILD_DATE       = "2026-03-31";
var SYSTEM_DEVELOPER        = "Michael Raney, GEA Treasurer";
var SYSTEM_CONTACT          = "treasurer@geabotswana.org";
var SYSTEM_LAST_FEATURE     = "Removed broken JSONP implementation from member.html wrapper; portal now loads directly";
var DEPLOYMENT_TIMESTAMP    = "2026-03-31 10:01:29";  // Updated by scripts/update-deploy-timestamp.js before clasp push
var BUILD_ID                = DEPLOYMENT_TIMESTAMP;  // Same as deployment timestamp

// ============================================================
// END OF CONFIGURATION FILE
// ============================================================
// If you have made changes, save this file before continuing.
// Questions about this file? Contact: treasurer@geabotswana.org
// ============================================================
