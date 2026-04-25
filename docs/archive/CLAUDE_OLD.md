# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## System Overview

**GEA Management System** is a Google Apps Script web application for the Gaborone Employee Association. It manages memberships, facility reservations, payments, document verification, and member communications. The system consists of:

- **Backend:** Google Apps Script (V8) with 11 service modules
- **Frontend:** Four responsive HTML interfaces:
  - **Authenticated:** Portal.html (member), Admin.html (board)
  - **Public:** index.html (informational website)
  - **Hybrid:** member.html (portal wrapper with iframe, domain masking)
- **Public Website:** Deployed to GitHub Pages at geabotswana.org
- **Database:** 4 Google Sheets spreadsheets (members, reservations, payments, system backend)
- **Deployment:** GAS versioned deployment for Portal.html, Admin.html, and supporting JS files (@HEAD does not function reliably under iframe wrapper); GitHub Pages for index.html and member.html
- **Timezone:** Africa/Johannesburg (GMT+2)

---

## Common Development Tasks

### Deploy Code Changes

Code deployment is automated via GitHub Actions:
- **Workflow:** `.github/workflows/deploy.yml` pushes Portal.html, Admin.html, and JavaScript files to GAS versioned deployment
- **Trigger:** Runs automatically after metadata update workflow completes on commits to main or merged PRs
- **Manual deployment:** Not recommended; use GitHub Actions instead

### Pre-commit Steps

Version and deployment metadata updates are automated via GitHub Actions:
- **Workflow:** `.github/workflows/update-deployment-metadata.yml` updates version info and timestamps automatically
- **Trigger:** Runs first when committing to main or merging PR to main
- **Next step:** After metadata update completes, `.github/workflows/deploy.yml` automatically triggers to push to GAS
- **Manual process:** Not needed; GitHub Actions handles both version and deployment

Just commit your changes normally:
```bash
git add .
git commit -m "Your message"
git push -u origin <branch-name>
```

### Initial Setup: Install Regression Prevention Hooks
After cloning this repository, install the git hooks for XSS regression prevention:

```bash
node scripts/install-hooks.js
```

This sets up the pre-commit hook that runs `scripts/check-xss-patterns.js` before each commit. The hook prevents commits containing XSS-prone patterns (innerHTML/insertAdjacentHTML with string concatenation). See **XSS Prevention** section below for details.

### Run Tests & Diagnostics

In Google Apps Script editor:
1. Select the file containing the function (e.g., Tests.js, AuthService.js)
2. Functions dropdown → Select function name → Click Run (▶)
3. View results in Execution log or Logs viewer

**Note:** When requesting test execution, specify the filename first (e.g., "Run testGetMembers() in Tests.js")

### Check Logs

- **Execution Logs (GAS):** Generally not useful unless execution fails entirely
- **Cloud Logs:** More detailed and informative for debugging; preferred method
- **Audit Log (Sheet):** Every action logged to Audit Log tab with timestamp, user, action type, and details

---

## High-Level Architecture

