# Disaster Recovery Setup Guide

**Status:** Implementation Checklist
**Last Updated:** May 9, 2026
**Purpose:** One-time setup required to activate disaster recovery infrastructure

---

## Overview

The GEA system now has automated disaster recovery infrastructure. This guide walks through the ONE-TIME setup required to activate it.

**Total Setup Time:** ~1 hour
**Who Can Do This:** Treasurer or Board member with Google Workspace access

---

## Setup Checklist

### Phase 1: Initialize Incident Log Sheet (5 minutes)

**Goal:** Create structured tracking sheet for incidents

**Steps:**

1. Open [Google Apps Script Editor](https://script.google.com)
   - Select the GEA project

2. From function dropdown, select: `initializeIncidentLog()`

3. Click Run ▶️

4. Check the Logs:
   - View → Logs (Ctrl+Enter)
   - Should see: ✅ "Created Incident Log: GEA Incident Log [YEAR]"

5. Verify in Google Drive:
   - Go to Google Drive
   - Look for folder: "Financial Records"
   - Inside should see: "GEA Incident Log [YEAR]" spreadsheet
   - Has columns: Date | Time | Description | Impact | Resolution | Duration | Root Cause | Lessons Learned

**✅ Phase 1 Complete**

---

### Phase 2: Set Up Time-Based Triggers (10 minutes)

**Goal:** Configure automated daily backup and health checks

**Prerequisites:**
- Apps Script editor open
- Project deployed (should already be done)

**Steps:**

1. Open [Apps Script Editor](https://script.google.com)
   - Select the GEA project

2. Click: Triggers ⏲️ (left sidebar, looks like a clock)

3. Click: **+ Create trigger** (bottom right)

4. **Trigger #1: Daily Backup**
   ```
   Choose the function to run: runNightlyTasks()
   Which deployment should run: Head
   Select event source: Time-driven
   Select type of time based trigger: Day timer
   Select hour: 2 AM
   Select minute interval: 00:00 - 01:00
   Timezone: Africa/Johannesburg (GMT+2)
   ```
   - Click: Save

5. Create another trigger:
   Click: **+ Create trigger**

6. **Trigger #2: Daily Health Check**
   ```
   Choose the function to run: healthCheck()
   Which deployment should run: Head
   Select event source: Time-driven
   Select type of time based trigger: Day timer
   Select hour: 4 AM
   Select minute interval: 00:00 - 01:00
   Timezone: Africa/Johannesburg (GMT+2)
   ```
   - Click: Save

7. Verify triggers are created:
   - You should see both in the Triggers list:
     - runNightlyTasks() — Daily 2:00 AM
     - healthCheck() — Daily 4:00 AM

**⚠️ Important Notes:**
- First backup will run at 2:00 AM after setup
- First health check will run at 4:00 AM after setup
- Check email the next morning for health check results
- Check Google Drive "GEA Backups" folder for exported files

**✅ Phase 2 Complete**

---

### Phase 3: Configure Backup Storage Location (10 minutes)

**Goal:** Set up where backups are stored and retained

**Current Setup:**
- Backups are exported to Google Drive folder: "GEA Backups"
- Automatic cleanup: Files older than 30 days are deleted
- Format: `GEA_[SheetType]_[YYYY-MM-DD].xlsx`

**What You Need To Do:**

**Option A: Keep Current Setup (Recommended for now)**
- No action needed
- Backups stored in Google Drive "GEA Backups" folder
- Works immediately with existing infrastructure

**Option B: Migrate to Cloud Storage (Advanced)**
- Requires Google Cloud Storage bucket setup
- Requires service account with Cloud Storage permissions
- More scalable for large deployments
- See: [Google Cloud Storage Setup Guide](#appendix-cloud-storage-setup) below

**For now, proceed with Option A (Google Drive backups)**

✅ Phase 3 Complete

---

### Phase 4: Test Health Check (5 minutes)

**Goal:** Verify health check runs without errors

**Steps:**

1. Open Apps Script Editor

2. From function dropdown, select: `healthCheck()`

3. Click Run ▶️

4. Check Logs:
   - View → Logs (Ctrl+Enter)
   - Should see one of:
     - ✅ "Health check PASSED"
     - ⚠️ "Health check FAILED" (but this is OK for testing)

5. Expected output:
   ```
   ✅ Health check PASSED at 2026-05-09T12:34:56.789Z
   ```

**Note:** If health check fails, this is expected if you're running it manually outside of scheduled window. The important thing is that the function ran without throwing an error.

**✅ Phase 4 Complete**

---

### Phase 5: Test Backup Export (10 minutes)

**Goal:** Verify backup function works

**Steps:**

1. Open Apps Script Editor

2. From function dropdown, select: `performDailyBackup()`

3. Click Run ▶️

4. Check Logs:
   - View → Logs (Ctrl+Enter)
   - Should see:
     ```
     ✅ Backed up Members → GEA_Members_YYYY-MM-DD.xlsx
     ✅ Backed up Reservations → GEA_Reservations_YYYY-MM-DD.xlsx
     ✅ Backed up Payments → GEA_Payments_YYYY-MM-DD.xlsx
     ✅ Backed up System → GEA_System_YYYY-MM-DD.xlsx
     ```

5. Verify backup files created:
   - Go to Google Drive
   - Look for folder: "GEA Backups"
   - Should see 4 new .xlsx files with today's date

6. Verify cleanup works:
   - Files older than 30 days are in trash

**✅ Phase 5 Complete**

---

### Phase 6: Test Diagnostic Function (10 minutes)

**Goal:** Verify runDiagnostics() works for troubleshooting

**Steps:**

1. Open Apps Script Editor

2. From function dropdown, select: `runDiagnostics()`

3. Click Run ▶️

4. Check Logs:
   - View → Logs (Ctrl+Enter)
   - Should see comprehensive test results:
     ```
     === GEA SYSTEM DIAGNOSTICS ===

     TEST 1: Sheets API (Critical Sheets)
     ✅ Member Directory (...): OK
     ✅ Reservations (...): OK
     ✅ System Backend (...): OK
     ✅ Payments (...): OK

     TEST 2: Gmail API
     ✅ Gmail accessible, [N] messages remaining

     ... [more tests] ...

     === SUMMARY ===
     Tests run: 6
     Passed: 6
     Failed: 0
     (6 core tests: Sheets API, Gmail API, Cloud Storage, Sessions, Data Integrity, Audit Log)
     ✅ No critical issues detected
     ```

5. Bookmark this in your browser as emergency diagnostic procedure

**✅ Phase 6 Complete**

---

### Phase 7: Prepare Emergency Documentation (10 minutes)

**Goal:** Print and post key emergency information

**Steps:**

1. Print this document:
   - [DISASTER_RECOVERY_RUNBOOK.md](./DISASTER_RECOVERY_RUNBOOK.md)
   - Print section: "Quick Reference (KEEP AT DESK)"

2. Post printed copy:
   - Treasurer's desk
   - Board meeting room
   - Any place Treasurer frequents

3. Fill in contact information on printed copy:
   - Treasurer name and phone
   - Board chair name and phone
   - Google Cloud status page URL
   - Your Google Drive backup folder link

4. Keep digital copy:
   - Bookmark in browser: [DISASTER_RECOVERY_RUNBOOK.md](./DISASTER_RECOVERY_RUNBOOK.md)
   - Save locally on computer as PDF

**✅ Phase 7 Complete**

---

### Phase 8: Train Team (10 minutes)

**Goal:** Ensure 2+ people know how to respond

**What to cover:**

1. **Where to find help:**
   - [DISASTER_RECOVERY_RUNBOOK.md](./DISASTER_RECOVERY_RUNBOOK.md) in docs/operational/
   - Apps Script runDiagnostics() function

2. **How to respond to outage:**
   - Confirm outage is real
   - Check Google Cloud status
   - Notify board
   - Run diagnostics
   - Follow recovery procedures

3. **Where backups are stored:**
   - Google Drive folder: "GEA Backups"
   - Contains 4 .xlsx files from previous day

4. **What to do if unsure:**
   - Run `runDiagnostics()` from Apps Script
   - Email board@geabotswana.org with diagnostic output
   - Contact Claude Code / developer

**✅ Phase 8 Complete**

---

## Verification Checklist

Use this to verify everything is working:

```
INCIDENT LOG SHEET
[ ] "GEA Incident Log [YEAR]" exists in Financial Records folder
[ ] Has 8 columns: Date, Time, Description, Impact, Resolution, Duration, Root Cause, Lessons Learned

TIME-BASED TRIGGERS
[ ] runNightlyTasks() trigger exists, scheduled for 2:00 AM
[ ] healthCheck() trigger exists, scheduled for 4:00 AM
[ ] Both have timezone set to Africa/Johannesburg

BACKUP FUNCTIONALITY
[ ] performDailyBackup() runs without errors
[ ] Creates 4 .xlsx files in "GEA Backups" folder
[ ] Backup files have today's date in filename
[ ] Old backups (30+ days) are cleaned up

HEALTH CHECK FUNCTIONALITY
[ ] healthCheck() runs without errors
[ ] Reports pass/fail status for each system component
[ ] Logs result to Audit Log

DIAGNOSTIC FUNCTION
[ ] runDiagnostics() can be run manually
[ ] Reports 7 test results
[ ] Clearly indicates PASS/FAIL for each test

DOCUMENTATION
[ ] DISASTER_RECOVERY_RUNBOOK.md is accessible
[ ] Quick reference page is printed and posted
[ ] Team has been trained on procedures
```

---

## Monitoring After Setup

### Daily Checks (After First Week)

**Day 1 (2:00 AM):**
- Check Google Drive "GEA Backups" folder
- Verify 4 new .xlsx files were created

**Day 1 (4:00 AM):**
- Check email for health check result
- Should be from Apps Script (noreply@...)
- If health check failed, check Apps Script logs

**Day 2-7:**
- Same as Day 1
- Get used to seeing consistent backup and health check results

### Monthly Verification

**Every month, just one quick check:**
- Open Google Drive "GEA Backups" folder
- Verify files are there from yesterday
- Pick random .xlsx file and download to spot-check it's valid

**If anything looks wrong:**
- Run `runDiagnostics()` manually
- Share the diagnostic output with board@geabotswana.org

### Quarterly Testing

**Last week of each quarter (March, June, Sept, Dec):**
- Treasurer + One Board Member: 30 minutes
- Download backup file and verify data integrity
- See [DISASTER_RECOVERY_RUNBOOK.md - Quarterly Backup Test](./DISASTER_RECOVERY_RUNBOOK.md)

### Annual Full System Test

**November (before year-end):**
- Full 2-3 hour restoration test
- See [DISASTER_RECOVERY_RUNBOOK.md - Annual Full System Test](./DISASTER_RECOVERY_RUNBOOK.md)

---

## Troubleshooting

### Problem: Triggers aren't firing

**Symptom:** No backup files appear in "GEA Backups" folder

**Solution:**
1. Check trigger settings:
   - Apps Script → Triggers ⏲️
   - Verify runNightlyTasks() is listed
   - Verify time is set to 2:00 AM
   - Verify timezone is Africa/Johannesburg

2. Check Apps Script execution:
   - Apps Script → Execution (⏱️ icon)
   - Look for recent executions
   - If not listed, trigger hasn't fired yet

3. Manual test:
   - Select runNightlyTasks() from dropdown
   - Click Run ▶️
   - Check Logs for output

### Problem: Backup files aren't created

**Symptom:** performDailyBackup() runs but no files in "GEA Backups"

**Solution:**
1. Check "GEA Backups" folder exists:
   - Go to Google Drive
   - Search for "GEA Backups" folder
   - If not found, manually create it

2. Check spreadsheet IDs in Config.js:
   - All 4 IDs should be valid
   - Should be able to open each sheet manually

3. Test export manually:
   - Select performDailyBackup() from dropdown
   - Click Run ▶️
   - Check for errors in Logs

### Problem: Health check failing

**Symptom:** Email alert says health check failed

**Solution:**
1. Run runDiagnostics() to see what's broken
2. Follow recovery procedures in DISASTER_RECOVERY_RUNBOOK.md
3. Email board@geabotswana.org with diagnostic results

---

## Rollback (If Something Goes Wrong)

If you need to revert changes:

```bash
git revert HEAD  # Revert last commit
git push        # Push revert
```

The system will revert to state before disaster recovery setup.

However, disaster recovery is non-intrusive and can be disabled safely by:
- Deleting triggers in Apps Script
- Deleting DisasterRecoveryService.js file
- Everything else continues to work normally

---

## Appendix: Cloud Storage Setup (Advanced)

If you want to use Google Cloud Storage for backups instead of Google Drive:

1. **Create Cloud Storage Bucket**
   ```
   gsutil mb gs://gea-backup-bucket
   ```

2. **Set Lifecycle Policy** (auto-delete old backups)
   ```
   gsutil lifecycle set - gs://gea-backup-bucket
   ```

3. **Update DisasterRecoveryService.js**
   - Change performDailyBackup() to use Cloud Storage API
   - Instead of DriveApp, use CloudStorageApp or UrlFetchApp to Google Cloud API

4. **Set IAM Permissions**
   - Give Apps Script service account: `Storage Object Creator` role
   - Scope: Specific bucket `gs://gea-backup-bucket`

**Note:** This is optional. Google Drive backups work fine for GEA's current scale.

---

## Next Steps After Setup

1. **Monitor daily** (first week)
   - Check backups are created at 2:00 AM
   - Check health check runs at 4:00 AM

2. **Test quarterly** (March, June, Sept, Dec)
   - Download backup file
   - Verify data integrity

3. **Test annually** (November)
   - Full system restoration test
   - See [DISASTER_RECOVERY_RUNBOOK.md](./DISASTER_RECOVERY_RUNBOOK.md)

4. **Review incident log** (quarterly)
   - Treasurer reviews incidents each quarter
   - Identify patterns

5. **Update runbook** (annually)
   - If procedures change, update DISASTER_RECOVERY_RUNBOOK.md
   - Keep all documents current

---

## Support

**Questions or issues?**
- Email: board@geabotswana.org
- Reference: [DISASTER_RECOVERY_RUNBOOK.md](./DISASTER_RECOVERY_RUNBOOK.md)
- Attach diagnostic output from `runDiagnostics()`

**Document Location:** `/docs/operational/DISASTER_RECOVERY_SETUP_GUIDE.md`

---

**Setup Status:** Ready to implement
**Estimated Total Time:** 1 hour
**Recommended Date:** Before next membership year begins
