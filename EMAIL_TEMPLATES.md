# GEA Email Templates

Complete inventory of all 32 email templates used by the GEA system. Stored in Email Templates tab of GEA System Backend spreadsheet. Used by EmailService.js::sendEmail(templateId, recipient, variables).

---

## Membership Application Workflow (tpl_001 — tpl_003)

### tpl_001 - Application Received
**Purpose:** Confirm membership application submitted
**To:** Applicant
**Subject:** GEA Membership Application Received - {{FULL_NAME}}
**Key Content:**
- Welcome message
- Application summary (name, membership type, household type)
- Family members list (if family)
- Temporary duration (if temporary)
- Next steps
- Sponsor verification note (if non-full)

**Variables Used:** FIRST_NAME, FULL_NAME, MEMBERSHIP_LEVEL, HOUSEHOLD_TYPE, IF_FAMILY, FAMILY_MEMBERS_LIST, IF_TEMPORARY, DURATION_MONTHS, DUES_AMOUNT, IF_NON_FULL, SPONSOR_NAME

---

### tpl_002 - Application Approved
**Purpose:** Welcome newly approved member, provide payment instructions
**To:** Applicant
**Subject:** Welcome to the GEA - Membership Approved!
**Key Content:**
- Congratulations message
- Membership details
- Dues amount (USD & BWP)
- Temporary duration & expiration (if applicable)
- Payment instructions with 3 options:
  - SDFCU Bank Transfer (USD)
  - PayPal or Zelle
  - ABSA Bank Transfer (BWP)
- Next steps (payment, photo upload, card download)

**Variables Used:** FIRST_NAME, FULL_NAME, MEMBERSHIP_LEVEL, HOUSEHOLD_TYPE, DUES_USD, DUES_BWP, IF_TEMPORARY, DURATION_MONTHS, EXPIRATION_DATE

---

### tpl_003 - Application Denied
**Purpose:** Inform applicant of denial decision
**To:** Applicant
**Subject:** GEA Membership Application - Update
**Key Content:**
- Thank you message
- Denial notice
- Reason for denial
- Appeal option

**Variables Used:** FIRST_NAME, DENIAL_REASON

---

## Membership Renewal & Expiration (tpl_004 — tpl_006)

### tpl_004 - Renewal Reminder 30 Days
**Purpose:** 30-day advance notice before membership expires
**To:** Member
**Subject:** GEA Membership Renewal Due - {{EXPIRATION_DATE}}
**Key Content:**
- Friendly reminder (30 days to expiration)
- Current membership info
- Renewal amount (USD & BWP)
- Renewal instructions
- Warning about facility access loss if lapsed

**Variables Used:** FIRST_NAME, FULL_NAME, MEMBERSHIP_LEVEL, EXPIRATION_DATE, DUES_USD, DUES_BWP

---

### tpl_005 - Renewal Reminder 7 Days
**Purpose:** Urgent 7-day notice before membership expires
**To:** Member
**Subject:** URGENT: GEA Membership Expires in 7 Days
**Key Content:**
- Urgent tone (7 days to expiration)
- Renewal amount (USD & BWP)
- Immediate action required message

**Variables Used:** FIRST_NAME, EXPIRATION_DATE, DUES_USD, DUES_BWP

---

### tpl_006 - Membership Expired
**Purpose:** Notify member of expired membership and suspension
**To:** Member
**Subject:** GEA Membership Has Expired
**Key Content:**
- Expiration notification
- Facility access suspension
- Renewal amount (USD & BWP)
- Renewal instructions
- Departure option

**Variables Used:** FIRST_NAME, EXPIRATION_DATE, DUES_USD, DUES_BWP

---

## Reservation Workflow (tpl_007 — tpl_013)

### tpl_007 - Reservation Confirmed Auto
**Purpose:** Auto-approved reservation confirmation
**To:** Member
**Subject:** GEA Reservation Confirmed - {{FACILITY}} on {{RESERVATION_DATE}}
**Key Content:**
- Confirmation message
- Reservation details (facility, date, time, event name, confirmation ID)
- Guest list deadline reminder (if guests)
- RSO submission note
- Facility reminders (no fundraising, setup/cleanup)

