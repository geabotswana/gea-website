/**
 * ============================================================
 * UTILITIES.GS
 * ============================================================
 * General-purpose helper functions used throughout the system.
 * Business day calculations, ID generators, date formatters,
 * audit logging, and shared validation tools.
 * ============================================================
 */


// ============================================================
// BUSINESS DAY CALCULATIONS
// ============================================================

/**
 * Calculates the deadline date by counting backward N business
 * days from an event date. Skips weekends and all holidays.
 *
 * Example: Event Saturday April 5, 4 business days back = Monday March 31.
 *
 * @param {Date}   eventDate
 * @param {number} daysBack  (default: GUEST_LIST_DEADLINE_DAYS from Config.gs)
 * @returns {Date}
 */
function calculateBusinessDayDeadline(eventDate, daysBack) {
  if (daysBack === undefined) daysBack = GUEST_LIST_DEADLINE_DAYS;
  var current = new Date(eventDate);
  var counted = 0;
  while (counted < daysBack) {
    current.setDate(current.getDate() - 1);
    if (isBusinessDay(current)) counted++;
  }
  return current;
}

/**
 * Returns true if a date is a business day (not weekend, not holiday).
 * @param {Date} date
 * @returns {boolean}
 */
function isBusinessDay(date) {
  var day = date.getDay();
  if (day === 0 || day === 6) return false;
  return !isHoliday(date);
}

/**
 * Returns true if a date matches any active entry in the Holiday Calendar tab.
 * @param {Date} date
 * @returns {boolean}
 */
function isHoliday(date) {
  var holidays = getHolidays(date.getFullYear());
  var dateStr  = formatDate(date, true);
  for (var i = 0; i < holidays.length; i++) {
    if (formatDate(new Date(holidays[i].date), true) === dateStr) return true;
  }
  return false;
}

/**
 * Returns all active holidays for a given year from the Holiday Calendar tab.
 * Results are cached in script memory (cleared between executions).
 * @param {number} year
 * @returns {Array} [{date, name, type}, ...]
 */
var _holidayCache = {};

function getHolidays(year) {
  if (_holidayCache[year]) return _holidayCache[year];
  var holidays = [];
  try {
    var data = SpreadsheetApp.openById(SYSTEM_BACKEND_ID)
                 .getSheetByName(TAB_HOLIDAY_CALENDAR)
                 .getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (!data[i][1]) continue;
      var d = new Date(data[i][1]);
      // Columns: holiday_id(0), holiday_date(1), holiday_name(2), holiday_type(3),
      //          holiday_year(4), notes(5), active(6)
      if (d.getFullYear() === year && data[i][6] === true) {
        holidays.push({ date: data[i][1], name: data[i][2], type: data[i][3] });
      }
    }
    _holidayCache[year] = holidays;
  } catch (e) {
    Logger.log("ERROR getHolidays(" + year + "): " + e);
  }
  return holidays;
}


// ============================================================
// PHONE NUMBER UTILITIES
// ============================================================
// Helper functions for phone formatting, validation, and conversion
// between two-letter country codes (BW, US, GB) and dial codes (267, 1, 44)
// ============================================================

/**
 * FUNCTION: formatPhoneNumber
 * PURPOSE: Formats a phone number by combining country code and phone number
 *          into displayable international format (+267 71234567).
 *          Used in emails, templates, and UI display.
 *
 * HOW IT WORKS:
 * 1. Accept two-letter country code (BW) and phone number (71234567)
 * 2. Look up dial code in mapping (BW → 267)
 * 3. Combine with space: +267 71234567
 * 4. Return formatted string
 *
 * CALLED BY: Email templates, dashboard display, SMS/WhatsApp functions
 *
 * @param {string} countryCode  Two-letter ISO country code (BW, US, GB)
 * @param {string} phoneNumber  Numeric-only phone (71234567, no + or -)
 * @returns {string}            Formatted +[dialcode] [phone] or empty if invalid
 *
 * EXAMPLE:
 * formatPhoneNumber("BW", "71234567") → "+267 71234567"
 * formatPhoneNumber("US", "2025551234") → "+1 2025551234"
 * formatPhoneNumber("BW", "") → ""
 * formatPhoneNumber("XX", "71234567") → ""
 */
