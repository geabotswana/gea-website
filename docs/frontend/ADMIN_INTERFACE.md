# Admin.html - Board Interface

**Last Updated:** April 24, 2026

Complete reference for the admin board interface with 19 page sections and role-based access control.

---

## Overview

**Single-page application** for board members, management officers, and RSO coordinators.

- **URL:** https://geabotswana.org/member.html (Admin Login button)
- **Authentication:** Email + password with role verification
- **Roles:**
  - `board` — Full admin: approvals, payments, membership, user management
  - `mgt` — Management Officer: Leobo approvals only
  - `rso_approve` — Documents & guest list reviewer
  - `rso_notify` — Read-only event coordinator
- **Layout:** 3-column (sidebar nav + main content + detail pane)
- **Responsive Design:** Mobile hamburger menu collapses to sidebar

---

## Core Operations Pages

### dashboard
**Purpose:** System overview and key metrics

**Displays:**
- KPI boxes:
  - Pending reservations (awaiting board approval)
  - Pending photo submissions
  - Unverified payments
  - Today's scheduled events
  - Active memberships
  - Applicants in progress
  
- Quick stats tables
- Action items (recent and upcoming)

**Key Functions:**
- `loadDashboard()` → handlePortalApi("admin_dashboard_stats", {token})
- Returns: pending counts, event list, membership stats, payment summary

---

### reservations
**Purpose:** Manage facility booking approvals

**Displays:**
- Filter tabs: All, Pending, Approved, Denied
- Reservation list with:
  - Household name, facility, date, time, status
  - Submitted by, submission timestamp
  - Guest count, special notes

**Actions:**
- Select reservation to show detail pane with:
  - Full reservation details
  - [Approve] button → handlePortalApi("admin_approve", {reservation_id, token})
  - [Deny] button → Modal for denial reason → handlePortalApi("admin_deny", {reservation_id, denial_reason, token})
  - [Edit] button → Modify details (board only)

**Approval Routing:**
- Tennis regular (under limit): Auto-approved at creation
- Tennis excess: board approval required
- Leobo: Requires mgt approval → then board approval
- Gym/Playground: Auto-approved (walk-up)

**Key Functions:**
- `loadReservations()` → handlePortalApi("admin_pending", {token})
- `approveReservation(id)` → handlePortalApi("admin_approve", {reservation_id, token})
- `denyReservation(id, reason)` → handlePortalApi("admin_deny", {reservation_id, denial_reason, token})

---

### waitlist
**Purpose:** Manage tentative reservations awaiting bumping window expiration

**Displays:**
- Tentative reservations with:
  - Facility, date, household
  - Bump window deadline (last date can be bumped)
  - Status: "Can be bumped", "Bump window closed"
- Sorted by deadline (soonest first)

**Actions:**
- [Mark as Confirmed] → Auto-confirm if bump window passed
- [View Blocking] → See which reservation is blocking this one

**Key Functions:**
- `loadWaitlist()` → handlePortalApi("admin_waitlist_list", {token})
- `approveBump(id)` → handlePortalApi("admin_approve_bump", {reservation_id, token})

---

### res-calendar
**Purpose:** Month view of all approved reservations

**Displays:**
- Calendar grid by facility
- Each event shows:
  - Household name, time, guest count
- Color-coded by facility (Tennis, Leobo, etc.)
- Click event for detail pane

**Interactions:**
- Month/facility selector dropdowns
- Click event → Detail pane shows full reservation
- [Edit] [Cancel] buttons in detail pane

**Key Functions:**
- `loadAdminResCalendar()` → handlePortalApi("admin_calendar", {month, token})
- Returns: approved reservations for month

---

### guest-lists
**Purpose:** RSO review and approval of guest lists for events

**Displays:**
- Pending guest list submissions with:
  - Reservation details (facility, date, household)
  - Submitted by, submission date
  - Guest count, status (submitted, rso_reviewed, finalized)

**Actions:**
- Select guest list → Detail pane with:
  - List of guests (name, relationship, age group, ID number if vendor)
  - [Approve] → handlePortalApi("admin_finalize_guest_list", {guest_list_id, token})
  - [Reject] → Modal for reason → handlePortalApi("admin_save_guest_list_draft", {guest_list_id, rso_notes, token})
  - [View Household] → Open household detail

