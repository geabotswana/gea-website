# GEA Disaster Recovery Runbook

**Status:** Active Operational Document
**Last Updated:** May 9, 2026
**RTO Target:** 24 hours | **RPO Target:** 24 hours

---

## Quick Reference (KEEP AT DESK)

### Emergency Contacts
- **Treasurer:** [EMAIL_TREASURER from Config.js]
- **Board:** board@geabotswana.org
- **Google Cloud Status:** https://status.cloud.google.com

### Critical System IDs (from Config.js)
- **Member Directory:** SPREADSHEET_ID_MEMBERS
- **Reservations:** SPREADSHEET_ID_RESERVATIONS
- **Payments:** SPREADSHEET_ID_PAYMENTS
- **System Backend:** SPREADSHEET_ID_SYSTEM

### First Action (First 15 Minutes)
```
1. Is the outage REAL? (test from multiple networks)
2. Check https://status.cloud.google.com
3. Email Treasurer + Board: "GEA Portal Issue Detected - [TIME]"
4. Try login with test account
5. Open Apps Script editor and run: runDiagnostics()
```

---

## PHASE 1: Detection & Immediate Response (First 15 Minutes)

### How We Detect Problems

1. **Automated Health Check** (4:00 AM daily)
   - Apps Script automatically tests Sheets, Gmail, Audit Log
   - If 3+ failures in 1 hour → Alert email to Treasurer + board@geabotswana.org
   - Check email for alerts each morning

2. **Member/Board Notification** (Real-time)
   - Members can't access portal
   - Board can't approve reservations
   - Email notifications stop arriving

3. **Manual Monitoring** (Monthly optional)
   - Treasurer clicks through portal, verifies responsiveness

### Immediate Actions (First 15 Minutes)

```
STEP 1: Confirm outage is real (not local network issue)
├─ Try from different device
├─ Try from different network (mobile hotspot)
└─ Try from different browser

STEP 2: Check external status (not our problem)
├─ Go to: https://status.cloud.google.com
├─ Look for: Google Apps Script, Google Drive, Gmail, Sheets
└─ If RED: Likely Google outage, proceed to communication

STEP 3: Notify stakeholders
├─ Email subject: "GEA Portal Outage Detected - [TIME] GMT+2"
├─ Recipients: board@geabotswana.org
└─ Content: "Portal access lost at [TIME]. Investigating."

STEP 4: If Google Cloud is DOWN (status page shows red)
├─ Update notification: "Google services are experiencing outages"
├─ Provide updates every 30 minutes
├─ Check status page hourly
└─ No further action needed (wait for Google)

STEP 5: If Google Cloud is UP (status page looks green)
├─ Proceed to PHASE 2: Diagnosis
```

---

## PHASE 2: Diagnosis (15 Minutes – 1 Hour)

### Run Diagnostics Tool

```
IN APPS SCRIPT EDITOR:

1. Open https://script.google.com
2. Select from dropdown: runDiagnostics()
3. Click Run (▶) button
4. View → Logs (Ctrl+Enter)
5. Look for results:
   ✅ PASS = System working
   ❌ FAIL = Problem found
```

### Diagnostic Tests Explained

| Test | What It Checks | If PASS | If FAIL |
|------|---|---|---|
| **Apps Script** | GAS deployment responds | Continue diagnosis | Critical: GAS broken |
| **Sheets API** | All 4 sheets readable | Continue | Data inaccessible |
| **Gmail API** | Can send test email | Continue | Notifications broken |
| **Sessions Sheet** | Auth system works | Continue | Users can't login |
| **Data Integrity** | Member data not corrupted | Continue | Restore from backup |

### Diagnosis Decision Tree

