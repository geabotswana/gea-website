# GEA System Architecture

System overview, request flow, service modules, critical design patterns, and architectural decisions.

---

## System Overview

**GEA Management System** is a Google Apps Script web application for the Gaborone Employee Association. It manages memberships, facility reservations, payments, document verification, and member communications.

### Technology Stack

- **Backend:** Google Apps Script (V8) with 9 service modules
- **Frontend:** Four responsive HTML interfaces:
  - **Authenticated:** Portal.html (member), Admin.html (board)
  - **Public:** index.html (informational website, GitHub Pages)
  - **Hybrid:** member.html (portal wrapper with iframe, domain masking)
- **Database:** 4 Google Sheets spreadsheets (members, reservations, payments, system backend)
- **Deployment:** Clasp with @HEAD live deployment for Portal/Admin; GitHub Pages for public site
- **Timezone:** Africa/Johannesburg (GMT+2)
- **Calendar Integration:** Google Calendar for reservation scheduling
- **Cloud Storage:** Google Cloud Storage for member photos & documents

---

## Request Flow

### Complete Request Lifecycle

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
  ├─→ Member routes: dashboard, profile, reservations, book, cancel, card, submit_payment_verification, get_payment_status, upload_file, get_file_status, request_employment
  ├─→ Applicant routes: application_status, confirm_documents, upload_document, submit_payment_proof
  └─→ Board routes: admin_pending, admin_approve, admin_deny, admin_members, admin_photo, admin_pending_payments, admin_approve_payment, admin_reject_payment, admin_clarify_payment, admin_payment_report, admin_applications, admin_approve_file, admin_reject_file
  ↓
Service modules (AuthService, MemberService, ReservationService, PaymentService, FileSubmissionService, ApplicationService, EmailService, NotificationService)
  ↓
Google Sheets API calls
  ↓
Response JSON → Browser → Update UI
```

---

## Critical Design Patterns

### Session Management

```
Architecture:
- One session per user (new login invalidates previous)
- 24-hour timeout (sliding window, extends with each API call)
- Stored in Sessions tab with SHA256 hashed token
- Nightly purge of expired sessions via purgeExpiredSessions()

Implementation:
1. User logs in → generateToken() → hash → store in Sessions
2. Client stores token in sessionStorage
3. Every API call includes token
4. Server validates: validateSession(token)
5. Updates sliding window: expires_at = NOW + 24 hours
6. Returns auth object {email, role, household_id, individual_id}
7. Nightly: purgeExpiredSessions() deletes expired rows
```

### Role-Based Access Control (RBAC)

```
Three roles defined in Sessions tab:

member      // Regular users
            // ├─ View own profile & household
            // ├─ Book reservations (subject to limits)
            // ├─ Cancel own reservations
            // ├─ Upload documents & photos
            // └─ Access portal: Dashboard, Reservations, Profile, Card

board       // Administrators
            // ├─ All member permissions PLUS:
            // ├─ Approve/deny reservations
            // ├─ Approve/reject member photos
            // ├─ Review member applications
            // ├─ Verify payments
            // ├─ Search member directory
            // └─ Access Admin.html

mgt         // Management Officer (Leobo approval authority)
            // ├─ Approve Leobo reservations (first tier)
            // └─ Access restricted admin sections

rso_approve // Regional Security Officer (RSO) - Approval Authority
            // ├─ Review and approve/reject documents (passports, omangs, photos)
            // ├─ Review and approve/reject guest lists
            // ├─ View event calendar for coordination
            // └─ Access RSO Admin Portal sections

rso_notify  // RSO Coordinator (Read-only)
            // ├─ View approved event calendar
            // ├─ View approved guest lists (reference only)
            // └─ Cannot approve/reject documents or guest lists

Authorization check at handler entry:
var auth = requireAuth(p.token, "board");  // Validates token & role
```

### Configuration System

```
All business rules in Config.js (~650 lines)
No hardcoded constants in service modules
Easy to modify: Edit Config.js → clasp push → Changes live immediately

Sections:
1. Spreadsheet IDs (4 main spreadsheets)
2. Tab names (exact sheet names)
3. Folder IDs (Google Drive folders for documents, photos)
4-17. Logo URLs, brand colors, email addresses, business rules, facility limits,
      age thresholds, payment methods, notification config
