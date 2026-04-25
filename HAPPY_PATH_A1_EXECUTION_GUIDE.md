# Happy Path A1 Execution Guide
**Full Member (Embassy Employee) - Complete Workflow**

**Last Updated:** April 25, 2026  
**Test Scenario:** A1 from MEMBERSHIP_APPLICATION_TESTING_PLAN.md  
**Expected Duration:** 45-60 minutes

---

## Test Overview

This guide walks through the complete Happy Path A1 workflow for a Full Member applicant who is a direct US Government employee. The applicant will complete all 11 steps of the membership application process through approval and account activation.

**Key Checkpoints:**
1. Application submission (auto-assigns Full category)
2. Document upload (Passport + Omang)
3. Board initial approval
4. RSO document approval
5. Board final approval
6. Payment submission & verification
7. Account activation

---

## Phase 1: Create Test Applicant Account

### Step 1.1: Set up new test user credentials
- **Email:** (Create unique test email, e.g., `a1_test_applicant@example.com`)
- **Password:** (Set strong password for testing)
- **Name:** Test A1 Embassy Employee (or realistic name)
- **Country Code:** BW (Botswana) or US (as appropriate)
- **Phone:** (Any valid test phone)

### Step 1.2: Access Portal Login
1. Navigate to GEA Member Portal: https://script.google.com/a/macros/geabotswana.org/s/[DEPLOYMENT_ID]/exec
2. You should see the login screen
3. Click "Apply for Membership" link (if no existing account)

**Expected Result:** Application form should appear with multiple steps

---

## Phase 2: Submit Membership Application (Step 1)

### Step 2.1: Fill Application Form - Step 1: Basic Information

**Form Fields:**
- **Primary Applicant Name:** Test A1 Embassy Employee
- **Email Address:** a1_test_applicant@example.com
- **Phone (Primary):** +267 71234501
- **Phone Type:** Indicate if WhatsApp (optional)
- **Country Code:** BW (Botswana)
- **Household Type:** Individual or Family (select: **Individual**)

**Expected Behavior:**
- All fields should accept input
- Validation should pass for valid data
- No errors should appear

### Step 2.2: Employment Information (Step 2)

**Q1: "Are you a direct US Government employee?"** → **YES ✓**

**Expected Behavior:**
- Answering YES should trigger Full Member category assignment
- Other eligibility questions (Q2, Q3, Q4, Q5) should be skipped or ignored
- System should NOT ask about alternative funding sources

**Employment Fields (if shown):**
- Job Title: "Consular Officer" (or other US Government role)
- Employment Start Date: 2025-06-15
- Employment End Date: 2028-06-15 (if applicable)

