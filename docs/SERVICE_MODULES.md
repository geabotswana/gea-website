# GEA Service Modules Reference

**Last Updated:** April 24, 2026

Complete reference for all Google Apps Script service modules and their responsibilities.

---

## Backend Service Modules

### Code.js (4,903 lines)
**Purpose:** Main entry point and request router for the GEA system.

- **Entry points:** doGet(e), handlePortalApi(action, params), handleContentService(e)
- **Request Router:** _routeAction() dispatches to 60+ handlers across public, member, applicant, household, and board categories
- **Image Proxy:** _handleImageProxy() serves Drive files as binary; _handleGetFileData() for authenticated file access
- **Request Flow:** Validates session → authorizes role → executes handler → returns JSON response
- **Error Handling:** Standardized error responses with proper HTTP status codes

**Key Functions:**
- handlePortalApi(action, params) → Main request handler
- _routeAction(action, params) → Dispatches to specific handlers
- errorResponse(message, code) → Standardized error format

---

### AuthService.js (2,110 lines)
**Purpose:** Authentication, authorization, session management, and password handling.

- **Authentication:** login(email, password) → session creation & token generation
- **Session Termination:** logout(token) → session invalidation
- **Authorization:** requireAuth(token, role?) → permission check on every protected request
- **Session Validation:** validateSession(token) → lookup, verify validity, check expiration
- **Token Security:** SHA256 hashing, constant-time comparison, entropy-based generation
- **Password Management:** SHA256 hash storage (never plain-text), password reset workflows

**Roles Supported:**
- `member` — Regular members (portal access)
- `board` — Administrators with approval powers
- `mgt` — Management Officer (Leobo approvals only)
- `rso_approve` — Document and guest list reviewer
- `rso_notify` — Read-only event coordinator
- `applicant` — Pending membership approval

**Key Functions:**
- login(email, password) → Creates session, generates token
- logout(token) → Invalidates session
- requireAuth(token, role?) → Validates token and permission
- validateSession(token) → Verifies token still valid

---

### MemberService.js (796 lines)
**Purpose:** Member and household CRUD operations, data safety, and derived field calculations.

- **Member Operations:** getMemberByEmail(), getMemberById(), updateMember(), createMember()
- **Household Operations:** getHouseholdById(), getHouseholdByMemberId(), updateHousehold(), calculateHouseholdStats()
- **Derived Fields:** Recalculate voting_eligible, fitness_center_eligible, office_eligible based on membership category/status
- **Safe Data Views:** _safePublicMember(), _safePublicHousehold() (exclude password_hash, tokens, sensitive data)
- **Membership Status Routing:** Returns appropriate fields based on member/applicant/lapsed/resigned/expelled state

**Key Functions:**
- getMemberById(individual_id) → Fetch individual record
- getHouseholdById(household_id) → Fetch household record
- updateMember(individual_id, data) → Update individual record with validation
- updateHousehold(household_id, data) → Update household record

---

### ReservationService.js (2,089 lines)
**Purpose:** Facility reservation booking, approval routing, bumping logic, and usage tracking.

- **Booking Logic:** createReservation() enforces facility limits (Tennis 3hrs/week, Leobo 1/month)
- **Approval Routing:** Regular bookings auto-approved; excess → board approval; Leobo → two-stage (mgt → board)
- **Bumping Logic:** Tennis 1-day window, Leobo 5 business days; auto-promotion if blocking reservation cancelled
- **Cancellation:** cancelReservation() with refund, calendar event cleanup, bump promotion check
- **Usage Tracking:** getWeeklyUsage(), getMonthlyUsage(), calculateNextWeekStart(); reset nightly via NotificationService
- **Guest List Management:** submitGuestList(), getGuestList(), finalizeGuestList(); RSO reviews before event

**Facility Limits:**
- Tennis Court: 3 hrs/week, 2 hrs/session, auto-approved if under limit
- Leobo: 1/month, requires management then board approval
- Gym/Playground: Unlimited (walk-up)
- Basketball: Unlimited (walk-up)

**Key Functions:**
- createReservation(household_id, facility, date, time, duration) → Create booking with limit checking
- cancelReservation(reservation_id) → Cancel with refund and bump processing
- getWeeklyUsage(household_id) → Get current week's tennis hours
- getMonthlyUsage(household_id) → Get current month's Leobo count

---

### PaymentService.js (1,011 lines)
**Purpose:** Payment submission, verification workflow, currency conversion, and reporting.

- **Payment Submission:** submitPaymentVerification() → Member submits proof with file upload
- **Verification Workflow:** Treasurer review → approve/reject/request clarification
- **Currency Support:** USD, BWP with automatic conversion; exchange rates updated nightly
- **Pro-ration:** calculateProratedDues() for quarterly calculations (Q1: 100%, Q2: 75%, Q3: 50%, Q4: 25%)
- **Exchange Rate Management:** fetchAndUpdateExchangeRate() nightly via open.er-api.com API
- **Payment Reporting:** getPaymentReport(filters) with membership year and status filters; CSV export

