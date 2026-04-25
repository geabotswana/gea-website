# Test Data Setup Guide
**For Membership Application Testing (Phase 3)**

**Last Updated:** April 25, 2026  
**Purpose:** Prepare test environment for 50+ membership application test scenarios

---

## Overview

This guide explains how to set up test data and accounts for executing the comprehensive membership application testing plan. Testing can occur in the production environment with test accounts, or in a separate test deployment.

---

## Test User Accounts

### Board Members (Required for approval workflows)
```
Email: board@geabotswana.org
Role: board
Status: Active
Permissions: All application approvals, payment verification
```

### RSO Reviewers (Required for document verification)
```
Email: test_rso@example.com
Role: rso_approve
Status: Active
Permissions: Document review/approval
```

### Treasurer (Required for payment verification)
```
Email: treasurer@geabotswana.org
Role: treasurer (or use board)
Status: Active
Permissions: Payment verification
```

### Test Applicants (Create new for each scenario)

**A1 Test Applicant (Full Member - Embassy):**
```
Email: a1_test@example.com
Name: Test A1 Embassy Employee
Country: BW
Phone: +267 71234501
Status: Applicant (will be created during testing)
```

**A2 Test Applicant (Associate Member):**
```
Email: a2_test@example.com
Name: Test A2 Associate Member
Country: US
Phone: +1 202-555-0001
Status: Applicant
```

**A3 Test Applicant (Community Member):**
```
Email: a3_test@example.com
Name: Test A3 Sponsored Member
Country: BW
Phone: +267 71234502
Status: Applicant
```

Add more test applicants as needed (A4 through A6, plus B-series for rejections, etc.)

---

## Test Data Files

### 1. Test Images for Document Upload

Create or use placeholder images with these names:

**Passport Images:**
- `passport_valid.jpg` - Clear, valid-looking passport
- `passport_blurry.jpg` - Intentionally blurry (for rejection scenarios)
- `passport_expired.jpg` - Expired date visible (if checking)

**Omang/National ID Images:**
- `omang_valid.jpg` - Clear, valid-looking ID
- `omang_damaged.jpg` - Partially obscured (for rejection)

**Profile Photos:**
- `profile_photo.jpg` - Headshot for membership card

**Funding Verification (for Associate Members):**
- `funding_letter.pdf` - Document showing 51%+ USG funding

**Diplomatic Documents (for Diplomatic Members):**
- `diplomatic_accreditation.pdf` - Diplomatic visa or accreditation

**Location:** Store test images in local test folder for upload during testing

### 2. Existing Test Data in System

Current test applications in GEA Member Directory (as of April 25, 2026):

| App ID | Name | Status | Notes |
|--------|------|--------|-------|
| APP-2026-00009 | William Peterson | awaiting_docs | Full/Family - ready for doc upload |
| APP-2026-00010 | David Chen | awaiting_docs | Associate/Individual - ready for docs |
| APP-2026-00011 | James Morrison | rso_docs_review | Full - at RSO review stage |
| APP-2026-00012 | Testapplicant 951676 | awaiting_docs | Full - basic test data |
| APP-2026-00013 | Testapplicant 294580 | awaiting_docs | Full - basic test data |
| APP-2026-00014 | Testapplicant 184675 | rso_application_review | Full - docs approved by RSO |
| APP-2026-00015 | Testapplicant 040103 | rso_application_review | Full - docs approved by RSO |
| APP-2026-00016 | Testapplicant 089482 | approved_pending_payment | Full - ready for payment test |
| APP-2026-00017 | Testapplicant 012916 | activated | Full - already completed (reference) |

**Use Cases:**
- APP-2026-00017: Reference for completed Happy Path
- APP-2026-00016: Start here for payment testing (E1-E5 scenarios)
- APP-2026-00014/15: Start here for Board Final review (D1 scenarios)
- APP-2026-00009/10: Start here for document upload (G1-G3 scenarios)

---

## Test Execution Order

