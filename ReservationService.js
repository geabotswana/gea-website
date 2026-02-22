/**
 * ============================================================
 * RESERVATIONSERVICE.GS
 * ============================================================
 * All reservation business logic.
 * Handles: creation, approval, cancellation, usage tracking,
 * weekly/monthly limit enforcement, excess reservation flow,
 * bumping windows, guest list deadline calculation, and the
 * RSO daily summary generation.
 * ============================================================
 */


// ============================================================
// USAGE CHECKING
// ============================================================

/**
 * Returns the total tennis court hours booked by a household
 * in the week containing the given date.
 *
 * @param {string} householdId
 * @param {Date}   forDate       Any date in the week to check (default: today)
 * @returns {number}             Hours booked (decimal, e.g. 1.5)
 */
function getTennisHoursThisWeek(householdId, forDate) {
  var weekStart = getWeekStart(forDate || new Date());
  var weekEnd   = addDays(weekStart, 7);
  return _sumReservationHours(householdId, FACILITY_TENNIS, weekStart, weekEnd,
                              [STATUS_APPROVED, STATUS_TENTATIVE, STATUS_CONFIRMED]);
}

/**
 * Returns the number of leobo/whole-facility reservations a household
 * has in the month containing the given date.
 *
 * @param {string} householdId
 * @param {Date}   forDate       Any date in the month to check (default: today)
 * @returns {number}             Count of reservations
 */
function getLeoboReservationsThisMonth(householdId, forDate) {
  var monthStart = getMonthStart(forDate || new Date());
  var monthEnd   = addDays(monthStart, 32); // generous upper bound
  monthEnd.setDate(1); monthEnd.setMonth(monthEnd.getMonth()); // actually 1st of next month

  return _countReservations(householdId,
    [FACILITY_LEOBO, FACILITY_WHOLE], monthStart, monthEnd,
    [STATUS_APPROVED, STATUS_TENTATIVE, STATUS_CONFIRMED]);
}

/**
 * Returns the total leobo hours booked by a household in the
 * month containing the given date.
 *
 * @param {string} householdId
 * @param {Date}   forDate
 * @returns {number}
 */
function getLeoboHoursThisMonth(householdId, forDate) {
  var monthStart = getMonthStart(forDate || new Date());
  var monthEnd   = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  return _sumReservationHours(householdId,
    [FACILITY_LEOBO, FACILITY_WHOLE], monthStart, monthEnd,
    [STATUS_APPROVED, STATUS_TENTATIVE, STATUS_CONFIRMED]);
}

/**
 * Checks whether a new reservation request would exceed limits.
 * Returns a result object indicating whether to auto-approve,
 * flag as excess, or block outright.
 *
 * @param {string} householdId
 * @param {string} facility      One of the FACILITY_* constants
 * @param {Date}   eventDate
 * @param {number} durationHours
 * @returns {Object}
 *   { allowed: bool, isExcess: bool, reason: string,
 *     hoursUsed: number, hoursLimit: number }
 */
function checkReservationLimits(householdId, facility, eventDate, durationHours) {
  // Tennis / basketball court
  if (facility === FACILITY_TENNIS) {
    var hoursUsed  = getTennisHoursThisWeek(householdId, eventDate);
    var hoursLimit = TENNIS_WEEKLY_LIMIT_HOURS;

    if (durationHours > TENNIS_SESSION_MAX_HOURS) {
      return {
        allowed: false, isExcess: false,
        reason: "A single tennis session cannot exceed " + TENNIS_SESSION_MAX_HOURS + " hours.",
        hoursUsed: hoursUsed, hoursLimit: hoursLimit
      };
    }
    if (hoursUsed >= hoursLimit) {
      return {
        allowed: true, isExcess: true,
        reason: ERR_TENNIS_LIMIT,
        hoursUsed: hoursUsed, hoursLimit: hoursLimit
      };
    }
    return { allowed: true, isExcess: false, reason: "", hoursUsed: hoursUsed, hoursLimit: hoursLimit };
  }

  // Leobo / whole facility
  if (facility === FACILITY_LEOBO || facility === FACILITY_WHOLE) {
    var countUsed  = getLeoboReservationsThisMonth(householdId, eventDate);
    var hoursUsed  = getLeoboHoursThisMonth(householdId, eventDate);
    var countLimit = LEOBO_MONTHLY_LIMIT;
    var hoursLimit = LEOBO_MAX_HOURS;

    if (durationHours > hoursLimit) {
      return {
        allowed: false, isExcess: false,
        reason: "A single leobo reservation cannot exceed " + hoursLimit + " hours.",
        hoursUsed: hoursUsed, hoursLimit: hoursLimit
      };
    }
    if (countUsed >= countLimit) {
      return {
        allowed: true, isExcess: true,
        reason: ERR_LEOBO_LIMIT,
        hoursUsed: hoursUsed, hoursLimit: hoursLimit,
        countUsed: countUsed, countLimit: countLimit
      };
    }
    return {
      allowed: true, isExcess: false, reason: "",
      hoursUsed: hoursUsed, hoursLimit: hoursLimit,
      countUsed: countUsed, countLimit: countLimit
    };
  }

  // Unknown facility — allow
  return { allowed: true, isExcess: false, reason: "", hoursUsed: 0, hoursLimit: 0 };
}


