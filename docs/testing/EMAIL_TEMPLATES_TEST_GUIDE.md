# Email Templates Testing Guide

Quick reference for verifying correct email templates are sent during the membership application workflow.

---

## Email Template Matrix

Use this table to verify the correct email is sent at each workflow stage. Check for:
- ✅ Email template is sent (check inbox within 5 minutes)
- ✅ Template name matches expected
- ✅ Placeholders are replaced (no {{BRACKETS}} visible)
- ✅ Recipient is correct

| Stage | Event | Template | Recipient | Trigger |
|-------|-------|----------|-----------|---------|
| **Submission** | Application submitted | MEM_APPLICATION_SUBMITTED_TO_APPLICANT | Applicant | After form submit |
| | | MEM_APPLICATION_SUBMITTED_BOARD_FYI_TO_BOARD | Board | After form submit |
| **Document Confirmation** | Applicant confirms docs | ADM_DOCUMENTS_CONFIRMED_TO_APPLICANT | Applicant | After docs confirmed |
| **Board Initial Approval** | Board approves initial | ADM_APPLICATION_APPROVED_BY_BOARD_INITIAL_TO_APPLICANT | Applicant | Board clicks approve |
| | | ADM_DOCUMENTS_SENT_TO_RSO_TO_MEMBER | Applicant | Board approves |
| | | ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE | RSO | Board approves |
| **RSO Document Approval** | RSO approves via link | ADM_DOCUMENT_APPROVED_BY_RSO_TO_MEMBER | Applicant | RSO clicks approve link |
| **RSO Document Rejection** | RSO rejects via link | ADM_RSO_DOCUMENT_ISSUE_TO_BOARD | Board | RSO rejects document |
| | | (Board relays to member) | (See deployment notes) | (Manual step) |
| **Board Final Approval** | Board approves final | ADM_APPLICATION_APPROVED_BY_BOARD_FINAL_TO_APPLICANT | Applicant | Board final approves |
| **Board Denial (Initial)** | Board denies initial | MEM_APPLICATION_DENIED_TO_APPLICANT | Applicant | Board denies |
| **Board Denial (Final)** | Board denies final | MEM_APPLICATION_DENIED_TO_APPLICANT | Applicant | Board denies |
| **Payment Submitted** | Applicant submits payment | PAY_PAYMENT_SUBMITTED_TO_MEMBER | Applicant | Payment form submit |
| | | PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD | Board | Payment form submit |
| **Treasurer Approves Payment** | Treasurer verifies | PAY_PAYMENT_VERIFIED_TO_MEMBER | Applicant | Treasurer approves |
| | | (Activation cascade) | Spouse/children | Auto-activation |
| **Treasurer Requests Clarification** | Treasurer asks for info | PAY_PAYMENT_CLARIFICATION_REQUESTED_TO_MEMBER | Applicant | Treasurer clarifies |
| **Treasurer Rejects Payment** | Treasurer rejects | PAY_PAYMENT_REJECTED_TO_MEMBER | Applicant | Treasurer rejects |

---

## Stage-by-Stage Email Verification

### 01. Application Submission

**When:** Immediately after applicant clicks "Submit Application"

**Emails Expected:** 2
1. Applicant receives: **MEM_APPLICATION_SUBMITTED_TO_APPLICANT**
2. Board receives: **MEM_APPLICATION_SUBMITTED_BOARD_FYI_TO_BOARD**

**Verification Checklist:**

**Applicant Email:**
- [ ] Subject: Check for "Application Received" or "Welcome to GEA"
- [ ] From: Gaborone Employee Association (board@geabotswana.org)
- [ ] Reply-to: board@geabotswana.org
- [ ] Body contains:
  - [ ] Applicant's first and last name (replaced, not {{FIRST_NAME}})
  - [ ] Applicant's email address
  - [ ] Membership category applied for
  - [ ] Temporary password or login link
  - [ ] Instructions to log in and submit documents
  - [ ] Board approval timeline (e.g., "within 3 business days")
- [ ] No unreplaced placeholders ({{...}} should all be gone)

**Board Email:**
- [ ] Subject: "New Membership Application — [Category]"
- [ ] To: board@geabotswana.org
- [ ] Body contains:
  - [ ] Applicant name
  - [ ] Membership category
  - [ ] Application ID
  - [ ] Link to Admin Portal for review
  - [ ] Expected action deadline

