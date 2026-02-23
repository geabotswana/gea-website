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

## Reservation Workflow (Complete Lifecycle)

### Facilities & Booking Rules

**Five Facilities:**
1. **Tennis Court/Basketball Court (TC/BC)** — Dual-use outdoor court at Rec Center (reservable)
2. **Covered Meeting Area (Leobo)** — Sheltered gathering space at Rec Center (reservable)
3. **Rec Center (Whole Facility)** — Entire facility booking, includes TC/BC + Leobo only (reservable)
4. **Playground** — Walk-up only, no reservations, at Rec Center
5. **Gym** — Walk-up only, no reservations, separate location

**Booking Time Slots & Duration:**
- Time slots: :00, :15, :30, :45 intervals
- Minimum booking: 15 minutes
- Maximum booking: 2 hours per session
- Session example: 14:00–15:30 = 1.5 hours

**Household Booking Limits:**
| Facility | Limit | Period | Notes |
|----------|-------|--------|-------|
| Tennis Court/Basketball | 3 hours | Weekly (Mon–Sun) | Enforced nightly, resets Monday 2:00 AM GMT+2 |
| Leobo | 1 booking | Monthly | Max 6 hours per booking; resets 1st of month 2:00 AM GMT+2 |
| Rec Center | No limit | — | Subject to component limits (TC/BC 3hrs/week OR Leobo 1/month) |

### Complete Reservation Lifecycle

