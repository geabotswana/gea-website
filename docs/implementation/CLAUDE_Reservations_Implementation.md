# Reservation System Implementation Guide

Complete implementation guide for the GEA facility booking system, including rules, approval workflows, guest list management, and bumping logic.

---

## Facilities & Booking Rules

### Reservable and Walk-Up Facilities

1. **Tennis Court / Basketball Court (Dual-Use)** — Combined outdoor court (reservable)
   - Location: Presidents Drive plot
   - Max reserved session: 2 hours per booking
   - Access: By reservation or walk-in
   - Reservation limits: To promote fair use (3 hours per week per household)

2. **Leobo (Thatch-Roofed Meeting Area)** — Covered gathering space (reservable)
   - Location: Presidents Drive plot
   - Max reserved session: 6 hours per booking
   - Access: By advance reservation only
   - Reservation limits: To promote fair use (1 per month per household)
   - Equipment: Charcoal/wood-fueled braai and barbecues

3. **Gym (Multi-Machine)** — Fitness equipment facility (freely available)
   - Location: North Ring Road plot
   - Access: Freely available, no reservations
   - Hours: 6am–8pm daily
   - Equipment: Multiple machines for cardio & strength training

4. **Children's Playground** — Recreational play equipment (freely available)
   - Location: Presidents Drive plot
   - Access: Freely available, no reservations
   - Hours: 6am–8pm daily
   - Equipment: Swings, slides, climbing structures

**Important:** Rec Center/"Whole Facility" reservations are **not supported**. Members may reserve **only one facility per reservation**: either TC/BC or Leobo. A single reservation cannot include both TC/BC and Leobo.

### Booking Time Slots & Duration

- Time slots: :00, :15, :30, :45 intervals
- Minimum booking: 15 minutes
- Maximum booking: 2 hours per session
- Session example: 14:00–15:30 = 1.5 hours

### Household Booking Limits

| Facility | Limit | Period | Notes |
|----------|-------|--------|-------|
| Tennis Court/Basketball | 3 hours | Weekly (Mon–Sun) | Enforced nightly, resets Monday 2:00 AM GMT+2 |
| Leobo | 1 booking | Monthly | Max 6 hours per booking; resets 1st of month 2:00 AM GMT+2 |
| Combined TC/BC + Leobo | Not allowed | — | A single reservation request cannot span both areas |

---

## Complete Reservation Lifecycle

### STEP 1: Member Submits Booking Request

```
Portal.bookFacility() → handlePortalApi("book", params)
  ↓
ReservationService.createReservation() validates:
  ├─ Household active & membership current
  ├─ Facility exists & date/time valid
  ├─ No double-booking (same facility overlaps)
  ├─ Cross-facility combination check: rejects any request that includes both TC/BC and Leobo
  ├─ Usage limits:
  │  ├─ TC/BC: weekly usage + this request ≤ 3 hours → Regular booking
  │  └─ TC/BC: weekly usage + this request > 3 hours → Excess booking
  │  ├─ Leobo: monthly usage + this request ≤ 6 hours → Regular booking
  │  └─ Leobo: monthly usage + this request > 6 hours → Excess booking
  └─ Generates reservation_id (RES-YYYY-MM-DD-###)

Creates calendar event on Reservations Calendar:
  ├─ Title: "[TENTATIVE] [FACILITY] - [HOUSEHOLD_NAME]"
  ├─ Description contains: reservation_id, household_id, facility_type, booking_status, approval_status
  └─ Event visible to member immediately (even if pending approval)

Inserts row in Reservations sheet with status & timestamps

Sends email to board@geabotswana.org: "New Booking Submitted"
(includes household usage stats)
```

### STEP 2: Approval Routing (Facility-Dependent)

#### Tennis Court/Basketball Court (TC/BC)

**IF Regular booking** (usage ≤ 3 hrs/week after this):
- AUTO-APPROVED (no board review needed)
  - Update calendar: status=[APPROVED]
  - Update Reservations sheet: approval_status="approved_auto", board_approved_by="System"
  - Send member email: "Booking Approved"

**IF Excess booking** (usage > 3 hrs/week after this):
- Send board@geabotswana.org approval request
- Calendar marked [TENTATIVE_EXCESS]
- Reservations sheet: board_approval_required=TRUE, board_approved_by=NULL
- Member can see booking but it's "Pending Board Approval"
- Board approves/denies (see STEP 3)