```
DECISION TREE:

Q1: Did runDiagnostics() run successfully?
├─ YES → Go to Q2
└─ NO → Apps Script itself is broken
        └─ Check: https://status.cloud.google.com
        └─ If Google is UP: Contact Claude Code / Developer
        └─ If Google is DOWN: Wait for recovery

Q2: How many tests FAILED in the diagnostics output?
├─ ZERO failed → Not system-wide failure, check Q3
├─ 1-2 failed → Specific component broken (see below)
└─ 3+ failed → Full system failure, go to PHASE 3: Recovery

Q3: Which specific test failed?
├─ "Sheets API: Member Directory" FAILED
│  └─ Sheet is corrupted or deleted
│  └─ Go to PHASE 3: Data Restoration
├─ "Sheets API: Payments" FAILED
│  └─ Only payments affected, other systems OK
│  └─ Restore just Payments sheet
├─ "Gmail API" FAILED
│  └─ Email system broken but portal works
│  └─ Check Gmail service permissions
├─ "Sessions Sheet" FAILED
│  └─ Users can't login
│  └─ Check Sessions sheet structure against schema
└─ "Audit Log" FAILED
   └─ Logging broken but portal works
   └─ Audit Log sheet may be corrupted
```

---

## PHASE 3: Recovery (1 Hour – 4 Hours)

### Recovery Path Selection

```
SELECT RECOVERY PATH:

PATH A: Data Corruption (specific sheet broken)
└─ See: "Path A: Restore from Backup" below

PATH B: Code Corruption (Apps Script code broken)
└─ See: "Path B: Code Rollback" below

PATH C: Complete System Failure (all sheets down)
└─ See: "Path C: Full System Restoration" below
```

---

## Path A: Restore from Backup (Corrupted Data)

### Prerequisites
- Identified which sheet is corrupted (from runDiagnostics)
- Access to backup files in Google Drive folder: "GEA Backups"
- Google Drive access to create new spreadsheet

### Recovery Steps

```
STEP 1: Locate backup file (5 minutes)
├─ Go to Google Drive
├─ Search folder: "GEA Backups"
├─ Find: GEA_[SheetName]_YYYY-MM-DD.xlsx
├─ Select most recent backup (yesterday's date)
└─ Note the date in case backup is also corrupted

STEP 2: Create recovery spreadsheet (5 minutes)
├─ Create new Google Sheet
├─ Name it: "GEA-[SheetName]-RESTORE-[DATE]"
│  Example: "GEA-Reservations-RESTORE-2026-05-09"
├─ Share with board@geabotswana.org (view only)
└─ Copy the spreadsheet ID (in URL bar)

STEP 3: Restore data from backup (10 minutes)
├─ Open backup file (.xlsx)
├─ Select all data (Ctrl+A)
├─ Copy (Ctrl+C)
├─ Go to new recovery spreadsheet
├─ Paste into same tabs as original
├─ Save (Ctrl+S)

STEP 4: Validate data integrity (10 minutes)
├─ Check row count:
│  └─ Does recovered sheet have ~expected number of rows?
├─ Check headers:
│  └─ Do column headers match GEA_System_Schema.md?
├─ Spot-check 10 random rows:
│  └─ Are values reasonable? Any truncation/corruption?
├─ If PASS → Continue to Step 5
└─ If FAIL → Try earlier backup date, or contact developer

STEP 5: Update Config.js to point to recovery sheet (5 minutes)
├─ Copy new spreadsheet ID
├─ Go to: Code.js → Config.js
├─ Find: SPREADSHEET_ID_[SHEET_TYPE]
├─ Replace with recovery spreadsheet ID
│  Example: SPREADSHEET_ID_RESERVATIONS = "[NEW_ID]"
├─ Save (Ctrl+S)
├─ If using clasp: git add, commit, git push

STEP 6: Test critical operations (15 minutes)
├─ Try login: Use test account to login to portal
├─ Try reservation: Create test booking
├─ Try approval: Approve test booking (as board)
├─ Try email: Check if notification sent
├─ Check logs: Apps Script → Logs (Ctrl+Enter)
├─ If PASS → Continue to Step 7
└─ If FAIL → Revert Config.js change, re-diagnose

STEP 7: Update main spreadsheet reference (5 minutes)
├─ Once recovery sheet is verified:
├─ Update main Config.js with recovery sheet ID
├─ Test again briefly
├─ Commit change: git push
├─ Notify board: "Service restored from backup"

STEP 8: Cleanup (24 hours later)
├─ Keep corrupted sheets for 30 days (for audit trail)
├─ Move corrupted sheets to "Archive" folder
├─ Keep recovery sheet as new permanent reference
├─ Document: What happened, when, recovery time
```

**Total recovery time: ~45 minutes (well within 24-hour RTO)**

---

