# Deployment & Release Management Implementation Guide

Development workflow, testing procedures, deployment strategies, and troubleshooting for the GEA system.

---

## Common Development Tasks

### Deploy Code Changes

```bash
clasp push                    # Push all code changes to @HEAD
```

**Important:** HTML files (Portal.html, Admin.html) deploy as @HEAD and take effect immediately. JavaScript changes require `clasp push`.

### Run Tests & Diagnostics

```
# In Google Apps Script editor:
1. Functions tab → Select function name → Run
2. View results in Logs or Stack Trace

Key test functions:
- testGetMembers() → List all members from Individuals sheet
- runDiagnostics() → Check spreadsheet connections and API endpoints
- Tests.js has 10+ utility test functions
```

### Check Logs

```bash
clasp logs  # View console.log() output from recent executions
```

---

## Development & Testing Workflow

### Push to @HEAD (Testing)

```bash
clasp push                    # Updates Code.js, services, Config.js, HTML files to @HEAD
```

**Behavior:**
- @HEAD deployment updates immediately with all changes
- Used for development, testing, and QA
- Portal/Admin accessible via @HEAD URL for testing
- Changes visible within 30-60 seconds

**Testing Process:**
1. Make local code changes
2. Run `clasp push`
3. Test via @HEAD URL: `https://script.google.com/a/macros/geabotswana.org/s/{@HEAD_DEPLOYMENT_ID}/exec`
4. Review Google Apps Script editor logs: `clasp logs`
5. Fix any issues and repeat

### Versioned Deployment (Production)

```
Created manually when code is ready for production
Website uses a specific versioned deployment ID (not @HEAD)
Manual deployment via Google Apps Script editor or `clasp deployments`
Version info recorded in Config.js header for tracking
```

---

## Script & Deployment IDs

### Google Apps Script Project

**Script ID:** `1mkzpnNfUm-ZTW-G6wEdGg4Jt1KiChOXrV5qjBNkm3eqx43Yn-7Z-2Ffv`

### Deployments

**@HEAD (Testing):**
- ID: `AKfycbxMFqbzFg-X-GDOpvllmnXNOY0Zw-WzHnn05PKDR4pYe0ULZ_qX8deWKIbO45AZBz6-`
- Used for development & testing
- Updates immediately with each `clasp push`
- Accessible at: `https://script.google.com/a/macros/geabotswana.org/s/{@HEAD_DEPLOYMENT_ID}/exec`

**Versioned Deployment (Production):**
- ID: `AKfycbw7DG2PpLUK9zrAQt9IVF35eQM7U-C3HUFyZIoQo7ChGB10xK5NuJRdUJpVrBjDwuAQ`
- Used on geabotswana.org website
- Does NOT update automatically; updates only on manual deployment
- Update frequency: Create new versioned deployment when Phase 1/2/3 features are production-ready

---

## Domain & Access Control

### Testing (@HEAD)

```
Portal: https://script.google.com/a/macros/geabotswana.org/s/{@HEAD_DEPLOYMENT_ID}/exec
Admin:  Same URL with ?action=serve_admin
```

### Production (Versioned)

```
Embedded in www.geabotswana.org via iframe or direct link
Portal: https://script.google.com/a/macros/geabotswana.org/s/{PROD_DEPLOYMENT_ID}/exec
Admin:  Same URL with ?action=serve_admin
```

### Access Control

```
- ANYONE_ANONYMOUS (no login required to reach login screen)
- Auth handled by login form → session token required for all operations
- No IP-based restrictions (accessible globally)
- Session tokens expire after 24 hours of inactivity
```

---

## Deployment Process

### When Ready for Production

```
1. Test all changes thoroughly on @HEAD
   ├─ Run full test suite: Tests.js → runDiagnostics()
   ├─ Test critical flows: login, reservation, application
   ├─ Verify nightly tasks run successfully
   ├─ Check error logs: clasp logs | grep ERROR
   └─ Get board approval for major changes

2. Create new versioned deployment via Google Apps Script editor:
   ├─ Editor → Deploy → New deployment
   ├─ Select type "Web app"
   ├─ Record deployment ID
   └─ Update Config.js with new deployment ID

3. Update website (geabotswana.org) with new deployment URL
   ├─ Edit member.html iframe src=...
   ├─ Test member portal link from website
   ├─ Verify login works via geabotswana.org/member.html

4. Update Config.js with version number & deployment ID
   ├─ Version format: v1.0.0, v1.1.0 (Major.Minor.Patch)
   ├─ Add deployment date comment
   └─ Example: // v1.1.0 - March 4, 2026 - [DEPLOYMENT_ID]

5. Commit to GitHub with deployment notes
   ├─ Message: "Deploy v1.1.0 to production - [DEPLOYMENT_ID]"
   ├─ Include changes summary
   └─ Tag release: git tag v1.1.0 && git push --tags
```

### Version Numbering

