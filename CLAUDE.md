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
  ├─→ Public routes: login, logout
  ├─→ Member routes: dashboard, profile, reservations, book, cancel, card, submit_payment_verification, get_payment_status, upload_file, get_file_status, request_employment
  ├─→ Applicant routes: application_status, confirm_documents, upload_document, submit_payment_proof
  └─→ Board routes: admin_pending, admin_approve, admin_deny, admin_members, admin_photo, admin_pending_payments, admin_approve_payment, admin_reject_payment, admin_clarify_payment, admin_payment_report, admin_applications, admin_approve_file, admin_reject_file
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
| Households | Membership units (individual or family) | `household_id` or `primary_member_id` |
| Individuals | People (adults & children) | `individual_id` or `email` for auth |
| File Submissions | Document & photo uploads w/ workflow | `submission_id`, filtered by `individual_id` + `document_type` |
| Membership Applications | New member application workflow | `application_id`, status progression |
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
| Email Templates | 69 notification templates | `semantic_name` (e.g. ADM_*, DOC_*, MEM_*, PAY_*, RES_*, SYS_*) |
| Sessions | Active user sessions | `token` (lookup on every request) |
| Administrators | Admin accounts (board, rso_approve, rso_notify, mgt roles) | `email` for auth |
| Audit Log | Compliance trail (1000s of rows) | timestamp, user_email, action_type |
| Holiday Calendar | US Federal & Botswana public holidays | For business day calculations |

### Payment Tracking (PAYMENT_TRACKING_ID)
| Tab | Purpose | Key Lookup |
|-----|---------|-----------|
| Payments | Dues payments submitted by members with verification status | `payment_id` or `household_id` |

---

## Service Modules & Responsibilities

**Code.js** (3,629 lines)
- Entry point: doGet(e), handlePortalApi(action, params)
- Router: _routeAction() dispatches to 78 specific handlers for members, applicants, and board
- Image proxy: _handleImageProxy() serves Drive files as binary
- Request flow: Validates session → authorizes role → executes handler → returns JSON response

**AuthService.js** (1,893 lines)
- login(email, password) → session creation & token generation
- logout(token) → session termination
- requireAuth(token, role?) → permission check (used by all protected routes)
- validateSession(token) → lookup & verify token still valid
- Password validation: SHA256 hash comparison with constant-time comparison
- Admin account authentication (board, mgt, rso_approve, rso_notify roles)

**MemberService.js** (690 lines)
- Member CRUD: getMemberByEmail(), getMemberById(), updateMember(), createMember()
- Household CRUD: getHouseholdById(), getHouseholdByMemberId(), updateHousehold()
- Derived fields: Recalculate voting_eligible, fitness_center_eligible, office_eligible
- Safe views: _safePublicMember(), _safePublicHousehold() (exclude password_hash, etc.)

**ReservationService.js** (2,089 lines)
- Booking logic: createReservation() checks limits (Tennis 3hrs/week, Leobo 1/month)
- Bumping logic: Tennis 1-day window, Leobo 5 business days
- Cancellation: cancelReservation(), refund logic, calendar event cleanup
- Usage tracking: getWeeklyUsage(), getMonthlyUsage(), calculateNextWeekStart()
- Limit enforcement: Excess bookings flag as pending for board approval
- Guest list management: submitGuestList(), getGuestList(), approveGuestList()

**PaymentService.js** (851 lines)
- Payment submission, verification workflow, treasurer approval/rejection/clarification
  - submitPaymentVerification() — Member submits payment proof with file upload
  - listPendingPaymentVerifications() — List all unverified payments
  - approvePaymentVerification(), rejectPaymentVerification(), requestPaymentClarification()
  - calculateProratedDues() — Calculate quarterly dues
- Exchange rate management: fetchAndUpdateExchangeRate() (via API nightly), getExchangeRate()
- Payment reporting: getPaymentReport(filters) — Generate payment history with filters

**FileSubmissionService.js** (598 lines)
- File submission workflow: Documents (passport/omang), photos, employment verification
- Two-tier document approval: RSO review → GEA admin review
- One-tier photo approval: GEA admin only → Cloud Storage transfer
- Functions: submitFile(), getSubmissionHistory(), approveSubmission(), rejectSubmission()
- RSO approval workflow: RSO logs in to Admin Portal with rso_approve role
- Cloud Storage integration: Transfer approved photos to gs://gea-member-data/
- Audit trail: Track all uploads, reviews, approvals, rejections with timestamps