**Key Functions:**
- submitPaymentVerification(household_id, file, method, amount, currency, date) → Submit payment proof
- approvePaymentVerification(payment_id) → Treasurer verifies payment
- rejectPaymentVerification(payment_id, reason) → Reject with reason
- requestPaymentClarification(payment_id, message) → Ask for more info
- getPaymentReport(filters) → Generate report with filters

---

### FileSubmissionService.js (1,413 lines)
**Purpose:** Document and photo upload, multi-tier approval workflow, expiration tracking.

- **File Submission:** submitFile() for documents (passport/omang), photos, employment verification
- **Two-Tier Document Approval:** RSO review → GEA admin review
- **One-Tier Photo Approval:** GEA admin only → Cloud Storage transfer
- **Expiration Tracking:** Monitors document expiration dates; sends 6-month and 1-month warning emails
- **Approval Functions:** submitFile(), getSubmissionHistory(), approveSubmission(), rejectSubmission(), requestResubmit()
- **Audit Trail:** Track all uploads, reviews, approvals, rejections with user, timestamp, decision reason

**Status Workflows:**

**ID Documents (Passport/Omang):**
1. submitted → awaiting RSO review
2. rso_approved → awaiting GEA admin
3. gea_pending → GEA admin reviewing
4. verified → Both approved (is_current=TRUE)
5. rso_rejected / gea_rejected → Rejected at stage

**Photos:**
1. submitted → awaiting GEA admin
2. gea_pending → GEA admin reviewing
3. approved → GEA admin approved; transferred to Cloud Storage (is_current=TRUE)
4. rejected → Rejected

**Key Functions:**
- submitFile(individual_id, document_type, file) → Upload document/photo
- approveSubmission(submission_id, reviewed_by) → Approve at current stage
- rejectSubmission(submission_id, reason) → Reject with reason
- getSubmissionHistory(individual_id, document_type) → Get all submissions for type

---

### EmailService.js (1,071 lines)
**Purpose:** Email template dispatcher, placeholder replacement, and delivery.

- **Core Dispatcher:** sendEmail(semantic_name, recipient, variables) fetches template and sends via Gmail
- **Template System:** 114 templates stored as metadata in Email Templates tab + body text in Google Drive files
- **Placeholders:** {{FIELD}} format with support for conditional blocks {{IF_FAMILY}}...{{END_IF}}, {{IF_TEMPORARY}}...{{END_IF}}
- **From Address:** "Gaborone Employee Association"; Reply-to: board@geabotswana.org (enables office email forwarding)
- **Categories:** ADM (6), DOC (18), MEM (26), PAY (14), RES (25), SYS (25) templates
- **HTML Wrapping:** Embeds template body in branded HTML wrapper with logo, footer, unsubscribe info

**Template Format:**
- Semantic name: PREFIX_DESCRIPTION_TO_RECIPIENT (e.g., MEM_APPLICATION_RECEIVED_TO_APPLICANT)
- Placeholders: {{APPLICANT_NAME}}, {{DUES_AMOUNT}}, {{HOUSEHOLD_TYPE}}, etc.
- Conditionals: {{IF_FAMILY}}...{{END_IF}}, {{IF_TEMPORARY}}...{{END_IF}}

**Key Functions:**
- sendEmail(semantic_name, recipient, variables) → Send email using template
- replaceTemplateVariables(body, variables) → Replace {{PLACEHOLDERS}} with values

---

### NotificationService.js (774 lines)
**Purpose:** Scheduled background tasks, nightly/daily reminders, and automated workflows.

- **Nightly Tasks (2:00 AM GMT+2):** runNightlyTasks()
  - Membership renewals: 30-day and 7-day warnings before July 31 expiration
  - Document expiration alerts: 6-month passport/omang warnings
  - Guest list reminders: Final calls for pending guest lists 2 days before event
  - Session purge: Delete expired sessions from Sessions tab
  - Bump window expiration: Auto-promote tentative to confirmed if deadline passed
  - Exchange rate update: Fetch USD↔BWP rate from API, store in Rates tab
- **Daily Tasks (6:00 AM GMT+2):** triggerRsoDailySummary() sends RSO event list for day
- **Annual Tasks (Nov 1):** sendHolidayCalReminder() board reminder to populate Holiday Calendar

**Key Functions:**
- runNightlyTasks() → Execute all nightly tasks
- purgeExpiredSessions() → Delete sessions past 24-hour expiration
- checkMembershipExpiration() → Send renewal warnings
- checkDocumentExpiration() → Send document expiration warnings
- updateExchangeRate() → Fetch and store latest USD↔BWP rate

---

### ApplicationService.js (1,531 lines)
**Purpose:** Membership application lifecycle management, eligibility determination, and activation.

