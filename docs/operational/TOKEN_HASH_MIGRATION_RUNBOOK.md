# Token Hash Migration Runbook

**Purpose:** Deploy the session token hashing feature safely from plain-text to SHA256-hashed tokens.

**Scope:** One-time migration to transition Sessions sheet from storing plain-text tokens to hashed tokens.

**Risk Level:** Medium (requires schema change + one-time function execution)

**Rollback:** Invalidate new sessions and revert to plain-text tokens (manual schema restore required)

---

## Background

### What's Changing

**Before:** Session tokens stored as plain-text in Sessions sheet
- Risk: Anyone with sheet access can read tokens and impersonate sessions

**After:** Session tokens stored as SHA256 hashes
- Sessions sheet column: `token` → `token_hash`
- Validation: Hash presented token, compare hashes (constant-time)
- Benefit: Immediate session replay prevented

### Code Already Deployed

- ✅ `AuthService.js` updated (hashing functions, constant-time comparison)
- ✅ `_hashToken()` function created
- ✅ `validateSession()` updated to use token_hash
- ✅ `invalidateAllSessionsForTokenHashMigration()` function available
- ⚠️ **Code is NOT backward-compatible.** Must deploy in correct order (see Deployment Order below)

### ⚠️ CRITICAL: Deployment Order

**Code must be deployed AFTER schema changes, not before.**

- ❌ If you `clasp push` before adding token_hash column:
  - `validateSession()` will look for non-existent token_hash column
  - Session validation will fail for all users
  - Login will break

- ✅ Correct order:
  1. Add token_hash column to Sessions sheet
  2. THEN run `clasp push` to deploy code
  3. THEN run `invalidateAllSessionsForTokenHashMigration()`

---

## Prerequisites

Before starting migration, ensure:

- [ ] You have access to GEA System Backend spreadsheet (Sheets)
- [ ] You have access to Google Apps Script editor (GEA project)
- [ ] You have access to GEA Member Directory spreadsheet (to verify no Sessions sheet there)
- [ ] Current date/time noted (for before/after verification)
- [ ] All users notified that they will need to re-login (sessions will be invalidated)
- [ ] Backup created of GEA System Backend spreadsheet (File → Version history, or download as Excel)
- [ ] No active sessions you need to preserve (all current sessions will be cleared)

---

## Preflight Checklist

**Run these checks BEFORE making any schema changes:**

### 1. Verify Sessions Tab Exists and Has Correct Structure

```
Location: GEA System Backend spreadsheet
Tab: Sessions
Expected columns:
  - session_id
  - token (plain-text, will be renamed)
  - email
  - role
  - created_at
  - expires_at
  - active
```

**Check:**
1. Open GEA System Backend → Sessions tab
2. Verify header row contains column named exactly `token`
3. Count columns (should be 7 total)
4. Document current row count (for before/after comparison)

**Expected Result:** Column `token` exists, contains plain-text session tokens

### 2. Verify No token_hash Column Exists Yet

**Check:**
1. Scroll right in Sessions tab
2. Confirm NO column named `token_hash` exists
3. If it does exist and is empty, skip to Step 1 of deployment

**Expected Result:** No `token_hash` column

### 3. Check Apps Script Code Compatibility

**Check:**
1. Open Google Apps Script editor (GEA project)
2. Open `AuthService.js`
3. Search for `_hashToken` function (Ctrl+F)
4. Verify function exists and contains byte-to-hex conversion code

**Expected Result:** `_hashToken()` function found and complete

### 4. Backup Current Sessions

**Check:**
1. In GEA System Backend, select Sessions tab
2. Select all data (Ctrl+A)
3. Copy to a new sheet named `Sessions_Backup_YYYY-MM-DD`
4. Or: Download entire spreadsheet as Excel (.xlsx)

**Expected Result:** Backup sheet created with current session data

### 5. Document Active Users

**Check:**
1. In Sessions tab, filter for `active = TRUE`
2. Count rows (number of active sessions)
3. Note any sessions you expect (e.g., test accounts)

**Expected Result:** Known baseline of active sessions before invalidation

---

## Deployment Steps

**CRITICAL ORDER:** Schema → Code → Migration

