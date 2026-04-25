# Happy Path A1 Execution Guide
**Full Member (Embassy Employee) - Complete Workflow**

**Updated:** April 25, 2026  
**Test Scenario:** A1 from MEMBERSHIP_APPLICATION_TESTING_PLAN.md  
**Testing resumes from:** Step 1, Household Type Selection

---

## Quick Start

1. Navigate to: **https://geabotswana.org/member.html**
2. Click "Apply for Membership →"
3. Answer eligibility questions (you can use "Load Test Data (Dev)" button to auto-fill)
4. Continue from the Household Type selection screen below

---

## Step 1: Eligibility Screening → Household Type Selection

### What you should see:
- GEA logo and "Apply for Membership" title
- Step indicator showing step 1 active
- **Eligibility Screening** heading
- **Your membership category:** [Full/Associate/Community/etc.] (displayed)
- **Documents You'll Need to Provide** section (listing required documents)
- **Will this be an individual or family membership?** question
- Two buttons: **Individual** | **Family**
- Two action buttons at bottom: **Back** | **Cancel**

### Test Actions:

**For Happy Path A1 (Full Member):**
1. Click **Individual** button
   - Should advance to Step 2: Your Information

**Expected Result:**
- Form advances to next step (Step 2)
- Category remains: Full Member
- Household type recorded: Individual

---

## Step 2: Your Information

### What you should see:
- Step indicator showing step 2 active
- Blue info box showing: "Your membership category: Full Member"
- **Your Information** heading
- Form fields:
  - First Name *
  - Last Name *
  - Email Address *
  - Phone Number (with country code) *
  - Country of Citizenship *
  - Optional: Employment fields (depending on category)

### For Full Member - Expected Fields:
- Job Title *
- Employment Posting Date *
- Employment Departure Date *

### Test Actions:
1. Fill in all required fields:
   - First Name: (any name)
   - Last Name: (any name)
   - Email: (unique test email, e.g., a1_test_applicant@example.com)
   - Country Code: BW or US
   - Phone: (any valid number)
   - Citizenship: US or other
   - Job Title: Consular Officer (or similar US embassy role)
   - Posting Date: (date in past, e.g., 2025-06-15)
   - Departure Date: (date in future, e.g., 2028-06-15)

2. Click **Next** button

**Expected Result:**
- Form validates all required fields
- Advances to Step 3 (or Step 4 if Step 3 is skipped)

---

## Step 3: Sponsor Information (if shown)

**Note:** This step is typically skipped for Full Members.

If shown:
- Should display sponsor-related fields
- Click **Next** to continue

---

## Step 4: Family Members (if applicable)

**For Individual membership:** This step is skipped.

**For Family membership:**
- "Add Family Member" button
- Fields for spouse/partner and children
- Click **Next** to continue

---

## Step 5: Household Staff (if applicable)

**For Individual membership:** This step is skipped.

**For Family membership:**
- Checkbox: "Do you have household staff?"
- If yes, staff member details
- Click **Next** to continue

---

## Step 6: Facility Rules

### What you should see:
- Step indicator showing step 6 active
- **Facility Rules & Regulations** section (HTML-rendered rules from system)
- Three checkboxes:
  - [ ] I have read and understand the GEA Facility Rules
  - [ ] I understand I may be subject to membership suspension or expulsion
  - [ ] I certify my name is [Firstname Lastname]

### Test Actions:
1. Read the rules (or just acknowledge)
2. Check all three certification boxes
3. Click **Next** button

**Expected Result:**
- All checkboxes must be checked
- Form advances to Step 7 (Review)

---

## Step 7: Review & Submit

### What you should see:
- Step indicator showing step 7 active (final step)
- **Application Review** heading
- Summary of:
  - Membership Category: Full Member
  - Household Type: Individual
  - Applicant Name
  - Email
  - Phone
  - Citizenship
  - Employed at: U.S. Embassy
  - Job Title
  - Employment Dates
  - Household members (if any)
- Rules agreement checkbox
- **Certification** checkbox: "I certify that all information provided is accurate"
- Two buttons:
  - **Cancel Application**
  - **Submit Application** (green)

### Test Actions:
1. Review all information
2. Check the certification checkbox
3. Click **Submit Application** button

