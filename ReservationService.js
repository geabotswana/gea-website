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
    [FACILITY_LEOBO], monthStart, monthEnd,
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
  var monthEnd   = addDays(monthStart, 32);
  monthEnd.setDate(1); monthEnd.setMonth(monthEnd.getMonth());
  return _sumReservationHours(
    householdId,
    [FACILITY_LEOBO],
    monthStart, monthEnd,
    [STATUS_APPROVED, STATUS_TENTATIVE, STATUS_CONFIRMED]
  );
}

/**
 * Returns the total pool hours booked by a household in the
 * month containing the given date.
 *
 * @param {string} householdId
 * @param {Date}   forDate
 * @returns {number}
 */
function getPoolHoursThisMonth(householdId, forDate) {
  var monthStart = getMonthStart(forDate || new Date());
  var monthEnd   = addDays(monthStart, 32);
  monthEnd.setDate(1); monthEnd.setMonth(monthEnd.getMonth());
  return _sumReservationHours(
    householdId,
    [FACILITY_POOL],
    monthStart, monthEnd,
    [STATUS_APPROVED, STATUS_TENTATIVE, STATUS_CONFIRMED]
  );
}

/**
 * Returns the number of pool reservations a household has in the
 * month containing the given date.
 *
 * @param {string} householdId
 * @param {Date}   forDate
 * @returns {number}
 */
function getPoolReservationsThisMonth(householdId, forDate) {
  var monthStart = getMonthStart(forDate || new Date());
  var monthEnd   = addDays(monthStart, 32);
  monthEnd.setDate(1); monthEnd.setMonth(monthEnd.getMonth());
  return _countReservations(
    householdId,
    [FACILITY_POOL],
    monthStart, monthEnd,
    [STATUS_APPROVED, STATUS_TENTATIVE, STATUS_CONFIRMED]
  );
}


// ============================================================
// LIMIT CHECKING
// ============================================================

/**
 * Checks whether a new reservation is within household limits.
 * Returns {allowed, isExcess, reason}.
 *
 * @param {string} householdId
 * @param {string} facility
 * @param {Date}   eventDate
 * @param {number} durationHours
 * @returns {{allowed: boolean, isExcess: boolean, reason: string}}
 */
function checkReservationLimits(householdId, facility, eventDate, durationHours) {
  var rules = getFacilityRules(facility);
  if (!rules) return { allowed: true, isExcess: false, reason: '' };

  var used, count;

  if (facility === FACILITY_TENNIS) {
    var weekStart = getWeekStart(eventDate);
    var weekEnd   = addDays(weekStart, 7);
    used  = _sumReservationHours(householdId, FACILITY_TENNIS, weekStart, weekEnd,
                                 [STATUS_APPROVED, STATUS_TENTATIVE, STATUS_CONFIRMED]);
    if (used + durationHours > rules.weeklyHoursLimit) {
      return { allowed: true, isExcess: true, reason: 'Exceeds weekly tennis limit — placed as excess reservation.' };
    }
    return { allowed: true, isExcess: false, reason: '' };
  }

  if (facility === FACILITY_LEOBO || facility === FACILITY_WHOLE) {
    var monthStart = getMonthStart(eventDate);
    var monthEnd   = getMonthEnd(eventDate);
    count = _countReservations(householdId, [FACILITY_LEOBO, FACILITY_WHOLE],
                               monthStart, monthEnd,
                               [STATUS_APPROVED, STATUS_TENTATIVE, STATUS_CONFIRMED]);
    if (count >= rules.monthlyCountLimit) {
      return { allowed: true, isExcess: true, reason: 'Exceeds monthly Leobo limit — placed as excess reservation.' };
    }
    used = _sumReservationHours(householdId, [FACILITY_LEOBO, FACILITY_WHOLE],
                                monthStart, monthEnd,
                                [STATUS_APPROVED, STATUS_TENTATIVE, STATUS_CONFIRMED]);
    if (used + durationHours > rules.monthlyHoursLimit) {
      return { allowed: true, isExcess: true, reason: 'Exceeds monthly Leobo hours limit — placed as excess reservation.' };
    }
    return { allowed: true, isExcess: false, reason: '' };
  }

  if (facility === FACILITY_POOL) {
    var monthStart = getMonthStart(eventDate);
    var monthEnd   = getMonthEnd(eventDate);
    count = _countReservations(householdId, [FACILITY_POOL], monthStart, monthEnd,
                               [STATUS_APPROVED, STATUS_TENTATIVE, STATUS_CONFIRMED]);
    if (count >= rules.monthlyCountLimit) {
      return { allowed: true, isExcess: true, reason: 'Exceeds monthly pool reservation limit — placed as excess reservation.' };
    }
    used = _sumReservationHours(householdId, [FACILITY_POOL], monthStart, monthEnd,
                                [STATUS_APPROVED, STATUS_TENTATIVE, STATUS_CONFIRMED]);
    if (used + durationHours > rules.monthlyHoursLimit) {
      return { allowed: true, isExcess: true, reason: 'Exceeds monthly pool hours limit — placed as excess reservation.' };
    }
    return { allowed: true, isExcess: false, reason: '' };
  }

  return { allowed: true, isExcess: false, reason: '' };
}


// ============================================================
// RESERVATION CREATION
// ============================================================

/**
 * Creates a new reservation.
 * Validates member, checks conflicts and limits, writes the record,
 * sends notifications, and creates a calendar event.
 *
 * @param {Object} params  See field list below
 * @returns {{success: boolean, message: string, reservationId?: string}}
 */