**Variables Used:** FIRST_NAME, FACILITY, RESERVATION_DATE, START_TIME, END_TIME, EVENT_NAME, RESERVATION_ID, IF_GUESTS, GUEST_LIST_DEADLINE

---

### tpl_008 - Reservation Pending Review
**Purpose:** Pending board/management approval notification
**To:** Member
**Subject:** GEA Reservation Request Received - Pending Approval
**Key Content:**
- Reservation acknowledgment
- Reason for pending (approval reason)
- Reservation details
- Approval timeline (1 business day for Leobo)
- Guest list requirement note

**Variables Used:** FIRST_NAME, FACILITY, RESERVATION_DATE, START_TIME, END_TIME, EVENT_NAME, RESERVATION_ID, APPROVAL_REASON, IF_LEOBO, IF_GUESTS, GUEST_LIST_DEADLINE

---

### tpl_009 - Board Approval Request
**Purpose:** Board review request for excess/pending reservations
**To:** GEA Board
**Subject:** [ACTION REQUIRED] Reservation Approval Needed - {{MEMBER_NAME}} - {{RESERVATION_DATE}}
**Key Content:**
- Action request header
- Reservation details
- Member contact info
- Guest information and list link
- Other events on same date
- Household membership & usage status
- Approve/Deny links
- 24-hour escalation warning

**Variables Used:** MEMBER_NAME, MEMBER_EMAIL, MEMBER_PHONE, FACILITY, RESERVATION_DATE, START_TIME, END_TIME, EVENT_NAME, SUBMISSION_TIMESTAMP, IF_GUESTS, GUEST_COUNT, GUEST_LIST_LINK, OTHER_EVENTS_LIST, MEMBERSHIP_LEVEL, MEMBERSHIP_STATUS, LEOBO_USAGE, LEOBO_MONTHLY_LIMIT, APPROVE_LINK, DENY_LINK

---

### tpl_010 - Reservation Approved
**Purpose:** Board-approved reservation confirmation
**To:** Member
**Subject:** GEA Reservation Approved - {{FACILITY}} on {{RESERVATION_DATE}}
**Key Content:**
- Approval message
- Reservation details (facility, date, time, event, approval status, approver, confirmation ID)
- Guest list status (if applicable)
- Facility reminders

**Variables Used:** FIRST_NAME, FACILITY, RESERVATION_DATE, START_TIME, END_TIME, EVENT_NAME, RESERVATION_ID, APPROVED_BY, IF_GUESTS, IF_GUEST_LIST_SUBMITTED, IF_GUEST_LIST_PENDING, GUEST_LIST_DEADLINE

---

### tpl_011 - Reservation Denied
**Purpose:** Board rejection of reservation request
**To:** Member
**Subject:** GEA Reservation Request - Update
**Key Content:**
- Rejection message
- Reservation details
- Denial reason
- Hold release notice
- Rescheduling option

**Variables Used:** FIRST_NAME, FACILITY, RESERVATION_DATE, START_TIME, END_TIME, EVENT_NAME, DENIAL_REASON

---

### tpl_012 - Reservation Cancelled
**Purpose:** Reservation cancellation notification
**To:** Member
**Subject:** GEA Reservation Cancelled - {{FACILITY}} on {{RESERVATION_DATE}}
**Key Content:**
- Cancellation notice
- Cancelled reservation details
- Canceller info (member or board)
- Cancellation reason (if provided)
- Apology (if board cancelled)
- Rebooking option (if waitlist)

**Variables Used:** FIRST_NAME, FACILITY, RESERVATION_DATE, START_TIME, END_TIME, EVENT_NAME, CANCELLED_BY, IF_REASON, CANCELLATION_REASON, IF_BOARD_CANCELLED, IF_WAITLIST

---

### tpl_013 - Guest List Deadline Reminder
**Purpose:** Reminder to submit guest list before deadline
**To:** Member
**Subject:** REMINDER: Guest List Due {{GUEST_LIST_DEADLINE}} - {{EVENT_NAME}}
**Key Content:**
- Deadline reminder
- Reservation details
- Guest list status
- 4 business day requirement warning
- Cancellation threat if missed