```

### Email Templates

```
Stored in Email Templates tab (System Backend spreadsheet)
Semantic name format: PREFIX_DESCRIPTION_TO_RECIPIENT (e.g. MEM_APPLICATION_RECEIVED_TO_APPLICANT)
Supports placeholders: {{FIRST_NAME}}, {{FACILITY}}, {{RESERVATION_DATE}}
Supports conditional blocks: {{IF_FAMILY}}...{{END_IF}}
69 templates across 6 categories (ADM, DOC, MEM, PAY, RES, SYS)

Implementation:
1. Handler calls: sendEmailFromTemplate(semanticName, recipient, variables)
2. EmailService fetches template by semantic name from sheet
3. Replaces {{PLACEHOLDER}} with variables
4. Wraps in HTML template
5. Sends from: "Gaborone Employee Association" <board@geabotswana.org>
```

### Audit Logging

```
Every action logged to Audit Log tab (System Backend spreadsheet)

Format: timestamp, user_email, action_type, target_id, details, ip_address

Example entries:
- "2026-03-04T10:15:00Z", "jane@example.com", "create_reservation", "RES-2026-03-04-001", {...}, "192.168.1.1"
- "2026-03-04T10:20:00Z", "board@geabotswana.org", "approve_reservation", "RES-2026-03-04-001", {...}, "192.168.1.2"

Usage:
1. Compliance: Full action trail for audit purposes
2. Debugging: Trace user actions and system behavior
3. Incident response: Identify when/what happened
4. Historical analysis: Monthly/quarterly reporting