function createReservation(params) {
  var hh = getHouseholdById(params.householdId);
  if (!hh) return { success: false, message: ERR_NOT_MEMBER };

  // Check for conflicts
  if (hasConflict(params.facility, params.reservationStart, params.reservationEnd)) {
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
    reservation_id:             reservationId,
    household_id:               params.householdId,
    submitted_by_individual_id: params.submittedByIndividualId || '',
    submitted_by_email:         params.primaryEmail,
    submission_timestamp:       now,
    facility:                   params.facility,
    reservation_start:          params.reservationStart,
    reservation_end:            params.reservationEnd,
    duration_hours:             params.durationHours,
    event_name:                 sanitizeInput(params.eventName),
    guest_count:                params.guestCount || 0,
    guest_list_submitted:       false,
    guest_list_deadline:        guestDeadline,
    status:                     initialStatus,
    board_approval_required:    needsBoardApproval,
    board_approved_by:          '',
    board_approval_timestamp:   '',
    board_denial_reason:        '',
    rso_notified_timestamp:     '',
    calendar_event_id:          '',
    cancelled_by:               '',
    cancellation_timestamp:     '',
    cancellation_reason:        '',
    notes:                      '',
    is_excess_reservation:      limitCheck.isExcess,
    bump_window_deadline:       bumpDeadline,
    bumped_by_household_id:     '',
    bumped_date:                '',
    mgt_approved_by:            '',
    mgt_approved_date:          ''
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

  // Create calendar event
  var calId = null;
  try {
    calId = _createCalendarEvent(params, reservationId, initialStatus);
    if (calId) _updateReservationField(reservationId, "calendar_event_id", calId, params.primaryEmail);
  } catch (e) {
    Logger.log("WARN createReservation calendar: " + e);
  }

  _sendReservationNotifications(params, row, hh, limitCheck);

  var msg = limitCheck.isExcess
    ? "Your reservation has been submitted as an excess reservation and is subject to bumping. " + limitCheck.reason
    : needsBoardApproval
      ? "Your reservation has been submitted and is pending board approval."
      : "Your reservation has been confirmed!";

  return { success: true, reservationId: reservationId, message: msg };
}


// ============================================================
// APPROVAL / STATUS MANAGEMENT
// ============================================================

/**
 * Board approves a pending reservation. Sets status to Confirmed.
 */
function approveReservation(reservationId, approvedBy) {
  var res = getReservationById(reservationId);
  if (!res) return { ok: false, message: "Reservation not found." };
  if (res.status !== STATUS_PENDING) {
    return { ok: false, message: "Only pending reservations can be approved." };
  }

  _updateReservationField(reservationId, "status",           STATUS_CONFIRMED, approvedBy);
  _updateReservationField(reservationId, "mgt_approved_by",  approvedBy,       approvedBy);
  _updateReservationField(reservationId, "mgt_approved_date", new Date(),      approvedBy);

  logAuditEntry(approvedBy, AUDIT_RESERVATION_APPROVED, "Reservation", reservationId,
                "Approved by " + approvedBy);

  try {
    _updateCalendarEventStatus(res.calendar_event_id, STATUS_CONFIRMED, res);
  } catch (e) { Logger.log("WARN approveReservation calendar: " + e); }

  _sendApprovalNotification(res, approvedBy);
  return { ok: true, message: "Reservation approved." };
}

/**
 * Board denies a pending reservation. Sets status to Cancelled.
 */
function denyReservation(reservationId, deniedBy, reason) {
  var res = getReservationById(reservationId);
  if (!res) return { ok: false, message: "Reservation not found." };
  if (res.status !== STATUS_PENDING) {
    return { ok: false, message: "Only pending reservations can be denied." };
  }

  _updateReservationField(reservationId, "status",              STATUS_CANCELLED, deniedBy);
  _updateReservationField(reservationId, "board_denial_reason", reason || "",     deniedBy);
  _updateReservationField(reservationId, "cancelled_by",        deniedBy,         deniedBy);
  _updateReservationField(reservationId, "cancellation_timestamp", new Date(),    deniedBy);

  logAuditEntry(deniedBy, AUDIT_RESERVATION_DENIED, "Reservation", reservationId,
                "Denied: " + (reason || "no reason given"));

  try {
    _deleteCalendarEvent(res.calendar_event_id);
  } catch (e) { Logger.log("WARN denyReservation calendar: " + e); }

  _sendDenialNotification(res, deniedBy, reason);
  return { ok: true, message: "Reservation denied." };
}

/**
 * Member or board cancels a reservation.
 */
function cancelReservation(reservationId, cancelledBy, reason) {
  var res = getReservationById(reservationId);
  if (!res) return { ok: false, message: "Reservation not found." };
  if (res.status === STATUS_CANCELLED) {
    return { ok: false, message: "Reservation is already cancelled." };
  }

  _updateReservationField(reservationId, "status",                STATUS_CANCELLED, cancelledBy);
  _updateReservationField(reservationId, "cancelled_by",          cancelledBy,      cancelledBy);
  _updateReservationField(reservationId, "cancellation_timestamp", new Date(),      cancelledBy);
  _updateReservationField(reservationId, "cancellation_reason",    reason || "",    cancelledBy);

  logAuditEntry(cancelledBy, AUDIT_RESERVATION_CANCELLED, "Reservation", reservationId,
                "Cancelled: " + (reason || "no reason given"));

  try {
    _deleteCalendarEvent(res.calendar_event_id);
  } catch (e) { Logger.log("WARN cancelReservation calendar: " + e); }

  _sendCancellationNotification(res, cancelledBy, reason);
  return { ok: true, message: "Reservation cancelled." };
}


// ============================================================
// BUMPING
// ============================================================

/**
 * Checks if any excess reservations should be bumped.
 * Runs nightly. Bumps reservations where bump_window_deadline has passed
 * and a non-excess reservation exists for the same facility/date/time.
 */
function processBumpingQueue() {
  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var now     = new Date();

    var excessReservations = [];
    for (var i = 1; i < data.length; i++) {
      var row = rowToObject(headers, data[i]);
      if (row.is_excess_reservation !== true && row.is_excess_reservation !== "TRUE") continue;
      if (row.status !== STATUS_CONFIRMED && row.status !== STATUS_TENTATIVE) continue;
      if (!row.bump_window_deadline) continue;
      var deadline = new Date(row.bump_window_deadline);
      if (now < deadline) continue; // Still within bump window
      excessReservations.push(row);
    }

    var bumped = 0;
    excessReservations.forEach(function(excess) {
      // Look for a regular (non-excess) confirmed reservation with overlapping datetime
      var conflict = false;
      var excessStart = new Date(excess.reservation_start).getTime();
      var excessEnd   = new Date(excess.reservation_end).getTime();
      for (var j = 1; j < data.length; j++) {
        var r = rowToObject(headers, data[j]);
        if (r.reservation_id === excess.reservation_id) continue;
        if (r.facility !== excess.facility) continue;
        if (r.status !== STATUS_CONFIRMED && r.status !== STATUS_TENTATIVE) continue;
        if (r.is_excess_reservation === true || r.is_excess_reservation === "TRUE") continue;
        var rStart = new Date(r.reservation_start).getTime();
        var rEnd   = new Date(r.reservation_end).getTime();
        if (rStart < excessEnd && rEnd > excessStart) {
          conflict = true;
          _updateReservationField(excess.reservation_id, "status", STATUS_CANCELLED, "system");
          _updateReservationField(excess.reservation_id, "bumped_by_household_id", r.household_id, "system");
          _updateReservationField(excess.reservation_id, "bumped_date", now, "system");
          _updateReservationField(excess.reservation_id, "cancellation_reason",
            "Bumped by " + r.household_id + " (" + r.reservation_id + ")", "system");
          logAuditEntry("system", AUDIT_RESERVATION_BUMPED, "Reservation", excess.reservation_id,
            "Bumped by " + r.reservation_id + " (" + r.household_id + ")");
          var bumperHh = getHouseholdById(r.household_id);
          _sendBumpNotification(excess, Object.assign({}, r, { household_name: bumperHh ? bumperHh.household_name : r.household_id }));
          bumped++;
          break;
        }
      }
    });

    Logger.log("Bumping check complete. " + bumped + " reservation(s) bumped.");
    return bumped;
  } catch (e) {
    Logger.log("ERROR processBumpingQueue: " + e);
    return 0;
  }
}


// ============================================================
// MEMBER-FACING QUERIES
// ============================================================

/**
 * Returns all reservations for a household, sorted by reservation_date descending.
 *
 * @param {string} householdId
 * @returns {Array}
 */
function getReservationsForHousehold(householdId) {
  if (!householdId) return [];
  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var hhCol   = headers.indexOf("household_id");
    var results = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][hhCol] !== householdId) continue;
      results.push(rowToObject(headers, data[i]));
    }
    results.sort(function(a, b) {
      return new Date(b.reservation_start) - new Date(a.reservation_start);
    });
    return results;
  } catch (e) {
    Logger.log("ERROR getReservationsForHousehold(" + householdId + "): " + e);
    return [];
  }
}

