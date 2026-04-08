# Scene 01 — Full Individual: Complete Happy Path

**Order:** Run first. This is the baseline scene. All other scenes reference this one for shared steps.

**What this tests:**
- Eligibility questionnaire routing to Full membership
- Application record creation (Households, Individuals, Applications sheets)
- Board initial review and approval
- RSO document upload and one-time approval link
- Board final review and approval
- Payment dues display (category, quarter, pro-ration, live exchange rate)
- Payment submission via PayPal (USD)
- Treasurer payment approval
- Full membership activation

---

## Cast

| Role | Who | Access |
|------|-----|--------|
| **Applicant** | Test person — use real email you can receive | Public website → Portal |
| **Board Member** | board@geabotswana.org | Admin Portal (email + password) |
| **RSO Approver** | rso-approve@geabotswana.org | One-time email link; Admin Portal (rso role) |
| **Treasurer** | board@geabotswana.org (or treasurer@) | Admin Portal (email + password) |

**Admin Portal login note:** Admin credentials are stored in the Administrators tab of the System Backend workbook (not in the Individuals sheet). Each admin logs in with their email and password. Contact the board chair if you need credentials issued or reset.

**Suggested test data:**
- Applicant name: Alice Thornton
- Applicant email: use a real inbox you control (e.g. a personal Gmail)
- Household name will be: Thornton

---

## Pre-conditions

- No existing application for this email address
- At least one active Full member in the system (any household) — needed to confirm sponsor requirement does NOT apply to Full members
- Membership Pricing sheet has an active row for `full_indiv` for the current membership year

---

## Steps

---

### Step 1 — Navigate to the Application Form
**Who:** Applicant
**Where:** Public website (geabotswana.org) → Member Login → Portal login page

**Action:**
1. Go to the Member Portal login page
2. Click "Apply for Membership" (or equivalent link below the login form)
3. Confirm the application form loads with Step 1 (Eligibility Questionnaire) visible

**Check:**
- Application form is visible
- Step 1 heading reads something like "Eligibility Questionnaire" or "Step 1 of..."
- No errors

**Fail if:** Page shows an error, redirects unexpectedly, or the Apply link is missing

---

### Step 2 — Complete Eligibility Questionnaire (Full path)
**Who:** Applicant
**Where:** Portal — Application Form Step 1

**Action:**
1. **Q1:** "Are you a U.S. Direct-Hire employee of the United States Government?" → Select **YES**
2. **Q1b:** "Are you in Botswana on temporary duty or as an official visitor?" → Select **NO** (permanent posting)
3. Confirm the assigned category displayed is **"Full"**
4. **Household Type:** Select **"Individual"**
5. Click Next / Continue

**Check:**
- Category displayed = "Full"
- Household type selection is visible
- "Individual" option is selected
- The form advances to Step 2 (Personal Information)

**Fail if:** Category shows anything other than "Full", or household type selection doesn't appear

---

### Step 3 — Complete Personal Information
**Who:** Applicant
**Where:** Portal — Application Form Step 2

**Action:** Fill in all required fields:
- First Name: Alice
- Last Name: Thornton
- Email: [your test email]
- Phone: [any valid number with country code]
- WhatsApp: check the box if applicable
- Country of Citizenship: United States
- Employment Office: Embassy of the United States, Gaborone
- Job Title: [any title, e.g. Political Officer]
- Posting Date: [a past date, e.g. 2024-08-01]
- Departure Date: [a future date, e.g. 2027-07-31]

**Action:** Click Submit / Next to submit the application

**Check:**
- No validation errors
- Form submits without error
- A confirmation message or next step appears (e.g. "Application received — check your email for login credentials")

**Fail if:** Form shows validation errors on valid data, or submission produces an error

---

### Step 4 — Verify Application Records Created
**Who:** Board Member (or anyone with Sheets access)
**Where:** Google Sheets — Member Directory workbook

