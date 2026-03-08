# Board Email Secret Recovery Runbook

**Purpose:** Restore board-email signing capability after disaster, rebuild, or maintainer handoff.

**Scope:** Recovery and management of the GEA Apps Script service account private key used for Domain-Wide Delegation signing.

**⚠️ CRITICAL:** This secret is **NOT stored in Git or deployed via clasp**. It exists only in the Apps Script project editor.

---

## What Is and Isn't in Git

### ❌ NOT in Git (Intentionally Out-of-Band)
- `BoardEmailConfig.gs` — Contains the raw service account JSON key (private_key field)
- `.claspignore` excludes this file from `clasp push` / `clasp pull`
- The private key never leaves the Apps Script project

### ✅ In Git (For Reference Only)
- `EmailService.js` — References `BOARD_SERVICE_ACCOUNT` and `BOARD_EMAIL_DELEGATED_USER`
- `appsscript.json` — OAuth scope: `gmail.send`
- `.claspignore` — Documents that `BoardEmailConfig.gs` is intentionally excluded

### Why Out-of-Band?
Google Cloud private keys should never be committed to version control. This design:
- Prevents accidental key exposure in Git history
- Requires explicit action to restore after rebuilds
- Ensures key lives only in the GAS project editor

---

## Prerequisites

Before following this runbook, ensure:
- [ ] Access to GEA Apps Script editor (google.com → Apps Script → GEA project)
- [ ] Access to Google Cloud Console (GCP project: `gea-association-platform`)
- [ ] Service account exists: `gea-apps-script@gea-association-platform.iam.gserviceaccount.com`
- [ ] Service account has Domain-Wide Delegation enabled
- [ ] Workspace Admin Console access (to verify OAuth scope consent)
- [ ] Current BoardEmailConfig.gs backed up (if one exists)

---

## Recovery Procedure (If Secret Lost)

### Step 1: Generate New Service Account Key

1. Open Google Cloud Console: https://console.cloud.google.com/
2. Project: **gea-association-platform**
3. Navigate: **Service Accounts** (left menu)
4. Click: `gea-apps-script@gea-association-platform.iam.gserviceaccount.com`
5. Tab: **Keys**
6. Button: **Add Key** → **Create new key** → **JSON**
7. Download the JSON file (save as `service-account-key.json` locally)

### Step 2: Extract Private Key

1. Open downloaded `service-account-key.json` in a text editor
2. Copy the entire JSON object (from `{` to `}`)
3. Keep secure (do NOT commit to Git)

### Step 3: Create BoardEmailConfig.gs in Apps Script Editor

1. Open Google Apps Script: https://script.google.com
2. Open GEA project
3. File menu: **New** → **Script file**
4. Name: `BoardEmailConfig`
5. Paste the following template (replace with actual values from service account key):

```javascript
/**
 * BOARD EMAIL SERVICE ACCOUNT CONFIGURATION
 *
 * ⚠️ THIS FILE IS NOT VERSION CONTROLLED
 * Stored only in the Apps Script project editor
 * Excluded from Git (see .claspignore)
 */

var BOARD_SERVICE_ACCOUNT = {
  "type": "service_account",
  "project_id": "gea-association-platform",
  "private_key_id": "KEY_ID_FROM_JSON",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n",
  "client_email": "gea-apps-script@gea-association-platform.iam.gserviceaccount.com",
  "client_id": "CLIENT_ID_FROM_JSON",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
};

var BOARD_EMAIL_TO_SEND_FROM = "board@geabotswana.org";
var BOARD_EMAIL_DELEGATED_USER = "treasurer@geabotswana.org";
```

6. Replace placeholders with actual values from the JSON key:
   - `private_key_id` → `private_key_id` field
   - `private_key` → `private_key` field (keep the newline escape sequences as-is)
   - `client_id` → `client_id` field

### Step 4: Verify OAuth Scope Consent

1. Open Google Workspace Admin Console: https://admin.google.com
2. Navigate: **Security** → **Access and data control** → **API controls**
3. Verify `gea-apps-script` service account has pre-consent for:
   - `https://www.googleapis.com/auth/gmail.send`

If missing:
1. Click **Manage third-party & internal access**
2. Find `gea-apps-script`
3. Grant scope: `gmail.send`

### Step 5: Test Email Delivery

