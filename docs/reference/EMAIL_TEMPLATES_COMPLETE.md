# GEA Email Templates - Complete Reference

**Current as of:** March 6, 2026
**Total Templates:** 56 active + 3 inactive (tpl_001-tpl_032, tpl_040-tpl_056)
**Status:** tpl_001-tpl_003 set to Active=FALSE (replaced by tpl_040-tpl_052)

---

## Overview

All system emails are stored in the **Email Templates** sheet of the **GEA System Backend** spreadsheet. Each template has:
- **template_id**: Unique identifier (tpl_XXX)
- **template_name**: Human-readable name
- **subject**: Email subject with {{PLACEHOLDERS}}
- **body**: Email HTML body with {{PLACEHOLDERS}}
- **active**: Boolean flag (TRUE to send, FALSE to disable)

**Usage:** `EmailService.sendEmail(templateId, recipient, variables)` reads template from sheet and sends with variable substitution.

---

## Template Organization by Workflow Phase

### PHASE 1: MEMBERSHIP APPLICATION WORKFLOW (tpl_040-tpl_052 + tpl_053-tpl_056)

#### Step 1: Initial Application Submission

**tpl_040 - Application Received**
- **To:** Applicant
- **Subject:** GEA Membership Application Received - {{FULL_NAME}}
- **Purpose:** Confirm membership application submitted, summarize next steps
- **Key Variables:** FIRST_NAME, APPLICATION_ID
- **Content:** Welcome message, application summary, next steps (upload documents)

**tpl_041 - Account Credentials**
- **To:** Applicant
- **Subject:** Your GEA Member Portal Login - {{FULL_NAME}}
- **Purpose:** Send login credentials and portal instructions
- **Key Variables:** FIRST_NAME, EMAIL, TEMP_PASSWORD, LOGIN_URL
- **Content:** Email and temporary password, portal URL, password requirements, help contact

**tpl_042 - New Application (Board)**
- **To:** GEA Board (board@geabotswana.org)
- **Subject:** New Membership Application: {{APPLICANT_NAME}}
- **Purpose:** Notify board of new application submission
- **Key Variables:** APPLICANT_NAME, MEMBERSHIP_CATEGORY, HOUSEHOLD_TYPE, APPLICATION_ID, SUBMITTED_DATE
- **Content:** Applicant info, application summary, status (documents expected), no action yet required

---

#### Step 2: Document Management

**tpl_043 - Documents Confirmed**
- **To:** GEA Board
- **Subject:** Documents Ready for Review - {{APPLICANT_NAME}}
- **Purpose:** Notify board that applicant has uploaded and confirmed documents
- **Key Variables:** APPLICANT_NAME, APPLICATION_ID, MEMBERSHIP_CATEGORY
- **Content:** Document submission confirmation, ready for board initial review, next action required

---

#### Step 3: Board Initial Review

**tpl_044 - Docs Sent to RSO**
- **To:** RSO (Regional Security Officer) + Applicant
- **Subject:** Your Application Documents Are Under Security Review
- **Purpose:** Notify applicant and RSO that documents have been forwarded for security review
- **Key Variables:** APPLICANT_NAME, APPLICATION_ID, FIRST_NAME (for applicant version)
- **Content:** Confirmation of board approval, RSO review timeline (3-5 days), no action needed

**tpl_054 - Board Approved for RSO (FYI)**
- **To:** GEA Board
- **Subject:** [FYI] Application Approved for RSO Review - {{FULL_NAME}}
- **Purpose:** Informational - board approved for RSO review, RSO has been notified
- **Key Variables:** FULL_NAME, MEMBERSHIP_LEVEL, HOUSEHOLD_TYPE, APPLICATION_ID, BOARD_APPROVAL_DATE
- **Content:** FYI that initial review approved, RSO now reviewing, status update only

---

#### Step 4: RSO Security Review

**tpl_046 - RSO Document Issue**
- **To:** GEA Board + Applicant
- **Subject:** Additional Information Needed - {{APPLICANT_NAME}}
- **Purpose:** Notify applicant and board of document issues found by RSO
- **Key Variables:** APPLICANT_NAME, APPLICATION_ID, REASON, NEXT_STEP
- **Content:** Issues identified, resubmission required within 10 days, document requirements

