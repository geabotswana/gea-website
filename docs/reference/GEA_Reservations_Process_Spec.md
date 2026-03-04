# GEA Reservations Process Specification

**Last Updated**: February 23, 2026  
**Status**: Draft—awaiting final review and Config.gs variable definitions  
**Owner**: Michael Raney (GEA Treasurer)

---

## Overview

The GEA Reservations system manages bookings for three facility types (Tennis Court/Basketball Court, Leobo/Covered Meeting Area, Whole Facility) with a multi-stage approval workflow, household booking limits, excess booking protocols, and integrated guest list management.

**Key Principles:**
- All reservations stored in single Google Calendar (Config.gs: `RESERVATIONS_CALENDAR_ID`)
- All reservations tracked in Sheets (Reservations tab + Guest Lists tab)
- Household booking limits enforced before calendar event creation
- Calendar events serve dual purpose: member calendar visibility + admin status tracking
- Approval workflow varies by facility type and booking limits
- Guest lists collected via separate form with deadline-driven workflow
- Waitlisted bookings tracked with submission timestamp priority

---

## Part 1: Reservation Request & Facility Validation

### 1.1 Member Submits Booking Request

**Input:**
- Facility type (TC/BC, Leobo, Whole Facility)
- Requested date & time (slots: :00, :15, :30, :45; duration: 15-min intervals, max 2 hours per session)
- Household making the request
- Which household member(s) should receive calendar invites (see Section 5 for invite logic)

**Step 1: Pre-Calendar Validation** (before event is created)
- Check if household has exceeded booking limits for the facility in the relevant period:
  - **TC/BC**: 3 hours per calendar week (Sun-Sat)
  - **Leobo**: 1 booking per calendar month, up to 6 hours per booking
  - **Whole Facility**: (Define limit in Config.gs if applicable; not yet specified)
- Check for overlapping bookings:
  - TC/BC bookings cannot overlap with each other or with Whole Facility bookings
  - Leobo bookings cannot overlap with each other or with Whole Facility bookings
  - Whole Facility bookings block both TC/BC and Leobo
- If limit exceeded → mark booking as **"Excess Booking"** (subject to Board approval + bumping protocol)
- If waitlist requested and slot conflicts → mark as **"Waitlisted"** (see Section 7 for details)

**Step 2: Create Tentative Calendar Event**
- Event name: `[FACILITY_CODE] - [HOUSEHOLD_NAME]`
  - Example: `TC/BC - Smith Family, 2:00-4:00pm`
- Event time: requested slot
- Event color: Facility-based (define in Config.gs: TC/BC=color1, Leobo=color2, Whole Facility=color3)
- Event status tag (in event description): `[TENTATIVE]` + approval state (e.g., `[TENTATIVE - Pending Board Approval]`)
- Event metadata (in event description or custom fields):
  - `reservation_id`: unique identifier (link to Sheets row)
  - `household_name`
  - `household_id`
  - `facility_type`
  - `booking_status`: "Regular" | "Excess" | "Waitlisted"
  - `submission_timestamp`: ISO 8601 datetime
  - `approval_status`: "Pending Board" | "Pending Mgmt" | "Pending Guest List" | "Approved" | "Cancelled" | "Expired"
  - `guest_list_deadline`: ISO 8601 datetime (calculated based on event date - Config.gs: `GUEST_LIST_SUBMISSION_DAYS_BEFORE`)
  - `waitlist_position` (if applicable): integer (1st, 2nd, etc.)

**Step 3: Notify Board of New Request**
- Send email to `board@geabotswana.org` with:
  - Booking details (facility, household, date/time, duration)
  - Household's current usage for the facility this period:
    - Example: "This is [Household_Name]'s 2nd TC/BC booking of the week, bringing their total to 2 hours used."
    - Example: "This is [Household_Name]'s 4th TC/BC booking of the week and is therefore subject to bumping protocols (excess booking)."
  - Link to approval portal / decision page
  - Booking status: "Regular" or "Excess" or "Waitlisted"

### 1.2 Add to Reservations Sheet

Record in `Reservations` tab:
- `reservation_id` (auto-generated)
- `household_id`
- `household_name`
- `requesting_member_email`
- `facility_type`
- `event_date`
- `event_start_time`
- `event_end_time`
- `booking_status` ("Regular", "Excess", "Waitlisted")
- `submission_timestamp`
- `approval_status` ("Pending Board", "Pending Mgmt", "Pending Guest List", "Approved", "Cancelled", "Expired")
- `guest_count` (number of non-member guests expected; 0 if none)
- `guest_list_deadline` (ISO 8601 datetime)
- `calendar_event_id` (link to Google Calendar event)

---