### Request Flow
```
Browser (Portal.html or Admin.html)
  ↓
google.script.run.handlePortalApi(action, params)
  ↓
Code.js :: handlePortalApi()
  ↓
_routeAction(action, params)
  ├─→ PUBLIC (no auth required): login, admin_login, admin_session, check_sessions_schema,
  │   migrate_submission_type, logout, password_reset_request, password_reset_complete,
  │   password_reset_confirm, change_password, deployment_info, get_config_value, get_rules,
  │   submit_application
  │
  ├─→ MEMBER & APPLICANT (member token required): dashboard, profile, reservations, book,
  │   cancel, card, submit_payment_verification, get_payment_status, get_dues_info,
  │   get_applicant_dues_info, updatePhoneNumbers, application_status, withdraw_application,
  │   confirm_documents, upload_document, remove_document, submit_payment_proof, upload_file,
  │   get_file_status, approve_file, reject_file, request_employment, get_submission_history,
  │   rso_approve, send_contact_message, get_household_members, add_household_member,
  │   remove_household_member, edit_household_member, update_household_type, submit_guest_list,
  │   get_guest_list, get_guest_profiles, get_member_photo
  │
  ├─→ BOARD/ADMIN (board/rso/mgt token required): admin_pending, admin_approve, admin_deny,
  │   admin_waitlist, admin_approve_bump, admin_waitlist_list, admin_guest_lists,
  │   admin_save_guest_list_draft, admin_finalize_guest_list, admin_guest_histories,
  │   admin_rso_pending_documents, admin_rso_document_dashboard_stats,
  │   admin_rso_approve_document, admin_rso_pending_member_documents,
  │   approve_rso_member_document, reject_rso_member_document,
  │   admin_member_document_rejections, admin_send_document_rejection_response,
  │   admin_application_rejections, admin_send_application_rejection_response,
  │   admin_rso_applications_ready, admin_rso_approved_calendar, admin_rso_approved_guest_lists,
  │   admin_calendar, admin_members, admin_member_detail, admin_lapsed_members,
  │   admin_resigned_members, admin_resign_membership, admin_photo, admin_pending_photos,
  │   admin_applications, admin_application_detail, admin_approve_application,
  │   admin_deny_application, rso_approve_application, rso_deny_application,
  │   rso_application_decision, admin_get_application_payment, admin_verify_payment,
  │   admin_pending_payments, admin_approve_payment, admin_reject_payment,
  │   admin_clarify_payment, admin_payment_report, admin_create_gratis_payment,
  │   admin_dashboard_stats, admin_reservations_report, admin_resend_email, admin_get_rules,
  │   admin_save_rule, admin_delete_rule, admin_list_admins, admin_create_admin,
  │   admin_deactivate_admin, admin_reactivate_admin, admin_reset_admin_password
  │
  └─→ DIAGNOSTICS & FILE DATA: image_diagnostic, get_file_data
  ↓
Service modules (AuthService, MemberService, ReservationService, PaymentService, FileSubmissionService, EmailService, NotificationService, ApplicationService, RulesService, Utilities, Tests)
  ↓
Google Sheets API calls
  ↓
Response JSON → Browser → Update UI
```

### Critical Design Patterns

**Session Management:**
- One session per user (new login invalidates previous)
- 24-hour timeout (sliding window)
- Session tokens generated using `Utilities.getUuid()` + timestamp + entropy (then hashed to 64-char hex)
- Session tokens stored as SHA256 hashes in Sessions tab (plain-text never persisted)
- Token and password comparisons use constant-time comparison to resist timing attacks
- Nightly purge of expired sessions via `purgeExpiredSessions()`
- ⚠️ **Security Notes:**
  - Token generation combines multiple entropy sources for better randomness than Math.random()
  - Session tokens are hashed, removing immediate replay risk from spreadsheet reads
  - Constant-time comparison used for all credential checks (passwords, token hashes)
  - Sheet access control still required (fundamental architectural boundary)
  - JavaScript implementation (not hardware-accelerated crypto)

**Role-Based Access Control (RBAC):**

Five roles defined in Administrators sheet (for board/mgt/rso) and Sessions tab (for members):
- `member` — Regular members (portal access)
- `board` — Administrators with approval powers
- `mgt` — Management Officer (leobo approvals only)
- `rso_approve` — Document and guest list reviewer
- `rso_notify` — Read-only event coordinator

**Membership Substates:** `Households.membership_status` determines portal features for member role:
- `Applicant` — Application in progress (read-only access)
- `Member` — Active member (full portal access)
- `Lapsed` — Expired membership (limited access)
- `Resigned` — Withdrawn from membership (no access)
- `Expelled` — Removed from membership (no access)

**Note:** Membership status routing in Portal.html needs verification—implementation status unknown.

```javascript
// Authorization check at handler entry:
var auth = requireAuth(p.token, "board");  // Validates token & role
```

**Configuration System:**
- **Config.js** (~865 lines) — Static configuration (spreadsheet IDs, folder IDs, constants, business rules)
- **Configuration tab** (System Backend spreadsheet) — Dynamic configuration (runtime values, feature flags)
- No duplicate keys between sources; each serves distinct purpose
- No hardcoded constants in service modules; always reference Config.js or Configuration tab
- Changes to Config.js require deployment; Configuration tab changes take effect immediately at runtime

**Email Templates:**
- **Email Templates tab** (System Backend spreadsheet): Metadata (semantic_name, display_name, subject, drive_file_id, placeholders, active, notes)
- **Google Drive files**: Body text stored as individual Drive files (linked via drive_file_id in tab)
- **Repository mirror**: CSV in `docs/email_templates/Email_Templates_Sheet.csv` + TXT files in `docs/email_templates/`
- **Deployment workflow**: 
  - New templates: Create TXT files + CSV rows (blank drive_file_id) → Commit to main
  - `.github/workflows/deploy-email-templates.yml`: Sends TXT to Drive, populates IDs
  - `.github/workflows/export-email-templates-csv.yml`: Exports updated tab back to CSV