---

### 02. Documents Confirmed

**When:** Applicant clicks "Confirm All Documents" or equivalent

**Emails Expected:** 1
- Applicant: **ADM_DOCUMENTS_CONFIRMED_TO_APPLICANT**

**Verification:**
- [ ] Applicant notified that board will now review
- [ ] Status message matches "under review" state

---

### 03. Board Initial Approval

**When:** Board clicks "Approve" on application details

**Emails Expected:** 3
1. Applicant: **ADM_APPLICATION_APPROVED_BY_BOARD_INITIAL_TO_APPLICANT**
2. Applicant: **ADM_DOCUMENTS_SENT_TO_RSO_TO_MEMBER**
3. RSO: **ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE**

**Verification:**

**Email 1 — Applicant Board Initial Approval:**
- [ ] Notifies applicant that board approved initial review
- [ ] Explains next step: "RSO will review your documents"
- [ ] No action required from applicant yet

**Email 2 — Applicant RSO Notice:**
- [ ] Explains that RSO will now review documents
- [ ] Sets expectation: "RSO review takes 5–7 business days"
- [ ] May include contact info for RSO

**Email 3 — RSO Approval Request:**
- [ ] Sent to rso-approve@geabotswana.org
- [ ] Contains document preview or download link
- [ ] Contains one-time approval link (expires after use or after time)
- [ ] Contains reject link with reason form
- [ ] Links work (test clicking both)

---

### 04. RSO Document Approval

**When:** RSO clicks "Approve" on the one-time email link

**Emails Expected:** 1
- Applicant: **ADM_DOCUMENT_APPROVED_BY_RSO_TO_MEMBER**

**Verification:**
- [ ] Applicant informed documents passed RSO review
- [ ] Next step explained: "Board will now do final review"
- [ ] Timeframe given: "typically within 1-2 business days"

---

### 05. RSO Document Rejection

**When:** RSO clicks "Reject" on the one-time email link

**Emails Expected:** 1 + Board Notification
- Applicant: Rejection notice (implementation varies; see notes)
- Board: **ADM_RSO_DOCUMENT_ISSUE_TO_BOARD**

**Verification:**
- [ ] Board receives: "RSO rejected document from [Applicant] — reason: [given reason]"
- [ ] Board has mechanism to notify applicant diplomatically
- [ ] Applicant can resubmit documents (flow allows re-upload)
- [ ] RSO one-time link becomes inactive/expired after rejection

---

### 06. Board Final Approval

**When:** Board clicks "Approve" on final review

**Emails Expected:** 1
- Applicant: **ADM_APPLICATION_APPROVED_BY_BOARD_FINAL_TO_APPLICANT**

**Verification:**
- [ ] Applicant notified application is fully approved
- [ ] Explains next step: "Submit payment proof to activate membership"
- [ ] Payment page is now accessible
- [ ] Dues amount and methods provided

---

### 07. Board Denial

**When:** Board clicks "Deny" at initial or final review

**Emails Expected:** 1
- Applicant: **MEM_APPLICATION_DENIED_TO_APPLICANT**

**Verification:**
- [ ] Subject line: "Membership Application — Not Approved" (or similar)
- [ ] Body includes:
  - [ ] Reason for denial (board-provided text)
  - [ ] Contact info for board (email to ask questions)
  - [ ] Clarity that this is final (no appeal process)
- [ ] Applicant cannot access payment page

---

### 08. Payment Submission

**When:** Applicant clicks "Submit Payment Verification"

**Emails Expected:** 2
1. Applicant: **PAY_PAYMENT_SUBMITTED_TO_MEMBER**
2. Board/Treasurer: **PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD**

**Verification:**

**Applicant Email:**
- [ ] Confirmation that payment proof was received
- [ ] Shows amount submitted (USD and/or BWP)
- [ ] Shows payment method
- [ ] Explains next step: "Treasurer will review within 2–3 business days"

**Board Email:**
- [ ] Sent to treasurer (or board@geabotswana.org)
- [ ] Lists payment details (amount, method, applicant)
- [ ] Contains link to Admin Portal Pending Payments section
- [ ] Shows if any issues (e.g., amount mismatch)

---

### 09. Treasurer Approves Payment

**When:** Treasurer clicks "Approve" on payment

