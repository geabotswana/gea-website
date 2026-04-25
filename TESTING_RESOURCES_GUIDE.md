# GEA Membership Application Testing Resources
**Complete Guide to Test Documentation & Execution**

**Date Created:** April 25, 2026  
**Status:** Phase 3 - Comprehensive Testing Plan Ready  
**Total Test Scenarios:** 50+ distinct paths

---

## Overview

This guide provides a centralized index of all testing documentation, tools, and resources for executing the GEA membership application system testing. Everything needed to systematically test all 11 steps of the membership workflow is provided.

---

## Testing Documentation Files

### 1. **MEMBERSHIP_APPLICATION_TESTING_PLAN.md** (Original Plan)
**Purpose:** High-level overview of all 50+ test scenarios  
**Contains:**
- A: Happy Paths (A1-A6) - All success scenarios
- B: Rejection Paths (B1) - Early rejection by board
- C: Document Issues (C1-C2) - RSO rejections and resubmissions
- D: Board Final Rejection (D1) - Late rejection scenario
- E: Payment Verification (E1-E5) - Payment processing paths
- F: Applicant Actions (F1-F3) - Withdrawal and reapplication
- G: Document Edge Cases (G1-G4) - Special document scenarios
- H: Eligibility Logic (H1-H4) - Category determination
- I: Permissions (I1) - Role-based access verification

**Use When:** Planning which scenarios to test, understanding full scope  
**Start Here:** If you're unfamiliar with the testing plan

### 2. **TEST_DATA_SETUP.md** (Setup Guide)
**Purpose:** Prepare test environment before any testing begins  
**Contains:**
- Required test user accounts (board, RSO, treasurer, applicants)
- Test data files needed (passport/ID images, documents)
- Existing test data in system (reference applications)
- Test execution order (7-week timeline)
- Testing metrics and tracking
- Spreadsheet verification checklist
- Testing tools reference (browser dev tools, Cloud Logs)
- Pre-testing checklist
- Rollback procedures
- FAQ

**Use When:** Before starting ANY test (A1, A2, B1, etc.)  
**Dependencies:** None - this is preparation  
**Estimated Time:** 30 minutes to prepare

### 3. **HAPPY_PATH_A1_EXECUTION_GUIDE.md** (Detailed Walkthrough)
**Purpose:** Complete step-by-step guide for A1 testing  
**Contains:**
- 9 phases from applicant creation to account activation
- Detailed field instructions for each step
- Expected validation messages
- Navigation instructions
- Expected status transitions
- Buttons tested at each phase
- Troubleshooting tips for common issues
- Notes section for recording observations

**Use When:** Actually executing Happy Path A1  
**Reference:** Keep open while testing  
**Estimated Time:** 45-60 minutes to complete

### 4. **A1_TEST_CHECKLIST.md** (Printable Checklist)
**Purpose:** Portable, fill-in test execution checklist  
**Contains:**
- All 9 phases with sub-tasks
- 75+ specific pass/fail checkpoints
- Expected values for each step
- Button test confirmation
- Status verification
- Issue logging
- Sign-off section

**Use When:** Performing actual A1 testing  
**Format:** Print-friendly, can be filled by pen or digital  
**Estimated Time:** 45-60 minutes + printing/setup

---

## Quick Start Flowchart

```
Start Here:
    ↓
Read MEMBERSHIP_APPLICATION_TESTING_PLAN.md (choose scenario)
    ↓
Complete TEST_DATA_SETUP.md (prepare environment)
    ↓
Select Scenario from MEMBERSHIP_APPLICATION_TESTING_PLAN.md
    ↓
    ├─→ A1 (Full Member Happy Path)
    │       ↓
    │   Use: HAPPY_PATH_A1_EXECUTION_GUIDE.md
    │   Use: A1_TEST_CHECKLIST.md
    │       ↓
    │   [EXECUTE TESTING]
    │
    ├─→ A2 (Associate Member Happy Path)
    │       ↓
    │   [Create similar guide as needed]
    │
    ├─→ B1 (Board Rejection)
    │       ↓
    │   [Create similar guide as needed]
    │
    └─→ Other Scenarios (C1-I1)
            ↓
        [Create similar guide as needed]
```

