# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## System Overview

**GEA Management System** is a Google Apps Script web application for the Gaborone Employee Association. It manages memberships, facility reservations, payments, document verification, and member communications. The system consists of:

- **Backend:** Google Apps Script (V8) with 9 service modules
- **Frontend:** Two responsive HTML interfaces (member portal + admin panel)
- **Database:** 4 Google Sheets spreadsheets (members, reservations, payments, system backend)
- **Deployment:** Clasp with @HEAD live deployment for HTML (Portal.html, Admin.html)
- **Timezone:** Africa/Johannesburg (GMT+2)

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
- Stored in Sessions tab with SHA256 hashed token
- Nightly purge of expired sessions via `purgeExpiredSessions()`

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
- Password hashing: SHA256 with constant-time comparison

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

### Portal.html (Member Interface)
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

### Admin.html (Board Interface)
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

## Deployment & Versioning

### Push to @HEAD (Immediate)
```bash
clasp push                    # Updates Code.js, services, Config.js, HTML files
```
Changes live immediately for HTML (@HEAD deployment). No version bump needed.

### Version Control
- Script ID: `1mkzpnNfUm-ZTW-G6wEdGg4Jt1KiChOXrV5qjBNkm3eqx43Yn-7Z-2Ffv`
- Deployment ID (points to @HEAD): `AKfycbxMFqbzFg-X-GDOpvllmnXNOY0Zw-WzHnn05PKDR4pYe0ULZ_qX8deWKIbO45AZBz6-`
- One active deployment (@HEAD) - clean setup, no version bloat
- Version info in Config.js header (for tracking)

### Domain & Access
```
Portal: https://script.google.com/a/macros/geabotswana.org/s/{DEPLOYMENT_ID}/exec
Admin:  Same URL with ?action=serve_admin

Access: ANYONE_ANONYMOUS (no login required to reach login screen)
Auth: Handled by login form → session token required for all operations
```

---

## Key Architectural Decisions

**google.script.run vs fetch():**
- google.script.run is preferred (no CORS, auto-handles authentication)
- fetch() legacy code exists but causes CORS errors with script.google.com
- Future: Replace all fetch() with google.script.run

**Reservation Bumping (Tennis vs Leobo):**
- Tennis: 1-day bump window (members can bump tentative reservations up to 1 day before)
- Leobo: 5 business days bump window (calculated excluding weekends & holidays)
- After bump window expires → status="Confirmed" (locked, cannot be bumped)

**Usage Tracking Reset:**
- Tennis: Weekly (Monday 2:00 AM)
- Leobo: Monthly (1st of month 2:00 AM)
- Calculated nightly in NotificationService.runNightlyTasks()

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

## Key Contacts & Info

- **System Admin Email:** board@geabotswana.org
- **Support:** board@geabotswana.org
- **Production Portal:** https://script.google.com/a/macros/geabotswana.org/s/{DEPLOYMENT_ID}/exec
- **GEA Website:** www.geabotswana.org
- **Last Updated:** February 22, 2026
