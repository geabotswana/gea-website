# Disaster Recovery Implementation Guide

Backup procedures, recovery testing, incident response, and restoration playbooks for the GEA system.

---

## Disaster Recovery Objectives

### RTO & RPO Targets

```
RTO (Recovery Time Objective): [TBD]
  └─ Maximum time to restore service after failure

RPO (Recovery Point Objective): [TBD]
  └─ Maximum acceptable data loss (in time or transactions)

Examples:
  RTO: 4 hours (service restored within 4 hours of failure)
  RPO: 1 hour (lose up to 1 hour of data)
```

---

## Backup Strategy

### Google Workspace Backups

Google automatically backs up:
- Google Drive (docs, sheets, spreadsheets)
- Gmail (email)
- Google Calendar (events)

**Limitations:**
- Automatic daily backups (no access to hourly)
- Backups retained for 25 days
- No manual backup point selection
- Cannot selectively restore (must restore entire Drive)

### Manual Backups

```
Weekly Backup Procedure (Every Friday):
1. Export Member Directory spreadsheet to CSV
   └─ Download as: gea-members-YYYY-MM-DD.csv

2. Export Reservations spreadsheet to CSV
   └─ Download as: gea-reservations-YYYY-MM-DD.csv

3. Export System Backend spreadsheet to CSV
   └─ Download as: gea-system-YYYY-MM-DD.csv

4. Export Payment Tracking spreadsheet to CSV
   └─ Download as: gea-payments-YYYY-MM-DD.csv

5. Store on encrypted external drive
   └─ Location: [TBD - Board member secure location]
   └─ Encryption: [TBD - BitLocker / FileVault / VeraCrypt]
   └─ Retention: 90 days (12 backups)

6. Test restoration (quarterly)
   └─ Import CSV into test spreadsheet
   └─ Verify data integrity
   └─ Document any issues
```

### TODO: Automated Backup

```
[ ] Evaluate: Google Apps Script scheduler for weekly backups
[ ] Implement: Automated export to Cloud Storage
[ ] Implement: Email backup files to board treasurer (encrypted)
[ ] Implement: Backup integrity checks (row count, hash verification)
[ ] Implement: Automated cleanup (delete backups older than 90 days)
[ ] Set up: Google Drive file version history (30-day retention)
```

---

## Backup Inventory

### Critical Systems & Data

| System | Type | Backup | RPO | Notes |
|--------|------|--------|-----|-------|
| Member Directory | Spreadsheet | Manual CSV | 7 days | Contains member records, auth data |
| Reservations | Spreadsheet | Manual CSV | 7 days | Facility bookings, approval status |
| System Backend | Spreadsheet | Manual CSV | 7 days | Config, sessions, audit log, email templates |
| Payment Tracking | Spreadsheet | Manual CSV | 7 days | Payment records, verification status |
| Google Apps Script | Code | GitHub | Continuous | Source code version controlled |
| Portal.html | HTML | GitHub | Continuous | Member portal UI |
| Admin.html | HTML | GitHub | Continuous | Admin portal UI |
| index.html | HTML | GitHub | Continuous | Public website |
| Member photos | Cloud Storage | Auto (GCS lifecycle) | 30 days | Approved member photos |
| Uploaded documents | Drive | Auto (Google backup) | 25 days | Member-submitted documents |

---

## Incident Response

### Failure Detection

**Who notices?**
- Board member unable to access portal
- Member unable to login
- Email notifications fail
- Nightly tasks don't run

**Detection triggers:**
```javascript
// TODO: Implement monitoring
// [ ] Health check endpoint: GET /health
// [ ] Response: {status: "ok", timestamp: "..."}
// [ ] Failure: No response or HTTP error
// [ ] Alert: Email board treasurer on failure
```

### Immediate Actions (First 15 Minutes)

```
1. Confirm the outage is real (not local network issue)
   └─ Try accessing from different device/network
   └─ Check Google Apps Script status: https://status.cloud.google.com

2. Check Google Workspace status page
   └─ Is there a wider outage?
   └─ Check GAS, Drive, Sheets, Calendar status

3. Notify board
   └─ Email subject: "GEA Portal Outage - [TIME]"
   └─ Include: What's down, when noticed, current status
   └─ Action: Check email for board acknowledgment

4. If GAS outage (external)
   └─ No action needed (wait for Google to fix)
   └─ Monitor status page
   └─ Provide updates to board every 30 minutes

5. If data issue (internal)
   └─ Proceed to diagnosis steps
```

### Diagnosis (15 Minutes – 1 Hour)

