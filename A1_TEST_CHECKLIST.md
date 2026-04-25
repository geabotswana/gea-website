# Happy Path A1 - Printable Test Checklist
**Full Member (Embassy Employee) - Complete Workflow**

**Test Date:** ___________  
**Tester Name:** ___________  
**Start Time:** ___________  
**Environment:** ☐ Production ☐ Sandbox  

---

## Phase 1: Test Applicant Setup

### Create Test Email & Password
- [ ] Email: `a1_test_[DATE]@example.com` _______________
- [ ] Name: Test A1 Embassy Employee
- [ ] Password: (strong, saved securely) _______________
- [ ] Country: BW (Botswana)
- [ ] Phone: +267 71234501 or similar

---

## Phase 2: Application Submission

### Step 2.1: Basic Information ✓ PASS / ✗ FAIL
```
Primary Applicant Name: Test A1 Embassy Employee
Email: a1_test_[DATE]@example.com
Phone: +267 71234501
Country: BW
Household Type: Individual
```
- [ ] All fields accept input without errors
- [ ] Form validation passes
- [ ] No red error messages
- [ ] Can proceed to next step

**Notes:** _________________________________

### Step 2.2: Employment Information ✓ PASS / ✗ FAIL
```
Q1: "Are you a direct US Government employee?" → YES ✓
Job Title: Consular Officer
Employment Start: 2025-06-15
Employment End: 2028-06-15
```
- [ ] Q1 = YES triggers Full Member category
- [ ] Other questions (Q2, Q3, Q4, Q5) are skipped/ignored
- [ ] Employment fields accept input
- [ ] No employment verification document requested
- [ ] No funding form shown
- [ ] Can proceed to next step

**Category Assigned:** ☐ Full ☐ Associate ☐ Other (ERROR!)  
**Notes:** _________________________________

### Step 2.3: Category & Dues Review ✓ PASS / ✗ FAIL
```
Expected Category: Full Member
Expected Dues: $250 USD annual
Required Docs: Passport + Omang (or one valid ID)
```
- [ ] Category displays: "Full Member"
- [ ] Dues amount shown: $250 USD (or system amount)
- [ ] Document requirements clearly listed
- [ ] No unnecessary documents required
- [ ] Can proceed to next step

**Dues Amount Displayed:** $_________ USD  
**Required Docs Listed:** ☐ Passport ☐ Omang ☐ Photo (opt)  
**Notes:** _________________________________

### Step 2.4: Household Information ✓ PASS / �fail
```
Household Type: Individual (no family members)
```
- [ ] For Individual: Shows "Primary applicant only"
- [ ] No "Add Family Member" option appears
- [ ] No unnecessary family fields shown
- [ ] Can proceed to next step

**Notes:** _________________________________

### Step 2.5: Rules Agreement ✓ PASS / ✗ FAIL
```
[ ] I have read and agree to GEA Facility Rules
[ ] I certify all information is accurate
```
- [ ] Both checkboxes appear
- [ ] Cannot proceed without checking both
- [ ] Text is clear and readable
- [ ] Can proceed once both checked

**Notes:** _________________________________

### Step 2.6: Document Upload Preview ✓ PASS / ✗ FAIL
```
[ ] Passport (required)
[ ] Omang (required)
[ ] Photo (optional)
```
- [ ] Required documents listed
- [ ] Optional documents marked as optional
- [ ] Shows which docs must be uploaded
- [ ] No file upload at this stage
- [ ] Can proceed to final step

**Notes:** _________________________________

### Step 2.7: Final Submission ✓ PASS / ✗ FAIL
```
Certification: [ ] I certify all information is accurate
Button: [Submit Application]
```
- [ ] Certification checkbox visible
- [ ] Cannot submit without checking
- [ ] Submit button is enabled (green color)
- [ ] Spinner animation appears while processing
- [ ] Success message appears

**Button Tested:** ✓ **[Submit Application]**  
**Status After Submit:** awaiting_docs ☐ Correct ☐ Wrong  

### Expected Success Response:
```
✅ Success!
Application ID: APP-2026-___________
Next steps: Upload required documents.
```

**Application ID Received:** APP-2026-____________  
**Household ID:** HSH-2026-____________  
**Individual ID:** IND-2026-____________  
**Password/Token:** ________________________  

**Phase 2 Result:** ☐ PASS ☐ FAIL