**tpl_047 - Ready for Final Approval**
- **To:** GEA Board
- **Subject:** Application Ready for Final Board Approval - {{APPLICANT_NAME}}
- **Purpose:** Notify board that RSO has approved documents, ready for final approval decision
- **Key Variables:** APPLICANT_NAME, APPLICATION_ID
- **Content:** RSO approval confirmed, ready for board final review, next action: approve/deny

---

#### Step 5: Board Final Review

**tpl_048 - Application Approved**
- **To:** Applicant
- **Subject:** Congratulations! Your GEA Membership Application Has Been Approved
- **Purpose:** Final approval notification with payment instructions
- **Key Variables:** APPLICANT_NAME, DUES_USD, DUES_BWP, PAYMENT_REFERENCE, SDFCU, PAYPAL, ZELLE, BANK_ACCOUNT
- **Content:** Congratulations, dues amount, 5 payment methods (SDFCU, PayPal, Zelle, ABSA, Cash), next steps

**tpl_049 - Board Final Denied**
- **To:** Applicant
- **Subject:** Your GEA Membership Application - Final Decision
- **Purpose:** Final denial notification with reason
- **Key Variables:** APPLICANT_NAME, REASON, CONTACT
- **Content:** Application not approved, reason provided, option to reapply/contact for discussion

**tpl_055 - Board Final Approval (FYI)**
- **To:** GEA Board
- **Subject:** [FYI] Application Approved - Payment Instructions Sent - {{FULL_NAME}}
- **Purpose:** Informational - board finally approved application, payment instructions sent
- **Key Variables:** FULL_NAME, MEMBERSHIP_LEVEL, HOUSEHOLD_TYPE, APPLICATION_ID, BOARD_APPROVAL_DATE, DUES_USD, DUES_BWP, PAYMENT_REFERENCE
- **Content:** FYI that final approval given, payment instructions sent to applicant, status update only

---

#### Step 6: Payment Submission

**tpl_050 - Payment Proof Received**
- **To:** Treasurer (treasurer@geabotswana.org)
- **Subject:** Payment Received - Awaiting Verification
- **Purpose:** Notify treasurer that applicant has submitted payment proof
- **Key Variables:** APPLICATION_ID, APPLICANT_NAME, PAYMENT_REFERENCE, DUES_USD, DUES_BWP, PAYMENT_METHOD, PAYMENT_DATE
- **Content:** Payment submitted details, reference code, treasurer action required (verify receipt)

**tpl_053 - Payment Submitted (FYI)**
- **To:** GEA Board (non-treasurer members)
- **Subject:** [FYI] Payment Received - {{FULL_NAME}}
- **Purpose:** Informational - payment has been submitted, treasurer will verify
- **Key Variables:** FULL_NAME, MEMBERSHIP_LEVEL, HOUSEHOLD_TYPE, APPLICATION_ID, PAYMENT_METHOD, PAYMENT_DATE, PAYMENT_REFERENCE, DUES_USD, DUES_BWP
- **Content:** FYI that payment received, treasurer will verify soon, no action needed from board

---

#### Step 7: Payment Verification & Activation

**tpl_051 - Membership Activated**
- **To:** Applicant
- **Subject:** Welcome to GEA! Your Membership Is Now Active
- **Purpose:** Welcome email confirming membership activated and benefits available
- **Key Variables:** APPLICANT_NAME, MEMBERSHIP_LEVEL, HOUSEHOLD_TYPE, START_DATE, EXPIRATION_DATE, FAMILY_MEMBERS_COUNT
- **Content:** Welcome, membership active, facility booking rules, benefits list, portal access, digital card

**tpl_052 - New Member Activated**
- **To:** GEA Board
- **Subject:** New Member Activated
- **Purpose:** Board notification that new member is now active and ready to use GEA
- **Key Variables:** FULL_NAME, EMAIL, MEMBERSHIP_LEVEL, HOUSEHOLD_TYPE, ACTIVATION_DATE, FAMILY_MEMBERS_COUNT
- **Content:** New member details, activation date, status update (application process complete)

