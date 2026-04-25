# Board Operations Guide

**Last Updated:** April 25, 2026

Complete operational guide for board members managing the GEA system daily.

---

## Quick Start: Daily Tasks

Every board member should check these daily:

1. **Dashboard** → Review pending items (pending reservations, photo submissions, unverified payments, applicants)
2. **Reservations** → Approve/deny pending facility bookings
3. **Applications** → Process pending membership applications
4. **Payments** → Verify submitted payment proofs

Role-based access means your dashboard shows only items relevant to your role.

---

## Dashboard Overview

**Location:** Admin.html → Dashboard (auto-loads)

**Key Metrics (auto-update):**
- Pending reservations (awaiting your approval)
- Pending photo submissions
- Unverified payments
- Today's scheduled events
- Active memberships
- Applicants in progress

**Action Items:**
- Recent items needing attention
- Upcoming items (next 7 days)
- Click any item to navigate to its detail view

**Best Practice:** Start your day here. It's your command center.

---

## Facility Reservations Management

**Location:** Admin.html → Core Operations → Reservations

### Understanding the Status Flow

**Auto-Approved (no action needed):**
- Tennis Court bookings under 3 hrs/week (instantly approved at submission)
- Gym/Playground walk-up bookings (instantly approved)
- Basketball court bookings (instantly approved)

**Pending Your Approval:**
- Tennis Court bookings exceeding 3 hrs/week limit (requires board approval)
- Leobo bookings (require 2-stage approval: management first, then board)

### Daily Reservation Tasks

1. **Review pending reservations:**
   - Filter: "Pending" tab shows only awaiting-approval items
   - Click reservation → Detail pane shows full details
   - Review: facility, date, time, guest count, household info

2. **Approve a reservation:**
   - Click [Approve] button
   - System confirms approval
   - Email sent to household; calendar event created

3. **Deny a reservation:**
   - Click [Deny] button
   - Modal appears asking for denial reason
   - Enter clear reason (e.g., "Exceeds household limit," "Facility unavailable")
   - System sends denial email with reason

4. **View reservation calendar:**
   - Res-Calendar page shows all approved bookings by month and facility
   - Month/facility selector dropdowns
   - Click any event for detail view
   - Board members can [Edit] or [Cancel] any reservation

**Leobo Special Routing:**
- Management Officer (mgt role) approves first
- Your dashboard shows as pending after mgt approval
- You approve second
- Only then is it fully approved for the household

---

## Membership Applications Processing

**Location:** Admin.html → Member Management → Applications

### Understanding Application Status

Applications follow an 11-step workflow. Your role is to approve/deny at **two decision points:**

1. **Board Initial Review** (Step 3): After applicant submits documents
2. **Board Final Review** (Step 5): After RSO approves all documents

### Daily Application Tasks

1. **Review applications ready for board initial review:**
   - Status filter: "board_initial"
   - Click application → Detail pane shows:
     - Full application info
     - Q1-Q5 questionnaire responses (auto-determined eligibility category)
     - Submitted documents list with status
     - [Approve] or [Deny] buttons

2. **Approve an application:**
   - [Approve] button → Application moves to RSO Document Review stage
   - Email sent to applicant with next steps
   - RSO team receives notification to begin document review

3. **Deny an application:**
   - [Deny] button → Modal for denial reason
   - Enter clear reason (e.g., "Does not meet eligibility criteria," "Documents incomplete")
   - Application marked as denied
   - Email sent to applicant with reason and reapplication instructions

4. **Review applications ready for board final review:**
   - Status filter: "board_final"
   - RSO has already approved all documents at this point
   - Detail pane shows:
     - Full application history
     - Document approval status from RSO
     - Payment status (applicant will submit payment after your approval)
   - [Approve] button → Applicant notified to submit payment
   - [Deny] button → Application rejected; send response via modal

**Key Points:**
- Don't worry about the middle steps (Steps 4, 6) — RSO handles those
- Your job is initial screening (Step 3) and final approval (Step 5)
- Every denial should include clear reason for future applicant understanding

---

## Payment Verification & Reporting

**Location:** Admin.html → Payment Management → Payments

### Pending Payments Tab

New applicants and current members submit payment proof; you verify.

1. **Review pending payment:**
   - Pending tab shows unverified submissions
   - Click payment → Detail pane shows:
     - Household info
     - Payment screenshot/receipt
     - Amount claimed, currency, payment method
     - Date submitted