---

## Phase 3: Document Upload

### Step 3.1: Login as Applicant ✓ PASS / ✗ FAIL
- [ ] Portal accessible
- [ ] Login with applicant email and password succeeds
- [ ] Dashboard shows "Application Status" page
- [ ] Status displays: "Awaiting Documents"
- [ ] Document upload buttons appear

**Notes:** _________________________________

### Step 3.2: Upload Passport ✓ PASS / ✗ FAIL
```
Action: Click [Upload Passport]
File: passport_valid.jpg or similar
Size: < 5 MB
```
- [ ] File dialog opens
- [ ] File selection works (JPG/PNG/PDF)
- [ ] Upload succeeds (no error)
- [ ] Status shows: "Submitted" (⏳)
- [ ] Timestamp recorded

**Button Tested:** ✓ **[Upload Passport]**  
**File Used:** _______________________  
**Status After Upload:** ☐ Submitted ☐ Error  

**Notes:** _________________________________

### Step 3.3: Upload Omang ✓ PASS / ✗ FAIL
```
Action: Click [Upload Omang]
File: omang_valid.jpg or similar
Size: < 5 MB
```
- [ ] File dialog opens
- [ ] File selection works
- [ ] Upload succeeds (no error)
- [ ] Status shows: "Submitted" (⏳)
- [ ] Both documents now show "Submitted"

**Button Tested:** ✓ **[Upload Omang]**  
**File Used:** _______________________  
**Status After Upload:** ☐ Submitted ☐ Error  

**Notes:** _________________________________

### Step 3.4: Confirm Documents ✓ PASS / ✗ FAIL
```
Action: Click [Confirm All Documents Uploaded]
Photo is OPTIONAL - skip it
```
- [ ] Confirm button enabled (both required docs uploaded)
- [ ] Photo is optional (no error if skipped)
- [ ] Button click succeeds
- [ ] Confirmation message appears
- [ ] Application status changes to: `rso_docs_review`

**Button Tested:** ✓ **[Confirm Documents Uploaded]**  
**New Status:** rso_docs_review ☐ Correct ☐ Wrong  

**Phase 3 Result:** ☐ PASS ☐ FAIL

---

## Phase 4: Board Initial Review

### Step 4.1: Login as Board Member ✓ PASS / ✗ FAIL
- [ ] Admin Portal accessible
- [ ] Login with board email: board@geabotswana.org
- [ ] Navigate to: Applications → Pending Board Review
- [ ] Application found in queue

**Board Email Used:** _______________________  
**Admin Portal URL:** _______________________  

**Notes:** _________________________________

### Step 4.2: Find Application ✓ PASS / ✗ FAIL
```
Look for: APP-2026-____________
Applicant: Test A1 Embassy Employee
Category: Full Member
Status: "Initial Board Review"
```
- [ ] Application visible in queue
- [ ] Correct applicant name shown
- [ ] Category confirmed: Full Member
- [ ] Status shows: "Initial Board Review"
- [ ] Can click to open application

**Notes:** _________________________________

### Step 4.3: Review Application Details ✓ PASS / ✗ FAIL
```
Check:
- Applicant name: Test A1 Embassy Employee ☐
- Employment status: US Government employee ☐
- Category: Full Member ☐
- Household: Individual ☐
```
- [ ] All details correct
- [ ] No obvious issues
- [ ] Ready to approve

**Notes:** _________________________________

### Step 4.4: Board Initial Review - APPROVE ✓ PASS / ✗ FAIL
```
Action: Click [Approve Application]
Decision: APPROVE (not reject)
```
- [ ] Approve button visible and clickable
- [ ] Confirmation dialog appears (optional)
- [ ] Approval succeeds
- [ ] Application status changes to: `rso_docs_review` or next stage
- [ ] Timestamp recorded

**Button Tested:** ✓ **[Approve Application (Board Initial)]**  
**New Status:** rso_docs_review ☐ Correct ☐ Wrong  

**Phase 4 Result:** ☐ PASS ☐ FAIL

---

## Phase 5: RSO Document Review

### Step 5.1: Login as RSO Reviewer ✓ PASS / ✗ FAIL
- [ ] Admin Portal accessible
- [ ] Login with RSO email: test_rso@example.com (or configured RSO)
- [ ] Navigate to: Documents → RSO Review Queue
- [ ] Application/documents found