**tpl_056 - Payment Verified & Activated (FYI)**
- **To:** GEA Board
- **Subject:** [FYI] Payment Verified - Member Activated - {{FULL_NAME}}
- **Purpose:** Informational - payment verified, membership now active
- **Key Variables:** FULL_NAME, MEMBERSHIP_LEVEL, HOUSEHOLD_TYPE, APPLICATION_ID, PAYMENT_REFERENCE, VERIFICATION_DATE, MEMBERSHIP_START_DATE, MEMBERSHIP_EXPIRATION_DATE
- **Content:** FYI that payment verified, member now active, can access all facilities

---

### PHASE 2: RESERVATION WORKFLOW (tpl_007-tpl_013)

#### Reservation Submission

**tpl_007 - Reservation Confirmed Auto**
- **To:** Member
- **Subject:** GEA Reservation Confirmed - {{FACILITY}} on {{RESERVATION_DATE}}
- **Purpose:** Auto-approved reservation confirmation
- **Key Variables:** FIRST_NAME, FACILITY, RESERVATION_DATE, START_TIME, END_TIME, EVENT_NAME, RESERVATION_ID, IF_GUESTS, GUEST_LIST_DEADLINE
- **Content:** Confirmation, reservation details, guest list deadline (if applicable), facility reminders

**tpl_008 - Reservation Pending Review**
- **To:** Member
- **Subject:** GEA Reservation Request Received - Pending Approval
- **Purpose:** Pending board/management approval notification
- **Key Variables:** FIRST_NAME, FACILITY, RESERVATION_DATE, START_TIME, END_TIME, EVENT_NAME, RESERVATION_ID, APPROVAL_REASON, IF_LEOBO, IF_GUESTS, GUEST_LIST_DEADLINE
- **Content:** Acknowledgment, reason for pending (approval reason), timeline, guest list requirements

#### Board/Management Approval Requests

**tpl_009 - Board Approval Request**
- **To:** GEA Board
- **Subject:** [ACTION REQUIRED] Reservation Approval Needed - {{MEMBER_NAME}} - {{RESERVATION_DATE}}
- **Purpose:** Board review request for excess/pending reservations
- **Key Variables:** MEMBER_NAME, MEMBER_EMAIL, MEMBER_PHONE, FACILITY, RESERVATION_DATE, START_TIME, END_TIME, EVENT_NAME, SUBMISSION_TIMESTAMP, IF_GUESTS, GUEST_COUNT, GUEST_LIST_LINK, OTHER_EVENTS_LIST, MEMBERSHIP_LEVEL, MEMBERSHIP_STATUS, LEOBO_USAGE, LEOBO_MONTHLY_LIMIT, APPROVE_LINK, DENY_LINK
- **Content:** Action request, reservation details, member info, guest info, other events on date, board action links, 24-hour escalation warning

**tpl_019 - MGT Approval Request**
- **To:** Management Officer
- **Subject:** [ACTION REQUIRED] Leobo Reservation Approval - {{MEMBER_NAME}} - {{RESERVATION_DATE}}
- **Purpose:** Management Officer approval request for Leobo reservations
- **Key Variables:** MEMBER_NAME, MEMBER_EMAIL, MEMBER_PHONE, FACILITY, RESERVATION_DATE, START_TIME, END_TIME, EVENT_NAME, SUBMISSION_TIMESTAMP, IF_GUESTS, GUEST_COUNT, GUEST_LIST_STATUS, OTHER_EVENTS_LIST, MEMBERSHIP_LEVEL, MEMBERSHIP_STATUS, HOUSEHOLD_NAME, APPROVE_LINK, DENY_LINK
- **Content:** Action request, reservation details, member/household info, guest status, board action links

#### Reservation Approval/Denial

