/**
 * FirestoreReservationService.js
 * Firestore implementations for reservations, guest lists, and guest profiles.
 * Used in hybrid mode: ReservationService.js tries Firestore first, falls back to Sheets.
 *
 * Collections:
 *   reservations/{reservation_id}   — one document per reservation
 *   guest_lists/{reservation_id}    — one document per reservation (upsert model)
 *   guest_profiles/{profile_id}     — one document per saved guest per household
 *
 * Guest list document schema:
 *   guests_json        — member's original submission (guest objects, no RSO fields)
 *   rso_draft_json     — RSO working copy: guest objects with rso_status/rso_note inline
 *   guests_final_json  — approved guests only, stripped of RSO fields (for guard use)
 *   final_guest_count  — count of approved guests
 *   submission_status  — "submitted" | "in_review" | "finalized"
 *
 * Guest profile document schema:
 *   times_invited, times_declined, rejection_history[]
 *   No times_approved — display is "Invited N times, X rejections"
 *
 * Hybrid note: limit-check queries fetch by household_id and filter in memory —
 * per-household volumes are small (10–20 reservations/year).
 */

// ─── Reservations ─────────────────────────────────────────────────────────────

function firestoreCreateReservation(row) {
  var doc = {};
  for (var key in row) {
    if (!Object.prototype.hasOwnProperty.call(row, key)) continue;
    doc[key] = row[key];
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
      var d = new Date(r.reservation_start);
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

function firestoreHasConflict(facility, reservationStart, reservationEnd) {
  try {
    var activeStatuses = ['Pending', 'Approved', 'Tentative', 'Confirmed'];
    var newStart = new Date(reservationStart).getTime();
    var newEnd   = new Date(reservationEnd).getTime();

    var results = getFirestore()
      .query('reservations')
      .Where('facility', '==', facility)
      .Execute();

    return results.some(function(doc) {
      var r = doc.obj;
      if (!r || activeStatuses.indexOf(r.status) === -1) return false;
      var exStart = new Date(r.reservation_start).getTime();
      var exEnd   = new Date(r.reservation_end).getTime();
      return newStart < exEnd && newEnd > exStart;
    });
  } catch (e) {
    throw e;
  }
}

// ─── Guest Lists ──────────────────────────────────────────────────────────────
//
// Document path: guest_lists/{reservation_id}  (upsert — one doc per reservation)

/**
 * Creates or updates a guest list document for a reservation.
 * Uses reservation_id as the Firestore document key (upsert model).
 */
function firestoreSubmitGuestList(row) {
  var db = getFirestore();

  // Strip the transient save_to_profile flag from guest objects before storing
  var guests = [];
  try { guests = JSON.parse(row.guests_json || '[]'); } catch (e) {}
  var cleanGuests = guests.map(function(g) {
    var out = {};
    for (var k in g) {
      if (!Object.prototype.hasOwnProperty.call(g, k)) continue;
      if (k === 'save_to_profile') continue;
      out[k] = g[k];
    }
    return out;
  });

  var doc = {
    guest_list_id:      row.guest_list_id,
    reservation_id:     row.reservation_id,
    household_id:       row.household_id,
    household_name:     row.household_name,
    primary_email:      row.primary_email,
    facility:           row.facility,
    reservation_start:  row.reservation_start ? new Date(row.reservation_start) : null,
    reservation_end:    row.reservation_end   ? new Date(row.reservation_end)   : null,
    guests_json:        JSON.stringify(cleanGuests),
    guest_count:        row.guest_count,
    submitted_date:     row.submitted_date,
    submission_status:  row.submission_status,
    rso_reviewed_by:    row.rso_reviewed_by    || null,
    rso_review_date:    row.rso_review_date    || null,
    rso_draft_json:     row.rso_draft_json     || null,
    guests_final_json:  row.guests_final_json  || null,
    final_guest_count:  row.final_guest_count  || null,
    last_modified_date: row.last_modified_date
  };

  var path = 'guest_lists/' + row.reservation_id;
  try {
    db.createDocument(path, doc);
  } catch (e) {
    // Document already exists — update in place
    db.updateDocument(path, doc, true);
  }
}

/**
 * Returns the guest list document for a reservation, or null.
 * Direct lookup — one document per reservation.
 */
function firestoreGetGuestListForReservation(reservationId) {
  if (!reservationId) return null;
  try {
    var doc = getFirestore().getDocument('guest_lists/' + reservationId);
    return doc.obj || null;
  } catch (e) {
    return null;
  }
}

/**
 * Returns all guest lists with a given submission_status, sorted by event_date.
 */
function firestoreGetGuestListsByStatus(status) {
  var results = getFirestore()
    .query('guest_lists')
    .Where('submission_status', '==', status)
    .Execute();

  return results
    .map(function(doc) { return doc.obj; })
    .filter(Boolean)
    .sort(function(a, b) { return new Date(a.reservation_start) - new Date(b.reservation_start); });
}

/**
 * Partial-update a guest list document.
 * @param {string} reservationId
 * @param {Object} fields
 */
function firestoreUpdateGuestList(reservationId, fields) {
  getFirestore().updateDocument('guest_lists/' + reservationId, fields, true);
}

/**
 * Saves RSO's in-progress review as a working copy without finalizing.
 * Converts decisions array [{index, rso_status, rso_reason}] to inline guest-object format.
 *
 * @param {string} reservationId
 * @param {Array}  decisions    [{index: 0, rso_status: "approved"|"rejected", rso_reason: ""}]
 * @param {string} rsoEmail
 * @param {string} guestsJson   Original guests_json from the guest list document
 */
function firestoreSaveGuestListDraft(reservationId, decisions, rsoEmail, guestsJson) {
  var guests = [];
  try { guests = JSON.parse(guestsJson || '[]'); } catch (e) {}

  var workingCopy = guests.map(function(g, idx) {
    var d = _findDecision(decisions, idx);
    return {
      guest_profile_id: g.guest_profile_id || null,
      first_name:       g.first_name,
      last_name:        g.last_name,
      age_group:        g.age_group,
      id_number:        g.id_number,
      rso_status:       d ? d.rso_status           : null,
      rso_note:         d ? (d.rso_reason || null)  : null
    };
  });

  getFirestore().updateDocument('guest_lists/' + reservationId, {
    rso_draft_json:     JSON.stringify(workingCopy),
    submission_status:  GUEST_LIST_STATUS_IN_REVIEW,
    rso_reviewed_by:    rsoEmail,
    last_modified_date: new Date()
  }, true);
}

/**
 * Finalizes RSO review.
 * - Any guest with no decision (null rso_status) is auto-approved.
 * - Builds guests_final_json (approved guests only, clean — for guard use).
 * - Updates guest profiles (times_invited, times_declined, rejection_history).
 *
 * @param {string} reservationId
 * @param {Array}  decisions    [{index, rso_status, rso_reason}]
 * @param {string} rsoEmail
 * @param {Object} gl           Full guest list object (needs facility, event_date, reservation_id)
 * @returns {number} Count of approved guests
 */
function firestoreFinalizeGuestListReview(reservationId, decisions, rsoEmail, gl) {
  var guests = [];
  try { guests = JSON.parse(gl.guests_json || '[]'); } catch (e) {}

  // Merge decisions into guest objects; auto-approve any without a decision
  var workingCopy = guests.map(function(g, idx) {
    var d      = _findDecision(decisions, idx);
    var status = (d && d.rso_status) ? d.rso_status : 'approved';
    return {
      guest_profile_id: g.guest_profile_id || null,
      first_name:       g.first_name,
      last_name:        g.last_name,
      age_group:        g.age_group,
      id_number:        g.id_number,
      rso_status:       status,
      rso_note:         d ? (d.rso_reason || null) : null
    };
  });

  // Approved-only list for guard use (no RSO fields)
  var finalGuests = workingCopy
    .filter(function(g) { return g.rso_status === 'approved'; })
    .map(function(g) {
      return {
        guest_profile_id: g.guest_profile_id,
        first_name:       g.first_name,
        last_name:        g.last_name,
        age_group:        g.age_group,
        id_number:        g.id_number
      };
    });

  var now = new Date();
  getFirestore().updateDocument('guest_lists/' + reservationId, {
    rso_draft_json:     JSON.stringify(workingCopy),
    guests_final_json:  JSON.stringify(finalGuests),
    final_guest_count:  finalGuests.length,
    submission_status:  GUEST_LIST_STATUS_FINALIZED,
    rso_reviewed_by:    rsoEmail,
    rso_review_date:    now,
    last_modified_date: now
  }, true);

  // Update guest profiles
  workingCopy.forEach(function(g) {
    if (!g.guest_profile_id) return;
    _firestoreUpdateProfileAfterReview(g.guest_profile_id, g.rso_status, g.rso_note, gl);
  });

  return finalGuests.length;
}

/** Finds a decision object by guest index. */
function _findDecision(decisions, idx) {
  for (var i = 0; i < decisions.length; i++) {
    if (decisions[i].index === idx) return decisions[i];
  }
  return null;
}

// ─── Guest Profiles ───────────────────────────────────────────────────────────
//
// Document path: guest_profiles/{profile_id}
//
// Schema:
//   guest_profile_id, household_id, first_name, last_name, age_group, id_number
//   times_invited    — incremented each time they appear on a finalized list
//   times_declined   — incremented each time RSO rejects them
//   last_invited_date
//   rejection_history: [{date, facility, reservation_id, reason}]
//   created_at, last_modified_date

function firestoreGetGuestProfile(profileId) {
  if (!profileId) return null;
  try {
    var doc = getFirestore().getDocument('guest_profiles/' + profileId);
    return doc.obj || null;
  } catch (e) {
    return null;
  }
}

function firestoreGetHouseholdGuestProfiles(householdId) {
  if (!householdId) return [];
  try {
    var results = getFirestore()
      .query('guest_profiles')
      .Where('household_id', '==', householdId)
      .Execute();
    return results
      .map(function(doc) { return doc.obj; })
      .filter(Boolean)
      .sort(function(a, b) {
        return (a.last_name + a.first_name).localeCompare(b.last_name + b.first_name);
      });
  } catch (e) {
    Logger.log('ERROR firestoreGetHouseholdGuestProfiles: ' + e.message);
    return [];
  }
}

/**
 * Creates or updates a guest profile.
 * Matches on household_id + id_number (when present) or creates new.
 * Returns the profile_id.
 *
 * @param {string} householdId
 * @param {Object} guestData   {first_name, last_name, age_group, id_number, guest_profile_id?}
 * @returns {string|null} profile_id
 */
function firestoreSaveGuestProfile(householdId, guestData) {
  if (!householdId || !guestData || !guestData.first_name || !guestData.last_name) return null;

  var db  = getFirestore();
  var now = new Date();

  // If caller already knows the profile_id, update in place
  if (guestData.guest_profile_id) {
    try {
      var existing = db.getDocument('guest_profiles/' + guestData.guest_profile_id);
      if (existing.obj) {
        db.updateDocument('guest_profiles/' + guestData.guest_profile_id, {
          first_name:         guestData.first_name,
          last_name:          guestData.last_name,
          age_group:          guestData.age_group || existing.obj.age_group,
          id_number:          guestData.id_number || existing.obj.id_number,
          last_modified_date: now
        }, true);
        return guestData.guest_profile_id;
      }
    } catch (e) { /* not found — fall through to create */ }
  }

  // Search for existing profile by household + id_number
  if (guestData.id_number) {
    try {
      var results = db.query('guest_profiles')
        .Where('household_id', '==', householdId)
        .Where('id_number',    '==', guestData.id_number)
        .Execute();
      if (results.length) {
        var found = results[0].obj;
        db.updateDocument('guest_profiles/' + found.guest_profile_id, {
          first_name:         guestData.first_name,
          last_name:          guestData.last_name,
          age_group:          guestData.age_group || found.age_group,
          last_modified_date: now
        }, true);
        return found.guest_profile_id;
      }
    } catch (e) {
      Logger.log('WARN firestoreSaveGuestProfile lookup: ' + e.message);
    }
  }

  // Create new profile
  var profileId = guestData.guest_profile_id || generateId('GP');
  db.createDocument('guest_profiles/' + profileId, {
    guest_profile_id:   profileId,
    household_id:       householdId,
    first_name:         guestData.first_name,
    last_name:          guestData.last_name,
    age_group:          guestData.age_group  || '',
    id_number:          guestData.id_number  || '',
    times_invited:      0,
    times_declined:     0,
    last_invited_date:  null,
    rejection_history:  [],
    created_at:         now,
    last_modified_date: now
  });
  return profileId;
}

/**
 * Updates a guest profile after RSO finalizes a review.
 * Always increments times_invited. On rejection, increments times_declined
 * and appends an entry to rejection_history.
 *
 * @param {string} profileId
 * @param {string} rsoStatus   'approved' | 'rejected'
 * @param {string} rsoNote     Rejection reason (may be null)
 * @param {Object} gl          Guest list object (needs facility, event_date, reservation_id)
 */
function _firestoreUpdateProfileAfterReview(profileId, rsoStatus, rsoNote, gl) {
  var db = getFirestore();
  try {
    var doc = db.getDocument('guest_profiles/' + profileId);
    if (!doc.obj) return;

    var profile = doc.obj;
    var updates = {
      times_invited:      (profile.times_invited  || 0) + 1,
      last_invited_date:  gl.reservation_start ? new Date(gl.reservation_start) : null,
      last_modified_date: new Date()
    };

    if (rsoStatus === 'rejected') {
      updates.times_declined = (profile.times_declined || 0) + 1;
      var history = profile.rejection_history || [];
      history.push({
        date:           new Date(),
        facility:       gl.facility       || '',
        reservation_id: gl.reservation_id || '',
        reason:         rsoNote           || ''
      });
      updates.rejection_history = history;
    }

    db.updateDocument('guest_profiles/' + profileId, updates, true);
  } catch (e) {
    Logger.log('WARN _firestoreUpdateProfileAfterReview (' + profileId + '): ' + e.message);
  }
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
      headers.forEach(function(col) { doc[col] = row[col]; });
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
 * One-time migration: copy guest lists from the Guest Lists sheet into Firestore.
 * Uses reservation_id as the document key (upsert model — keeps the latest submission
 * per reservation when multiple rows exist in Sheets).
 * Safe to re-run.
 */
function migrateGuestListsToFirestore() {
  var sheet   = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_GUEST_LISTS);
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var db      = getFirestore();

  var created = 0, updated = 0, errors = 0;

  for (var i = 1; i < data.length; i++) {
    var row = {};
    headers.forEach(function(col, idx) { row[col] = data[i][idx]; });

    var reservationId = (row.reservation_id || '').toString().trim();
    if (!reservationId) continue;

    var doc = {
      guest_list_id:      row.guest_list_id      || '',
      reservation_id:     reservationId,
      household_id:       row.household_id        || '',
      household_name:     row.household_name      || '',
      primary_email:      row.primary_email       || '',
      facility:           row.facility            || '',
      reservation_start:  row.reservation_start   ? new Date(row.reservation_start) : null,
      reservation_end:    row.reservation_end     ? new Date(row.reservation_end)   : null,
      guests_json:        row.guests_json         || '[]',
      guest_count:        Number(row.guest_count) || 0,
      submitted_date:     row.submitted_date      ? new Date(row.submitted_date) : null,
      submission_status:  row.submission_status   || '',
      rso_reviewed_by:    row.rso_reviewed_by     || null,
      rso_review_date:    row.rso_review_date     ? new Date(row.rso_review_date) : null,
      rso_draft_json:     row.rso_draft_json      || null,
      guests_final_json:  null,
      final_guest_count:  null,
      last_modified_date: row.last_modified_date  ? new Date(row.last_modified_date) : null
    };

    var path = 'guest_lists/' + reservationId;
    try {
      try {
        db.createDocument(path, doc);
        created++;
      } catch (e) {
        db.updateDocument(path, doc, true);
        updated++;
      }
    } catch (e) {
      Logger.log('ERROR guest_lists/' + reservationId + ': ' + e.message);
      errors++;
    }
  }

  Logger.log('Guest lists migration — created: ' + created + ', updated: ' + updated + ', errors: ' + errors);
}

// ─── Test Data ────────────────────────────────────────────────────────────────

/**
 * Creates one test reservation + one test guest list in Firestore for
 * HSH-2026-00020 / IND-2026-00027. Safe to re-run — deletes and recreates
 * the test documents each time.
 *
 * After running: call testPhase3ReservationRead() to verify reads.
 */
function createTestReservationData() {
  var db            = getFirestore();
  var reservationId = 'RES-TEST-00001';
  var householdId   = 'HSH-2026-00020';
  var now           = new Date();
  var resStart      = new Date('2026-05-15T09:00:00+02:00');
  var resEnd        = new Date('2026-05-15T11:00:00+02:00');

  // Delete existing test docs
  try { db.deleteDocument('reservations/' + reservationId); } catch (e) {}
  try { db.deleteDocument('guest_lists/'  + reservationId); } catch (e) {}

  // Test reservation
  db.createDocument('reservations/' + reservationId, {
    reservation_id:             reservationId,
    household_id:               householdId,
    submitted_by_individual_id: 'IND-2026-00027',
    submitted_by_email:         'michael+jm@raneyworld.com',
    submission_timestamp:       now,
    facility:                   'Tennis Court',
    reservation_start:          resStart,
    reservation_end:            resEnd,
    duration_hours:             2,
    event_name:                 'Test Tennis Session',
    status:                     'Confirmed',
    guest_count:                2,
    guest_list_deadline:        new Date('2026-05-11T00:00:00+02:00'),
    guest_list_submitted:       true,
    board_approval_required:    false,
    board_approved_by:          null,
    board_approval_timestamp:   null,
    board_denial_reason:        null,
    rso_notified_timestamp:     null,
    calendar_event_id:          null,
    is_excess_reservation:      false,
    bump_window_deadline:       null,
    bumped_by_household_id:     null,
    bumped_date:                null,
    cancelled_by:               null,
    cancellation_timestamp:     null,
    cancellation_reason:        null,
    mgt_approved_by:            null,
    mgt_approved_date:          null,
    notes:                      'Test data for Phase 3 verification',
    created_at:                 now,
    updated_at:                 now
  });
  Logger.log('Created test reservation: ' + reservationId);

  // Test guest list (path keyed by reservation_id per upsert model)
  var guests = [
    { guest_profile_id: null, first_name: 'Alice', last_name: 'Smith',   age_group: 'over_18',  id_number: 'P12345678' },
    { guest_profile_id: null, first_name: 'Bob',   last_name: 'Johnson', age_group: 'under_18', id_number: '' }
  ];

  db.createDocument('guest_lists/' + reservationId, {
    guest_list_id:      'GL-TEST-00001',
    reservation_id:     reservationId,
    household_id:       householdId,
    household_name:     'Test Household',
    primary_email:      'michael+jm@raneyworld.com',
    facility:           'Tennis Court',
    reservation_start:  resStart,
    reservation_end:    resEnd,
    guests_json:        JSON.stringify(guests),
    guest_count:        guests.length,
    submitted_date:     now,
    submission_status:  'submitted',
    rso_reviewed_by:    null,
    rso_review_date:    null,
    rso_draft_json:     null,
    guests_final_json:  null,
    final_guest_count:  null,
    last_modified_date: now
  });
  Logger.log('Created test guest list at guest_lists/' + reservationId);
  Logger.log('Test data ready — run testPhase3ReservationRead() to verify reads.');
}

/**
 * Verifies Firestore reads for Phase 3 test data.
 * Run after createTestReservationData().
 */
function testPhase3ReservationRead() {
  var res = firestoreGetReservationById('RES-TEST-00001');
  Logger.log('Reservation read: ' + (res ? 'OK — ' + res.facility + ' at ' + res.reservation_start : 'FAILED'));

  var gl = firestoreGetGuestListForReservation('RES-TEST-00001');
  Logger.log('Guest list read: ' + (gl ? 'OK — ' + gl.guest_count + ' guest(s), status: ' + gl.submission_status : 'FAILED'));

  try {
    var hours = firestoreSumReservationHours('HSH-2026-00020', ['Tennis Court'],
      new Date('2026-05-01'), new Date('2026-06-01'), ['Confirmed', 'Approved', 'Tentative']);
    Logger.log('Sum hours: ' + hours + ' (expect 2)');
  } catch (e) {
    Logger.log('Sum hours FAILED: ' + e.message);
  }
}