function formatPhoneNumber(countryCode, phoneNumber) {
  // Validate inputs
  if (!countryCode || !phoneNumber) return "";
  
  countryCode = String(countryCode).trim().toUpperCase();
  phoneNumber = String(phoneNumber).trim();
  
  // Look up dial code from country code
  var dialCode = COUNTRY_CODE_TO_DIAL_CODE[countryCode];
  if (!dialCode) {
    Logger.log("WARNING formatPhoneNumber: unknown country code: " + countryCode);
    return "";
  }
  
  // Validate phone is numeric only
  var cleanPhone = phoneNumber.replace(/[\s\-]/g, "");
  if (!/^[0-9]+$/.test(cleanPhone)) {
    Logger.log("WARNING formatPhoneNumber: phone is not numeric: " + phoneNumber);
    return "";
  }
  
  // Validate phone length for this country
  var constraint = PHONE_LENGTH_CONSTRAINTS[countryCode];
  if (constraint) {
    if (cleanPhone.length < constraint.min || cleanPhone.length > constraint.max) {
      Logger.log("WARNING formatPhoneNumber: phone length invalid for " + 
                 countryCode + ": " + cleanPhone.length + 
                 " (expected " + constraint.min + "-" + constraint.max + ")");
      return "";
    }
  }
  
  // Return formatted: +[dialcode] [phone]
  return "+" + dialCode + " " + cleanPhone;
}


/**
 * FUNCTION: isValidPhoneNumber
 * PURPOSE: Validates that a phone number in three-field format is properly formatted.
 *          Checks country code exists, phone is numeric, and length is reasonable.
 *          Used for data quality checks and form validation.
 *
 * @param {string} countryCode  Two-letter ISO country code (BW, US, etc.)
 * @param {string} phoneNumber  Numeric-only phone number
 * @returns {boolean}           True if valid, false otherwise
 *
 * EXAMPLE:
 * isValidPhoneNumber("BW", "71234567") → true
 * isValidPhoneNumber("XX", "71234567") → false (unknown country)
 * isValidPhoneNumber("BW", "abc") → false (non-numeric)
 * isValidPhoneNumber("BW", "") → true (blank is OK for optional fields)
 */
function isValidPhoneNumber(countryCode, phoneNumber) {
  // Empty/blank is allowed (optional phone field)
  if (!countryCode && !phoneNumber) return true;
  
  // But if one is provided, both must be provided
  if (!countryCode || !phoneNumber) return false;
  
  countryCode = String(countryCode).trim().toUpperCase();
  phoneNumber = String(phoneNumber).trim();
  
  // Country code must be recognized
  if (!COUNTRY_CODE_TO_DIAL_CODE[countryCode]) return false;
  
  // Phone must be numeric
  var cleanPhone = phoneNumber.replace(/[\s\-]/g, "");
  if (!/^[0-9]+$/.test(cleanPhone)) return false;
  
  // Phone length must match country constraints
  var constraint = PHONE_LENGTH_CONSTRAINTS[countryCode];
  if (constraint) {
    if (cleanPhone.length < constraint.min || cleanPhone.length > constraint.max) {
      return false;
    }
  }
  
  return true;
}


/**
 * FUNCTION: countryCodeToDialCode
 * PURPOSE: Converts a two-letter ISO country code to its dial code.
 *          Used when intl-tel-input returns country code and we need dial code.
 *
 * @param {string} countryCode  Two-letter ISO code (BW, US, GB)
 * @returns {string}            Dial code (267, 1, 44) or empty if unknown
 *
 * EXAMPLE:
 * countryCodeToDialCode("BW") → "267"
 * countryCodeToDialCode("US") → "1"
 * countryCodeToDialCode("XX") → ""
 */