**Variables Used:** FIRST_NAME, GUEST_LIST_DEADLINE, FACILITY, RESERVATION_DATE, START_TIME, END_TIME, EVENT_NAME

---

### tpl_014 - RSO Daily Summary
**Purpose:** Daily summary of reservations for RSO security officer
**To:** RSO (Regional Security Officer)
**Subject:** GEA Daily Reservation Summary - {{TODAY_DATE}}
**Key Content:**
- Daily automated summary
- List of all reservations for the day
- Conditional message if no reservations
- Attendee count summary (members, guests, vendors)

**Variables Used:** TODAY_DATE, IF_NO_RESERVATIONS, RESERVATIONS_BLOCK, TOTAL_RESERVATIONS, TOTAL_MEMBERS, TOTAL_GUESTS, TOTAL_VENDORS

---

## Document Expiration & Photo Management (tpl_015 — tpl_018)

### tpl_015 - Passport Expiration Warning
**Purpose:** 6-month advance notice of document expiration
**To:** Member
**Subject:** Courtesy Reminder: Your {{DOCUMENT_TYPE}} Expires Soon
**Key Content:**
- Courtesy notification
- Document details (type, number, expiration date)
- Planning advice
- Update instructions
- Membership remains valid message

**Variables Used:** FIRST_NAME, DOCUMENT_TYPE, DOCUMENT_EXPIRATION_DATE, DOCUMENT_NUMBER

---

### tpl_016 - Photo Submission Reminder
**Purpose:** Reminder to upload membership photo
**To:** Member
**Subject:** Action Required: Upload Your GEA Membership Photo
**Key Content:**
- Action required message
- Why photo needed (card, security, RSO directory)
- Photo requirements (passport-style, recent, JPG/PNG, 2MB max)
- Upload instructions
- Family member list (if household members missing photos)

**Variables Used:** FIRST_NAME, IF_FAMILY_MISSING_PHOTOS, MISSING_PHOTOS_LIST

---

### tpl_017 - Photo Approved
**Purpose:** Photo approval confirmation
**To:** Member
**Subject:** GEA Membership Photo Approved
**Key Content:**
- Approval message
- Card availability notice
- Card usage instructions (show to guards)

**Variables Used:** FIRST_NAME

---

### tpl_018 - Photo Rejected
**Purpose:** Photo rejection with reason and resubmission request
**To:** Member
**Subject:** GEA Membership Photo - Resubmission Required
**Key Content:**
- Rejection message
- Rejection reason
- Photo requirements (detailed)
- Resubmission instructions

**Variables Used:** FIRST_NAME, REJECTION_REASON

---

## Management Approval Requests (tpl_019)

### tpl_019 - MGT Approval Request
**Purpose:** Management Officer approval request for Leobo reservations
**To:** Management Officer
**Subject:** [ACTION REQUIRED] Leobo Reservation Approval - {{MEMBER_NAME}} - {{RESERVATION_DATE}}
**Key Content:**
- Action request header
- Reservation details
- Member contact & household info
- Expected guest count
- Other events on same date
- Membership & household status
- Approve/Deny links
- RSO notification note

**Variables Used:** MEMBER_NAME, MEMBER_EMAIL, MEMBER_PHONE, FACILITY, RESERVATION_DATE, START_TIME, END_TIME, EVENT_NAME, SUBMISSION_TIMESTAMP, IF_GUESTS, GUEST_COUNT, GUEST_LIST_STATUS, OTHER_EVENTS_LIST, MEMBERSHIP_LEVEL, MEMBERSHIP_STATUS, HOUSEHOLD_NAME, APPROVE_LINK, DENY_LINK

---

## Waitlist & Availability (tpl_020)

### tpl_020 - Waitlist Slot Opened
**Purpose:** Notify member of available waitlisted slot
**To:** Member
**Subject:** GEA Facility Now Available - {{FACILITY}} on {{RESERVATION_DATE}}
**Key Content:**
- Good news message
- Available slot details (facility, date, time)
- First-come notice
- Booking link
- Hold duration note

**Variables Used:** FIRST_NAME, FACILITY, RESERVATION_DATE, START_TIME, END_TIME, WAITLIST_HOLD_HOURS

---

