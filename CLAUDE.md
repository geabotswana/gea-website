# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## System Overview

**GEA Management System** is a Google Apps Script web application for the Gaborone Employee Association. It manages memberships, facility reservations, payments, document verification, and member communications. The system consists of:

- **Backend:** Google Apps Script (V8) with 9 service modules
- **Frontend:** Four responsive HTML interfaces:
  - **Authenticated:** Portal.html (member), Admin.html (board)
  - **Public:** index.html (informational website)
  - **Hybrid:** member.html (portal wrapper with iframe, domain masking)
- **Public Website:** Deployed to GitHub Pages at geabotswana.org
- **Database:** 4 Google Sheets spreadsheets (members, reservations, payments, system backend)
- **Deployment:** Clasp with @HEAD live deployment for Portal.html, Admin.html; GitHub Pages for public site
- **Timezone:** Africa/Johannesburg (GMT+2)

---

## Common Development Tasks

### Deploy Code Changes
```bash
clasp push                    # Push all code changes to @HEAD
```

**Important:** HTML files (Portal.html, Admin.html) deploy as @HEAD and take effect immediately. JavaScript changes require `clasp push`.

### Initial Setup: Install Regression Prevention Hooks
After cloning this repository, install the git hooks for XSS regression prevention:

```bash
node scripts/install-hooks.js
```

This sets up the pre-commit hook that runs `scripts/check-xss-patterns.js` before each commit. The hook prevents commits containing XSS-prone patterns (innerHTML/insertAdjacentHTML with string concatenation). See **XSS Prevention** section below for details.

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

## High-Level Architecture

### Request Flow
```
Browser (Portal.html or Admin.html)
  ↓
google.script.run.handlePortalApi(action, params)  [PREFERRED]
  OR fetch() to doGet() [LEGACY]
  ↓
Code.js :: doGet(e) or Code.js :: handlePortalApi()
  ↓
_routeAction(action, params)
  ├─→ Public routes: login, logout
  ├─→ Member routes: dashboard, profile, reservations, book, cancel, card, payment
  └─→ Board routes: admin_pending, admin_approve, admin_deny, admin_members, admin_photo, admin_payment
  ↓
Service modules (AuthService, MemberService, ReservationService, EmailService, NotificationService)
  ↓
Google Sheets API calls
  ↓
Response JSON → Browser → Update UI
```

### Critical Design Patterns

**Session Management:**
- One session per user (new login invalidates previous)
- 24-hour timeout (sliding window)
- Stored in Sessions tab with plain-text token (not hashed)
- Direct string comparison for token validation
- Nightly purge of expired sessions via `purgeExpiredSessions()`
- ⚠️ **Security Note:** Session tokens and passwords use simple equality checks (not constant-time). For production use, consider implementing cryptographic comparisons.

**Role-Based Access Control (RBAC):**
```javascript
// Three roles defined in Sessions tab:
member      // Regular users
board       // Administrators (members + approval powers)
mgt         // Management Officer (leobo approvals only)

// Authorization check at handler entry:
var auth = requireAuth(p.token, "board");  // Validates token & role
```

**Configuration System:**
- All business rules in **Config.js** (~650 lines)
- No hardcoded constants in service modules
- Easy to modify: Edit Config.js → `clasp push` → Changes live

**Email Templates:**
- Stored in **Email Templates** tab (System Backend spreadsheet)
- Template ID format: `tpl_001`, `tpl_002`, etc.
- Supports placeholders: `{{FIRST_NAME}}`, `{{FACILITY}}`, `{{RESERVATION_DATE}}`
- 30+ templates for all member communications

**Audit Logging:**
- Every action logged to **Audit Log** tab
- Format: timestamp, user_email, action_type, target_id, details, ip_address
- Critical for compliance and debugging

**XSS Prevention (Critical Security Pattern):**

All user-controlled data rendering in Portal.html and Admin.html uses safe DOM construction:

❌ **NEVER DO THIS:**
```javascript
// Vulnerable: User data interpolated into HTML string
var html = '<div>' + member.first_name + '</div>';
container.innerHTML = html;
```