// ============================================================
// GUEST LIST DEADLINE
// ============================================================

/**
 * Returns the guest list submission deadline for an event.
 * GUEST_LIST_DEADLINE_DAYS business days before the event,
 * excluding US and Botswana holidays.
 *
 * @param {Date} eventDate
 * @returns {Date}
 */
function getGuestListDeadline(eventDate) {
  return calculateBusinessDayDeadline(eventDate, GUEST_LIST_DEADLINE_DAYS);
}

/**
 * Returns true if it is still possible to submit a guest list
 * for an event on the given date (deadline has not passed).
 *
 * @param {Date} eventDate
 * @returns {boolean}
 */
function isGuestListDeadlineMet(eventDate) {
  var deadline = getGuestListDeadline(eventDate);
  deadline.setHours(17, 0, 0, 0); // 5:00 PM on deadline day
  return new Date() <= deadline;
}


// ============================================================
// RESERVATION CREATION
// ============================================================

/**
 * Creates a new reservation record and sends the appropriate
 * notification emails. Handles standard and excess reservations.
 *
 * Standard flow:
 *   - Tennis (within limit): auto-confirm → email tpl_007
 *   - Leobo (within limit): pending → email tpl_008 → board/MGT notified
 *
 * Excess flow:
 *   - Any facility over limit: pending → email tpl_008 →
 *     board/MGT notified with warning (tpl_030/tpl_031)
 *
 * @param {Object} params
 *   householdId, primaryEmail, facility, eventDate (Date),
 *   startTime (Date), endTime (Date), eventName,
 *   durationHours, hasGuests (bool), guestCount (number)
 * @returns {Object} { success: bool, reservationId: string, status: string, message: string }
 */
function createReservation(params) {
  var hh = getHouseholdById(params.householdId);
  if (!hh) return { success: false, message: ERR_NOT_MEMBER };

  // Check for conflicts
  if (hasConflict(params.facility, params.startTime, params.endTime)) {
    return { success: false, message: ERR_CONFLICT };
  }

  // Check limits
  var limitCheck = checkReservationLimits(
    params.householdId, params.facility, params.eventDate, params.durationHours
  );
  if (!limitCheck.allowed) {
    return { success: false, message: limitCheck.reason };
  }

  // Determine initial status
  var needsBoardApproval  = FACILITIES_REQUIRING_APPROVAL.indexOf(params.facility) !== -1;
  var initialStatus       = (needsBoardApproval || limitCheck.isExcess)
                            ? STATUS_PENDING : STATUS_CONFIRMED;

  // Calculate bump window deadline for excess reservations
  var bumpDeadline = null;
  if (limitCheck.isExcess) {
    if (params.facility === FACILITY_TENNIS) {
      bumpDeadline = addDays(params.eventDate, -TENNIS_BUMP_WINDOW_DAYS);
    } else {
      bumpDeadline = calculateBusinessDayDeadline(params.eventDate, LEOBO_BUMP_WINDOW_DAYS);
    }
  }

  // Calculate guest list deadline
  var guestDeadline = params.hasGuests ? getGuestListDeadline(params.eventDate) : null;

  // Build reservation record
  var reservationId = generateId("RES");
  var now           = new Date();

  var row = {
    reservation_id:           reservationId,
    household_id:             params.householdId,
    household_name:           hh.household_name,
    primary_email:            params.primaryEmail,
    facility:                 params.facility,
    event_date:               params.eventDate,
    start_time:               params.startTime,
    end_time:                 params.endTime,
    duration_hours:           params.durationHours,
    event_name:               sanitizeInput(params.eventName),
    status:                   initialStatus,
    has_guests:               params.hasGuests || false,
    guest_count:              params.guestCount || 0,
    guest_list_deadline:      guestDeadline,
    guest_list_submitted:     false,
    is_excess_reservation:    limitCheck.isExcess,
    bump_window_deadline:     bumpDeadline,
    bumped_by_household_id:   "",
    bumped_date:              "",
    no_fundraising_confirmed: params.noFundraisingConfirmed || false,
    created_date:             now,
    last_modified_date:       now
  };

  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    sheet.appendRow(headers.map(function(col) {
      return row[col] !== undefined ? row[col] : "";
    }));
  } catch (e) {
    Logger.log("ERROR createReservation (write): " + e);
    return { success: false, message: "Failed to save reservation. Please try again." };
  }

  logAuditEntry(params.primaryEmail, AUDIT_RESERVATION_CREATED, "Reservation",
                reservationId, params.facility + " on " + formatDate(params.eventDate));

  // Send notifications
  _sendReservationNotifications(params, row, hh, limitCheck);

  return {
    success:       true,
    reservationId: reservationId,
    status:        initialStatus,
    message:       "Reservation " + reservationId + " created with status: " + initialStatus
  };
}