---

## Testing Timeline (Recommended)

### Week 1: Setup + A1
- **Monday:** Read MEMBERSHIP_APPLICATION_TESTING_PLAN.md
- **Tuesday:** Complete TEST_DATA_SETUP.md preparations
- **Wednesday-Friday:** Execute A1 Happy Path using guides

### Week 2-3: Additional Happy Paths
- Execute A2 (Associate Member)
- Execute A3 (Community Member)
- Execute A4 (Temporary Member)
- Execute A5 (Diplomatic Member)
- Execute A6 (Affiliate Member)

### Week 4: Rejection & Document Issues
- Execute B1 (Board Rejection)
- Execute D1 (Board Final Rejection)
- Execute C1 (RSO Rejects Single Doc)
- Execute C2 (RSO Rejects Multiple)

### Week 5: Payment Workflows
- Execute E1-E5 (Payment scenarios)
- Verify pro-ration logic
- Test payment rejection/clarification

### Week 6: Applicant Actions & Edge Cases
- Execute F1-F3 (Withdrawals/reapplication)
- Execute G1-G4 (Document edge cases)

### Week 7: Permissions & Eligibility
- Execute H1-H4 (Category assignment)
- Execute I1 (Role-based access)

---

## Key Testing Concepts

### Membership Categories
The system auto-assigns one of 6 categories based on application answers:

| Category | Trigger | Dues | Document Requirements |
|----------|---------|------|----------------------|
| **Full** | Q1=Yes (embassy employee) | $250 | Passport + Omang |
| **Associate** | Q1=No, Q2=Yes (51%+ USG) | $250 | Passport + Omang + Funding Letter |
| **Community** | Sponsored (Q5=Yes) | $250 | Passport + Omang |
| **Temporary** | Q4=Yes (TDY) | Pro-rated | Passport + Omang (no TDY orders) |
| **Diplomatic** | Q3=Yes (diplomatic visa) | $250 | Passport + Omang |
| **Affiliate** | Fallback/explicit | $250 | Passport + Omang |

### The 11-Step Workflow

1. **Applicant Creates Account** - Application form submitted
2. **Documents Submitted** - Passport, Omang, optional documents uploaded
3. **Board Initial Review** - First approval decision (APPROVE/REJECT/CLARIFY)
4. **RSO Document Verification** - Documents approved individually (APPROVE/REJECT)
5. **Board Final Review** - Second approval decision (APPROVE/REJECT)
6. **Payment Submission** - Applicant provides payment proof
7. **Treasurer Verification** - Payment reviewed and verified (APPROVE/REJECT/CLARIFY)
8. **Account Activation** - Member portal access unlocked
9. **Membership Card** - Card becomes available
10. **Facility Access** - Can book reservations
11. **Member Benefits** - Full member portal access

### Status Codes
- `awaiting_docs` - After application, before documents
- `rso_docs_review` - Documents submitted, RSO reviewing
- `board_final_review` - RSO done, board final decision pending
- `approved_pending_payment` - All approvals done, payment required
- `awaiting_payment_verification` - Payment submitted, treasurer reviewing
- `activated` - Account active, member portal accessible
- `denied` - Rejected by board (any stage)
- `withdrawn` - Applicant withdrew

---

## Testing Environment Setup

### Required Accounts
```
Board Member:
  Email: board@geabotswana.org
  Role: board
  Permissions: All approvals

RSO Reviewer:
  Email: test_rso@example.com
  Role: rso_approve
  Permissions: Document review

Treasurer:
  Email: treasurer@geabotswana.org
  Role: treasurer
  Permissions: Payment verification

Test Applicants:
  Email: a1_test_[DATE]@example.com (for A1)
  Email: a2_test_[DATE]@example.com (for A2)
  ... etc for each scenario
```

