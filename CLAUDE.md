# CLAUDE.md - GEA Management System Quick Reference

This file provides essential guidance for Claude Code when working with the GEA repository. For detailed implementation documentation, see [References](#references) section.

---

## System Overview

**GEA Management System** is a Google Apps Script web application for the Gaborone Employee Association.

**Technology Stack:**
- **Backend:** Google Apps Script (V8) with 11 service modules
- **Frontend:** Portal.html (members), Admin.html (board), index.html (public website)
- **Database:** 4 Google Sheets spreadsheets (18 tabs total)
- **Deployment:** GAS versioned deployment (Portal/Admin) + GitHub Pages (website)
- **Timezone:** Africa/Johannesburg (GMT+2)

**Core Features:**
- Member authentication and role-based access control
- Membership applications with 11-step approval workflow
- Facility reservation booking with limits and bumping logic
- Payment submission and treasurer verification
- Document/photo upload with two-tier approval (RSO → GEA admin)
- Email notifications (114 templates)
- Audit logging of all actions

---

## Critical Design Patterns

### Authentication & Sessions
- **Session tokens:** Generated with entropy, SHA256 hashed, stored in Sessions tab
- **Timeout:** 24-hour sliding window (checked on every request)
- **Token comparison:** Constant-time comparison (prevents timing attacks)
- **Roles:** member, board, mgt, rso_approve, rso_notify, applicant
- **Pattern:** Every protected route calls `requireAuth(token, role?)`

### Role-Based Access Control (RBAC)
```
Sessions tab (members) + Administrators sheet (board/rso)
  ↓
requireAuth(token, role?) validates token & checks role
  ↓
Route handler executes (or returns FORBIDDEN)
  ↓
Audit logged with user_email, action_type, target_id
```

### Configuration System
Two sources (no duplicates between them):
- **Config.js** (static, requires deployment): Spreadsheet IDs, folder IDs, constants
- **Configuration tab** (dynamic, no deployment): Runtime values (exchange rates, feature flags, thresholds)

### XSS Prevention (Critical)
```javascript
// ❌ NEVER: User data in HTML string
container.innerHTML = '<div>' + user.name + '</div>';

// ✅ DO: Safe DOM construction
var div = document.createElement('div');
div.textContent = user.name;  // Safe: text only
container.appendChild(div);
```
**Git hook:** Pre-commit hook runs `scripts/check-xss-patterns.js` to catch innerHTML/insertAdjacentHTML with concatenation. See `.claspignore` for hook details.

### Membership Status Routing
Portal.html checks `membership_status` field to show appropriate UI:
- `Applicant` → Read-only application tracker
- `Member` → Full portal access
- `Lapsed` → Renewal prompt
- `Resigned` / `Expelled` → No portal access

---

## Common Development Tasks

### Deploy Code
Automated via GitHub Actions on commits to main:
1. `.github/workflows/update-deployment-metadata.yml` updates version (auto-runs)
2. `.github/workflows/deploy.yml` pushes to GAS versioned deployment (auto-triggers after #1)

**Manual push not recommended.** Just commit to main:
```bash
git add .
git commit -m "Description of changes"
git push -u origin <branch-name>
```

### Install Pre-commit Hooks
```bash
node scripts/install-hooks.js
```
Enables XSS pattern checking before each commit (prevents innerHTML/insertAdjacentHTML vulnerabilities).

### Run Tests
In GAS editor: **Functions dropdown** → Select test function (e.g., `testGetMembers()`) → Click **Run** (▶)

View results in **Execution log** or **Cloud Logs** (Cloud Logs more detailed).

**Key test functions:** testGetMembers(), testCreateReservation(), testEmailSending(), testMembershipApplication(), runDiagnostics()

### Check Logs & Audit Trail
- **Execution Log (GAS):** For debugging script failures
- **Cloud Logs:** Detailed logging; preferred for troubleshooting
- **Audit Log (Sheet):** Complete action trail (timestamp, user_email, action_type, target_id, details, ip_address)

---

## High-Level Architecture

```
Browser (Portal.html or Admin.html)
  ↓
google.script.run.handlePortalApi(action, params)
  ↓
Code.js :: _routeAction(action, params) → 60+ handlers
  ↓
Service Modules (Auth, Member, Reservation, Payment, File, Email, etc.)
  ↓
Google Sheets API
  ↓
Response JSON → UI Update
```

**All request handlers validate session & role before executing.**

---

## Service Modules Overview

| Module | Purpose | Key Functions |
|--------|---------|---|
| **Code.js** | Main router & entry point | doGet(), handlePortalApi(), _routeAction() |
| **AuthService** | Authentication, sessions, roles | login(), requireAuth(), validateSession() |
| **MemberService** | Household & individual CRUD | getMemberById(), updateHousehold(), calculateStats() |
| **ReservationService** | Booking, limits, bumping | createReservation(), cancelReservation(), getUsage() |
| **PaymentService** | Payment submission & verification | submitPaymentVerification(), approvePayment(), getReport() |
| **FileSubmissionService** | Document/photo upload, 2-tier approval | submitFile(), approveSubmission(), trackExpiration() |
| **EmailService** | Template dispatch & sending | sendEmail(), replaceVariables() (114 templates) |
| **NotificationService** | Nightly tasks, scheduled reminders | runNightlyTasks(), checkExpiration(), purgeSessionsm() |
| **ApplicationService** | 11-step membership app workflow | submitApplication(), getApplicationStatus(), activateApp() |
| **RulesService** | Eligibility determination | determineCategory(), validateSponsor() |
| **Utilities** | Shared helpers | hashPassword(), addDaysExcludingWeekends(), logAuditEntry() |

**For detailed module reference:** See [docs/SERVICE_MODULES.md](docs/SERVICE_MODULES.md)

---

## Database Schema

**4 Spreadsheets, 18 Tabs:**
- **Member Directory:** Households, Individuals, File Submissions, Membership Applications, Membership Levels
- **Reservations:** Reservations, Guest Lists, Guest Profiles, Usage Tracking
- **System Backend:** Configuration, Email Templates, Sessions, Administrators, Audit Log, Holiday Calendar
- **Payment Tracking:** Payments, Membership Pricing, Rates

**For complete column-by-column schema:** See [docs/reference/GEA_System_Schema.md](docs/reference/GEA_System_Schema.md)

---

## Frontend Interfaces

### Portal.html (Member Interface)
**8 pages:** dashboard, reservations, profile, card, payment, rules, myHousehold, applicant, renewal

All use `google.script.run.handlePortalApi(action, params, token)` for server calls. Session token stored in sessionStorage.

**For detailed page descriptions:** See [docs/frontend/PORTAL_INTERFACE.md](docs/frontend/PORTAL_INTERFACE.md)

### Admin.html (Board Interface)
**19 pages** organized by function: Core Operations (6), Member Management (6), Payments (2), Admin Accounts (1), RSO (4)

**Role-based access:** board (all), mgt (Leobo only), rso_approve (docs/guests), rso_notify (read-only)

**For detailed page descriptions:** See [docs/frontend/ADMIN_INTERFACE.md](docs/frontend/ADMIN_INTERFACE.md)

---

## Common Pitfalls & Fixes

| Issue | Solution |
|-------|----------|
| Hardcoded values instead of constants | Always use Config.js or Configuration tab |
| Forgetting token in API calls | Every call must include `token` parameter |
| Modifying sheets without service modules | Use MemberService.updateMember(), etc. |
| Not checking `membership_status` | Routes Portal.html display (Applicant/Member/Lapsed/Resigned/Expelled) |
| Timezone bugs | All dates use Africa/Johannesburg; use Utilities.addDaysExcludingWeekends() |
| Session timeout not checked | validateSession() checks expiration AND active flag |
| String concatenation for HTML | Use textContent/setAttribute instead of innerHTML |

---

## Deployment & Versioning

**Version flow:**
1. Commit to main (e.g., `git push`)
2. GitHub Actions auto-triggers metadata update workflow (version increment)
3. Deploy workflow auto-triggers after metadata completes
4. Code pushed to GAS versioned deployment
5. Production deployment ID stays stable (AKfycbw7DG2PpLUK9zrAQt9IVF35eQM7U-C3HUFyZIoQo7ChGB10xK5NuJRdUJpVrBjDwuAQ)

**Public website:** Deployed to GitHub Pages automatically on commits to main.

**For detailed deployment procedures:** See [docs/deployment/DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md) (if needed)

---

## Important Files Quick Reference

| File | Purpose |
|------|---------|
| Code.js | Request router (4,903 lines) |
| AuthService.js | Authentication (2,110 lines) |
| Config.js | Static constants (998 lines) |
| Portal.html | Member interface (8,799 lines) |
| Admin.html | Admin interface (6,255 lines) |
| .github/workflows/deploy.yml | GAS deployment automation |
| .github/workflows/update-deployment-metadata.yml | Version/metadata updates |
| scripts/install-hooks.js | Install XSS prevention hooks |
| scripts/check-xss-patterns.js | XSS pattern detection (pre-commit) |

---

## References

### Detailed Documentation
- **[SERVICE_MODULES.md](docs/SERVICE_MODULES.md)** - Complete service module reference with line counts and key functions
- **[GEA_System_Schema.md](docs/reference/GEA_System_Schema.md)** - Database schema (all 18 tabs, 37-58 columns per sheet)
- **[PORTAL_INTERFACE.md](docs/frontend/PORTAL_INTERFACE.md)** - Portal.html pages and critical client functions
- **[ADMIN_INTERFACE.md](docs/frontend/ADMIN_INTERFACE.md)** - Admin.html pages (19 pages) and workflows

### Implementation Guides
- **[CLAUDE_Payments_Implementation.md](docs/implementation/CLAUDE_Payments_Implementation.md)** - Payment submission, verification, pro-ration, exchange rates
- **[CLAUDE_Reservations_Implementation.md](docs/implementation/CLAUDE_Reservations_Implementation.md)** - Facility bookings, limits, bumping, guest lists
- **[CLAUDE_Membership_Implementation.md](docs/implementation/CLAUDE_Membership_Implementation.md)** - 11-step application workflow, eligibility, activation
- **[CLAUDE_RSO_Portal_Implementation.md](docs/implementation/CLAUDE_RSO_Portal_Implementation.md)** - RSO workflows (documents, guest lists)

### Reference Docs
- **[GEA_System_Schema.md](docs/reference/GEA_System_Schema.md)** - Complete schema reference
- **[EMAIL_TEMPLATES_REFERENCE.md](docs/reference/EMAIL_TEMPLATES_REFERENCE.md)** - 114 email templates by category
- **[MEMBERSHIP_CATEGORIES_MATRIX.md](docs/reference/MEMBERSHIP_CATEGORIES_MATRIX.md)** - Eligibility rules
- **[ROLES_PERMISSIONS_MATRIX.md](docs/reference/ROLES_PERMISSIONS_MATRIX.md)** - Role-based access matrix
- **[FACILITY_RULES_QUICK_CARD.md](docs/reference/FACILITY_RULES_QUICK_CARD.md)** - Reservation limits by facility

### Spreadsheet Exports
- **[docs/spreadsheets/](docs/spreadsheets/)** - Current CSV exports of all 18 sheets (updated April 24, 2026)

---

## Key Contacts & Info

- **System Admin Email:** board@geabotswana.org
- **Support:** board@geabotswana.org
- **Production Portal:** https://script.google.com/a/macros/geabotswana.org/s/AKfycbw7DG2PpLUK9zrAQt9IVF35eQM7U-C3HUFyZIoQo7ChGB10xK5NuJRdUJpVrBjDwuAQ/exec
- **Public Website:** https://geabotswana.org
- **GitHub Repository:** https://github.com/geabotswana/gea-website
- **Last Updated:** April 24, 2026

---

**For help with Claude Code:** Type `/help` in the CLI or visit the [Claude Code documentation](https://claude.ai/code).
