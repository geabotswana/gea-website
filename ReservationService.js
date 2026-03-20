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
  var monthEnd   = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  return _sumReservationHours(householdId,
    [FACILITY_LEOBO], monthStart, monthEnd,
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

  // Leobo
  if (facility === FACILITY_LEOBO) {
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
    submitted_by_email:       params.primaryEmail,
    facility:                 params.facility,
    reservation_date:         params.eventDate,
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
    mgt_approved_by:          "",
    mgt_approved_date:        "",
    submission_timestamp:     now
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
  createCalendarEvent(row, hh);

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
// CALENDAR INTEGRATION
// ============================================================

/**
 * Creates a Google Calendar event for a reservation.
 * Event title format: "[FACILITY] — [HOUSEHOLD] [STATUS_TAG]"
 * Status tags: [PENDING], [TENTATIVE], [CONFIRMED]
 * Stores the resulting event ID back into the Reservations sheet.
 *
 * @param {Object} reservation  The full reservation row object (from createReservation)
 * @param {Object} hh           The household object (for household_name)
 * @returns {string|null}       Google Calendar event ID, or null on failure
 */
function createCalendarEvent(reservation, hh) {
  try {
    var statusTag = reservation.status === STATUS_CONFIRMED ? "[CONFIRMED]"
                  : reservation.status === STATUS_TENTATIVE ? "[TENTATIVE]"
                  : "[PENDING]";
    var title = reservation.facility + " \u2014 " + (hh ? hh.household_name : reservation.household_id) + " " + statusTag;

    var description =
      "Reservation ID: " + reservation.reservation_id + "\n" +
      "Household: "      + (hh ? hh.household_name : reservation.household_id) + "\n" +
      "Contact: "        + reservation.submitted_by_email + "\n" +
      "Status: "         + reservation.status + "\n" +
      (reservation.event_name ? "Event: " + reservation.event_name + "\n" : "") +
      (reservation.has_guests ? "Guests: " + (reservation.guest_count || 0) + "\n" : "") +
      (reservation.is_excess_reservation ? "** EXCESS BOOKING — subject to board approval **\n" : "");

    var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) {
      Logger.log("ERROR createCalendarEvent: calendar not found for ID " + CALENDAR_ID);
      return null;
    }

    var event = calendar.createEvent(
      title,
      new Date(reservation.start_time),
      new Date(reservation.end_time),
      { description: description }
    );

    // Colour-code by status: red=pending, yellow=tentative, green=confirmed
    if (reservation.status === STATUS_CONFIRMED) {
      event.setColor(CalendarApp.EventColor.SAGE);
    } else if (reservation.status === STATUS_TENTATIVE) {
      event.setColor(CalendarApp.EventColor.BANANA);
    } else {
      event.setColor(CalendarApp.EventColor.TOMATO);
    }

    var eventId = event.getId();

    // Write event ID back to the sheet
    _updateReservationField(reservation.reservation_id, "calendar_event_id", eventId, "system");

    Logger.log("Calendar event created: " + eventId + " for " + reservation.reservation_id);
    return eventId;

  } catch (e) {
    Logger.log("ERROR createCalendarEvent(" + reservation.reservation_id + "): " + e);
    return null;
  }
}

/**
 * Updates the title and colour of an existing calendar event to reflect
 * a new reservation status. Called after approval, denial, or cancellation.
 *
 * @param {string} eventId    Google Calendar event ID (from calendar_event_id field)
 * @param {string} newStatus  One of the STATUS_* constants
 * @param {string} householdName
 * @param {string} facility
 * @returns {boolean}
 */
function updateCalendarEventStatus(eventId, newStatus, householdName, facility) {
  if (!eventId) return false;
  try {
    var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) return false;

    var event = calendar.getEventById(eventId);
    if (!event) {
      Logger.log("WARN updateCalendarEventStatus: event not found: " + eventId);
      return false;
    }

    var statusTag = newStatus === STATUS_CONFIRMED ? "[CONFIRMED]"
                  : newStatus === STATUS_TENTATIVE ? "[TENTATIVE]"
                  : newStatus === STATUS_CANCELLED ? "[CANCELLED]"
                  : "[PENDING]";

    event.setTitle(facility + " \u2014 " + householdName + " " + statusTag);

    if (newStatus === STATUS_CONFIRMED || newStatus === STATUS_APPROVED) {
      event.setColor(CalendarApp.EventColor.SAGE);
    } else if (newStatus === STATUS_TENTATIVE) {
      event.setColor(CalendarApp.EventColor.BANANA);
    } else if (newStatus === STATUS_CANCELLED) {
      event.setColor(CalendarApp.EventColor.GRAPHITE);
    } else {
      event.setColor(CalendarApp.EventColor.TOMATO);
    }

    return true;
  } catch (e) {
    Logger.log("ERROR updateCalendarEventStatus(" + eventId + "): " + e);
    return false;
  }
}


// ============================================================
// APPROVAL / DENIAL
// ============================================================