### Week 1: Happy Paths (Scenarios A1-A6)
1. **A1 (Full Member)** - Primary happy path, tests all features
2. **A2 (Associate Member)** - Tests funding verification document
3. **A3 (Community Member)** - Tests sponsor validation
4. **A4 (Temporary Member)** - Tests 6-month expiration
5. **A5 (Diplomatic Member)** - Tests diplomatic category
6. **A6 (Affiliate Member)** - Tests default category

**Expected Outcome:** All categories work, complete workflow succeeds

### Week 2: Rejection Paths (Scenarios B1, D1)
1. **B1 (Board Initial Rejection)** - Test early rejection
2. **D1 (Board Final Rejection)** - Test late rejection

**Expected Outcome:** Rejections handled correctly, emails sent

### Week 3: Document Issues (Scenarios C1, C2)
1. **C1 (RSO Rejects Single Doc)** - Test resubmission flow
2. **C2 (RSO Rejects Multiple)** - Test multiple resubmissions

**Expected Outcome:** Applicant can resubmit, RSO can re-review

### Week 4: Payment Verification (Scenarios E1-E5)
1. **E1 (Payment Approved)** - Basic happy path
2. **E2 (Payment Rejected)** - Test rejection with resubmission
3. **E3 (Clarification Requested)** - Test Q&A workflow
4. **E4 (Wrong Amount)** - Test amount validation
5. **E5 (Pro-ration)** - Test mid-year prorated dues

**Expected Outcome:** All payment workflows work

### Week 5: Applicant Actions (Scenarios F1-F3)
1. **F1 (Withdraw During Docs)** - Test withdrawal at step 2
2. **F2 (Withdraw During Payment)** - Test withdrawal at step 6
3. **F3 (Reapply After Withdrawal)** - Test fresh application

**Expected Outcome:** Withdrawals work, reapplication allowed

### Week 6: Edge Cases (Scenarios G1-G4)
1. **G1 (Upload Same Doc Twice)** - Test duplicate handling
2. **G2 (Employment Verification)** - Test optional document flow
3. **G3 (Reuse Verified Doc)** - Test document reuse
4. **G4 (Missing Required Doc)** - Test validation

**Expected Outcome:** Edge cases handled gracefully

### Week 7: Eligibility & Permissions (Scenarios H1-H4, I1)
1. **H1 (Q1=Yes → Full)** - Test auto-category assignment
2. **H2 (Q2=51% → Associate)** - Test funding-based category
3. **H3 (Q1=No, Q2=No → Community)** - Test fallback
4. **H4 (Sponsor Validation)** - Test sponsor eligibility checks
5. **I1 (Permission Checks)** - Test role-based access

**Expected Outcome:** Categories assigned correctly, permissions enforced

---

## Test Metrics & Tracking

### Checklist Items

For each scenario, verify:
- [ ] Application submitted successfully
- [ ] Status transitions occur correctly
- [ ] Emails sent with accurate information
- [ ] All required buttons function
- [ ] User role-based access enforced
- [ ] Audit log entries created
- [ ] Data persists correctly in spreadsheets
- [ ] No console errors (F12 for browser)

### Bugs Found

For any issue discovered:
1. **Title:** Clear, specific description
2. **Steps to Reproduce:** Exact sequence to recreate
3. **Expected Behavior:** What should happen
4. **Actual Behavior:** What does happen
5. **Scenario:** Which test case (A1, B1, etc.)
6. **Environment:** GAS deployment ID, date/time
7. **Logs:** Any error messages or Cloud Logs entries

### Performance Notes

Track:
- Page load times
- Form submission times
- Document upload times
- Email delivery times

---

## Spreadsheet Verification

After testing, verify these spreadsheets have been updated:

### Member Directory Spreadsheet
**Tabs to check:**
- [ ] Households - New household records created
- [ ] Individuals - New individual records created
- [ ] Membership Applications - App status transitions recorded
- [ ] File Submissions - Document uploads recorded
- [ ] Sessions - Auth tokens created/managed

