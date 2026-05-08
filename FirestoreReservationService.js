/**
 * FirestoreReservationService.js
 * Firestore implementations for reservations and guest lists.
 * Used in hybrid mode: ReservationService.js tries Firestore first, falls back to Sheets.
 *
 * Collections:
 *   reservations/{reservation_id}         — one document per reservation
 *   guest_lists/{guest_list_id}           — top-level (avoids collection group query complexity)
 *
 * Hybrid note: count/sum queries fetch by household_id and filter remaining
 * criteria in memory — per-household volumes are small (10-20 reservations/year).
 */

// ─── Reservations ─────────────────────────────────────────────────────────────

function firestoreCreateReservation(row) {
  var doc = {};
  for (var key in row) {
    if (!Object.prototype.hasOwnProperty.call(row, key)) continue;
    var val = row[key];
    doc[key] = (val instanceof Date) ? val : val;
  }
  getFirestore().createDocument('reservations/' + row.reservation_id, doc);
}

function firestoreGetReservationById(reservationId) {
  if (!reservationId) return null;
  try {
    var doc = getFirestore().getDocument('reservations/' + reservationId);
    return doc.obj || null;
  } catch (e) {
    return null;
  }
}

function firestoreUpdateReservationField(reservationId, fieldName, value) {
  var update = {};
  update[fieldName] = value;
  getFirestore().updateDocument('reservations/' + reservationId, update, true);
}

/**
 * Returns all active reservations for a household + facility combination.
 * Filters by date range and statuses in memory (per-household volume is small).
 * Throws on Firestore error so caller can fall back to Sheets.
 */
function firestoreGetReservationsForLimitCheck(householdId, facilities, fromDate, toDate, statuses) {
  var facilityArray = Array.isArray(facilities) ? facilities : [facilities];

  var results = getFirestore()
    .query('reservations')
    .Where('household_id', '==', householdId)
    .Execute();

  return results
    .map(function(doc) { return doc.obj; })
    .filter(function(r) {
      if (!r) return false;
      if (facilityArray.indexOf(r.facility) === -1) return false;
      if (statuses.indexOf(r.status) === -1) return false;
      var d = new Date(r.reservation_date);
      return d >= fromDate && d < toDate;
    });
}

function firestoreSumReservationHours(householdId, facilities, fromDate, toDate, statuses) {
  var rows = firestoreGetReservationsForLimitCheck(householdId, facilities, fromDate, toDate, statuses);
  return rows.reduce(function(total, r) { return total + (Number(r.duration_hours) || 0); }, 0);
}

function firestoreCountReservations(householdId, facilities, fromDate, toDate, statuses) {
  return firestoreGetReservationsForLimitCheck(householdId, facilities, fromDate, toDate, statuses).length;
}

function firestoreGetReservationsByStatus(status) {
  try {
    var results = getFirestore().query('reservations').Where('status', '==', status).Execute();
    return results.map(function(doc) { return doc.obj; }).filter(Boolean);
  } catch (e) {
    Logger.log('ERROR firestoreGetReservationsByStatus: ' + e.message);
    return [];
  }
}

function firestoreHasConflict(facility, reservationDate, startTime, endTime) {
  try {
    var activeStatuses = ['Pending', 'Approved', 'Tentative', 'Confirmed'];
    var results = getFirestore()
      .query('reservations')
      .Where('facility', '==', facility)
      .Where('reservation_date', '==', reservationDate)
      .Execute();

    return results.some(function(doc) {
      var r = doc.obj;
      if (!r || activeStatuses.indexOf(r.status) === -1) return false;
      // Overlap: existing start < new end AND existing end > new start
      return r.start_time < endTime && r.end_time > startTime;
    });
  } catch (e) {
    throw e; // Let caller fall back to Sheets
  }
}

// ─── Guest Lists ──────────────────────────────────────────────────────────────

