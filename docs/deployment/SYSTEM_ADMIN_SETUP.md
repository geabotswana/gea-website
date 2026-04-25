# System Administrator Setup Guide

**Last Updated:** April 25, 2026

Complete step-by-step guide for setting up the GEA Management System from scratch, including Google Apps Script, spreadsheets, GitHub deployment, and initial configuration.

---

## Prerequisites

Before starting, ensure you have:

1. **Google Workspace account** (admin@geabotswana.org or equivalent)
2. **GitHub account** with write access to geabotswana/gea-website repository
3. **Google Apps Script experience** (basic familiarity with GAS editor)
4. **Access to Google Drive** (to create and manage spreadsheets)
5. **Gmail account** (for email forwarding setup)
6. **Terminal/command line** (for git operations and GitHub Actions)

---

## Step 1: Create Google Apps Script Project

### 1.1 Create New GAS Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click **New Project** (top left)
3. Name it: `GEA Management System`
4. Click **Create**

### 1.2 Get Project Details

In the GAS editor:
1. Click **Project Settings** (left sidebar)
2. Copy the **Script ID** (looks like: `1Abc...XyZ`)
3. Note the **Timezone:** Must be Africa/Johannesburg (set in Project Settings)
4. Save this Script ID for later

### 1.3 Update Code.gs with Base Functions

1. In the GAS editor, select **Code.gs** (or create it)
2. Add the base function to enable web app deployment:

```javascript
function doGet(e) {
  return HtmlService.createHtmlOutput('GEA System Initialized');
}

function doPost(e) {
  return doGet(e);
}
```

3. Click **Save**

---

## Step 2: Clone Repository and Set Up Local Environment

### 2.1 Clone from GitHub

```bash
cd /home/user
git clone https://github.com/geabotswana/gea-website.git
cd gea-website
```

### 2.2 Create .clasp.json

In the root directory, create `.clasp.json`:

```json
{
  "scriptId": "YOUR_SCRIPT_ID_HERE",
  "rootDir": "./src"
}
```

Replace `YOUR_SCRIPT_ID_HERE` with the Script ID from Step 1.2.

### 2.3 Install Dependencies

```bash
npm install
npm install -g @google/clasp
```

### 2.4 Authenticate with Google

```bash
clasp login
```

Follow the prompts to authorize clasp to access your Google account.

---

## Step 3: Create Google Sheets Spreadsheets

You'll create 4 spreadsheets with 18 tabs total. Use these as templates:

### 3.1 Create Master Directory Spreadsheet

**File Name:** `GEA Master Directory`

**Tabs (5 total):**
1. **Households** - Member households
2. **Individuals** - Individual members
3. **File Submissions** - Document/photo uploads (2-tier approval)
4. **Membership Applications** - Application workflow tracking
5. **Membership Levels** - Category definitions

See [docs/reference/GEA_System_Schema.md](../reference/GEA_System_Schema.md) for complete column definitions.

### 3.2 Create Reservations Spreadsheet

**File Name:** `GEA Reservations`

**Tabs (4 total):**
1. **Reservations** - Booking records
2. **Guest Lists** - Event guest lists
3. **Guest Profiles** - Individual guest information
4. **Usage Tracking** - Limit tracking (tennis hours, Leobo bookings)

### 3.3 Create System Backend Spreadsheet

**File Name:** `GEA System Backend`

**Tabs (6 total):**
1. **Configuration** - Runtime settings (exchange rates, feature flags, thresholds)
2. **Email Templates** - 114 email templates by category
3. **Sessions** - Active user sessions (token, expiration, IP)
4. **Administrators** - Board/RSO accounts and permissions
5. **Audit Log** - Complete action trail (timestamp, user, action, target, details)
6. **Holiday Calendar** - Holidays/office closures

### 3.4 Create Payment Tracking Spreadsheet

**File Name:** `GEA Payment Tracking`

**Tabs (3 total):**
1. **Payments** - Payment submission and verification records
2. **Membership Pricing** - Category dues amounts
3. **Rates** - Currency exchange rates (USD/BWP)

### 3.5 Get Spreadsheet IDs