// ============================================================
// APPROVAL / DENIAL
// ============================================================

/**
 * Approves a reservation. For excess reservations, sets status
 * to TENTATIVE; for standard, sets to CONFIRMED.
 *
 * @param {string} reservationId
 * @param {string} approvedBy      Board/MGT email
 * @param {string} notes           Optional notes
 * @returns {boolean}
 */
function approveReservation(reservationId, approvedBy, notes) {
  var res = getReservationById(reservationId);
  if (!res) return false;

  var newStatus = res.is_excess_reservation ? STATUS_TENTATIVE : STATUS_CONFIRMED;
  _updateReservationField(reservationId, "status",      newStatus,    approvedBy);
  _updateReservationField(reservationId, "approved_by", approvedBy,   approvedBy);
  _updateReservationField(reservationId, "approved_date", new Date(), approvedBy);
  if (notes) _updateReservationField(reservationId, "approval_notes", notes, approvedBy);

  logAuditEntry(approvedBy, AUDIT_RESERVATION_APPROVED, "Reservation", reservationId,
                "Approved → " + newStatus);

  // Notify member
  var hh = getHouseholdById(res.household_id);
  if (hh) {
    var primaryEmail = _getPrimaryEmail(hh.household_id);
    if (primaryEmail) {
      sendEmail("tpl_010", primaryEmail, {
        FIRST_NAME:               _getPrimaryFirstName(hh.household_id),
        FACILITY:                 res.facility,
        RESERVATION_DATE:         formatDate(new Date(res.event_date)),
        START_TIME:               formatTime(new Date(res.start_time)),
        END_TIME:                 formatTime(new Date(res.end_time)),
        EVENT_NAME:               res.event_name,
        APPROVED_BY:              approvedBy,
        RESERVATION_ID:           reservationId,
        IF_GUESTS:                res.has_guests ? "true" : "",
        IF_GUEST_LIST_SUBMITTED:  res.guest_list_submitted ? "true" : "",
        IF_GUEST_LIST_PENDING:    (!res.guest_list_submitted && res.has_guests) ? "true" : "",
        GUEST_LIST_DEADLINE:      res.guest_list_deadline
                                  ? formatDate(new Date(res.guest_list_deadline)) : ""
      });
    }
  }
  return true;
}

/**
 * Denies a reservation and notifies the member.
 *
 * @param {string} reservationId
 * @param {string} deniedBy
 * @param {string} reason
 * @returns {boolean}
 */
function denyReservation(reservationId, deniedBy, reason) {
  var res = getReservationById(reservationId);
  if (!res) return false;

  _updateReservationField(reservationId, "status",        STATUS_CANCELLED, deniedBy);
  _updateReservationField(reservationId, "denial_reason", reason || "",     deniedBy);

  logAuditEntry(deniedBy, AUDIT_RESERVATION_DENIED, "Reservation", reservationId,
                "Denied: " + reason);

  var hh = getHouseholdById(res.household_id);
  if (hh) {
    var primaryEmail = _getPrimaryEmail(hh.household_id);
    if (primaryEmail) {
      sendEmail("tpl_011", primaryEmail, {
        FIRST_NAME:       _getPrimaryFirstName(hh.household_id),
        FACILITY:         res.facility,
        RESERVATION_DATE: formatDate(new Date(res.event_date)),
        START_TIME:       formatTime(new Date(res.start_time)),
        END_TIME:         formatTime(new Date(res.end_time)),
        EVENT_NAME:       res.event_name,
        DENIAL_REASON:    reason || "No reason provided"
      });
    }
  }
  return true;
}