#### Leobo (Covered Meeting Area)

**TWO-STAGE APPROVAL** (Mgmt FIRST, then Board)
- Send mgt-notify@geabotswana.org for Mgmt Officer approval
- Calendar marked [TENTATIVE]
- Reservations sheet: mgmt_approval_required=TRUE, mgmt_approved_by=NULL
- Once Mgmt approves:
  - Calendar updated to [TENTATIVE_BOARD]
  - Send board@geabotswana.org for Board approval
  - Reservations sheet: mgmt_approval_required=FALSE, mgmt_approved_by=[NAME], board_approval_required=TRUE
- Once Board approves (or denies): Proceed to STEP 3


### STEP 3: Board/Mgmt Review & Decision

#### APPROVE PATH
```
Admin.html approveReservation(reservation_id)
  ├─ Update Reservations sheet: approval_status="approved", [APPROVER]_approved_by=[BOARD_MEMBER], [APPROVER]_approval_timestamp=NOW
  ├─ Update calendar event: title=[APPROVED], description updated
  ├─ Send member email: "Booking Approved - Ready to Proceed"
  ├─ Set bumping deadline (if applicable):
  │  ├─ Tennis excess: bump_window_deadline = reservation_date - 1 day
  │  └─ Leobo excess: bump_window_deadline = reservation_date - 5 business days
  ├─ Guest list deadline auto-calculated:
  │  └─ guest_list_deadline = reservation_date - GUEST_LIST_SUBMISSION_DAYS_BEFORE (default 2 business days)
  └─ Status: "Confirmed" (ready for guest list submission)
```

#### DENY PATH
```
Admin.html denyReservation(reservation_id, denial_reason)
  ├─ Update Reservations sheet:
  │  ├─ approval_status="denied"
  │  ├─ denying_authority=[BOARD/MGMT]
  │  ├─ denial_timestamp=NOW
  │  └─ [APPROVER]_denial_reason=[REASON]
  ├─ Delete calendar event (cleanup)
  ├─ Send member email: "Booking Denied" (include denial reason)
  └─ Audit log: Record denial for compliance
```

### STEP 4: Approval Reminders (Nightly)

```
NotificationService.runNightlyTasks() sends approval reminders to board/mgmt:
  ├─ Query: Reservations where approval_status=NULL AND submission_timestamp > 1 business day ago
  ├─ Send email to approver: "Pending Approval Reminder"
  │  (includes household info, usage stats)
  └─ No auto-escalation (friendly reminder only)
```

### STEP 5: Guest List Submission (After Approval)

```
Member navigates to reservation detail page
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
     │  ├─ Email member: "Guest List Incomplete"
     │  └─ Member must confirm intent
     │
     ├─ Case C: guest_count=0, entries submitted > 0
     │  ├─ Deadline passes
     │  ├─ Email member: "Guest List Submitted (uncounted)"
     │  └─ Proceed with submitted guest list
     │
     └─ Case D: guest_count>0, entries submitted = guest_count
        ├─ Deadline passes
        ├─ Forward to RSO: "Guest List Ready for Review"
        └─ Proceed to STEP 6
```

### STEP 6: RSO Guest List Review (Management Officer)

```
RSO receives email: "Guest List Submitted for Review"
  ├─ RSO accesses one-time approval link (expires after use/72 hours)
  ├─ RSO can:
  │  ├─ Accept all guests → status="rso_approved", send confirmation
  │  └─ Reject individual guests → status="rso_rejected", send reason
  │
  ├─ If individual guests rejected:
  │  ├─ Member notified (with RSO rejection reason)
  │  ├─ Member can remove rejected guests OR
  │  ├─ Member can re-submit with changes (within reasonable timeframe before event)
  │  └─ Audit trail: rso_rejection_reason recorded per guest
  │
  └─ If all guests approved:
     ├─ Update Reservations: guest_list_submitted=TRUE
     ├─ Update Guest Lists sheet:
     │  └─ rso_status="approved", rso_reviewed_by=[RSO_NAME], rso_review_timestamp=NOW
     └─ Reservation ready to proceed
```

### STEP 7: Final Call Email (1 Business Day Before Deadline)

```
NotificationService.runNightlyTasks() triggers at 6:00 AM GMT+2
  ├─ Query: Reservations where guest_list_deadline = tomorrow AND guest_list_submitted=FALSE
  ├─ Send member email: "Guest List Final Call - Due Tomorrow"
  └─ Reminder includes: deadline time, instructions, RSO contact info
```