```
STEP 1: Member Submits Booking Request
  ├─ Portal.bookFacility() → handlePortalApi("book", params)
  ├─ ReservationService.createReservation() validates:
  │  ├─ Household active & membership current
  │  ├─ Facility exists & date/time valid
  │  ├─ No double-booking (same facility overlaps)
  │  ├─ Rec Center check: blocks if TC/BC OR Leobo already booked in slot
  │  ├─ Usage limits:
  │  │  ├─ Tennis: weekly usage + this request ≤ 3 hours → Regular booking
  │  │  └─ Tennis: weekly usage + this request > 3 hours → Excess booking (flag for board approval)
  │  │  ├─ Leobo: monthly usage + this request ≤ 6 hours → Regular booking
  │  │  └─ Leobo: monthly usage + this request > 6 hours → Excess booking (flag for board approval)
  │  └─ Generates reservation_id (RES-YYYY-MM-DD-###)
  ├─ Creates calendar event on Reservations Calendar:
  │  ├─ Title: "[TENTATIVE] [FACILITY] - [HOUSEHOLD_NAME]"
  │  ├─ Description contains: reservation_id, household_id, facility_type, booking_status, approval_status
  │  └─ Event visible to member immediately (even if pending approval)
  ├─ Inserts row in Reservations sheet with status & timestamps
  └─ Sends email to board@geabotswana.org: "New Booking Submitted" (includes household usage stats)

STEP 2: Approval Routing (Facility-Dependent)
  
  ┌─ TENNIS COURT / BASKETBALL (TC/BC)
  │
  ├─ IF Regular booking (usage ≤ 3 hrs/week after this):
  │  └─ AUTO-APPROVED (no board review needed)
  │     ├─ Update calendar: status=[APPROVED]
  │     ├─ Update Reservations sheet: approval_status="approved_auto", board_approved_by="System"
  │     └─ Send member email: "Booking Approved"
  │
  └─ IF Excess booking (usage > 3 hrs/week after this):
     ├─ Send board@geabotswana.org approval request
     ├─ Calendar marked [TENTATIVE_EXCESS]
     ├─ Reservations sheet: board_approval_required=TRUE, board_approved_by=NULL
     ├─ Member can see booking but it's "Pending Board Approval"
     └─ Board approves/denies (see STEP 3 below)

  ┌─ LEOBO (COVERED MEETING AREA)
  │
  └─ TWO-STAGE APPROVAL (Mgmt FIRST, then Board)
     ├─ Send mgt-notify@geabotswana.org for Mgmt Officer approval
     ├─ Calendar marked [TENTATIVE]
     ├─ Reservations sheet: mgmt_approval_required=TRUE, mgmt_approved_by=NULL
     ├─ Once Mgmt approves:
     │  ├─ Calendar updated to [TENTATIVE_BOARD]
     │  ├─ Send board@geabotswana.org for Board approval
     │  └─ Reservations sheet: mgmt_approval_required=FALSE, mgmt_approved_by=[NAME], board_approval_required=TRUE
     └─ Once Board approves (or denies):
        └─ Proceed to STEP 3

  ┌─ REC CENTER (WHOLE FACILITY)
  │
  └─ TWO-STAGE APPROVAL (same as Leobo)
     ├─ Mgmt must approve FIRST
     ├─ Board approves SECOND
     ├─ System tracks previous Whole Facility requests to prevent conflicts
     └─ Same calendar & sheet updates as Leobo above

STEP 3: Board/Mgmt Review & Decision
  
  ┌─ APPROVE
  │  ├─ Admin.html approveReservation(reservation_id)
  │  ├─ Update Reservations sheet: approval_status="approved", [APPROVER]_approved_by=[BOARD_MEMBER], [APPROVER]_approval_timestamp=NOW
  │  ├─ Update calendar event: title=[APPROVED], description updated
  │  ├─ Send member email: "Booking Approved - Ready to Proceed"
  │  ├─ Set bumping deadline (if applicable):
  │  │  ├─ Tennis excess: bump_window_deadline = reservation_date - 1 day
  │  │  └─ Leobo/Rec: bump_window_deadline = reservation_date - 5 business days
  │  ├─ Guest list deadline auto-calculated: guest_list_deadline = reservation_date - GUEST_LIST_SUBMISSION_DAYS_BEFORE (default 2 business days)
  │  └─ Status: "Confirmed" (ready for guest list submission)
  │
  └─ DENY
     ├─ Admin.html denyReservation(reservation_id, denial_reason)
     ├─ Update Reservations sheet: approval_status="denied", denying_authority=[BOARD/MGMT], denial_timestamp=NOW, [APPROVER]_denial_reason=[REASON]
     ├─ Delete calendar event (cleanup)
     ├─ Send member email: "Booking Denied" (include denial reason)
     └─ Audit log: Record denial for compliance

STEP 4: Approval Reminders (Nightly)
  
  NotificationService.runNightlyTasks() sends approval reminders to board/mgmt:
  ├─ Query: Reservations where approval_status=NULL AND submission_timestamp > 1 business day ago
  ├─ Send email to approver: "Pending Approval Reminder" (includes household info, usage stats)
  └─ No auto-escalation (friendly reminder only)

STEP 5: Guest List Submission (After Approval)
  
  ├─ Member navigates to reservation detail page
  ├─ Portal displays: "Guest List Deadline: [DATE]"
  ├─ Member enters guests (first_name, last_name, date_of_birth, relationship_to_household):
  │  ├─ Dynamic form: +/- buttons to add/remove guest rows
  │  ├─ Form updates without page refresh
  │  └─ "Mark Guest List as Final" button (early submission, cancels deadline)
  │
  └─ DEADLINE SCENARIOS:
     ├─ Case A: guest_count=0, no entries submitted
     │  └─ No action required (household not bringing guests)
     │
     ├─ Case B: guest_count>0, entries submitted < guest_count
     │  ├─ Deadline passes
     │  ├─ Email member: "Guest List Incomplete" (ask for clarification)
     │  └─ Member must confirm intent (proceed with fewer guests or add more)
     │
     ├─ Case C: guest_count=0, entries submitted > 0
     │  ├─ Deadline passes
     │  ├─ Email member: "Guest List Submitted (uncounted)" (treat as oversight)
     │  └─ Proceed with submitted guest list
     │
     └─ Case D: guest_count>0, entries submitted = guest_count
        ├─ Deadline passes
        ├─ Forward to RSO: "Guest List Ready for Review" email
        └─ Proceed to STEP 6

STEP 6: RSO Guest List Review (Management Officer)
  
  ├─ RSO receives email: "Guest List Submitted for Review"
  ├─ RSO accesses one-time approval link (expires after use/72 hours)
  ├─ RSO can:
  │  ├─ Accept all guests → status="rso_approved", send confirmation to member
  │  └─ Reject individual guests → status="rso_rejected", send reason to member + RSO contact info
  │
  ├─ If individual guests rejected:
  │  ├─ Member notified (with RSO rejection reason)
  │  ├─ Member can remove rejected guests OR
  │  ├─ Member can re-submit with changes (within reasonable timeframe before event)
  │  └─ Audit trail: rso_rejection_reason recorded per guest
  │
  └─ If all guests approved:
     ├─ Update Reservations: guest_list_submitted=TRUE
     ├─ Update Guest Lists sheet: rso_status="approved", rso_reviewed_by=[RSO_NAME], rso_review_timestamp=NOW
     └─ Reservation ready to proceed (member can finalize)

STEP 7: Final Call Email (1 Business Day Before Deadline)
  
  ├─ NotificationService.runNightlyTasks() triggers at 6:00 AM GMT+2
  ├─ Query: Reservations where guest_list_deadline = tomorrow AND guest_list_submitted=FALSE
  ├─ Send member email: "Guest List Final Call - Due Tomorrow"
  └─ Reminder includes: deadline time, instructions, RSO contact info

STEP 8: Bumping Logic (Excess/Waitlist Only)
  
  ┌─ EXCESS BOOKINGS (Tennis excess or Leobo/Rec with no regular slot available)
  │
  ├─ After approval, system sets bump_window_deadline:
  │  ├─ Tennis excess: 1 day before event
  │  └─ Leobo/Rec excess: 5 business days before event
  │
  ├─ During bump window:
  │  ├─ System monitors Regular bookings on same facility/time
  │  ├─ If Regular booking cancelled → Excess booking auto-promoted to Confirmed
  │  ├─ Calendar updated: [BUMPED_TO_CONFIRMED]
  │  ├─ Send member email: "Excess Booking Bumped Up - Now Confirmed"
  │  └─ Reservations sheet: status="Confirmed", bumped_by_household_id=NULL (promoted, not bumped by another household)
  │
  └─ After bump window expires:
     ├─ If still status="Excess" → auto-approve to Confirmed
     ├─ Calendar updated: [AUTO_CONFIRMED_EXCESS]
     ├─ Send member email: "Excess Booking Auto-Confirmed"
     └─ Reservations sheet: approval_status="auto_confirmed_excess"

  ┌─ WAITLISTED BOOKINGS (if facility full, future feature)
  │
  ├─ After approval, system sets waitlist_position by submission_timestamp
  ├─ Member notified: "You are #N on the waitlist for [FACILITY] [DATE]"
  │
  ├─ If Regular or Excess booking cancelled:
  │  ├─ Earliest waitlisted booking auto-promoted to next tier (Excess or Regular, as applicable)
  │  ├─ Calendar event created for promoted booking
  │  ├─ Send member email: "Waitlist Promotion - You're In!"
  │  └─ Reservations sheet: status="Confirmed" or "Excess", waitlist_position=NULL
  │
  └─ Waitlist auto-cancelled X days before event if primary remains:
     ├─ Config.WAITLIST_CANCELLATION_DEADLINE_DAYS_BEFORE (default 7)
     ├─ Query: Reservations where status="Waitlisted" AND reservation_date within X days
     ├─ Cancel with reason: "Auto-cancelled (no slot available)"
     └─ Send member email: "Waitlist Position Cancelled"

STEP 9: Member Modifies or Cancels Reservation
  
  ┌─ MODIFY DATE/TIME/FACILITY
  │  ├─ System treats as: Cancel existing + Create new request
  │  ├─ New request goes through full approval chain (STEPS 1–3)
  │  ├─ Old reservation: status="Modified", calendar event deleted
  │  └─ Guest list carries over BUT deadline recalculates
  │
  ├─ MODIFY GUEST LIST ONLY
  │  ├─ No re-approval needed
  │  ├─ Update Guest Lists sheet
  │  └─ Notify RSO if after original deadline (re-review if needed)
  │
  ├─ MODIFY HOUSEHOLD INVITEES
  │  ├─ No re-approval needed
  │  ├─ Update calendar invites
  │  └─ New invitees receive fresh calendar invite
  │
  └─ CANCEL RESERVATION
     ├─ Portal.cancelReservation(reservation_id, cancellation_reason)
     ├─ Update Reservations sheet: status="Cancelled", cancelled_by=[HOUSEHOLD_MEMBER], cancellation_timestamp=NOW, cancellation_reason=[REASON]
     ├─ Delete calendar event
     ├─ Check waitlist: if waitlisted bookings exist, promote earliest
     ├─ Send member confirmation email
     └─ Audit log: Record cancellation

STEP 10: Event Day & Post-Event
  
  ├─ Reservation date arrives
  ├─ Member uses facility (playground: walk-up, no tracking needed)
  ├─ Post-event:
  │  ├─ Member can optionally add notes/photos in portal
  │  ├─ Audit log: Event completed (if tracking implemented)
  │  └─ Usage statistics updated for next booking cycle
  └─ Nightly: Usage tracking reset if applicable (Tennis Mon, Leobo 1st of month)
```