## Path B: Code Rollback (Corrupted Apps Script Code)

### Prerequisites
- Code corruption detected (from runDiagnostics)
- GitHub repository has version history
- Access to Google Apps Script editor

### Recovery Steps

```
STEP 1: Identify last known good commit (5 minutes)
├─ Open: https://github.com/geabotswana/gea-website
├─ Click: Commits (or press 'c' on main branch)
├─ Look for: Last commit before issue occurred
├─ Copy: Full commit hash (40 characters)

STEP 2: Revert to known good commit (5 minutes)
├─ Terminal command:
│  git log --oneline | head -10
│  (see recent commits)
├─ Find: Commit hash before corruption
├─ Checkout that commit:
│  git checkout [COMMIT_HASH]

STEP 3: Verify code looks correct (5 minutes)
├─ Open Code.js, AuthService.js, etc.
├─ Visually scan for obvious errors
├─ Check: Functions are intact (not truncated)

STEP 4: Run diagnostics tests (10 minutes)
├─ Apps Script editor: Select from dropdown
├─ Run: testGetMembers()
├─ Run: testCreateReservation()
├─ Run: testEmailSending()
├─ All should PASS
├─ Check Logs: Ctrl+Enter

STEP 5: Deploy if verified (5 minutes)
├─ If using clasp:
│  clasp push
├─ If manual: Copy-paste code back to GAS editor
├─ Save
├─ Test one more time

STEP 6: Notify and log (5 minutes)
├─ Email board: "Code issue resolved, reverted to [COMMIT_DATE]"
├─ Log to Audit Log: "CODE_ROLLBACK" action
└─ Document: What was wrong, why it happened

Total recovery time: ~30 minutes
```

---

## Path C: Complete System Restoration (All Sheets Down)

### Prerequisites
- All 4 critical sheets inaccessible
- Backup files available in "GEA Backups" folder
- ~2 hours time allocation
- 2 people (Treasurer + Board member)

### Recovery Steps (Detailed)

```
STEP 1: Assess Damage (5 minutes)
├─ Confirm all 4 sheets inaccessible:
│  ├─ Member Directory
│  ├─ Reservations
│  ├─ Payments
│  └─ System Backend
├─ Check if Google Workspace backup available
└─ Locate latest backup files in "GEA Backups" folder

STEP 2: Prepare Recovery Environment (10 minutes)
├─ Create new Google Drive folder:
│  "GEA Recovery - [TODAY'S DATE]"
├─ Create 4 new blank Google Sheets:
│  ├─ Members Restore
│  ├─ Reservations Restore
│  ├─ Payments Restore
│  └─ System Restore
├─ Note the spreadsheet IDs (copy from URL)
└─ Do NOT share yet

STEP 3: Restore Data (30 minutes)
├─ For EACH of 4 sheets:
│  ├─ Download backup .xlsx file from "GEA Backups"
│  ├─ Open recovery sheet (e.g., "Members Restore")
│  ├─ File → Import → Upload
│  ├─ Import entire backup file
│  ├─ Verify row count matches expected
│  ├─ Check column headers match schema
│  ├─ Spot-check 10 random rows
│  └─ If issues, try previous day's backup
├─ Repeat for all 4 sheets
└─ Estimated time: 30 minutes

STEP 4: Update Config.js (10 minutes)
├─ Open Code.js
├─ Find section: "SECTION 1: SPREADSHEET IDS"
├─ Update all 4 IDs:
│  SPREADSHEET_ID_MEMBERS = "[NEW_ID]"
│  SPREADSHEET_ID_RESERVATIONS = "[NEW_ID]"
│  SPREADSHEET_ID_PAYMENTS = "[NEW_ID]"
│  SPREADSHEET_ID_SYSTEM = "[NEW_ID]"
├─ Save (Ctrl+S)
└─ If using clasp: git add Config.js && git commit && git push

STEP 5: Validate System (15 minutes)
├─ Test login:
│  ├─ Try test account password
│  ├─ Check Sessions sheet created session
│  ├─ Verify session token in sessionStorage
├─ Test reservation:
│  ├─ Create test booking
│  ├─ Verify entry in Reservations sheet
│  ├─ Check Audit Log recorded action
├─ Test approval:
│  ├─ As board user, approve test booking
│  ├─ Verify status changed in sheet
├─ Test email:
│  ├─ Verify notification email sent
│  ├─ Check Apps Script logs for no errors
└─ If ANY FAIL: Revert Config.js, re-diagnose

STEP 6: Notify Stakeholders (5 minutes)
├─ Email board@geabotswana.org:
│  Subject: "GEA Service Restored from Backup"
│  Body:
│  - Recovery completed at [TIME]
│  - Data recovered from backup dated [DATE]
│  - All tests passed
│  - Normal operations resumed
│  - Data loss: Up to 24 hours
├─ Request 2 board members manually verify:
│  ├─ Can they login?
│  ├─ Can they see their memberships?
│  └─ Can they book reservations?

STEP 7: Cleanup (24 hours later)
├─ Archive corrupted sheets:
│  ├─ Move to "Archive" folder
│  ├─ Rename: "[SHEET_NAME] - Corrupted - [DATE]"
│  └─ Keep for 30 days (audit trail)
├─ Keep recovery sheets as primary reference
├─ If no issues after 24 hours:
│  └─ Delete corrupted sheets permanently

Total recovery time: ~75 minutes (within 24-hour RTO)
Data loss: Up to 24 hours (last backup)
```