/**
 * Returns all upcoming active reservations (Confirmed/Tentative/Pending)
 * across all households, sorted by date. Used by admin dashboard.
 *
 * @returns {Array}
 */
function getUpcomingReservations() {
  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var today   = new Date();
    today.setHours(0, 0, 0, 0);
    var activeStatuses = [STATUS_CONFIRMED, STATUS_TENTATIVE, STATUS_PENDING];
    var results = [];

    for (var i = 1; i < data.length; i++) {
      var row = rowToObject(headers, data[i]);
      if (activeStatuses.indexOf(row.status) === -1) continue;
      if (new Date(row.reservation_start) < today) continue;
      results.push(row);
    }
    results.sort(function(a, b) { return new Date(a.reservation_start) - new Date(b.reservation_start); });
    return results;
  } catch (e) {
    Logger.log("ERROR getUpcomingReservations: " + e);
    return [];
  }
}

/**
 * Returns current usage stats for a household (for the portal dashboard).
 *
 * @param {string} householdId
 * @returns {Object}
 */
function getHouseholdUsage(householdId) {
  var now = new Date();
  return {
    tennisHoursThisWeek:       getTennisHoursThisWeek(householdId, now),
    leoboReservationsThisMonth: getLeoboReservationsThisMonth(householdId, now),
    leoboHoursThisMonth:        getLeoboHoursThisMonth(householdId, now),
    poolReservationsThisMonth:  getPoolReservationsThisMonth(householdId, now),
    poolHoursThisMonth:         getPoolHoursThisMonth(householdId, now)
  };
}


// ============================================================
// GUEST LIST DEADLINE
// ============================================================

/**
 * Returns the guest list submission deadline for an event on a given date.
 * Deadline is GUEST_LIST_DAYS_BEFORE working days before the event.
 *
 * @param {Date} eventDate
 * @returns {Date}
 */
function getGuestListDeadline(eventDate) {
  return addDaysExcludingWeekends(eventDate, -GUEST_LIST_DAYS_BEFORE);
}

/**
 * Returns true if the guest list deadline has not yet passed.
 *
 * @param {Date} eventDate
 * @returns {boolean}
 */
function isGuestListDeadlineMet(eventDate) {
  var deadline = getGuestListDeadline(eventDate);
  return new Date() <= deadline;
}


// ============================================================
// GUEST LIST REMINDERS
// ============================================================

/**
 * Sends guest list submission reminders to households that have
 * upcoming reservations with guests but haven't submitted a guest list.
 * Called nightly by NotificationService.
 */
function sendGuestListReminders() {
  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var today   = new Date();
    today.setHours(0, 0, 0, 0);
    var sent    = 0;

    for (var i = 1; i < data.length; i++) {
      var res = rowToObject(headers, data[i]);

      if (!(Number(res.guest_count) > 0) || res.guest_list_submitted) continue;
      if (res.status !== STATUS_CONFIRMED && res.status !== STATUS_TENTATIVE) continue;
      if (!res.guest_list_deadline) continue;

      var deadline = new Date(res.guest_list_deadline);
      if (deadline < today) continue; // deadline passed — handled by auto-submit

      var daysLeft = Math.round((deadline - today) / (1000 * 60 * 60 * 24));
      if (daysLeft !== GUEST_LIST_REMINDER_DAYS_BEFORE) continue;

      try {
        sendEmailFromTemplate("RES_GUEST_LIST_REMINDER", res.submitted_by_email || res.primary_email, {
          FIRST_NAME:       _getPrimaryFirstName(res.household_id),
          RESERVATION_ID:   res.reservation_id,
          FACILITY_NAME:    res.facility,
          RESERVATION_DATE: formatDate(new Date(res.reservation_start)),
          DEADLINE:         formatDate(deadline),
          DAYS_LEFT:        daysLeft,
          PORTAL_URL:       URL_MEMBER_PORTAL
        });
        sent++;
      } catch (e) {
        Logger.log("WARN sendGuestListReminders email (" + res.reservation_id + "): " + e);
      }
    }
    Logger.log("Guest list reminders sent: " + sent);
  } catch (e) { Logger.log("ERROR sendGuestListReminders: " + e); }
}


// ============================================================
// AUTO-SUBMIT GUEST LISTS AT DEADLINE
// ============================================================

/**
 * Finds all reservations with guests where the guest list deadline has passed
 * but no guest list has been submitted, then auto-submits them as empty/incomplete.
 * Called nightly by NotificationService.
 */
function autoSubmitPastDeadlineGuestLists() {
  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var today   = new Date();
    today.setHours(0, 0, 0, 0);
    var submitted = 0;

    for (var i = 1; i < data.length; i++) {
      var res = rowToObject(headers, data[i]);

      if (!(Number(res.guest_count) > 0)) continue;
      if (res.guest_list_submitted) continue;
      if (res.status !== STATUS_CONFIRMED && res.status !== STATUS_TENTATIVE) continue;
      if (!res.guest_list_deadline) continue;

      var deadline = new Date(res.guest_list_deadline);
      deadline.setHours(23, 59, 59, 999);
      if (today <= deadline) continue; // deadline hasn't passed yet

      // Auto-submit an empty guest list so RSO knows
      var result = submitGuestList(res.reservation_id, [], "system");
      if (result.ok) {
        submitted++;
        Logger.log("Auto-submitted empty guest list for " + res.reservation_id);
        try {
          sendEmailFromTemplate("RES_GUEST_LIST_AUTO_SUBMITTED",
            res.submitted_by_email || res.primary_email, {
              FIRST_NAME:       _getPrimaryFirstName(res.household_id),
              RESERVATION_ID:   res.reservation_id,
              FACILITY_NAME:    res.facility,
              RESERVATION_DATE: formatDate(new Date(res.reservation_start)),
              PORTAL_URL:       URL_MEMBER_PORTAL
            });
        } catch (e) { Logger.log("WARN autoSubmit email: " + e); }
      }
    }
    Logger.log("Auto-submitted " + submitted + " guest list(s).");
  } catch (e) { Logger.log("ERROR autoSubmitPastDeadlineGuestLists: " + e); }
}


// ============================================================
// USAGE / HISTORY
// ============================================================

/**
 * Returns reservation usage summary for a household.
 * Used in the member portal's "My Reservations" view.
 *
 * @param {string} householdId
 * @returns {Object}
 */
function getReservationHistory(householdId) {
  if (!householdId) return { reservations: [], usage: {} };
  var reservations = getReservationsForHousehold(householdId);
  var usage        = getHouseholdUsage(householdId);
  return { reservations: reservations, usage: usage };
}

/**
 * Returns all reservations across all households for admin use,
 * optionally filtered by status.
 *
 * @param {string} [status]  Optional status filter
 * @returns {Array}
 */
function getAllReservations(status) {
  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var results = [];

    for (var i = 1; i < data.length; i++) {
      var row = rowToObject(headers, data[i]);
      if (status && row.status !== status) continue;
      results.push(row);
    }
    results.sort(function(a, b) {
      return new Date(b.reservation_start) - new Date(a.reservation_start);
    });
    return results;
  } catch (e) {
    Logger.log("ERROR getAllReservations: " + e);
    return [];
  }
}

/**
 * Returns all reservations in a date range for a specific facility.
 * Used for the calendar view and conflict detection.
 *
 * @param {string} facility
 * @param {Date}   fromDate
 * @param {Date}   toDate
 * @returns {Array}
 */