### Approval Routing Summary Table

| Facility | Regular Booking | Excess/Tentative Booking | Approvers | Timeline |
|----------|-----------------|--------------------------|-----------|----------|
| **Tennis/Basketball** | Auto-approved ✅ | Board approval required | board@geabotswana.org | 1 approval stage |
| **Leobo** | Board approval required | Board approval required | mgt-notify@, then board@ | 2 approval stages (Mgmt → Board) |
| **Rec Center** | Board approval required | Board approval required | mgt-notify@, then board@ | 2 approval stages (Mgmt → Board) |
| **Playground** | Walk-up only (no reservation) | N/A | N/A | N/A |
| **Gym** | Walk-up only (no reservation) | N/A | N/A | N/A |

### Calendar Event Status Tags

Calendar event titles use status tags to indicate booking state:

| Tag | Meaning | Next Action |
|-----|---------|-------------|
| `[TENTATIVE]` | Pending first-stage approval | Awaiting Mgmt (Leobo/Rec) or Board (Tennis) |
| `[TENTATIVE_EXCESS]` | Excess Tennis booking pending Board | Awaiting Board approval |
| `[TENTATIVE_BOARD]` | Leobo/Rec pending second-stage Board approval | Awaiting Board approval (Mgmt already approved) |
| `[APPROVED]` | All approvals complete, ready for guest list | Guest list due X days before |
| `[BUMPED_TO_CONFIRMED]` | Excess booking promoted during bump window | Event ready to proceed |
| `[AUTO_CONFIRMED_EXCESS]` | Excess booking auto-approved after bump window | Event ready to proceed |
| `[DENIED]` | Booking rejected at any approval stage | Deleted from calendar after status recorded |
| `[CANCELLED]` | Member cancelled reservation | Event deleted, waitlist promoted (if applicable) |

### Configuration Variables (Config.gs)

```javascript
// Reservation workflow
GUEST_LIST_SUBMISSION_DAYS_BEFORE = 2        // Days before event to submit guest list
EXCESS_BOOKING_BUMP_DEADLINE_DAYS_BEFORE = 7  // Days before event when excess auto-confirms
WAITLIST_CANCELLATION_DEADLINE_DAYS_BEFORE = 7 // Days before event to cancel waitlist
TENNIS_WEEKLY_LIMIT_HOURS = 3                // Max hours/week for Tennis
LEOBO_MONTHLY_LIMIT_HOURS = 6                // Max hours/month for Leobo
TENNIS_BUMP_WINDOW_DAYS = 1                  // Days before event for Tennis bump window
LEOBO_BUMP_WINDOW_BUSINESS_DAYS = 5          // Business days before event for Leobo bump window

// Approval email distribution lists
BOARD_APPROVAL_EMAIL = "board@geabotswana.org"
MGMT_APPROVAL_EMAIL = "mgt-notify@geabotswana.org"
RSO_NOTIFICATION_EMAIL = "rso-notify@geabotswana.org"

// Nightly task timings (Africa/Johannesburg timezone)
APPROVAL_REMINDER_SEND_TIME = "06:00"        // 6:00 AM GMT+2
GUEST_LIST_FINAL_CALL_SEND_TIME = "06:00"    // 6:00 AM GMT+2 (1 day before deadline)
USAGE_TRACKING_RESET_TIME = "02:00"          // 2:00 AM GMT+2 (nightly)
```

### Reservations Sheet Schema (Essential Columns)