### Step 1: Rename Sessions Column (Schema Change) ← DO THIS FIRST

1. Open GEA System Backend spreadsheet
2. Go to Sessions tab
3. Click on column header `token`
4. Right-click → **Insert 1 to the right**
   - This creates a buffer to avoid accidental data loss
5. In the new empty column header, type: `token_hash`
6. Now you have both `token` (old) and `token_hash` (new, empty)
7. **Do NOT delete the `token` column yet** (we'll deprecate it later)

**Verification:**
- [ ] `token_hash` column exists and is empty
- [ ] `token` column still exists with all plain-text values
- [ ] No data loss

### Step 2: Deploy Updated Code ← DO THIS SECOND

1. In terminal, from repository root:
   ```bash
   clasp push
   ```
2. Confirm the push completes successfully
3. Code is now live and can find `token_hash` column

**Expected Result:** AuthService.js changes deployed

**Verification:**
- [ ] Push succeeds with no errors
- [ ] Open Apps Script editor, verify `_hashToken()` function exists
- [ ] Check Logs tab (Ctrl+Enter) for any errors from push

### Step 3: Run Migration Function in Apps Script ← DO THIS THIRD

1. Open Google Apps Script editor (GEA project)
2. In the **Functions** dropdown (top), select: `invalidateAllSessionsForTokenHashMigration`
3. Click **Run** button
4. **Allow permissions** if prompted (Gmail, Sheets)
5. Wait for execution to complete (should be < 5 seconds)
6. Check **Logs** tab (Ctrl+Enter) for success message:
   ```
   SUCCESS: Invalidated X sessions for token hash migration
   ```

**What This Does:**
- Scans Sessions sheet
- Sets `active = FALSE` for all current rows (invalidates all sessions)
- Does NOT touch token or token_hash columns

**Expected Result:** All sessions marked inactive, users must re-login

**Verification:**
- [ ] Logs show success message
- [ ] No errors in Logs tab
- [ ] In Sheets, Sessions tab shows `active = FALSE` for all rows

### Step 4: Verify Deployment (Functional Test)

1. Open GEA Portal or Admin interface in a new browser window
2. **Log in** with a test account (e.g., board@geabotswana.org)
3. Observe behavior:
   - Login should succeed
   - New session row appears in Sessions tab
   - New session row has `token_hash` column populated
   - `token` column in new row is empty (old code path not used)

**Expected Result:**
- [ ] Login succeeds
- [ ] Sessions tab shows new row with token_hash populated
- [ ] No errors in Apps Script Logs

### Step 5: Clean Up Old `token` Column (Optional, After Confidence)

Wait at least 24 hours or one full business day after Step 4 before removing the old `token` column.

**When ready:**
1. In Sessions tab, right-click on `token` column header
2. Select **Delete column**
3. Confirm deletion

**Why wait?** Ensures no edge case uses old token column, provides rollback window.

---

## Post-Migration Verification

After all steps complete, run this verification checklist:

- [ ] All users can log in (no auth errors in Apps Script Logs)
- [ ] New sessions have `token_hash` populated
- [ ] Sessions tab no longer has plain-text tokens visible
- [ ] Admin interface loads without errors
- [ ] Member Portal loads without errors
- [ ] Session timeouts work (24-hour or custom timeout)
- [ ] Logout clears sessions correctly
- [ ] No errors in Apps Script Logs (run a few test logins)

**Success Criteria:** Users can log in, sessions created with hashes, no auth errors.

---

## Validation Helper Functions

After deployment, use these read-only helpers to verify state:

### Check if Migration Completed

In Apps Script editor, create a test function:

```javascript
function validateTokenHashMigration() {
  var sheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID)
    .getSheetByName(TAB_SESSIONS);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  var hasTokenHash = headers.indexOf("token_hash") !== -1;
  var tokenIndex = headers.indexOf("token");

  Logger.log("=== Token Hash Migration Status ===");
  Logger.log("token_hash column exists: " + hasTokenHash);
  Logger.log("token column still exists: " + (tokenIndex !== -1));

  if (hasTokenHash) {
    var data = sheet.getDataRange().getValues();
    var newSessions = 0;
    var oldActiveSessions = 0;

    for (var i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf("active")] === true) {
        if (data[i][headers.indexOf("token_hash")] &&
            !data[i][tokenIndex]) {
          newSessions++;
        }
      }
      if (data[i][tokenIndex] && data[i][headers.indexOf("active")] === true) {
        oldActiveSessions++;
      }
    }

    Logger.log("Active sessions with token_hash: " + newSessions);
    Logger.log("Active sessions with old token column: " + oldActiveSessions);
    Logger.log("⚠️ WARNING: " + oldActiveSessions +
              " active sessions still using old token column");
  } else {
    Logger.log("ERROR: token_hash column not found!");
  }

  Logger.log("=== Recommendation ===");
  if (hasTokenHash && oldActiveSessions === 0) {
    Logger.log("✅ Migration complete. Safe to delete old 'token' column.");
  } else if (hasTokenHash) {
    Logger.log("⏳ Migration in progress. Re-run invalidation or wait for sessions to expire.");
  } else {
    Logger.log("❌ Migration not started. Run invalidateAllSessionsForTokenHashMigration()");
  }
}
```

**Run this helper:**
1. Copy the function into `AuthService.js` or `Tests.js`
2. Run it from Apps Script editor
3. Check Logs tab for migration status

---

## Rollback Procedure (If Migration Fails)

If something goes wrong, rollback is possible but manual:

### Option 1: Revert to Old Code (Fastest)

1. In Git, check out previous commit before token hashing:
   ```bash
   git log --oneline | grep -i "hash session"  # Find the commit
   git revert <COMMIT_HASH>
   clasp push
   ```
2. Restore Sessions sheet backup from Step 4 of Preflight
3. Users can log in again with old plain-text sessions
4. Investigate what went wrong before trying again

### Option 2: Keep New Code, Restore Old Session Data

If new code is good but migration had issues:

1. Delete the `token_hash` column from Sessions tab
2. Restore Sessions sheet from backup (File → Version history)
3. Re-run the migration more carefully

---

## Deployment Checklist (For Ops Runbook)

Use this checklist for actual deployment day:

```
PRE-DEPLOYMENT:
- [ ] Backup created of GEA System Backend spreadsheet
- [ ] All team members notified of re-login requirement
- [ ] No critical sessions active (test/demo accounts only)
- [ ] Checked: token_hash column does not exist yet
- [ ] Checked: token column exists and has plain-text tokens
- [ ] Verified Apps Script has _hashToken() function

DEPLOYMENT:
- [ ] Added token_hash column to Sessions sheet
- [ ] Ran invalidateAllSessionsForTokenHashMigration() function
- [ ] Ran clasp push
- [ ] Verified Logs show success
- [ ] Tested login with test account
- [ ] Verified new session row has token_hash populated
- [ ] Checked: No errors in Apps Script Logs

POST-DEPLOYMENT (24+ hours later):
- [ ] All users able to log in
- [ ] No auth errors in Logs
- [ ] All new sessions using token_hash
- [ ] Deleted old 'token' column (optional)
- [ ] Ran validateTokenHashMigration() helper
- [ ] Confirmed: ✅ Migration complete
```

---

## Monitoring After Deployment

For the first 24 hours after migration:

1. **Check Apps Script Logs** every few hours
   - Filter for errors in `validateSession()`, `login()`, `logout()`
2. **Monitor Sessions sheet**
   - Verify new logins create rows with token_hash
   - Ensure no plain-text tokens appearing in new rows
3. **User feedback**
   - Ask team if login/logout working as expected
   - Investigate any "session expired" errors

---

## See Also

- `AuthService.js` — Session validation code
- `CLAUDE.md` — Session security documentation
- `SESSION_SUMMARY_2026-03-08_SECURITY_HARDENING.md` — Context for this migration
- [GEA Deployment Best Practices](./DEPLOYMENT_CHECKLIST.md) (TBD)

---

**Last Updated:** March 8, 2026
**Maintainer:** Development Team
**Status:** Ready for deployment
**Risk:** Medium (schema change, all users re-login)
**Rollback:** Manual (revert to old code or restore backup)
