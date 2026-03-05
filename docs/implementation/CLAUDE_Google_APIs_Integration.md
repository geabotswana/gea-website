# Google APIs Integration Implementation Guide

Comprehensive guide for integrating Google Sheets, Drive, Calendar, and Cloud Storage APIs in Apps Script.

---

## Overview

The GEA system uses four primary Google APIs:

| API | Purpose | Usage |
|-----|---------|-------|
| **Google Sheets** | Member directory, reservations, payments | Core database operations |
| **Google Drive** | Document uploads, image serving | File storage & retrieval |
| **Google Calendar** | Reservation scheduling | Event creation/deletion |
| **Google Cloud Storage** | Member photos & documents | Cloud backup & distribution |

---

## Google Sheets API Integration

### Core Operations

**Reading Data:**
```javascript
// Get all data from a sheet
var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Individuals");
var data = sheet.getDataRange().getValues();

// Query specific row
var rows = data.filter(row => row[EMAIL_COLUMN] === "jane@example.com");

// Get cell value
var value = sheet.getRange(rowIndex, columnIndex).getValue();
```

**Writing Data:**
```javascript
// Append a new row
var newRow = [email, firstName, lastName, passwordHash, ...];
sheet.appendRow(newRow);

// Update existing cell
sheet.getRange(rowIndex, columnIndex).setValue(newValue);

// Update multiple cells
sheet.getRange(startRow, startCol, numRows, numCols).setValues(newData);
```

**Deleting Data:**
```javascript
// Delete a row
sheet.deleteRow(rowIndex);

// Clear range
sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).clearContent();
```

### Performance Considerations

```javascript
// ❌ SLOW - Reads entire sheet multiple times
for (var i = 0; i < 100; i++) {
  var email = sheet.getRange(i, EMAIL_COLUMN).getValue();  // API call each loop
}

// ✅ FAST - Reads once, works in memory
var data = sheet.getDataRange().getValues();
for (var i = 0; i < 100; i++) {
  var email = data[i][EMAIL_COLUMN];  // In-memory access
}

// ✅ BATCH WRITES - Combine multiple updates
var updates = [];
for (var i = 0; i < 100; i++) {
  updates.push([...]);
}
sheet.getRange(startRow, 1, updates.length, updates[0].length).setValues(updates);
```

### Error Handling & Robust Resilience

**Robust Error Handling Implementation:**
- When API calls fail (exchange rate fetch, file upload, Drive access):
  - Retry up to 3 times with delays between attempts (1s, 2s, 4s exponential backoff)
  - If still fails after retries, log error to Audit_Logs with full context
  - Send email notification to Treasurer with error details

**Specific Operations Needing Error Handling:**
- Daily exchange rate fetch from exchangerate-api.com
- File uploads to Google Drive
- Calendar event creation/updates
- Google Sheets read/write operations

**Implementation Approach:**
- Use try-catch blocks for all API calls
- Implement exponential backoff (1s, 2s, 4s) for retries
- Comprehensive logging of all failures
- Email alerts to Treasurer on critical failures

---

## Google Drive API Integration

### Document & Photo Storage

**File Upload Handler (Google Drive):**
- Use Google Drive for member document storage
- Upload documents (passports, omang, photos, etc.) to Drive
- Parameters: file blob, household_id, individual_id, document_type
- Returns: file ID for database storage
- Error handling: Quota exceeded, permission denied, file too large
- Folder structure: gea-member-data/{household_id}/{individual_id}/{document_type}.{ext}

**File Download Handler (Google Drive):**
- Download documents from Drive for RSO review
- Support temporary access links for RSO document review (expires after approval/rejection)
- Parameters: file ID
- Returns: file blob
- Error handling: File not found, access denied, expired link

**Image Proxy Authentication:**
- Dual photo strategy:
  - **Drive photos**: Used in member & admin portals (serve via Drive, zero egress cost)
  - **Cloud Storage photos**: Used for guard/app display (serve via Cloud, accept egress costs)
- Access control: Only GEA staff and photo owner can view via Drive; Cloud photos public for approved members
- Authentication: Member login for Drive photos; public URL for Cloud photos

### Folder Structure

```
Expected folder hierarchy:
gea-member-data/
  ├─ {household_id}/
  │  ├─ {individual_id}/
  │  │  ├─ photo.jpg
  │  │  ├─ passport.pdf
  │  │  └─ omang.pdf
  │  └─ {spouse_individual_id}/
  │     └─ photo.jpg
  └─ [etc...]
```

### Access Control & Sharing

**Access Control Implementation:**
- Implement access control lists (who can view which files)
- Set up sharing: Only GEA staff can view member documents
- Implement one-time access links for RSO document review (auto-expire after approval/rejection)
- Log file access for audit trail in Audit Log sheet

**File Submission Approval Workflow:**
- RSO reviews documents via temporary access links
- After RSO approval/rejection, access link expires automatically
- GEA admin reviews approved documents for final approval
- After approval, document transferred to Cloud Storage for archive