**Key Functions:**
- `loadGuestLists()` → handlePortalApi("admin_guest_lists", {token})
- `approveGuestList(id)` → handlePortalApi("admin_finalize_guest_list", {guest_list_id, token})
- `rejectGuestList(id, notes)` → handlePortalApi("admin_save_guest_list_draft", {...})

---

### reports
**Purpose:** Generate and export payment reports (no auto-load)

**Displays:**
- Report selector (Payment Report, Reservation Report, Membership Report, etc.)
- Filters:
  - For Payment Report: Membership year dropdown, Status filter (Verified/Submitted/Rejected)
  - For Reservation Report: Month/facility filters

**Actions:**
- [Generate Report] → Load table with data
- [Export to CSV] → Download spreadsheet

**Payment Report includes:**
- Household name, email, amount USD, amount BWP
- Payment method, status, date submitted
- Summary: verified count, total USD, total BWP

**Key Functions:**
- `loadReports()` → No initial data load
- `generatePaymentReport(filters)` → handlePortalApi("admin_payment_report", {year, status, token})
- `exportToCSV()` → Generate CSV file

---

## Member Management Pages

### members
**Purpose:** Browse and search member directory

**Displays:**
- Search bar (name, email, household)
- Member list with:
  - Household name, primary member name, email
  - Membership category, status, expiration date
  - Phone, dues status

**Actions:**
- Click member → Detail pane with:
  - Full household info
  - All household members
  - Contact information
  - Membership dates
  - Payment history
  - [Edit] button (board only)

**Key Functions:**
- `loadMembers()` → handlePortalApi("admin_members", {token})
- Search filters locally on load
- `loadMemberDetail(household_id)` → handlePortalApi("admin_member_detail", {household_id, token})

---

### lapsed-members
**Purpose:** Track expired memberships and renewals

**Displays:**
- Lapsed members list with:
  - Household name, expiration date
  - Days lapsed, last payment date
  - Renewal status (pending, renewed, inactive)

**Actions:**
- Click member → Detail pane with:
  - Full membership history
  - Renewal attempt dates
  - [Send Renewal Reminder] → Email trigger
  - [Mark Renewed] → handlePortalApi("renewal", {household_id, token})

**Key Functions:**
- `loadLapsedMembers()` → handlePortalApi("admin_lapsed_members", {token})

---

### applications
**Purpose:** Membership application pipeline and workflow tracking

**Displays:**
- Application list with:
  - Applicant name, email, application date
  - Membership category, status (step 1-11)
  - Documents status, board review status

**Filters:**
- Status dropdown (submitted, docs_confirmed, board_initial, rso_docs, board_final, payment_pending, activated, denied, withdrawn)

**Actions:**
- Click application → Detail pane with:
  - Full application info
  - Q1-Q5 questionnaire responses
  - Eligibility determination (auto-assigned category)
  - Submitted documents list with status
  - Board review section with [Approve] [Deny] buttons (board only)
  - RSO review section (read-only after RSO approval)
  - Payment tracking
  - Timeline of actions/dates

**Key Functions:**
- `loadApplications()` → handlePortalApi("admin_applications", {token})
- `loadApplicationDetail(app_id)` → handlePortalApi("admin_application_detail", {application_id, token})
- `approveApplication(id)` → handlePortalApi("admin_approve_application", {application_id, token})
- `denyApplication(id, reason)` → handlePortalApi("admin_deny_application", {application_id, reason, token})

---

### application-rejections
**Purpose:** Archive of rejected applications with decision reasons

**Displays:**
- Rejected application list with:
  - Applicant name, rejection date
  - Rejection stage (board_initial, board_final)
  - Reason for rejection

**Actions:**
- Click application → Detail pane with:
  - Full rejection details
  - [Send Response Email] → Modal with template
  - Applicant can withdraw or reapply

**Key Functions:**
- `loadApplicationRejections()` → handlePortalApi("admin_application_rejections", {token})
- `sendRejectionResponse(app_id, message)` → handlePortalApi("admin_send_application_rejection_response", {...})

---

### photos
**Purpose:** Photo submission approval and Cloud Storage transfer

**Displays:**
- Photo submissions pending approval with:
  - Member name, submission date
  - Status (submitted, rejected)
  - Thumbnail preview