- **Template format**: Semantic name `PREFIX_DESCRIPTION_TO_RECIPIENT` (e.g., `MEM_APPLICATION_RECEIVED_TO_APPLICANT`)
- **Placeholders**: `{{FIELD}}` format, supports conditional blocks `{{IF_FAMILY}}...{{END_IF}}`
- **Currently 114 templates** across 6 categories (ADM, DOC, MEM, PAY, RES, SYS)
- **Sending**: Uses DWD to send as board@geabotswana.org so officers receive at office-specific emails (treasurer@, chair@, secretary@geabotswana.org)

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
| Households | Membership units (individual or family); tracks status (Member/Applicant/Lapsed/Resigned/Expelled), sponsorship, payments | `household_id` or `primary_member_id` |
| Individuals | People (adults, children, staff); auth via email; membership eligibility derived from household | `individual_id` or `email` for auth |
| File Submissions | Document, photo, and employment verification uploads with two-tier approval (RSO → GEA); tracks expiration dates | `submission_id`, filtered by `individual_id` + `document_type` |
| Membership Applications | New member application workflow; 11-step lifecycle from submission through activation | `application_id`, status progression |
| Membership Levels | Reference table for membership categories (Full, Associate, Affiliate, Diplomatic, Community, Temporary) | `level_id` (key joins to Households) |

**Extended schemas:** Column-by-column reference available in docs/reference/GEA_System_Schema.md

### Reservations (RESERVATIONS_ID)
| Tab | Purpose | Key Lookup |
|-----|---------|-----------|
| Reservations | Facility bookings (tennis, leobo); tracks limits, approval status, guest list submission, bumping state | `reservation_id` or `household_id` |
| Guest Lists | Attendees for each reservation; RSO reviews for event coordination; final count/profiles submitted | `reservation_id` |
| Guest Profiles | Reusable guest registry (name, ID, age group); enables quick guest list creation across reservations | `guest_profile_id` or `household_id` |
| Usage Tracking | Weekly/monthly usage limits (Tennis 3hrs/week, Leobo 1/month); reset nightly, tracks household consumption | `household_id`, reset nightly |

### System Backend (SYSTEM_BACKEND_ID)
| Tab | Purpose | Key Lookup |
|-----|---------|-----------|
| Configuration | Runtime business rules & thresholds; updated by operators without code deployment | `config_key` (cached at runtime) |
| Email Templates | 114 notification templates across 6 categories (ADM, DOC, MEM, PAY, RES, SYS); metadata + Drive file body | `semantic_name` (e.g. MEM_APPLICATION_RECEIVED_TO_APPLICANT) |
| Sessions | Active user sessions; tracks creation, expiration, role; token hash for security; purged nightly | `token_hash` (lookup on every request) |
| Administrators | Admin and RSO accounts; roles: board, mgt, rso_approve, rso_notify; managed by board | `email` for auth |
| Audit Log | Compliance trail; timestamp, user_email, action_type, target_id, details, IP address; 1000+ rows | indexed by timestamp, action_type, user_email |
| Holiday Calendar | US Federal & Botswana public holidays; used for business day calculations (bumping deadlines, nightly tasks) | `holiday_date` |

### Payment Tracking (PAYMENT_TRACKING_ID)
| Tab | Purpose | Key Lookup |
|-----|---------|-----------|
| Payments | Dues payments submitted by members; tracks method, amount USD/BWP, verification status, treasurer approval | `payment_id` or `household_id` |
| Membership Pricing | Membership year dues setup; one row per level per year; referenced for payment pro-ration | `membership_level_id` + `membership_year` |
| Rates | Exchange rate history (USD ↔ BWP); updated nightly via API; timestamped for historical rate lookups | `rate_date` |

---

## Service Modules & Responsibilities

**Code.js** (4,903 lines)
- Entry point: doGet(e), handlePortalApi(action, params), handleContentService(e)
- Router: _routeAction() dispatches to 60+ handlers across public, member, applicant, household, and board categories
- Image proxy: _handleImageProxy() serves Drive files as binary; _handleGetFileData() for authenticated file access
- Request flow: Validates session → authorizes role → executes handler → returns JSON response
- Comprehensive error handling with standardized error responses

