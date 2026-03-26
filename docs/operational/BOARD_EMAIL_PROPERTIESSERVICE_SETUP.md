# Board Email Service Account Setup (PropertiesService)

**Purpose:** Document how the GEA Apps Script service account private key is securely stored and initialized.

**Status:** Current approach (as of March 2026)

---

## Overview

The service account private key is **no longer stored in BoardEmailConfig.gs** (or any file in the repository). Instead, it's stored securely in **PropertiesService**, which is Google Apps Script's built-in secure storage mechanism.

### Why This Approach?

- **Never in version control:** Private keys should never be in Git history, even in `.claspignore` files
- **Survives clasp operations:** PropertiesService persists across all `clasp push/pull` operations
- **One-time setup:** After initial configuration, the key is stored indefinitely without re-entry
- **More secure:** Reduces exposure compared to file-based storage

---

## Initial Setup (One Time Only)

### Prerequisites

- Access to Google Apps Script editor (https://script.google.com)
- Service account JSON credentials (from Google Cloud Console)
- The service account must have:
  - **Domain-Wide Delegation** enabled
  - **Gmail API scope** pre-consented in Workspace Admin console

### Setup Steps

1. **Open Google Apps Script Editor**
   - https://script.google.com
   - Open the GEA project

2. **Get Service Account JSON**
   - Go to Google Cloud Console: https://console.cloud.google.com/
   - Project: `gea-association-platform`
   - Service Accounts → `gea-apps-script@gea-association-platform.iam.gserviceaccount.com`
   - Keys tab → Create new key (JSON)
   - Copy the entire JSON object

3. **Initialize in Apps Script**
   - In the Google Apps Script editor console (View > Logs), run:
   ```javascript
   initializeBoardServiceAccount({
     "type": "service_account",
     "project_id": "gea-association-platform",
     "private_key_id": "...",        // from JSON
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",  // from JSON
     "client_email": "gea-apps-script@gea-association-platform.iam.gserviceaccount.com",
     "client_id": "...",             // from JSON
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/gea-apps-script%40gea-association-platform.iam.gserviceaccount.com"
   });
   ```

4. **Verify Success**
   - Check the Logs tab: Should see `"Successfully stored Board service account credentials in PropertiesService"`
   - Done! The key is now securely stored and will survive all clasp operations

---

## Verification

To verify the credentials are stored:

```javascript
var account = _getBoardServiceAccount();
if (account) {
  Logger.log("Service account is initialized");
  Logger.log("Email: " + account.client_email);
} else {
  Logger.log("Service account not initialized");
}
```

---

## If You Need to Change the Key

1. Get the new service account JSON from Google Cloud Console (generate a new key)
2. Run `initializeBoardServiceAccount()` again with the new JSON
3. The old key is automatically replaced in PropertiesService
4. No code changes required

---

## Recovery (If Key Is Lost)

The key is safe in PropertiesService and will **NOT** be lost by:
- `clasp push` or `clasp pull`
- Browser refresh or Apps Script editor close
- Cloning the repo to a new machine

However, if you need to verify it's still there or re-initialize:

```javascript
// Check if stored
var account = _getBoardServiceAccount();
if (!account) {
  Logger.log("Key is missing - run initializeBoardServiceAccount() again");
}
```

---

## Configuration Values in Code

The following values are stored in **Config.js** (not secrets, safe to commit):

```javascript
var BOARD_EMAIL_TO_SEND_FROM = "board@geabotswana.org";
var BOARD_EMAIL_DISPLAY_NAME = "Gaborone Employee Association";
var BOARD_EMAIL_DELEGATED_USER = "treasurer@geabotswana.org";
var BOARD_SERVICE_ACCOUNT_EMAIL = "";  // Fallback only; actual value comes from PropertiesService
```

---

## How It Works (Technical Details)

1. **initializeBoardServiceAccount()** in EmailService.js stores the JSON in PropertiesService
2. **_getBoardServiceAccount()** retrieves the JSON when needed
3. **sendEmailFromBoard()** uses the retrieved account to generate JWT tokens for email delegation
4. The private key never exists in any file after initialization

---

## See Also

- `EmailService.js` — Contains `initializeBoardServiceAccount()` and `_getBoardServiceAccount()`
- `Config.js` — Email configuration values
- `BOARD_EMAIL_SECRET_RECOVERY.md` — Disaster recovery procedures
- [PropertiesService Documentation](https://developers.google.com/apps-script/reference/properties/properties-service)

---

**Last Updated:** March 26, 2026