function getReservationsByFacilityAndDateRange(facility, fromDate, toDate) {
  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var facCol  = headers.indexOf("facility");
    var dateCol = headers.indexOf("reservation_start");
    var results = [];

    for (var i = 1; i < data.length; i++) {
      if (data[i][facCol] !== facility) continue;
      var d = new Date(data[i][dateCol]);
      if (d < fromDate || d > toDate) continue;
      results.push(rowToObject(headers, data[i]));
    }
    results.sort(function(a, b) { return new Date(a.reservation_start) - new Date(b.reservation_start); });
    return results;
  } catch (e) {
    Logger.log("ERROR getReservationsByFacilityAndDateRange: " + e);
    return [];
  }
}


// ============================================================
// FORMATTED RESERVATION DISPLAY
// ============================================================

/**
 * Returns a formatted reservation object for the portal UI.
 * Normalises booleans from sheets that might be "TRUE"/"FALSE" strings.
 *
 * @param {Object} row  Raw row from Sheets
 * @returns {Object}
 */
function formatReservationForPortal(row) {
  return {
    reservation_id:        row.reservation_id,
    household_id:          row.household_id,
    facility:              row.facility,
    reservation_start:     row.reservation_start ? new Date(row.reservation_start).toISOString() : "",
    reservation_end:       row.reservation_end   ? new Date(row.reservation_end).toISOString()   : "",
    duration_hours:        row.duration_hours,
    event_name:            row.event_name || "",
    status:                row.status,
    guest_count:           Number(row.guest_count) || 0,
    guest_list_submitted:  row.guest_list_submitted === true || row.guest_list_submitted === "TRUE",
    guest_list_deadline:   row.guest_list_deadline ? formatDate(new Date(row.guest_list_deadline)) : "",
    is_excess_reservation: row.is_excess_reservation === true || row.is_excess_reservation === "TRUE",
    bump_window_deadline:  row.bump_window_deadline ? formatDate(new Date(row.bump_window_deadline)) : "",
    notes:                 row.notes || "",
    GUEST_LIST_DEADLINE:   row.guest_list_deadline ? formatDate(new Date(row.guest_list_deadline)) : ""
  };
}


// ============================================================
// GUEST LIST SUBMISSION
// ============================================================

/**
 * Member submits a guest list for a reservation.
 *
 * @param {string} reservationId
 * @param {Array}  guests   Array of {name, relationship, nationality}
 * @param {string} memberEmail
 * @returns {Object} { ok: bool, guestListId: string, message: string }
 */
function submitGuestList(reservationId, guests, memberEmail) {
  if (!reservationId || !guests || !guests.length) {
    return { ok: false, message: "Reservation ID and at least one guest are required." };
  }

  // Validate each guest: first_name, last_name required; id_number required for over_18
  for (var vi = 0; vi < guests.length; vi++) {
    var g = guests[vi];
    if (!g.first_name || !g.last_name) {
      return { ok: false, message: "First name and last name are required for all guests." };
    }
    if (g.age_group === "over_18" && !g.id_number) {
      return { ok: false, message: "ID number (omang or passport) is required for guests over 18." };
    }
  }

  var res = getReservationById(reservationId);
  if (!res) return { ok: false, message: "Reservation not found." };
  if (res.status === STATUS_CANCELLED) {
    return { ok: false, message: "Cannot submit guest list for a cancelled reservation." };
  }

  var late = !isGuestListDeadlineMet(new Date(res.reservation_start));

  var guestListId = generateId("GL");
  var now         = new Date();

  // Handle save_to_profile requests
  var profilesToSave = guests.filter(function(g) { return g.save_to_profile; });
  profilesToSave.forEach(function(g) {
    saveGuestProfile(res.household_id, g, memberEmail);
  });

  var row = {
    guest_list_id:     guestListId,
    reservation_id:    reservationId,
    household_id:      res.household_id,
    household_name:    res.household_name,
    primary_email:     memberEmail,
    facility:          res.facility,
    event_date:        res.reservation_start ? new Date(res.reservation_start) : null,
    reservation_start: res.reservation_start,
    reservation_end:   res.reservation_end,
    guests_json:       JSON.stringify(guests),
    guest_count:      guests.length,
    submitted_date:   now,
    submission_status: GUEST_LIST_STATUS_SUBMITTED,
    rso_reviewed_by:  "",
    rso_review_date:  "",
    rso_draft_json:   "",
    last_modified_date: now
  };

  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_GUEST_LISTS);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    sheet.appendRow(headers.map(function(col) {
      return row[col] !== undefined ? row[col] : "";
    }));
  } catch (e) {
    Logger.log("ERROR submitGuestList (write): " + e);
    return { ok: false, message: "Failed to save guest list. Please try again." };
  }

  // Mark reservation as having a submitted guest list
  _updateReservationField(reservationId, "guest_list_submitted", true, memberEmail);

  logAuditEntry(memberEmail, AUDIT_GUEST_LIST_SUBMITTED, "GuestList",
                guestListId, "Submitted " + guests.length + " guest(s) for " + reservationId);

  // Confirm to member
  sendEmailFromTemplate("RES_GUEST_LIST_SUBMITTED_TO_MEMBER", memberEmail, {
    FIRST_NAME:       _getPrimaryFirstName(res.household_id),
    RESERVATION_ID:   reservationId,
    FACILITY_NAME:    res.facility,
    RESERVATION_DATE: formatDate(new Date(res.reservation_start)),
    GUEST_COUNT:      guests.length,
    DEADLINE:         formatDate(getGuestListDeadline(new Date(res.reservation_start))),
    PORTAL_URL:       URL_MEMBER_PORTAL
  });

  var msg = late
    ? "Guest list submitted (after deadline — RSO has been notified)."
    : "Guest list submitted successfully.";
  return { ok: true, guestListId: guestListId, lateSubmission: late, message: msg };
}

/**
 * Returns the most recent guest list record for a given reservation,
 * or null if none has been submitted.
 *
 * @param {string} reservationId
 * @returns {Object|null}
 */
function getGuestListForReservation(reservationId) {
  if (!reservationId) return null;
  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_GUEST_LISTS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol   = headers.indexOf("reservation_id");
    var dateCol = headers.indexOf("submitted_date");
    var latest  = null;

    for (var i = 1; i < data.length; i++) {
      if (data[i][idCol] !== reservationId) continue;
      var candidate = rowToObject(headers, data[i]);
      if (!latest || new Date(candidate.submitted_date) > new Date(latest.submitted_date)) {
        latest = candidate;
      }
    }
    return latest;
  } catch (e) {
    Logger.log("ERROR getGuestListForReservation(" + reservationId + "): " + e);
    return null;
  }
}

/**
 * Returns all guest lists with a given submission status.
 * Used by the admin interface to list pending RSO reviews.
 *
 * @param {string} status  One of the GUEST_LIST_STATUS_* constants (default: submitted)
 * @returns {Array}
 */
function getGuestListsByStatus(status) {
  status = status || GUEST_LIST_STATUS_SUBMITTED;
  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_GUEST_LISTS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var statCol = headers.indexOf("submission_status");
    var results = [];

    for (var i = 1; i < data.length; i++) {
      if (data[i][statCol] !== status) continue;
      results.push(rowToObject(headers, data[i]));
    }
    results.sort(function(a, b) { return new Date(a.event_date) - new Date(b.event_date); });
    return results;
  } catch (e) {
    Logger.log("ERROR getGuestListsByStatus(" + status + "): " + e);
    return [];
  }
}