1. In Google Apps Script editor, open **Tests.js** or create a new test function
2. Create a test function:
```javascript
function testBoardEmailRecovery() {
  // sendEmailFromBoard(templateId, recipient, variables)
  var result = sendEmailFromBoard(
    "tpl_001",  // Template ID (or any valid template)
    "treasurer@geabotswana.org",
    {
      FIRST_NAME: "Test User",
      MEMBER_NAME: "Test"
    }
  );
  Logger.log("Email sent: " + result);
  if (!result) {
    Logger.log("ERROR: Email failed. Check BoardEmailConfig.gs exists.");
  }
}
```
3. Run the function (Apps Script editor: Run button)
4. Check Logs tab for success message: `Email sent: true`
5. Verify email arrives in treasurer's inbox as **incoming mail** (not sent folder)

**Note:** Use an actual template ID (e.g., `tpl_001` for "New Reservation") or check `getEmailTemplate()` for available IDs. The variables must match the template's placeholders.

---

## Verification Checklist

After recovery, verify:

- [ ] `BoardEmailConfig.gs` exists in Apps Script project
- [ ] `BOARD_SERVICE_ACCOUNT` object contains valid JSON structure
- [ ] `private_key` field starts with `-----BEGIN PRIVATE KEY-----`
- [ ] `BOARD_EMAIL_DELEGATED_USER` is set to `treasurer@geabotswana.org`
- [ ] Service account key is NOT in any Git history
- [ ] `.claspignore` includes `BoardEmailConfig.gs`
- [ ] Test function `testBoardEmailRecovery()` succeeds
- [ ] Test email arrives in treasurer's inbox as incoming (not sent)
- [ ] No errors in Apps Script Logs tab

**Success:** Email sent FROM board@geabotswana.org, received by treasurer as incoming mail.

---

## Rollback / Disable

If board email functionality needs to be disabled:

1. In Google Apps Script, delete or comment out `BoardEmailConfig.gs`
2. Any call to `sendEmailFromBoard()` will fail gracefully (returns error)
3. No code changes required (EmailService.js checks if config exists)

---

## Maintainer Handoff Procedure

When passing responsibility for this system to another person:

1. **Document the secret location:** Point them to this runbook
2. **Do NOT share the key via email or chat**
3. **Instead:** Grant them access to Google Cloud Console (Service Account keys management)
4. **Have them generate a new key** (rotate the key during handoff for security)
5. **Verify they can follow Step 1-5** (they should create BoardEmailConfig.gs themselves)
6. **Run test function together** to confirm success

---

## Disaster Recovery: Full System Rebuild

If rebuilding the entire Apps Script project from Git:

1. Clone/deploy all code from Git (`clasp push`)
2. **Do NOT expect BoardEmailConfig.gs to exist** (it's not in Git)
3. Run this recovery procedure to restore the secret
4. Test with `testBoardEmailRecovery()`
5. Verify membership application emails still work

---

## Troubleshooting

### Error: "Invalid JWT"
- **Cause:** Private key corrupted or malformed
- **Fix:** Re-download service account key from GCP, recreate BoardEmailConfig.gs

### Error: "Service account not authorized"
- **Cause:** Service account missing Gmail.send scope or Domain-Wide Delegation
- **Fix:**
  1. Check GCP: Service account has Domain-Wide Delegation enabled
  2. Check Workspace Admin: OAuth scope `gmail.send` is pre-consented

### Email not arriving
- **Cause:** `BOARD_EMAIL_DELEGATED_USER` incorrect or Send As delegation not configured
- **Fix:**
  1. Verify treasurer@geabotswana.org exists in Workspace
  2. Check Gmail settings: treasurer account must have Send As delegation to board@geabotswana.org
  3. Ask treasurer to open Gmail settings and confirm Send As is configured

### BoardEmailConfig.gs keeps getting deleted
- **Cause:** Clasp pull/push accidentally overwriting it
- **Fix:** Ensure `.claspignore` contains `BoardEmailConfig.gs` and never run `clasp push -f` (force)

---

## Key Contacts

- **Service Account Admin:** GCP project admin
- **Workspace Admin:** IT/admin contact for OAuth scope changes
- **Treasurer Account:** treasurer@geabotswana.org (Send As delegation)

---

## See Also

- `EmailService.js` — Email delivery code
- `appsscript.json` — OAuth scopes
- `.claspignore` — Files excluded from clasp
- [Google Cloud Service Account Docs](https://cloud.google.com/iam/docs/service-accounts)
- [Gmail API Domain-Wide Delegation](https://developers.google.com/identity/protocols/oauth2/service-account#delegatingauthority)

---

**Last Updated:** March 8, 2026
**Maintainer:** Development Team
**Status:** Operational (ready for production use)