**EmailService.js** (926 lines)
- sendEmail(templateId, recipient, variables) → Core email dispatcher
- Fetches template from sheet, replaces placeholders ({{FIELD}} format), wraps in HTML
- From: "Gaborone Employee Association", Reply-to: board@geabotswana.org
- 69 email templates across 6 categories (ADM, DOC, MEM, PAY, RES, SYS)
- Supports conditional blocks: {{IF_FAMILY}}...{{END_IF}}, {{IF_TEMPORARY}}...{{END_IF}}

**NotificationService.js** (746 lines)
- runNightlyTasks() → Daily at 2:00 AM GMT+2
  - Membership renewals (30-day, 7-day warnings before July 31)
  - Document expiration alerts (6-month passport warnings)
  - Guest list deadline reminders
  - Session purge (delete expired sessions)
  - Bump window expiration (promote tentative to confirmed)
  - Exchange rate update via API (USD to BWP)
- triggerRsoDailySummary() → Daily at 6:00 AM (RSO gets daily event list)
- sendHolidayCalReminder() → Yearly on Nov 1 (board reminder)

**ApplicationService.js** (1,276 lines)
- Membership application workflow: 11-step lifecycle from submission through activation
- submitApplication() → Create new household + individuals with temp password
- getApplicationStatus() → Track applicant through approval workflow
- Document submission: confirmDocumentsUploaded(), uploadDocument()
- Payment submission: submitPaymentProof(), getPaymentStatus()
- Board & RSO workflows: Application moves through 11 steps with role-based approvals
- Category assignment: Automatic routing based on eligibility questionnaire responses
- Sponsorship verification: Validate sponsor relationships for Community members

**RulesService.js** (403 lines)
- Eligibility rules engine: Membership category determination from questionnaire
- 6 category rules: Full, Associate, Affiliate, Diplomatic, Temporary, Community
- Rule logic: Embassy employment, USG funding (51% minimum for Associate), visa type, posting dates
- Sponsor validation: Verify sponsor exists and has active Full membership
- Fallback rules: <51% USG funding routes to Community, not Associate
- Questionnaire integration: Q1-Q5 responses determine eligibility path

**Utilities.js** (586 lines)
- Date math: addDaysExcludingWeekends(), isBusinessDay(), getDayOfWeek()
- Hashing: hashPassword() (SHA256), validatePassword()
- Validation: isValidEmail(), isValidPhone(), validateLength()
- Audit logging: logAuditEntry()
- Safe guards: sanitizeInput() (no injection attacks)
- Lookups: getConfigValue(), getCellValue(), findRowByColumn()
- Constants-time comparison: Used for all security-sensitive equality checks

**Config.js** (865 lines)
- Section 1: Spreadsheet IDs (4 main spreadsheets + folders)
- Section 2: Tab names (exact sheet names)
- Section 3: Folder IDs (Google Drive folders for documents, photos, cloud storage)
- Section 4-17: Logo URLs, brand colors, email addresses, business rules, facility limits, age thresholds, payment methods, notification config, membership categories
- Updated: March 28, 2026

**Tests.js** (2,494 lines)
- Test utilities: testGetMembers(), testCreateReservation(), testEmailSending(), testMembershipApplication()
- Diagnostics: runDiagnostics(), checkAllSheets(), validateSchemaIntegrity(), checkMembershipApplications()
- 40+ test functions for QA and development
- Used for debugging spreadsheet connections and data integrity

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
  - **Dashboard:** Stats (pending reservations, pending photos, unverified payments, today's reservations)
  - **Reservations:** Approve/deny excess bookings, view event calendar
  - **Members:** Search member directory, view household details
  - **Photos:** Review photo submissions (approve/reject with reason, transfers approved to Cloud Storage)
  - **Payments:** Two sub-views:
    - **Pending Verification:** List unverified payments with approve/reject buttons
    - **Payment Report:** Filterable report with membership year and status filters, summary totals, CSV export

**Critical admin functions:**
- `showPage('reservations')` → _handleAdminPending() (list pending bookings)
- `approveReservation(id)` → _handleAdminApprove() (update status, send email)
- `denyReservation(id)` → _handleAdminDeny() (record reason, send email)
- `approvePhoto(individualId)` → _handleAdminPhoto(decision="approved") (transfers to Cloud Storage)
- `rejectPhoto(individualId, reason)` → _handleAdminPhoto(decision="rejected")
- `loadPayments()` → admin_pending_payments (list unverified)
- `confirmPayment(id)` → admin_approve_payment (approve and verify)
- `markPaymentNotFound(id)` → admin_reject_payment with reason
- `loadPaymentReport()` → admin_payment_report (with filters)

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