### Required Test Files
```
Passport images:
  - passport_valid.jpg
  - passport_blurry.jpg (for rejection tests)

ID images:
  - omang_valid.jpg
  - omang_damaged.jpg (for rejection tests)

Profile photos:
  - profile_photo.jpg

Funding verification (Associates):
  - funding_letter.pdf

Diplomatic documents (Diplomatic members):
  - diplomatic_accreditation.pdf
```

All files should be < 5 MB, JPG/PNG/PDF format.

---

## During Testing

### Monitoring Tools

**Browser Developer Tools (F12)**
```
Console tab: Watch for JavaScript errors
Network tab: Monitor API calls
Storage tab: Check sessionStorage for tokens
```

**GAS Execution Log**
```
Apps Script editor → View logs
Shows function calls and console.log output
```

**Cloud Logs**
```
Google Cloud Console → Logs
More detailed than execution log
Useful for debugging specific failures
```

**Spreadsheet Monitoring**
```
Member Directory → Membership Applications tab
Watch status changes in real-time
Household/Individuals tabs for new records
Sessions tab for auth tokens
```

### Recording Results

For each test, record:
1. **Scenario Code** (A1, B1, C2, etc.)
2. **Date & Time Started**
3. **Tester Name**
4. **Each Phase Result** (PASS/FAIL)
5. **Any Issues Found** (with steps to reproduce)
6. **Time Completed**
7. **Signature/Sign-off**

Use the A1_TEST_CHECKLIST.md as a template for other scenarios.

---

## Common Issues & Solutions

### Application Submission Fails
**Symptom:** Submit button grayed out or error message  
**Check:**
- [ ] Certification checkbox checked
- [ ] All required fields filled
- [ ] F12 console for error details
- [ ] Session token valid (sessionStorage.getItem('gea_token'))

**Solution:** Refresh page, verify all fields, check Cloud Logs

### Documents Won't Upload
**Symptom:** Upload fails or file not accepted  
**Check:**
- [ ] File < 5 MB
- [ ] File format: JPG, PNG, or PDF
- [ ] File is valid image (not corrupted)
- [ ] individual_id matches applicant

**Solution:** Try different file, verify applicant ID, check console

### Board Can't See Application
**Symptom:** Application not in board review queue  
**Check:**
- [ ] Logged in as board@geabotswana.org
- [ ] Application status is "Initial Board Review"
- [ ] Refresh browser page
- [ ] Check spreadsheet for status

**Solution:** Verify status manually in spreadsheet, check role

### Payment Verification Button Missing
**Symptom:** No approve/reject buttons for treasurer  
**Check:**
- [ ] Logged in as treasurer@geabotswana.org
- [ ] Payment status is "payment_submitted"
- [ ] Application status is "awaiting_payment_verification"
- [ ] Refresh page

**Solution:** Verify credentials, check status, refresh

### Member Portal Access Denied
**Symptom:** Applicant redirected to applicant portal after activation  
**Check:**
- [ ] Application status in spreadsheet is "activated"
- [ ] Membership status is "Member"
- [ ] Clear browser cache (F12 → Storage → Clear)
- [ ] Log out and back in

**Solution:** Manual refresh, cache clear, log out/in

---

## Success Criteria

For each test scenario, all of the following must be true:

### Application Workflow
- [ ] Application submits without errors
- [ ] Status transitions occur in correct order
- [ ] All expected statuses appear
- [ ] Approval/rejection decisions persist

### Documents
- [ ] Documents upload successfully
- [ ] File size < 5 MB accepted
- [ ] RSO can view and approve documents
- [ ] Rejection triggers resubmission request

### Approvals
- [ ] Board can approve/reject at each stage
- [ ] RSO can approve/reject documents
- [ ] Treasurer can verify payments
- [ ] Status updates reflect decisions

### Payments
- [ ] Applicant can submit payment
- [ ] Treasurer receives submission
- [ ] Payment verification works
- [ ] Amount validation correct

### Account Activation
- [ ] Member portal becomes accessible
- [ ] Dashboard shows Member status
- [ ] Membership card available
- [ ] Reservation/profile pages accessible