**AuthService.js** (2,110 lines)
- Authentication: login(email, password) → session creation & token generation; logout(token) → session termination
- Authorization: requireAuth(token, role?) → permission check; validateSession(token) → lookup & verify validity
- Session management: Token generation with entropy; SHA256 hashing; constant-time comparison for security
- Admin & member roles: board, mgt, rso_approve, rso_notify (admins); member (members); applicant (pending approval)
- Password handling: SHA256 hash comparison, constant-time comparison, password reset workflows

**MemberService.js** (796 lines)
- Member CRUD: getMemberByEmail(), getMemberById(), updateMember(), createMember()
- Household CRUD: getHouseholdById(), getHouseholdByMemberId(), updateHousehold(), calculateHouseholdStats()
- Derived fields: Recalculate voting_eligible, fitness_center_eligible, office_eligible based on category/status
- Safe views: _safePublicMember(), _safePublicHousehold() (exclude password_hash, tokens, sensitive data)
- Membership status routing: Returns appropriate fields based on member/applicant/lapsed/resigned/expelled state

**ReservationService.js** (2,089 lines)
- Booking logic: createReservation() enforces facility limits (Tennis 3hrs/week, Leobo 1/month, no limits for gym/playground)
- Approval routing: Regular bookings auto-approved; excess → board approval; Leobo requires two-stage (mgt → board)
- Bumping logic: Tennis 1-day window, Leobo 5 business days; auto-promotion if blocking reservation cancelled
- Cancellation: cancelReservation() with refund, calendar event cleanup, bump promotion check
- Usage tracking: getWeeklyUsage(), getMonthlyUsage(), calculateNextWeekStart(); reset nightly via NotificationService
- Guest list management: submitGuestList(), getGuestList(), finalizeGuestList(); RSO reviews before event

**PaymentService.js** (1,011 lines)
- Payment submission: submitPaymentVerification() → Member submits proof with file upload (screenshot, receipt, etc.)
- Verification workflow: Treasurer review → approve/reject/request clarification
- Currency support: USD, BWP with automatic conversion; exchange rates updated nightly
- Pro-ration: calculateProratedDues() for quarterly calculations (Q1: 100%, Q2: 75%, Q3: 50%, Q4: 25%)
- Exchange rate management: fetchAndUpdateExchangeRate() (nightly via open.er-api.com API), stored in Rates tab
- Payment reporting: getPaymentReport(filters) with membership year and status filters; CSV export support

**FileSubmissionService.js** (1,413 lines)
- File submission workflow: Documents (passport/omang), photos, employment verification with status tracking
- Two-tier document approval: RSO review → GEA admin review; RSO can approve/reject, GEA admin finalizes
- One-tier photo approval: GEA admin only; approved photos transferred to Cloud Storage gs://gea-member-data/
- Expiration tracking: Monitors document expiration dates; sends 6-month and 1-month warning emails
- Functions: submitFile(), getSubmissionHistory(), approveSubmission(), rejectSubmission(), requestResubmit()
- Audit trail: Track all uploads, reviews, approvals, rejections with user, timestamp, and decision reason

**EmailService.js** (1,071 lines)
- Core dispatcher: sendEmail(semantic_name, recipient, variables) fetches template and sends via Gmail
- Template system: 114 templates stored as metadata in Email Templates tab + body text in Google Drive files
- Placeholders: {{FIELD}} format with support for conditional blocks {{IF_FAMILY}}...{{END_IF}}, {{IF_TEMPORARY}}...{{END_IF}}
- From address: "Gaborone Employee Association"; Reply-to: board@geabotswana.org (enables office email forwarding via DWD)
- Categories: ADM (6), DOC (18), MEM (26), PAY (14), RES (25), SYS (25) templates
- HTML wrapping: Embeds template body in branded HTML wrapper with logo, footer, unsubscribe info

**NotificationService.js** (774 lines)
- Nightly tasks (2:00 AM GMT+2): runNightlyTasks()
  - Membership renewals: 30-day and 7-day warnings before July 31 expiration
  - Document expiration alerts: 6-month passport/omang warnings
  - Guest list reminders: Final calls for pending guest lists 2 days before event
  - Session purge: Delete expired sessions from Sessions tab
  - Bump window expiration: Auto-promote tentative to confirmed if deadline passed
  - Exchange rate update: Fetch USD↔BWP rate from API, store in Rates tab