Implementation:
logAuditEntry(userEmail, actionType, targetId, details, ipAddress);
```

---

## Sheet Organization

### Member Directory Spreadsheet (MEMBER_DIRECTORY_ID)

| Tab | Purpose | Key Lookup | Rows |
|-----|---------|-----------|------|
| **Households** | Membership units (individual or family) | household_id or primary_member_id | ~500 |
| **Individuals** | People (adults & children) | individual_id or email for auth | ~1500 |
| **File Submissions** | Document & photo uploads w/ workflow | submission_id, filtered by individual_id + document_type | ~3000 |
| **Membership Levels** | Reference table (6 types) | level_id (key joins to Households) | 6 |

### Reservations Spreadsheet (RESERVATIONS_ID)

| Tab | Purpose | Key Lookup | Rows |
|-----|---------|-----------|------|
| **Reservations** | Facility bookings (tennis, leobo, whole) | reservation_id or household_id | ~2000 |
| **Guest Lists** | Attendees for each reservation | reservation_id | ~5000 |
| **Usage Tracking** | Weekly/monthly limits (Tennis 3hrs/week, Leobo 1/month) | household_id, reset nightly | ~500 |

### System Backend Spreadsheet (SYSTEM_BACKEND_ID)

| Tab | Purpose | Key Lookup | Rows |
|-----|---------|-----------|------|
| **Configuration** | All business rules & thresholds | config_key (cached at runtime) | ~100 |
| **Email Templates** | 69 notification templates | semantic_name (ADM_*, DOC_*, MEM_*, PAY_*, RES_*, SYS_*) | 69 |
| **Sessions** | Active user sessions | token (lookup on every request) | ~50 |
| **Audit Log** | Compliance trail | timestamp, user_email, action_type | ~10000 |
| **Membership Applications** | New member application workflow | application_id, status progression | ~300 |
| **Holiday Calendar** | US Federal & Botswana public holidays | For business day calculations | ~30 |

### Payment Tracking Spreadsheet (PAYMENT_TRACKING_ID)

| Tab | Purpose | Key Lookup | Rows |
|-----|---------|-----------|------|
| **Payments** | Dues payments & records | payment_id or household_id | ~1000 |

---

## Service Modules & Responsibilities

### Code.js (1,503 lines)

**Responsibilities:**
- Entry point: `doGet(e)`, `handlePortalApi(action, params)`
- Router: `_routeAction()` dispatches to specific handlers
- 15+ action handlers for member & board operations
- Image proxy: `_handleImageProxy()` serves Drive files as binary
- Error handling and JSON response formatting

**Key Functions:**
```javascript
function doGet(e)                                    // Web app entry point
function handlePortalApi(action, params)            // Main API handler
function _routeAction(action, params)               // Router
function _handleLogin(p)                            // Login handler
function _handleLogout(p)                           // Logout handler
function _handleDashboard(p)                        // Member dashboard
function _handleAdminPending(p)                     // Board: pending reservations
function _handleAdminApprove(p)                     // Board: approve reservation
function _handleAdminDeny(p)                        // Board: deny reservation
function _handleImageProxy(e)                       // Serve Drive images
```

### AuthService.js (546 lines)

**Responsibilities:**
- User authentication and session management
- Password hashing and validation
- Session lookup and validation
- Authorization checks (RBAC)
- Session cleanup

**Key Functions:**
```javascript
function login(email, password)                     // Create session & generate token
function logout(token)                              // Terminate session
function requireAuth(token, required_role)         // Permission check (used by all protected routes)
function validateSession(token)                     // Lookup & verify token still valid
function hashPassword(plaintext)                    // SHA256 hashing
function validatePassword(plaintext, storedHash)   // Constant-time comparison
function purgeExpiredSessions()                     // Nightly cleanup
```

### MemberService.js (622 lines)

**Responsibilities:**
- Member CRUD operations
- Household CRUD operations
- Derived fields and eligibility calculations
- Safe views excluding PII

**Key Functions:**
```javascript
function getMemberByEmail(email)                    // Lookup member
function getMemberById(individual_id)               // Fetch individual record
function updateMember(individual_id, fields)       // Update individual
function createMember(data)                         // Create new individual
function getHouseholdById(household_id)            // Fetch household
function getHouseholdByMemberId(individual_id)    // Get household from member
function updateHousehold(household_id, fields)     // Update household
function _safePublicMember(member)                 // Exclude password_hash, etc.
function _safePublicHousehold(household)           // Safe view for API
function recalculateEligibility(household)         // Voting, fitness, office access
```

### ReservationService.js (797 lines)

**Responsibilities:**
- Booking logic and limit checking
- Approval routing (auto-approve vs board)
- Bumping logic and waitlist promotion
- Cancellation and refunds
- Usage tracking

**Key Functions:**
```javascript
function createReservation(data)                    // Book facility (validates limits)
function approveReservation(reservation_id, approver_email)
function denyReservation(reservation_id, denial_reason)
function cancelReservation(reservation_id, reason)
function getWeeklyUsage(household_id, facility)   // Tennis limits
function getMonthlyUsage(household_id, facility)  // Leobo limits
function calculateNextWeekStart()                  // For nightly reset
function promoteWaitlistedBooking(household_id)  // If earlier bookings cancel
function processBumpingLogic()                     // Auto-promote excess → confirmed
```

### EmailService.js (336 lines)

**Responsibilities:**
- Email sending and template management
- Placeholder replacement
- HTML wrapping
- From/Reply-to configuration

**Key Functions:**
```javascript
function sendEmail(templateId, recipient, variables)  // Core email dispatcher
function getTemplate(templateId)                      // Fetch from sheet
function replaceTemplateVars(template, variables)    // {{PLACEHOLDER}} replacement
function validateEmail(email)                         // Format check
```

### PaymentService.js (600+ lines)

**Responsibilities:**
- Payment submission and verification workflow (Phase 1)
- Payment history reporting with filters (Phase 2)
- Pro-ration calculations by quarter
- Exchange rate management (API fetch & storage) (Phase 2)
- Treasurer review and approval/rejection

**Key Functions:**
```javascript
function submitPaymentVerification(params)            // Member submits payment proof
function getPaymentVerificationStatus(householdId, membershipYear)  // Check status
function listPendingPaymentVerifications()            // Treasurer view list
function approvePaymentVerification(paymentId, treasurerEmail, notes)  // Approve
function rejectPaymentVerification(paymentId, treasurerEmail, reason)  // Reject
function requestPaymentClarification(paymentId, treasurerEmail, request)  // Ask for info
function getPaymentReport(filters)                    // Generate filtered report
function calculateProratedDues(annualDuesUsd)        // Quarterly pro-ration
function fetchAndUpdateExchangeRate()                // Nightly API update
function getExchangeRate()                           // Read current rate with fallback
```

### FileSubmissionService.js (400+ lines)

**Responsibilities:**
- Document and photo upload workflow
- Two-tier document approval (RSO → GEA admin)
- One-tier photo approval (GEA admin only)
- Employment verification requests
- Cloud Storage integration for approved files
- RSO reviews via secure Admin Portal login (rso_approve role)
- Submission history and audit trail

**Key Functions:**
```javascript
function submitFile(params)                          // Member uploads document/photo
function getSubmissionHistory(householdId, documentType)  // View submission history
function approveSubmission(submissionId, approverEmail)  // Approve and move to Cloud Storage
function rejectSubmission(submissionId, approverEmail, reason)  // Reject and notify
function getDocumentsForRsoReview()                  // RSO portal: list documents awaiting review
function approveDocumentByRso(submissionId, rsoEmail)  // RSO approves via admin portal
function getSubmissionStatus(submissionId)           // Check current status
```

### NotificationService.js (400+ lines)

**Responsibilities:**
- Nightly automated tasks (2:00 AM GMT+2)
- Membership renewal warnings
- Document expiration alerts
- Guest list reminders
- Session cleanup
- Bump window monitoring
- Exchange rate updates (Phase 2)

**Key Functions:**
```javascript
function runNightlyTasks()                          // Main nightly runner (includes exchange rate update)
function sendMembershipRenewals()                   // 30-day, 7-day warnings
function sendDocumentExpirationAlerts()             // 6-month passport warnings
function sendGuestListReminders()                   // Deadline reminders
function triggerRsoDailySummary()                   // 6:00 AM RSO digest
function sendHolidayCalReminder()                   // Yearly on Nov 1
function processBumpingDeadlines()                  // Auto-confirm excess bookings
function fetchAndUpdateExchangeRate()               // Update USD↔BWP rate from API
```

### Utilities.js (517 lines)

**Responsibilities:**
- Date math and business day calculations
- Password hashing and validation
- Email and phone validation
- Audit logging
- Input sanitization
- Sheet lookups and data retrieval

**Key Functions:**
```javascript
function addDaysExcludingWeekends(date, days)      // Date math
function isBusinessDay(date)                        // Weekend/holiday check
function getDayOfWeek(date)                         // Day name
function hashPassword(plaintext)                    // SHA256
function validatePassword(plain, hash)              // Constant-time comparison
function isValidEmail(email)                        // Format validation
function isValidPhone(phone)                        // International format
function validateLength(string, min, max)           // Length check
function logAuditEntry(email, action, targetId, details, ipAddress)
function sanitizeInput(string)                      // XSS/injection protection
function getConfigValue(key)                        // Config lookup (cached)
function getCellValue(sheetName, row, column)      // Direct sheet access
function findRowByColumn(data, column, value)      // Array search
```

### Config.js (649 lines)

**Responsibilities:**
- All business rule configuration
- Spreadsheet IDs
- Tab names
- Folder IDs
- Email addresses
- Facility limits
- Nightly task times

**Key Variables:**
```javascript
// Spreadsheet IDs
const MEMBER_DIRECTORY_ID = "..."
const RESERVATIONS_ID = "..."
const SYSTEM_BACKEND_ID = "..."
const PAYMENT_TRACKING_ID = "..."

