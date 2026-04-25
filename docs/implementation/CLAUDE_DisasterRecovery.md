# Disaster Recovery Implementation Guide

**Last Updated:** March 2026

Backup procedures, recovery testing, incident response, and restoration playbooks for the GEA system.

---

## Disaster Recovery Objectives

### RTO & RPO Targets

```
RTO (Recovery Time Objective): 24 hours (1 business day)
  └─ GEA can afford to be unavailable for up to 1 day
  └─ Maximum time to restore service after failure

RPO (Recovery Point Objective): 24 hours (1 day of data)
  └─ GEA can afford to lose up to 1 day of data
  └─ Daily automated backups are sufficient for GEA's needs
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

### Automated Backup Infrastructure

**Target:** Google Sheets data only (Member Directory, Reservations, Payments, Guest Lists)

**Frequency:** Daily at 2:00 AM Botswana time (before 3 AM exchange rate update)

**Method:** Apps Script time-based trigger exports sheets to Cloud Storage as .xlsx files

**File Naming:**
- `GEA_MemberDirectory_[YYYY-MM-DD].xlsx`
- `GEA_Reservations_[YYYY-MM-DD].xlsx`
- `GEA_Payments_[YYYY-MM-DD].xlsx`
- `GEA_GuestLists_[YYYY-MM-DD].xlsx`

**Retention:** Rolling 30-day retention (older backups auto-deleted)

**Storage Location:** Google Cloud Storage (gea-public-assets bucket or dedicated backup bucket)

**Note:**
- GitHub code is already version-controlled (no backup needed)
- Cloud Storage images have Google redundancy (no backup needed)
- Apps Script creates files in Cloud Storage using automated trigger

---

## Backup Inventory

### Critical Systems & Data

| System | Type | Backup | RPO | Notes |
|--------|------|--------|-----|-------|
| Member Directory | Spreadsheet | Automated Cloud Storage (.xlsx) | 24 hours | Daily at 2 AM Botswana time |
| Reservations | Spreadsheet | Automated Cloud Storage (.xlsx) | 24 hours | Daily at 2 AM Botswana time |
| System Backend | Spreadsheet | Automated Cloud Storage (.xlsx) | 24 hours | Config, sessions, audit log, email templates |
| Payments | Spreadsheet | Automated Cloud Storage (.xlsx) | 24 hours | Payment records, verification status |
| Guest Lists | Spreadsheet | Automated Cloud Storage (.xlsx) | 24 hours | Event guest lists per reservation |
| Google Apps Script | Code | GitHub | Continuous | Source code version controlled |
| Portal.html | HTML | GitHub | Continuous | Member portal UI |
| Admin.html | HTML | GitHub | Continuous | Admin portal UI |
| index.html | HTML | GitHub | Continuous | Public website |
| Member photos | Cloud Storage | Google-managed encryption | Continuous | Approved member photos, encrypted at rest |
| Uploaded documents | Drive | Google-managed backup | 25 days | Member-submitted documents |

---

## Incident Response

### Failure Detection

**Who notices?**
- Board member unable to access portal
- Member unable to login
- Email notifications fail
- Nightly tasks don't run

**Detection triggers:**

1. **Daily Health Check** — Automated Apps Script function
   - Frequency: Daily at 4:00 AM Botswana time (after backup completes)
   - What: Test reading from Member Directory sheet
   - Failure: Sheet read fails or returns error
   - Alert: If health check fails 3+ times in 1 hour, email Treasurer + board@geabotswana.org

2. **Manual Monitoring Option**
   - Alternative: Monthly manual check (Treasurer clicks through each portal, verifies load)
   - Note: No traditional GET /health endpoint needed (portals are Apps Script web apps, not servers)

3. **Exchange Rate Fetch Monitoring**
   - Frequency: Daily at 3:00 AM Botswana time
   - Failure: API call to exchangerate-api.com fails
   - Alert: Email Treasurer with error details if fetch fails

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

Total Recovery Time: ~45 minutes (within 24-hour RTO target)
Data Loss: Up to 24 hours (daily automated backup)
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

### Quarterly Restoration Testing

**Schedule:** Last week of March, June, September, December

**Who:** Treasurer + one Board member

**Procedure:**
1. Download one backup file from Cloud Storage (rotate which sheet each quarter)
2. Create temp test spreadsheet
3. Import backup data into test sheet
4. Validate data integrity:
   - Verify row count matches expected
   - Spot-check 10 random rows against current production
   - Verify column headers match GEA_System_Schema.md
5. Document results in brief test report
6. File report in Financial Records folder

**Success Criteria:** Data matches current production exactly

**Time Allocation:** 30 minutes per quarter

### Annual Full System Restoration Test

**Schedule:** November (Q4, before year-end)

**Procedure:**
1. Restore all backup sheets from Cloud Storage into test spreadsheet
2. Test accessing portals:
   - Verify Apps Script web app loads and responds
   - Try test login
3. Verify GitHub repo:
   - All current code committed
   - Latest version deployed
4. Verify Cloud Storage images:
   - Approved member photos accessible
   - No permission errors
5. Document results and time taken
6. If any issues, fix and re-test

**Success Criteria:** All sheets restore correctly, portals load, GitHub current, images accessible

**Time Allocation:** 2-3 hours

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

## Incident Response Procedures

### Detection & Notification

**Method:** Email alerts only (no Slack or complex systems)

**Alert Triggers:**
- Daily health check fails (Apps Script sheet connectivity)
- Automated backup fails (Cloud Storage write error)
- Exchange rate fetch fails (exchangerate-api.com API call)

**Alert Thresholds:** Trigger immediately on failure (no threshold delay)

**Recipients:** Treasurer + board@geabotswana.org

**Escalation:** If alert repeats within 1 hour, send escalation email

### Response Process

**Immediate Actions (First 15 minutes):**
1. Treasurer receives alert email
2. Confirm outage is real (not local network issue)
3. Check Google Workspace status page for wider outages
4. Email board with situation summary
5. If GAS outage (external): Monitor status page, provide updates every 30 min
6. If data issue (internal): Proceed to diagnosis

**Diagnosis (15 minutes – 1 hour):**
1. Run Tests.js > runDiagnostics() in Apps Script editor
2. Check Apps Script execution logs
3. Verify spreadsheet IDs in Config.js are correct
4. Try logging in with test account
5. Check Audit Log for suspicious activity
6. Determine root cause (GAS failure vs data corruption vs GWS outage)

**Recovery & Communication (1 hour – 24 hours):**
1. Execute appropriate recovery procedure (see "Complete Restoration Scenario" above)
2. Test restored system with sample operations
3. Document incident: Timeline, cause, resolution, prevention
4. Email board when resolved with resolution summary
5. Schedule post-mortem meeting within 7 days

### Postmortem Process

**Trigger:** After any incident is resolved

**Documentation (within 24 hours):**
- Treasurer documents:
  - What failed
  - When detected
  - How fixed
  - Duration of downtime
  - Root cause
  - Prevention for future

**Review:** Board reviews postmortem at next monthly meeting

**Improvement:** Update runbook if procedures need adjustment

**Archive:** Store postmortem in Financial Records folder

### Incident Log

**Storage:** Simple Google Sheet in Financial Records folder

**Columns:** Date | Time | Description | Impact | Resolution | Duration (minutes) | Lessons Learned

**Retention:** Keep for 3 years (matches financial record retention)

**Review:** Treasurer reviews at end of each quarter to identify patterns

---

## Related Documentation

- **CLAUDE_Deployment.md** — Rollback procedure, testing, diagnostics
- **CLAUDE_Security.md** — Data protection, access control, audit logging
- **GEA_System_Architecture.md** — System overview, external integrations
- **GEA_System_Schema.md** — Database schema, backup fields (docs/reference/)
- **Audit Log** — Sheet tracking all actions (System Backend spreadsheet)

---

**Last Updated:** March 6, 2026
**Status:** ✅ Complete (All disaster recovery infrastructure resolved)
**Source:** IMPLEMENTATION_TODO_CHECKLIST.md Phase 2 & 3 resolutions