**Action:** Open Member Directory → check the following tabs:

**Households tab:**
- New row exists with household_name = "Thornton" (or "Alice Thornton")
- active = FALSE
- application_status = "awaiting_docs" (or similar initial status)
- membership_level_id = "full_indiv"

**Individuals tab:**
- New row exists with first_name = "Alice", last_name = "Thornton"
- email = [test email]
- active = FALSE
- role = "member" (not yet activated)

**System Backend → Membership Applications tab:**
- New row with email = [test email]
- status = "awaiting_docs"
- membership_category = "Full"
- household_type = "Individual"

**Check:**
- All three rows exist
- household_id and individual_id are auto-generated (e.g. HSH-2026-XXXX, IND-2026-XXXX)
- household_id on the Individuals row matches the Households row
- application_id is generated (e.g. APP-2026-XXXX)

**Fail if:** Any row is missing, IDs don't match across tables, or status is wrong

---

### Step 5 — Applicant Receives Welcome Email with Credentials
**Who:** Applicant
**Where:** Inbox for [test email]

**Action:** Check inbox for welcome email

**Check:**
- Email received from board@geabotswana.org
- Contains a temporary password
- Contains instructions to log in and upload documents
- Template: MEM_ACCOUNT_CREDENTIALS_TO_APPLICANT

**Fail if:** No email received within 2 minutes, or email contains broken placeholders ({{FIRST_NAME}} not replaced)

---

### Step 6 — Applicant Logs In and Sees Non-Member Portal
**Who:** Applicant
**Where:** Portal login page

**Action:**
1. Enter email and temporary password from Step 5
2. Log in

**Check:**
- Login succeeds
- Applicant is directed to the **Non-Member Portal** (not the regular member portal)
- Dashboard shows status card: "awaiting_docs" or equivalent message
- Navigation shows: Dashboard, Documents, My Household, Help (Payment and Status may be hidden at this stage)
- Action Items card shows "Upload required identity documents for each listed household member"

**Fail if:** Login fails, applicant sees the regular member portal, or dashboard shows wrong status

---

### Step 7 — Applicant Uploads Documents
**Who:** Applicant
**Where:** Non-Member Portal → Documents page

**Action:**
1. Click "Documents" in navigation
2. Find the primary applicant section (Alice Thornton)
3. Upload a **Passport** document (use any PDF or JPG test file, max 5MB)
4. Upload a **Photo** (use any JPG test file)
5. Confirm each upload shows a "Pending" status after upload

**Check:**
- Both uploads succeed
- Each document shows status: "Pending" or "Submitted"
- File Submissions tab in Member Directory Sheets shows new rows:
  - individual_id = Alice's IND-XXXX
  - document_type = "passport" and "photo" respectively
  - status = "submitted"

**Fail if:** Upload fails, file size error on a file under 5MB, rows not created in File Submissions tab

---

### Step 8 — Applicant Confirms Documents Submitted
**Who:** Applicant
**Where:** Non-Member Portal → Documents page

**Action:**
1. After uploading both documents, click "Confirm All Documents Submitted" (or equivalent confirmation button)
2. Confirm a success message appears

**Check:**
- Confirmation succeeds
- Dashboard status card updates to "docs_confirmed" or "board_initial_review"
- Membership Applications sheet: status advances to "board_initial_review"
- Board receives notification email (check board@geabotswana.org inbox): ADM_NEW_APPLICATION_BOARD_TO_BOARD

**Fail if:** Confirmation button is missing, status doesn't advance, or board doesn't receive email

---

### Step 9 — Board Reviews Application (Initial Review)
**Who:** Board Member
**Where:** Admin Portal → Applications section

**Action:**
1. Log in to Admin Portal with email and password (board@geabotswana.org). The Admin Portal login screen now has both an email and password field — this is different from the member portal.
2. Navigate to Applications
3. Find Alice Thornton's application (filter by "Board Review" status if needed)
4. Click to open the application detail
5. Review: confirm category = Full, household_type = Individual, documents shown
6. Click **"Approve for RSO Review"**