**tpl_010 - Reservation Approved**
- **To:** Member
- **Subject:** GEA Reservation Approved - {{FACILITY}} on {{RESERVATION_DATE}}
- **Purpose:** Board-approved reservation confirmation
- **Key Variables:** FIRST_NAME, FACILITY, RESERVATION_DATE, START_TIME, END_TIME, EVENT_NAME, RESERVATION_ID, APPROVED_BY, IF_GUESTS, IF_GUEST_LIST_SUBMITTED, IF_GUEST_LIST_PENDING, GUEST_LIST_DEADLINE
- **Content:** Approval confirmation, reservation details, approval status, guest list status, facility reminders

**tpl_011 - Reservation Denied**
- **To:** Member
- **Subject:** GEA Reservation Request - Update
- **Purpose:** Board rejection of reservation request
- **Key Variables:** FIRST_NAME, FACILITY, RESERVATION_DATE, START_TIME, END_TIME, EVENT_NAME, DENIAL_REASON
- **Content:** Rejection message, reservation details, denial reason, rescheduling option

#### Reservation Management

**tpl_012 - Reservation Cancelled**
- **To:** Member
- **Subject:** GEA Reservation Cancelled - {{FACILITY}} on {{RESERVATION_DATE}}
- **Purpose:** Reservation cancellation notification
- **Key Variables:** FIRST_NAME, FACILITY, RESERVATION_DATE, START_TIME, END_TIME, EVENT_NAME, CANCELLED_BY, IF_REASON, CANCELLATION_REASON, IF_BOARD_CANCELLED, IF_WAITLIST
- **Content:** Cancellation notice, reservation details, canceller info, reason (if provided), rescheduling if waitlist

**tpl_013 - Guest List Deadline Reminder**
- **To:** Member
- **Subject:** REMINDER: Guest List Due {{GUEST_LIST_DEADLINE}} - {{EVENT_NAME}}
- **Purpose:** Reminder to submit guest list before deadline
- **Key Variables:** FIRST_NAME, GUEST_LIST_DEADLINE, FACILITY, RESERVATION_DATE, START_TIME, END_TIME, EVENT_NAME
- **Content:** Deadline reminder, reservation details, guest list status, cancellation threat if missed

#### RSO Daily Summary

**tpl_014 - RSO Daily Summary**
- **To:** RSO (Regional Security Officer)
- **Subject:** GEA Daily Reservation Summary - {{TODAY_DATE}}
- **Purpose:** Daily summary of reservations for RSO security officer
- **Key Variables:** TODAY_DATE, IF_NO_RESERVATIONS, RESERVATIONS_BLOCK, TOTAL_RESERVATIONS, TOTAL_MEMBERS, TOTAL_GUESTS, TOTAL_VENDORS
- **Content:** Daily automated summary, reservation list (or note if none), attendee count summaries

---

### PHASE 3: MEMBERSHIP RENEWAL & EXPIRATION (tpl_004-tpl_006)

**tpl_004 - Renewal Reminder 30 Days**
- **To:** Member
- **Subject:** GEA Membership Renewal Due - {{EXPIRATION_DATE}}
- **Purpose:** 30-day advance notice before membership expires
- **Key Variables:** FIRST_NAME, FULL_NAME, MEMBERSHIP_LEVEL, EXPIRATION_DATE, DUES_USD, DUES_BWP
- **Content:** Friendly reminder, renewal amount, renewal instructions, facility access warning

**tpl_005 - Renewal Reminder 7 Days**
- **To:** Member
- **Subject:** URGENT: GEA Membership Expires in 7 Days
- **Purpose:** Urgent 7-day notice before membership expires
- **Key Variables:** FIRST_NAME, EXPIRATION_DATE, DUES_USD, DUES_BWP
- **Content:** Urgent tone, renewal amount, immediate action required message

**tpl_006 - Membership Expired**
- **To:** Member
- **Subject:** GEA Membership Has Expired
- **Purpose:** Notify member of expired membership and suspension
- **Key Variables:** FIRST_NAME, EXPIRATION_DATE, DUES_USD, DUES_BWP
- **Content:** Expiration notification, facility access suspension, renewal amount, renewal instructions, departure option

---

### PHASE 4: DOCUMENT MANAGEMENT (tpl_015-tpl_018)