/**
 * Cancels a reservation and notifies the member.
 * Can be called by member (self-cancel) or board.
 *
 * @param {string} reservationId
 * @param {string} cancelledBy     Email of person cancelling
 * @param {string} reason          Optional
 * @returns {boolean}
 */
function cancelReservation(reservationId, cancelledBy, reason) {
  var res = getReservationById(reservationId);
  if (!res) return false;

  _updateReservationField(reservationId, "status",               STATUS_CANCELLED, cancelledBy);
  _updateReservationField(reservationId, "cancellation_reason",  reason || "",     cancelledBy);
  _updateReservationField(reservationId, "cancelled_by",         cancelledBy,      cancelledBy);
  _updateReservationField(reservationId, "cancellation_date",    new Date(),       cancelledBy);

  logAuditEntry(cancelledBy, AUDIT_RESERVATION_CANCELLED, "Reservation", reservationId,
                "Cancelled: " + (reason || "no reason given"));

  var hh = getHouseholdById(res.household_id);
  if (hh) {
    var primaryEmail = _getPrimaryEmail(hh.household_id);
    if (primaryEmail) {
      var boardCancelled = cancelledBy !== primaryEmail;
      sendEmail("tpl_012", primaryEmail, {
        FIRST_NAME:          _getPrimaryFirstName(hh.household_id),
        FACILITY:            res.facility,
        RESERVATION_DATE:    formatDate(new Date(res.event_date)),
        START_TIME:          formatTime(new Date(res.start_time)),
        END_TIME:            formatTime(new Date(res.end_time)),
        EVENT_NAME:          res.event_name,
        CANCELLED_BY:        cancelledBy,
        IF_REASON:           reason ? "true" : "",
        CANCELLATION_REASON: reason || "",
        IF_BOARD_CANCELLED:  boardCancelled ? "true" : ""
      });
    }
  }
  return true;
}


// ============================================================
// BUMP WINDOW CHECKER (nightly trigger)
// ============================================================

/**
 * Runs nightly to promote TENTATIVE reservations to CONFIRMED
 * once their bump window has passed.
 * Triggered nightly — recommended to run at midnight.
 */
function processBumpWindowExpirations() {
  Logger.log("Bump window check starting...");
  var today = new Date(); today.setHours(0, 0, 0, 0);

  try {
    var sheet = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol   = headers.indexOf("reservation_id");
    var stCol   = headers.indexOf("status");
    var bwCol   = headers.indexOf("bump_window_deadline");

    for (var i = 1; i < data.length; i++) {
      if (data[i][stCol] !== STATUS_TENTATIVE) continue;
      if (!data[i][bwCol]) continue;

      var bwDeadline = new Date(data[i][bwCol]);
      bwDeadline.setHours(0, 0, 0, 0);

      if (today > bwDeadline) {
        var resId = data[i][idCol];
        sheet.getRange(i + 1, stCol + 1).setValue(STATUS_CONFIRMED);
        sheet.getRange(i + 1, headers.indexOf("last_modified_date") + 1).setValue(new Date());
        logAuditEntry("system", AUDIT_RESERVATION_APPROVED, "Reservation", resId,
                      "Auto-confirmed: bump window passed");
        Logger.log("Auto-confirmed: " + resId);
      }
    }
  } catch (e) { Logger.log("ERROR processBumpWindowExpirations: " + e); }
}


// ============================================================
// GUEST LIST DEADLINE REMINDER (nightly trigger)
// ============================================================

/**
 * Runs nightly. Sends tpl_013 to any member whose guest list
 * is not yet submitted and whose deadline is tomorrow.
 */