2. **Verify a payment:**
   - Review receipt against household's balance due
   - [Approve] button → Payment marked verified
   - Household account updated
   - Email confirmation sent to household

3. **Reject a payment:**
   - Receipt is fake or doesn't match amount
   - [Reject] button → Modal for reason
   - Enter reason (e.g., "Amount doesn't match submission," "Receipt not legible")
   - Household notified; can resubmit
   - Email sent with rejection reason

4. **Request clarification:**
   - Payment looks valid but needs verification
   - [Request Clarification] button
   - Modal → Enter question (e.g., "Can you provide Zelle confirmation?")
   - Email sent to household with your question
   - They resubmit with clarification

### Payment Report Tab

Generate reports for board meetings and accounting.

1. **Generate report:**
   - Membership Year dropdown (e.g., "2025-2026")
   - Status filter: Verified / Submitted / Rejected / Clarification Requested
   - [Generate Report] button

2. **Report output:**
   - Table with:
     - Household name, email
     - Amount USD, amount BWP
     - Payment method (PayPal, Zelle, etc.)
     - Status
     - Date submitted
   - Summary section: Total verified count, total USD, total BWP

3. **Export to CSV:**
   - [Export CSV] button
   - Downloads spreadsheet for Excel/accounting software

**Best Practice:** Run payment reports monthly to reconcile with treasurer. Export for quarterly board meetings.

---

## Member Management

**Location:** Admin.html → Member Management → Members

### Search & Browse

- Search bar: Filter by household name, member name, or email
- List shows:
  - Household name, primary member name, email
  - Membership category, status, expiration date
  - Phone, dues status

### Member Detail View

Click member → Detail pane shows:

1. **Household Information:**
   - Full household details
   - All household members (with relationships)
   - Contact information

2. **Membership Details:**
   - Membership dates
   - Category (Full, Associate, Affiliate, etc.)
   - Status (Active, Lapsed, Expelled, etc.)

3. **Payment History:**
   - All payments submitted
   - Verification status for each
   - Balance due

4. **[Edit] button (board only):**
   - Update household or membership data
   - Modify contact information
   - Update membership status

---

## Lapsed Members Tracking

**Location:** Admin.html → Member Management → Lapsed Members

Members whose memberships have expired appear here.

1. **Review lapsed member:**
   - List shows: household name, expiration date, days lapsed, last payment date
   - Click member → Detail pane shows:
     - Full membership history
     - Renewal attempt dates
     - [Send Renewal Reminder] button
     - [Mark Renewed] button

2. **Send renewal reminder:**
   - [Send Renewal Reminder] button → Email sent to household
   - Email template includes renewal process and payment instructions

3. **Mark as renewed:**
   - After household pays for renewal year
   - [Mark Renewed] button → Updates membership status
   - Member returns to active status

---

## Photo Submissions & Approvals

**Location:** Admin.html → Member Management → Photos

Member photos pending your approval (for membership cards and profile).

1. **Review pending photo:**
   - List shows: member name, submission date, status
   - Click photo → Detail pane shows:
     - Full-size photo preview
     - Member info
     - [Approve] or [Reject] buttons