## Part 2: Approval Workflow

### 2.1 Approval Routing by Facility Type

**Tennis Court / Basketball Court (Regular Booking):**
- No approval required
- Calendar event status: `[APPROVED]`
- Proceed directly to Section 3 (Guest List Workflow, if applicable)

**Tennis Court / Basketball Court (Excess Booking):**
- Approval required: **Board approval only**
- Approvers: `board@geabotswana.org` (any of 3 board members can approve)
- Calendar event status: `[TENTATIVE - Pending Board Approval]`

**Leobo / Covered Meeting Area (All Bookings):**
- Approvals required: **Mgmt FIRST, then Board**
- Mgmt approvers: `mgt-notify@geabotswana.org`
- Board approvers: `board@geabotswana.org`
- Calendar event status: `[TENTATIVE - Pending Mgmt Approval]` → (if approved) → `[TENTATIVE - Pending Board Approval]` → (if approved) → `[APPROVED]`

**Whole Facility (All Bookings):**
- Approvals required: **Mgmt FIRST, then Board** (all requests require both approvals)
- Same as Leobo (Mgmt, then Board)
- Note: Whole Facility blocks both TC/BC and Leobo from being booked in the overlapping time slot
- Calendar event status: `[TENTATIVE - Pending Mgmt Approval]` → (if approved) → `[TENTATIVE - Pending Board Approval]` → (if approved) → `[APPROVED]`
- **Special tracking**: When a Whole Facility request is made, query the Reservations sheet for any previous Whole Facility bookings by this household. Include in the approval email to Board and Mgmt: "Previous Whole Facility requests by this household: [List with dates and outcomes]". This allows approval teams to identify patterns.

### 2.2 Approval Process

**Approvers Receive Email:**
- Recipients see a link to a decision page (not visible in their own calendars)
- Decision page displays:
  - Full booking details (facility, household, date/time, duration, requesting member)
  - Household's current usage (same as notified in 1.1)
  - Booking status (Regular, Excess, or Waitlisted)
  - Approval chain status (e.g., "Pending your Mgmt approval; Board will approve after")
  - [APPROVE] and [DENY] buttons

**Approval Rules:**
- Any recipient from the distro list can approve/deny
- Mgmt approval must come before Board approval
- Event remains `[TENTATIVE]` until all required approvals are obtained
- Once final approval is granted, calendar event status becomes `[APPROVED]`

**Approval Reminders:**
- Schedule automated reminder emails using Apps Script time-based trigger
- Trigger: Daily at 6:00 AM Botswana time
- Send to: Approver distro list if booking has been pending >1 business day
- Message: Friendly reminder header + original booking details + decision link
- Do not escalate if approval is very late; assume approver is managing their queue

**Member Notification of Approval Status:**
- Send email to requesting member when each approval stage changes
- Include current status (e.g., "Your Leobo booking has been approved by Management. Awaiting Board approval.")
- Include link to member portal where they can see full approval status

### 2.3 Calendar Event Lock-In

Once all required approvals are obtained, the calendar event status in the event description changes from `[TENTATIVE - ...]` to `[APPROVED]`.

The calendar event remains as the **source of truth for facility availability**—overlapping bookings cannot be made during an approved event's time slot.

---

## Part 3: Guest List Workflow

### 3.1 Guest List Deadline

**Definition:**
- A guest is a non-member who will attend the event and requires Embassy security clearance (RSO acknowledgment)
- Members have unrestricted access during normal operating hours; guest lists only required for non-members
- Guest list deadline: X business days before event (Config.gs: `GUEST_LIST_SUBMISSION_DAYS_BEFORE`)
  - Example: If event is on Friday and deadline is 2 business days before, deadline is Wednesday