function firestoreSubmitGuestList(row) {
  var doc = {
    guest_list_id:      row.guest_list_id,
    reservation_id:     row.reservation_id,
    household_id:       row.household_id,
    household_name:     row.household_name,
    primary_email:      row.primary_email,
    facility:           row.facility,
    event_date:         row.event_date ? new Date(row.event_date) : null,
    guests_json:        row.guests_json,
    guest_count:        row.guest_count,
    submitted_date:     row.submitted_date,
    submission_status:  row.submission_status,
    rso_reviewed_by:    row.rso_reviewed_by   || null,
    rso_review_date:    row.rso_review_date   || null,
    rso_draft_json:     row.rso_draft_json    || null,
    last_modified_date: row.last_modified_date
  };
  getFirestore().createDocument('guest_lists/' + row.guest_list_id, doc);
}

function firestoreGetGuestListForReservation(reservationId) {
  if (!reservationId) return null;
  try {
    var results = getFirestore()
      .query('guest_lists')
      .Where('reservation_id', '==', reservationId)
      .Execute();

    if (!results.length) return null;

    return results
      .map(function(doc) { return doc.obj; })
      .filter(Boolean)
      .reduce(function(latest, r) {
        if (!latest) return r;
        return new Date(r.submitted_date) > new Date(latest.submitted_date) ? r : latest;
      }, null);
  } catch (e) {
    return null;
  }
}

function firestoreGetGuestListsByStatus(status) {
  var results = getFirestore()
    .query('guest_lists')
    .Where('submission_status', '==', status)
    .Execute();

  return results
    .map(function(doc) { return doc.obj; })
    .filter(Boolean)
    .sort(function(a, b) { return new Date(a.event_date) - new Date(b.event_date); });
}

function firestoreUpdateGuestList(guestListId, fields) {
  getFirestore().updateDocument('guest_lists/' + guestListId, fields, true);
}

// ─── Migration ────────────────────────────────────────────────────────────────

/**
 * One-time migration: copy all reservations from the Reservations sheet
 * into Firestore. Safe to re-run — skips IDs already present.
 */
function migrateReservationsToFirestore() {
  var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_RESERVATIONS);
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var db      = getFirestore();

  var created = 0, skipped = 0, errors = 0;

  for (var i = 1; i < data.length; i++) {
    var row = {};
    headers.forEach(function(col, idx) { row[col] = data[i][idx]; });

    var id = (row.reservation_id || '').toString().trim();
    if (!id) continue;

    try {
      var existing = db.getDocument('reservations/' + id);
      if (existing.obj) { skipped++; continue; }
    } catch (e) { /* not found — proceed */ }

    try {
      var doc = {};
      headers.forEach(function(col) {
        var val = row[col];
        doc[col] = (val instanceof Date) ? val : val;
      });
      db.createDocument('reservations/' + id, doc);
      created++;
    } catch (e) {
      Logger.log('ERROR reservations/' + id + ': ' + e.message);
      errors++;
    }
  }

  Logger.log('Reservations migration — created: ' + created + ', skipped: ' + skipped + ', errors: ' + errors);
}

/**
 * One-time migration: copy all guest lists from the Guest Lists sheet
 * into Firestore. Safe to re-run — skips IDs already present.
 */
function migrateGuestListsToFirestore() {
  var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_GUEST_LISTS);
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var db      = getFirestore();

  var created = 0, skipped = 0, errors = 0;

  for (var i = 1; i < data.length; i++) {
    var row = {};
    headers.forEach(function(col, idx) { row[col] = data[i][idx]; });

    var id = (row.guest_list_id || '').toString().trim();
    if (!id) continue;

    try {
      var existing = db.getDocument('guest_lists/' + id);
      if (existing.obj) { skipped++; continue; }
    } catch (e) { /* not found — proceed */ }

    try {
      var doc = {};
      headers.forEach(function(col) {
        var val = row[col];
        doc[col] = (val instanceof Date) ? val : val;
      });
      db.createDocument('guest_lists/' + id, doc);
      created++;
    } catch (e) {
      Logger.log('ERROR guest_lists/' + id + ': ' + e.message);
      errors++;
    }
  }

  Logger.log('Guest lists migration — created: ' + created + ', skipped: ' + skipped + ', errors: ' + errors);
}