2. **Approve a photo:**
   - [Approve] button → Photo transferred to Cloud Storage (gs://gea-member-data/)
   - Photo now active for membership card display
   - Email confirmation sent to member

3. **Reject a photo:**
   - [Reject] button → Modal for reason
   - Enter reason (e.g., "Not clear," "Not professional," "Face not visible")
   - Email sent to member with reason; can resubmit

---

## Membership Rules Management

**Location:** Admin.html → Payment Management → Rules

Define membership eligibility rules and pricing tiers.

### View Current Rules

Table shows:
- Membership category (Full, Associate, Affiliate, etc.)
- Household type (Individual/Family)
- Annual dues (USD/BWP)
- Eligibility criteria description
- Active flag

### Add New Rule

[Add Rule] button → Modal:
- Category dropdown
- Household type selector
- Annual dues (USD and BWP)
- Eligibility description
- [Create] button

### Edit Existing Rule

- [Edit] button on any rule → Modal with current values
- Update any field
- [Save] button

### Delete Rule

- [Delete] button with confirmation
- Rule marked inactive (not truly deleted for audit trail)

---

## Admin Account Management

**Location:** Admin.html → Admin Accounts → Administrators

Manage board members, RSO admins, and management officers.

### View Admin Accounts

List shows:
- Name, email, role
- Status (active/deactivated)
- Created date
- Last login date

### Add New Admin

[Add Admin] button → Modal:
- Name field
- Email field
- Role dropdown:
  - `board` — Full admin access (all features)
  - `mgt` — Management Officer (Leobo approvals only, some member views)
  - `rso_approve` — Document and guest list reviewer
  - `rso_notify` — Read-only event coordinator (view only)
- [Create] button → Account created with temporary password sent via email

### Edit Admin

Click admin → Detail pane:
- [Edit] button → Modal to change role or status
- [Reset Password] button → Generate temporary password, email to admin
- [Deactivate] button → Disable account (for departing admins)
- [Reactivate] button → Re-enable deactivated account

---

## Reservation Calendar View

**Location:** Admin.html → Core Operations → Res-Calendar

Month-view calendar showing all approved reservations.

- **Month selector:** Choose which month to view
- **Facility selector:** Filter by Tennis, Leobo, Gym, Basketball, Playground
- **Color-coded by facility:** Easy visual scanning
- **Click event:** Opens detail pane with full reservation details
- **[Edit] button:** Modify reservation details (rare)
- **[Cancel] button:** Cancel approved reservation (refund processed automatically)

**Best Practice:** Use this to identify scheduling conflicts or understand facility usage patterns.

---

## Waitlist Management

**Location:** Admin.html → Core Operations → Waitlist

Tentative reservations waiting for bumping window to expire.

- **Bump Window Deadline:** Last date this reservation can be bumped by higher-priority household
- **Status:** "Can be bumped" or "Bump window closed"
- **Sorted by deadline:** Soonest expiration first

### Daily Waitlist Tasks

1. **Review pending bumps:**
   - [Mark as Confirmed] button → Auto-confirms if bump window passed
   - [View Blocking] button → See which reservation is preventing this one

2. **Monitor deadlines:**
   - Waitlist sorted by deadline for easy visibility
   - Confirming when ready prevents customer confusion

---

## Guest List Approval (RSO Coordination)

**Location:** Admin.html → Core Operations → Guest Lists

Guest lists submitted for board-approved reservations. RSO team reviews.

1. **Review pending guest list:**
   - List shows: household name, reservation details, submission date
   - Click guest list → Detail pane shows:
     - Guest list (name, relationship, age group, ID if vendor)
     - Member info
     - [Approve] button (RSO only)
     - [Reject] button (RSO only)

2. **Approve guest list:**
   - [Approve] button → Guest list finalized
   - Household notified
   - Guest list ready for RSO coordination on event day

3. **Reject guest list:**
   - [Reject] button → Modal for reason
   - Email sent to household with request to resubmit

**Note:** This is primarily RSO work. Board members can view but typically don't approve guest lists.

---

## Error Handling

If you encounter an error, look for one of these messages:

- **AUTH_REQUIRED:** Your session expired. Log out and log back in.
- **AUTH_FAILED:** Invalid credentials. Try logging out and back in.
- **FORBIDDEN:** Your role doesn't have permission for this action. Contact board chair.
- **NOT_FOUND:** Resource was deleted or doesn't exist. Navigate back to the list.
- **INVALID_PARAM:** Form validation failed. Check all required fields are filled.
- **SERVER_ERROR:** System error. Try refreshing the page. If persists, contact board@geabotswana.org.

---

## Session Management

- **Login:** Email + password
- **Session timeout:** 24 hours (sliding window)
- **Auto-logout:** If no activity for 24 hours, you're logged out
- **Logout:** Click logout button in top-right corner

---

## Tips & Best Practices

### Approval Decisions
- Always include reasons for denials
- Be consistent in your decision criteria
- When unsure, request clarification rather than reject

### Time Management
- Check dashboard first thing in morning
- Process applications in batches (all "board_initial" then all "board_final")
- Generate payment reports monthly, not daily

### Accuracy
- Double-check household names before approval (avoid approving for wrong family)
- Review payment receipts carefully (amounts match, receipt is legible)
- Use calendar view to spot duplicate bookings or conflicts

### Communication
- Always include next steps in denial messages
- Respond to clarification requests within 24 hours
- Send renewal reminders 30 days before expiration

---

**Need help?** Email board@geabotswana.org or check [ADMIN_INTERFACE.md](../frontend/ADMIN_INTERFACE.md) for technical details.