// Facility limits
const TENNIS_WEEKLY_LIMIT_HOURS = 3
const LEOBO_MONTHLY_LIMIT_HOURS = 6
const TENNIS_BUMP_WINDOW_DAYS = 1
const LEOBO_BUMP_WINDOW_BUSINESS_DAYS = 5

// Email configuration
const BOARD_APPROVAL_EMAIL = "board@geabotswana.org"
const MGMT_APPROVAL_EMAIL = "mgt-notify@geabotswana.org"
const RSO_NOTIFICATION_EMAIL = "rso-notify@geabotswana.org"

// Nightly task times (Africa/Johannesburg timezone)
const NIGHTLY_TASK_TIME = "02:00"
const APPROVAL_REMINDER_SEND_TIME = "06:00"
const GUEST_LIST_FINAL_CALL_SEND_TIME = "06:00"
const RSO_DAILY_SUMMARY_TIME = "06:00"
```

### Tests.js (665 lines)

**Responsibilities:**
- Test utilities for manual testing
- Diagnostic functions
- Schema validation
- Integration test runners

**Key Functions:**
```javascript
function testGetMembers()                           // Fetch member list
function testCreateReservation()                    // Book facility
function testEmailSending()                         // Send test email
function runDiagnostics()                           // Full system check
function checkAllSheets()                           // Spreadsheet connectivity
function validateSchemaIntegrity()                  // Data structure validation
```

---

## Frontend Structure

### Portal.html (Member Interface)

**Single-page app** with 4 main sections:
- **Dashboard:** Household members, membership status, upcoming reservations
- **Reservations:** Book facility (with limit checking), list current, cancel
- **Profile:** View/edit contact info, upload documents & photos, view verification status
- **Card:** Digital membership card (shows approval status)

**Key Client Functions:**
```javascript
function submitLogin(event)            // Login form submission
function loadDashboard()                // Dashboard page load
function showPage(pageName)            // Navigate between sections
function loadProfile()                  // Fetch & display member data
function savePhoneNumbers()            // Update phone fields
function bookFacility()                 // Submit reservation
function cancelReservation(id)         // Cancel booking
function uploadDocument(type, file)    // Submit document
```

### Admin.html (Board Interface)

**3-column layout:** Sidebar navigation + main content + optional details pane

**Key Admin Sections:**
- **Dashboard:** Stats (pending reservations, pending photos, payment queue, today's events)
- **Reservations:** Approve/deny excess bookings, view event calendar
- **Members:** Search directory, view household details
- **Photos:** Review photo submissions (approve/reject)
- **Payments:** Two sub-views:
  - Pending Verification: List unverified payments with approve/reject buttons
  - Payment Report: Filterable report with membership year/status filters, summary totals, CSV export

**Key Admin Functions:**
```javascript
function approveReservation(id)         // Approval handler
function denyReservation(id, reason)   // Denial handler
function approvePhoto(individualId)    // Photo approval
function rejectPhoto(individualId, reason)
function loadPayments()                 // Load pending payments
function confirmPayment(paymentId)      // Approve payment
function markPaymentNotFound(paymentId) // Reject payment
function loadPaymentReport()            // Generate filtered report
function exportPaymentReportToCSV()     // CSV download
function searchMembers(query)           // Member directory
```

### index.html (Public Website)

**URL:** https://geabotswana.org
**Deployment:** GitHub Pages (automatic on `git push`)

**Sections:**
- Navigation (sticky, with "Member Login" link)
- Hero (tagline, CTAs)
- About GEA (mission, facilities overview, board officers)
- Facilities (Tennis/Basketball, Playground, Leobo, Gym)
- Contact & Footer

### member.html (Portal Wrapper)

**URL:** https://geabotswana.org/member.html
**Purpose:** Domain masking for authenticated member portal

**Implementation:** Full-page iframe embedding GAS web app
**UX Benefit:** Users see geabotswana.org in address bar (not script.google.com)

---

## External Integrations

### Google Sheets API
- Member directory, reservations, payments (all core operations)
- Direct sheet reading/writing via Apps Script built-in Sheets service
- No external authentication (uses script's account)

### Gmail API
- Email notifications via `GmailApp.sendEmail()`
- Used for all member communications
- From: "Gaborone Employee Association"
- Reply-to: board@geabotswana.org

### Google Drive API
- Document uploads for membership applications
- Photo storage and retrieval
- File serving via image proxy endpoint

### Google Calendar API
- Reservation calendar integration
- Event creation on booking
- Event deletion on cancellation
- Title tags: [TENTATIVE], [APPROVED], [DENIED], etc.

### Google Cloud Storage
- Member photo storage (after approval)
- Path: `gs://gea-member-data/{household_id}/{individual_id}/photo.jpg`
- Used for digital membership card display