**Initial Guest Count:**
- At booking submission, member specifies: `guest_count` (expected number of non-member guests)
  - 0 if no guests expected
  - Integer if guests expected (doesn't need to be final; can adjust at submission)

### 3.2 Member Portal: Guest List Form

**Form Features:**
- Accessible from member portal
- Allow member to add multiple guest rows in a single form submission
- Dynamic add/remove rows with +/- buttons (no page refresh; preserve previously entered rows)
- Fields per guest:
  - First Name
  - Last Name
  - Date of Birth (for RSO clearance purposes)
  - Relationship to Household (optional; for RSO reference)
- Submit button

**Submission Behavior:**
- Each guest entry creates a row in the `Guest Lists` sheet:
  - `reservation_id` (link to reservation)
  - `guest_first_name`
  - `guest_last_name`
  - `guest_dob`
  - `relationship`
  - `submission_timestamp`
  - `rso_status` ("Submitted", "Acknowledged", "Rejected")
  - `rso_rejection_reason` (if applicable)
- Member can resubmit / update guest list until deadline has passed

### 3.3 Guest List Deadline Workflow

**Automated Process:**

**One Business Day Before Deadline:**
- System sends email to requesting member:
  - "Your Leobo booking event is [DATE]. Guest list deadline is tomorrow ([DATE]). Please ensure all guest information is submitted."

**On/After Deadline Passes:**
- Query the Reservations & Guest Lists sheets to determine outcome:

**Case A: `guest_count = 0` AND `Guest Lists entries = 0`**
- Interpretation: Member expects no guests
- Action: No email sent; proceed to RSO acknowledgment step (but nothing to acknowledge)
- Calendar event status: `[APPROVED - No Guests]`

**Case B: `guest_count > 0` AND `Guest Lists entries < guest_count`**
- Interpretation: Member expected guests but hasn't submitted full list by deadline
- Action: Send email to member:
  ```
  Subject: Guest List Deadline Passed - [BOOKING DETAILS]
  
  The deadline for submitting guest list information for your [FACILITY] booking 
  on [DATE] has passed. You indicated [guest_count] guests, but we have [current_count] 
  entries on file.
  
  Please confirm: Do you want to keep your booking with the [current_count] guest(s) 
  currently submitted? Any additional guests cannot be added at this time.
  
  [Link to update guest count or confirm]
  ```

**Case C: `guest_count = 0` BUT `Guest Lists entries > 0`**
- Interpretation: Member didn't specify guests at booking but added them anyway; likely oversight
- Action: Send email to member:
  ```
  Subject: Guest List Confirmed - [BOOKING DETAILS]
  
  The deadline for submitting guest list information for your [FACILITY] booking 
  on [DATE] has passed. You initially indicated no guests, but we have [entries_count] 
  guest entries on file:
  
  [List of guests]
  
  Embassy RSO will contact you if any further details are needed.
  ```
- Calendar event status: `[APPROVED - Pending RSO Acknowledgment]`

**Case D: `guest_count > 0` AND `Guest Lists entries = guest_count`**
- Interpretation: Complete guest list submitted by deadline
- Action: No email needed; automatically proceed to RSO acknowledgment
- Calendar event status: `[APPROVED - Pending RSO Acknowledgment]`

### 3.4 Early Submission Option

**Member Can Mark "Guest List Complete":**
- In member portal, next to the guest list form, button: `[Mark Guest List as Final]`
- This triggers:
  - Remove deadline event from calendar
  - Cancel final-call email if it hasn't been sent yet
  - Immediately send guest list to RSO for acknowledgment
  - Calendar event status changes to `[APPROVED - Pending RSO Acknowledgment]`
  - Email to member: "Your guest list has been marked as final and submitted to Embassy RSO. They will contact you if further information is needed."

### 3.5 RSO Acknowledgment & Guest Rejection

**RSO Receives Guest List:**
- Email to `rso-notify@geabotswana.org`
- Link to RSO decision page showing:
  - Booking details
  - List of guests
  - Fields for RSO to mark each guest as "Acknowledged" or "Rejected" with reason
  - [Submit] button

**RSO Actions:**
- Can approve (acknowledge) guests as-is
- Can reject individual guests with a specified reason
  - Reason captured in `Guest Lists.rso_rejection_reason` field
- Cannot reject entire booking (that's Board's job); can only reject individual guests

**Member Notification of Rejection:**
- If any guest rejected, send email to requesting member:
  ```
  Subject: Guest Information Update - [BOOKING DETAILS]
  
  Embassy RSO has reviewed your guest list for your [FACILITY] booking on [DATE].
  
  The following guest(s) were flagged and cannot be added:
  - [Guest Name]: [Rejection Reason] (Contact: [RSO Email/Phone])
  
  The remaining [approved_count] guest(s) are approved to attend.
  ```
- Member can attempt to resubmit rejected guests with updated information, or remove them

**Final Guest List for Facility Staff:**
- Once RSO acknowledgment is complete (or confirmed as "no rejection"), generate final guest list for facility staff:
  - Format: `[GUEST_FIRST_NAME] [GUEST_LAST_NAME] [REJECTED - reason]` (if rejected)
  - Format: `[GUEST_FIRST_NAME] [GUEST_LAST_NAME]` (if approved)
  - Available to facility managers via member portal or secure download link

---

## Part 4: Household Member Invite System

**Household Member & Staff Permissions:**
- **Members**: Can make reservations, modify/cancel their household's reservations, submit guest lists, access member portal
- **Household Staff**: Cannot make reservations and do not have member portal access. Staff may attend household events if invited by the household member, but do not need to be named as guests or formal invitees. Staff typically assist with activities like bringing household children to facilities during operating hours (e.g., playground, which is unreserved and walk-up only).

**At Booking Submission:**
- Requesting member sees a list of household member email addresses (all email accounts associated with the household)
- Checkboxes for:
  - Primary email account (e.g., michael@raneyworld.com)
  - Secondary email accounts (e.g., raneymd@yahoo.com)
  - Spouse/partner email(s)
  - Child email(s)
  - Household staff email(s)
- Member selects which email(s) should receive calendar invites
- All selected addresses are added as "invitees" to the Google Calendar event

### 4.2 Add Other Members by Name

**Optional: Invite Other GEA Members:**
- Form field: "Add other GEA members to this event"
- Member can search for other members by name (not by email, for privacy)
- If found, system records:
  - Invited member's name
  - Invited member's primary email address (hidden from UI; used only for sending invite)
- Invited member receives:
  - Google Calendar invite (includes event details, modify/cancel link)
  - Separate email from system:
    ```
    Subject: [HOUSEHOLD_NAME] invited you to their [FACILITY] booking
    
    [HOUSEHOLD_NAME] has invited you to attend their [FACILITY] booking on [DATE] [TIME].
    
    Do you accept or decline?
    [Link to Accept/Decline Page]
    ```

### 4.3 Accept/Decline Page for Invited Members

**Invited Member Receives Link To:**
- Displays booking details
- Shows which email address(es) the member can receive the calendar invite on
- Checkboxes for member to select which email(s) should be added to the calendar event
- **Caveat displayed**: "Note: When you accept this invitation, your selected email address will be visible to the event organizer and other attendees."
- [Accept] and [Decline] buttons

**If Accept:**
- Add selected email(s) to Google Calendar event as invitees
- Send confirmation email to invited member: "Your invitation has been accepted. You'll receive a calendar invite on [selected email address(es)]."
- Send email to original requester: "[Invited Member Name] has accepted your invitation."

**If Decline:**
- Remove from calendar event
- Send email to original requester: "[Invited Member Name] has declined your invitation."

### 4.4 Household Member Permissions

**Any household member can modify/cancel a reservation**, even if their email wasn't included in the original invite:
- Member logs into member portal
- Views their household's reservations
- Clicks a reservation and can:
  - Update guest list (if deadline not passed)
  - Mark guest list as final
  - Cancel the entire reservation
  - Change which household members are invited (need to update calendar event)

---

## Part 5: Waitlist & Excess Booking Protocols

### 5.1 Excess Bookings (Household Exceeds Limits)

**Definition:**
- Member requests a booking that would cause household to exceed the facility's limit
- Example: Household has 2 TC/BC bookings (2 hours). Requests 3rd booking (1.5 hours). Total would be 3.5 hours. Limit is 3 hours. This is "excess."

**Approval Process:**
- Calendar event created with status: `[TENTATIVE - Pending Board Approval]`
- Email to board@geabotswana.org notes: "This is an excess booking; subject to bumping protocols."
- Board reviews and can:
  - [APPROVE] - booking is locked in
  - [DENY] - booking is cancelled; notify member

**Bumping Protocol:**
- Once approved, excess booking can be bumped by:
  - Another member requesting the same time slot (puts excess booking in "waitlist" state)
  - System evaluates which booking has higher priority based on submission timestamp (see 5.2)
- Excess bookings can be bumped until `X` days before event (Config.gs: `EXCESS_BOOKING_BUMP_DEADLINE`)
  - Example: If event is 10 days away and bump deadline is 7 days, bumping is allowed until day 7
  - After deadline passes, excess booking is automatically approved and locked in if not already bumped
- Member notified if excess booking is bumped

### 5.2 Waitlisted Bookings

**Definition:**
- Member requests a time slot that conflicts with an existing approved booking
- System offers to add them to a waitlist for that time slot

**Waitlist Submission:**
- System shows: "This time slot is already booked. Would you like to be added to a waitlist?"
- If yes, system creates calendar event with status: `[WAITLISTED]` and a `waitlist_position` (integer)
- Waitlist position assigned by `submission_timestamp` (first request = position 1, second = position 2, etc.)
- Calendar event appears on calendar with waitlist indicator (color or text)

**Approval Process for Waitlisted Bookings:**
- Board approval required (same as normal booking)
- Email to board@geabotswana.org notes: "This is a waitlisted booking (Position [N]). Approval is provisional and may be cancelled if the primary booking remains."

**Waitlist Cancellation Deadline:**
- Waitlisted bookings can be cancelled until `X` days before event (Config.gs: `WAITLIST_CANCELLATION_DEADLINE`)
- After deadline, waitlist booking is automatically cancelled if the primary booking hasn't been cancelled

**Primary Booking Cancelled → Waitlist Promotion:**
- When an approved event is cancelled by its requester, system:
  - Checks for overlapping waitlisted events
  - Promotes the waitlisted event with the earliest `submission_timestamp`
  - Updates calendar event status: `[WAITLISTED]` → `[APPROVED]`
  - Notifies promoted member: "Your waitlisted booking has been approved and is now confirmed!"
  - If there are multiple waitlisted events, the 2nd-oldest becomes position 1, 3rd becomes position 2, etc.

---

## Part 6: Configuration Variables (Config.gs)

**Calendar & Facility Setup:**
```
RESERVATIONS_CALENDAR_ID = "[Google Calendar ID]"
TC_BC_COLOR = "[Color value]"
LEOBO_COLOR = "[Color value]"
WHOLE_FACILITY_COLOR = "[Color value]"
```

**Household Booking Limits:**
```
TC_BC_HOURS_PER_WEEK = 3
LEOBO_HOURS_PER_MONTH = 6
LEOBO_BOOKINGS_PER_MONTH = 1
WHOLE_FACILITY_HOURS_PER_MONTH = [TBD]
WHOLE_FACILITY_BOOKINGS_PER_MONTH = [TBD]
```

**Guest List Configuration:**
```
GUEST_LIST_SUBMISSION_DAYS_BEFORE = 2  // business days before event
GUEST_LIST_FINAL_CALL_DAYS_BEFORE = 1  // send reminder email this many business days before deadline
```

**Approval Deadlines:**
```
EXCESS_BOOKING_BUMP_DEADLINE_DAYS_BEFORE = 7  // days before event when bumping is no longer allowed
WAITLIST_CANCELLATION_DEADLINE_DAYS_BEFORE = 7  // days before event when waitlist cancellation is no longer allowed
APPROVAL_REMINDER_HOUR_BOTSWANA_TZ = 6  // 6 AM Botswana time daily
```

**Email Configuration:**
```
BOARD_DISTRO_EMAIL = "board@geabotswana.org"
MGT_DISTRO_EMAIL = "mgt-notify@geabotswana.org"
RSO_DISTRO_EMAIL = "rso-notify@geabotswana.org"
```

---

## Part 7: Email Templates Required

**Review Email Templates sheet and verify the following templates exist. If not, create them.**

1. **New Booking Submitted (to Board)**
   - Subject: "New [FACILITY] Booking Request - [HOUSEHOLD_NAME]"
   - Content: Booking details, household usage, approval link

2. **Approval Status Changed (to Member)**
   - Subject: "[FACILITY] Booking - [STATUS]"
   - Content: Current approval stage, what's next, portal link

3. **Approval Reminder (to Approver Distro)**
   - Subject: "Reminder: [FACILITY] Booking Approval Pending - [HOUSEHOLD_NAME]"
   - Content: Original booking details, approval link, friendly tone

4. **Guest List Final Call (to Member)**
   - Subject: "Guest List Deadline Tomorrow - [FACILITY] Booking"
   - Content: Event details, deadline reminder, portal link

5. **Guest List Deadline Passed - No Guests (to Member)**
   - Subject: "Confirm: Guest List Deadline Passed"
   - Content: Confirmation request (see Section 3.3, Case B)

6. **Guest List Deadline Passed - Guests Already Submitted (to Member)**
   - Subject: "Guest List Confirmed"
   - Content: List of guests, RSO next step (see Section 3.3, Case C)

7. **Guest List Submitted to RSO (to RSO)**
   - Subject: "Guest List Acknowledgment Needed - [FACILITY] Booking"
   - Content: Event details, guest list, RSO decision link

8. **Guest Rejected (to Member)**
   - Subject: "Guest Information Update - [FACILITY] Booking"
   - Content: Rejected guest(s), reason(s), RSO contact (see Section 3.5)

9. **Booking Approved - Ready for Event (to Member)**
   - Subject: "[FACILITY] Booking Confirmed"
   - Content: Final event details, guest list confirmation, facility access info

10. **Booking Denied (to Member)**
    - Subject: "[FACILITY] Booking Request - Not Approved"
    - Content: Notification that request was denied, contact info for Board (see Section 8.5)

11. **Booking Cancelled (to Member)**
    - Subject: "[FACILITY] Booking Cancelled"
    - Content: Cancellation confirmation, any refund info (if applicable)

11. **Booking Cancelled (to Member)**
    - Subject: "[FACILITY] Booking Cancelled"
    - Content: Cancellation confirmation, any refund info (if applicable)

12. **Excess Booking Bumped (to Member)**
    - Subject: "[FACILITY] Booking Waitlisted"
    - Content: Another member requested same time; booking moved to waitlist position [N]

13. **Waitlisted Booking Promoted (to Member)**
    - Subject: "Great News! Your Waitlisted [FACILITY] Booking is Now Confirmed"
    - Content: Booking is now approved, event details

14. **Invited Member Invitation Email (from System to Invited Member)**
    - Subject: "[REQUESTER_NAME] invited you to their [FACILITY] booking"
    - Content: Event details, accept/decline link

15. **Invitation Accepted (to Requester)**
    - Subject: "[INVITED_MEMBER_NAME] accepted your invitation"
    - Content: Brief confirmation

16. **Invitation Declined (to Requester)**
    - Subject: "[INVITED_MEMBER_NAME] declined your invitation"
    - Content: Brief notification

---

## Part 8: Data Integrity & Business Rules

### 8.1 Double-Booking Prevention

- Before creating any calendar event, query the RESERVATIONS_CALENDAR_ID:
  - Search for existing `[APPROVED]` events on the requested date
  - Check for time overlaps (including :15, :30, :45 boundaries)
  - Reject if overlap exists with same facility
  - Reject if Whole Facility booking exists (blocks both TC/BC and Leobo)
  - Reject if TC/BC booking exists and member requests Whole Facility
  - Reject if Leobo booking exists and member requests Whole Facility

### 8.2 Household Limit Enforcement

- Query the RESERVATIONS_CALENDAR_ID for all `[APPROVED]` events in the relevant period (week for TC/BC, month for Leobo) matching the household
- Sum the hours already booked
- If new booking + existing hours > limit, mark as "Excess"

### 8.5 Denial & Cancellation Workflow

**When Board or Mgmt denies a booking:**
1. Update calendar event status to `[DENIED]` (do not delete immediately)
2. Update Reservations sheet: `approval_status = "Denied"`, `denial_timestamp` = now, `denying_authority` = "Board" or "Mgmt"
3. Send email to requesting member:
   ```
   Subject: [FACILITY] Booking Request - Not Approved
   
   Your request for a [FACILITY] booking on [DATE] [TIME] has not been approved.
   
   If you believe this is an error or would like to discuss, please contact [Board email].
   
   You may submit a new request for a different time if desired.
   ```
4. Delete the calendar event (after status is recorded in Sheets)
5. The Reservations sheet row retains the full audit trail: household, requester, facility, requested time, denial authority, timestamp

**When a member cancels a booking:**
1. Set calendar event status to `[CANCELLED]`
2. Update Reservations sheet: `approval_status = "Cancelled"`, `cancellation_timestamp` = now
3. Check for waitlisted events overlapping this time slot
4. If waitlist exists, promote the earliest-submitted waitlisted event (see 5.2)
5. Send cancellation confirmation email to requesting member
6. If guest list was submitted, notify RSO of cancellation
7. Do not delete the calendar event; keep it for audit trail visibility

### 8.4 Modification Rules

When a member modifies a booking (changes time, date, facility type, or duration):
- Treat as a cancellation of the original booking + a new request for the modified booking
- Original booking is marked `[CANCELLED]` in the calendar and Reservations sheet
- New booking proceeds through full approval workflow (with reset deadlines)
- Member receives email confirming cancellation of original and initiation of new request
- Guest list information carries over to the new booking, but deadline recalculates based on new event date
- If only adding members to the invite list or updating guest list (without changing time/date/facility), no re-approval needed

---

## Part 9: Member Portal Views

**Member should see:**
1. **My Reservations** - List of all household reservations (past and upcoming)
   - Status badge (Pending Board, Pending Mgmt, Approved, Waitlisted, Cancelled, Expired)
   - Date, time, facility, guest count
   - [Modify], [Cancel], [Add Guests], [Mark Guest List Final] buttons (with appropriate visibility based on approval status and deadlines)

2. **Pending Approvals** - Current status of each booking in approval chain
   - "Waiting for Board approval" / "Waiting for Mgmt approval" / "Waiting for Guest List"
   - Timeline of approvals received so far

3. **Guest Lists** - For each reservation with guests expected
   - Current guest entries
   - Deadline for submission
   - [Add Guests], [Remove Guest], [Mark as Final] buttons

---

## Part 10: Admin Portal Views

**Admin (Board) should see:**
1. **Pending Approvals** - Reservations awaiting Board action
   - Filter: Regular, Excess, Leobo (post-Mgmt), Whole Facility (post-Mgmt), Waitlisted
   - Household usage statistics
   - [Approve], [Deny] buttons

2. **Waitlist Management** - All waitlisted bookings
   - Position in waitlist
   - Blocking event status
   - Automatic cancellation countdown

3. **Excess Booking Management** - All excess bookings awaiting approval or bump window
   - Bump deadline countdown
   - Link to approve now

4. **All Reservations Calendar** - Full calendar view with color coding
   - Filter by facility type, household, status
   - See overlaps and conflicts

---

## Part 10b: Reservations Sheet Schema

### Existing Columns (✅ Already present in GEA_Reservations.xlsx)
- `reservation_id` - Unique identifier
- `household_id` - Link to Households
- `submitted_by_individual_id` - Individual who made the request
- `submitted_by_email` - Email address used for submission
- `submission_timestamp` - ISO 8601 datetime
- `facility` - Facility type (TC/BC, Leobo, Whole Facility)
- `reservation_date` - Date of the reservation
- `start_time` - Start time (HH:MM format)
- `end_time` - End time (HH:MM format)
- `duration_hours` - Calculated field
- `event_name` - Optional event name provided by member
- `guest_count` - Expected number of non-member guests (0 if none)
- `guest_list_submitted` - Boolean; whether guest list has been submitted
- `guest_list_deadline` - ISO 8601 datetime for guest list deadline
- `status` - Current approval/booking status (see below for valid values)
- `board_approval_required` - Boolean
- `board_approved_by` - Email of board member who approved
- `board_approval_timestamp` - ISO 8601 datetime
- `board_denial_reason` - Text field if denied
- `rso_notified_timestamp` - When RSO was sent guest list
- `calendar_event_id` - Google Calendar event ID
- `cancelled_by` - Email of person who cancelled
- `cancellation_timestamp` - ISO 8601 datetime
- `cancellation_reason` - Text field
- `notes` - General notes field
- `is_excess_reservation` - Boolean; marks excess bookings
- `bump_window_deadline` - ISO 8601 datetime; deadline for bumping excess/waitlist
- `bumped_by_household_id` - If this reservation bumped another
- `bumped_date` - When the bumping occurred

### Columns to Add for Phase 2.2

**Required additions:**

1. `mgmt_approval_required` (Boolean) - True if facility is Leobo or Whole Facility
2. `mgmt_approved_by` (Text) - Email of mgmt approver
3. `mgmt_approval_timestamp` (DateTime) - When mgmt approved
4. `mgmt_denial_reason` (Text) - If mgmt denied the request
5. `approval_status` (Text) - Detailed status enum:
   - "Pending Mgmt Approval" (for Leobo/Whole Facility)
   - "Pending Board Approval"
   - "Pending Guest List"
   - "Approved"
   - "Denied"
   - "Cancelled"
   - "Waitlisted"
   - "Expired" (for excess/waitlist items that aged out)
6. `booking_status` (Text) - "Regular" | "Excess" | "Waitlisted"
7. `waitlist_position` (Integer) - Position in waitlist queue (1, 2, 3, etc.)
8. `denying_authority` (Text) - "Board" | "Mgmt" | null
9. `denial_timestamp` (DateTime) - When denial occurred
10. `previous_whole_facility_requests` (Text) - Pipe-delimited list of previous Whole Facility bookings for this household (info field, not state)

**Optional but recommended:**
11. `rso_acknowledgment_deadline` (DateTime) - When RSO must respond
12. `rso_acknowledged_by` (Text) - Email of RSO who acknowledged
13. `rso_acknowledgment_timestamp` (DateTime) - When RSO acknowledged
14. `modification_original_reservation_id` (Text) - If this is a modification, links to the original

### Guest Lists Sheet Schema

**Existing columns:**
- `guest_id` - Unique identifier
- `reservation_id` - Link to Reservations
- `guest_category` - Vendor? Visitor? Family? (clarify)
- `guest_name` - First and last name combined (or separate?)
- `age_category` - Age bracket (Adult, Child, etc.)
- `vendor` - Boolean or text?
- `vendor_company` - Company name if vendor
- `submission_timestamp` - ISO 8601 datetime

**Columns to add for Phase 2.2:**
1. `guest_first_name` (Text) - First name
2. `guest_last_name` (Text) - Last name
3. `guest_dob` (Date) - Date of birth (for RSO clearance)
4. `relationship_to_household` (Text) - Optional; for RSO reference
5. `rso_status` (Text) - "Submitted" | "Acknowledged" | "Rejected"
6. `rso_rejection_reason` (Text) - Reason if rejected
7. `rso_reviewed_by` (Text) - Email of RSO reviewer
8. `rso_review_timestamp` (DateTime) - When RSO reviewed

---

## Prep Tasks (Complete Before Relevant Phases)

**PREP-1: Photo Editing** ✅ Complete
- **What**: Edit board member photos to consistent dimensions/style for index.html and GCS storage
- **Timeline**: Before Phase 2.1
- **Owner**: You (outside Claude Code session)
- **Status**: Photos are ready to go

**PREP-2: Reservations Sheet Schema Setup** (Before Phase 2.2)
- **What**: Add the following columns to the `Reservations` tab in GEA_Reservations.xlsx (can be added in Sheets UI or via Claude Code):
  - `mgmt_approval_required` (Boolean)
  - `mgmt_approved_by` (Text)
  - `mgmt_approval_timestamp` (DateTime)
  - `mgmt_denial_reason` (Text)
  - `approval_status` (Text)
  - `booking_status` (Text)
  - `waitlist_position` (Integer)
  - `denying_authority` (Text)
  - `denial_timestamp` (DateTime)
  - `previous_whole_facility_requests` (Text)
  - (Optional) `rso_acknowledgment_deadline`, `rso_acknowledged_by`, `rso_acknowledgment_timestamp`, `modification_original_reservation_id`
- **Timeline**: Before Phase 2.2
- **Owner**: You (can add manually or Claude Code can script it)
- **Deliverable**: Updated GEA_Reservations.xlsx with all new columns labeled and positioned logically

**PREP-3: Guest Lists Sheet Schema Update** (Before Phase 2.2)
- **What**: Clarify and add columns to `Guest Lists` tab:
  - Clarify existing columns: `guest_category`, `guest_name` (split to first/last?), `vendor` usage
  - Add: `guest_first_name`, `guest_last_name`, `guest_dob`, `relationship_to_household`, `rso_status`, `rso_rejection_reason`, `rso_reviewed_by`, `rso_review_timestamp`
- **Timeline**: Before Phase 2.2
- **Owner**: You (can add manually or Claude Code can script it)
- **Deliverable**: Updated Guest Lists sheet with clarified/new columns

**PREP-4: Config.gs Constants Definition** (Before Phase 2.2)
- **What**: Add the following configuration variables to Config.gs:
  ```
  // Calendar & Facility Setup
  RESERVATIONS_CALENDAR_ID = "[existing calendar ID]"
  TC_BC_COLOR = "[color code - e.g., '#0B8043' for green]"
  LEOBO_COLOR = "[color code - e.g., '#E67C73' for orange]"
  WHOLE_FACILITY_COLOR = "[color code - e.g., '#5B7C99' for blue]"
  
  // Household Booking Limits
  TC_BC_HOURS_PER_WEEK = 3
  LEOBO_HOURS_PER_MONTH = 6
  LEOBO_BOOKINGS_PER_MONTH = 1
  WHOLE_FACILITY_HOURS_PER_MONTH = [TBD if applicable]
  WHOLE_FACILITY_BOOKINGS_PER_MONTH = [TBD if applicable]
  
  // Guest List Configuration
  GUEST_LIST_SUBMISSION_DAYS_BEFORE = 2  // business days
  GUEST_LIST_FINAL_CALL_DAYS_BEFORE = 1  // business days before deadline
  
  // Approval Deadlines
  EXCESS_BOOKING_BUMP_DEADLINE_DAYS_BEFORE = 7
  WAITLIST_CANCELLATION_DEADLINE_DAYS_BEFORE = 7
  APPROVAL_REMINDER_HOUR_BOTSWANA_TZ = 6  // 6 AM
  
  // Email Configuration
  BOARD_DISTRO_EMAIL = "board@geabotswana.org"
  MGT_DISTRO_EMAIL = "mgt-notify@geabotswana.org"
  RSO_DISTRO_EMAIL = "rso-notify@geabotswana.org"
  ```
- **Timeline**: Before Phase 2.2
- **Owner**: You (reviewing and finalizing constants)
- **Deliverable**: Updated Config.gs with all constants defined and commented

**PREP-5: Approval Workflow Policy Confirmation** (Before Phase 2.2)
- **What**: Ensure clarity on:
  - Whole Facility booking limits (if any different from unlimited)
  - Approval escalation paths if MGT or Board doesn't respond within X days
  - Who are the 3 board members for the distro list
  - Who are the managers for the mgt-notify distro
  - Who are the RSO officers for rso-notify distro
- **Timeline**: Before Phase 2.2
- **Owner**: You + GEA Board
- **Deliverable**: Email list confirmations

---

## Part 11: Future Enhancements (Not in Scope for Phase 2.2)

- Facility availability heatmaps
- Member communication history/notes for each reservation
- Integration with facility access system
- Photo/ID verification for guests
- Household staff approval of child attendees
- Refund/credit system for cancelled bookings
- Seasonal facility closures

---

## Appendix A: Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-23 | Michael Raney | Initial draft; comprehensive walkthrough |