---

## CHECKLISTS

### Outage Response Checklist

Use this checklist during active incident:

```
DETECTION & NOTIFICATION
[ ] Confirmed outage is real (tested from multiple networks)
[ ] Checked Google Cloud status page
[ ] Notified Treasurer + Board
[ ] Documented: time noticed, symptoms, affected services

DIAGNOSIS
[ ] Opened Apps Script editor
[ ] Ran runDiagnostics()
[ ] Reviewed diagnostic output
[ ] Identified root cause (GAS, data, external)

RECOVERY
[ ] Selected recovery path (A/B/C)
[ ] Followed recovery steps
[ ] Validated system with test operations
[ ] Verified logs show no errors

COMMUNICATION
[ ] Updated board with status
[ ] Requested manual verification
[ ] Confirmed users can access portal

POST-INCIDENT
[ ] Documented incident in Incident Log sheet
[ ] Identified root cause
[ ] Proposed prevention for future
[ ] Scheduled post-mortem meeting
```

### Data Restoration Validation Checklist

Use this when restoring data from backup:

```
DATA INTEGRITY
[ ] Downloaded backup file
[ ] Verified backup file not corrupted
[ ] Imported into recovery spreadsheet
[ ] Checked row count matches expected
[ ] Verified column headers match schema

SAMPLE DATA VALIDATION
[ ] Spot-checked 10 random rows
[ ] No truncated values
[ ] Timestamps are reasonable
[ ] No obvious data corruption

SYSTEM VALIDATION
[ ] Test login with known account
[ ] Test creating reservation
[ ] Test approving action
[ ] Test email notification sent
[ ] Check Apps Script logs: no errors

CONFIGURATION
[ ] Updated Config.js with new IDs
[ ] Saved and deployed changes
[ ] Re-tested critical paths
[ ] Verified all operations working

CLEANUP
[ ] Archived corrupted sheets
[ ] Documented recovery process
[ ] Notified board of restoration
[ ] Scheduled review meeting
```

---

## Testing & Validation Schedule

### Quarterly Backup Test (30 minutes)

**When:** Last week of March, June, September, December
**Who:** Treasurer + One Board Member
**What:** Verify one backup file is uncorrupted

```
1. Download backup file from "GEA Backups" folder
2. Create test spreadsheet
3. Import backup data
4. Verify row counts
5. Spot-check 10 rows against current production
6. Document results in brief test report
7. File report in Financial Records folder

Success = Data matches production exactly
```

### Annual Full System Test (2-3 hours)

**When:** November (Q4, before year-end)
**Who:** Treasurer + Board member + Developer