/**
 * Approves a reservation. Implements a two-stage workflow for Leobo:
 *   Stage 1 (MGT): records mgt_approved_by/date, keeps STATUS_PENDING, notifies board.
 *   Stage 2 (Board): full approval → CONFIRMED or TENTATIVE, notifies member.
 * Tennis and other facilities skip Stage 1 and go directly to Stage 2.
 *
 * @param {string} reservationId
 * @param {string} approvedBy      Email of the approving user
 * @param {string} notes           Optional notes
 * @param {string} approverRole    Role of the approving user ("mgt" or "board")
 * @returns {boolean}
 */
function approveReservation(reservationId, approvedBy, notes, approverRole) {
  var res = getReservationById(reservationId);
  if (!res) return false;

  var isMgtFacility = (res.facility === FACILITY_LEOBO);

  // ── Stage 1: MGT approves a Leobo reservation for the first time ────
  if (isMgtFacility && !res.mgt_approved_by && approverRole === "mgt") {
    _updateReservationField(reservationId, "mgt_approved_by",   approvedBy,   approvedBy);
    _updateReservationField(reservationId, "mgt_approved_date", new Date(),   approvedBy);
    if (notes) _updateReservationField(reservationId, "notes", notes, approvedBy);

    logAuditEntry(approvedBy, AUDIT_RESERVATION_APPROVED, "Reservation", reservationId,
                  "MGT approved (Stage 1) — awaiting board final approval");

    // Notify board that MGT has signed off and board's final approval is needed
    var hh = getHouseholdById(res.household_id);
    sendEmailFromTemplate("RES_LEOBO_MGT_APPROVED_TO_BOARD", EMAIL_BOARD, {
      MEMBER_NAME:      hh ? hh.household_name : res.household_id,
      MEMBER_EMAIL:     res.submitted_by_email,
      MEMBER_PHONE:     hh ? (hh.primary_phone || "") : "",
      FACILITY:         res.facility,
      RESERVATION_DATE: formatDate(new Date(res.reservation_date)),
      START_TIME:       formatTime(new Date(res.start_time)),
      END_TIME:         formatTime(new Date(res.end_time)),
      EVENT_NAME:       res.event_name || "",
      GUEST_COUNT:      res.guest_count || 0,
      RESERVATION_ID:   reservationId,
      MGT_APPROVED_BY:  approvedBy,
      APPROVE_LINK:     URL_ADMIN_PORTAL + "?action=approve&id=" + reservationId,
      DENY_LINK:        URL_ADMIN_PORTAL + "?action=deny&id="    + reservationId
    });
    return true;
  }

  // ── Stage 2: Board final approval (or Tennis/other bypassing Stage 1) ─────
  var newStatus = res.is_excess_reservation ? STATUS_TENTATIVE : STATUS_CONFIRMED;
  _updateReservationField(reservationId, "status",                newStatus,  approvedBy);
  _updateReservationField(reservationId, "board_approved_by",     approvedBy, approvedBy);
  _updateReservationField(reservationId, "board_approval_timestamp", new Date(), approvedBy);
  if (notes) _updateReservationField(reservationId, "notes", notes, approvedBy);

  logAuditEntry(approvedBy, AUDIT_RESERVATION_APPROVED, "Reservation", reservationId,
                "Approved → " + newStatus);

  // Update calendar event colour/title
  var hh = getHouseholdById(res.household_id);
  if (res.calendar_event_id) {
    updateCalendarEventStatus(res.calendar_event_id, newStatus,
                              hh ? hh.household_name : res.household_id, res.facility);
  }

  // Notify member
  if (hh) {
    var primaryEmail = _getPrimaryEmail(hh.household_id);
    if (primaryEmail) {
      sendEmailFromTemplate("RES_BOOKING_APPROVED_TO_MEMBER", primaryEmail, {
        FIRST_NAME:       _getPrimaryFirstName(hh.household_id),
        RESERVATION_ID:   reservationId,
        FACILITY_NAME:    res.facility,
        RESERVATION_DATE: formatDate(new Date(res.reservation_date)),
        RESERVATION_TIME: formatTime(new Date(res.start_time)) + " – " + formatTime(new Date(res.end_time)),
        GUEST_LIMIT:      res.guest_count || "",
        PORTAL_URL:       URL_MEMBER_PORTAL
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

  _updateReservationField(reservationId, "status",              STATUS_CANCELLED, deniedBy);
  _updateReservationField(reservationId, "board_denial_reason", reason || "",     deniedBy);

  logAuditEntry(deniedBy, AUDIT_RESERVATION_DENIED, "Reservation", reservationId,
                "Denied: " + reason);

  // Update calendar event
  if (res.calendar_event_id) {
    var hhForDeny = getHouseholdById(res.household_id);
    updateCalendarEventStatus(res.calendar_event_id, STATUS_CANCELLED,
                              hhForDeny ? hhForDeny.household_name : res.household_id, res.facility);
  }

  var hh = getHouseholdById(res.household_id);
  if (hh) {
    var primaryEmail = _getPrimaryEmail(hh.household_id);
    if (primaryEmail) {
      sendEmailFromTemplate("RES_BOOKING_DENIED_TO_MEMBER", primaryEmail, {
        FIRST_NAME:       _getPrimaryFirstName(hh.household_id),
        FACILITY_NAME:    res.facility,
        RESERVATION_ID:   reservationId,
        REQUESTED_DATE:   formatDate(new Date(res.reservation_date)),
        DENIAL_REASON:    reason || "No reason provided",
        CONTACT_EMAIL:    EMAIL_BOARD
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
  _updateReservationField(reservationId, "cancellation_reason",    reason || "",     cancelledBy);
  _updateReservationField(reservationId, "cancelled_by",           cancelledBy,      cancelledBy);
  _updateReservationField(reservationId, "cancellation_timestamp", new Date(),       cancelledBy);

  logAuditEntry(cancelledBy, AUDIT_RESERVATION_CANCELLED, "Reservation", reservationId,
                "Cancelled: " + (reason || "no reason given"));

  // Update calendar event
  if (res.calendar_event_id) {
    var hhForCancel = getHouseholdById(res.household_id);
    updateCalendarEventStatus(res.calendar_event_id, STATUS_CANCELLED,
                              hhForCancel ? hhForCancel.household_name : res.household_id, res.facility);
  }

  var hh = getHouseholdById(res.household_id);
  if (hh) {
    var primaryEmail = _getPrimaryEmail(hh.household_id);
    if (primaryEmail) {
      sendEmailFromTemplate("RES_BOOKING_CANCELLED_TO_MEMBER", primaryEmail, {
        FIRST_NAME:          _getPrimaryFirstName(hh.household_id),
        FACILITY_NAME:       res.facility,
        RESERVATION_ID:      res.reservation_id,
        ORIGINAL_DATE:       formatDate(new Date(res.reservation_date)),
        CANCELLATION_REASON: reason || ""
      });
    }
  }

  // If a confirmed/tentative slot just opened, promote the earliest waitlisted reservation
  if (res.status === STATUS_CONFIRMED || res.status === STATUS_TENTATIVE) {
    promoteFromWaitlist(res.facility, new Date(res.reservation_date));
  }

  return true;
}


// ============================================================
// WAITLIST
// ============================================================

/**
 * Board action: places a STATUS_PENDING reservation onto the waitlist
 * instead of approving or denying it outright.
 *
 * @param {string} reservationId
 * @param {string} placedBy       Board member email
 * @param {string} notes          Optional notes
 * @returns {boolean}
 */
function addToWaitlist(reservationId, placedBy, notes) {
  var res = getReservationById(reservationId);
  if (!res) return false;
  if (res.status !== STATUS_PENDING) {
    Logger.log("addToWaitlist: reservation " + reservationId + " is not PENDING");
    return false;
  }

  // Calculate waitlist position (1-based: how many waitlisted ahead of this one)
  var position = _countWaitlistedForFacility(res.facility, new Date(res.reservation_date)) + 1;

  _updateReservationField(reservationId, "status",                  STATUS_WAITLISTED, placedBy);
  _updateReservationField(reservationId, "board_approved_by",       placedBy,          placedBy);
  _updateReservationField(reservationId, "board_approval_timestamp", new Date(),        placedBy);
  if (notes) _updateReservationField(reservationId, "notes", notes, placedBy);

  logAuditEntry(placedBy, AUDIT_RESERVATION_APPROVED, "Reservation", reservationId,
                "Waitlisted (position " + position + ")");

  var hh = getHouseholdById(res.household_id);
  if (hh) {
    var primaryEmail = _getPrimaryEmail(hh.household_id);
    if (primaryEmail) {
      sendEmailFromTemplate("RES_BOOKING_WAITLISTED_TO_MEMBER", primaryEmail, {
        FIRST_NAME:        _getPrimaryFirstName(hh.household_id),
        FACILITY_NAME:     res.facility,
        RESERVATION_ID:    reservationId,
        RESERVATION_DATE:  formatDate(new Date(res.reservation_date)),
        RESERVATION_TIME:  formatTime(new Date(res.start_time)) + " \u2013 " + formatTime(new Date(res.end_time)),
        WAITLIST_POSITION: position,
        PORTAL_URL:        URL_MEMBER_PORTAL
      });
    }
  }
  return true;
}

/**
 * Board action: manually promotes a STATUS_WAITLISTED reservation
 * to confirmed (or tentative if it's an excess booking).
 *
 * @param {string} reservationId
 * @param {string} approvedBy
 * @param {string} notes
 * @returns {boolean}
 */
function approveBump(reservationId, approvedBy, notes) {
  var res = getReservationById(reservationId);
  if (!res) return false;
  if (res.status !== STATUS_WAITLISTED) {
    Logger.log("approveBump: reservation " + reservationId + " is not WAITLISTED");
    return false;
  }

  var newStatus = res.is_excess_reservation ? STATUS_TENTATIVE : STATUS_CONFIRMED;
  _updateReservationField(reservationId, "status",                   newStatus,  approvedBy);
  _updateReservationField(reservationId, "board_approved_by",        approvedBy, approvedBy);
  _updateReservationField(reservationId, "board_approval_timestamp", new Date(), approvedBy);
  if (notes) _updateReservationField(reservationId, "notes", notes, approvedBy);

  logAuditEntry(approvedBy, AUDIT_RESERVATION_APPROVED, "Reservation", reservationId,
                "Bump approved → " + newStatus);

  var hh = getHouseholdById(res.household_id);
  if (res.calendar_event_id) {
    updateCalendarEventStatus(res.calendar_event_id, newStatus,
                              hh ? hh.household_name : res.household_id, res.facility);
  }

  if (hh) {
    var primaryEmail = _getPrimaryEmail(hh.household_id);
    if (primaryEmail) {
      sendEmailFromTemplate("RES_BOOKING_APPROVED_TO_MEMBER", primaryEmail, {
        FIRST_NAME:       _getPrimaryFirstName(hh.household_id),
        RESERVATION_ID:   reservationId,
        FACILITY_NAME:    res.facility,
        RESERVATION_DATE: formatDate(new Date(res.reservation_date)),
        RESERVATION_TIME: formatTime(new Date(res.start_time)) + " \u2013 " + formatTime(new Date(res.end_time)),
        GUEST_LIMIT:      res.guest_count || "",
        PORTAL_URL:       URL_MEMBER_PORTAL
      });
    }
  }
  return true;
}

/**
 * Automatically promotes the earliest waitlisted reservation for a facility
 * when a confirmed or tentative reservation at that facility is cancelled.
 * For Tennis: checks same week. For Leobo/Whole: checks same month.
 *
 * @param {string} facility
 * @param {Date}   reservationDate   Date of the cancelled reservation
 * @returns {string|null}            Promoted reservation_id, or null if none found
 */
function promoteFromWaitlist(facility, reservationDate) {
  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];

    var isTennis = (facility === FACILITY_TENNIS);
    var rangeStart, rangeEnd;
    if (isTennis) {
      rangeStart = getWeekStart(reservationDate);
      rangeEnd   = addDays(rangeStart, 7);
    } else {
      rangeStart = getMonthStart(reservationDate);
      rangeEnd   = new Date(rangeStart);
      rangeEnd.setMonth(rangeEnd.getMonth() + 1);
    }

    var candidates = [];
    for (var i = 1; i < data.length; i++) {
      var r = rowToObject(headers, data[i]);
      if (r.status !== STATUS_WAITLISTED) continue;
      if (r.facility !== facility) continue;
      var d = new Date(r.reservation_date);
      if (d < rangeStart || d >= rangeEnd) continue;
      candidates.push(r);
    }

    if (candidates.length === 0) return null;

    // Promote the earliest-submitted waitlisted reservation
    candidates.sort(function(a, b) {
      return new Date(a.submission_timestamp) - new Date(b.submission_timestamp);
    });
    var winner = candidates[0];
    var newStatus = winner.is_excess_reservation ? STATUS_TENTATIVE : STATUS_CONFIRMED;

    _updateReservationField(winner.reservation_id, "status",                   newStatus, "system");
    _updateReservationField(winner.reservation_id, "board_approved_by",        "system",  "system");
    _updateReservationField(winner.reservation_id, "board_approval_timestamp", new Date(), "system");

    logAuditEntry("system", AUDIT_RESERVATION_APPROVED, "Reservation", winner.reservation_id,
                  "Auto-promoted from waitlist → " + newStatus);

    var hh = getHouseholdById(winner.household_id);
    if (winner.calendar_event_id) {
      updateCalendarEventStatus(winner.calendar_event_id, newStatus,
                                hh ? hh.household_name : winner.household_id, winner.facility);
    }

    var primaryEmail = _getPrimaryEmail(winner.household_id);
    if (primaryEmail) {
      sendEmailFromTemplate("RES_WAITLIST_SLOT_OPENED_TO_MEMBER", primaryEmail, {
        FIRST_NAME:         _getPrimaryFirstName(winner.household_id),
        FACILITY:           winner.facility,
        RESERVATION_DATE:   formatDate(new Date(winner.reservation_date)),
        START_TIME:         formatTime(new Date(winner.start_time)),
        END_TIME:           formatTime(new Date(winner.end_time)),
        WAITLIST_HOLD_HOURS: WAITLIST_HOLD_HOURS,
        PORTAL_URL:         URL_MEMBER_PORTAL
      });
    }

    Logger.log("Promoted from waitlist: " + winner.reservation_id + " → " + newStatus);
    return winner.reservation_id;

  } catch (e) {
    Logger.log("ERROR promoteFromWaitlist: " + e);
    return null;
  }
}

/**
 * Nightly task: auto-cancel waitlisted reservations that are within
 * WAITLIST_HOLD_HOURS hours of their event with no slot having opened.
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
      if (!res.reservation_date) continue;

      var eventDate = new Date(res.reservation_date);
      if (eventDate > cutoff) continue; // Still enough time ahead

      // Cancel — no slot opened in time
      _updateReservationField(res.reservation_id, "status",               STATUS_CANCELLED, "system");
      _updateReservationField(res.reservation_id, "cancellation_reason",  "No slot became available before event date.", "system");
      _updateReservationField(res.reservation_id, "cancelled_by",         "system", "system");
      _updateReservationField(res.reservation_id, "cancellation_timestamp", new Date(), "system");

      logAuditEntry("system", AUDIT_RESERVATION_CANCELLED, "Reservation", res.reservation_id,
                    "Waitlist expired — no slot opened");

      if (res.calendar_event_id) {
        updateCalendarEventStatus(res.calendar_event_id, STATUS_CANCELLED,
                                  res.household_name || res.household_id, res.facility);
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
 * Counts ALL STATUS_WAITLISTED reservations for a given facility
 * in the same week (Tennis) or month (Leobo/Whole) as the given date.
 * Used to calculate a new entrant's waitlist position.
 */
function _countWaitlistedForFacility(facility, reservationDate) {
  var isTennis = (facility === FACILITY_TENNIS);
  var rangeStart, rangeEnd;
  if (isTennis) {
    rangeStart = getWeekStart(reservationDate);
    rangeEnd   = addDays(rangeStart, 7);
  } else {
    rangeStart = getMonthStart(reservationDate);
    rangeEnd   = new Date(rangeStart);
    rangeEnd.setMonth(rangeEnd.getMonth() + 1);
  }
  var count = 0;
  try {
    var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var facCol  = headers.indexOf("facility");
    var dateCol = headers.indexOf("reservation_date");
    var statCol = headers.indexOf("status");
    for (var i = 1; i < data.length; i++) {
      if (data[i][statCol] !== STATUS_WAITLISTED) continue;
      if (data[i][facCol]  !== facility)           continue;
      var d = new Date(data[i][dateCol]);
      if (d >= rangeStart && d < rangeEnd) count++;
    }
  } catch (e) { Logger.log("ERROR _countWaitlistedForFacility: " + e); }
  return count;
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
        logAuditEntry("system", AUDIT_RESERVATION_APPROVED, "Reservation", resId,
                      "Auto-confirmed: bump window passed");
        Logger.log("Auto-confirmed: " + resId);

        // Update calendar event to CONFIRMED
        var res = rowToObject(headers, data[i]);
        if (res.calendar_event_id) {
          updateCalendarEventStatus(res.calendar_event_id, STATUS_CONFIRMED,
                                    res.household_name || res.household_id, res.facility);
        }
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
      if (!(Number(res.guest_count) > 0) || res.guest_list_submitted) continue;
      if (res.status === STATUS_CANCELLED) continue;
      if (!res.guest_list_deadline) continue;

      var deadline = new Date(res.guest_list_deadline);
      deadline.setHours(0, 0, 0, 0);
      if (deadline.getTime() !== tomorrow.getTime()) continue;

      // Deadline is tomorrow — send reminder
      var primaryEmail = res.submitted_by_email;
      if (!primaryEmail) continue;

      var hh = getHouseholdById(res.household_id);
      sendEmailFromTemplate("RES_GUEST_LIST_DEADLINE_REMINDER_TO_MEMBER", primaryEmail, {
        FIRST_NAME:       _getPrimaryFirstName(res.household_id),
        RESERVATION_ID:   res.reservation_id,
        FACILITY_NAME:    res.facility,
        RESERVATION_DATE: formatDate(new Date(res.reservation_date)),
        DEADLINE:         formatDate(deadline),
        PORTAL_URL:       URL_MEMBER_PORTAL
      });
      Logger.log("Guest list reminder sent: " + primaryEmail + " for " + res.reservation_id);
    }
  } catch (e) { Logger.log("ERROR sendGuestListReminders: " + e); }
}


// ============================================================
// APPROVAL REMINDERS
// ============================================================

/**
 * FUNCTION: sendReservationApprovalReminders
 * PURPOSE: Email the board a daily digest of all reservations still awaiting
 *          approval (STATUS_PENDING). Called from runNightlyTasks().
 *
 * Sends template RES_APPROVAL_REMINDER_TO_BOARD with:
 *   PENDING_COUNT  — number of pending reservations
 *   PENDING_LIST   — plain-text block, one reservation per line
 *   ADMIN_PORTAL_URL — link to admin portal
 *
 * @returns {void}
 */
function sendReservationApprovalReminders() {
  Logger.log("Approval reminder check starting...");
  try {
    var sheet = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];

    var pending = [];
    for (var i = 1; i < data.length; i++) {
      var res = rowToObject(headers, data[i]);
      if (res.status === STATUS_PENDING) {
        pending.push(res);
      }
    }

    if (pending.length === 0) {
      Logger.log("No pending reservations — approval reminder skipped.");
      return;
    }

    // Sort by reservation_date ascending so board sees soonest-due items first
    pending.sort(function(a, b) {
      return new Date(a.reservation_date) - new Date(b.reservation_date);
    });

    var lines = pending.map(function(res) {
      var dateStr = res.reservation_date ? formatDate(new Date(res.reservation_date)) : "Unknown date";
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
      if (!res.reservation_date) continue;
      if (formatDate(new Date(res.reservation_date), true) !== todayStr) continue;
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
      block += "Contact: " + r.submitted_by_email + "\n";
      block += "Membership: " + (hh ? hh.membership_type + " - " + hh.household_type : "") + "\n";
      block += "Household Attending: " +
               members.filter(function(m) {
                 return m.relationship_to_primary !== RELATIONSHIP_STAFF;
               }).map(function(m) {
                 return m.first_name + " " + m.last_name +
                        (m.date_of_birth ? " (age " + calculateAge(m.date_of_birth) + ")" : "");
               }).join(", ") + "\n";

      if (Number(r.guest_count) > 0) {
        block += "Guests: " + r.guest_count + " guests\n";
        totalGuests += Number(r.guest_count);
      } else {
        block += "Guests: None\n";
      }
      block += "\n";
      totalMembers += members.filter(function(m) {
        return m.relationship_to_primary !== RELATIONSHIP_STAFF;
      }).length;
    }

    var noRes = todayReservations.length === 0
      ? "No reservations are scheduled for today.\n\n"
      : "";
    sendEmailFromTemplate("ADM_DAILY_SUMMARY_TO_RSO", EMAIL_RSO, {
      TODAY_DATE:          formatDate(new Date()),
      IF_NO_RESERVATIONS:  noRes,
      RESERVATIONS_BLOCK:  block,
      TOTAL_RESERVATIONS:  todayReservations.length,
      TOTAL_MEMBERS:       totalMembers,
      TOTAL_GUESTS:        totalGuests
    });

    Logger.log("RSO summary sent: " + todayReservations.length + " reservation(s)");
  } catch (e) { Logger.log("ERROR sendRsoDailySummary: " + e); }
}


// ============================================================
// GUEST LIST WORKFLOW
// ============================================================

/**
 * Submits a guest list for a reservation.
 * Writes a row to the Guest Lists sheet and marks the reservation
 * as having a submitted guest list.
 *
 * Required columns in Guest Lists sheet (add if missing):
 *   guest_list_id, reservation_id, household_id, household_name,
 *   primary_email, facility, event_date, guests_json, guest_count,
 *   submitted_date, submission_status, rso_reviewed_by,
 *   rso_review_date, rejection_reason
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

  var late = !isGuestListDeadlineMet(new Date(res.reservation_date));

  var guestListId = generateId("GL");
  var now         = new Date();

  // Handle save_to_profile requests
  var profilesToSave = guests.filter(function(g) { return g.save_to_profile; });
  profilesToSave.forEach(function(g) {
    saveGuestProfile(res.household_id, g, memberEmail);
  });

  var row = {
    guest_list_id:    guestListId,
    reservation_id:   reservationId,
    household_id:     res.household_id,
    household_name:   res.household_name,
    primary_email:    memberEmail,
    facility:         res.facility,
    event_date:       res.reservation_date,
    guests_json:      JSON.stringify(guests),
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
    RESERVATION_DATE: formatDate(new Date(res.reservation_date)),
    GUEST_COUNT:      guests.length,
    DEADLINE:         formatDate(getGuestListDeadline(new Date(res.reservation_date))),
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
 * Saves or updates a guest profile for the household.
 * If a profile with the same id_number already exists for this household,
 * updates it (name, age_group, last_used_date). Otherwise creates a new one.
 *
 * @param {string} householdId
 * @param {Object} guestData  {first_name, last_name, id_number, age_group}
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
          logAuditEntry(actorEmail, AUDIT_GUEST_PROFILE_SAVED, "GuestProfile",
                        data[i][headers.indexOf("guest_profile_id")],
                        "Updated profile for " + guestData.first_name + " " + guestData.last_name);
          return data[i][headers.indexOf("guest_profile_id")];
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
    var result  = {};

    idNumbers.forEach(function(id) { result[id] = []; });

    for (var i = 1; i < data.length; i++) {
      if (data[i][statCol] !== GUEST_LIST_STATUS_FINALIZED) continue;
      var gl = rowToObject(headers, data[i]);
      var draftDecisions = [];
      try { draftDecisions = JSON.parse(gl.rso_draft_json || "[]"); } catch (e) {}
      var guests = [];
      try { guests = JSON.parse(gl.guests_json || "[]"); } catch (e) {}

      guests.forEach(function(g, idx) {
        if (!g.id_number || !result.hasOwnProperty(g.id_number)) return;
        var decision = draftDecisions.filter(function(d) { return d.index === idx; })[0] || {};
        result[g.id_number].push({
          event_date:     gl.event_date,
          facility:       gl.facility,
          household_name: gl.household_name,
          rso_status:     decision.rso_status || "unknown",
          rso_reason:     decision.rso_reason || "",
          reviewed_date:  gl.rso_review_date
        });
      });
    }

    // Sort each list by event_date descending
    idNumbers.forEach(function(id) {
      result[id].sort(function(a, b) { return new Date(b.event_date) - new Date(a.event_date); });
    });

    return result;
  } catch (e) {
    Logger.log("ERROR getGuestHistoryByIdNumbers: " + e);
    return {};
  }
}

// ============================================================
// RSO REVIEW — DRAFT & FINALIZE
// ============================================================

/**
 * RSO saves draft per-guest decisions without finalizing.
 * Sets status to "in_review" (idempotent), writes rso_draft_json.
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
      ? approvedGuests.map(function(line, idx) { return (idx + 1) + ". " + line; }).join("\n")
      : "(No approved guests)";

    var body =
      "FINAL APPROVED GUEST LIST\n" +
      "==========================\n\n" +
      "Reservation:     " + gl.reservation_id + "\n" +
      "Facility:        " + gl.facility + "\n" +
      "Event Date:      " + formatDate(new Date(gl.event_date)) + "\n" +
      "Household:       " + gl.household_name + "\n" +
      "Contact:         " + gl.primary_email + "\n" +
      "Approved Guests: " + approvedGuests.length + "\n\n" +
      "GUEST DETAILS\n" +
      "-------------\n" +
      lines + "\n\n" +
      "Approved guests must present a valid photo ID at the gate.\n" +
      "Review completed: " + formatDate(reviewDate);

    MailApp.sendEmail({
      to:      rsoEmail,
      subject: "Approved Guest List — " + gl.facility + " on " +
               formatDate(new Date(gl.event_date)) + " [" + gl.reservation_id + "]",
      body:    body
    });
  } catch (e) {
    Logger.log("ERROR _sendApprovedGuestListToRso(" + gl.guest_list_id + "): " + e);
  }
}

/**
 * Sends a board notification with the flagged (rejected) guests and RSO reasons.
 * The board decides how to relay this to the member.
 */
function _sendGuestListRejectionsToBoard(gl, guests, approvedDecisions, rejectedDecisions, rsoEmail, reviewDate) {
  try {
    var boardEmail = EMAIL_BOARD;

    var approvedLines = approvedDecisions.map(function(d) {
      var g = guests[d.index] || {};
      return "  - " + (g.first_name || "") + " " + (g.last_name || "") +
             (g.id_number ? " (" + g.id_number + ")" : "");
    }).join("\n") || "  (none)";

    var rejectedLines = rejectedDecisions.map(function(d) {
      var g = guests[d.index] || {};
      return "  - " + (g.first_name || "") + " " + (g.last_name || "") +
             (g.id_number ? " (" + g.id_number + ")" : "") +
             "\n    Reason: " + (d.rso_reason || "No reason provided");
    }).join("\n");

    sendEmailFromTemplate("RES_GUEST_LIST_REJECTIONS_TO_BOARD", boardEmail, {
      RESERVATION_ID:   gl.reservation_id,
      FACILITY_NAME:    gl.facility,
      RESERVATION_DATE: formatDate(new Date(gl.event_date)),
      HOUSEHOLD_NAME:   gl.household_name,
      MEMBER_EMAIL:     gl.primary_email,
      APPROVED_COUNT:   approvedDecisions.length,
      APPROVED_LIST:    approvedLines,
      REJECTED_COUNT:   rejectedDecisions.length,
      REJECTED_LIST:    rejectedLines,
      REVIEW_DATE:      formatDate(reviewDate)
    });
  } catch (e) {
    Logger.log("ERROR _sendGuestListRejectionsToBoard(" + gl.guest_list_id + "): " + e);
  }
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
    var dateCol = headers.indexOf("reservation_date");
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
    var dateCol = headers.indexOf("reservation_date");
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
    sendEmailFromTemplate("RES_BOOKING_RECEIVED_TO_MEMBER", params.primaryEmail, {
      FIRST_NAME:       baseVars.FIRST_NAME,
      RESERVATION_ID:   baseVars.RESERVATION_ID,
      FACILITY_NAME:    baseVars.FACILITY,
      RESERVATION_DATE: baseVars.RESERVATION_DATE,
      RESERVATION_TIME: baseVars.START_TIME + " – " + baseVars.END_TIME,
      PORTAL_URL:       URL_MEMBER_PORTAL
    });

  } else {
    // Pending — send acknowledgment to member
    var reviewDeadline = addDays(new Date(), 3);
    sendEmailFromTemplate("RES_BOOKING_PENDING_REVIEW_TO_MEMBER", params.primaryEmail, {
      FIRST_NAME:       baseVars.FIRST_NAME,
      FACILITY_NAME:    baseVars.FACILITY,
      RESERVATION_ID:   baseVars.RESERVATION_ID,
      RESERVATION_DATE: baseVars.RESERVATION_DATE,
      REVIEW_DEADLINE:  formatDate(reviewDeadline),
      PORTAL_URL:       URL_MEMBER_PORTAL
    });

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

    // Board/MGT approval request — map baseVars names to template placeholders
    var approvalVars = Object.assign({}, limitVars, {
      MEMBER_NAME:          limitVars.FULL_NAME,
      EXISTING_BOOKINGS_LIST: "",
      GUEST_LIST_LINK:      "",
      OTHER_EVENTS_LIST:    "(check Admin Portal for other events)",
      DURATION_HOURS:       "",
      LEOBO_BUMP_WINDOW_DAYS: getConfigValue("LEOBO_BUMP_WINDOW_DAYS") || ""
    });

    if (limitCheck.isExcess && params.facility === FACILITY_TENNIS) {
      sendEmailFromTemplate("RES_EXCESS_TENNIS_APPROVAL_REQUEST_TO_BOARD", EMAIL_BOARD, approvalVars);
    } else if (params.facility === FACILITY_LEOBO) {
      if (limitCheck.isExcess) {
        sendEmailFromTemplate("RES_EXCESS_LEOBO_APPROVAL_REQUEST_TO_MGT", EMAIL_MGT, approvalVars);
      } else {
        sendEmailFromTemplate("RES_LEOBO_APPROVAL_REQUEST_TO_MGT", EMAIL_MGT, approvalVars);
      }
    } else {
      sendEmailFromTemplate("RES_BOOKING_APPROVAL_REQUEST_TO_BOARD", EMAIL_BOARD, approvalVars);
    }

    // Send limit-reached notice to member if excess
    if (limitCheck.isExcess) {
      var excessNotice = "Your booking has been submitted as an excess request and will be reviewed by the board.";
      if (params.facility === FACILITY_TENNIS) {
        sendEmailFromTemplate("RES_TENNIS_LIMIT_REACHED_TO_MEMBER", params.primaryEmail, {
          FIRST_NAME:           baseVars.FIRST_NAME,
          CURRENT_RESERVATIONS: limitCheck.hoursUsed,
          LIMIT:                TENNIS_WEEKLY_LIMIT_HOURS,
          WAITLIST_INFO:        excessNotice
        });
      } else {
        sendEmailFromTemplate("RES_LEOBO_LIMIT_REACHED_TO_MEMBER", params.primaryEmail, {
          FIRST_NAME:           baseVars.FIRST_NAME,
          CURRENT_RESERVATIONS: limitCheck.countUsed,
          LIMIT:                LEOBO_MONTHLY_LIMIT,
          WAITLIST_INFO:        excessNotice
        });
      }
    }
  }
}


// ============================================================
// SUP.4 — EMAIL RESEND
// ============================================================

/**
 * SUP.4 — Re-sends the member-facing booking confirmation or waitlist email
 * for an existing reservation.  Only valid for bookings in an active status
 * (Approved / Confirmed / Tentative / Waitlisted).
 *
 * @param {string} reservationId
 * @param {string} senderEmail   Board member triggering the resend (for audit)
 * @returns {Object} { ok, error?, code? }
 */
function resendReservationEmail(reservationId, senderEmail) {
  try {
    var res = getReservationById(reservationId);
    if (!res) return { ok: false, error: "Reservation not found", code: "NOT_FOUND" };

    var sendable = [STATUS_APPROVED, STATUS_CONFIRMED, STATUS_TENTATIVE, STATUS_WAITLISTED];
    if (sendable.indexOf(res.status) === -1) {
      return { ok: false,
               error: "Email resend not applicable for status: " + res.status,
               code: "INVALID_STATUS" };
    }

    var hh = getHouseholdById(res.household_id);
    if (!hh) return { ok: false, error: "Household not found", code: "NOT_FOUND" };

    var primaryEmail = _getPrimaryEmail(hh.household_id);
    if (!primaryEmail) return { ok: false, error: "No email on file for household", code: "NOT_FOUND" };

    var firstName = _getPrimaryFirstName(hh.household_id);
    var dateStr   = res.reservation_date ? formatDate(new Date(res.reservation_date)) : "";
    var timeStr   = (res.start_time && res.end_time)
                  ? formatTime(new Date(res.start_time)) + " \u2013 " + formatTime(new Date(res.end_time))
                  : "";

    if (res.status === STATUS_WAITLISTED) {
      var pos = _countWaitlistedForFacility(res.facility, new Date(res.reservation_date));
      sendEmailFromTemplate("RES_BOOKING_WAITLISTED_TO_MEMBER", primaryEmail, {
        FIRST_NAME:        firstName,
        FACILITY_NAME:     res.facility,
        RESERVATION_DATE:  dateStr,
        RESERVATION_TIME:  timeStr,
        RESERVATION_ID:    reservationId,
        WAITLIST_POSITION: pos,
        PORTAL_URL:        URL_MEMBER_PORTAL
      });
    } else {
      sendEmailFromTemplate("RES_BOOKING_APPROVED_TO_MEMBER", primaryEmail, {
        FIRST_NAME:       firstName,
        RESERVATION_ID:   reservationId,
        FACILITY_NAME:    res.facility,
        RESERVATION_DATE: dateStr,
        RESERVATION_TIME: timeStr,
        GUEST_LIMIT:      res.guest_count || "",
        PORTAL_URL:       URL_MEMBER_PORTAL
      });
    }

    logAuditEntry(senderEmail, "RESERVATION_EMAIL_RESENT", "Reservation", reservationId,
                  "Confirmation email re-sent (status: " + res.status + ")");
    return { ok: true };

  } catch (e) {
    Logger.log("ERROR resendReservationEmail: " + e);
    return { ok: false, error: String(e), code: "SERVER_ERROR" };
  }
}