**Core Booking Data:**
- `reservation_id` — Unique identifier (RES-YYYY-MM-DD-###)
- `household_id`, `submitted_by_individual_id`, `submitted_by_email` — Who booked it
- `submission_timestamp` — When booking request was created
- `facility` — Tennis, Leobo, Rec Center, etc.
- `reservation_date`, `start_time`, `end_time`, `duration_hours` — When the booking is
- `event_name`, `guest_count`, `notes` — Optional event details

**Approval Tracking:**
- `approval_status` — "pending", "approved_auto", "approved", "denied", "cancelled", "modified"
- `board_approval_required`, `board_approved_by`, `board_approval_timestamp`, `board_denial_reason`
- `mgmt_approval_required`, `mgmt_approved_by`, `mgmt_approval_timestamp`, `mgmt_denial_reason`
- `denying_authority`, `denial_timestamp` — Which approver denied (if applicable)

**Booking Status:**
- `status` — "Regular", "Excess", "Waitlisted", "Confirmed", "Cancelled", "Denied", "Modified"
- `booking_status` — Maps to approval tier (for display in UI)
- `is_excess_reservation` — TRUE if booking exceeds household limits

**Bumping & Waitlist:**
- `bump_window_deadline` — Date when excess booking auto-confirms
- `bumped_by_household_id` — If promoted due to another household cancelling
- `bumped_date` — When promotion occurred
- `waitlist_position` — Nth in line (if applicable)

**Guest List Tracking:**
- `guest_list_submitted`, `guest_list_deadline` — Deadline for submitting guest list
- `previous_whole_facility_requests` — For Rec Center, tracks historical booking patterns

**Calendar Integration:**
- `calendar_event_id` — Google Calendar event ID (enables updates/deletions)

**Cancellation:**
- `cancelled_by`, `cancellation_timestamp`, `cancellation_reason` — Who cancelled and why

### Key Behavioral Notes

**Reservation Bumping (Tennis vs Leobo):**
- Tennis: 1-day bump window (members can bump tentative reservations up to 1 day before)
- Leobo: 5 business days bump window (calculated excluding weekends & holidays)
- After bump window expires → status="Confirmed" (locked, cannot be bumped)

**Usage Tracking Reset:**
- Tennis: Weekly (Monday 2:00 AM GMT+2)
- Leobo: Monthly (1st of month 2:00 AM GMT+2)
- Calculated nightly in NotificationService.runNightlyTasks()

**Double-Booking Prevention:**
- Same facility: no time slot overlaps allowed
- Rec Center booking: blocks both TC/BC and Leobo slots for same time
- System checks before approval to prevent conflicts

**Email Template Variables:**
- `{{PLACEHOLDER}}` → Replaced before sending
- Conditional blocks: `{{IF_FAMILY}}...{{END_IF}}`, `{{IF_TEMPORARY}}...{{END_IF}}`
- Supports nested conditions for complex templates

---

## Deployment & Versioning

### Development & Testing Workflow

**Push to @HEAD (Testing):**
```bash
clasp push                    # Updates Code.js, services, Config.js, HTML files to @HEAD
```
- @HEAD deployment updates immediately with all changes
- Used for development, testing, and QA
- Portal/Admin accessible via @HEAD URL for testing

**Versioned Deployment (Production):**
- Created manually when code is ready for production
- Website uses a specific versioned deployment ID (not @HEAD)
- Manual deployment via Google Apps Script editor or `clasp deployments`
- Version info recorded in Config.js header for tracking

### Script & Deployment IDs

**Google Apps Script Project:**
- Script ID: `1mkzpnNfUm-ZTW-G6wEdGg4Jt1KiChOXrV5qjBNkm3eqx43Yn-7Z-2Ffv`

**Deployments:**
- **@HEAD (Testing):** `AKfycbxMFqbzFg-X-GDOpvllmnXNOY0Zw-WzHnn05PKDR4pYe0ULZ_qX8deWKIbO45AZBz6-`
  - Used for development & testing
  - Updates immediately with each `clasp push`
  - Accessible at: `https://script.google.com/a/macros/geabotswana.org/s/{@HEAD_DEPLOYMENT_ID}/exec`

- **Versioned Deployment (Production):** (Specific ID TBD)
  - Created manually when ready for production
  - Used on geabotswana.org website
  - Does NOT update automatically; updates only on manual deployment

### Domain & Access

```
Testing (@HEAD):
  Portal: https://script.google.com/a/macros/geabotswana.org/s/{@HEAD_DEPLOYMENT_ID}/exec
  Admin:  Same URL with ?action=serve_admin

Production (Versioned):
  Embedded in www.geabotswana.org via iframe or direct link
  Portal: https://script.google.com/a/macros/geabotswana.org/s/{PROD_DEPLOYMENT_ID}/exec
  Admin:  Same URL with ?action=serve_admin

Access Control:
  - ANYONE_ANONYMOUS (no login required to reach login screen)
  - Auth handled by login form → session token required for all operations
```

### Deployment Process

**When Ready for Production:**
1. Test all changes thoroughly on @HEAD
2. Create new versioned deployment via Google Apps Script editor:
   - Editor → Deploy → New deployment → Select type "Web app"
   - Record deployment ID
3. Update website (geabotswana.org) with new deployment URL
4. Update Config.js with version number & deployment ID
5. Commit to GitHub with deployment notes

**Version Numbering:** (e.g., v1.0.0, v1.1.0)
- Major.Minor.Patch format
- Tracked in Config.gs header comments

---

## Membership Application Workflow (Complete Lifecycle)

### Overview & Key Principles

**Application Access:**
- Open to all applicants (not restricted to @geabotswana.org accounts)
- Initiated via web app form (not external email/contact process)
- Submission triggers automatic account creation (new individual + new household)
- New applicant account has **read-only dashboard** (no reservation rights, limited portal features)

**Membership Categories:**
- 6 total categories: 5 full-year + 1 temporary
- Applicant completes category-filtering questionnaire to determine eligibility
- Category determines document requirements, sponsor requirement, and membership duration
- Each applicant can qualify for exactly ONE category (mutually exclusive)

**Approval Timeline:**
- Board review: 3 business days
- RSO review: 5 business days (after board approval)
- Total expected: ~8 business days from submission to final approval

**Membership Year:**
- Runs August 1 – July 31 (annual cycle)
- All memberships, regardless of join date, expire July 31
- Example: Join in December → Active through July 31 of following year

### Application Lifecycle (11 Steps)

```
STEP 1: Applicant Accesses Application Form
  ├─ Web app (Portal.html) displays "New Member Application" link
  ├─ Form displays membership category questionnaire (see CATEGORY FILTERING below)
  ├─ Applicant answers questions to determine category eligibility
  └─ System suggests category; applicant confirms or selects alternative if eligible for multiple

STEP 2: Applicant Provides Personal Information
  ├─ Individual applicant:
  │  ├─ First name, last name, email, phone (international format)
  │  ├─ Employment info: [TBD: Job Title, Department, Posting Date, Employment Status, etc.]
  │  └─ Sponsor info (required for non-Embassy applicants): Name + email of GEA Full-category member
  │
  └─ Family applicant:
     ├─ Primary member info (as above)
     ├─ Spouse info: First name, last name, email, phone, employment info
     ├─ Child(ren) info: First name, last name, date of birth (for each child under 18)
     └─ Household staff (optional): Name, role (nanny, housekeeper, driver, etc.), relationship

STEP 3: Applicant Submits Application
  ├─ Portal.submitApplication(formData) → handlePortalApi("submit_application", formData)
  ├─ ApplicationService.createApplication() validates:
  │  ├─ Email not already registered as user (fail if email exists in Individuals sheet)
  │  ├─ All required fields present
  │  ├─ Sponsor email valid (if required for category)
  │  ├─ Phone number valid (international format)
  │  └─ For family: spouse info complete, children DOB valid, etc.
  ├─ Create new Household record:
  │  ├─ household_id (HHS-YYYY-MM-DD-###)
  │  ├─ household_name (applicant's last name or family name)
  │  ├─ membership_type (category selected)
  │  ├─ membership_expiration_date = "2025-07-31" (or next July 31 based on current date)
  │  ├─ active = FALSE (until treasurer verifies payment)
  │  └─ application_id (link to Membership Applications sheet)
  │
  ├─ Create primary individual_id for applicant:
  │  ├─ individual_id (IND-YYYY-MM-DD-###)
  │  ├─ household_id (from above)
  │  ├─ first_name, last_name, email, phone
  │  ├─ password_hash (auto-generated temporary password sent via email)
  │  ├─ relationship_to_primary = "Primary" (self)
  │  ├─ can_access_unaccompanied = TRUE (primary can book reservations)
  │  ├─ voting_eligible = FALSE (until membership active)
  │  └─ application_id (link to Membership Applications sheet)
  │
  ├─ Create additional individuals (if family):
  │  ├─ Spouse: relationship_to_primary = "Spouse", can_access_unaccompanied = TRUE
  │  ├─ Children: relationship_to_primary = "Child", can_access_unaccompanied = FALSE (until age 18)
  │  └─ Household staff: relationship_to_primary = "[Role]", can_access_unaccompanied = FALSE
  │
  ├─ Create Application record in Membership Applications sheet:
  │  ├─ application_id, household_id, primary_individual_id, application_type (Individual/Family), membership_type (category)
  │  ├─ applicant_name, applicant_email, applicant_phone
  │  ├─ sponsor_name, sponsor_email (if applicable)
  │  ├─ family_members (JSON: spouse, children, staff details)
  │  ├─ employment_info (JSON: job_title, department, posting_date, employment_status, etc.)
  │  ├─ status = "submitted", submission_timestamp = NOW
  │  ├─ board_approval_status = NULL, board_approved_by = NULL, board_approval_timestamp = NULL
  │  ├─ rso_approval_status = NULL, rso_approved_by = NULL, rso_approval_timestamp = NULL
  │  └─ approval_deadline = NOW + 3 business days (for board)
  │
  ├─ Generate temporary password & send welcome email:
  │  └─ Email template: "Welcome to GEA - Application Submitted"
  │     ├─ Temp password link
  │     ├─ Instructions to change password
  │     ├─ Link to application dashboard
  │     └─ Next steps: submit documents
  │
  ├─ Send board notification email:
  │  └─ Email template: "New Membership Application Submitted"
  │     ├─ Applicant details, category, sponsor (if applicable)
  │     ├─ Link to admin portal for review
  │     └─ Board approval deadline: [DATE]
  │
  └─ Return to applicant: "Application Submitted! Please log in to submit required documents."

STEP 4: Applicant Logs In & Views Application Dashboard
  ├─ Portal.loadApplicationDashboard() shows:
  │  ├─ Application status: "Under Review by Board"
  │  ├─ Current step: "1. Submit Documents"
  │  ├─ Documents required (based on category):
  │  │  ├─ [List of document types with checkboxes]
  │  │  ├─ Passport (required for all non-Botswanans; optional for citizens)
  │  │  ├─ Omang/ID (required for Botswana citizens; optional alternative to passport)
  │  │  ├─ Diplomatic Passport (required for Diplomatic category only)
  │  │  ├─ Passport-style photo (required for all)
  │  │  └─ Employment verification (may be requested, not always required)
  │  │
  │  ├─ Upload interface: Drag-and-drop or file select for each document type
  │  ├─ Instructions: "Please upload your documents to help us process your application quickly"
  │  └─ Status indicator: "Documents pending" or "All documents submitted"
  │
  └─ Applicant uploads documents (see STEP 5)

STEP 5: Applicant Submits Documents
  ├─ Portal.uploadDocument(individual_id, document_type, file) → handlePortalApi("upload_document", params)
  ├─ FileService.submitDocumentForApproval() validates:
  │  ├─ File type allowed (.pdf, .jpg, .png)
  │  ├─ File size within limits [TBD: e.g., 5MB max]
  │  ├─ File dimensions for photos [TBD: e.g., 1000x1000 pixels min, 4:5 aspect ratio]
  │  └─ Document type required for this category
  │
  ├─ Create File Submission record (File Submissions sheet, Member Directory):
  │  ├─ submission_id, individual_id, document_type (passport/omang/photo/employment_verification)
  │  ├─ status = "submitted"
  │  ├─ submission_timestamp = NOW
  │  ├─ file_name, file_size, file_format, cloud_storage_path = NULL (populated on approval)
  │  ├─ rso_reviewed_by = NULL, rso_review_date = NULL, rso_approval_status = NULL
  │  ├─ gea_reviewed_by = NULL, gea_review_date = NULL, gea_approval_status = NULL
  │  ├─ rejection_reason = NULL
  │  ├─ is_current = FALSE (until approved)
  │  └─ disabled_date = NULL
  │
  ├─ Update Application dashboard:
  │  ├─ Document shown as "Submitted - Awaiting Review"
  │  └─ Applicant can replace if needed (new submission overrides previous draft)
  │
  └─ Do NOT send notifications yet (wait for board review)

STEP 6: Board Reviews Application & Documents
  ├─ Admin.html showPage('applications') displays pending applications
  ├─ Board member clicks application → viewApplicationDetails(application_id)
  ├─ Admin sees:
  │  ├─ Applicant info (name, email, phone, category, sponsor)
  │  ├─ Family members (spouse, children, staff)
  │  ├─ Employment info (if provided)
  │  ├─ Submitted documents (with download links & approval status)
  │  ├─ Application timeline (submitted date, deadlines)
  │  └─ Actions: [Approve] [Deny] [Request More Info]
  │
  ├─ Board reviews completeness & eligibility:
  │  ├─ All required documents submitted?
  │  ├─ Application info complete?
  │  ├─ Sponsor verification (if required)?
  │  └─ Any red flags or concerns?
  │
  ├─ Board decision (APPROVE PATH):
  │  ├─ Admin.approveApplication(application_id)
  │  ├─ Update Application: board_approval_status = "approved", board_approved_by = [BOARD_MEMBER], board_approval_timestamp = NOW
  │  ├─ Send documents to RSO for review:
  │  │  ├─ Update File Submissions: status = "rso_pending" (for each document)
  │  │  └─ Email template: "Documents Submitted for RSO Review"
  │  │     ├─ Applicant info summary
  │  │     ├─ Document list with download links
  │  │     ├─ RSO approval deadline: NOW + 5 business days
  │  │     └─ Link to RSO approval interface
  │  │
  │  └─ Send applicant email:
  │     └─ Email template: "Application Approved by Board - Awaiting RSO Review"
  │        ├─ Congratulations message
  │        ├─ Next step: RSO review of documents
  │        ├─ Expected timeline
  │        └─ Link to application dashboard
  │
  ├─ Board decision (DENY PATH):
  │  ├─ Admin.denyApplication(application_id, denial_reason)
  │  ├─ Update Application: board_approval_status = "denied", board_denial_reason = [REASON], board_approval_timestamp = NOW
  │  ├─ Update Household: active = FALSE
  │  ├─ Disable individual accounts (set active = FALSE for all household members)
  │  ├─ Email applicant:
  │  │  └─ Email template: "Application Not Approved"
  │  │     ├─ Denial reason
  │  │     ├─ Instructions: "You cannot reapply on this email without board approval"
  │  │     └─ Board contact info for questions
  │  │
  │  └─ Audit log: Record denial
  │
  └─ Board decision (REQUEST MORE INFO PATH):
     ├─ Admin.requestMoreInfo(application_id, info_needed, deadline)
     ├─ Update Application: board_approval_status = "pending_info", pending_info_description = [DETAILS]
     ├─ Email applicant:
     │  └─ Email template: "More Information Needed for Your Application"
     │     ├─ Specific info or documents requested
     │     ├─ Deadline to submit
     │     └─ Link to dashboard to upload/update info
     │
     └─ Application remains in "Under Review" status until deadline

STEP 7: RSO Reviews & Approves Documents
  ├─ Email sent to rso-notify@geabotswana.org with document links
  ├─ RSO accesses File Submission portal (one-time approval link or portal access)
  ├─ RSO reviews each document:
  │  ├─ Passport: Valid? Expiration date OK? Matches application?
  │  ├─ Omang: Valid? Current? Matches application?
  │  ├─ Diplomatic Passport: Correct country/org? Valid?
  │  ├─ Photo: Quality acceptable? Dimensions correct? Current?
  │  ├─ Employment verification: Complete? Verifiable?
  │  └─ Actions per document: [Approve] [Reject with reason]
  │
  ├─ RSO Decision (ALL DOCUMENTS APPROVED):
  │  ├─ Update File Submissions: status = "rso_approved", rso_approved_by = [RSO_NAME], rso_approval_timestamp = NOW
  │  ├─ Update Application: rso_approval_status = "approved", rso_approved_by = [RSO_NAME], rso_approval_timestamp = NOW
  │  ├─ Update Application status to "approved_pending_payment"
  │  ├─ Email applicant:
  │  │  └─ Email template: "Application Approved! Next: Submit Payment"
  │  │     ├─ Congratulations
  │  │     ├─ Membership dues amount (if applicable)
  │  │     ├─ Payment instructions
  │  │     ├─ How to submit proof of payment
  │  │     └─ Link to application dashboard
  │  │
  │  └─ Email treasurer:
  │     └─ Email template: "New Member Ready for Payment Verification"
  │        ├─ Applicant info
  │        ├─ Membership type
  │        ├─ Dues amount due
  │        └─ Link to admin portal to verify payment
  │
  ├─ RSO Decision (SOME DOCUMENTS REJECTED):
  │  ├─ Update File Submissions: status = "rso_rejected", rso_rejection_reason = [REASON per document]
  │  ├─ Update Application: rso_approval_status = "rejected", rso_approval_timestamp = NOW
  │  ├─ Email applicant:
  │  │  └─ Email template: "Documents Rejected - Please Resubmit"
  │  │     ├─ List of rejected documents with specific reasons
  │  │     ├─ Instructions for resubmission
  │  │     ├─ Deadline to resubmit (e.g., 10 business days)
  │  │     └─ Link to dashboard to upload replacements
  │  │
  │  └─ Application status: "rejected_documents" (applicant can resubmit)
  │
  └─ Applicant resubmits rejected documents → Return to STEP 5

STEP 8: Applicant Submits Payment Proof
  ├─ Portal.submitPaymentProof(application_id, proof_file) → handlePortalApi("submit_payment_proof", params)
  ├─ Payment proof file uploaded to Payments sheet (Payment Tracking spreadsheet)
  ├─ Create Payment record:
  │  ├─ payment_id, household_id, amount_due (based on membership_type)
  │  ├─ payment_method (selected by applicant)
  │  ├─ proof_of_payment (file path)
  │  ├─ status = "submitted"
  │  ├─ submitted_by_individual_id, submission_timestamp = NOW
  │  ├─ verified_by = NULL, verification_timestamp = NULL
  │  └─ notes = "Application payment verification pending"
  │
  ├─ Update Application: payment_status = "submitted", payment_submission_timestamp = NOW
  ├─ Email treasurer:
  │  └─ Email template: "Payment Proof Submitted - Needs Verification"
  │     ├─ Applicant name, household_id
  │     ├─ Membership type & dues amount
  │     ├─ Payment proof download link
  │     ├─ Link to admin portal to verify & activate
  │     └─ Verification deadline: NOW + 2 business days
  │
  └─ Email applicant:
     └─ Email template: "Payment Received - Verifying"
        ├─ Confirmation of payment proof received
        ├─ Timeline: "Treasurer will verify within 2 business days"
        └─ Link to dashboard to check status

STEP 9: Treasurer Verifies Payment & Activates Membership
  ├─ Admin.html showPage('payments') displays pending payment verifications
  ├─ Treasurer clicks payment → viewPaymentDetails(payment_id)
  ├─ Treasurer sees:
  │  ├─ Applicant info (name, email, household_id)
  │  ├─ Membership type & dues amount
  │  ├─ Payment proof (file download, amount visible if receipt)
  │  ├─ Actions: [Verify & Activate] [Reject] [Request Clarification]
  │
  ├─ Treasurer Decision (VERIFY & ACTIVATE):
  │  ├─ Admin.verifyPaymentAndActivate(payment_id)
  │  ├─ Update Payment: status = "verified", verified_by = [TREASURER_NAME], verification_timestamp = NOW
  │  ├─ Update Application: payment_status = "verified", payment_verified_timestamp = NOW
  │  ├─ Update Application: status = "activated", final_approval_timestamp = NOW
  │  ├─ Update Household:
  │  │  ├─ active = TRUE
  │  │  ├─ membership_expiration_date = "2025-07-31" (or next July 31)
  │  │  └─ membership_start_date = TODAY
  │  │
  │  ├─ Update all Individuals in household:
  │  │  ├─ active = TRUE
  │  │  ├─ voting_eligible = TRUE (for primary & spouse if applicable)
  │  │  └─ Unlock portal features (reservations, card, etc.)
  │  │
  │  ├─ Transfer approved photos to Cloud Storage:
  │  │  ├─ gs://gea-member-data/{household_id}/{individual_id}/photo.jpg
  │  │  └─ Update File Submissions: cloud_storage_path = [GCS_PATH], is_current = TRUE
  │  │
  │  ├─ Email applicant:
  │  │  └─ Email template: "Welcome to GEA! Membership Activated"
  │  │     ├─ Congratulations
  │  │     ├─ Membership type, household_id, expiration date
  │  │     ├─ Unlock message: "You can now book facilities, access all portal features"
  │  │     ├─ Next steps: Update profile, book tennis court, etc.
  │  │     └─ Links to portal sections
  │  │
  │  ├─ Email board:
  │  │  └─ Email template: "New Member Activated"
  │  │     ├─ Applicant name, household_id, membership_type
  │  │     ├─ Activation timestamp
  │  │     └─ Welcome message sent to applicant
  │  │
  │  └─ Audit log: Record activation
  │
  ├─ Treasurer Decision (REJECT PAYMENT):
  │  ├─ Admin.rejectPayment(payment_id, rejection_reason)
  │  ├─ Update Payment: status = "rejected", rejection_reason = [REASON], rejection_timestamp = NOW
  │  ├─ Email applicant:
  │  │  └─ Email template: "Payment Not Verified - Action Required"
  │  │     ├─ Rejection reason (e.g., "Amount does not match dues", "Missing payment reference")
  │  │     ├─ Instructions to resubmit corrected payment proof
  │  │     └─ Treasurer contact info for clarification
  │  │
  │  └─ Application remains in "approved_pending_payment" state
  │
  └─ Treasurer Decision (REQUEST CLARIFICATION):
     ├─ Admin.requestPaymentClarification(payment_id, clarification_needed)
     ├─ Email applicant with specific details needed
     └─ Application status: "payment_clarification_needed"

STEP 10: Applicant Portal Reflects Membership Status
  ├─ If membership ACTIVE:
  │  ├─ Dashboard shows: "Welcome! Your membership is active through July 31, 2025"
  │  ├─ Unlock all portal features:
  │  │  ├─ Reservations tab (book facilities)
  │  │  ├─ Profile tab (edit info, upload photos)
  │  │  ├─ Membership Card tab (digital card with photo)
  │  │  └─ Full household member list
  │  │
  │  └─ Application dashboard archived (hidden, but available in history)
  │
  ├─ If membership PENDING:
  │  ├─ Dashboard shows: "Your application is [current stage]"
  │  ├─ Highlight next steps: "Documents needed", "Awaiting board approval", etc.
  │  └─ Restrict features: No reservations, limited profile access
  │
  └─ If membership DENIED:
     ├─ Account remains active (read-only)
     ├─ Message: "Your application was not approved. Please contact the board."
     └─ No portal access to reservations or other member features

STEP 11: Membership Renewal (Nightly Task)
  ├─ NotificationService.runNightlyTasks() runs daily at 2:00 AM GMT+2
  ├─ Check: Current date is within 30 days before membership_expiration_date?
  │  ├─ 30-day warning: Send email "Your membership expires in 30 days"
  │  ├─ 7-day warning: Send email "Your membership expires in 7 days"
  │  └─ After July 31: Set household active = FALSE, individual active = FALSE
  │
  └─ Renewal process: [TBD - Out of scope for initial application, but noted for future]
```

### Membership Categories & Filtering

**Six Categories (Mutually Exclusive):**

Each applicant completes a sequential eligibility questionnaire that assigns them to exactly ONE category. The questionnaire is binary (yes/no) at each step, leading to a single assigned category.

| Category | Level Type | Individual Fee | Family Fee | Sponsor Required | Full Year | Temp Only |
|----------|-----------|-----------------|------------|------------------|-----------|-----------|
| **Full** | Full | $50 USD | $100 USD | ✗ No | ✓ Yes | ✓ Can use |
| **Associate** | Full | $50 USD | $100 USD | ✓ Yes (Full member) | ✓ Yes | ✗ No |
| **Affiliate** | Full | $50 USD | $100 USD | ✓ Yes (Full member) | ✓ Yes | ✗ No |
| **Diplomatic** | Full | $75 USD | $150 USD | ✓ Yes (Full member) | ✓ Yes | ✗ No |
| **Community** | Full | $75 USD | $150 USD | ✓ Yes (Full member) | ✓ Yes | ✗ No |
| **Temporary** | Temporary | $20 USD | N/A | ✗ No | ✗ No | ✓ Only (max 6mo) |

**Category Eligibility Questionnaire (Sequential):**

The questionnaire is designed as a decision tree. Each question filters applicants to their correct category. Applicants answer a simple series of yes/no questions and are assigned exactly one category based on their answers. See [GEA MEMBERSHIP_ELIGIBILITY_FLOW.md](./MEMBERSHIP_ELIGIBILITY_FLOW.md) for complete flowchart and detailed clarifications.

**Question 1:** Are you a U.S. Direct-Hire employee of the United States Government (including State Department, USAID, DOD, etc.)?
- YES → Continue to Question 1b
- NO → Continue to Question 2

**Question 1b** (if Q1=YES): Are you in Botswana on temporary duty or as an official visitor?
- YES → **TEMPORARY MEMBERSHIP** ✓ (6-month maximum)
- NO → **FULL MEMBERSHIP** ✓

**Question 2** (if Q1=NO): Are you a direct employee of the U.S. Embassy (recruited from OUTSIDE Botswana) OR a U.S. citizen employed by a USG-funded contractor OR implementing USG-funded programs?
- YES → **ASSOCIATE MEMBERSHIP** ✓
- NO → Continue to Question 3

**Question 3** (if Q2=NO): Are you a direct employee of the U.S. Embassy (recruited IN Botswana, i.e., local hire)?
- YES → **AFFILIATE MEMBERSHIP** ✓
- NO → Continue to Question 4

**Question 4** (if Q3=NO): Are you a registered diplomat of another diplomatic or international-organization mission in Botswana?
- YES → **DIPLOMATIC MEMBERSHIP** ✓
- NO → **COMMUNITY MEMBERSHIP** ✓

**Final Step - Household Type:**
After category is assigned, applicant selects Individual or Family membership (except Temporary is individual-only).

**Key Design Notes:**
- Single assignment: Each applicant receives exactly ONE category (no choice)
- On application form, applicant's assigned category is shown (read-only, pre-filled)
- Applicant's only choice is Individual vs. Family (except Temporary = individual only)
- Sponsor requirement varies by category: Full requires none; Associate/Affiliate/Diplomatic/Community require Full member sponsor
- All memberships end July 31 annually (Temporary counted from activation date, max 6 months)
- Exchange rate mechanism for BWP dues: [Config.js to specify monthly rate updates - TBD]

**Sponsorship Verification:**
- Sponsor must be active, paid Full member (full_indiv or full_family)
- Sponsor verified by board via email confirmation or member directory lookup
- Non-Full categories cannot sponsor (Associate/Affiliate/Diplomatic/Community can only be sponsored by Full)
- Temporary members do not require sponsor

---

### Rejection Reasons & Handling

**Valid Rejection Reasons (Board Level):**
- "No (willing) sponsor" — Sponsor not found, declined, or ineligible
- "Incomplete application" — Missing required information
- "Invalid sponsor" — Sponsor not verified as Full member or not active
- "Background concern" — Specific concern flagged during review
- "Ineligible category" — Applicant doesn't meet category eligibility criteria
- "Duplicate application" — Applicant already member or application pending
- [Additional reasons as needed]

**Post-Rejection:**
- Applicant notified via email (tpl_003: Application Denied) with specific reason
- Account remains disabled (active = FALSE)
- Email indicates: "You cannot reapply on this email address without board approval"
- Applicant can contact board to discuss or appeal [appeal process TBD]
- If applicant wants to reapply: Must contact board directly (system prevents self-reapply on same email)
- Board reviews appeal request and can approve reapplication if conditions change

---

### Outstanding Items (TBD)

**Information Needed Before Implementation:**
1. **Employment Information Fields** — Exact fields to capture (job title, department, posting date, employment status, sponsor company, etc.)
2. **Document Requirements by Category** — Specific files/formats required:
   - Photo dimensions, DPI, file size limits
   - Which categories need which documents
   - Diplomatic passport vs. regular passport distinction
3. **Household Staff Details** — Fields needed (name, role, relationship, contact info, employment dates?)
4. **Family Member Fields** — Beyond name/email/phone:
   - Need spouse employment info? Employer?
   - Children: full legal names or first/last sufficient?
   - Age thresholds for age_category (Youth, Child)
5. **Payment Amounts Confirmation** — Verify USD dues structure matches:
   - Full: $50 indiv / $100 family
   - Associate: $50 indiv / $100 family
   - Affiliate: $50 indiv / $100 family
   - Diplomatic: $75 indiv / $150 family
   - Community: $75 indiv / $150 family
   - Temporary: $20 for period (max 6 months)
6. **BWP Exchange Rate Mechanism** — How to handle monthly currency conversion:
   - Fixed rate or floating?
   - Who updates rates? When?
   - Display both USD and current BWP amount?
7. **Sponsorship Verification Process** — Exact method:
   - Email confirmation to sponsor?
   - Board manual verification in directory?
   - Automatic lookup by email?
8. **Rejection Appeal Process** — Details on how rejected applicants appeal:
   - Who reviews appeals?
   - Timeline for appeal decision?
   - Can appeal be refused?
9. **Payment Verification Deadline** — Confirm 2 business days is correct for treasurer verification
10. **Temporary Member Renewal** — Can temporary members renew on same email? New application? Different process?

**Design Decisions Made:**
- Application creates new household + individuals (no joining existing households)
- Two-stage approval: Board → RSO (documents only)
- Board approval: 3 business days
- RSO approval: 5 business days
- Payment verification: 2 business days
- Membership year always ends July 31 (even for Temporary, 6-month max from activation)
- Rejected applicant cannot reapply on same email without board involvement
- Single category assignment (questionnaire-based, no applicant choice)
- Household type (Individual/Family) is applicant's only choice (except Temporary = individual only)
- Sponsorship requirement by category: Full = none; Associate/Affiliate/Diplomatic/Community = Full member only; Temporary = none

---

---

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