function countryCodeToDialCode(countryCode) {
  if (!countryCode) return "";
  countryCode = String(countryCode).trim().toUpperCase();
  return COUNTRY_CODE_TO_DIAL_CODE[countryCode] || "";
}


/**
 * FUNCTION: dialCodeToCountryCode
 * PURPOSE: Converts a dial code to a two-letter ISO country code.
 *          Used when we have a dial code and need the country code.
 *          NOTE: Some dial codes map to multiple countries (e.g., +1 for US and Canada).
 *          This function returns the primary country for that code.
 *
 * @param {string} dialCode     Dial code (267, 1, 44, etc.)
 * @returns {string}            Two-letter country code (BW, US, GB) or empty
 *
 * EXAMPLE:
 * dialCodeToCountryCode("267") → "BW"
 * dialCodeToCountryCode("1") → "US" (note: also Canada, but US is primary)
 * dialCodeToCountryCode("999") → ""
 */
function dialCodeToCountryCode(dialCode) {
  if (!dialCode) return "";
  dialCode = String(dialCode).trim();
  return DIAL_CODE_TO_COUNTRY_CODE[dialCode] || "";
}


// ============================================================
// ID GENERATION
// ============================================================

/**
 * Generates a unique ID in the format PREFIX-YEAR-XXXXXXXXX.
 * Example: RES-2026-145238491
 * @param {string} prefix  e.g. "RES", "MEM", "PAY", "HSH", "IND", "LOG"
 * @returns {string}
 */
function generateId(prefix) {
  var year = new Date().getFullYear();
  var ts   = String(new Date().getTime()).slice(-5);
  var rand = String(Math.floor(Math.random() * 9000) + 1000);
  return prefix + "-" + year + "-" + ts + rand;
}


// ============================================================
// DATE / TIME FORMATTING
// ============================================================

/**
 * Formats a date.
 * Default:    "Saturday, March 15, 2026"
 * forStorage: "2026-03-15"
 * @param {Date}    date
 * @param {boolean} forStorage
 * @returns {string}
 */
function formatDate(date, forStorage) {
  if (!date) return "";
  var d = new Date(date);
  if (forStorage) {
    return d.getFullYear() + "-" +
           String(d.getMonth() + 1).padStart(2, "0") + "-" +
           String(d.getDate()).padStart(2, "0");
  }
  var DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
  return DAYS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " +
         d.getDate() + ", " + d.getFullYear();
}

/**
 * Formats a time as "9:00 AM".
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
  if (!date) return "";
  var d    = new Date(date);
  var h    = d.getHours();
  var min  = d.getMinutes();
  var ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return h + ":" + String(min).padStart(2, "0") + " " + ampm;
}

/**
 * Formats a currency amount.
 * formatCurrency(100, "USD")  → "$100 USD"
 * formatCurrency(1400, "BWP") → "P1,400 BWP"
 * @param {number} amount
 * @param {string} currency  "USD" or "BWP"
 * @returns {string}
 */
function formatCurrency(amount, currency) {
  var n = Number(amount).toLocaleString();
  if (currency === "USD") return "$" + n + " USD";
  if (currency === "BWP") return "P" + n + " BWP";
  return String(amount);
}


// ============================================================
// DATE ARITHMETIC
// ============================================================

/**
 * Returns a new Date N days after the given date (negative = before).
 * @param {Date}   date
 * @param {number} days
 * @returns {Date}
 */