```
Format: Major.Minor.Patch (e.g., v1.0.0, v1.1.0)

- Major: Breaking changes (API changes, schema migrations)
- Minor: New features, enhancements (without breaking existing)
- Patch: Bug fixes, minor updates

Examples:
- v1.0.0 → Initial production release
- v1.1.0 → Added membership application workflow
- v1.1.1 → Fixed reservation approval email bug
- v2.0.0 → Major refactor of authentication system
```

---

## Testing & Diagnostics

### Test Data Available

```
Test household: HSH-2026-TEST01 (Johnson Family)
Test individual: IND-2026-TEST01 (Jane Johnson)
  Email: jane@example.com
  Password: TestPass123!
  Role: member

Test member for admin: board@geabotswana.org
  Password: [Set by board member]
  Role: board

** DELETE before production go-live **
```

### Debugging Strategies

```
1. Use Logs
   └─ clasp logs → See all console.log() output
   └─ Google Apps Script editor Logs tab

2. Check Audit Log
   └─ Every action logged (query by timestamp, user_email, action_type)
   └─ Useful for tracing user actions and errors

3. Run diagnostics
   └─ Tests.js has runDiagnostics() function
   └─ Checks spreadsheet connections and API endpoints
   └─ Validates schema integrity

4. Check Session
   └─ Is token valid? Check Sessions tab by token
   └─ Is role authorized? Check requireAuth() calls
   └─ Is token expired? Check login_timestamp + 24 hours

5. Verify data
   └─ Query relevant sheet (Households, Individuals, Reservations, etc.)
   └─ Use Utilities.getCellValue() or direct Sheet API calls
   └─ Check for missing or malformed data
```

### Common Error Codes

| Error Code | Meaning | Solution |
|-----------|---------|----------|
| `AUTH_REQUIRED` | No token provided or token missing | Include `p.token` in API call |
| `AUTH_FAILED` | Token invalid or expired | User must log in again |
| `FORBIDDEN` | Token valid but user doesn't have required role | Check user's role in Sessions |
| `NOT_FOUND` | Member/household/reservation not found | Verify ID exists in sheet |
| `INVALID_PARAM` | Parameter validation failed | Check required parameters |
| `SERVER_ERROR` | Unhandled exception | Check logs for stack trace |

### Running Specific Test Functions

```javascript
// In Google Apps Script editor, run these tests:

function testGetMembers() {
  var members = MemberService.getMembersByHousehold("HSH-2026-TEST01");
  console.log("Members:", members);
  // Should return array of individuals in household
}

function testCreateReservation() {
  var result = ReservationService.createReservation({
    household_id: "HSH-2026-TEST01",
    facility: "Tennis",
    reservation_date: "2026-03-10",
    start_time: "14:00",
    end_time: "15:30",
    submitted_by_email: "jane@example.com"
  });
  console.log("Reservation:", result);
  // Should create reservation and return reservation_id
}

function testEmailSending() {
  var result = EmailService.sendEmail(
    "tpl_001",  // Template ID
    "jane@example.com",
    {FIRST_NAME: "Jane", FACILITY: "Tennis"}
  );
  console.log("Email result:", result);
  // Should return success confirmation
}

function runDiagnostics() {
  // Comprehensive system check
  console.log("Checking spreadsheet connections...");
  checkAllSheets();
  console.log("Validating schema integrity...");
  validateSchemaIntegrity();
  console.log("Diagnostics complete");
}
```

---

## Rollback Procedure

### If Production Deployment Has Issues

```
1. IMMEDIATE (within minutes)
   ├─ Notify board of issue
   ├─ Disable access if necessary (set website offline)
   └─ Do NOT make changes to production deployment

2. IDENTIFY ROOT CAUSE
   ├─ Check logs: clasp logs | grep ERROR
   ├─ Test issue scenario on @HEAD
   ├─ Determine if data corruption occurred
   └─ Document issue details

3. ROLLBACK OPTIONS

   Option A: Revert to Previous Deployment (Fastest)
   ├─ Update member.html iframe to previous deployment ID
   ├─ Test login and basic flows
   ├─ Notify board: "Rolled back to v[X.Y.Z]"
   └─ Time to restore: 5 minutes

   Option B: Hot Fix on @HEAD → New Deployment (If issue minor)
   ├─ Fix issue on @HEAD (clasp push)
   ├─ Test thoroughly
   ├─ Create new versioned deployment
   ├─ Update website
   └─ Time to restore: 30-60 minutes

4. COMMUNICATE
   ├─ Board: Issue description, root cause, fix status
   ├─ Email notif: "Service restored to normal operation"
   └─ Document incident: add to Incident Log

5. POST-MORTEM
   ├─ Schedule review meeting
   ├─ Identify how issue was introduced
   ├─ Improve testing/QA to prevent similar issues
   └─ Update documentation if needed
```

---

## GitHub Deployment Workflow (Public Website)

### Public Website (geabotswana.org)