- Daily tasks (6:00 AM GMT+2): triggerRsoDailySummary() sends RSO event list for day
- Annual tasks (Nov 1): sendHolidayCalReminder() board reminder to populate Holiday Calendar

**ApplicationService.js** (1,531 lines)
- Membership application lifecycle: 11-step workflow from submission → activation
- Steps: Submit → Documents → Board Initial Review → RSO Documents Review → Board Final → Payment → Activation
- Eligibility questionnaire: Q1-Q5 responses auto-determine membership category (Full/Associate/Affiliate/Diplomatic/Community/Temporary)
- Document submission: confirmDocumentsUploaded(), uploadDocument() with validation; RSO reviews before board final approval
- Payment workflow: applicants submit proof after board approval; treasurer verifies; activation unlocks full portal
- Sponsorship: Community/Affiliate/Diplomatic require sponsor verification; Full members can only sponsor
- Account creation: New household + individual records created with temporary password; applicant logs in during app

**RulesService.js** (420 lines)
- Eligibility rules engine: determineCategory() auto-routes based on questionnaire responses
- 6 categories with business logic: Full (embassy employee), Associate (51%+ USG funding), Affiliate (33%+ USG), Diplomatic (visa), Community (sponsor-based), Temporary (contractor)
- Rule logic: Embassy employment, USG funding threshold (51% for Associate, 33% for Affiliate), visa type, posting dates
- Sponsor validation: Verify sponsor exists, has active Full membership, not already sponsoring max members
- Fallback rules: <51% USG routes to Community (not Associate); missing questionnaire responses handled gracefully

**Utilities.js** (657 lines)
- Date math: addDaysExcludingWeekends(), isBusinessDay(), getDayOfWeek(), getAgeCategory()
- Hashing: hashPassword() (SHA256), validatePassword(), constantTimeCompare() for security
- Validation: isValidEmail(), isValidPhone(), validateLength(), sanitizeInput() for XSS prevention
- Lookups: getConfigValue() (cached), getCellValue(), findRowByColumn(), findAllRowsByColumn()
- Audit logging: logAuditEntry() records all significant actions with user, action type, target, details, IP
- Error handling: standardized errorResponse() format for API consistency

**Config.js** (998 lines)
- Spreadsheet IDs: MEMBER_DIRECTORY_ID, RESERVATIONS_ID, SYSTEM_BACKEND_ID, PAYMENT_TRACKING_ID (Section 1)
- Tab names: Exact sheet names for all 18 tabs across 4 spreadsheets (Section 2)
- Folder IDs: Google Drive folders for documents, photos, employment verification, cloud storage (Section 3)
- Constants: URLs, colors, contact emails, facility names, membership categories, age thresholds, payment methods (Sections 4-17)
- Last updated: April 24, 2026

**Tests.js** (3,071 lines)
- Test utilities: testGetMembers(), testCreateReservation(), testEmailSending(), testMembershipApplication()
- Integration tests: Full workflow tests for application, payment, reservation, document submission
- Diagnostics: runDiagnostics(), checkAllSheets(), validateSchemaIntegrity(), checkMembershipApplications()
- Debugging helpers: logAllIndividuals(), logAllHouseholds(), logApplicationStatus(), etc.
- 50+ test functions for QA, development, and troubleshooting
- Execution: Run via Apps Script editor → Functions dropdown → Select test → Run; view results in Logs

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
- **Single-page app** with 8 main sections
- Login screen: Email + password (no sign-up; created by board)
- Client-side API: `google.script.run.handlePortalApi(action, params)` (avoids CORS)
- Session storage: Token stored in `sessionStorage` (cleared on browser close)
- Responsive design with mobile navigation

**Page Structure:**
- **dashboard** — Household overview, member list, membership status, upcoming reservations
- **reservations** — Book facility (with real-time limit checking), view current bookings, cancel reservation
- **profile** — View/edit personal info, contact details, emergency contact, upload documents & photos, view verification status
- **card** — Digital membership card (status badge, household info, QR code, transferred to Cloud Storage when approved)
- **payment** — Payment Details page with method instructions (PayPal, SDFCU, Zelle, Absa), submit payment proof, track status
- **rules** — Display GEA rules & regulations, full name signature field, acceptance checkbox for membership agreement
- **myHousehold** — Manage household members, add/remove family, edit relationships, view household staff
- **applicant** — (Restricted view during application workflow) Application status tracking through 11-step process
- **renewal** — (For lapsed members) Membership renewal workflow