**Expected Validation:**
- Employment dates should be optional or auto-calculated
- No employment verification document should be required (Full Members don't need it)

### Step 2.3: Membership Category Review (Step 3)

**Expected Display:**
- System shows: **Category: Full Member**
- Dues amount should be displayed (e.g., $250 USD annual)
- Required documents clearly listed:
  - Passport (required)
  - Omang (required) OR one valid ID is sufficient
  - Photo (optional)

**What NOT to expect:**
- No funding verification form (only for Associates)
- No TDY orders form (only for Temporary)
- No diplomatic accreditation form (only for Diplomatic)
- No employment verification (Full Members don't need it)

### Step 2.4: Household Information (Step 4)

**If Household Type = Individual:**
- Should show "Primary applicant only"
- No "Add Family Member" option needed

**If Household Type = Family:**
- Provide spouse and children information as needed
- Relationships: Spouse, Child
- Citizenship for each member

### Step 2.5: Rules Agreement (Step 5)

**Expected Fields:**
- Checkbox: "I have read and agree to GEA Facility Rules"
- Certification checkbox: "I certify that all information provided is accurate"

**Buttons Tested:** ✓ Continue button

### Step 2.6: Document Upload Preview (Step 6)

**Expected Display:**
- List of required documents with checkboxes:
  - [ ] Passport (required)
  - [ ] Omang (required)
  - [ ] Photo (optional)

**No file upload at this stage** - just confirmation

### Step 2.7: Final Submission (Step 7)

**Expected Fields:**
- Summary of application
- Rules agreement checkbox
- **Certification:** "I certify that all above information is accurate"

**Final Validation Before Submit:**
- All required fields completed
- Rules agreement accepted
- Certification checkbox checked

**Button Tested:** 
- ✓ **[Submit Application]** (green button)

### Expected Response After Submission:
```
✅ Success!
Application ID: APP-2026-XXXXX
Your application has been received.
Next steps: Upload required documents.
```

**System Generates:**
- Unique Application ID (APP-2026-XXXXX)
- Household ID (HSH-2026-XXXXX)
- Individual ID (IND-2026-XXXXX)
- Temp password for applicant

**Application Status:** `awaiting_docs` (waiting for documents)

---

## Phase 3: Upload Required Documents (Step 2)

### Step 3.1: Login to Applicant Portal
1. Log out if needed
2. Use applicant credentials:
   - Email: a1_test_applicant@example.com
   - Password: (from application confirmation or reset)
3. Portal should show "Application Status" page

**Expected Display:**
- Application ID
- Status: "Awaiting Documents"
- Required documents checklist:
  - [ ] Passport - Not uploaded
  - [ ] Omang - Not uploaded
  - [ ] Photo - Not uploaded

### Step 3.2: Upload Passport Document

**Actions:**
1. Click **[Upload Passport]** button
2. Select passport image file (can be any valid image for testing)
3. System should accept the file
4. Confirm upload

**File Requirements (typical):**
- Format: JPG, PNG, PDF
- Size: < 5 MB (or system-specified limit)
- Valid image file (must not be corrupted)

**Expected Result:**
- Document status: "Submitted" (⏳)
- Upload timestamp recorded
- File stored in GEA system

**Button Tested:** ✓ **[Upload Passport]**

### Step 3.3: Upload Omang (National ID) Document

**Actions:**
1. Click **[Upload Omang]** button
2. Select omang image file
3. Confirm upload

**Expected Result:**
- Document status: "Submitted" (⏳)
- Both Passport and Omang now showing "Submitted"
- Photo remains "Not uploaded"

**Button Tested:** ✓ **[Upload Omang]**

### Step 3.4: Confirm Documents Uploaded (Optional Photo)

**Actions:**
1. Review uploaded documents
2. Photo is optional for Full Members
3. Click **[Confirm All Documents Uploaded]** button

**Expected Behavior:**
- System validates that required documents are submitted
- Photo can be skipped
- Application moves to next status

**Button Tested:** ✓ **[Confirm Documents Uploaded]**

**New Application Status:** `rso_docs_review` (RSO reviewing documents)

---

## Phase 4: Board Initial Review (Step 3)

### Step 4.1: Login to Admin Portal as Board Member

**Credentials:**
- Email: board@geabotswana.org (or designated board member)
- Requires board role

**Navigation:**
1. Admin Portal URL
2. Login with board credentials
3. Navigate to: **Applications** → **Pending Applications** section

### Step 4.2: Find Application in Board Review Queue

**Expected Queue Display:**
- Application List showing:
  - Application ID: APP-2026-XXXXX
  - Applicant Name: Test A1 Embassy Employee
  - Category: Full Member
  - Status: "Initial Board Review"
  - Submitted Date: [date]

### Step 4.3: Open Application for Review

**Actions:**
1. Click on the application
2. Review application details:
   - Applicant info
   - Employment status: US Government employee ✓
   - Category: Full Member ✓
   - Household type: Individual ✓

### Step 4.4: Board Initial Review Decision

**Options:**
- [ ] Approve (Continue to next step)
- [ ] Reject (Requires rejection reason)
- [ ] Request clarification

**Test Path: APPROVE**

**Actions:**
1. Click **[Approve Application]** button
2. Confirm approval

**Expected Result:**
- Application status changes to: `rso_docs_review` (or equivalent)
- Documents move to RSO review queue
- Board review timestamp recorded

**Button Tested:** ✓ **[Approve Application (Board Initial)]**

**Audit Trail:**
- Log entry: "Board initial review approved by [admin email]"
- Date: [current date]

---

## Phase 5: RSO Document Verification (Step 4)

### Step 5.1: Login to Admin Portal as RSO Reviewer

**Credentials:**
- Email: (RSO reviewer account, typically rso_approve role)
- Must have document review permissions

**Navigation:**
1. Admin Portal → **Documents** or **RSO Reviews**
2. Find applications pending document review

### Step 5.2: Find Application in RSO Review Queue

**Expected Queue Display:**
- Application ID: APP-2026-XXXXX
- Applicant: Test A1 Embassy Employee
- Status: "RSO Document Review"
- Documents pending: Passport, Omang

### Step 5.3: Review Uploaded Documents

**Actions:**
1. Click to view Passport document
2. Verify it's a valid image file
3. Assess quality (not too blurry, not missing info, etc.)
4. Click to view Omang document
5. Same verification process

**RSO Checklist:**
- [ ] Passport image is clear and legible
- [ ] Omang image is clear and legible
- [ ] Both show applicant information
- [ ] No obvious fraud or document forgery

### Step 5.4: RSO Decision - APPROVE ALL

**Options for Each Document:**
- [ ] Approve
- [ ] Reject (requires reason, like "Image too blurry")
- [ ] Request clarification

**Test Path: APPROVE BOTH**

**Actions:**
1. Click **[Approve]** for Passport
2. Click **[Approve]** for Omang
3. Confirm all approvals

**Expected Result:**
- Passport status: "RSO Approved" (✓)
- Omang status: "RSO Approved" (✓)
- Application moves to Board Final Review

**Button Tested:** ✓ **[Approve Document (RSO)]** (2x - one for each doc)

**Document Status Updates:**
- Passport: `submitted` → `rso_approved` → `gea_pending`
- Omang: `submitted` → `rso_approved` → `gea_pending`

**New Application Status:** `board_final_review`

---

## Phase 6: Board Final Review (Step 5)

### Step 6.1: Login to Admin Portal as Board Member (Final Review)

**Same board credentials** used in Phase 4

**Navigation:**
1. Admin Portal → **Applications**
2. Look for applications in "Final Board Review" queue

### Step 6.2: Find Application for Final Review

**Expected Queue Display:**
- Application ID: APP-2026-XXXXX
- Applicant: Test A1 Embassy Employee
- Status: "Final Board Review"
- Documents: All approved by RSO ✓

### Step 6.3: Review and Approve

**Checklist:**
- [ ] Application eligible for Full Member
- [ ] All required documents approved by RSO
- [ ] Household information complete
- [ ] No issues or concerns

**Actions:**
1. Click **[Approve Final]** or similar button
2. Confirm approval

**Expected Result:**
- Application status: `approved_pending_payment`
- Email sent to applicant with payment instructions
- Payment details shown (amount due, accepted payment methods, deadline)

**Button Tested:** ✓ **[Approve Application (Board Final)]**

**Email Sent:** ✓ Application approved - payment required
- Contains: dues amount, payment instructions, deadline

**New Application Status:** `approved_pending_payment`

---

## Phase 7: Payment Submission (Step 6)

### Step 7.1: Login as Applicant

**Credentials:**
- Email: a1_test_applicant@example.com
- Password: (applicant password)

**Navigation:**
1. Portal → **Applicant Portal** (or auto-routed)
2. Should see "Payment Required" status

### Step 7.2: Review Payment Requirements

**Expected Display:**
- Amount Due: $250 USD (annual dues for Full Member)
- Due Date: [30 days from approval, or specified date]
- Accepted Methods: Bank transfer, Stripe, etc.
- Reference: Application ID: APP-2026-XXXXX

### Step 7.3: Submit Payment Proof

**Actions:**
1. Click **[Submit Payment Proof]** button
2. Fill payment details:
   - Amount: $250
   - Currency: USD
   - Method: [Select method, e.g., "Bank Transfer"]
   - Payment Date: [Date of payment, e.g., 2026-04-25]
   - Reference/Receipt: [Paste proof or transaction number]
3. Attach receipt/proof (image or document)
4. Click **[Submit]**

**Expected Fields:**
- [ ] Amount (required)
- [ ] Currency (required)
- [ ] Payment Method (required)
- [ ] Payment Date (required)
- [ ] Receipt/Proof (file upload or text)

**Button Tested:** ✓ **[Submit Payment Proof]**

**Expected Result:**
- Payment submission recorded
- Status: `payment_submitted` (⏳)
- Message: "Payment submitted for verification. Treasurer will review shortly."

**Application Status:** `awaiting_payment_verification`

---

## Phase 8: Payment Verification (Treasurer Review) (Step 7)

### Step 8.1: Login to Admin Portal as Treasurer

**Credentials:**
- Email: treasurer@geabotswana.org (or designated treasurer)
- Requires payment verification role

**Navigation:**
1. Admin Portal → **Payments** or **Payment Verification**
2. Find "Pending Payment Reviews"

### Step 8.2: Find Payment in Queue

**Expected Queue Display:**
- Application ID: APP-2026-XXXXX
- Applicant: Test A1 Embassy Employee
- Amount Submitted: $250 USD
- Submitted Date: [date]
- Status: "Awaiting Verification"

### Step 8.3: Review Payment Proof

**Actions:**
1. Click to view payment proof/receipt
2. Verify:
   - [ ] Amount matches ($250 USD)
   - [ ] Payment method is acceptable
   - [ ] Receipt is legitimate
   - [ ] Date is reasonable

### Step 8.4: Treasurer Decision - APPROVE

**Options:**
- [ ] Approve (Payment verified, activate account)
- [ ] Reject (Clear rejection with reason)
- [ ] Request Clarification (Ask applicant for more info)

**Test Path: APPROVE**

**Actions:**
1. Click **[Approve Payment]**
2. Confirm approval

**Expected Result:**
- Payment status: `verified` ✓
- Application status: `activated` ✓
- Account activated
- Email sent to applicant with activation confirmation

**Button Tested:** ✓ **[Approve Payment]**

**Emails Sent:**
- ✓ Membership activated - welcome email
- ✓ Login credentials or reset link
- ✓ Information on member portal access

---

## Phase 9: Verify Account Activation (Step 8)

### Step 9.1: Login as New Member

**Credentials:**
- Email: a1_test_applicant@example.com
- Password: (provided in welcome email or reset)

### Step 9.2: Check Portal Access

**Expected Result - Dashboard Page Should Show:**
- ✓ Membership Status: **Member**
- ✓ Member Since: [activation date]
- ✓ Membership Expiration: [one year from activation]
- ✓ Household Type: Individual
- ✓ Full Member

### Step 9.3: Access Member Features

**Buttons/Pages Now Available:**
- ✓ Dashboard (overview)
- ✓ Reservations (facility booking)
- ✓ Member Profile (edit household info)
- ✓ My Household (family members, if applicable)
- ✓ Payment History
- ✓ Membership Card
- ✓ Facility Rules

**Pages Should NOT Be Available:**
- ✗ Application Tracker (only for applicants)
- ✗ Applicant Portal

### Step 9.4: Membership Card

**Actions:**
1. Click **[View Membership Card]** or navigate to Card page
2. Card should display:
   - Name: Test A1 Embassy Employee
   - Membership Type: Full Member
   - Card Number: [unique ID]
   - Expiration: [one year from activation]
   - Valid from: [activation date]

**Expected Display:**
- Professional card format
- QR code (if supported)
- Member photo (if uploaded)
- Facility information on back

---

## Test Summary Checklist

### ✓ All Buttons Tested:
- [x] Submit Application (main submit button)
- [x] Upload Passport
- [x] Upload Omang
- [x] Confirm Documents Uploaded
- [x] Approve Application (Board Initial)
- [x] Approve Document (RSO) - 2 documents
- [x] Approve Application (Board Final)
- [x] Submit Payment Proof
- [x] Approve Payment (Treasurer)

### ✓ Statuses Verified:
- [x] awaiting_docs (after submit)
- [x] rso_docs_review (after confirm docs)
- [x] board_final_review (after board initial approval + RSO approval)
- [x] approved_pending_payment (after board final approval)
- [x] awaiting_payment_verification (after payment submission)
- [x] activated (after payment verification)

### ✓ Features Verified:
- [x] Category auto-assignment: Full Member ✓
- [x] Document requirements correct
- [x] Email notifications sent at each stage
- [x] Member portal access unlocked
- [x] Membership card displayable
- [x] Portal pages accessible (Dashboard, Reservations, Profile, etc.)

### ✓ Audit Trail:
- [x] All decisions logged with timestamps
- [x] User emails recorded for each action
- [x] Application status history complete

---

## Troubleshooting

### If Application Submission Fails:
- Check that certification checkbox is checked
- Verify all required fields are filled
- Check browser console for errors (F12)
- Verify token is valid (should be auto-set)

### If Documents Don't Upload:
- Ensure file size < 5 MB
- Use common formats: JPG, PNG, PDF
- Check that individual_id matches applicant
- Verify document_type is valid (passport, omang, photo)

### If Board Review Button Doesn't Appear:
- Verify logged in as board role
- Check application status is "Initial Board Review"
- Application should be in the pending queue

### If Payment Verification Doesn't Work:
- Verify logged in as treasurer
- Check payment status is "payment_submitted"
- Verify amount matches dues

---

## Notes

- All dates use **Africa/Johannesburg timezone** (GMT+2)
- Dues amounts are set in Configuration tab
- Test can be re-run with different credentials for parallel scenarios
- Clean test data before re-running (optional)

**Test Completed:** ___________  
**Tester Name:** ___________  
**Issues Found:** ___________  