function sendGuestListReminders() {
  Logger.log("Guest list reminder check starting...");
  var tomorrow = addDays(new Date(), 1);
  tomorrow.setHours(0, 0, 0, 0);

  try {
    var sheet = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];

    for (var i = 1; i < data.length; i++) {
      var res = rowToObject(headers, data[i]);
      if (!res.has_guests || res.guest_list_submitted) continue;
      if (res.status === STATUS_CANCELLED) continue;
      if (!res.guest_list_deadline) continue;

      var deadline = new Date(res.guest_list_deadline);
      deadline.setHours(0, 0, 0, 0);
      if (deadline.getTime() !== tomorrow.getTime()) continue;

      // Deadline is tomorrow — send reminder
      var primaryEmail = res.primary_email;
      if (!primaryEmail) continue;

      var hh = getHouseholdById(res.household_id);
      sendEmail("tpl_013", primaryEmail, {
        FIRST_NAME:           _getPrimaryFirstName(res.household_id),
        FACILITY:             res.facility,
        RESERVATION_DATE:     formatDate(new Date(res.event_date)),
        START_TIME:           formatTime(new Date(res.start_time)),
        END_TIME:             formatTime(new Date(res.end_time)),
        EVENT_NAME:           res.event_name,
        GUEST_LIST_DEADLINE:  formatDate(deadline)
      });
      Logger.log("Guest list reminder sent: " + primaryEmail + " for " + res.reservation_id);
    }
  } catch (e) { Logger.log("ERROR sendGuestListReminders: " + e); }
}


// ============================================================
// RSO DAILY SUMMARY
// ============================================================

/**
 * Builds and sends the RSO daily summary email (tpl_014)
 * for all reservations on today's date.
 * Triggered nightly at RSO_SUMMARY_HOUR.
 */
function sendRsoDailySummary() {
  Logger.log("RSO daily summary starting...");
  var todayStr = formatDate(new Date(), true);

  try {
    var sheet = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];

    var todayReservations = [];
    for (var i = 1; i < data.length; i++) {
      var res = rowToObject(headers, data[i]);
      if (!res.event_date) continue;
      if (formatDate(new Date(res.event_date), true) !== todayStr) continue;
      if (res.status === STATUS_CANCELLED) continue;
      todayReservations.push(res);
    }

    // Sort by start time
    todayReservations.sort(function(a, b) {
      return new Date(a.start_time) - new Date(b.start_time);
    });

    var block           = "";
    var totalMembers    = 0;
    var totalGuests     = 0;
    var reservationNum  = 0;

    for (var j = 0; j < todayReservations.length; j++) {
      var r       = todayReservations[j];
      var hh      = getHouseholdById(r.household_id);
      var members = getHouseholdMembers(r.household_id);
      reservationNum++;

      block += "--- RESERVATION #" + reservationNum + " ---\n";
      block += "Facility: " + r.facility + "\n";
      block += "Time: " + formatTime(new Date(r.start_time)) +
               " - " + formatTime(new Date(r.end_time)) + "\n";
      if (r.event_name) block += "Event: " + r.event_name + "\n";
      block += "Reserved By: " + (hh ? hh.household_name : r.household_id) + "\n";
      block += "Contact: " + r.primary_email + "\n";
      block += "Membership: " + (hh ? hh.membership_type + " - " + hh.household_type : "") + "\n";
      block += "Household Attending: " +
               members.filter(function(m) {
                 return m.relationship_to_primary !== RELATIONSHIP_STAFF;
               }).map(function(m) {
                 return m.first_name + " " + m.last_name +
                        (m.date_of_birth ? " (age " + calculateAge(m.date_of_birth) + ")" : "");
               }).join(", ") + "\n";

      if (r.has_guests) {
        block += "Guests: " + (r.guest_count || 0) + " guests\n";
        totalGuests += (r.guest_count || 0);
      } else {
        block += "Guests: None\n";
      }
      block += "\n";
      totalMembers += members.filter(function(m) {
        return m.relationship_to_primary !== RELATIONSHIP_STAFF;
      }).length;
    }

    var noRes = todayReservations.length === 0 ? "true" : "";
    sendEmail("tpl_014", EMAIL_RSO, {
      TODAY_DATE:          formatDate(new Date()),
      IF_NO_RESERVATIONS:  noRes,
      RESERVATIONS_BLOCK:  block,
      TOTAL_RESERVATIONS:  todayReservations.length,
      TOTAL_MEMBERS:       totalMembers,
      TOTAL_GUESTS:        totalGuests,
      TOTAL_VENDORS:       0
    });

    Logger.log("RSO summary sent: " + todayReservations.length + " reservation(s)");
  } catch (e) { Logger.log("ERROR sendRsoDailySummary: " + e); }
}


