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

/**
 * Creates one test reservation + one test guest list in Firestore for
 * HSH-2026-00020 / IND-2026-00027. Used to verify Phase 3 read/write
 * before live traffic is routed through Firestore.
 * Safe to re-run — deletes and recreates the test documents each time.
 */
function createTestReservationData() {
  var db            = getFirestore();
  var reservationId = 'RES-TEST-00001';
  var guestListId   = 'GL-TEST-00001';
  var householdId   = 'HSH-2026-00020';
  var now           = new Date();
  var eventDate     = new Date('2026-05-15');

  // Delete any existing test docs first
  try { db.deleteDocument('reservations/' + reservationId); } catch (e) {}
  try { db.deleteDocument('guest_lists/'  + guestListId);   } catch (e) {}

  // Test reservation
  db.createDocument('reservations/' + reservationId, {
    reservation_id:           reservationId,
    household_id:             householdId,
    household_name:           'Test Household',
    submitted_by_individual_id: 'IND-2026-00027',
    submitted_by_email:       'michael+jm@raneyworld.com',
    submission_timestamp:     now,
    facility:                 'Tennis Court',
    reservation_date:         eventDate,
    start_time:               '09:00',
    end_time:                 '11:00',
    duration_hours:           2,
    event_name:               'Test Tennis Session',
    status:                   'Confirmed',
    has_guests:               true,
    guest_count:              2,
    guest_list_deadline:      new Date('2026-05-11'),
    guest_list_submitted:     true,
    is_excess_reservation:    false,
    bump_window_deadline:     null,
    bumped_by_household_id:   null,
    bumped_date:              null,
    no_fundraising_confirmed: true,
    mgt_approved_by:          null,
    mgt_approved_date:        null,
    board_approval_required:  false,
    board_approved_by:        null,
    board_approval_timestamp: null,
    board_denial_reason:      null,
    calendar_event_id:        null,
    cancelled_by:             null,
    cancellation_timestamp:   null,
    cancellation_reason:      null,
    notes:                    'Test data for Phase 3 verification',
    created_at:               now,
    updated_at:               now
  });
  Logger.log('Created test reservation: ' + reservationId);

  // Test guest list
  var guests = [
    { first_name: 'Alice', last_name: 'Smith',   age_group: 'over_18',  id_number: 'P12345678' },
    { first_name: 'Bob',   last_name: 'Johnson', age_group: 'under_18', id_number: '' }
  ];

  db.createDocument('guest_lists/' + guestListId, {
    guest_list_id:      guestListId,
    reservation_id:     reservationId,
    household_id:       householdId,
    household_name:     'Test Household',
    primary_email:      'michael+jm@raneyworld.com',
    facility:           'Tennis Court',
    event_date:         eventDate,
    guests_json:        JSON.stringify(guests),
    guest_count:        guests.length,
    submitted_date:     now,
    submission_status:  'submitted',
    rso_reviewed_by:    null,
    rso_review_date:    null,
    rso_draft_json:     null,
    last_modified_date: now
  });
  Logger.log('Created test guest list: ' + guestListId);
  Logger.log('Test data ready — run testPhase3ReservationRead() to verify reads.');
}

/**
 * Verifies Firestore reads for Phase 3 test data.
 * Run after createTestReservationData().
 */
function testPhase3ReservationRead() {
  var res = firestoreGetReservationById('RES-TEST-00001');
  Logger.log('Reservation read: ' + (res ? 'OK — ' + res.facility + ' on ' + res.reservation_date : 'FAILED'));

  var gl = firestoreGetGuestListForReservation('RES-TEST-00001');
  Logger.log('Guest list read: ' + (gl ? 'OK — ' + gl.guest_count + ' guest(s)' : 'FAILED'));

  try {
    var hours = firestoreSumReservationHours('HSH-2026-00020', ['Tennis Court'],
      new Date('2026-05-01'), new Date('2026-06-01'), ['Confirmed', 'Approved', 'Tentative']);
    Logger.log('Sum hours: ' + hours + ' (expect 2)');
  } catch (e) {
    Logger.log('Sum hours FAILED: ' + e.message);
  }
}