**URL:** https://geabotswana.org
**Repository:** https://github.com/geabotswana/gea-website
**Hosting:** GitHub Pages (automatic deployment on each push)

### Files Deployed

```
index.html             — Single-page website with 6 sections
member.html            — Member portal wrapper (iframe embedding)
CNAME                  — Custom domain configuration
.gitignore             — Excludes member data (*.xlsx), credentials (.clasp.json)
Code.js, *.js          — GAS source code backed up in repo
Portal.html, Admin.html — Member and admin interfaces backed up in repo
```

### Deployment Workflow

```
1. Make changes to index.html (or other website files)

2. Commit to git:
   git add index.html
   git commit -m "Update website"
   git push origin main

3. GitHub Pages auto-deploys (live within 1-2 minutes)
   └─ No manual deployment step needed
   └─ Check site at https://geabotswana.org

4. Test member login link in website
   └─ Should point to current production deployment
   └─ member.html iframe src= must match current deployment ID
```

### Important: Prevent Website from Being Pushed to GAS

```
Use .claspignore to exclude index.html from clasp push:

// .claspignore
index.html
member.html

This prevents website from being accidentally pushed to Google Apps Script
Only GAS source files should go to Apps Script project
```

---

## Nightly Task Verification

### Critical Nightly Tasks (Run at 2:00 AM GMT+2)

These tasks MUST complete successfully every night:

```javascript
NotificationService.runNightlyTasks() executes:
├─ Membership renewals (30-day, 7-day warnings)
├─ Document expiration alerts (6-month passport warnings)
├─ Guest list deadline reminders
├─ Session purge (delete expired sessions)
├─ Bump window expiration (promote tentative to confirmed)
└─ Usage tracking reset (Tennis weekly, Leobo monthly)
```

### Verifying Nightly Task Execution

```
1. Check Logs After 2:00 AM GMT+2
   └─ clasp logs | grep "runNightlyTasks"
   └─ Should see: "Nightly tasks completed at [TIMESTAMP]"

2. Verify Session Cleanup
   └─ Count rows in Sessions tab
   └─ Old sessions (> 24 hours) should be deleted

3. Check Usage Tracking Reset
   └─ Tennis: Check Usage Tracking sheet on Monday ~2:00 AM
   └─ Leobo: Check Usage Tracking sheet on 1st of month ~2:00 AM
   └─ Old usage should be zero'd out

4. Verify Email Sends
   └─ Check inbox: Membership renewal notifications
   └─ Check inbox: Guest list reminders
   └─ Board/RSO: Approval reminders

5. If Any Task Fails
   └─ Check logs for error messages
   └─ Check Audit Log tab for errors recorded
   └─ Run manual: NotificationService.runNightlyTasks()
   └─ Check Config.js for correct email addresses
```

---

## Environment Variables (Config.js)

Key configuration for deployment:

```javascript
// Deployment URLs
@HEAD_DEPLOYMENT_ID = "AKfycbxMFqbzFg-X-GDOpvllmnXNOY0Zw-WzHnn05PKDR4pYe0ULZ_qX8deWKIbO45AZBz6-"
PROD_DEPLOYMENT_ID = "[Specific ID]"  // Set when deploying to production

// Spreadsheet IDs
MEMBER_DIRECTORY_ID = "[ID]"
RESERVATIONS_ID = "[ID]"
SYSTEM_BACKEND_ID = "[ID]"
PAYMENT_TRACKING_ID = "[ID]"

// Email addresses
BOARD_APPROVAL_EMAIL = "board@geabotswana.org"
MGMT_APPROVAL_EMAIL = "mgt-notify@geabotswana.org"
RSO_NOTIFICATION_EMAIL = "rso-notify@geabotswana.org"

// Nightly task timing (Africa/Johannesburg timezone)
NIGHTLY_TASK_TIME = "02:00"
APPROVAL_REMINDER_TIME = "06:00"
GUEST_LIST_FINAL_CALL_TIME = "06:00"
RSO_DAILY_SUMMARY_TIME = "06:00"
HOLIDAY_CAL_REMINDER_TIME = "06:00" (yearly on Nov 1)

// Version tracking
CURRENT_VERSION = "v1.0.0"
VERSION_DEPLOYMENT_ID = "[DEPLOYMENT_ID]"
VERSION_DEPLOYED_DATE = "2026-03-04"
```

---

## Related Documentation

- **CLAUDE_Security.md** — Secure deployment practices, access control
- **GEA_System_Architecture.md** — System overview, module responsibilities
- **Tests.js** — Test utilities and diagnostics (665 lines)
- **Config.js** — All configuration variables (649 lines)
- **Code.js** — Entry point with route handlers (1,503 lines)
- **Utilities.js** — Helper functions including logging (517 lines)

---

**Last Updated:** March 4, 2026
**Source:** Extracted from CLAUDE.md lines 23–47, 686–750, 1289–1310, 1352–1383