**Critical client functions:**
- `submitLogin(event)` → handlePortalApi("login", {email, password})
- `loadDashboard()` → Household data, member list, upcoming reservations
- `showPage(pageName)` → Single-page navigation with page-specific data loading
- `loadProfile()` → Member data display in Personal Information section
- `savePhoneNumbers()` → Updates phone fields via handlePortalApi("updatePhoneNumbers", {…})
- `loadReservations()` → Fetch household reservations with status
- `bookReservation()` → Submit new booking with facility, date, time, guest count
- `cancelReservation(id)` → Cancel existing reservation with refund
- `submitPaymentProof()` → File upload + payment details → handlePortalApi("submit_payment_verification", {…})
- `loadPaymentStatus()` → Track submitted payment verification status

#### Admin.html (Board Interface)
- **3-column layout:** Sidebar navigation + main content + optional details pane
- Role-based access: board, mgt (Leobo only), rso_approve (documents/guests), rso_notify (read-only)
- Responsive design with mobile navigation
- Comprehensive member and facility management

**19 Page Sections:**

**Core Operations:**
- **dashboard** — KPIs: pending reservations, pending photos, unverified payments, today's reservations, membership stats
- **reservations** — Pending booking approvals, approval routing (auto-approved, board review, mgt review), denial with reason
- **waitlist** — Tentative reservations awaiting bumping window expiration (Leobo 5 business days, Tennis 1 day)
- **res-calendar** — Month view of all approved reservations by facility, quick details panel
- **guest-lists** — Submissions requiring RSO review, finalization status, guest name/relationship validation
- **reports** — (No auto-load) Board selects month for payment report, membership year/status filters, CSV export

**Member Management:**
- **members** — Search/filter directory, household profile detail pane, contact info, membership dates, dues status
- **lapsed-members** — Members past expiration date, renewal status, outreach tracking
- **applications** — Membership applications pipeline, 11-step workflow status, board initial/final decisions, RSO document reviews, payment tracking
- **application-rejections** — Archive of rejected applications with decision reasons, response templates to applicants
- **photos** — Photo submissions pending approval, preview, approve (→ Cloud Storage transfer), reject with reason
- **member-doc-rejections** — Document rejection history, reason, member response tracking

**Payment Management:**
- **payments** — Two sub-sections:
  - Pending Verification: Unverified payment submissions with approve/reject/clarify buttons
  - Payment Report: Filterable by membership year & status, summary totals (verified count, USD/BWP collected), CSV export
- **rules** — Display/edit GEA eligibility rules, categories (Full/Associate/Affiliate/Diplomatic/Community/Temporary), conditions, save/delete

**Admin Account Management:**
- **administrators** — CRUD for board, mgt, rso_approve, rso_notify accounts, active/deactivated toggle, password reset

**RSO Portal (for rso_approve & rso_notify roles):**
- **rso-documents** — Documents pending RSO review (passports, omangs only; NOT photos), approve/reject with reason
- **rso-applications** — Applications ready for RSO document review after board initial approval
- **rso-member-documents** — RSO-specific document review queue from members (vs applicants)
- **rso-calendar** — Month view of approved events (read-only for rso_notify, admin controls for rso_approve)
- **rso-approved-guests** — Final guest lists after RSO approval, household contact info, guest details, event coordination

**Critical admin functions:**
- `loadDashboard()` → KPI stats: pending counts, today's reservations, membership data
- `loadReservations()` → Pending approvals, board_approval_required filter
- `approveReservation(id)` → handlePortalApi("admin_approve", {reservation_id})
- `denyReservation(id, reason)` → handlePortalApi("admin_deny", {reservation_id, denial_reason})
- `loadWaitlist()` → Tentative reservations with bump_window_deadline
- `loadPhotos()` → Photo submissions with status, individual preview
- `approvePhoto(submissionId)` → handlePortalApi("admin_photo", {submission_id, decision: "approved"}) → Cloud Storage transfer
- `rejectPhoto(submissionId, reason)` → handlePortalApi("admin_photo", {submission_id, decision: "rejected", reason})
- `loadPayments()` → admin_pending_payments or admin_payment_report based on view
- `confirmPayment(id)` → handlePortalApi("admin_approve_payment", {payment_id})
- `rejectPayment(id, reason)` → handlePortalApi("admin_reject_payment", {payment_id, reason})
- `clarifyPayment(id)` → handlePortalApi("admin_clarify_payment", {payment_id, message})
- `loadApplications()` → Membership application list with status filters, board decision buttons
- `loadGuestLists()` → Pending RSO reviews with household/guest details
- `loadRsoDocuments()` → (rso_approve only) Document review queue with approve/reject
- `loadRsoCalendar()` → (rso_approve) Event calendar by month with household/guest info