```
Check 1: Is Google Apps Script responding?
  └─ Try accessing @HEAD deployment
  └─ Try accessing production deployment
  └─ Check browser console (F12) for errors

Check 2: Is Google Sheets API responding?
  └─ Run: Tests.js > testSheetsAPI()
  └─ Check Logs tab in Apps Script editor
  └─ Verify spreadsheet IDs are correct in Config.js

Check 3: Is Gmail API responding?
  └─ Run: Tests.js > testGmailAPI()
  └─ Try sending manual email from Gmail
  └─ Check sent/bounce reports

Check 4: Are authentication/sessions broken?
  └─ Try logging in with test account
  └─ Check Sessions sheet for active sessions
  └─ Verify password hash algorithm is correct

Check 5: Is data corrupted?
  └─ Check Individuals sheet: sample 10 rows
  └─ Check Households sheet: sample 5 rows
  └─ Verify column headers match GEA_System_Schema.md
  └─ Check Audit Log for suspicious activity
```

### Recovery Actions (1 Hour – 4 Hours)

**If data is corrupted:**
```
Option A: Restore from Last Good Backup
1. Download latest backup CSV file
2. Create new spreadsheet: "GEA-RESTORE-YYYY-MM-DD"
3. Import CSV data
4. Verify data integrity:
   └─ Row count matches backup
   └─ Column headers correct
   └─ No truncation or corruption
5. Update Config.js to point to new spreadsheet
6. Test with sample operations (login, book, approve)
7. Once verified, update main spreadsheet references
8. Document: What was recovered, when, what was lost

Option B: Selective Row Restoration
1. Export current (corrupted) sheet to CSV
2. Manually merge with backup CSV
3. Identify rows that were corrupted
4. Restore only those rows from backup
5. Verify changes with audit log
6. Keep original as historical record
```

**If GAS code is corrupted:**
```
1. GAS source is version controlled in GitHub
2. Revert to last known good commit:
   └─ git log --oneline | head -5  (see recent commits)
   └─ Identify good commit hash
   └─ git checkout [COMMIT_HASH]
3. Pull into Apps Script editor (if using clasp):
   └─ clasp pull
4. Verify code looks correct
5. Test critical functions:
   └─ Tests.js > testGetMembers()
   └─ Tests.js > testCreateReservation()
6. If OK, proceed with deployment
```

---

## Recovery Procedures

### Complete Restoration Scenario

```
Scenario: Full data loss (all 4 spreadsheets corrupted/deleted)

Step 1: Assess Damage (0 minutes)
  └─ Confirm all sheets are inaccessible or corrupted
  └─ Check if Google Workspace backup is available
  └─ Locate latest manual backup files

Step 2: Prepare Recovery Environment (5 minutes)
  └─ Create new Google Drive folder: "GEA Recovery - YYYY-MM-DD"
  └─ Create 4 new blank spreadsheets
  └─ Name them: "Members Restore", "Reservations Restore", etc.

Step 3: Restore Data (15-30 minutes)
  └─ Import latest backup CSV files into new spreadsheets
  └─ Verify row counts match expected
  └─ Check column headers against schema
  └─ Spot-check 10 sample rows for integrity

Step 4: Restore Configuration (5 minutes)
  └─ Update Config.js with new spreadsheet IDs
  └─ clasp push to update Apps Script
  └─ Update GitHub with new IDs (for documentation)

Step 5: Validate System (10 minutes)
  └─ Test login: try test account
  └─ Test reservation: try creating test booking
  └─ Test approval: try approving booking
  └─ Test email: verify notification was sent
  └─ Check logs: no errors in execution

Step 6: Notify Stakeholders (5 minutes)
  └─ Email board: "Service restored from backup"
  └─ Include: Recovery time, data recovered, any losses
  └─ Include: Verification tests passed
  └─ Request: Manual verification from 2 board members

Step 7: Decommission Old Spreadsheets (24 hours)
  └─ Keep corrupted sheets archived for 30 days
  └─ If no issues appear, delete permanently
  └─ Verify again that new sheets are working correctly

Total Recovery Time: ~45 minutes (within 4-hour RTO target)
Data Loss: Up to 7 days (latest manual backup)
```

---

## Incident Response Checklist

### Outage Checklist

```
[ ] Confirm outage is real (test from multiple networks/devices)
[ ] Check Google status page for wider outages
[ ] Notify board treasurer immediately
[ ] Document: Time noticed, symptoms, affected services
[ ] Attempt login with test account
[ ] Check Apps Script logs for errors
[ ] Check sheet access (can manually open sheets?)
[ ] Run diagnostic: Tests.js > runDiagnostics()
[ ] Check Audit Log for suspicious activity
[ ] Determine root cause (GAS failure vs data corruption vs GWS outage)
[ ] Execute appropriate recovery procedure
[ ] Test restored system with sample operations
[ ] Verify all features work (login, book, approve, email)
[ ] Document incident: Timeline, cause, resolution, prevention
[ ] Notify board when resolved
[ ] Post-mortem meeting (within 7 days)
```