// ============================================================
// READ HELPERS
// ============================================================

/**
 * Returns a reservation record by reservation_id.
 * @param {string} reservationId
 * @returns {Object|null}
 */
function getReservationById(reservationId) {
  if (!reservationId) return null;
  try {
    var sheet = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol   = headers.indexOf("reservation_id");
    for (var i = 1; i < data.length; i++) {
      if (data[i][idCol] === reservationId) return rowToObject(headers, data[i]);
    }
  } catch (e) { Logger.log("ERROR getReservationById(" + reservationId + "): " + e); }
  return null;
}

/**
 * Returns true if a facility is already booked during the given window.
 * @param {string} facility
 * @param {Date}   startTime
 * @param {Date}   endTime
 * @returns {boolean}
 */
function hasConflict(facility, startTime, endTime) {
  try {
    var sheet = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var facCol  = headers.indexOf("facility");
    var stCol   = headers.indexOf("start_time");
    var etCol   = headers.indexOf("end_time");
    var statCol = headers.indexOf("status");

    var activeStatuses = [STATUS_PENDING, STATUS_APPROVED, STATUS_TENTATIVE, STATUS_CONFIRMED];
    var newStart = new Date(startTime).getTime();
    var newEnd   = new Date(endTime).getTime();

    for (var i = 1; i < data.length; i++) {
      if (data[i][facCol] !== facility) continue;
      if (activeStatuses.indexOf(data[i][statCol]) === -1) continue;

      var exStart = new Date(data[i][stCol]).getTime();
      var exEnd   = new Date(data[i][etCol]).getTime();

      // Overlap check: new starts before existing ends AND new ends after existing starts
      if (newStart < exEnd && newEnd > exStart) return true;
    }
  } catch (e) { Logger.log("ERROR hasConflict: " + e); }
  return false;
}


// ============================================================
// INTERNAL HELPERS
// ============================================================

function _updateReservationField(reservationId, fieldName, value, updatedBy) {
  return _updateField(
    RESERVATIONS_ID, TAB_RESERVATIONS, "reservation_id",
    reservationId, fieldName, value, updatedBy,
    AUDIT_RESERVATION_CREATED, "Reservation"
  );
}

/**
 * Sums reservation hours for a household at given facilities
 * within a date range, filtered by status list.
 */
function _sumReservationHours(householdId, facility, fromDate, toDate, statuses) {
  var facilities = Array.isArray(facility) ? facility : [facility];
  var total = 0;
  try {
    var sheet = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var hhCol   = headers.indexOf("household_id");
    var facCol  = headers.indexOf("facility");
    var dateCol = headers.indexOf("event_date");
    var durCol  = headers.indexOf("duration_hours");
    var statCol = headers.indexOf("status");

    for (var i = 1; i < data.length; i++) {
      if (data[i][hhCol] !== householdId) continue;
      if (facilities.indexOf(data[i][facCol]) === -1) continue;
      if (statuses.indexOf(data[i][statCol]) === -1) continue;
      var d = new Date(data[i][dateCol]);
      if (d < fromDate || d >= toDate) continue;
      total += Number(data[i][durCol]) || 0;
    }
  } catch (e) { Logger.log("ERROR _sumReservationHours: " + e); }
  return total;
}

/**
 * Counts reservation rows matching household, facilities, date range, statuses.
 */
function _countReservations(householdId, facilities, fromDate, toDate, statuses) {
  var count = 0;
  try {
    var sheet = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var hhCol   = headers.indexOf("household_id");
    var facCol  = headers.indexOf("facility");
    var dateCol = headers.indexOf("event_date");
    var statCol = headers.indexOf("status");

    for (var i = 1; i < data.length; i++) {
      if (data[i][hhCol] !== householdId) continue;
      if (facilities.indexOf(data[i][facCol]) === -1) continue;
      if (statuses.indexOf(data[i][statCol]) === -1) continue;
      var d = new Date(data[i][dateCol]);
      if (d < fromDate || d >= toDate) continue;
      count++;
    }
  } catch (e) { Logger.log("ERROR _countReservations: " + e); }
  return count;
}

/**
 * Sends all notification emails triggered by a new reservation.
 */