**Expected Result:**
- Button shows spinner while processing
- Success message appears:
  ```
  ✅ Success!
  Application ID: APP-2026-XXXXX
  Your application has been received.
  Next steps: Upload required documents.
  ```
- Form transitions to document upload screen
- Application status changes to: `awaiting_docs`

---

## After Application Submission

### Document Upload Screen
- Shows: "Application Status: Awaiting Documents"
- Document checklist:
  - [ ] Passport - Not uploaded
  - [ ] Omang - Not uploaded
  - [ ] Photo - Not uploaded

### Documents Needed (Full Member):
- **Passport** (required) - Scan of diplomatic or official passport
- **Omang** (required) - National ID (or one valid ID acceptable)
- **Photo** (optional) - Profile photo for membership card

### To Upload Documents:
1. Click **[Upload Passport]** button
2. Select passport image file (JPG, PNG, PDF)
3. File uploads (progress indicator)
4. Repeat for Omang
5. Optionally upload photo
6. Click **[Confirm All Documents Uploaded]** button

**Expected Result:**
- Documents show status: "Submitted" (⏳)
- Application status changes to: `rso_docs_review`
- Applicant receives email: "Documents received - pending RSO review"

---

## Test Completion Checklist

### Phase 1: Application Submission
- [ ] Navigate to geabotswana.org/member.html
- [ ] Click "Apply for Membership"
- [ ] Answer eligibility questions (Q1 = Yes for Full Member)
- [ ] Select "Individual" for household type
- [ ] Fill applicant information
- [ ] Complete household rules agreement
- [ ] Submit application successfully
- [ ] Receive success confirmation with Application ID

### Phase 2: Document Upload
- [ ] Receive document upload screen
- [ ] Upload passport document
- [ ] Upload Omang document
- [ ] Confirm documents uploaded
- [ ] Receive "RSO review pending" status

### Phase 3: Board & RSO Approval (admin side)
- [ ] Board member logs in to Admin portal
- [ ] Approves application (board initial review)
- [ ] RSO reviewer logs in
- [ ] Reviews and approves documents
- [ ] Board performs final review and approves

### Phase 4: Payment & Activation
- [ ] Applicant receives "Payment required" email
- [ ] Applicant submits $250 USD payment proof
- [ ] Treasurer receives and approves payment
- [ ] Applicant receives "Welcome! Account activated" email
- [ ] Applicant can now access member portal

### Phase 5: Verification
- [ ] Member logs in to portal
- [ ] Dashboard shows: "Membership Status: Member"
- [ ] Member can access: Dashboard, Reservations, Profile, Household, Payment History, Membership Card
- [ ] Membership card displays correctly with member photo (if provided)

---

## Known Issues & Solutions

### Form won't advance past Step 1
- Ensure both Category and Household Type are selected
- Check browser console (F12) for errors

### Cancel button on household type doesn't work
- Should pop up confirmation dialog
- If no popup, check browser console for errors

### Documents not uploading
- Ensure file size < 5 MB
- Use JPG, PNG, or PDF format
- Check file is not corrupted
- Try different file

### Can't log back in as applicant
- Use email from application
- Password should be from welcome email or password reset link
- Check for "Applicant" status in portal (may show applicant-only pages)

---

## Test Data Reference

### Test Applicant (A1 - Full Member)
- **Email:** a1_test_applicant@example.com
- **Name:** Test A1 Embassy Employee  
- **Country:** BW (Botswana)
- **Phone:** +267 71234501
- **Employment:** US Embassy, Consular Officer
- **Dates:** 2025-06-15 to 2028-06-15
- **Household Type:** Individual
- **Category Assigned:** Full Member (automatic)

### Board Member (for approval)
- **Email:** board@geabotswana.org
- **Role:** Board (all approvals)

### RSO Reviewer
- **Email:** test_rso@example.com  
- **Role:** RSO (document review/approval)

### Treasurer
- **Email:** treasurer@geabotswana.org
- **Role:** Treasurer (payment verification)

---

## Questions?

If you encounter issues:
1. Check the Cloud Logs (Google Cloud Console)
2. Check browser console (F12 → Console)
3. Verify all required fields are filled
4. Review error messages carefully
5. Contact: board@geabotswana.org for application issues

---

**Test Completion Signature:**  
Tester: _______________  
Date: _______________  
Result: ☐ PASS ☐ FAIL  
Notes: _________________________________