## Member Portal & Account (tpl_021 — tpl_024)

### tpl_021 - First Login Welcome
**Purpose:** Welcome message for first-time member portal access
**To:** Member
**Subject:** Welcome to the GEA Member Portal!
**Key Content:**
- Welcome message
- Portal URL
- Features list (view membership, make reservations, etc.)
- Getting started action items (photo upload, household review, etc.)
- Membership details (type, status, expiration)
- Card availability
- Support contact

**Variables Used:** FIRST_NAME, MEMBERSHIP_LEVEL, EXPIRATION_DATE, IF_FAMILY, FAMILY_MEMBERS_LIST

---

### tpl_022 - Birthday Greeting
**Purpose:** Birthday greeting to member
**To:** Member
**Subject:** Happy Birthday from the GEA!
**Key Content:**
- Birthday greeting
- Invitation to celebrate at facilities

**Variables Used:** FIRST_NAME

---

### tpl_023 - Birthday Age 15 Milestone
**Purpose:** Notify of age 15 milestone access privileges
**To:** Member & Parent
**Subject:** Happy Birthday {{FIRST_NAME}} - New GEA Access Privileges!
**Key Content:**
- Birthday greeting
- Age 15 milestone notification
- New access privileges (unaccompanied facility access, fitness center, independent reservations)
- Portal login setup instruction
- Email requirement note

**Variables Used:** FIRST_NAME, PARENT_NAME, IF_NO_EMAIL

---

### tpl_024 - Birthday Age 16 Milestone
**Purpose:** Notify of age 16 milestone voting & office eligibility
**To:** Member
**Subject:** Happy Birthday {{FIRST_NAME}} - You Can Now Vote!
**Key Content:**
- Birthday greeting
- Age 16 milestone notification
- Full membership privileges (voting, board positions)
- Community participation message

**Variables Used:** FIRST_NAME

---

## Payment Workflow (tpl_025 — tpl_026)

### tpl_025 - Payment Confirmation Received
**Purpose:** Board notification of member payment submission
**To:** GEA Board
**Subject:** Payment Confirmation Submitted - {{MEMBER_NAME}}
**Key Content:**
- Submission notification
- Payment details (member, membership level, amount, method, reference, date)
- Receipt link (if provided)
- Member notes (if provided)
- Action items (verify receipt, confirm in system)
- Confirm/Not Found links
- Admin portal access

**Variables Used:** MEMBER_NAME, MEMBER_EMAIL, MEMBERSHIP_LEVEL, DUES_USD, DUES_BWP, PAYMENT_METHOD, PAYMENT_REFERENCE, PAYMENT_DATE, IF_RECEIPT, RECEIPT_LINK, IF_NOTES, PAYMENT_NOTES, CONFIRM_LINK, NOT_FOUND_LINK

---

### tpl_026 - Payment Verified
**Purpose:** Member confirmation of payment verification and membership activation
**To:** Member
**Subject:** GEA Payment Confirmed - Membership Active!
**Key Content:**
- Confirmation message
- Payment details (amount, method, reference, confirmation date)
- Membership status (type, status, expiration date)
- Portal activation
- First-time action items (upload photo, explore calendar, download card)

**Variables Used:** FIRST_NAME, DUES_USD, DUES_BWP, PAYMENT_METHOD, PAYMENT_REFERENCE, CONFIRMATION_DATE, MEMBERSHIP_LEVEL, EXPIRATION_DATE, IF_NEW_MEMBER, IF_FAMILY

---

## Administrative Tasks (tpl_027 — tpl_032)

### tpl_027 - Holiday Calendar Reminder
**Purpose:** Annual reminder to update holiday calendar
**To:** GEA Board
**Subject:** ACTION NEEDED: Update GEA Holiday Calendar for {{NEXT_YEAR}}
**Key Content:**
- Annual reminder
- Why calendar matters (deadline calculations, business day logic)
- Action steps (obtain list, generate dates, confirm, add holidays)
- Botswana holiday note
- Timeline/deadline (before Jan 1)

**Variables Used:** NEXT_YEAR, CURRENT_YEAR

---