**Actions:**
- Click photo → Detail pane with:
  - Full-size photo preview
  - Member info
  - [Approve] → handlePortalApi("admin_photo", {submission_id, decision: "approved", token})
    - Transfers approved photo to Cloud Storage: gs://gea-member-data/{household_id}/{individual_id}/photo.jpg
  - [Reject] → Modal for reason → handlePortalApi("admin_photo", {submission_id, decision: "rejected", reason, token})

**Key Functions:**
- `loadPhotos()` → handlePortalApi("admin_pending_photos", {token})
- `approvePhoto(id)` → handlePortalApi("admin_photo", {submission_id, decision: "approved", token})
- `rejectPhoto(id, reason)` → handlePortalApi("admin_photo", {submission_id, decision: "rejected", reason, token})

---

### member-doc-rejections
**Purpose:** Document rejection history and member communication

**Displays:**
- Rejected document list with:
  - Member name, document type (passport, omang, etc.)
  - Rejection date, rejection reason
  - Member response status

**Actions:**
- Click rejection → Detail pane with:
  - Document details, rejection reason
  - [Send Message] → Modal to email member with feedback
  - View resubmitted documents (if any)

**Key Functions:**
- `loadMemberDocumentRejections()` → handlePortalApi("admin_member_document_rejections", {token})
- `sendRejectionResponse(submission_id, message)` → handlePortalApi("admin_send_document_rejection_response", {...})

---

## Payment Management Pages

### payments
**Purpose:** Payment verification and reporting (dual view)

**Displays (Pending Tab):**
- Unverified payment submissions with:
  - Household name, amount, currency, date
  - Payment method, reference number
  - Submitted date

**Actions:**
- Click payment → Detail pane with:
  - Payment receipt/screenshot
  - [Approve] → handlePortalApi("admin_approve_payment", {payment_id, token})
  - [Reject] → Modal for reason → handlePortalApi("admin_reject_payment", {payment_id, reason, token})
  - [Request Clarification] → Modal → handlePortalApi("admin_clarify_payment", {payment_id, message, token})

**Displays (Report Tab):**
- Monthly/yearly report with filters:
  - Membership year dropdown
  - Status filter (verified, submitted, rejected, clarification)
- Report table with:
  - Household, email, amount USD, amount BWP
  - Method, status, date
- Summary section: Total verified, USD sum, BWP sum
- [Export CSV] button

**Key Functions:**
- `loadPayments()` → handlePortalApi("admin_pending_payments", {token})
- `approvePayment(id)` → handlePortalApi("admin_approve_payment", {payment_id, token})
- `rejectPayment(id, reason)` → handlePortalApi("admin_reject_payment", {payment_id, reason, token})
- `clarifyPayment(id, message)` → handlePortalApi("admin_clarify_payment", {payment_id, message, token})
- `loadPaymentReport(filters)` → handlePortalApi("admin_payment_report", {year, status, token})

---

### rules
**Purpose:** View and edit GEA eligibility rules

**Displays:**
- Current rules table with:
  - Category, household type, annual dues (USD/BWP)
  - Eligibility criteria description
  - Active flag
  - [Edit] [Delete] buttons (board only)

**Actions:**
- [Add Rule] → Modal to create new category/rule
- [Edit] → Modal to update rule
- [Delete] → Confirmation, then handlePortalApi("admin_delete_rule", {rule_id, token})
- [Save] → handlePortalApi("admin_save_rule", {rule_data, token})

**Key Functions:**
- `loadRules()` → handlePortalApi("admin_get_rules", {token})
- `saveRule(rule_data)` → handlePortalApi("admin_save_rule", {rule_data, token})
- `deleteRule(id)` → handlePortalApi("admin_delete_rule", {rule_id, token})

---

## Admin Account Management

### administrators
**Purpose:** Manage board and RSO accounts

**Displays:**
- Admin list with:
  - Name, email, role (board, mgt, rso_approve, rso_notify)
  - Status (active, deactivated), created date
  - Last login date

**Actions:**
- Click admin → Detail pane with:
  - Full details
  - [Edit] → Modal to update role, status (board only)
  - [Reset Password] → Generate temporary password, email admin (board only)
  - [Deactivate] → handlePortalApi("admin_deactivate_admin", {admin_id, token})
  - [Reactivate] → handlePortalApi("admin_reactivate_admin", {admin_id, token})