---

## Payment Features: Phase 1 & Phase 2

### Phase 1: Core Payment Verification (Feb-Mar 2026)
**Implementation Complete. See:** [CLAUDE_Payments_Implementation.md](docs/implementation/CLAUDE_Payments_Implementation.md) - PART A through PART H

**Member Portal Features:**
- Payment Details page with payment method instructions (PayPal, SDFCU, Zelle, Absa)
- Register Payment Made form (file upload, method, amount, currency, date)
- Payment status tracking (submitted, verified, rejected, clarification_requested)
- Email notifications (submission confirmation, treasurer review, approval/rejection)

**Treasurer Admin Features:**
- Pending Payments view with list of unverified submissions
- Approve payment → sets verified_date, sends confirmation email to member
- Reject payment with reason → notified member to resubmit
- Request clarification → ask member for additional info
- Audit trail of all actions logged

**Backend:** PaymentService.js (10 functions for submission, verification, status tracking)
**Pro-ration:** Dues calculated by quarter (Q1: 100%, Q2: 75%, Q3: 50%, Q4: 25%)
**Email Templates:** PAY_PAYMENT_SUBMITTED_TO_MEMBER, PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD, PAY_PAYMENT_VERIFIED_TO_MEMBER, PAY_PAYMENT_REJECTED_TO_MEMBER, PAY_PAYMENT_CLARIFICATION_REQUESTED_TO_MEMBER (5 templates for payment notifications)

### Phase 2: Payment Enhancements (Mar 13, 2026)
**Implementation Complete. See:** [CLAUDE_Payments_Implementation.md](docs/implementation/CLAUDE_Payments_Implementation.md) - PART B, PART G, PART I, PART K

**1. Automatic Exchange Rate (Phase 2):**
- Daily fetch from open.er-api.com (no API key required)
- Integrated into `runNightlyTasks()` at 2:00 AM GMT+2
- Dynamic storage in Configuration sheet (no hardcoded rates)
- Fallback to EXCHANGE_RATE_DEFAULT if API unavailable
- Used in payment submission for USD↔BWP conversion

**2. Payment History Report (Phase 2):**
- New Payment Report tab in Admin Portal
- Filters: Membership year (All/2025-26/2026-27), Status (Verified/Submitted/Rejected/Clarification)
- Report table: Household, Email, Amount USD, Amount BWP, Method, Status, Date
- Summary section: Verified count, total collected USD, total collected BWP
- CSV export for spreadsheet download

**3. Code Quality (Phase 2):**
- Pro-ration fix: Removed dead code, using config constants
- Legacy consolidation: Removed 4 old handlers, unified to new PaymentService flow
- Standardized verification workflow (approve/reject/clarify)

---

## File Submission Workflow (Critical)

**New in Feb 2026:** Separated file approval into dedicated **File Submissions** sheet to track full history of uploads & rejections.