**Check:**
- Application status in sheet advances to "rso_docs_review"
- RSO receives email to rso-approve@geabotswana.org: ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE
  - Email contains applicant name, application ID, and one-time approval link (for EACH submitted document)
- Applicant portal status card updates to "rso_review"
- Board receives copy: ADM_DOCS_SENT_TO_RSO_TO_BOARD (rso_contact shows rso-approve@geabotswana.org)

**Fail if:** Approval button missing, status doesn't advance, RSO email not received, email contains unreplaced placeholders

---

### Step 10 — RSO Approves Documents via One-Time Link
**Who:** RSO Approver
**Where:** Email inbox for rso-approve@geabotswana.org

**Action:**
1. Open the email received in Step 9
2. Find the one-time approval link for the Passport document
3. Click the link — it should open a simple approval page in the browser
4. Select **"Approve"** and submit
5. Repeat for the Photo document if a separate link was sent

**Check:**
- Link opens correctly (not expired, not already used)
- Approval page shows the applicant name and document type
- After approving: page shows "Document approved successfully" or equivalent
- File Submissions sheet: passport row status = "gea_pending", rso_reviewed_by = "rso-approve@geabotswana.org", rso_review_date populated
- Photo row: status = "approved" (photos are 1-tier — goes straight to approved, or gea_pending depending on implementation)

**Fail if:** Link is expired, approval fails, sheet doesn't update, can use the link a second time (should show "already used" error)

---

### Step 11 — Board Receives RSO Approval Notification
**Who:** Board Member
**Where:** Inbox for board@geabotswana.org

**Action:** Check inbox for RSO approval notification

**Check:**
- Email received: ADM_BOARD_APPROVED_FOR_RSO_TO_BOARD
- Email states RSO has approved documents and application is ready for final board review
- Membership Applications sheet: status = "board_final_review"

**Fail if:** Email not received, or status didn't advance to board_final_review

---

### Step 12 — Board Gives Final Approval
**Who:** Board Member
**Where:** Admin Portal → Applications

**Action:**
1. Open Alice Thornton's application
2. Confirm status is "Board Final Review"
3. Click **"Approve Membership"** (final approval button)

**Check:**
- Application status advances to "approved_pending_payment"
- Applicant receives email: MEM_APPLICATION_APPROVED_TO_APPLICANT
  - Email should mention next step is payment
- Applicant portal (if applicant refreshes): Payment page is now accessible
- Navigation now shows "Payment" link

**Fail if:** Final approval button missing, status doesn't advance, applicant not notified

---

### Step 13 — Applicant Views Dues Breakdown
**Who:** Applicant
**Where:** Non-Member Portal → Payment page

**Action:**
1. Log in (or refresh) to Non-Member Portal
2. Navigate to "Payment"
3. Examine the Dues Breakdown card

**Check the following values are correct:**
- **Membership Category:** Full
- **Annual Dues (USD):** matches the value in Membership Pricing sheet for `full_indiv` current year
- **Current Quarter:** correct for today's date (Q3 = Feb–Apr, Q4 = May–Jul, Q1 = Aug–Oct, Q2 = Nov–Jan)
- **Pro-ration %:** matches quarter (Q1=100%, Q2=75%, Q3=50%, Q4=25%)
- **Pro-rated Amount (USD):** Annual × pro-ration % (verify arithmetic)
- **Exchange Rate:** live rate (should NOT be 13.45 if the nightly task has run; check Configuration sheet for exchange_rate_usd_to_bwp)
- **Pro-rated Amount (BWP):** Pro-rated USD × exchange rate (verify arithmetic)

**Check payment methods displayed:**
- PayPal (USD) — with geaboard@gmail.com
- SDFCU Member2Member (USD) — with code GEA2026
- Zelle (USD) — with geaboard@gmail.com
- Absa (BWP) — with account details