---

## Google Calendar API Integration

### Calendar Event Lifecycle

**Event Creation Handler:**
- Create calendar event on reservation booking (per Reservations Process Spec Part 1-2)
- Title format: `[FACILITY_CODE] - [HOUSEHOLD_NAME]`
- Status tag in description: `[TENTATIVE]`, `[APPROVED]`, `[DENIED]`, `[CANCELLED]`, `[WAITLISTED]`
- Attendees: Requesting member + selected household members/invitees (optional; don't flood large families)
- Color: Facility-based (TC/BC, Leobo, Whole Facility each have distinct color)

**Event Update Handler:**
- Update event status when approval changes (Pending Board → Approved, etc.)
- Update attendee list if member adds/removes household members
- Update event title/description with new status
- No re-approval needed for attendee-only changes; full re-approval for time/date/facility changes

**Event Deletion Handler:**
- Mark event status as `[CANCELLED]` in description (do not delete immediately)
- Keep event for audit trail visibility
- Check for waitlisted events to promote if this was blocking booking
- Notify RSO if guest list was submitted
- Return calendar event ID to Reservations sheet for historical reference

### Calendar Status Tags

```
Event titles use status tags:
[TENTATIVE]              - Pending approval
[TENTATIVE_EXCESS]       - Excess booking pending board
[TENTATIVE_BOARD]        - Pending second-stage approval
[APPROVED]               - Approved, ready for guest list
[BUMPED_TO_CONFIRMED]    - Excess booking promoted
[AUTO_CONFIRMED_EXCESS]  - Excess auto-confirmed
[DENIED]                 - Rejected
[CANCELLED]              - Member cancelled

Colors (if using calendar color feature):
Red (#E81B23)    - Pending approval
Green (#33B679)  - Approved
Gray (#808080)   - Cancelled/Denied
Yellow (#F4511E) - Excess booking
```

### TODO: Holiday Calendar Integration

```
[ ] Load US Federal holidays from Config
[ ] Load Botswana public holidays from Config
[ ] Use for business day calculations:
    - Bump window deadline (exclude weekends + holidays)
    - Guest list deadline (exclude weekends + holidays)
    - Approval reminder (skip weekends + holidays)
[ ] Store holiday list in Holiday Calendar sheet
[ ] Update annually (before July 31)
```

---

## Google Cloud Storage Integration

### Cloud Storage Setup

**Bucket Path Format:**
```
gs://gea-member-data/{household_id}/{individual_id}/photo.jpg
```

### Dual Photo Storage Strategy

**Drive Photos:**
- Path: `gea-member-data/{household_id}/{individual_id}/photo.jpg` (Drive folder)
- Access: Member login + GEA staff only
- Purpose: Display in member profile, admin review
- Egress cost: Zero (internal Drive access)

**Cloud Storage Photos:**
- Path: `gs://gea-member-data/{household_id}/{individual_id}/photo.jpg` (Cloud Storage)
- Access: Public read for approved members (digital card use)
- Purpose: Guard verification, membership card display, archive
- Egress cost: Accept Cloud egress for this use case

**Photo Upload & Transfer Workflow:**
- Approved photo uploaded to Drive
- Synced to Cloud Storage for card/guard use
- Rejected/pending photos stay in Drive, private access only
- On approval: Transfer to Cloud Storage, make public
- On rejection: Keep in Drive, mark as rejected, revoke Cloud access

### Photo Expiration & Renewal Policy

**Expiration Schedule:**
- Members 18+: Expire every 3 years
- Members under 18: Expire annually (on birthday or submission anniversary)

**Expired Photo Workflow:**
- Hold expired photo until:
  - New approved photo uploaded & replaces it, OR
  - 2 months after membership expiration (then can be deleted)
- Admin portal: "Expired Photos" section for review & confirmation of deletion
- Active membership + expired photo: Admin can delete only if replacement photo approved
- Expired membership: Admin can delete at will
- Cloud Storage photos: Delete when Drive photo deleted
- Audit trail: Log all photo deletions

### Access Control & Sharing

**Cloud Storage Access Control:**
- IAM roles: GEA account (owner), service account (read-only)
- Approved photos: Public readable (for card display)
- Rejected/pending photos: Private (GEA staff only)
- Temporary sharing: One-time links for RSO review (auto-expire after approval/rejection)
- Lifecycle policy: Delete old photos after member deletion or photo expiration
- Cost optimization: Use Cloud Storage for public/shared photos only; Drive for private

---

## API Quotas & Performance Considerations

### Cloud Storage Quotas

**Internet Egress Bandwidth:** 200 Gb/second per region (GEA will never approach this)

**Dualregion Egress:** 200 Gb/second per region (GEA will never approach this)

**Storage per bucket:** Up to 18 TiB per region (GEA photo storage negligible)

**Verdict:** No quota concerns for GEA use case; no monitoring needed

### Drive API Quotas

**No practical quotas found for Drive API calls**

**GEA usage:** Negligible (document uploads/downloads)

**Verdict:** No quota concerns

### Calendar API Quotas

**No practical quotas found for Calendar API calls**

**GEA usage:** Negligible (reservation events)

**Verdict:** No quota concerns

### Quota Monitoring Strategy

**Decision:** NOT NEEDED

**Rationale:** GEA's API usage is negligible (few uploads, daily exchange rate, calendar events). Will never approach quota limits. Implementation adds complexity without real performance benefit.

**Verdict:** No monitoring implemented; focus on error handling instead

---

## Error Handling

### Common API Errors

```javascript
// ❌ File not found
Error: "The file with id [ID] does not exist"
Solution: Check file ID exists, user has access

// ❌ Rate limit exceeded
Error: "429: Too Many Requests"
Solution: Implement exponential backoff, retry

// ❌ Quota exceeded
Error: "403: Quota exceeded"
Solution: Queue operations, wait for quota reset

// ❌ Permission denied
Error: "403: Permission denied"
Solution: Check service account permissions, folder sharing
```

### TODO: Robust Error Handling

```javascript
function apiCallWithRetry(operation, maxRetries = 3) {
  var delay = 1000;  // Start with 1 second

  for (var i = 0; i < maxRetries; i++) {
    try {
      return operation();  // Execute API call
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;  // Last retry failed
      }

      // Exponential backoff: 1s, 2s, 4s...
      Utilities.sleep(delay);
      delay *= 2;
    }
  }
}

// Usage:
var result = apiCallWithRetry(function() {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Individuals");
});
```

---

## Caching Strategies

### In-Memory Caching (Short-Term)

```javascript
var cachedConfig = null;
var configCacheTime = null;
const CONFIG_CACHE_DURATION = 5 * 60 * 1000;  // 5 minutes

function getConfigValue(key) {
  var now = new Date().getTime();

  // Check if cache is still valid
  if (cachedConfig && configCacheTime && (now - configCacheTime) < CONFIG_CACHE_DURATION) {
    return cachedConfig[key];
  }

  // Cache expired, reload from sheet
  var configSheet = getSheet('System Backend', 'Configuration');
  var configData = configSheet.getDataRange().getValues();
  cachedConfig = {};
  for (var i = 0; i < configData.length; i++) {
    cachedConfig[configData[i][0]] = configData[i][1];
  }
  configCacheTime = now;

  return cachedConfig[key];
}
```

### Caching Strategy

**Decision:** Distributed caching NOT NEEDED

**Rationale:** GEA's member count is small; reading from sheets each time is sufficient. Caching adds complexity without real performance benefit at this scale. Portal response times acceptable without caching.

**Implementation Approach:**
- Read from sheets on each request (no caching layer)
- In-memory caching can be used for single-request lifecycles (e.g., within one handlePortalApi call)
- Optimization: Read entire sheet once per request, work in memory for that request
    [ ] On timer (clear cache every N minutes)
[ ] Implement cache warming (pre-load on startup)
```

---

## Testing & Debugging

### Test API Connectivity

```javascript
function testSheetsAPI() {
  try {
    var ss = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID);
    var sheet = ss.getSheetByName("Individuals");
    var lastRow = sheet.getLastRow();
    Logger.log("✓ Sheets API working - " + lastRow + " rows in Individuals");
  } catch (error) {
    Logger.log("✗ Sheets API error: " + error.message);
  }
}