✅ **DO THIS INSTEAD:**
```javascript
// Safe: Use textContent for user data
var div = document.createElement('div');
div.textContent = member.first_name;  // Safe: text only, no HTML parsing
container.appendChild(div);
```

**Key Rules:**
1. **All user-controlled data** → via `textContent` or form element properties (`.value`, `.checked`)
2. **Event handlers** → use closures instead of onclick string interpolation
   ```javascript
   // Wrong: btn.onclick = "deleteItem('" + id + "')";
   // Right: btn.onclick = (function(itemId) { return function() { deleteItem(itemId); }; })(id);
   ```
3. **innerHTML** → only for static, non-user-controlled markup
4. **Pre-commit check** → Git hook runs `scripts/check-xss-patterns.js` before commits

**Regression Prevention (Heuristic-Based):**
- Git pre-commit hook automatically runs conservative XSS pattern check
- **Detects:** Same-line innerHTML/insertAdjacentHTML with + operator concatenation
- **Does NOT detect:** Template literals `${}`, multi-line patterns, two-step assignments (`var html = ...; el.innerHTML = html;`)
- Not a comprehensive blocker; still requires code review for template literals and complex flows
- Override with `git commit --no-verify` (not recommended; indicates security review needed)

---

## Sheet Organization

### Member Directory (MEMBER_DIRECTORY_ID)
| Tab | Purpose | Key Lookup |
|-----|---------|-----------|
| Households | Membership units (individual or family) | `household_id` or `primary_member_id` |
| Individuals | People (adults & children) | `individual_id` or `email` for auth |
| File Submissions | Document & photo uploads w/ workflow | `submission_id`, filtered by `individual_id` + `document_type` |
| Membership Levels | Reference table (12 types) | `level_id` (key joins to Households) |

### Reservations (RESERVATIONS_ID)
| Tab | Purpose | Key Lookup |
|-----|---------|-----------|
| Reservations | Facility bookings (tennis, leobo, whole) | `reservation_id` or `household_id` |
| Guest Lists | Attendees for each reservation | `reservation_id` |
| Usage Tracking | Weekly/monthly limits (Tennis 3hrs/week, Leobo 1/month) | `household_id`, reset nightly |

### System Backend (SYSTEM_BACKEND_ID)
| Tab | Purpose | Key Lookup |
|-----|---------|-----------|
| Configuration | All business rules & thresholds | `config_key` (cached at runtime) |
| Email Templates | 30+ notification templates | `template_id` (tpl_001...tpl_032) |
| Sessions | Active user sessions | `token` (lookup on every request) |
| Audit Log | Compliance trail (1000s of rows) | timestamp, user_email, action_type |
| Membership Applications | New member application workflow | `application_id`, status progression |
| Holiday Calendar | US Federal & Botswana public holidays | For business day calculations |

### Payment Tracking (PAYMENT_TRACKING_ID)
| Tab | Purpose | Key Lookup |
|-----|---------|-----------|
| Payments | Dues payments & records | `payment_id` or `household_id` |

---

## Service Modules & Responsibilities

**Code.js** (1,503 lines)
- Entry point: doGet(e), handlePortalApi(action, params)
- Router: _routeAction() dispatches to specific handlers
- 15+ action handlers for member & board operations
- Image proxy: _handleImageProxy() serves Drive files as binary

**AuthService.js** (546 lines)
- login(email, password) → session creation & token generation
- logout(token) → session termination
- requireAuth(token, role?) → permission check (used by all protected routes)
- validateSession(token) → lookup & verify token still valid
- Password validation: SHA256 hash comparison (simple equality, see security notes below)

**MemberService.js** (622 lines)
- Member CRUD: getMemberByEmail(), getMemberById(), updateMember(), createMember()
- Household CRUD: getHouseholdById(), getHouseholdByMemberId(), updateHousehold()
- Derived fields: Recalculate voting_eligible, fitness_center_eligible, office_eligible
- Safe views: _safePublicMember(), _safePublicHousehold() (exclude password_hash, etc.)