**Check:**
- Payment submission form IS visible (status = approved_pending_payment)
- Membership year dropdown shows the correct current year (e.g. 2025-26)
- Amount Due updates when year is changed in dropdown

**Fail if:** Any value is hardcoded (wrong amount, rate shows 13.45 when live rate differs), SDFCU method missing, form not visible, year dropdown empty

---

### Step 14 — Applicant Submits Payment Proof (PayPal USD)
**Who:** Applicant
**Where:** Non-Member Portal → Payment page → submission form

**Action:**
1. In the payment form, select **"PayPal (USD)"** as method
2. Enter today's date as transaction date
3. In Notes, enter: "Paid $[amount] via PayPal to geaboard@gmail.com. Transaction ID: TEST-001"
4. Upload a test file as proof (any small JPG or PDF)
5. Click **"Submit Payment"**

**Check:**
- Submission succeeds (no error)
- Payment status card updates: "Payment submitted — awaiting treasurer verification"
- Membership Applications sheet: status = "payment_submitted", payment_status = "submitted"
- Payment Tracking → Payments sheet: new row with application_id, method = "PayPal (USD)", status = "submitted"
- Treasurer receives notification email (check board@ or treasurer@ inbox): PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD
- Applicant receives confirmation: PAY_PAYMENT_SUBMITTED_TO_MEMBER or PAY_PAYMENT_PROOF_RECEIVED_TO_MEMBER

**Fail if:** Submission fails, payment row not created, treasurer not notified, applicant not notified

---

### Step 15 — Treasurer Reviews Pending Payment
**Who:** Treasurer
**Where:** Admin Portal → Payments → Pending Verification

**Action:**
1. Log in to Admin Portal with email and password (treasurer@ or board@geabotswana.org)
2. Navigate to Payments → Pending Verification
3. Confirm Alice Thornton's payment appears in the list
4. Click to open payment detail
5. Verify: method = PayPal (USD), notes visible, proof file downloadable (if uploaded)

**Check:**
- Payment appears in pending list
- Details match what applicant submitted
- Approve / Reject / Request Clarification buttons visible

**Fail if:** Payment not in list, details missing or wrong, action buttons missing

---

### Step 16 — Treasurer Approves Payment and Activates Membership
**Who:** Treasurer
**Where:** Admin Portal → Payments → Pending Verification

**Action:**
1. Click **"Approve"** on Alice Thornton's payment

**Check all of the following:**

**Payment Tracking sheet:**
- Payments row: status = "verified", verified_by = treasurer email, verification_timestamp populated

**Member Directory — Households sheet:**
- active = TRUE
- membership_start_date = today
- membership_expiration_date = next July 31
- approved_by = treasurer email

**Member Directory — Individuals sheet:**
- Alice's row: active = TRUE

**System Backend — Membership Applications sheet:**
- status = "activated"
- payment_status = "verified"

**Emails received:**
- Applicant receives: MEM_MEMBERSHIP_ACTIVATED_TO_MEMBER (welcome to GEA, full portal access)
- Board receives: ADM_BOARD_FINAL_APPROVAL_TO_BOARD

**Applicant portal (if applicant logs out and logs back in):**
- Should now be redirected to the **regular Member Portal** (not non-member portal)
- Dashboard shows household info and upcoming reservations
- Reservations, Profile, Membership Card pages all accessible

**Fail if:** Any sheet update missing, either email not received, or applicant still sees non-member portal

---

## Completion Criteria

This scene is **PASS** when all 16 steps complete with all checks satisfied.

Key end state:
- Alice Thornton is an active Full Individual member
- All three IDs exist and are consistent: HSH-XXXX, IND-XXXX, APP-XXXX, payment_id
- She can log in to the regular Member Portal
- Her record will be reused in Scene 09 for post-activation verification