**RSO Email Used:** _______________________  

**Notes:** _________________________________

### Step 5.2: Find Documents in Queue ✓ PASS / ✗ FAIL
```
Look for: APP-2026-____________
Applicant: Test A1 Embassy Employee
Documents: Passport, Omang
Status: "RSO Document Review"
```
- [ ] Application visible in queue
- [ ] Both documents listed
- [ ] Can click to review

**Notes:** _________________________________

### Step 5.3: Review Document 1: Passport ✓ PASS / ✗ FAIL
```
Action: Click to view Passport
Check: Image is clear, not blurry, shows applicant info
```
- [ ] Image displays properly
- [ ] Image is legible
- [ ] No obvious issues
- [ ] Ready to approve

**Document Quality:** ☐ Clear ☐ Blurry (ERROR) ☐ Damaged (ERROR)  

**Notes:** _________________________________

### Step 5.4: Review Document 2: Omang ✓ PASS / ✗ FAIL
```
Action: Click to view Omang
Check: Image is clear, shows national ID
```
- [ ] Image displays properly
- [ ] Image is legible
- [ ] No obvious issues
- [ ] Ready to approve

**Document Quality:** ☐ Clear ☐ Blurry (ERROR) ☐ Damaged (ERROR)  

**Notes:** _________________________________

### Step 5.5: RSO Approval - Passport ✓ PASS / ✗ FAIL
```
Action: Click [Approve] for Passport
Decision: APPROVE
```
- [ ] Approve button visible
- [ ] Button click succeeds
- [ ] Status changes: `submitted` → `rso_approved` → `gea_pending`
- [ ] Timestamp recorded

**Button Tested:** ✓ **[Approve Passport (RSO)]**  
**New Status:** rso_approved ☐ Correct ☐ Wrong  

**Notes:** _________________________________

### Step 5.6: RSO Approval - Omang ✓ PASS / ✗ FAIL
```
Action: Click [Approve] for Omang
Decision: APPROVE
```
- [ ] Approve button visible
- [ ] Button click succeeds
- [ ] Status changes: `submitted` → `rso_approved` → `gea_pending`
- [ ] Both documents now approved

**Button Tested:** ✓ **[Approve Omang (RSO)]**  
**New Status:** rso_approved ☐ Correct ☐ Wrong  

**Phase 5 Result:** ☐ PASS ☐ FAIL

---

## Phase 6: Board Final Review

### Step 6.1: Login as Board Member ✓ PASS / ✗ FAIL
- [ ] Admin Portal accessible
- [ ] Login with board email: board@geabotswana.org
- [ ] Navigate to: Applications → Board Final Review
- [ ] Application found in queue

**Notes:** _________________________________

### Step 6.2: Find Application for Final Review ✓ PASS / ✗ FAIL
```
Look for: APP-2026-____________
Status: "Board Final Review"
Documents: All approved by RSO ✓
```
- [ ] Application visible
- [ ] Status shows: "Board Final Review"
- [ ] Document approval shown (RSO checkmarks)
- [ ] Can click to open

**Notes:** _________________________________

### Step 6.3: Board Final Review Checklist ✓ PASS / ✗ FAIL
```
Verify:
- Category correct: Full Member ☐
- Documents approved: Passport ✓ Omang ✓ ☐
- Household complete ☐
- No outstanding issues ☐
```
- [ ] All items approved
- [ ] Ready to approve final

**Notes:** _________________________________

### Step 6.4: Board Final Approval ✓ PASS / ✗ FAIL
```
Action: Click [Approve Final]
Decision: APPROVE for final
```
- [ ] Approve button visible and clickable
- [ ] Approval succeeds
- [ ] Application status: `approved_pending_payment`
- [ ] Email sent to applicant with payment instructions

**Button Tested:** ✓ **[Approve Application (Board Final)]**  
**New Status:** approved_pending_payment ☐ Correct ☐ Wrong  
**Email Sent:** ☐ Payment instructions sent to applicant  

**Phase 6 Result:** ☐ PASS ☐ FAIL

---

## Phase 7: Payment Submission

### Step 7.1: Login as Applicant ✓ PASS / ✗ FAIL
- [ ] Portal accessible
- [ ] Login with applicant email: a1_test_[DATE]@example.com
- [ ] Status page shows: "Payment Required"
- [ ] Payment submission button visible

