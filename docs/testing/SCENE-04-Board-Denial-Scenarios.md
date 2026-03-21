# Scene 04 — Board Denial: Initial Review and Final Review

**Order:** Requires Scene 01 to have been run first (confirms baseline flow). Can run in parallel with Scene 02/03.

**What this tests:**
- Board denies an application at the **initial review** stage
- Board denies an application at the **final review** stage (after RSO has already approved documents)
- Applicant receives correct denial email with reason
- Applicant's non-member portal shows denied status
- Denied applicant cannot access the regular member portal
- Application record is correctly marked as denied in Membership Applications sheet

---

## Cast

| Role | Who | Access |
|------|-----|--------|
| **Applicant A** | test email for initial denial | Portal |
| **Applicant B** | test email for final denial | Portal |
| **Board Member** | board@geabotswana.org | Admin Portal |
| **RSO Approver** | rso-approve@geabotswana.org | One-time email link (Part B only) |

**Suggested test data:**
- Applicant A: Nina Walsh, nina.walsh.test@[yourdomain] (will be denied at initial review)
- Applicant B: Owen Batho, owen.batho.test@[yourdomain] (will be denied at final review)

---

## Pre-conditions

- Scene 01 complete (confirms baseline)

---

## Part A — Board Denies at Initial Review

---

### Step A1 — Apply (Full Individual)
**Who:** Applicant A (Nina Walsh)
**Where:** Portal

**Action:** Submit a standard Full Individual application (see Scene 01 Steps 1–3).

**Check:** Application created, Nina receives credentials email, status = "awaiting_docs"

---

### Step A2 — Upload Documents and Confirm
**Who:** Applicant A
**Where:** Non-Member Portal → Documents

**Action:** Upload passport and photo, click Confirm.

**Check:** Status advances to "board_initial_review", board receives notification email

---

### Step A3 — Board Denies at Initial Review
**Who:** Board Member
**Where:** Admin Portal → Applications

**Action:**
1. Open Nina Walsh's application
2. Click **"Deny"** (initial review denial)
3. Enter a reason: "Application does not meet eligibility requirements for the requested membership category."
4. Confirm denial

**Check:**

**Applications sheet:**
- status = "denied" (or similar denial status)
- board_initial_status = "denied"
- board_initial_reviewed_by = board member email
- board_initial_review_date = today

**Applicant email:**
- Nina receives: MEM_APPLICATION_DENIED_TO_APPLICANT
- Email contains the reason provided by the board
- Template has no unreplaced placeholders

**Applicant portal (Nina logs in):**
- Status card shows "denied" or "Application Denied"
- No access to Documents, Payment, or Household pages
- Dashboard shows: reason why (if surfaced) or "Contact board for more information"

**No activation possible:**
- active = FALSE on Households and Individuals sheets
- Attempting to log in to regular member portal fails or redirects to non-member denied view

**Fail if:** Denial email not sent, reason not included in email, status doesn't update, or Nina can still access payment page

---

### Step A4 — Verify Denial is Permanent
**Who:** Board Member
**Where:** Admin Portal

**Action:** Attempt to re-open Nina's application and find the Approve button

**Check:**
- Denied application cannot be re-approved through the standard workflow (status is terminal)
- If there is a way to reopen/reactivate, confirm it requires explicit action and is not accidentally triggered

**Note:** This tests that denial is not accidentally reversible.

---

## Part B — Board Denies at Final Review (After RSO Approval)

---

### Step B1 — Apply and Progress Through RSO Approval
**Who:** Applicant B (Owen Batho), then Board, then RSO
**Where:** Portal, Admin Portal, Email

**Action:** Progress Owen's application through the following stages:
1. Submit Full Individual application (Scene 01 Steps 1–7)
2. Confirm documents (Step 8)
3. Board approves for RSO review (Step 9)
4. RSO approves all documents via one-time links (Step 10)
5. Board receives RSO approval notification — application is now in "board_final_review"

**Check:** Owen's application status = "board_final_review" before proceeding

---

### Step B2 — Board Denies at Final Review
**Who:** Board Member
**Where:** Admin Portal → Applications

**Action:**
1. Open Owen Batho's application (status = board_final_review)
2. Click **"Deny"** (final review denial)
3. Enter reason: "After further review, the board has voted not to approve this application at this time."
4. Confirm

**Check:**

**Applications sheet:**
- status = "denied"
- board_final_status = "denied"
- board_final_reviewed_by = board member email
- board_final_review_date = today

**RSO documents already approved — verify these are NOT reversed:**
- File Submissions rows remain at "gea_pending" or "approved" (RSO approval is not undone)

**Applicant email:**
- Owen receives: MEM_APPLICATION_DENIED_TO_APPLICANT
- Reason included in email

**Applicant portal:**
- Status = "denied"
- Payment page is NOT accessible (was never accessible, and still isn't)
- No payment row created in Payment Tracking

**Fail if:** Payment page becomes accessible despite denial, or RSO document statuses were incorrectly reversed

---

### Step B3 — Confirm Documents Are Not Activated
**Who:** Board Member
**Where:** Sheets — Member Directory

**Action:** Check Owen's Households and Individuals rows

**Check:**
- active = FALSE for both Households and Individuals
- No membership_start_date or membership_expiration_date set

**Fail if:** active = TRUE (this would be a critical bug — denied applicant gaining membership)

---

## Completion Criteria

Part A is **PASS** when:
- Nina receives denial email with reason
- Application status = "denied"
- Nina cannot access payment page

Part B is **PASS** when:
- Owen receives denial email with reason after RSO had approved documents
- Application status = "denied"
- RSO document approvals are unaffected
- No activation occurred