- **Application Lifecycle:** 11-step workflow from submission → activation
- **Steps:** Submit → Documents → Board Initial Review → RSO Documents Review → Board Final → Payment → Activation
- **Eligibility Questionnaire:** Q1-Q5 responses auto-determine membership category
- **Document Submission:** confirmDocumentsUploaded(), uploadDocument() with validation
- **Payment Workflow:** Applicants submit proof after board approval; treasurer verifies
- **Sponsorship:** Community/Affiliate/Diplomatic require sponsor verification
- **Account Creation:** New household + individual records created with temporary password

**Key Functions:**
- submitApplication(data) → Create new application with household/individual records
- getApplicationStatus(application_id) → Track applicant through workflow
- confirmDocumentsUploaded(application_id) → Move to documents-confirmed stage
- submitPaymentProof(application_id, file, data) → Submit payment for activation
- activateApplication(application_id) → Final activation after payment verified

---

### RulesService.js (420 lines)
**Purpose:** Membership eligibility determination and validation.

- **Eligibility Rules Engine:** determineCategory() auto-routes based on questionnaire responses
- **6 Categories with Business Logic:**
  - Full: embassy employee
  - Associate: 51%+ USG funding
  - Affiliate: 33%+ USG funding
  - Diplomatic: visa holders
  - Community: sponsor-based
  - Temporary: contractors (max 6 months)
- **Rule Logic:** Embassy employment, USG funding threshold, visa type, posting dates
- **Sponsor Validation:** Verify sponsor exists, has active Full membership, not maxed out sponsorships
- **Fallback Rules:** <51% USG routes to Community (not Associate)

**Key Functions:**
- determineCategory(questionnaire_responses) → Auto-assign membership category
- validateSponsor(sponsor_email) → Verify sponsor eligibility
- calculateDues(category, household_type) → Get applicable dues

---

### Utilities.js (657 lines)
**Purpose:** Shared helper functions, date math, hashing, validation, and logging.

- **Date Math:** addDaysExcludingWeekends(), isBusinessDay(), getDayOfWeek(), getAgeCategory()
- **Hashing:** hashPassword() (SHA256), validatePassword(), constantTimeCompare() for security
- **Validation:** isValidEmail(), isValidPhone(), validateLength(), sanitizeInput() for XSS prevention
- **Lookups:** getConfigValue() (cached), getCellValue(), findRowByColumn(), findAllRowsByColumn()
- **Audit Logging:** logAuditEntry() records all significant actions with user, action type, target, details, IP
- **Error Handling:** standardized errorResponse() format for API consistency

**Key Functions:**
- hashPassword(password) → SHA256 hash
- validatePassword(password, hash) → Constant-time comparison
- addDaysExcludingWeekends(date, days) → Add business days only
- isBusinessDay(date) → Check if not weekend/holiday
- logAuditEntry(user_email, action_type, target_id, details) → Log action

---

### Config.js (998 lines)
**Purpose:** Static configuration constants and system-wide settings.

- **Spreadsheet IDs:** MEMBER_DIRECTORY_ID, RESERVATIONS_ID, SYSTEM_BACKEND_ID, PAYMENT_TRACKING_ID
- **Tab Names:** Exact sheet names for all 18 tabs across 4 spreadsheets
- **Folder IDs:** Google Drive folders for documents, photos, employment verification, cloud storage
- **Constants:** URLs, colors, contact emails, facility names, membership categories, age thresholds, payment methods
- **Last Updated:** April 24, 2026

**Note:** For runtime values that change without deployment, see Configuration tab in System Backend spreadsheet.

---

### Tests.js (3,071 lines)
**Purpose:** Testing utilities, integration tests, diagnostics, and debugging helpers.

- **Test Utilities:** testGetMembers(), testCreateReservation(), testEmailSending(), testMembershipApplication()
- **Integration Tests:** Full workflow tests for application, payment, reservation, document submission
- **Diagnostics:** runDiagnostics(), checkAllSheets(), validateSchemaIntegrity(), checkMembershipApplications()
- **Debugging Helpers:** logAllIndividuals(), logAllHouseholds(), logApplicationStatus(), etc.
- **Function Count:** 50+ test functions for QA, development, and troubleshooting
- **Execution:** Run via Apps Script editor → Functions dropdown → Select test → Run; view results in Logs

**Key Functions:**
- runDiagnostics() → Full system health check
- testGetMembers() → Verify member retrieval
- testCreateReservation() → Test booking workflow
- checkMembershipApplications() → Audit application records

---

**For detailed implementation and workflow examples, see:**
- [GEA_System_Schema.md](reference/GEA_System_Schema.md) - Database schema
- [CLAUDE_Payments_Implementation.md](implementation/CLAUDE_Payments_Implementation.md) - Payment workflow
- [CLAUDE_Reservations_Implementation.md](implementation/CLAUDE_Reservations_Implementation.md) - Reservation workflow
- [CLAUDE_Membership_Implementation.md](implementation/CLAUDE_Membership_Implementation.md) - Application workflow