// ============================================================
// GUEST PROFILES
// ============================================================

/**
 * Saves a guest profile for a household.
 * Creates new or updates existing (matched by household + id_number).
 *
 * @param {string} householdId
 * @param {Object} guestData   {first_name, last_name, id_number, age_group}
 * @param {string} actorEmail
 * @returns {string|null}  guest_profile_id or null on failure
 */
function saveGuestProfile(householdId, guestData, actorEmail) {
  if (!householdId || !guestData || !guestData.first_name || !guestData.last_name) return null;
  try {
    var ss      = SpreadsheetApp.openById(RESERVATIONS_ID);
    var sheet   = ss.getSheetByName(TAB_GUEST_PROFILES);
    var now     = new Date();

    if (!sheet) {
      Logger.log("WARN saveGuestProfile: Guest Profiles tab not found");
      return null;
    }

    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var hhCol   = headers.indexOf("household_id");
    var idCol   = headers.indexOf("id_number");

    // Check for existing profile matching household + id_number
    if (guestData.id_number) {
      for (var i = 1; i < data.length; i++) {
        if (data[i][hhCol] === householdId && data[i][idCol] === guestData.id_number) {
          // Update existing profile
          sheet.getRange(i + 1, headers.indexOf("first_name")    + 1).setValue(guestData.first_name);
          sheet.getRange(i + 1, headers.indexOf("last_name")     + 1).setValue(guestData.last_name);
          sheet.getRange(i + 1, headers.indexOf("age_group")     + 1).setValue(guestData.age_group || "");
          sheet.getRange(i + 1, headers.indexOf("last_used_date") + 1).setValue(now);
          var existingProfileId = data[i][headers.indexOf("guest_profile_id")];
          logAuditEntry(actorEmail, AUDIT_GUEST_PROFILE_SAVED, "GuestProfile",
                        existingProfileId,
                        "Updated profile for " + guestData.first_name + " " + guestData.last_name);
          return existingProfileId;
        }
      }
    }

    // Create new profile
    var profileId = generateId("GP");
    var row = {
      guest_profile_id: profileId,
      household_id:     householdId,
      first_name:       guestData.first_name,
      last_name:        guestData.last_name,
      id_number:        guestData.id_number || "",
      age_group:        guestData.age_group || "",
      created_date:     now,
      last_used_date:   now
    };
    sheet.appendRow(headers.map(function(col) {
      return row[col] !== undefined ? row[col] : "";
    }));

    logAuditEntry(actorEmail, AUDIT_GUEST_PROFILE_SAVED, "GuestProfile",
                  profileId, "Created profile for " + guestData.first_name + " " + guestData.last_name);

    return profileId;
  } catch (e) {
    Logger.log("ERROR saveGuestProfile: " + e);
    return null;
  }
}

/**
 * Returns all saved guest profiles for a household.
 *
 * @param {string} householdId
 * @returns {Array}
 */
function getGuestProfiles(householdId) {
  if (!householdId) return [];
  try {
    var sheet = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_GUEST_PROFILES);
    if (!sheet) return [];
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var hhCol   = headers.indexOf("household_id");
    var results = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][hhCol] === householdId) {
        results.push(rowToObject(headers, data[i]));
      }
    }
    results.sort(function(a, b) {
      return (a.last_name + a.first_name).localeCompare(b.last_name + b.first_name);
    });
    return results;
  } catch (e) {
    Logger.log("ERROR getGuestProfiles(" + householdId + "): " + e);
    return [];
  }
}

/**
 * Looks up guest history across all FINALIZED guest lists, matched by ID number.
 * Returns a map: { id_number: [{event_date, facility, household_name, rso_status, rso_reason, reviewed_date}] }
 *
 * @param {Array<string>} idNumbers
 * @returns {Object}
 */
function getGuestHistoryByIdNumbers(idNumbers) {
  if (!idNumbers || !idNumbers.length) return {};
  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_GUEST_LISTS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var statCol = headers.indexOf("submission_status");
    var history = {};

    for (var i = 1; i < data.length; i++) {
      if (data[i][statCol] !== GUEST_LIST_STATUS_FINALIZED) continue;
      var gl = rowToObject(headers, data[i]);
      var guests = [];
      try { guests = JSON.parse(gl.guests_json || "[]"); } catch(e) {}
      var decisions = [];
      try { decisions = JSON.parse(gl.rso_draft_json || "[]"); } catch(e) {}

      guests.forEach(function(g, idx) {
        if (idNumbers.indexOf(g.id_number) === -1) return;
        var decision = decisions[idx] || {};
        if (!history[g.id_number]) history[g.id_number] = [];
        history[g.id_number].push({
          event_date:    gl.event_date,
          facility:      gl.facility,
          household_name: gl.household_name,
          rso_status:    decision.rso_status  || "approved",
          rso_reason:    decision.rso_reason  || "",
          reviewed_date: gl.rso_review_date   || ""
        });
      });
    }
    return history;
  } catch (e) {
    Logger.log("ERROR getGuestHistoryByIdNumbers: " + e);
    return {};
  }
}


// ============================================================
// RSO REVIEW
// ============================================================

/**
 * RSO saves an in-progress review draft.
 * Does NOT finalize — RSO can resume where they left off.
 *
 * decisions: [{index: 0, rso_status: "approved"|"rejected", rso_reason: ""}]
 *
 * @param {string} guestListId
 * @param {Array}  decisions
 * @param {string} rsoEmail
 * @returns {boolean}
 */
function saveGuestListDraft(guestListId, decisions, rsoEmail) {
  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_GUEST_LISTS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol   = headers.indexOf("guest_list_id");
    var now     = new Date();

    for (var i = 1; i < data.length; i++) {
      if (data[i][idCol] !== guestListId) continue;

      var statCol = headers.indexOf("submission_status");
      var curStatus = data[i][statCol];
      if (curStatus === GUEST_LIST_STATUS_FINALIZED) {
        Logger.log("WARN saveGuestListDraft: already finalized: " + guestListId);
        return false;
      }

      sheet.getRange(i + 1, statCol + 1).setValue(GUEST_LIST_STATUS_IN_REVIEW);
      sheet.getRange(i + 1, headers.indexOf("rso_draft_json")    + 1).setValue(JSON.stringify(decisions));
      sheet.getRange(i + 1, headers.indexOf("rso_reviewed_by")   + 1).setValue(rsoEmail);
      sheet.getRange(i + 1, headers.indexOf("last_modified_date") + 1).setValue(now);

      logAuditEntry(rsoEmail, AUDIT_GUEST_LIST_DRAFT_SAVED, "GuestList",
                    guestListId, "Draft saved with " + decisions.length + " decision(s)");
      return true;
    }
    Logger.log("WARN saveGuestListDraft: not found: " + guestListId);
    return false;
  } catch (e) {
    Logger.log("ERROR saveGuestListDraft(" + guestListId + "): " + e);
    return false;
  }
}