**tpl_015 - Passport Expiration Warning**
- **To:** Member
- **Subject:** Courtesy Reminder: Your {{DOCUMENT_TYPE}} Expires Soon
- **Purpose:** 6-month advance notice of document expiration
- **Key Variables:** FIRST_NAME, DOCUMENT_TYPE, DOCUMENT_EXPIRATION_DATE, DOCUMENT_NUMBER
- **Content:** Courtesy notification, document details, planning advice, update instructions

**tpl_016 - Photo Submission Reminder**
- **To:** Member
- **Subject:** Action Required: Upload Your GEA Membership Photo
- **Purpose:** Reminder to upload membership photo
- **Key Variables:** FIRST_NAME, IF_FAMILY_MISSING_PHOTOS, MISSING_PHOTOS_LIST
- **Content:** Action required message, why photo needed, photo requirements, upload instructions

**tpl_017 - Photo Approved**
- **To:** Member
- **Subject:** GEA Membership Photo Approved
- **Purpose:** Photo approval confirmation
- **Key Variables:** FIRST_NAME
- **Content:** Approval message, card availability notice, card usage instructions

**tpl_018 - Photo Rejected**
- **To:** Member
- **Subject:** GEA Membership Photo - Resubmission Required
- **Purpose:** Photo rejection with reason and resubmission request
- **Key Variables:** FIRST_NAME, REJECTION_REASON
- **Content:** Rejection message, rejection reason, photo requirements (detailed), resubmission instructions

---

### PHASE 5: PAYMENT WORKFLOW (tpl_025-tpl_026)

**tpl_025 - Payment Confirmation Received**
- **To:** GEA Board
- **Subject:** Payment Confirmation Submitted - {{MEMBER_NAME}}
- **Purpose:** Board notification of member payment submission
- **Key Variables:** MEMBER_NAME, MEMBER_EMAIL, MEMBERSHIP_LEVEL, DUES_USD, DUES_BWP, PAYMENT_METHOD, PAYMENT_REFERENCE, PAYMENT_DATE, IF_RECEIPT, RECEIPT_LINK, IF_NOTES, PAYMENT_NOTES, CONFIRM_LINK, NOT_FOUND_LINK
- **Content:** Submission notification, payment details, receipt link (if provided), member notes, board action links

**tpl_026 - Payment Verified**
- **To:** Member
- **Subject:** GEA Payment Confirmed - Membership Active!
- **Purpose:** Member confirmation of payment verification and membership activation
- **Key Variables:** FIRST_NAME, DUES_USD, DUES_BWP, PAYMENT_METHOD, PAYMENT_REFERENCE, CONFIRMATION_DATE, MEMBERSHIP_LEVEL, EXPIRATION_DATE, IF_NEW_MEMBER, IF_FAMILY
- **Content:** Confirmation message, payment details, membership status, portal activation, first-time action items

---

### PHASE 6: MEMBER PORTAL & ACCOUNT (tpl_021-tpl_024)

**tpl_021 - First Login Welcome**
- **To:** Member
- **Subject:** Welcome to the GEA Member Portal!
- **Purpose:** Welcome message for first-time member portal access
- **Key Variables:** FIRST_NAME, MEMBERSHIP_LEVEL, EXPIRATION_DATE, IF_FAMILY, FAMILY_MEMBERS_LIST
- **Content:** Welcome message, portal URL, features list, getting started items, membership details, card availability

**tpl_022 - Birthday Greeting**
- **To:** Member
- **Subject:** Happy Birthday from the GEA!
- **Purpose:** Birthday greeting to member
- **Key Variables:** FIRST_NAME
- **Content:** Birthday greeting, invitation to celebrate at facilities

**tpl_023 - Birthday Age 15 Milestone**
- **To:** Member & Parent
- **Subject:** Happy Birthday {{FIRST_NAME}} - New GEA Access Privileges!
- **Purpose:** Notify of age 15 milestone access privileges
- **Key Variables:** FIRST_NAME, PARENT_NAME, IF_NO_EMAIL
- **Content:** Birthday greeting, age 15 milestone notification, new access privileges, portal login setup, email requirement note