**Emails Expected:** 3+ (activation cascade)
1. Applicant/Primary: **PAY_PAYMENT_VERIFIED_TO_MEMBER**
2. Each family member: Activation email (if applicable)
3. Board: Activation notification (optional)

**Verification:**

**Primary Applicant Email:**
- [ ] Subject: "Membership Activated!" or "Welcome to GEA"
- [ ] States: "Your membership is now active"
- [ ] Provides: Membership number, expiration date (July 31 YYYY)
- [ ] Explains: How to access member benefits
- [ ] Includes: Digital membership card link
- [ ] Provides: Contact info for questions

**Family Member Emails (if applicable):**
- [ ] Each spouse/child receives similar activation email
- [ ] Customized with member's name
- [ ] Explains their specific access rights (voting: yes/no, unaccompanied: yes/no)

---

### 10. Treasurer Requests Clarification

**When:** Treasurer clicks "Request Clarification"

**Emails Expected:** 1
- Applicant: **PAY_PAYMENT_CLARIFICATION_REQUESTED_TO_MEMBER**

**Verification:**
- [ ] Specifies what information is needed
- [ ] Explains how to resubmit
- [ ] Status shows "clarification_requested" in portal
- [ ] Applicant can resubmit with additional info

---

### 11. Treasurer Rejects Payment

**When:** Treasurer clicks "Reject"

**Emails Expected:** 1
- Applicant: **PAY_PAYMENT_REJECTED_TO_MEMBER**

**Verification:**
- [ ] States reason for rejection
- [ ] Explains: "Please resubmit with corrected information"
- [ ] Provides: Link back to payment page to resubmit
- [ ] Status shows "rejected" or allows resubmission

---

## Template Placeholder Checklist

For each email received, verify that **all placeholders are replaced**. Common placeholders:

| Placeholder | Example Replacement |
|---|---|
| {{FIRST_NAME}} | James |
| {{LAST_NAME}} | Morrison |
| {{EMAIL}} | james.morrison@example.com |
| {{PHONE}} | +267 71 234567 |
| {{MEMBERSHIP_CATEGORY}} | Full |
| {{HOUSEHOLD_TYPE}} | Individual |
| {{HOUSEHOLD_NAME}} | Morrison Household |
| {{AMOUNT_USD}} | $50.00 |
| {{AMOUNT_BWP}} | P685.00 |
| {{PAYMENT_METHOD}} | PayPal |
| {{REASON}} | (Board-provided denial reason) |
| {{MEMBERSHIP_EXPIRATION}} | July 31, 2027 |
| {{BOARD_EMAIL}} | board@geabotswana.org |

**Fail if:** Any email contains unreplaced placeholder text like `{{FIRST_NAME}}` or `{{AMOUNT_USD}}`

---

## Email Delivery Troubleshooting

### Email not received (5 minute timeout)

1. **Check spam folder** — Gmail may filter unknown senders
2. **Verify email address** — Confirm applicant used correct email
3. **Check Gmail alias** — If using `testapp+category@gmail.com`, ensure inbox label catches it
4. **Check Apps Script Logs** — `clasp logs` may show email send failure
5. **Verify configuration:**
   - [ ] EMAIL_FROM_ADDRESS is set in Config.js
   - [ ] EMAIL_REPLY_TO is set
   - [ ] Template exists in "Email Templates" sheet of System Backend

### Placeholders not replaced (e.g., still shows {{FIRST_NAME}})

1. **Check template name** — Verify semantic name is correct in "Email Templates" sheet
2. **Check variable names** — Variable names must match EXACTLY (case-sensitive)
3. **Check data source** — Verify field exists in Individuals or Households sheet
4. **Check sendEmail() call** — Verify all variables passed to sendEmail function

---

## Testing Checklist Summary

**For each test scene, verify:**
- [ ] Correct template sent (check template name against matrix above)
- [ ] Recipient is correct (applicant, board, RSO, treasurer as applicable)
- [ ] Email received within 5 minutes
- [ ] All placeholders replaced (no {{}} visible)
- [ ] Email content matches applicant/scenario (e.g., correct category, amount, timeline)
- [ ] Any links in email work (approval links, payment page link, etc.)

---

**Last Updated:** March 30, 2026
**Total Email Templates:** 69 (across all scenarios, not all used in membership applications)