- [Add Admin] button → Modal to create new account
  - Name, email, role dropdown
  - [Create] → handlePortalApi("admin_create_admin", {name, email, role, token})

**Key Functions:**
- `loadAdminAccounts()` → handlePortalApi("admin_list_admins", {token})
- `createAdmin(data)` → handlePortalApi("admin_create_admin", {name, email, role, token})
- `resetPassword(id)` → handlePortalApi("admin_reset_admin_password", {admin_id, token})
- `deactivateAdmin(id)` → handlePortalApi("admin_deactivate_admin", {admin_id, token})

---

## RSO Portal (rso_approve & rso_notify roles)

### rso-documents
**Purpose:** RSO review of applicant documents (rso_approve only)

**Displays:**
- Documents pending RSO review (passports and omangs only; NOT photos)
- Applicant name, document type, expiration date
- Submission date

**Actions:**
- Click document → Detail pane with:
  - Full-size document image
  - [Approve] → handlePortalApi("admin_rso_approve_document", {submission_id, token})
  - [Reject] → Modal for reason → handlePortalApi("admin_rso_approve_document", {submission_id, decision: "rejected", reason, token})

**Key Functions:**
- `loadRsoDocuments()` → handlePortalApi("admin_rso_pending_documents", {token})
- `approveDocument(id)` → handlePortalApi("admin_rso_approve_document", {submission_id, token})
- `rejectDocument(id, reason)` → handlePortalApi("admin_rso_approve_document", {...})

---

### rso-applications
**Purpose:** Applications ready for RSO document review

**Displays:**
- Applications after board initial approval, ready for RSO review
- Applicant name, category, status
- Documents submitted list

**Actions:**
- Navigate to Document Reviews for actual document approvals

**Key Functions:**
- `loadRsoAppsReady()` → handlePortalApi("admin_rso_applications_ready", {token})

---

### rso-member-documents
**Purpose:** RSO review of member documents (rso_approve only)

**Similar to rso-documents but for member document resubmissions**

**Displays:**
- Documents from existing members pending RSO review

**Key Functions:**
- `loadRsoMemberDocuments()` → handlePortalApi("admin_rso_pending_member_documents", {token})

---

### rso-calendar
**Purpose:** Event calendar for RSO coordination

**Displays:**
- Month view of approved reservations
- Color-coded by facility
- Shows household, guest count, special notes
- (Read-only for rso_notify, full controls for rso_approve)

**Key Functions:**
- `loadRsoCalendar()` → handlePortalApi("admin_rso_approved_calendar", {month, token})

---

### rso-approved-guests
**Purpose:** Final guest lists for RSO event coordination

**Displays:**
- Finalized guest lists with:
  - Event date, facility, household
  - Household contact info
  - Guest list (names, relationships, age groups)

**Actions:**
- Click event → Detail pane with:
  - Full guest list
  - Household contact (phone, email)
  - Special notes from household
  - (Read-only)

**Key Functions:**
- `loadRsoApprovedGuestLists()` → handlePortalApi("admin_rso_approved_guest_lists", {month, token})

---

## Navigation & Session Management

### Main Navigation
- Header with logo and admin name
- Sidebar with page categories:
  - Core Operations
  - Member Management
  - Payment Management
  - Admin Accounts
  - RSO (if rso_approve role)
- Mobile hamburger menu
- Logout button

### Role-Based Visibility
- Only authorized pages shown based on role
- board: All 19 pages
- mgt: dashboard, reservations (Leobo only), lapsed-members, rso-calendar
- rso_approve: dashboard, rso-documents, rso-member-documents, rso-calendar, rso-approved-guests
- rso_notify: dashboard, rso-calendar, rso-approved-guests (all read-only)

---

## Error Handling

All API calls check for:
- AUTH_REQUIRED: No token
- AUTH_FAILED: Token invalid/expired
- FORBIDDEN: Role doesn't have permission for action
- NOT_FOUND: Resource not found
- INVALID_PARAM: Validation failed
- SERVER_ERROR: Backend exception

---

**For detailed workflows, see:** [CLAUDE_Reservations_Implementation.md](../implementation/CLAUDE_Reservations_Implementation.md), [CLAUDE_Membership_Implementation.md](../implementation/CLAUDE_Membership_Implementation.md), [CLAUDE_Payments_Implementation.md](../implementation/CLAUDE_Payments_Implementation.md)