```
PHASE 1: Data Restoration (1 hour)
[ ] Download all 4 backup files
[ ] Create test spreadsheet
[ ] Import all backup data
[ ] Verify all sheets restored correctly
[ ] Check row counts

PHASE 2: Portal Testing (30 minutes)
[ ] Test login to member portal
[ ] Test login to admin portal
[ ] Create test reservation
[ ] Approve test reservation
[ ] Check email notification sent

PHASE 3: Code Verification (30 minutes)
[ ] Verify GitHub repo has all current code
[ ] Check latest commit is from main branch
[ ] Run Tests.js > runAllTests()
[ ] Verify all tests pass

PHASE 4: Assets Verification (30 minutes)
[ ] Verify Cloud Storage images accessible
[ ] Check member photos display correctly
[ ] Verify logos load in portal
[ ] Verify no permission errors

RESULT: Sign-off document filed in Financial Records
```

---

## Communication Templates

### Outage Notification (Send Immediately)

```
Subject: GEA Portal Outage - [TIME] GMT+2

Dear GEA Members,

We are experiencing a temporary outage to the GEA member portal.

Status: [In Progress / Under Investigation / Being Restored]
Affected: Member portal, reservations, payment submissions
Expected Resolution: [TIME] GMT+2

Current Actions:
- Investigating cause of outage
- Running system diagnostics
- Attempting restoration from backup

We apologize for the inconvenience. Updates will be provided
every 30 minutes.

Questions? Contact: board@geabotswana.org

—GEA Administration
```

### Resolution Notification (When Fixed)

```
Subject: GEA Portal Service Restored

Dear GEA Members,

The GEA member portal has been restored to normal operation.

Outage Duration: [X hours]
Root Cause: [Brief explanation]
Data Recovery: All data has been restored from backup
Data Loss: Up to [X hours] (daily backup frequency)

Normal operations have resumed. You can now:
✓ Login to portal
✓ View dashboard
✓ Make reservations
✓ Submit applications
✓ Upload documents

If you experience any issues, please contact: board@geabotswana.org

Thank you for your patience.

—GEA Administration
```

---

## Incident Log Sheet

**Location:** Financial Records folder in Google Drive
**Name:** "GEA Incident Log [YEAR]"

**Columns:**
| Date | Time (GMT+2) | Description | Impact | Resolution | Duration (min) | Root Cause | Lessons Learned |
|---|---|---|---|---|---|---|---|
| 2026-05-09 | 03:45 | Example incident | Reservation access down 1 hour | Restored from 5/8 backup | 60 | Sheets API timeout | Implement health check |

**Review Schedule:**
- Treasurer reviews quarterly (end of each quarter)
- Board reviews at annual meeting
- Identify patterns for future prevention

---

## Post-Incident Process

### Within 24 Hours
1. Treasurer documents incident in Incident Log sheet
2. Include: What failed, when, how fixed, duration, root cause
3. Save incident log entry

### Within 7 Days
1. Treasurer + Developer schedule post-mortem meeting
2. Review: What happened, why, how to prevent
3. Update runbook if procedures need adjustment
4. Update this document

### Next Board Meeting
1. Present summary of incident to board
2. Discuss preventive measures
3. Identify any policy changes needed

---

## Key Phone Numbers & Contacts (To Be Filled In)

- **Treasurer:** [Name] - [Phone] - [Email]
- **Board Chair:** [Name] - [Phone] - [Email]
- **Technical Lead:** [Name] - [Phone] - [Email]
- **Google Cloud Support:** [Link to support portal]

---

## Appendix: Key System Configuration

### Spreadsheet IDs (From Config.js)
```
SPREADSHEET_ID_MEMBERS = "[ID_HERE]"
SPREADSHEET_ID_RESERVATIONS = "[ID_HERE]"
SPREADSHEET_ID_PAYMENTS = "[ID_HERE]"
SPREADSHEET_ID_SYSTEM = "[ID_HERE]"
```

### Important Tab Names (From Config.js)
```
TAB_HOUSEHOLDS = "Households"
TAB_INDIVIDUALS = "Individuals"
TAB_SESSIONS = "Sessions"
TAB_AUDIT_LOG = "Audit Log"
TAB_HOLIDAYS = "Holiday Calendar"
```

### Critical Email Addresses (From Config.js)
```
EMAIL_TREASURER = "[TREASURER@DOMAIN]"
EMAIL_BOARD = "board@geabotswana.org"
SESSION_EMAIL = "[SERVICE_ACCOUNT@DOMAIN]"
```

---

**Last Updated:** May 9, 2026
**Next Review:** November 2026 (Annual test)
**Document Owner:** GEA Treasurer