### tpl_028 - Tennis Limit Reached
**Purpose:** Notify member that weekly tennis limit reached
**To:** Member
**Subject:** GEA Tennis Court - Weekly Booking Limit Reached
**Key Content:**
- Limit notification (3 hours/week)
- Current usage details
- Excess booking process (waitlist, board approval, tentative status)
- Bumping rules (1 day window)
- Fair access message
- Reset timing (Monday)

**Variables Used:** FIRST_NAME, WEEK_START, WEEK_END, HOURS_USED, TENNIS_WEEKLY_LIMIT_HOURS, WEEKLY_BOOKINGS_LIST, TENNIS_BUMP_WINDOW_DAYS

---

### tpl_029 - Leobo Limit Reached
**Purpose:** Notify member that monthly Leobo limit reached
**To:** Member
**Subject:** GEA Leobo - Monthly Booking Limit Reached
**Key Content:**
- Limit notification (1 reservation/month)
- Current usage details (reservations, hours)
- Excess booking process (management approval, tentative status)
- Bumping rules (5 business days)
- Priority rebooking (next month)
- Reset timing (1st of month)

**Variables Used:** FIRST_NAME, CURRENT_MONTH, LEOBO_USAGE, LEOBO_MONTHLY_LIMIT, HOURS_USED, LEOBO_MAX_HOURS, MONTHLY_BOOKINGS_LIST, LEOBO_BUMP_WINDOW_DAYS

---

### tpl_030 - Excess Tennis Approval Request
**Purpose:** Board approval request for excess tennis reservations
**To:** GEA Board
**Subject:** [ACTION REQUIRED] Excess Tennis Booking Approval - {{MEMBER_NAME}}
**Key Content:**
- Warning header (hours already used this week)
- Existing bookings list
- New reservation request details
- Guest information (if applicable)
- Other events on date
- Approval options (tentative status, bumping rules)
- Deadline info

**Variables Used:** MEMBER_NAME, MEMBER_EMAIL, HOURS_USED, TENNIS_WEEKLY_LIMIT_HOURS, EXISTING_BOOKINGS_LIST, RESERVATION_DATE, START_TIME, END_TIME, DURATION_HOURS, EVENT_NAME, IF_GUESTS, GUEST_COUNT, GUEST_LIST_LINK, OTHER_EVENTS_LIST, APPROVE_LINK, DENY_LINK, BUMP_DEADLINE, TENNIS_BUMP_WINDOW_DAYS

---

### tpl_031 - Excess Leobo Approval Request
**Purpose:** Management Officer approval request for excess Leobo reservations
**To:** Management Officer
**Subject:** [ACTION REQUIRED] Excess Leobo Booking Approval - {{MEMBER_NAME}}
**Key Content:**
- Warning header (reservations & hours already used this month)
- Existing bookings list
- New reservation request details
- Guest information (if applicable)
- Other events on date
- Member & household status
- Approval options (tentative status, bumping rules, business days)
- RSO notification note

**Variables Used:** MEMBER_NAME, MEMBER_EMAIL, MEMBER_PHONE, LEOBO_USAGE, LEOBO_MONTHLY_LIMIT, HOURS_USED, LEOBO_MAX_HOURS, EXISTING_BOOKINGS_LIST, FACILITY, RESERVATION_DATE, START_TIME, END_TIME, DURATION_HOURS, EVENT_NAME, IF_GUESTS, GUEST_COUNT, GUEST_LIST_LINK, OTHER_EVENTS_LIST, MEMBERSHIP_LEVEL, MEMBERSHIP_STATUS, HOUSEHOLD_NAME, APPROVE_LINK, DENY_LINK, BUMP_DEADLINE, LEOBO_BUMP_WINDOW_DAYS

---

### tpl_032 - Member Password Set
**Purpose:** Confirm portal account activation and password setting
**To:** Member
**Subject:** GEA Member Portal - Password Set
**Key Content:**
- Account activation confirmation
- Email address
- Password requirements (12+ chars, mixed case, symbols)
- How to log in
- Password security warning
- Forgotten password option
- Support contact

**Variables Used:** FIRST_NAME, EMAIL

---

## Template Variables Reference

### Common Variables
- `{{FIRST_NAME}}` - Member first name
- `{{FULL_NAME}}` - Member full name
- `{{EMAIL}}` - Member email address