### STEP 8: Bumping Logic (Excess/Waitlist Only)

#### Excess Bookings
```
After approval, system sets bump_window_deadline:
  ├─ Tennis excess: 1 day before event
  └─ Leobo excess: 5 business days before event

During bump window:
  ├─ System monitors Regular bookings on same facility/time
  ├─ If Regular booking cancelled → Excess booking auto-promoted to Confirmed
  ├─ Calendar updated: [BUMPED_TO_CONFIRMED]
  ├─ Send member email: "Excess Booking Bumped Up - Now Confirmed"
  └─ Reservations sheet:
     └─ status="Confirmed", bumped_by_household_id=NULL (promoted, not bumped)

After bump window expires:
  ├─ If still status="Excess" → auto-approve to Confirmed
  ├─ Calendar updated: [AUTO_CONFIRMED_EXCESS]
  ├─ Send member email: "Excess Booking Auto-Confirmed"
  └─ Reservations sheet: approval_status="auto_confirmed_excess"
```

#### Waitlisted Bookings (Future Feature)
```
After approval, system sets waitlist_position by submission_timestamp
  ├─ Member notified: "You are #N on the waitlist for [FACILITY] [DATE]"
  │
  ├─ If Regular or Excess booking cancelled:
  │  ├─ Earliest waitlisted booking auto-promoted to next tier
  │  ├─ Calendar event created for promoted booking
  │  ├─ Send member email: "Waitlist Promotion - You're In!"
  │  └─ Reservations sheet: status="Confirmed" or "Excess"
  │
  └─ Waitlist auto-cancelled X days before event if primary remains:
     ├─ Config.WAITLIST_CANCELLATION_DEADLINE_DAYS_BEFORE (default 7)
     ├─ Query: Reservations where status="Waitlisted" AND reservation_date within X days
     ├─ Cancel with reason: "Auto-cancelled (no slot available)"
     └─ Send member email: "Waitlist Position Cancelled"
```

### STEP 9: Member Modifies or Cancels Reservation

#### Modify Date/Time/Facility
```
System treats as: Cancel existing + Create new request
  ├─ New request goes through full approval chain (STEPS 1–3)
  ├─ Old reservation: status="Modified", calendar event deleted
  └─ Guest list carries over BUT deadline recalculates
```

#### Modify Guest List Only
```
No re-approval needed
  ├─ Update Guest Lists sheet
  └─ Notify RSO if after original deadline (re-review if needed)
```

#### Modify Household Invitees
```
No re-approval needed
  ├─ Update calendar invites
  └─ New invitees receive fresh calendar invite
```

#### Cancel Reservation
```
Portal.cancelReservation(reservation_id, cancellation_reason)
  ├─ Update Reservations sheet:
  │  ├─ status="Cancelled"
  │  ├─ cancelled_by=[HOUSEHOLD_MEMBER]
  │  ├─ cancellation_timestamp=NOW
  │  └─ cancellation_reason=[REASON]
  ├─ Delete calendar event
  ├─ Check waitlist: if waitlisted bookings exist, promote earliest
  ├─ Send member confirmation email
  └─ Audit log: Record cancellation
```

### STEP 10: Event Day & Post-Event

```
Reservation date arrives
  ├─ Member uses facility (playground: walk-up, no tracking needed)
  ├─ Post-event:
  │  ├─ Member can optionally add notes/photos in portal
  │  ├─ Audit log: Event completed (if tracking implemented)
  │  └─ Usage statistics updated for next booking cycle
  └─ Nightly: Usage tracking reset if applicable (Tennis Mon, Leobo 1st of month)
```

---

## Approval Routing Summary Table

| Facility | Regular Booking | Excess/Tentative Booking | Approvers | Timeline |
|----------|-----------------|--------------------------|-----------|----------|
| **Tennis Court/Basketball Court (TC/BC)** | Auto-approved ✅ | Board approval required | board@geabotswana.org | 1 approval stage |
| **Leobo** | Board approval required | Board approval required | mgt-notify@, then board@ | 2 approval stages (Mgmt → Board) |
| **Playground** | Walk-up only (no reservation) | N/A | N/A | N/A |
| **Gym** | Walk-up only (no reservation) | N/A | N/A | N/A |

---

## Calendar Event Status Tags

Calendar event titles use status tags to indicate booking state:

| Tag | Meaning | Next Action |
|-----|---------|-------------|
| `[TENTATIVE]` | Pending first-stage approval | Awaiting Mgmt (Leobo) or Board (TC/BC) |
| `[TENTATIVE_EXCESS]` | Excess TC/BC booking pending Board | Awaiting Board approval |
| `[TENTATIVE_BOARD]` | Leobo pending second-stage Board approval | Awaiting Board approval (Mgmt already approved) |
| `[APPROVED]` | All approvals complete, ready for guest list | Guest list due X days before |
| `[BUMPED_TO_CONFIRMED]` | Excess booking promoted during bump window | Event ready to proceed |
| `[AUTO_CONFIRMED_EXCESS]` | Excess booking auto-approved after bump window | Event ready to proceed |
| `[DENIED]` | Booking rejected at any approval stage | Deleted from calendar after status recorded |
| `[CANCELLED]` | Member cancelled reservation | Event deleted, waitlist promoted (if applicable) |

---

## Configuration Variables (Config.gs)

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

---

## Reservations Sheet Schema (Essential Columns)

### Core Booking Data
- `reservation_id` — Unique identifier (RES-YYYY-MM-DD-###)
- `household_id`, `submitted_by_individual_id`, `submitted_by_email` — Who booked it
- `submission_timestamp` — When booking request was created
- `facility` — Tennis Court/Basketball Court (TC/BC) or Leobo
- `reservation_date`, `start_time`, `end_time`, `duration_hours` — When the booking is
- `event_name`, `guest_count`, `notes` — Optional event details

### Approval Tracking
- `approval_status` — "pending", "approved_auto", "approved", "denied", "cancelled", "modified"
- `board_approval_required`, `board_approved_by`, `board_approval_timestamp`, `board_denial_reason`
- `mgmt_approval_required`, `mgmt_approved_by`, `mgmt_approval_timestamp`, `mgmt_denial_reason`
- `denying_authority`, `denial_timestamp` — Which approver denied (if applicable)

### Booking Status
- `status` — "Regular", "Excess", "Waitlisted", "Confirmed", "Cancelled", "Denied", "Modified"
- `booking_status` — Maps to approval tier (for display in UI)
- `is_excess_reservation` — TRUE if booking exceeds household limits

### Bumping & Waitlist
- `bump_window_deadline` — Date when excess booking auto-confirms
- `bumped_by_household_id` — If promoted due to another household cancelling
- `bumped_date` — When promotion occurred
- `waitlist_position` — Nth in line (if applicable)

### Guest List Tracking
- `guest_list_submitted`, `guest_list_deadline` — Deadline for submitting guest list

### Calendar Integration
- `calendar_event_id` — Google Calendar event ID (enables updates/deletions)

### Cancellation
- `cancelled_by`, `cancellation_timestamp`, `cancellation_reason` — Who cancelled and why

---

## Key Behavioral Notes

### Reservation Bumping (Tennis vs Leobo)
- Tennis: 1-day bump window (members can bump tentative reservations up to 1 day before)
- Leobo: 5 business days bump window (calculated excluding weekends & holidays)
- After bump window expires → status="Confirmed" (locked, cannot be bumped)

### Usage Tracking Reset
- Tennis: Weekly (Monday 2:00 AM GMT+2)
- Leobo: Monthly (1st of month 2:00 AM GMT+2)
- Calculated nightly in NotificationService.runNightlyTasks()

### Double-Booking Prevention
- Same facility: no time slot overlaps allowed
- Single reservation cannot include both TC/BC and Leobo in one request
- System checks before approval to prevent conflicts

### Email Template Variables
- `{{PLACEHOLDER}}` → Replaced before sending
- Conditional blocks: `{{IF_FAMILY}}...{{END_IF}}`, `{{IF_TEMPORARY}}...{{END_IF}}`
- Supports nested conditions for complex templates

---

## Related Documentation

- **GEA Reservation Policy** — Policy requirements and member-facing information
- **GEA_Reservations_Process_Spec.md** — Reference specification in docs/reference/
- **GEA_System_Schema.md** — Complete database schema (sheets and columns)
- **ReservationService.js** — Backend implementation (797 lines)
- **Portal.html** — Member UI for booking (section: Reservations)
- **Admin.html** — Board UI for approval (section: Reservations)

---

**Last Updated:** March 4, 2026
**Source:** Extracted from CLAUDE.md lines 315–682