function _sendReservationNotifications(params, row, hh, limitCheck) {
  var dateStr  = formatDate(params.eventDate);
  var startStr = formatTime(params.startTime);
  var endStr   = formatTime(params.endTime);

  var baseVars = {
    FIRST_NAME:        _getPrimaryFirstName(params.householdId),
    FULL_NAME:         hh.household_name,
    MEMBER_EMAIL:      params.primaryEmail,
    MEMBER_PHONE:      hh.primary_phone || "",
    FACILITY:          params.facility,
    RESERVATION_DATE:  dateStr,
    START_TIME:        startStr,
    END_TIME:          endStr,
    EVENT_NAME:        row.event_name,
    RESERVATION_ID:    row.reservation_id,
    SUBMISSION_TIMESTAMP: formatDate(new Date()),
    IF_GUESTS:         params.hasGuests ? "true" : "",
    GUEST_COUNT:       params.guestCount || 0,
    GUEST_LIST_DEADLINE: row.guest_list_deadline ? formatDate(new Date(row.guest_list_deadline)) : ""
  };

  if (row.status === STATUS_CONFIRMED) {
    // Auto-confirmed tennis — just send confirmation to member
    sendEmail("tpl_007", params.primaryEmail, baseVars);

  } else {
    // Pending — send acknowledgment to member
    sendEmail("tpl_008", params.primaryEmail, Object.assign({}, baseVars, {
      APPROVAL_REASON: limitCheck.isExcess
                       ? "your household has exceeded the booking limit"
                       : "board and Management Officer approval",
      IF_LEOBO: (params.facility === FACILITY_LEOBO || params.facility === FACILITY_WHOLE)
                ? "true" : ""
    }));

    // Send approval request to board / MGT
    var limitVars = Object.assign({}, baseVars, {
      MEMBERSHIP_LEVEL:     hh.membership_type,
      MEMBERSHIP_STATUS:    hh.active ? "Active" : "Inactive",
      HOUSEHOLD_NAME:       hh.household_name,
      LEOBO_USAGE:          getLeoboReservationsThisMonth(params.householdId, params.eventDate),
      LEOBO_MONTHLY_LIMIT:  LEOBO_MONTHLY_LIMIT,
      HOURS_USED:           limitCheck.hoursUsed,
      TENNIS_WEEKLY_LIMIT_HOURS: TENNIS_WEEKLY_LIMIT_HOURS,
      LEOBO_MAX_HOURS:      LEOBO_MAX_HOURS,
      BUMP_DEADLINE:        row.bump_window_deadline
                            ? formatDate(new Date(row.bump_window_deadline)) : "",
      APPROVE_LINK:         URL_ADMIN_PORTAL + "?action=approve&id=" + row.reservation_id,
      DENY_LINK:            URL_ADMIN_PORTAL + "?action=deny&id="    + row.reservation_id
    });

    if (limitCheck.isExcess && params.facility === FACILITY_TENNIS) {
      sendEmail("tpl_030", EMAIL_BOARD, limitVars);
    } else if (params.facility === FACILITY_LEOBO || params.facility === FACILITY_WHOLE) {
      if (limitCheck.isExcess) {
        sendEmail("tpl_031", EMAIL_MGT, limitVars);
      } else {
        sendEmail("tpl_019", EMAIL_MGT, limitVars);
      }
    } else {
      sendEmail("tpl_009", EMAIL_BOARD, limitVars);
    }

    // Send limit-reached notice to member if excess
    if (limitCheck.isExcess) {
      if (params.facility === FACILITY_TENNIS) {
        sendEmail("tpl_028", params.primaryEmail, Object.assign({}, baseVars, {
          WEEK_START: formatDate(getWeekStart(params.eventDate)),
          WEEK_END:   formatDate(addDays(getWeekStart(params.eventDate), 6)),
          TENNIS_BUMP_WINDOW_DAYS: TENNIS_BUMP_WINDOW_DAYS
        }));
      } else {
        sendEmail("tpl_029", params.primaryEmail, Object.assign({}, baseVars, {
          CURRENT_MONTH:  new Date().toLocaleString("default", { month: "long" }),
          LEOBO_USAGE:    limitCheck.countUsed,
          LEOBO_MAX_HOURS: LEOBO_MAX_HOURS,
          LEOBO_BUMP_WINDOW_DAYS: LEOBO_BUMP_WINDOW_DAYS
        }));
      }
    }
  }
}