**tpl_024 - Birthday Age 16 Milestone**
- **To:** Member
- **Subject:** Happy Birthday {{FIRST_NAME}} - You Can Now Vote!
- **Purpose:** Notify of age 16 milestone voting & office eligibility
- **Key Variables:** FIRST_NAME
- **Content:** Birthday greeting, age 16 milestone notification, full membership privileges, community participation message

---

### PHASE 7: ADMINISTRATIVE TASKS (tpl_027-tpl_032)

**tpl_027 - Holiday Calendar Reminder**
- **To:** GEA Board
- **Subject:** ACTION NEEDED: Update GEA Holiday Calendar for {{NEXT_YEAR}}
- **Purpose:** Annual reminder to update holiday calendar
- **Key Variables:** NEXT_YEAR, CURRENT_YEAR
- **Content:** Annual reminder, why calendar matters, action steps, Botswana holiday note, deadline

**tpl_028 - Tennis Limit Reached**
- **To:** Member
- **Subject:** GEA Tennis Court - Weekly Booking Limit Reached
- **Purpose:** Notify member that weekly tennis limit reached
- **Key Variables:** FIRST_NAME, WEEK_START, WEEK_END, HOURS_USED, TENNIS_WEEKLY_LIMIT_HOURS, WEEKLY_BOOKINGS_LIST, TENNIS_BUMP_WINDOW_DAYS
- **Content:** Limit notification, current usage, excess booking process, bumping rules, fair access message, reset timing

**tpl_029 - Leobo Limit Reached**
- **To:** Member
- **Subject:** GEA Leobo - Monthly Booking Limit Reached
- **Purpose:** Notify member that monthly Leobo limit reached
- **Key Variables:** FIRST_NAME, CURRENT_MONTH, LEOBO_USAGE, LEOBO_MONTHLY_LIMIT, HOURS_USED, LEOBO_MAX_HOURS, MONTHLY_BOOKINGS_LIST, LEOBO_BUMP_WINDOW_DAYS
- **Content:** Limit notification, current usage, excess booking process, bumping rules, priority rebooking, reset timing

**tpl_030 - Excess Tennis Approval Request**
- **To:** GEA Board
- **Subject:** [ACTION REQUIRED] Excess Tennis Booking Approval - {{MEMBER_NAME}}
- **Purpose:** Board approval request for excess tennis reservations
- **Key Variables:** MEMBER_NAME, MEMBER_EMAIL, HOURS_USED, TENNIS_WEEKLY_LIMIT_HOURS, EXISTING_BOOKINGS_LIST, RESERVATION_DATE, START_TIME, END_TIME, DURATION_HOURS, EVENT_NAME, IF_GUESTS, GUEST_COUNT, GUEST_LIST_LINK, OTHER_EVENTS_LIST, APPROVE_LINK, DENY_LINK, BUMP_DEADLINE, TENNIS_BUMP_WINDOW_DAYS
- **Content:** Warning header, existing bookings, new request details, guest info, other events, approval options, deadline info

**tpl_031 - Excess Leobo Approval Request**
- **To:** Management Officer
- **Subject:** [ACTION REQUIRED] Excess Leobo Booking Approval - {{MEMBER_NAME}}
- **Purpose:** Management Officer approval request for excess Leobo reservations
- **Key Variables:** MEMBER_NAME, MEMBER_EMAIL, MEMBER_PHONE, LEOBO_USAGE, LEOBO_MONTHLY_LIMIT, HOURS_USED, LEOBO_MAX_HOURS, EXISTING_BOOKINGS_LIST, FACILITY, RESERVATION_DATE, START_TIME, END_TIME, DURATION_HOURS, EVENT_NAME, IF_GUESTS, GUEST_COUNT, GUEST_LIST_LINK, OTHER_EVENTS_LIST, MEMBERSHIP_LEVEL, MEMBERSHIP_STATUS, HOUSEHOLD_NAME, APPROVE_LINK, DENY_LINK, BUMP_DEADLINE, LEOBO_BUMP_WINDOW_DAYS
- **Content:** Warning header, existing bookings, new request details, guest info, member/household status, approval options, RSO notification note