For each spreadsheet:
1. Open the sheet in Google Drive
2. Copy the ID from the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
3. Save all 4 IDs (you'll need them in Config.js)

---

## Step 4: Update Config.js with Spreadsheet IDs

Open `src/Config.js` and update:

```javascript
const SPREADSHEET_IDS = {
  MASTER_DIRECTORY: 'PASTE_MASTER_DIRECTORY_ID_HERE',
  RESERVATIONS: 'PASTE_RESERVATIONS_ID_HERE',
  SYSTEM_BACKEND: 'PASTE_SYSTEM_BACKEND_ID_HERE',
  PAYMENT_TRACKING: 'PASTE_PAYMENT_TRACKING_ID_HERE',
};
```

Also verify:
- **TIMEZONE:** `'Africa/Johannesburg'`
- **DOMAIN:** `'geabotswana.org'`
- **GOOGLE_APPS_SCRIPT_DEPLOYMENT_ID:** Leave for now, will update after first deployment

---

## Step 5: Create Google Cloud Project (for Google APIs)

### 5.1 Create GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a **New Project** (top of sidebar)
3. Name it: `GEA Management`
4. Wait for creation to complete

### 5.2 Enable Required APIs

In the GCP project:
1. Click **Enable APIs and Services** (top)
2. Search for and enable:
   - Google Sheets API
   - Gmail API
   - Google Drive API

### 5.3 Link GAS Project to GCP

In GAS editor:
1. Click **Project Settings**
2. Scroll to **Google Cloud Platform (GCP) Project**
3. Copy your GCP **Project ID**
4. GAS will link automatically (may show "Associated GCP project")

---

## Step 6: Set Up GitHub Actions for Automated Deployment

### 6.1 Add GitHub Secrets

In GitHub repository settings:

1. Go to **Settings** → **Secrets and Variables** → **Actions**
2. Add these secrets:

| Secret | Value |
|--------|-------|
| GAS_SCRIPT_ID | Script ID from Step 1.2 |
| GAS_DEPLOYMENT_ID | Will add after first manual push |
| CLASP_TOKEN | From `clasp login` (stored at `~/.clasprc.json`) |

To get CLASP_TOKEN:
```bash
cat ~/.clasprc.json
# Copy the entire contents as the secret value
```

### 6.2 Initial Manual Push (to Generate Deployment)

First deployment must be manual:

```bash
clasp push
```

This creates the GAS deployment. Then:

1. Go to **Deploy** (GAS editor, top right)
2. Click **New Deployment** → Type: **Web App**
3. Execute as: Your admin email
4. Who has access: **Anyone**
5. Click **Deploy**
6. Copy the **Deployment ID** from the dialog

### 6.3 Add Deployment ID to GitHub Secret

Back in GitHub:
1. Go to **Settings** → **Secrets and Variables** → **Actions**
2. Add secret: `GAS_DEPLOYMENT_ID` = (value from step 6.2)

### 6.4 Verify GitHub Actions Workflows

Check `.github/workflows/`:
- `update-deployment-metadata.yml` - Updates version metadata
- `deploy.yml` - Deploys to GAS (triggers after metadata update)

Both workflows should auto-trigger on push to main.

---

## Step 7: Initialize Configuration Tab

In the `GEA System Backend` spreadsheet, create the **Configuration** tab with these initial values:

| Setting | Value | Description |
|---------|-------|-------------|
| EXCHANGE_RATE_USD_TO_BWP | 13.5 | Current rate (updated nightly) |
| SESSION_TIMEOUT_HOURS | 24 | Session expiration time |
| TENNIS_HOURS_PER_WEEK | 3 | Weekly limit |
| TENNIS_HOURS_PER_SESSION | 2 | Per-booking limit |
| LEOBO_BOOKINGS_PER_MONTH | 1 | Monthly limit |
| EMAIL_FROM_ADDRESS | board@geabotswana.org | Sender email |
| FEATURE_FLAG_RSO_PORTAL | TRUE | RSO authenticated portal enabled |
| FEATURE_FLAG_GUEST_LISTS | TRUE | Guest list system enabled |
| PASSWORD_HASH_ALGORITHM | SHA256 | Hash method |
| MAX_FILE_SIZE_MB | 10 | File upload limit |
| DAYS_TO_EXPIRE_FILES | 90 | Document expiration threshold |

These can be updated at runtime without redeploying code.

---

## Step 8: Set Up Email Forwarding

### 8.1 Configure Gmail Forwarding

1. Go to Gmail settings for board@geabotswana.org
2. **Forwarding and POP/IMAP** tab
3. Add forwarding to your primary admin email
4. Add these filters for GEA system emails:
   - From: noreply@script.google.com → Label: "GEA System"
   - Subject: "Payment Verification" → Label: "GEA Payments"
   - Subject: "Application Status" → Label: "GEA Applications"

### 8.2 Test Email Sending

In GAS editor:
1. Run the **testEmailSending()** function
2. Check Cloud Logs for success messages
3. Verify email received in board@geabotswana.org inbox

---

## Step 9: Initialize Admin Accounts

In the **Administrators** tab of `GEA System Backend`:

Create rows for:

| Email | Name | Role | Status |
|-------|------|------|--------|
| admin@geabotswana.org | Admin Name | board | active |
| treasurer@geabotswana.org | Treasurer | board | active |
| rso@geabotswana.org | RSO Reviewer | rso_approve | active |
| rso_notify@geabotswana.org | RSO Calendar | rso_notify | active |

These accounts can log in to Admin.html with passwords set during first login.

---

## Step 10: Create Holiday Calendar

In the **Holiday Calendar** tab of `GEA System Backend`:

Add entries for:
- National holidays (Botswana)
- Office closures
- Embassy closures
- Extended breaks

Format:

| Date | Holiday | Notes |
|------|---------|-------|
| 2026-05-25 | Africa Day | Public holiday |
| 2026-12-25 | Christmas | Office closed |
| 2026-12-26 | Boxing Day | Office closed |

---

## Step 11: Initialize Email Templates

In the **Email Templates** tab of `GEA System Backend`:

Copy all 114 templates from [docs/reference/EMAIL_TEMPLATES_REFERENCE.md](../reference/EMAIL_TEMPLATES_REFERENCE.md).

Each template should have:
- **template_id** - Unique identifier (e.g., `MEM_APPLICATION_RECEIVED`)
- **category** - One of: ADM, DOC, MEM, PAY, RES, SYS
- **subject** - Email subject line
- **body** - HTML email body with {{VARIABLE}} placeholders
- **active** - TRUE/FALSE to enable/disable

---

## Step 12: Load CSV Exports (Optional)

If starting with existing member data:

1. Download CSV exports from [docs/spreadsheets/](../spreadsheets/)
2. In each sheet, select tab → **File** → **Import range** or paste data
3. Verify data integrity (check for duplicates, missing values)

If starting fresh, skip this step (sheet structures alone are sufficient).

---

## Step 13: Run Diagnostic Tests

In GAS editor, run these functions to verify setup:

### 13.1 Basic Diagnostics

```javascript
runDiagnostics()
```

This checks:
- All spreadsheets accessible
- All tabs exist with correct columns
- Configuration tab values loaded
- Email templates loaded
- Admin accounts configured

**Expected Output:** "✅ All systems operational"

### 13.2 Test Each Service Module

Run individual tests:
- `testGetMembers()` - Member service
- `testCreateReservation()` - Reservation service
- `testEmailSending()` - Email service
- `testMembershipApplication()` - Application service
- `testPaymentSubmission()` - Payment service

Each should output "✅ Test passed" or show specific errors.

---

## Step 14: Deploy to Production

### 14.1 Prepare for Deployment

1. Verify all code committed to git
2. All tests passing
3. Configuration verified
4. Email forwarding tested

### 14.2 Deploy GAS

Option A (Automatic - recommended):
```bash
git add .
git commit -m "Initial system setup"
git push -u origin main
```

GitHub Actions will auto-deploy after metadata workflow completes.

Option B (Manual):
```bash
clasp push
```

Then create new deployment in GAS editor (Deploy → New Deployment).

### 14.3 Test Production Deployment

1. Visit production URL: `https://script.google.com/a/macros/geabotswana.org/s/{DEPLOYMENT_ID}/exec`
2. You should see the Portal.html login page
3. Log in with first board admin account
4. Verify all pages load

---

## Step 15: Backup and Monitoring Setup

### 15.1 Enable Spreadsheet Backups

1. For each spreadsheet: **File** → **Version history**
2. Enable "Keep version history" (default: 100 versions)

### 15.2 Set Up Audit Logging

Verify **Audit Log** tab is recording:
- Every login
- Every action (approve, deny, submit, etc.)
- User email, timestamp, IP address, details

### 15.3 Enable Cloud Logging

In GAS editor:
1. Go to **Cloud Logs** (bottom of editor)
2. Verify logs are being written (check for function executions)
3. Set up email alerts for errors (via GCP Cloud Logging)

---

## Step 16: Documentation & Knowledge Transfer

### 16.1 Distribute Key Documents

Provide to admin team:
- BOARD_OPERATIONS_GUIDE.md - Daily board operations
- MEMBER_PORTAL_GUIDE.md - Member feature reference
- TROUBLESHOOTING.md - Common issues and fixes
- SERVICE_MODULES.md - Technical reference

### 16.2 Initial Training

Run training session covering:
- Where key spreadsheets are located
- How to access Admin.html dashboard
- How to approve/deny applications
- How to verify payments
- How to handle common issues
- Where to find help (TROUBLESHOOTING.md, docs/, email)

### 16.3 Ongoing Maintenance

Assign responsibility for:
- **Weekly:** Check Admin dashboard for pending items
- **Monthly:** Review audit logs, generate reports
- **Quarterly:** Update exchange rates, review feature flags
- **As-needed:** Update email templates, adjust limits, handle issues

---

## Troubleshooting Setup Issues

### "Script ID not found"
- Verify .clasp.json has correct Script ID
- Try: `clasp pull` to sync latest from GAS

### "Spreadsheet not accessible"
- Verify Google account has Drive access
- Check spreadsheet is shared with admin account
- Verify ID is copied correctly (no spaces)

### "Email sending fails"
- Check Gmail forwarding set up
- Verify email address in Config.js is correct
- Run `testEmailSending()` to debug

### "GitHub Actions deploy fails"
- Check GAS_SCRIPT_ID and GAS_DEPLOYMENT_ID secrets
- Verify CLASP_TOKEN is current (may expire)
- Re-run: `clasp login` and update secret

### "Portal shows 'Server error'"
- Check Cloud Logs in GAS editor
- Verify all spreadsheets are accessible
- Check Configuration tab has required settings
- Verify Admin.html and Portal.html files exist

---

## Post-Setup Checklist

- [ ] GAS project created and linked to GCP
- [ ] 4 spreadsheets created with correct tabs
- [ ] Config.js updated with all Spreadsheet IDs
- [ ] GitHub secrets configured (GAS_SCRIPT_ID, GAS_DEPLOYMENT_ID, CLASP_TOKEN)
- [ ] First GAS deployment created manually
- [ ] Configuration tab initialized with settings
- [ ] Email forwarding configured
- [ ] Admin accounts created in Administrators tab
- [ ] Holiday Calendar populated
- [ ] Email Templates imported (114 templates)
- [ ] All diagnostic tests passing
- [ ] Production URL tested and working
- [ ] Audit logging verified
- [ ] Team trained on basic operations
- [ ] Documentation distributed

---

## Maintenance & Updates

### Weekly Maintenance
- Monitor Admin dashboard for pending items
- Check for email errors in Cloud Logs
- Verify all integrations still working

### Monthly Maintenance
- Review Audit Log for suspicious activity
- Generate member and payment reports
- Check for expired sessions/data

### Quarterly Maintenance
- Update exchange rates in Configuration tab
- Review and test all email templates
- Audit user access levels

### On-Demand
- Update facility limits in Configuration
- Adjust feature flags for A/B testing
- Manage holidays in Holiday Calendar

---

## Emergency Contacts

**System Down:**
- Check Cloud Logs for errors
- Verify Google APIs still enabled
- Restart GAS deployment (redeploy same version)

**Data Corruption:**
- Check version history in spreadsheets
- Restore from previous version if needed
- Review Audit Log for what happened

**Security Issue:**
- Immediately disable affected user accounts
- Review recent Audit Log entries
- Change passwords for admin accounts
- Contact Google Workspace support

---

## Additional Resources

- [CLAUDE.md](../../CLAUDE.md) - Quick reference for developers
- [SERVICE_MODULES.md](../SERVICE_MODULES.md) - Detailed module reference
- [GEA_System_Schema.md](../reference/GEA_System_Schema.md) - Database schema
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedures
- [GITHUB_ACTIONS_DEPLOYMENT_GUIDE.md](./GITHUB_ACTIONS_DEPLOYMENT_GUIDE.md) - Automated deployment

---

**Setup Estimated Time:** 4-6 hours
**Difficulty Level:** Intermediate (requires Google Apps Script knowledge)
**Last Updated:** April 25, 2026
