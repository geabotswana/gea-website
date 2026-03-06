# New Email Templates for Membership Application Workflow

Additional FYI templates to keep the board informed of membership application progress without requiring access to the admin portal.

---

## tpl_053 - Payment Submitted (Board FYI)

**Purpose:** Inform non-treasurer board members that payment has been submitted and treasurer will review soon

**To:** GEA Board (all members except treasurer, or full board)

**Subject:** [FYI] Payment Received - {{FULL_NAME}}

**Key Content:**
- FYI header (informational only, no action required)
- Applicant name and membership level
- Payment details (amount, method, reference code, date submitted)
- Note that treasurer will verify receipt
- Expected timeline for verification (typically 2 business days)
- No action needed from non-treasurer board members

**Variables Used:** FULL_NAME, MEMBERSHIP_LEVEL, HOUSEHOLD_TYPE, APPLICATION_ID, PAYMENT_METHOD, PAYMENT_DATE, PAYMENT_REFERENCE, DUES_USD, DUES_BWP

---

## tpl_054 - Board Approved for RSO (Board FYI)

**Purpose:** Inform board that application was approved for RSO review and RSO has been notified

**To:** GEA Board

**Subject:** [FYI] Application Approved for RSO Review - {{FULL_NAME}}

**Key Content:**
- FYI header (informational, no action required)
- Applicant name, membership level, household type
- Confirmation that initial board review approved application
- RSO has been notified and will begin security document review
- Timeline for RSO review (typically 3-5 business days)
- No action needed at this time

**Variables Used:** FULL_NAME, MEMBERSHIP_LEVEL, HOUSEHOLD_TYPE, APPLICATION_ID, BOARD_APPROVAL_DATE

---

## tpl_055 - Board Final Approval (Board FYI)

**Purpose:** Inform board that application received final approval after RSO review

**To:** GEA Board

**Subject:** [FYI] Application Approved - Payment Instructions Sent - {{FULL_NAME}}

**Key Content:**
- FYI header (informational, no action required)
- Applicant name, membership level, household type
- Confirmation of final board approval
- Payment instructions have been sent to applicant
- Dues amount (USD and BWP)
- Payment reference code for applicant's reference
- Next step: applicant submits payment proof to treasurer
- No action needed from board

**Variables Used:** FULL_NAME, MEMBERSHIP_LEVEL, HOUSEHOLD_TYPE, APPLICATION_ID, BOARD_APPROVAL_DATE, DUES_USD, DUES_BWP, PAYMENT_REFERENCE

---

## tpl_056 - Payment Verified & Activated (Board FYI)

**Purpose:** Inform board that payment has been verified by treasurer and membership is now active

**To:** GEA Board

**Subject:** [FYI] Payment Verified - Member Activated - {{FULL_NAME}}

**Key Content:**
- FYI header (informational, final status update)
- Member name, membership level, household type
- Confirmation of payment verification by treasurer
- Membership is now ACTIVE and can access all facilities
- Membership start date and expiration date
- Payment reference code
- Member has received welcome email with portal access and digital card
- Application process complete

**Variables Used:** FULL_NAME, MEMBERSHIP_LEVEL, HOUSEHOLD_TYPE, APPLICATION_ID, PAYMENT_REFERENCE, VERIFICATION_DATE, MEMBERSHIP_START_DATE, MEMBERSHIP_EXPIRATION_DATE

---

## Usage Notes

- All templates are informational ("FYI") notifications for the board
- Subject lines include "[FYI]" prefix to distinguish from action-required emails
- No approval links or action buttons in any of these templates
- These run in parallel with applicant/treasurer emails at each stage
- Helps board track all applications without accessing admin portal
- Should be sent to board@geabotswana.org or configured board distribution list