**tpl_032 - Member Password Set**
- **To:** Member
- **Subject:** GEA Member Portal - Password Set
- **Purpose:** Confirm portal account activation and password setting
- **Key Variables:** FIRST_NAME, EMAIL
- **Content:** Account activation confirmation, email address, password requirements, how to log in, password security warning, forgotten password option, support contact

---

## Template Variables Reference

### Common Variables
- `{{FIRST_NAME}}` - Member first name
- `{{FULL_NAME}}` - Member full name
- `{{EMAIL}}` - Member email address
- `{{PHONE}}` - Member phone number

### Membership Variables
- `{{MEMBERSHIP_LEVEL}}` - Membership type name
- `{{MEMBERSHIP_CATEGORY}}` - Category (Full, Affiliate, etc.)
- `{{HOUSEHOLD_TYPE}}` - Individual or Family
- `{{DUES_USD}}` - Annual dues in USD
- `{{DUES_BWP}}` - Annual dues in BWP (Pula)
- `{{EXPIRATION_DATE}}` - Membership expiration date
- `{{START_DATE}}` - Membership start date

### Application Variables
- `{{APPLICATION_ID}}` - Unique application identifier
- `{{APPLICANT_NAME}}` - Full name of applicant
- `{{SUBMITTED_DATE}}` - Application submission date
- `{{PAYMENT_REFERENCE}}` - Payment reference code
- `{{APPROVAL_DATE}}` - Date of approval
- `{{BOARD_APPROVAL_DATE}}` - Date board approved

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

### Administrative Variables
- `{{MEMBER_NAME}}` - Full name of member
- `{{MEMBER_EMAIL}}` - Member email
- `{{MEMBER_PHONE}}` - Member phone number
- `{{HOUSEHOLD_NAME}}` - Household name
- `{{APPROVED_BY}}` - Name of approver
- `{{CANCELLED_BY}}` - Name of person who cancelled
- `{{REJECTION_REASON}}` - Reason for rejection/denial
- `{{DENIAL_REASON}}` - Reason for denial
- `{{PAYMENT_METHOD}}` - Payment method used
- `{{PAYMENT_DATE}}` - Payment submission date

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
- `{{IF_RECEIPT}}...{{END_IF}}` - If receipt provided
- `{{IF_FAMILY_MISSING_PHOTOS}}...{{END_IF}}` - If household members missing photos

### List Variables
- `{{FAMILY_MEMBERS_LIST}}` - Formatted list of family members
- `{{MISSING_PHOTOS_LIST}}` - List of members needing photos
- `{{WEEKLY_BOOKINGS_LIST}}` - List of tennis bookings this week
- `{{MONTHLY_BOOKINGS_LIST}}` - List of Leobo bookings this month
- `{{OTHER_EVENTS_LIST}}` - Other events on the date
- `{{EXISTING_BOOKINGS_LIST}}` - Existing reservations

---

## Usage Notes

- All templates are stored in the **Email Templates** tab of **GEA System Backend** spreadsheet
- Templates are fetched and cached by EmailService.js during execution
- Email is sent from **"Gaborone Employee Association"** with reply-to: **board@geabotswana.org**
- All templates include GEA footer with website and contact info
- HTML wrapping with logo, styling, and footer applied automatically by EmailService.js
- Placeholders replaced with actual values before sending
- Conditional blocks evaluated based on provided variables
- FYI emails (marked with `[FYI]` in subject) are informational only, no action required
- Action-required emails (marked with `[ACTION REQUIRED]`) need board/user response

### Active/Inactive Status
- **Active = TRUE**: Template is in use, EmailService will send
- **Active = FALSE**: Template is disabled, EmailService will skip
- **Current inactive:** tpl_001, tpl_002, tpl_003 (replaced by tpl_040-tpl_052 membership workflow)

---

## Maintenance Notes

- Templates are version-controlled in the repository (reference doc + CSV exports)
- Any template changes should be made in the Google Sheet first
- Export updated templates as CSV for version control backup
- Keep this reference doc synchronized with actual sheet contents
- Test new/modified templates before deployment

---

**Last Updated:** March 6, 2026
**Total Active Templates:** 56
**Status:** Complete, all phases covered