### System Backend Spreadsheet
**Tabs to check:**
- [ ] Audit Log - All actions logged with timestamps
- [ ] Email Templates - All 114 templates available
- [ ] Configuration - Exchange rates, thresholds accurate
- [ ] Administrators - Test accounts listed with correct roles

### Reservations & Payment Spreadsheets
**Tabs to check:**
- [ ] Payments - Payment submissions recorded
- [ ] Membership Pricing - Dues amounts correct ($250 USD annual)

---

## Testing Tools & Resources

### Browser Developer Tools
```
F12 → Console tab
- Check for JavaScript errors
- Verify API calls
```

### GAS Execution Log
```
Google Apps Script Editor
→ Execution log
→ View logs for function calls
```

### Cloud Logs
```
Google Cloud Console
→ Logs → Apps Script
→ Filter by function or execution
→ More detailed than execution log
```

### Spreadsheet Queries
```
Member Directory sheet:
- Search by Application ID
- Search by applicant email
- Filter by status
```

---

## Pre-Testing Checklist

Before starting any test scenario:

- [ ] Test environment configured (production or sandbox)
- [ ] All test user accounts created and accessible
- [ ] Test images prepared and ready to upload
- [ ] Portal URL accessible
- [ ] Admin URL accessible
- [ ] Previous test data cleaned up (optional)
- [ ] Browser cache cleared (F12 → Storage → Clear)
- [ ] sessionStorage cleared
- [ ] Logged out from any previous sessions
- [ ] GAS logs visible in Cloud Logs
- [ ] Spreadsheets open and ready to monitor

---

## Test Execution Template

**Scenario:** [A1, A2, B1, etc.]  
**Date:** ________  
**Tester:** ________  
**Start Time:** ________  
**End Time:** ________  

**Test Steps Completed:**
- [ ] Step 1: ____________
- [ ] Step 2: ____________
- [ ] Step 3: ____________
- [ ] Step 4: ____________
- [ ] Step 5: ____________

**Results:**
- [ ] PASS - All expectations met
- [ ] FAIL - Issues found:
  - Issue 1: ______________
  - Issue 2: ______________

**Notes:** _______________

---

## Rollback Procedures

If a test needs to be repeated or rolled back:

### Clear Application Data
```
In Member Directory spreadsheet:
1. Find application row by APP ID
2. Delete row (optional - can also just reset status)
3. Delete related household/individual records
4. Restart testing with new application
```

### Reset Status
```
In Membership Applications tab:
1. Find APP ID
2. Change status back to awaiting_docs
3. Retest from that point
```

### Clear Test Sessions
```
In System Backend → Sessions tab:
1. Delete rows with test email addresses
2. Forces re-login on next attempt
```

---

## FAQ

**Q: Can I test in production?**  
A: Yes - use test email accounts (like a1_test@example.com). They won't interfere with real members since they have unique emails.

**Q: How long does a Happy Path test take?**  
A: 45-60 minutes per scenario, including all reviews and approvals.

**Q: Can tests run in parallel?**  
A: Yes - different applicants can be at different stages simultaneously. They won't interfere.

**Q: What if board is unavailable?**  
A: Create test board account with `board` role, or test with existing board@geabotswana.org.

**Q: Do I need to test all scenarios?**  
A: Start with A1 (Full Member happy path). A2-A6 verify other categories. B-E-F test exception flows. G-H-I test edge cases and permissions.

**Q: What happens to test data after testing?**  
A: Leave it in the spreadsheets as reference. Use different email addresses for each new test run so data doesn't get overwritten.

---

## Next Steps

1. **Prepare test images** - Create or download sample passport/ID images
2. **Create test accounts** - Add test applicant emails to system if needed
3. **Start with A1** - Run first Happy Path scenario
4. **Log all issues** - Document any bugs or unexpected behavior
5. **Schedule reviews** - Plan board member availability for approvals
6. **Iterate** - Repeat scenarios as bugs are fixed