### Data Corruption Checklist

```
[ ] Identify which sheets are affected
[ ] Check when corruption occurred (query Audit Log)
[ ] Verify backup file is uncorrupted
[ ] Create new sheets with "_RESTORE" suffix
[ ] Import backup data
[ ] Validate data integrity:
    [ ] Row counts
    [ ] Column headers
    [ ] Sample row spot-checks
    [ ] No truncation
    [ ] Timestamps reasonable
[ ] Update Config.js with new sheet IDs
[ ] Test critical paths:
    [ ] Login with test account
    [ ] Create reservation
    [ ] Approve reservation
    [ ] Send email
[ ] Verify audit log shows recovery actions
[ ] Notify board of recovery
[ ] Schedule post-mortem
[ ] Archive corrupted sheets for 30 days
[ ] Delete corrupted sheets after 30 days
```

---

## Testing & Validation

### Quarterly Restoration Test

```
Q1 (Jan-Mar): Test Member Directory restoration
  └─ Download latest backup
  └─ Create test spreadsheet
  └─ Import backup data
  └─ Verify row count
  └─ Spot-check 10 rows
  └─ Calculate hash (MD5 of exported CSV)
  └─ Document results

Q2 (Apr-Jun): Test Reservations restoration
  └─ Same procedure as Q1

Q3 (Jul-Sep): Test System Backend restoration
  └─ Same procedure as Q1
  └─ Verify Configuration sheet has all keys
  └─ Verify Email Templates sheet has all templates

Q4 (Oct-Dec): Test Payment Tracking restoration
  └─ Same procedure as Q1
```

### Annual Full System Restoration Test

```
Once annually (Q4):
  1. Set up isolated Google Drive folder
  2. Create 4 new blank spreadsheets
  3. Restore all 4 backup files
  4. Update test Config.js with new IDs
  5. Deploy to test Apps Script project
  6. Run full integration test:
     └─ Login with test account
     └─ Create new reservation
     └─ Approve reservation
     └─ Submit application
     └─ Approve application
     └─ Verify payment
     └─ Send emails
  7. Document results and time taken
  8. If issues found, fix and re-test
```

---

## Communication Plan

### Outage Notification Template

```
Subject: GEA Portal Outage - [START TIME] GMT+2

Body:
Dear GEA Members,

We are experiencing a temporary outage to the GEA member portal.

Status: [In Progress / Under Investigation / Being Restored]
Expected Resolution: [TIME] GMT+2
Impact: Member portal inaccessible, reservations cannot be made

Current Actions:
- [Action 1]
- [Action 2]

We apologize for the inconvenience. Updates will be provided every 30 minutes.

Questions? Contact: board@geabotswana.org

GEA Administration
```

### Resolution Notification Template

```
Subject: GEA Portal Service Restored

Body:
Dear GEA Members,

The GEA member portal has been restored to normal operation.

Outage Duration: [TIME] GMT+2
Root Cause: [Brief explanation]
Data Recovery: All data has been restored from backup

Normal operations have resumed. You can now:
- Login to portal
- View dashboard
- Make reservations
- Submit applications

If you experience any issues, please contact: board@geabotswana.org

Thank you for your patience.

GEA Administration
```

---

## TODO: Disaster Recovery Infrastructure

```
[ ] Define RTO & RPO targets (currently TBD)
[ ] Establish backup schedule (weekly vs daily)
[ ] Set up automated backups to Cloud Storage
[ ] Implement health check monitoring
[ ] Create incident response runbook (detailed step-by-step)
[ ] Establish escalation procedures (who to contact when)
[ ] Train board member on recovery procedures
[ ] Test annual restoration (before July 31 membership year end)
[ ] Set up monitoring alerts (email on failure)
[ ] Create postmortem template for incidents
[ ] Document lessons learned from incidents
[ ] Update disaster recovery plan annually
```

---

## Related Documentation

- **CLAUDE_Deployment.md** — Rollback procedure, testing, diagnostics
- **CLAUDE_Security.md** — Data protection, access control, audit logging
- **GEA_System_Architecture.md** — System overview, external integrations
- **GEA_System_Schema.md** — Database schema, backup fields (docs/reference/)
- **Audit Log** — Sheet tracking all actions (System Backend spreadsheet)

---

**Last Updated:** March 4, 2026
**Status:** 50% Ready (basic framework + TODOs)
**Source:** Extracted from CLAUDE.md lines 1289–1310 with expanded detail