---

## Key Architectural Decisions

### google.script.run vs fetch()

```
Preferred: google.script.run
- No CORS issues
- Automatic authentication handling
- Simpler error handling
- Type-safe parameter passing

Legacy: fetch() to doGet()
- Causes CORS errors with script.google.com
- Requires manual token handling
- More complex error handling
- Future: Replace all fetch() with google.script.run
```

### Synchronous vs Asynchronous Operations

```
Apps Script does not have true async/await
All operations are synchronous with timeouts

Important:
- Nightly tasks: 6-minute max execution time
- API calls: 30-second max per request
- Long operations: Split into multiple scheduled tasks
```

---

## Future Extensions (Low-Impact)

Easy to add without modifying core code:

```
New email templates:
  └─ Add row to Email Templates tab → Config.js references tpl_ID

New membership categories:
  └─ Add row to Membership Levels → Use level_id in Config.js

New facilities:
  └─ Add to Config.FACILITIES → Reservation logic handles automatically

New roles:
  └─ Add to Sessions tab → Update requireAuth() if needed

New nightly tasks:
  └─ Add function to NotificationService.js → Call from runNightlyTasks()
```

---

## Related Documentation

- **CLAUDE_Authentication_RBAC.md** — Session management, auth flow, RBAC
- **CLAUDE_Reservations_Implementation.md** — Booking logic, approval routing
- **CLAUDE_Membership_Implementation.md** — Application workflow
- **CLAUDE_Security.md** — Security practices, input validation, encryption
- **CLAUDE_Deployment.md** — Deployment process, testing, troubleshooting
- **GEA_System_Schema.md** — Complete database schema (docs/reference/)

---

**Last Updated:** March 4, 2026
**Source:** Extracted from CLAUDE.md lines 7–19, 51–107, 111–141, 145–206, 1314–1327, 1331–1348