/**
 * RSO finalizes guest list review.
 * All decisions must be set (approved or rejected) before finalizing.
 * - Status → "finalized"
 * - Approved guests → email summary to RSO
 * - If any rejected → email board with rejected names + reasons
 *
 * @param {string} guestListId
 * @param {Array}  decisions   Final [{index, rso_status, rso_reason}]
 * @param {string} rsoEmail
 * @returns {Object} {ok, approvedCount, rejectedCount, message}
 */
function finalizeGuestListReview(guestListId, decisions, rsoEmail) {
  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_GUEST_LISTS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var idCol   = headers.indexOf("guest_list_id");
    var now     = new Date();

    for (var i = 1; i < data.length; i++) {
      if (data[i][idCol] !== guestListId) continue;
      var gl = rowToObject(headers, data[i]);

      if (gl.submission_status === GUEST_LIST_STATUS_FINALIZED) {
        return { ok: false, message: "Guest list has already been finalized." };
      }

      var guests = [];
      try { guests = JSON.parse(gl.guests_json || "[]"); } catch (e) {}

      // Validate all guests have a decision
      if (decisions.length < guests.length) {
        return { ok: false, message: "A decision (approve/reject) must be set for every guest before finalizing." };
      }

      var approved = decisions.filter(function(d) { return d.rso_status === "approved"; });
      var rejected = decisions.filter(function(d) { return d.rso_status === "rejected"; });

      // Write final state
      var statCol = headers.indexOf("submission_status");
      sheet.getRange(i + 1, statCol + 1).setValue(GUEST_LIST_STATUS_FINALIZED);
      sheet.getRange(i + 1, headers.indexOf("rso_draft_json")    + 1).setValue(JSON.stringify(decisions));
      sheet.getRange(i + 1, headers.indexOf("rso_reviewed_by")   + 1).setValue(rsoEmail);
      sheet.getRange(i + 1, headers.indexOf("rso_review_date")   + 1).setValue(now);
      sheet.getRange(i + 1, headers.indexOf("last_modified_date") + 1).setValue(now);

      logAuditEntry(rsoEmail, AUDIT_GUEST_LIST_FINALIZED, "GuestList",
                    guestListId, "Finalized: " + approved.length + " approved, " + rejected.length + " rejected");

      // Send approved list to RSO
      _sendApprovedGuestListToRso(gl, guests, decisions, rsoEmail, now);

      // If any rejections, notify board
      if (rejected.length > 0) {
        _sendGuestListRejectionsToBoard(gl, guests, approved, rejected, rsoEmail, now);
      }

      return {
        ok: true,
        approvedCount: approved.length,
        rejectedCount: rejected.length,
        message: "Review finalized. " + approved.length + " approved, " + rejected.length + " rejected."
      };
    }
    Logger.log("WARN finalizeGuestListReview: not found: " + guestListId);
    return { ok: false, message: "Guest list not found." };
  } catch (e) {
    Logger.log("ERROR finalizeGuestListReview(" + guestListId + "): " + e);
    return { ok: false, message: "An error occurred while finalizing. Please try again." };
  }
}

/**
 * Sends the approved-only guest list summary to the RSO for event day.
 */
function _sendApprovedGuestListToRso(gl, guests, decisions, rsoEmail, reviewDate) {
  try {
    var approvedDecisions = decisions.filter(function(d) { return d.rso_status === "approved"; });
    var approvedGuests = approvedDecisions.map(function(d) {
      var g = guests[d.index] || {};
      return (g.first_name || "") + " " + (g.last_name || "") +
             (g.id_number ? " | " + g.id_number : "") +
             " | " + (g.age_group === "over_18" ? "Adult" : "Under 18");
    });

    var lines = approvedGuests.length
      ? approvedGuests.join("\n")
      : "(No guests approved)";

    sendEmailFromTemplate("RSO_GUEST_LIST_APPROVED_SUMMARY", rsoEmail, {
      RSO_FIRST_NAME:   rsoEmail,
      RESERVATION_ID:   gl.reservation_id,
      HOUSEHOLD_NAME:   gl.household_name,
      FACILITY_NAME:    gl.facility,
      EVENT_DATE:       formatDate(new Date(gl.event_date)),
      APPROVED_COUNT:   approvedDecisions.length,
      APPROVED_GUESTS:  lines,
      REVIEW_DATE:      formatDate(reviewDate)
    });
  } catch (e) {
    Logger.log("ERROR _sendApprovedGuestListToRso(" + gl.guest_list_id + "): " + e);
  }
}

/**
 * Notifies the board when one or more guests have been rejected.
 */
function _sendGuestListRejectionsToBoard(gl, guests, approvedDecisions, rejectedDecisions, rsoEmail, reviewDate) {
  try {
    var rejectedLines = rejectedDecisions.map(function(d) {
      var g = guests[d.index] || {};
      return (g.first_name || "") + " " + (g.last_name || "") +
             (g.id_number ? " (" + g.id_number + ")" : "") +
             ": " + (d.rso_reason || "No reason given");
    });

    sendEmailFromTemplate("RSO_GUEST_LIST_REJECTIONS_TO_BOARD", BOARD_EMAIL, {
      BOARD_FIRST_NAME:   "Board",
      RESERVATION_ID:     gl.reservation_id,
      HOUSEHOLD_NAME:     gl.household_name,
      FACILITY_NAME:      gl.facility,
      EVENT_DATE:         formatDate(new Date(gl.event_date)),
      APPROVED_COUNT:     approvedDecisions.length,
      REJECTED_COUNT:     rejectedDecisions.length,
      REJECTED_GUESTS:    rejectedLines.join("\n"),
      RSO_EMAIL:          rsoEmail,
      REVIEW_DATE:        formatDate(reviewDate)
    });
  } catch (e) {
    Logger.log("ERROR _sendGuestListRejectionsToBoard(" + gl.guest_list_id + "): " + e);
  }
}


// ============================================================
// RSO APPROVED GUEST LISTS (for RSO notify role)
// ============================================================

/**
 * Returns all finalized guest lists for a specific month and facility.
 * Used by the rso_notify interface to view approved lists.
 *
 * @param {number} month     1-12
 * @param {string} facility
 * @returns {Array}
 */
function getApprovedGuestListsForRsoNotify(month, facility) {
  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_GUEST_LISTS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var results = [];

    for (var i = 1; i < data.length; i++) {
      var obj = rowToObject(headers, data[i]);

      if (obj.submission_status !== GUEST_LIST_STATUS_FINALIZED) continue;
      if (facility && obj.facility !== facility) continue;

      var eventDate = new Date(obj.event_date);
      if (isNaN(eventDate.getTime())) continue;
      if (month && eventDate.getMonth() + 1 !== Number(month)) continue;

      var guests    = [];
      var decisions = [];
      try { guests    = JSON.parse(obj.guests_json    || "[]"); } catch(e) {}
      try { decisions = JSON.parse(obj.rso_draft_json || "[]"); } catch(e) {}

      var approvedGuests = decisions
        .filter(function(d) { return d.rso_status === "approved"; })
        .map(function(d) {
          var g = guests[d.index] || {};
          return {
            first_name: g.first_name || "",
            last_name:  g.last_name  || "",
            id_number:  g.id_number  || "",
            age_group:  g.age_group  || "",
            guest_list_id:   obj.guest_list_id,
            reservation_id:  obj.reservation_id
          };
        });

      results.push({
        guest_list_id:   obj.guest_list_id,
        reservation_id:  obj.reservation_id,
        household_name:  obj.household_name,
        facility:        obj.facility,
        event_date:      formatDate(eventDate),
        approved_guests: approvedGuests,
        approved_count:  approvedGuests.length,
        rso_reviewed_by: obj.rso_reviewed_by  || "",
        rso_review_date: obj.rso_review_date  ? formatDate(new Date(obj.rso_review_date)) : ""
      });
    }

    results.sort(function(a, b) { return new Date(a.event_date) - new Date(b.event_date); });
    return results;
  } catch (e) {
    Logger.log("ERROR getApprovedGuestListsForRsoNotify: " + e);
    return [];
  }
}