**Notes:** _________________________________

### Step 7.2: Review Payment Requirements ✓ PASS / ✗ FAIL
```
Amount Due: $250 USD (Full Member annual)
Accepted Methods: Bank transfer, Stripe, etc.
Reference: APP-2026-____________
```
- [ ] Amount clearly displayed: $250 USD
- [ ] Payment methods listed
- [ ] Deadline shown
- [ ] Instructions clear

**Amount Displayed:** $_________ USD  

**Notes:** _________________________________

### Step 7.3: Submit Payment Proof ✓ PASS / ✗ FAIL
```
Form Fields:
- Amount: 250 USD
- Currency: USD
- Method: Bank Transfer (example)
- Date: Today's date or payment date
- Receipt: [upload or paste]
```
- [ ] All fields present
- [ ] Amount field accepts "250"
- [ ] Currency dropdown has "USD"
- [ ] Payment method dropdown works
- [ ] Date picker works
- [ ] Receipt upload works
- [ ] Submit button enabled

**Form Fields Tested:**
- [ ] Amount: 250 ✓
- [ ] Currency: USD ✓
- [ ] Method: Bank Transfer ✓
- [ ] Date: 2026-04-25 ✓
- [ ] Receipt: [file uploaded] ✓

**Button Tested:** ✓ **[Submit Payment]**  
**New Status:** awaiting_payment_verification ☐ Correct ☐ Wrong  

**Phase 7 Result:** ☐ PASS ☐ FAIL

---

## Phase 8: Payment Verification

### Step 8.1: Login as Treasurer ✓ PASS / ✗ FAIL
- [ ] Admin Portal accessible
- [ ] Login with treasurer email: treasurer@geabotswana.org
- [ ] Navigate to: Payments → Pending Payment Reviews
- [ ] Payment found in queue

**Treasurer Email:** _______________________  

**Notes:** _________________________________

### Step 8.2: Find Payment in Queue ✓ PASS / ✗ FAIL
```
Look for: APP-2026-____________
Applicant: Test A1 Embassy Employee
Amount: $250 USD
Status: "Awaiting Verification"
```
- [ ] Payment visible in queue
- [ ] Correct amount shown: $250 USD
- [ ] Can click to review

**Notes:** _________________________________

### Step 8.3: Review Payment Proof ✓ PASS / ✗ FAIL
```
Verify:
- Amount matches: $250 USD ✓
- Method is acceptable: Bank Transfer ✓
- Receipt is legitimate ✓
- Date is reasonable ✓
```
- [ ] Proof document viewable
- [ ] All details match
- [ ] No red flags

**Notes:** _________________________________

### Step 8.4: Payment Verification - APPROVE ✓ PASS / ✗ FAIL
```
Action: Click [Approve Payment]
Decision: APPROVE (not reject)
```
- [ ] Approve button visible and clickable
- [ ] Approval succeeds
- [ ] Payment status: `verified`
- [ ] Application status: `activated`
- [ ] Email sent to applicant with activation confirmation

**Button Tested:** ✓ **[Approve Payment]**  
**New Status:** verified ☐ Correct ☐ Wrong  
**App Status:** activated ☐ Correct ☐ Wrong  
**Email Sent:** ☐ Activation confirmation sent  

**Phase 8 Result:** ☐ PASS ☐ FAIL

---

## Phase 9: Account Activation Verification

### Step 9.1: Login as New Member ✓ PASS / ✗ FAIL
- [ ] Portal accessible
- [ ] Login with applicant email: a1_test_[DATE]@example.com
- [ ] Dashboard loads (NOT applicant portal)
- [ ] Membership status shows: **Member**

**Portal Login:** ☐ Successful ☐ Failed (ERROR!)  

**Notes:** _________________________________

### Step 9.2: Dashboard Verification ✓ PASS / ✗ FAIL
```
Expected Display:
- Membership Status: Member ✓
- Member Type: Full Member ✓
- Member Since: [today's date] ✓
- Expiration: [one year from today] ✓
- Household: Individual ✓
```
- [ ] Status shows: "Member"
- [ ] Type shows: "Full Member"
- [ ] Dates correct
- [ ] No "Apply for Membership" link
- [ ] No "Awaiting Approval" message