function addDays(date, days) {
  var d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Returns the Monday of the week containing the given date (time zeroed).
 * Used for weekly tennis usage calculations.
 * @param {Date} date
 * @returns {Date}
 */
function getWeekStart(date) {
  var d    = new Date(date);
  var day  = d.getDay();
  var diff = (day === 0) ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns the 1st of the month for the given date (time zeroed).
 * Used for monthly leobo usage calculations.
 * @param {Date} date
 * @returns {Date}
 */
function getMonthStart(date) {
  var d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Calculates age in whole years as of today.
 * @param {Date|string} dateOfBirth
 * @returns {number}
 */
function calculateAge(dateOfBirth) {
  var today = new Date();
  var dob   = new Date(dateOfBirth);
  var age   = today.getFullYear() - dob.getFullYear();
  var m     = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

/**
 * Returns true if today is the person's birthday.
 * @param {Date|string} dateOfBirth
 * @returns {boolean}
 */
function isBirthdayToday(dateOfBirth) {
  var today = new Date();
  var dob   = new Date(dateOfBirth);
  return today.getMonth() === dob.getMonth() && today.getDate() === dob.getDate();
}


// ============================================================
// CONFIGURATION LOOKUP
// ============================================================

/**
 * Reads a value from the Configuration tab by key (Column A).
 * Use for settings admins may change via the admin interface.
 * Use Config.gs constants for values that never change in code.
 * Results are cached per script execution.
 * @param {string} key
 * @returns {*} Column B value, or null if not found
 */
var _configCache = {};

function getConfigValue(key) {
  if (_configCache[key] !== undefined) return _configCache[key];
  try {
    var data = SpreadsheetApp.openById(SYSTEM_BACKEND_ID)
                 .getSheetByName(TAB_CONFIGURATION)
                 .getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        _configCache[key] = data[i][1];
        return data[i][1];
      }
    }
  } catch (e) {
    Logger.log("ERROR getConfigValue('" + key + "'): " + e);
  }
  return null;
}


// ============================================================
// AUDIT LOGGING
// ============================================================

/**
 * Appends a row to the Audit Log tab.
 * Failures are logged to Apps Script console only — never thrown.
 * @param {string} userEmail   Who performed the action
 * @param {string} actionType  One of the AUDIT_* constants in Config.gs
 * @param {string} targetType  e.g. "Member", "Household", "Reservation"
 * @param {string} targetId    The record ID
 * @param {string} details     Human-readable description
 */
function logAuditEntry(userEmail, actionType, targetType, targetId, details) {
  try {
    SpreadsheetApp.openById(SYSTEM_BACKEND_ID)
      .getSheetByName(TAB_AUDIT_LOG)
      .appendRow([
        generateId("LOG"),
        new Date(),
        userEmail,
        actionType,
        targetType,
        targetId,
        details
      ]);
  } catch (e) {
    Logger.log("AUDIT LOG FAILURE: " + e);
    Logger.log("  " + userEmail + " | " + actionType + " | " + targetId + " | " + details);
  }
}


// ============================================================
// VALIDATION
// ============================================================

/** Returns true if string looks like a valid email. */
function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Returns true if string contains at least 7 digits. */
function isValidPhone(phone) {
  if (!phone) return false;
  return phone.replace(/\D/g, "").length >= 7;
}

/**
 * Strips leading = + - @ to prevent formula injection in Sheets.
 * @param {string} input
 * @returns {string}
 */
function sanitizeInput(input) {
  if (!input) return "";
  var s = String(input).trim();
  if ("=+-@".indexOf(s[0]) !== -1) s = "'" + s;
  return s;
}


// ============================================================
// WEB APP RESPONSE HELPERS
// ============================================================

function successResponse(data, message) {
  return JSON.stringify({ success: true, message: message || "OK", data: data || {} });
}

function errorResponse(message, code) {
  return JSON.stringify({ success: false, message: message || "An error occurred.", code: code || "ERROR" });
}


// ============================================================
// SHARED DATA HELPER
// ============================================================

/**
 * Converts a spreadsheet row array into a named object using the header row.
 * Makes all data access readable: member.first_name vs data[i][4].
 * @param {Array} headers  Row 0 of any sheet (column names)
 * @param {Array} row      A single data row
 * @returns {Object}
 */
function rowToObject(headers, row) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) obj[headers[i]] = row[i];
  return obj;
}