**ReservationService.js** (797 lines)
- Booking logic: createReservation() checks limits (Tennis 3hrs/week, Leobo 1/month)
- Bumping logic: Tennis 1-day window, Leobo 5 business days
- Cancellation: cancelReservation(), refund logic, calendar event cleanup
- Usage tracking: getWeeklyUsage(), getMonthlyUsage(), calculateNextWeekStart()
- Limit enforcement: Excess bookings flag as pending for board approval

**EmailService.js** (336 lines)
- sendEmail(templateId, recipient, variables) → Core email dispatcher
- Fetches template from sheet, replaces placeholders, wraps in HTML
- From: "Gaborone Employee Association", Reply-to: board@geabotswana.org
- 30+ template IDs for all communications

**NotificationService.js** (400 lines)
- runNightlyTasks() → Daily at 2:00 AM GMT+2
  - Membership renewals (30-day, 7-day warnings)
  - Document expiration alerts (6-month passport warnings)
  - Guest list deadline reminders
  - Session purge (delete expired sessions)
  - Bump window expiration (promote tentative to confirmed)
- triggerRsoDailySummary() → Daily at 6:00 AM (RSO gets daily event list)
- sendHolidayCalReminder() → Yearly on Nov 1 (board reminder)

**Utilities.js** (517 lines)
- Date math: addDaysExcludingWeekends(), isBusinessDay(), getDayOfWeek()
- Hashing: hashPassword() (SHA256), validatePassword()
- Validation: isValidEmail(), isValidPhone(), validateLength()
- Audit logging: logAuditEntry()
- Safe guards: sanitizeInput() (no injection attacks)
- Lookups: getConfigValue(), getCellValue(), findRowByColumn()

**Config.js** (649 lines)
- Section 1: Spreadsheet IDs (4 main spreadsheets)
- Section 2: Tab names (exact sheet names)
- Section 3: Folder IDs (Google Drive folders for documents, photos)
- Section 4-17: Logo URLs, brand colors, email addresses, business rules, facility limits, age thresholds, payment methods, notification config, etc.

**Tests.js** (665 lines)
- Test utilities: testGetMembers(), testCreateReservation(), testEmailSending()
- Diagnostics: runDiagnostics(), checkAllSheets(), validateSchemaIntegrity()
- Used for QA and development

---

## Frontend Structure

### Public Website Files

#### index.html (Public Informational Website)
- **URL:** https://geabotswana.org
- **Deployment:** GitHub Pages (automatic on `git push`)
- **No authentication required** — informational landing page
- **6 main sections:**
  - Navigation (sticky, with "Member Login" link)
  - Hero (tagline, CTAs)
  - About GEA (mission, facilities overview, board officers)
  - Facilities (Tennis Court/Basketball, Playground, Leobo, Gym)
  - Contact & Footer
- **Self-contained:** All CSS in one `<style>` block, minimal vanilla JS for mobile menu
- **Responsive:** Mobile-friendly (375px+), smooth scroll anchors

#### member.html (Member Portal Wrapper)
- **URL:** https://geabotswana.org/member.html
- **Purpose:** Domain masking for authenticated member portal
- **Deployment:** GitHub Pages (same as index.html)
- **Implementation:** Full-page iframe embedding GAS web app
- **UX Benefit:** Users see geabotswana.org in address bar (not script.google.com)
- **Back link:** "Back to Website" for easy return to public site
- **Single iframe:** `<iframe src="https://script.google.com/a/macros/geabotswana.org/s/[DEPLOYMENT_ID]/exec">`

### Authenticated Interface Files

#### Portal.html (Member Interface)
- **Single-page app** with 4 main sections: Dashboard, Reservations, Profile, Membership Card
- Login screen: Email + password (no sign-up; created by board)
- Client-side API: `google.script.run.handlePortalApi(action, params)` (avoids CORS)
- Session storage: Token stored in `sessionStorage` (cleared on browser close)
- Key sections:
  - **Dashboard:** Household members, membership status, upcoming reservations
  - **Reservations:** Book facility (with limit checking), list current, cancel
  - **Profile:** View/edit contact info, upload documents & photos, view verification status
  - **Card:** Digital membership card (shows approval status, transfers to Cloud Storage on approval)