// ============================================================
// CALENDAR INTEGRATION
// ============================================================

/**
 * Creates a Google Calendar event for a new reservation.
 * Returns the calendar event ID, or null on failure.
 *
 * @param {Object} params       Reservation parameters
 * @param {string} reservationId
 * @param {string} status       Initial status
 * @returns {string|null}
 */
function _createCalendarEvent(params, reservationId, status) {
  try {
    var cal     = CalendarApp.getCalendarById(RESERVATIONS_CALENDAR_ID);
    if (!cal) return null;

    var title = params.facility + " - " + params.householdName + " (" + reservationId + ")";
    var start = new Date(params.reservationStart);
    var end   = new Date(params.reservationEnd);

    var description = [
      "Reservation ID: " + reservationId,
      "Household: " + params.householdName,
      "Facility: "  + params.facility,
      "Status: "    + status
    ].join("\n");

    var event = cal.createEvent(title, start, end, { description: description });
    return event.getId();
  } catch (e) {
    Logger.log("WARN _createCalendarEvent: " + e);
    return null;
  }
}

/**
 * Updates the calendar event title/description when a reservation status changes.
 */
function _updateCalendarEventStatus(calEventId, newStatus, res) {
  if (!calEventId) return;
  try {
    var cal   = CalendarApp.getCalendarById(RESERVATIONS_CALENDAR_ID);
    var event = cal.getEventById(calEventId);
    if (!event) return;
    var title = res.facility + " - " + res.household_name + " (" + res.reservation_id + ") [" + newStatus + "]";
    event.setTitle(title);
  } catch (e) {
    Logger.log("WARN _updateCalendarEventStatus: " + e);
  }
}

/**
 * Deletes the calendar event for a cancelled reservation.
 */
function _deleteCalendarEvent(calEventId) {
  if (!calEventId) return;
  try {
    var cal   = CalendarApp.getCalendarById(RESERVATIONS_CALENDAR_ID);
    var event = cal.getEventById(calEventId);
    if (event) event.deleteEvent();
  } catch (e) {
    Logger.log("WARN _deleteCalendarEvent: " + e);
  }
}


// ============================================================
// LOOKUP
// ============================================================

/**
 * Returns a single reservation by ID.
 *
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
function hasConflict(facility, reservationStart, reservationEnd) {
  try {
    var sheet = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var facCol  = headers.indexOf("facility");
    var stCol   = headers.indexOf("reservation_start");
    var etCol   = headers.indexOf("reservation_end");
    var statCol = headers.indexOf("status");

    var activeStatuses = [STATUS_PENDING, STATUS_APPROVED, STATUS_TENTATIVE, STATUS_CONFIRMED];
    var newStart = new Date(reservationStart).getTime();
    var newEnd   = new Date(reservationEnd).getTime();

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
  var result = _updateField(
    RESERVATIONS_ID, TAB_RESERVATIONS, "reservation_id",
    reservationId, fieldName, value, updatedBy,
    AUDIT_RESERVATION_CREATED, "Reservation"
  );
  return result;
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
    var dateCol = headers.indexOf("reservation_start");
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
    var dateCol = headers.indexOf("reservation_start");
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
  var dateStr  = formatDate(new Date(params.reservationStart));
  var startStr = formatTime(new Date(params.reservationStart));
  var endStr   = formatTime(new Date(params.reservationEnd));

  var baseVars = {
    FIRST_NAME:        _getPrimaryFirstName(params.householdId),
    FULL_NAME:         hh.household_name,
    MEMBER_EMAIL:      params.primaryEmail,
    MEMBER_PHONE:      hh.primary_phone || "",
    RESERVATION_ID:    row.reservation_id,
    FACILITY_NAME:     params.facility,
    RESERVATION_DATE:  dateStr,
    START_TIME:        startStr,
    END_TIME:          endStr,
    DURATION_HOURS:    params.durationHours,
    EVENT_NAME:        sanitizeInput(params.eventName),
    STATUS:            row.status,
    HAS_GUESTS:        params.hasGuests ? "Yes" : "No",
    GUEST_COUNT:       params.guestCount || 0,
    PORTAL_URL:        URL_MEMBER_PORTAL
  };

  // Confirm to member
  try {
    var memberTemplate = limitCheck.isExcess
      ? "RES_EXCESS_RESERVATION_TO_MEMBER"
      : "RES_CONFIRMED_TO_MEMBER";
    sendEmailFromTemplate(memberTemplate, params.primaryEmail, baseVars);
  } catch (e) { Logger.log("WARN _sendReservationNotifications member email: " + e); }

  // Notify board/mgt of new booking
  try {
    sendEmailFromTemplate("RES_NEW_BOOKING_TO_BOARD", BOARD_EMAIL, baseVars);
  } catch (e) { Logger.log("WARN _sendReservationNotifications board email: " + e); }

  // If excess, notify other households about bumping window
  if (limitCheck.isExcess) {
    try {
      _notifyOtherHouseholdsOfExcess(params, row);
    } catch (e) { Logger.log("WARN _sendReservationNotifications excess notify: " + e); }
  }
}

/**
 * Notifies all other active households about an excess reservation
 * (they can bump it within the window).
 */
function _notifyOtherHouseholdsOfExcess(params, row) {
  var households = getAllHouseholds();
  if (!households || !households.length) return;

  var dateStr   = formatDate(new Date(params.reservationStart));
  var startStr  = formatTime(new Date(params.reservationStart));
  var endStr    = formatTime(new Date(params.reservationEnd));
  var deadline  = row.bump_window_deadline ? formatDate(new Date(row.bump_window_deadline)) : "";

  households.forEach(function(hh) {
    if (hh.household_id === params.householdId) return;
    if (hh.membership_status !== "Member") return;
    try {
      sendEmailFromTemplate("RES_EXCESS_AVAILABLE_TO_OTHERS", hh.primary_email, {
        FIRST_NAME:       hh.primary_first_name || hh.household_name,
        FACILITY_NAME:    params.facility,
        RESERVATION_DATE: dateStr,
        START_TIME:       startStr,
        END_TIME:         endStr,
        BUMP_DEADLINE:    deadline,
        PORTAL_URL:       URL_MEMBER_PORTAL
      });
    } catch (e) { Logger.log("WARN _notifyOtherHouseholdsOfExcess (" + hh.household_id + "): " + e); }
  });
}