### Membership Variables
- `{{MEMBERSHIP_LEVEL}}` - Membership type name
- `{{HOUSEHOLD_TYPE}}` - Individual or Family
- `{{DUES_USD}}` - Annual dues in USD
- `{{DUES_BWP}}` - Annual dues in BWP
- `{{EXPIRATION_DATE}}` - Membership expiration date

### Document Variables
- `{{DOCUMENT_TYPE}}` - Passport, Omang, etc.
- `{{DOCUMENT_NUMBER}}` - ID number
- `{{DOCUMENT_EXPIRATION_DATE}}` - Expiration date

### Reservation Variables
- `{{FACILITY}}` - Tennis Court, Leobo, Whole Facility
- `{{RESERVATION_DATE}}` - Date of reservation
- `{{START_TIME}}` - Start time (HH:MM format)
- `{{END_TIME}}` - End time (HH:MM format)
- `{{EVENT_NAME}}` - Name/description of event
- `{{RESERVATION_ID}}` - Reservation confirmation ID
- `{{GUEST_LIST_DEADLINE}}` - Deadline for guest list submission
- `{{GUEST_COUNT}}` - Number of guests

### Administrative Variables
- `{{MEMBER_NAME}}` - Full name of member
- `{{MEMBER_EMAIL}}` - Member email
- `{{MEMBER_PHONE}}` - Member phone number
- `{{HOUSEHOLD_NAME}}` - Household name
- `{{APPROVED_BY}}` - Name of approver
- `{{CANCELLED_BY}}` - Name of person who cancelled
- `{{REJECTION_REASON}}` - Reason for rejection/denial
- `{{DENIAL_REASON}}` - Reason for denial

### Conditional Blocks
- `{{IF_FAMILY}}...{{END_IF}}` - Shown only for family memberships
- `{{IF_TEMPORARY}}...{{END_IF}}` - Shown only for temporary memberships
- `{{IF_NON_FULL}}...{{END_IF}}` - Shown only for non-full members
- `{{IF_GUESTS}}...{{END_IF}}` - Shown only if guests are involved
- `{{IF_NEW_MEMBER}}...{{END_IF}}` - Shown for new members only
- `{{IF_LEOBO}}...{{END_IF}}` - Leobo-specific content
- `{{IF_REASON}}...{{END_IF}}` - Shown if reason provided
- `{{IF_BOARD_CANCELLED}}...{{END_IF}}` - If board cancelled
- `{{IF_WAITLIST}}...{{END_IF}}` - If on waitlist
- `{{IF_GUEST_LIST_SUBMITTED}}...{{END_IF}}` - If guest list submitted
- `{{IF_GUEST_LIST_PENDING}}...{{END_IF}}` - If guest list pending
- `{{IF_NO_RESERVATIONS}}...{{END_IF}}` - If no reservations for day
- `{{IF_NO_EMAIL}}...{{END_IF}}` - If no email on file
- `{{IF_FAMILY_MISSING_PHOTOS}}...{{END_IF}}` - If household members missing photos
- `{{IF_RECEIPT}}...{{END_IF}}` - If receipt provided

### List Variables
- `{{FAMILY_MEMBERS_LIST}}` - Formatted list of family members
- `{{MISSING_PHOTOS_LIST}}` - List of members needing photos
- `{{WEEKLY_BOOKINGS_LIST}}` - List of tennis bookings this week
- `{{MONTHLY_BOOKINGS_LIST}}` - List of Leobo bookings this month
- `{{OTHER_EVENTS_LIST}}` - Other events on the date
- `{{EXISTING_BOOKINGS_LIST}}` - Existing reservations
- `{{RESERVATIONS_BLOCK}}` - Formatted block of all reservations

---

## Usage Notes

- All templates are active (active = TRUE)
- Templates are fetched and cached by EmailService.js during execution
- Email is sent from "Gaborone Employee Association" with reply-to: board@geabotswana.org
- All templates include GEA footer with website and contact info
- HTML wrapping applied automatically (logo, styling, footer)
- Placeholders replaced before sending
- Conditional blocks evaluated based on variables

**Last Updated:** February 2026
**Total Templates:** 32