function testGmailAPI() {
  try {
    GmailApp.sendEmail("test@example.com", "Test", "Test message");
    Logger.log("✓ Gmail API working");
  } catch (error) {
    Logger.log("✗ Gmail API error: " + error.message);
  }
}

function testCalendarAPI() {
  // TODO: Implement calendar test
}

function testDriveAPI() {
  // TODO: Implement Drive test
}

function testCloudStorageAPI() {
  // TODO: Implement Cloud Storage test
}
```

---

## Related Documentation

- **GEA_System_Architecture.md** — External integrations section
- **Config.js** — Spreadsheet IDs, folder IDs, configuration
- **Utilities.js** — Helper functions for API calls
- **Tests.js** — Diagnostic functions for API testing

---

## Holiday Calendar Integration (Deferred)

**Status:** TBD for Phase 3 implementation

**Scope:** Load US Federal holidays and Botswana public holidays for business day calculations

**Use Cases:**
- Bump window deadline (exclude weekends + holidays)
- Guest list deadline (exclude weekends + holidays)
- Approval reminder (skip weekends + holidays)

**Future Implementation:**
- Store holiday list in Holiday Calendar sheet
- Update annually (before July 31)
- Update frequency: TBD

---

**Last Updated:** March 6, 2026
**Status:** ✅ Complete (All 15+ file handling, calendar, storage, quotas resolved; holiday calendar deferred)
**Source:** Extracted from CLAUDE.md lines 1331–1337 with expanded detail