function _sendApprovalNotification(res, approvedBy) {
  try {
    sendEmailFromTemplate("RES_APPROVED_TO_MEMBER", res.submitted_by_email, {
      FIRST_NAME:       _getPrimaryFirstName(res.household_id),
      RESERVATION_ID:   res.reservation_id,
      FACILITY_NAME:    res.facility,
      RESERVATION_DATE: formatDate(new Date(res.reservation_start)),
      START_TIME:       formatTime(new Date(res.reservation_start)),
      END_TIME:         formatTime(new Date(res.reservation_end)),
      APPROVED_BY:      approvedBy,
      PORTAL_URL:       URL_MEMBER_PORTAL
    });
  } catch (e) { Logger.log("WARN _sendApprovalNotification: " + e); }
}

function _sendDenialNotification(res, deniedBy, reason) {
  try {
    sendEmailFromTemplate("RES_DENIED_TO_MEMBER", res.submitted_by_email, {
      FIRST_NAME:       _getPrimaryFirstName(res.household_id),
      RESERVATION_ID:   res.reservation_id,
      FACILITY_NAME:    res.facility,
      RESERVATION_DATE: formatDate(new Date(res.reservation_start)),
      DENIAL_REASON:    reason || "No reason provided",
      PORTAL_URL:       URL_MEMBER_PORTAL
    });
  } catch (e) { Logger.log("WARN _sendDenialNotification: " + e); }
}

function _sendCancellationNotification(res, cancelledBy, reason) {
  try {
    var template = cancelledBy === res.submitted_by_email
      ? "RES_CANCELLED_BY_MEMBER_TO_BOARD"
      : "RES_CANCELLED_BY_BOARD_TO_MEMBER";
    var recipient = cancelledBy === res.submitted_by_email ? BOARD_EMAIL : res.submitted_by_email;
    sendEmailFromTemplate(template, recipient, {
      FIRST_NAME:          _getPrimaryFirstName(res.household_id),
      RESERVATION_ID:      res.reservation_id,
      FACILITY_NAME:       res.facility,
      RESERVATION_DATE:    formatDate(new Date(res.reservation_start)),
      CANCELLATION_REASON: reason || "No reason provided",
      CANCELLED_BY:        cancelledBy,
      PORTAL_URL:          URL_MEMBER_PORTAL
    });
  } catch (e) { Logger.log("WARN _sendCancellationNotification: " + e); }
}

function _sendBumpNotification(bumpedRes, bumperRes) {
  try {
    sendEmailFromTemplate("RES_BUMPED_TO_MEMBER", bumpedRes.submitted_by_email, {
      FIRST_NAME:       _getPrimaryFirstName(bumpedRes.household_id),
      RESERVATION_ID:   bumpedRes.reservation_id,
      FACILITY_NAME:    bumpedRes.facility,
      RESERVATION_DATE: formatDate(new Date(bumpedRes.reservation_start)),
      BUMPER_HOUSEHOLD: bumperRes.household_name,
      PORTAL_URL:       URL_MEMBER_PORTAL
    });
  } catch (e) { Logger.log("WARN _sendBumpNotification: " + e); }
}


// ============================================================
// NIGHTLY TRIGGER FUNCTIONS (called from runNightlyTasks)
// ============================================================

/**
 * Runs nightly to cancel WAITLISTED reservations whose event date is within
 * WAITLIST_HOLD_HOURS and no slot has opened. Called from runNightlyTasks().
 */
function expireWaitlistPositions() {
  Logger.log("Waitlist expiry check starting...");
  var cutoff = new Date();
  cutoff.setTime(cutoff.getTime() + WAITLIST_HOLD_HOURS * 60 * 60 * 1000);

  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];

    for (var i = 1; i < data.length; i++) {
      var res = rowToObject(headers, data[i]);
      if (res.status !== STATUS_WAITLISTED) continue;
      if (!res.reservation_start) continue;

      var eventDate = new Date(res.reservation_start);
      if (eventDate > cutoff) continue;

      _updateReservationField(res.reservation_id, "status",               STATUS_CANCELLED, "system");
      _updateReservationField(res.reservation_id, "cancellation_reason",  "No slot became available before event date.", "system");
      _updateReservationField(res.reservation_id, "cancelled_by",         "system", "system");
      _updateReservationField(res.reservation_id, "cancellation_timestamp", new Date(), "system");

      logAuditEntry("system", AUDIT_RESERVATION_CANCELLED, "Reservation", res.reservation_id,
                    "Waitlist expired — no slot opened");

      if (res.calendar_event_id) {
        _updateCalendarEventStatus(res.calendar_event_id, STATUS_CANCELLED, res);
      }

      var primaryEmail = _getPrimaryEmail(res.household_id);
      if (primaryEmail) {
        sendEmailFromTemplate("RES_BOOKING_CANCELLED_TO_MEMBER", primaryEmail, {
          FIRST_NAME:          _getPrimaryFirstName(res.household_id),
          FACILITY_NAME:       res.facility,
          RESERVATION_ID:      res.reservation_id,
          ORIGINAL_DATE:       formatDate(eventDate),
          CANCELLATION_REASON: "No slot became available before the event date. Your waitlist position has expired."
        });
      }
      Logger.log("Waitlist expired: " + res.reservation_id);
    }
  } catch (e) { Logger.log("ERROR expireWaitlistPositions: " + e); }
}


/**
 * Runs nightly to promote TENTATIVE reservations to CONFIRMED once their bump
 * window deadline has passed. Called from runNightlyTasks().
 */
function processBumpWindowExpirations() {
  Logger.log("Bump window check starting...");
  var today = new Date(); today.setHours(0, 0, 0, 0);

  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
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
        logAuditEntry("system", AUDIT_RESERVATION_APPROVED, "Reservation", resId,
                      "Auto-confirmed: bump window passed");
        Logger.log("Auto-confirmed: " + resId);

        var res = rowToObject(headers, data[i]);
        if (res.calendar_event_id) {
          _updateCalendarEventStatus(res.calendar_event_id, STATUS_CONFIRMED, res);
        }
      }
    }
  } catch (e) { Logger.log("ERROR processBumpWindowExpirations: " + e); }
}


/**
 * Emails the board a daily digest of all reservations still awaiting approval
 * (STATUS_PENDING). Called from runNightlyTasks().
 */
function sendReservationApprovalReminders() {
  Logger.log("Approval reminder check starting...");
  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];

    var pending = [];
    for (var i = 1; i < data.length; i++) {
      var res = rowToObject(headers, data[i]);
      if (res.status === STATUS_PENDING) pending.push(res);
    }

    if (pending.length === 0) {
      Logger.log("No pending reservations — approval reminder skipped.");
      return;
    }

    pending.sort(function(a, b) {
      return new Date(a.reservation_start) - new Date(b.reservation_start);
    });

    var lines = pending.map(function(res) {
      var dateStr = res.reservation_start ? formatDate(new Date(res.reservation_start)) : "Unknown date";
      var excess  = res.is_excess_reservation ? " [EXCESS]" : "";
      return "• " + (res.facility || "?") + " — " + (res.household_name || res.household_id) +
             " — " + dateStr + excess;
    });

    sendEmailFromTemplate("RES_APPROVAL_REMINDER_TO_BOARD", EMAIL_BOARD, {
      PENDING_COUNT:    pending.length,
      PENDING_LIST:     lines.join("\n"),
      ADMIN_PORTAL_URL: URL_ADMIN_PORTAL
    });

    Logger.log("Approval reminder sent: " + pending.length + " pending reservation(s).");
  } catch (e) {
    Logger.log("ERROR sendReservationApprovalReminders: " + e);
  }
}