### Email Notifications
- [ ] Approval confirmations sent
- [ ] Rejection reasons sent
- [ ] Payment requests sent
- [ ] Activation confirmation sent

### Audit Trail
- [ ] All actions logged
- [ ] Timestamps correct
- [ ] User emails recorded
- [ ] Decision reasons captured

---

## Reporting Issues

When a test fails, create a GitHub issue with:

**Title:** `[TEST] A1 - Submit Application fails with "Certification required" error`

**Body:**
```
**Scenario:** A1 (Full Member Happy Path)
**Step:** 2.7 (Final Submission)
**Environment:** Production deployment
**Date/Time:** 2026-04-25 14:30 UTC

**Steps to Reproduce:**
1. Create test applicant account
2. Fill application form (all valid data)
3. On Step 7, check certification box
4. Click [Submit Application]

**Expected:** Application submits successfully
**Actual:** Error message: "Certification required" (but box is checked)

**Console Error:** [paste error from F12]
**Cloud Logs:** [paste relevant log entry]

**Attempted Fixes:**
- Cleared browser cache
- Tried different browser
- Verified certification box is checked
```

---

## Next Steps

1. **Print A1_TEST_CHECKLIST.md** and keep nearby during testing
2. **Read TEST_DATA_SETUP.md** and prepare environment
3. **Use HAPPY_PATH_A1_EXECUTION_GUIDE.md** during execution
4. **Record all results** in checklist
5. **Report any issues** with full details
6. **Iterate** through other scenarios (A2-I1) following same process

---

## Success Timeline

| Milestone | Timeline | Acceptance Criteria |
|-----------|----------|-------------------|
| Setup Complete | Day 1 | Test accounts created, images ready |
| A1 Happy Path Complete | Days 2-3 | All 9 phases pass, member activated |
| All A-Series Complete | End Week 2 | A1-A6 all passing |
| Rejection Paths Complete | End Week 3 | B1, D1 handling rejections correctly |
| Payment Workflows Complete | End Week 4 | E1-E5 all payment scenarios working |
| Full Suite Complete | End Week 7 | 50+ scenarios tested, issues resolved |

---

## Resources & References

### Documentation
- [MEMBERSHIP_APPLICATION_TESTING_PLAN.md](./MEMBERSHIP_APPLICATION_TESTING_PLAN.md) - Test scenarios
- [TEST_DATA_SETUP.md](./TEST_DATA_SETUP.md) - Environment setup
- [HAPPY_PATH_A1_EXECUTION_GUIDE.md](./HAPPY_PATH_A1_EXECUTION_GUIDE.md) - Step-by-step guide
- [A1_TEST_CHECKLIST.md](./A1_TEST_CHECKLIST.md) - Printable checklist
- [SERVICE_MODULES.md](./docs/SERVICE_MODULES.md) - Backend code reference
- [GEA_System_Schema.md](./docs/reference/GEA_System_Schema.md) - Database schema
- [PORTAL_INTERFACE.md](./docs/frontend/PORTAL_INTERFACE.md) - Frontend reference

### Spreadsheets (Test Data)
- [Member Directory](https://docs.google.com/spreadsheets/d/[ID]) - Applications, documents
- [System Backend](https://docs.google.com/spreadsheets/d/[ID]) - Config, audit log, emails
- [Payments](https://docs.google.com/spreadsheets/d/[ID]) - Payment tracking

### Deployment
- **Portal:** https://script.google.com/a/macros/geabotswana.org/s/[DEPLOYMENT_ID]/exec
- **Admin:** https://script.google.com/a/macros/geabotswana.org/s/[DEPLOYMENT_ID]/exec?action=serve_admin
- **Public Website:** https://geabotswana.org

---

## Support & Questions

If you have questions during testing:

1. **Check Troubleshooting** section above
2. **Review TEST_DATA_SETUP.md** FAQ
3. **Check Cloud Logs** for error details
4. **Create GitHub issue** with full details
5. **Contact:** board@geabotswana.org

---

**Testing starts today. Good luck!** 🚀

