# Happy Path A1 Execution Guide
**Full Member (Embassy Employee) - Complete Workflow**

**Updated:** April 25, 2026  
**Test Scenario:** A1 from MEMBERSHIP_APPLICATION_TESTING_PLAN.md  
**Status:** ✅ COMPLETED - Full workflow tested and verified working  
**Tested By:** Michael Raney (April 25, 2026)

---

## Quick Start

1. Navigate to: **https://geabotswana.org/member.html**
2. Click "Apply for Membership →"
3. Answer eligibility questions (you can use "Load Test Data (Dev)" button to auto-fill)
4. Continue through Q1, Q2, household type selection, and remaining steps

---

## Step 1: Eligibility Screening

### Screen 1: Q1 - Direct USG Employee

**Question:** "Are you a U.S. Direct-Hire employee of the United States Government?"

**Options:**
- Yes - Includes Department of State and other USG departments and agencies
- No - Proceed to next question

**For Happy Path A1:**
- Click **Yes** (Full Member is a direct US Government employee)

**After answering:**
- If Yes: Advances to Q1b (Temporary Duty question)
- If No: Advances to Q2 (Embassy Staff from Outside)

---

### Screen 2: Q1b - Temporary Duty Status

(Only shown if Q1 = Yes)

**Question:** "Are you in Botswana on temporary duty or as an official visitor?"

**Details:** Temporary duty = short-term assignment (typically 6 months or less). Permanent assignment = assigned to the Botswana mission as your duty station.

**Options:**
- Yes (Temporary Duty) - Results in Temporary Member (max 6 months)
- No (Permanent) - Results in Full Member

**For Happy Path A1:**
- Click **No (Permanent)** (Full Member has permanent assignment)

**After answering:**
- System auto-assigns category: **Full Member**
- Advances to Household Type selection screen

---

### Screen 3: Household Type Selection

### What you should see:
- GEA logo and "Apply for Membership" title
- Step indicator showing step 1 active
- **Eligibility Screening** heading
- Blue info box showing: **Your membership category: Full**
- **Documents You'll Need to Provide** section (showing required documents)
- **Will this be an individual or family membership?** heading
- Two selection buttons: **Individual** | **Family**
- Two action buttons at bottom: **Back** | **Cancel**

**Button Behavior:**
- **Back button:** Returns to the previous question (Q1b, Q2, Q3, or Q4 depending on flow)
- **Cancel button:** Shows inline confirmation "Yes, Cancel Application" / "No, Keep Applying"
  - If you click Cancel, it will ask you to confirm
  - This prevents accidental loss of data

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
   - First Name: James (or any name)
   - Last Name: Morrison (or any name)
   - Email: michael+a1_test@raneyworld.com (must use raneyworld.com to receive emails)
   - Country Code: BW or US
   - Phone: +267 71234501 (or any valid number)
   - Citizenship: US (or other)
   - Job Title: Economic Officer (or similar US embassy role)
   - Posting Date: 2023-08-20 (or any past date)
   - Departure Date: 2027-08-31 (or any future date)

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
- **Rules & Regulations** heading
- Rules text displayed (scrollable section)
- Blue info box with two checkboxes:
  - [ ] I and my household members agree to uphold the rules and regulations of the Gaborone Employee Association.
  - [ ] I have read and understood the Rules & Regulations and agree that I and my household members will comply with them.
- **Full Name** field showing: [Your Name]
- Two buttons at bottom: **Back** | **I Agree & Continue**

### Test Actions:
1. Read through the rules (scrollable)
2. Check both certification checkboxes
3. Click **I Agree & Continue** button

**Expected Result:**
- Both checkboxes must be checked to proceed
- Form advances to Step 7 (Review & Submit)

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
1. Review all applicant information displayed
2. Review employment information (job title, posting date, departure date)
3. Check the certification checkbox: "I certify that all information provided is accurate and complete"
4. Click **Submit Application** button (green)

**Expected Result:**
- Button shows spinner while processing
- Page transitions to success screen showing:
  ```
  ✅ Application Submitted!
  We've received your membership application.
  Check your email for login credentials.
  
  Next Steps:
  1. Log in to the member portal
  2. Upload required documents (photo required, passport + omang based on age)
  3. Wait for board and RSO review (5-7 business days)
  4. Submit payment once approved
  5. Receive confirmation of active membership
  ```
- GEA logo displayed with checkmark
- "Go to Login" button available
- Application status changes to: `awaiting_docs`
- Emails sent:
  - ✅ Board receives: "New Application: [Name] - Review by [Date]"
  - ✅ Applicant receives: "GEA Application Received - Next Steps Inside" + "Your GEA Member Portal Login Details"

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
- **Email:** michael+a1_test@raneyworld.com ⚠️ **MUST use raneyworld.com to receive emails**
- **Name:** James Morrison (or your test name)
- **Country:** BW (Botswana)
- **Phone:** +267 71234501
- **Employment:** U.S. Embassy, Economic Officer (or similar)
- **Posting Date:** 2023-08-20
- **Departure Date:** 2027-08-31
- **Household Type:** Individual
- **Category Assigned:** Full Member (automatic from Q1=Yes, Q1b=No)
- **Membership Dues:** $250 USD/year
- **Required Docs:** Passport + Omang (+ optional photo)

### Board Member (for approval)
- **Email:** board@geabotswana.org
- **Role:** Board (all approvals)
- **Access:** Admin Portal at https://script.google.com/a/macros/geabotswana.org/s/[deployment_id]/exec?action=serve_admin

### RSO Reviewer
- **Email:** test_rso@example.com  
- **Role:** RSO (document review/approval)
- **Access:** Admin Portal (Document Review queue)

### Treasurer
- **Email:** treasurer@geabotswana.org
- **Role:** Treasurer (payment verification)
- **Access:** Admin Portal (Payment Review queue)

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