**Displayed Status:** _______________  
**Displayed Type:** _______________  
**Member Since:** _______________  
**Expires:** _______________  

**Notes:** _________________________________

### Step 9.3: Member Features Available ✓ PASS / ✗ FAIL
```
Pages that SHOULD be accessible:
- [ ] Dashboard
- [ ] Reservations (facility booking)
- [ ] Profile (edit info)
- [ ] My Household (family, if applicable)
- [ ] Payment History
- [ ] Membership Card
- [ ] Facility Rules
- [ ] Renewal (if applicable)
```
- [ ] All pages listed above accessible
- [ ] Buttons respond to clicks
- [ ] No permission errors

**Pages Tested:**
- [ ] Dashboard ✓
- [ ] Reservations ✓
- [ ] Profile ✓
- [ ] My Household ✓
- [ ] Payment History ✓
- [ ] Membership Card ✓
- [ ] Rules ✓

**Notes:** _________________________________

### Step 9.4: Membership Card Display ✓ PASS / ✗ FAIL
- [ ] Card page loads
- [ ] Card displays:
  - [ ] Name: Test A1 Embassy Employee
  - [ ] Membership Type: Full Member
  - [ ] Valid from: [activation date]
  - [ ] Expires: [one year from activation]
  - [ ] Card number or member ID
  - [ ] GEA logo
  - [ ] QR code (if supported)
- [ ] Card is readable and professional looking

**Card Display:** ☐ Correct ☐ Issues  

**Notes:** _________________________________

### Step 9.5: Access Restrictions ✓ PASS / ✗ FAIL
```
Pages that should NOT be accessible:
- [ ] Application Tracker (applicants only)
- [ ] Admin Dashboard (members can't access)
```
- [ ] Cannot access applicant-only pages
- [ ] Cannot access admin functions
- [ ] Appropriate error messages if trying

**Notes:** _________________________________

**Phase 9 Result:** ☐ PASS ☐ FAIL

---

## Test Summary

### Overall Test Result: ☐ PASS ☐ FAIL

### Phases Completed:
- [ ] Phase 1: Test Applicant Setup
- [ ] Phase 2: Application Submission
- [ ] Phase 3: Document Upload
- [ ] Phase 4: Board Initial Review
- [ ] Phase 5: RSO Document Review
- [ ] Phase 6: Board Final Review
- [ ] Phase 7: Payment Submission
- [ ] Phase 8: Payment Verification
- [ ] Phase 9: Account Activation

### All Buttons Tested: ✓ COUNT: ____ / 9
- ✓ [Submit Application]
- ✓ [Upload Passport]
- ✓ [Upload Omang]
- ✓ [Confirm Documents]
- ✓ [Approve - Board Initial]
- ✓ [Approve Passport - RSO]
- ✓ [Approve Omang - RSO]
- ✓ [Approve - Board Final]
- ✓ [Approve Payment - Treasurer]

### Status Transitions Verified:
- [ ] awaiting_docs
- [ ] rso_docs_review
- [ ] board_final_review (or similar)
- [ ] approved_pending_payment
- [ ] awaiting_payment_verification
- [ ] activated

### Issues Found: ______
```
Issue 1: _________________________________
Issue 2: _________________________________
Issue 3: _________________________________
```

### Performance Notes:
- Form submission time: _________ seconds
- Document upload time: _________ seconds
- Email delivery time: _________ seconds
- Page load time (general): _________ seconds

### Browser/Environment:
- [ ] Chrome / [ ] Firefox / [ ] Safari / [ ] Other: _______
- [ ] Desktop / [ ] Mobile / [ ] Tablet
- [ ] Production / [ ] Sandbox
- [ ] Console errors: ☐ None ☐ Yes (describe): _______

### Logs Checked:
- [ ] GAS Execution Log - no errors
- [ ] Cloud Logs - no errors
- [ ] Browser Console (F12) - no errors
- [ ] Spreadsheets updated correctly

### Sign-off:
**Tester:** ___________________________  
**Date:** ___________________________  
**Time Completed:** ___________________________  
**Reviewed By:** ___________________________  

---

**CONGRATULATIONS!** 🎉

If all checkboxes are marked ✓ PASS, the Happy Path A1 workflow is **VERIFIED WORKING**.

Proceed to: A2, A3, A4, A5, A6 (other happy paths) or B-series (rejection paths) as planned.

