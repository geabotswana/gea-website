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

### TODO: Rate Limiting & Error Handling

```
[ ] Implement exponential backoff for API failures
[ ] Handle quota exceeded errors (429 status)
[ ] Implement retry logic with max attempts
[ ] Log failed operations to Audit Log
[ ] Add circuit breaker pattern for cascading failures
```

---

## Google Drive API Integration

### Document & Photo Storage

**Upload File:**
```javascript
// TODO: Implement file upload handler
// Parameters: file blob, folder ID, file name
// Returns: file ID
```

**Download File:**
```javascript
// TODO: Implement file download handler
// Parameters: file ID
// Returns: file blob
```

**Serve Image as Binary:**
```javascript
// Code.js::_handleImageProxy(e)
function _handleImageProxy(e) {
  var fileId = e.parameter.fileId;
  // TODO: Get file from Drive
  // TODO: Serve as binary with correct MIME type
  // TODO: Handle auth (only owner/GEA staff)
}
```

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

### TODO: Access Control & Sharing

```
[ ] Implement access control lists (who can view which files)
[ ] Set up sharing: Only GEA staff can view member documents
[ ] Implement one-time access links for RSO document review
[ ] Auto-delete expired document shares (after approval)
[ ] Log file access for audit trail
```

---

## Google Calendar API Integration

### Calendar Event Lifecycle

**Create Event (On Reservation Booking):**
```javascript
// TODO: Implement event creation
// Parameters: household_id, facility, date, start_time, end_time
// Returns: calendar event ID
// Fields:
// - Title: "[TENTATIVE] Tennis Court - [HOUSEHOLD_NAME]"
// - Description: reservation_id, facility_type, booking_status
// - Attendees: household members (invite all)
// - Color: Based on approval status (red=pending, green=approved)
```

**Update Event (On Approval/Denial):**
```javascript
// TODO: Implement event update
// Update title to reflect new status: [APPROVED], [DENIED], etc.
// Update description with approval details
// Change color to reflect status
```

**Delete Event (On Cancellation/Denial):**
```javascript
// TODO: Implement event deletion
// Parameters: calendar event ID
// Returns: success/failure
```

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

### Store Approved Photos

```javascript
// TODO: Implement photo upload to Cloud Storage
// Triggered: When member photo is approved by board
// Parameters: household_id, individual_id, file blob
// Operations:
// 1. Create folder path if not exists: gs://gea-member-data/{household_id}/{individual_id}/
// 2. Upload file as: photo.jpg
// 3. Make publicly accessible (read-only) for digital card display
// 4. Return cloud storage path for storage in database
// 5. Update File Submissions sheet: cloud_storage_path = [GCS_PATH], is_current = TRUE
```

### Retrieve Photos for Membership Card

```javascript
// TODO: Implement photo retrieval for card display
// Parameters: household_id, individual_id
// Returns: publicly accessible URL to photo in Cloud Storage
// Usage: Display in Portal.html membership card section
```

### TODO: Access Control & Sharing

```
[ ] Set up IAM roles: GEA account as owner, service account read-only
[ ] Make approved photos publicly readable (for card display)
[ ] Keep rejected/pending photos private
[ ] Implement temporary sharing links for RSO review
[ ] Auto-expire sharing links after approval/rejection
[ ] Set up lifecycle policy: Delete old photos after X years
```

---

## API Rate Limiting & Quotas

### Quotas (Per Default Apps Script Project)

```
Google Sheets API:
- 500 requests per 100 seconds per user
- 100,000 cells read per user per day
- 10,000 cells written per user per day

Gmail API:
- 100 emails per day for Apps Script projects
- Must be within organization domain

Google Drive API:
- [TODO: Verify quotas]

Google Calendar API:
- [TODO: Verify quotas]
```

### TODO: Quota Monitoring

```
[ ] Implement request counter (track per hour/day)
[ ] Alert board when approaching limits:
    [ ] 80% quota used: Log warning
    [ ] 95% quota used: Email board, suggest pause
    [ ] 100% quota used: Queue operations, notify board
[ ] Implement exponential backoff for rate limiting
[ ] Aggregate small operations into batch requests
```

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

### TODO: Distributed Caching

```
[ ] Evaluate: Properties Service for global/document properties
[ ] Cache strategy for frequently-accessed data:
    [ ] Configuration values (5-minute cache)
    [ ] Member directory (hourly cache, invalidate on change)
    [ ] Holiday calendar (daily cache, invalidate on change)
[ ] Implement cache invalidation:
    [ ] On data modification (clear cache immediately)
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

## Outstanding Items (TBD)

```
[ ] Document Cloud Storage bucket setup & authentication
[ ] Define quota monitoring strategy
[ ] Implement distributed caching (Properties Service)
[ ] Implement robust error handling with logging
[ ] Define holiday calendar update process
[ ] Implement one-time access links for RSO document review
[ ] Set up lifecycle policies for Cloud Storage
[ ] Performance benchmarking & optimization
[ ] Load testing (simulate concurrent users)
[ ] API cost analysis & optimization
```

---

**Last Updated:** March 4, 2026
**Status:** 60% Ready (basic structure + TODOs)
**Source:** Extracted from CLAUDE.md lines 1331–1337 with expanded detail