**Critical client functions:**
- `submitLogin(event)` → Calls handlePortalApi("login", {email, password})
- `loadDashboard()` → Initial page load with member data
- `showPage(pageName)` → Navigation between sections
- `loadProfile()` → Fetches member data & displays in Personal Information section
- `savePhoneNumbers()` → Updates phone fields (Individuals sheet)

#### Admin.html (Board Interface)
- **3-column layout:** Sidebar navigation + main content + optional details pane
- Same login, but requires role="board"
- Key admin functions:
  - **Dashboard:** Stats (pending reservations, pending photos, payment queue, today's reservations)
  - **Reservations:** Approve/deny excess bookings, view event calendar
  - **Members:** Search member directory, view household details
  - **Photos:** Review photo submissions (approve/reject with reason, transfers approved to Cloud Storage)
  - **Payments:** Verify payment confirmations, activate memberships

**Critical admin functions:**
- `showPage('reservations')` → _handleAdminPending() (list pending bookings)
- `approveReservation(id)` → _handleAdminApprove() (update status, send email)
- `denyReservation(id)` → _handleAdminDeny() (record reason, send email)
- `approvePhoto(individualId)` → _handleAdminPhoto(decision="approved") (transfers to Cloud Storage)
- `rejectPhoto(individualId, reason)` → _handleAdminPhoto(decision="rejected")

---

## File Submission Workflow (Critical)

**New in Feb 2026:** Separated file approval into dedicated **File Submissions** sheet to track full history of uploads & rejections.

### Document Approval (2-tier: RSO → GEA Admin)
```
Member uploads passport/omang
  ↓ (status="submitted")
RSO reviews via one-time approval link (handleRsoApproval)
  ├─ Approves → status="rso_approved" (GEA admin can now review)
  └─ Rejects → status="rso_rejected" (member notified with reason, can re-upload)
  ↓ (if rso_approved)
GEA Admin reviews in portal (admin_photo action)
  ├─ Approves → status="verified" (document final, is_current=TRUE)
  └─ Rejects → status="gea_rejected" (member notified with reason, can re-upload)
```

**Key fields in File Submissions:**
- `submission_id`, `individual_id`, `document_type` (passport/omang/photo)
- `status` (submitted, rso_approved, rso_rejected, gea_pending, gea_rejected, verified, approved, rejected)
- `rso_reviewed_by`, `rso_review_date` (audit trail)
- `gea_reviewed_by`, `gea_review_date` (audit trail)
- `rejection_reason` (if rejected at any stage)
- `is_current` (TRUE only for active approved submission of each type)
- `disabled_date` (when superseded by newer approval)
- `cloud_storage_path` (photos only, populated on approval)

### Photo Approval (1-tier: GEA Admin only)
```
Member uploads photo
  ↓ (status="submitted")
GEA Admin reviews & approves
  ├─ Approves → status="approved", duplicates to Cloud Storage (gs://gea-member-data/{household_id}/{individual_id}/photo.jpg)
  └─ Rejects → status="rejected" (member notified with reason, can re-upload)
```

**Important:** When approving, old is_current=TRUE is set to is_current=FALSE and disabled_date recorded.

---

## Reservation Workflow

**For complete implementation details, see:** [CLAUDE_Reservations_Implementation.md](docs/implementation/CLAUDE_Reservations_Implementation.md)

**Quick Summary:**
- Four facilities: Tennis/Basketball (3 hrs/week limit), Leobo (1/month limit), Gym (walk-up), Playground (walk-up)
- Booking limits enforced nightly; Tennis resets Monday, Leobo resets 1st of month
- Approval routing: Tennis regular = auto-approved; Tennis excess & Leobo = board approval; Leobo = two-stage (Mgmt → Board)
- Guest list submission required within 2 days of approval; RSO reviews before event
- Bumping logic: Tennis excess promoted if regular booking cancelled (1-day window); Leobo excess auto-confirmed after 5 business days
- Calendar integration: Event status tags [TENTATIVE], [APPROVED], [DENIED], [CANCELLED] track booking lifecycle
- Nightly tasks: Send approval reminders, guest list final calls, process bumping deadlines, reset usage tracking

---

## Deployment & Versioning

**For complete deployment procedures, testing strategies, rollback procedures, and troubleshooting, see:** [CLAUDE_Deployment.md](docs/implementation/CLAUDE_Deployment.md)

**Quick Summary:**
- Development: `clasp push` updates @HEAD deployment immediately; test via @HEAD URL
- Production: Create versioned deployment manually when ready; does NOT auto-update
- Testing workflow: Deploy to @HEAD → Test thoroughly → Create versioned deployment for production
- Nightly tasks: runNightlyTasks() at 2:00 AM GMT+2 (sessions, membership warnings, usage tracking, bumping)
- Rollback: If production deployment has issues, revert member.html iframe to previous deployment ID
- GitHub deployment: Public website auto-deploys on `git push` (separate from GAS deployment)

---

## Membership Application Workflow

**For complete implementation details, see:** [CLAUDE_Membership_Implementation.md](docs/implementation/CLAUDE_Membership_Implementation.md)

**Quick Summary:**
- 11-step application lifecycle: Submit → Documents → Board Review → RSO Review → Payment → Activation
- 6 membership categories determined by eligibility questionnaire (no member choice, automatic assignment)
- Board approval: 3 business days; RSO approval: 5 business days (documents only)
- Applicant submits documents (passport, omang, photo) after account creation; RSO reviews documents; GEA admin transfers approved photos to Cloud Storage
- Payment workflow: RSO approval → Applicant submits proof of payment → Treasurer verifies → Membership activated
- Automatic account creation (new household + individuals) with temporary password; applicant logs in during application
- Read-only portal for applicants during approval; full features unlocked after payment verification
- Nightly tasks: Send renewal warnings (30-day, 7-day before July 31 expiration), create new applications

---

**For 11-step lifecycle details, category definitions, sponsorship verification, and error handling, see:** [CLAUDE_Membership_Implementation.md](docs/implementation/CLAUDE_Membership_Implementation.md)

## Key Architectural Decisions

**google.script.run vs fetch():**
- google.script.run is preferred (no CORS, auto-handles authentication)
- fetch() legacy code exists but causes CORS errors with script.google.com
- Future: Replace all fetch() with google.script.run

**Email Template Variables:**
- `{{PLACEHOLDER}}` → Replaced before sending
- Conditional blocks: `{{IF_FAMILY}}...{{END_IF}}`, `{{IF_TEMPORARY}}...{{END_IF}}`
- Supports nested conditions for complex templates

---

## Common Pitfalls & How to Avoid Them

**Pitfall:** Hardcoding values instead of using Config.js
- **Fix:** All constants in Config.js (lines 40-650), not in service modules

**Pitfall:** Forgetting to include token in API calls from browser
- **Fix:** All calls must include `p.token` parameter; requireAuth() validates at entry

**Pitfall:** Modifying sheets directly without going through service modules
- **Fix:** MemberService.updateMember() handles all Individuals updates, ensures consistency

**Pitfall:** Not checking household.active or membership_expiration_date
- **Fix:** Every operation checks: `if (!household.active) return error("Membership inactive")`

**Pitfall:** Timezone issues (GMT+2 vs UTC)
- **Fix:** All calculations use appsscript.json timezone (Africa/Johannesburg)
- **Util:** Utilities.addDaysExcludingWeekends() handles all date math

**Pitfall:** Session timeout not checked
- **Fix:** validateSession() checks both expiration and active flag

---

## Testing & Debugging

**Test Data Available:**
- Test household: HSH-2026-TEST01 (Johnson Family)
- Test individual: IND-2026-TEST01 (Jane Johnson) - email: jane@example.com, password: TestPass123!
- Test member for admin: board@geabotswana.org (role=board)
- **Delete before production go-live**

**Debugging Strategies:**
1. Use Logs: `clasp logs` → See all console.log() output
2. Check Audit Log: Every action logged (query by timestamp, user_email, action_type)
3. Run diagnostics: Tests.js has runDiagnostics() function
4. Check Session: Is token valid? Is role authorized?
5. Verify data: Query relevant sheet (Households, Individuals, Reservations, etc.)

**Common Error Codes:**
- AUTH_REQUIRED: No token provided or token missing
- AUTH_FAILED: Token invalid or expired
- FORBIDDEN: Token valid but user doesn't have required role
- NOT_FOUND: Member/household/reservation not found
- INVALID_PARAM: Parameter validation failed
- SERVER_ERROR: Unhandled exception

---

## Important Files Quick Reference

| File | Lines | When to Edit | Key Functions |
|------|-------|-------------|----------------|
| Config.js | 649 | Business rule changes | All config_* variables |
| AuthService.js | 546 | Auth/password changes | login(), requireAuth(), validateSession() |
| MemberService.js | 622 | Member data structure | getMemberById(), updateMember() |
| ReservationService.js | 797 | Booking logic | createReservation(), cancelReservation() |
| EmailService.js | 336 | Email design/templates | sendEmail() (reads templates from sheet) |
| Code.js | 1,503 | API routes/handlers | _routeAction(), all action handlers |
| Portal.html | 1,926 | Member UI | loadProfile(), loadDashboard(), submitLogin() |
| Admin.html | 2,142 | Admin UI | approveReservation(), rejectPhoto() |
| Utilities.js | 517 | Shared helpers | Utilities used by all modules |
| GEA_System_Schema.md | 35KB | Understand data model | Read before major changes |

---

## External Integrations

- **Google Sheets API:** Member directory, reservations, payments (all core operations)
- **Gmail API:** Email notifications via GmailApp.sendEmail()
- **Google Drive API:** Document uploads, image serving via proxy
- **Google Calendar API:** Reservation calendar integration
- **Google Cloud Storage:** Public logo assets (read-only, no API calls needed)

---

## Future Extensions

Easy to add without modifying core code:
- New email templates: Add row to Email Templates tab → Config.js references tpl_ID
- New membership categories: Add row to Membership Levels → Use level_id in Config.js
- New facilities: Add to Config.FACILITIES → Reservation logic handles automatically
- New roles: Add to Sessions tab (member, board, mgt currently) → Update requireAuth() if needed
- New nightly tasks: Add function to NotificationService.js, call from runNightlyTasks()

---

## Website Deployment (geabotswana.org)

### Public Website

**URL:** https://geabotswana.org

**Repository:** https://github.com/geabotswana/gea-website

**Hosting:** GitHub Pages (automatic deployment on each push)

**Files:**
- `index.html` — Single-page website with 6 sections (About, Facilities, Membership, Contact)
- `CNAME` — Custom domain configuration for geabotswana.org
- `.gitignore` — Excludes member data (*.xlsx), credentials (.clasp.json), and temporary files
- `Code.js`, `AuthService.js`, `*.js` — GAS source code backed up in repo
- `Portal.html`, `Admin.html` — Member and admin interfaces backed up in repo

**Deployment Workflow:**

1. Make changes to `index.html` (or GAS source files)
2. Commit to git:
   ```bash
   git add index.html
   git commit -m "Update website"
   git push origin main
   ```
3. GitHub Pages auto-deploys (live within 1-2 minutes)

**IMPORTANT:** Use `.claspignore` to exclude `index.html` from `clasp push` (prevents website from being pushed to Google Apps Script).

**Member Login Link in Website:**
Points to production versioned deployment: `AKfycbw7DG2PpLUK9zrAQt9IVF35eQM7U-C3HUFyZIoQo7ChGB10xK5NuJRdUJpVrBjDwuAQ`

---

## Key Contacts & Info

- **System Admin Email:** board@geabotswana.org
- **Support:** board@geabotswana.org
- **Production Portal:** https://script.google.com/a/macros/geabotswana.org/s/AKfycbw7DG2PpLUK9zrAQt9IVF35eQM7U-C3HUFyZIoQo7ChGB10xK5NuJRdUJpVrBjDwuAQ/exec
- **Public Website:** https://geabotswana.org
- **GitHub Repository:** https://github.com/geabotswana/gea-website
- **Last Updated:** v1.0.0 - February 23, 2026