### Document Approval (2-tier: RSO → GEA Admin)
```
Member uploads passport/omang
  ↓ (status="submitted")
RSO logs in to Admin Portal (rso_approve role) → Document Reviews page
  ├─ Approves → status="rso_approved" (GEA admin can now review)
  │  └─ Email: ADM_DOCUMENT_APPROVED_BY_RSO_TO_MEMBER (notification to member)
  └─ Rejects → status="rso_rejected" (board notified for diplomatic relay)
     └─ Email: ADM_RSO_DOCUMENT_ISSUE_TO_BOARD (to board for handling)
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

---

## RSO Portal Access

**What is RSO?** Regional Security Officer (RSO) is a team member who reviews documents (passports, omangs) and guest lists before events. **RSO does NOT review photos.** RSO accounts are created by the board with two role types:

**RSO Roles:**
- **rso_approve** (full approval authority): Can review and approve/reject documents and guest lists
- **rso_notify** (read-only coordinator): Can view approved calendars and guest lists for event coordination only

**How RSO Logs In:**
1. RSO member has account in **Administrators sheet** (System Backend spreadsheet)
   - Columns: `admin_id`, `email`, `first_name`, `last_name`, `role`, `password_hash`, `active`
   - Roles: `rso_approve` or `rso_notify` (legacy `rso` alias supported for backward compatibility)
2. RSO logs in to **Admin Portal** (https://geabotswana.org/member.html, then "Admin Login" button)
3. Dashboard automatically routes based on role:
   - **rso_approve**: Document Reviews, Guest List Reviews, Event Calendar, Approved Guest Lists
   - **rso_notify**: Event Calendar (read-only), Approved Guest Lists (read-only)

**Document Review Workflow (rso_approve):**
- Admin Portal → Document Reviews page
- List of all documents pending RSO review (passports, omangs only; NOT photos)
- RSO clicks document to preview, then [Approve] or [Reject with reason]
- Approval: Updates status to `rso_approved`, emails member via ADM_DOCUMENT_APPROVED_BY_RSO_TO_MEMBER template
- Rejection: Updates status to `rso_rejected`, emails board via ADM_RSO_DOCUMENT_ISSUE_TO_BOARD template (board relays to member diplomatically)
- **Photos are reviewed by GEA Admin only, not RSO**

**Guest List Review Workflow (rso_approve):**
- Admin Portal → Guest List Reviews page (for pending guest lists only)
- RSO reviews household members, event details, guest names/relationships
- RSO clicks [Approve] for each guest or [Reject] with reason
- After final review, [Submit] to complete guest list validation
- Approved: Event confirmed, guest list visible to RSO Notify members
- Rejected: Board notified, household must resubmit revised list

**Event Coordination (rso_approve & rso_notify):**
- Admin Portal → Event Calendar page
- View approved reservations by facility and month
- See household contact info, guest count, special notes
- rso_notify has read-only access (reference only, cannot approve)

**Notification Workflow:**
- Board notifies RSO team when documents/guest lists need review
- Email templates: ADM_DOCS_SENT_TO_RSO_TO_MEMBER (applicant), ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE (RSO)
- RSO logs in to portal instead of using external links (secure, centralized)

**For complete RSO Portal implementation details, see:** [CLAUDE_RSO_Portal_Implementation.md](docs/implementation/CLAUDE_RSO_Portal_Implementation.md)

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
- Test individual: IND-2026-TEST01 (Jane Johnson) - email: jane@example.com, password: JanePassword2026!
- Test member for admin: board@geabotswana.org (role=board)
- 11 membership test identities available: James Morrison, William Peterson, David Chen, Michael Thompson, Boitumelo Lekgotho, Kgosiemang Sekhosana, Jean-Pierre Dupont, Carlos Rodriguez, Patricia Anderson, George Makgawe, Nelson Kabelo
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
| Code.js | 3,629 | API routes/handlers | _routeAction(), 78 action handlers |
| AuthService.js | 1,893 | Auth/password changes | login(), requireAuth(), validateSession() |
| ApplicationService.js | 1,276 | Membership applications | submitApplication(), getApplicationStatus() |
| ReservationService.js | 2,089 | Booking logic | createReservation(), cancelReservation() |
| Tests.js | 2,494 | Test functions & diagnostics | runDiagnostics(), 40+ test functions |
| Config.js | 865 | Business rule changes | All config_* variables |
| EmailService.js | 926 | Email design/templates | sendEmail(), 69 templates |
| RulesService.js | 403 | Membership eligibility rules | Category assignment, sponsor validation |
| PaymentService.js | 851 | Payment verification | submitPaymentVerification(), payment reporting |
| FileSubmissionService.js | 598 | Document/photo workflows | submitFile(), approveSubmission() |
| MemberService.js | 690 | Member data structure | getMemberById(), updateMember() |
| NotificationService.js | 746 | Nightly tasks & notifications | runNightlyTasks(), email triggers |
| Utilities.js | 586 | Shared helpers | Date math, hashing, validation |
| Portal.html | 8,799 | Member UI | loadProfile(), loadDashboard(), submitLogin(), loadApplicationPage() |
| Admin.html | 6,255 | Admin UI | approveReservation(), rejectPhoto(), admin_pending_payments |
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
- **Last Updated:** April 24, 2026 (GitHub Actions deployment, config sources, email templates, RBAC roles clarified)
