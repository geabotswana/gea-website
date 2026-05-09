# FIRESTORE PHASE 3 DETAILED IMPLEMENTATION GUIDE

**Document Version:** 1.0
**Status:** Implementation Complete
**Target Audience:** Developers familiar with Firestore, reviewing reservation system migration
**Date Completed:** May 9, 2026
**Last Updated:** May 9, 2026

---

## 1. OVERVIEW & ARCHITECTURE

### Phase 3 Scope
Phase 3 migrates the reservation system from Google Sheets to Firestore:
- **reservations** collection (top-level)
- **guest_lists** top-level collection (one upsert document per reservation)

### FirestoreApp API Reference
This implementation uses **FirestoreApp** library (not the native Firebase SDK).

```javascript
// Path-based access (NOT .collection().doc() chaining)
db.getDocument('reservations/RES-2026-00001')         // Read
db.createDocument('reservations/RES-2026-00001', {})  // Create
db.updateDocument('reservations/RES-2026-00001', {}, true)  // Update with merge
db.deleteDocument('reservations/RES-2026-00001')      // Delete

// Query syntax
db.query('reservations')
  .Where('facility_id', '==', 'SWIMMING_POOL')
  .Execute()
```

---

## 2. COLLECTIONS STRUCTURE

### 2.1 `reservations` Collection

**Document ID:** `reservation_id` (e.g., `RES-2026-00001`)

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `reservation_id` | string | NO | Primary identifier |
| `household_id` | string | NO | Foreign key to households |
| `primary_member_id` | string | NO | For quick contact |
| `facility_id` | string | NO | SWIMMING_POOL, GOLF_COURSE, etc. |
| `facility_name` | string | NO | Denormalized for display |
| `reservation_start` | timestamp | NO | Start date/time |
| `reservation_end` | timestamp | NO | End date/time |
| `num_guests_paid` | number | NO | Guests included in pricing |
| `guest_list_count` | number | NO | Total guests invited |
| `guest_list_complete` | boolean | NO | Member submitted guest list? |
| `status` | string | NO | 'confirmed', 'cancelled', 'bumped' |
| `cancellation_reason` | string | YES | If cancelled |
| `cancellation_date` | timestamp | YES | When cancelled |
| `bumped_date` | timestamp | YES | When bumped |
| `bumped_reason` | string | YES | Reason for bumping |
| `is_recurring` | boolean | NO | Multi-week reservation? |
| `recurring_end_date` | timestamp | YES | If is_recurring=true |
| `created_at` | timestamp | NO | Creation time |
| `updated_at` | timestamp | NO | Last modification |

### 2.2 `guest_lists` Collection

**Path:** `guest_lists/{reservation_id}`
**Document ID:** `guest_id`

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `guest_id` | string | NO | Primary identifier |
| `guest_name` | string | NO | Full name |
| `guest_email` | string | NO | Contact email |
| `guest_type` | string | NO | 'household_member', 'invited_guest', 'staff' |
| `is_member` | boolean | NO | GEA member? |
| `member_household_id` | string | YES | If is_member=true |
| `event_date` | timestamp | NO | Date of attendance |
| `notes` | string | YES | Special requirements |
| `created_at` | timestamp | NO | When added |
| `updated_at` | timestamp | NO | Last modification |

---

## 3. CRUD OPERATION PATTERNS

### Read (Error Handling Pattern)

```javascript
function firestoreGetReservation(reservationId) {
  if (!reservationId) return null;
  try {
    var result = getFirestore().getDocument('reservations/' + reservationId);
    return result.obj || null;
  } catch (e) {
    Logger.log('Error reading reservation: ' + e);
    return null;
  }
}
```

**Pattern rules:**
- Check for null/empty parameter first
- Wrap `getDocument()` in try/catch
- Return `result.obj || null` (not `result ? result.obj : null`)
- Log error, return null on error (never throw)

### Update (Merge Flag Pattern)

```javascript
function firestoreUpdateReservation(reservationId, updates) {
  updates.updated_at = new Date();
  // Convert string dates to Date objects
  if (updates.reservation_start && typeof updates.reservation_start === 'string') {
    updates.reservation_start = new Date(updates.reservation_start);
  }
  var fs = getFirestore();
  fs.updateDocument('reservations/' + reservationId, updates, true);  // CRITICAL: merge=true
}
```

**Critical:** `merge=true` (third parameter) is required. Without it, Firestore **replaces the entire document**, causing data loss.

### Query

```javascript
function firestoreGetReservationsByFacility(facilityId) {
  if (!facilityId) return [];
  var fs = getFirestore();
  try {
    var results = fs.query('reservations')
      .Where('facility_id', '==', facilityId)
      .Execute();
    return results.map(function(doc) { return doc.obj; });
  } catch (e) {
    Logger.log('Error querying reservations: ' + e);
    return [];
  }
}
```

### Guest List Direct Lookup

```javascript
function firestoreGetGuestList(reservationId) {
  if (!reservationId) return null;
  try {
    var doc = getFirestore().getDocument('guest_lists/' + reservationId);
    return doc.obj || null;
  } catch (e) {
    return null;
  }
}
```

---

## 4. TESTING

Run `testPhase3Read()` in GAS editor to verify 4 read operations pass:
1. Single reservation read
2. Query by facility
3. Guest list read
4. Query by household

---

## 5. DATA MIGRATION

```javascript
function migrateReservationsToFirestore() {
  var sheet = SpreadsheetApp.openById(CONFIG.RESERVATIONS_SPREADSHEET_ID)
    .getSheetByName('Reservations');
  var data = sheet.getDataRange().getValues();
  var fs = getFirestore();
  var successCount = 0;

  for (var i = 1; i < data.length; i++) {
    try {
      var row = data[i];
      var reservation = {
        reservation_id: row[0],
        household_id: row[1],
        facility_id: row[3],
        reservation_start: new Date(row[5]),
        reservation_end: new Date(row[6]),
        status: row[7] || 'confirmed',
        created_at: new Date(row[18])
      };
      fs.createDocument('reservations/' + reservation.reservation_id, reservation);
      successCount++;
    } catch (e) {
      Logger.log('Error row ' + i + ': ' + e);
    }
  }
  Logger.log('Migration complete: ' + successCount + ' reservations');
}
```

---

## 6. TROUBLESHOOTING

| Issue | Cause | Solution |
|-------|-------|----------|
| "No matching index" | Multi-field query without composite index | Create index in Firestore console |
| Guest list empty | Wrong subcollection path | Use `guest_lists/{reservation_id}` |
| Update not saved | Missing merge flag | Add `true` as third param to `updateDocument()` |
| "Path validation failed" | Invalid doc ID or path format | Validate IDs, check for special chars |

---

**For questions:** board@geabotswana.org
**Last Updated:** May 9, 2026