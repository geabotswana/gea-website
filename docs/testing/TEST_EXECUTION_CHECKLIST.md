# GEA Membership Application — Test Execution Checklist

Tracking document for the 10-scene test play. Print this or use as an interactive checklist to track progress through each scene.

---

## Overview

- **Total Scenes:** 10
- **Estimated Duration:** 4–6 hours for complete test run (can be split across multiple days)
- **Prerequisites:** Scene 01 must run first; Scenes 02–03 can run in parallel with 01
- **Roles Needed:** 3–4 testers (Applicant, Board, RSO, Treasurer)

---

## Master Checklist

| # | Scene Title | Status | Completed By | Date | Notes |
|---|-------------|--------|--------------|------|-------|
| 01 | Full Individual — Happy Path | ⬜ Pending | — | — | **Run this FIRST** |
| 02 | Full Family — Happy Path | ⬜ Pending | — | — | After 01 |
| 03 | Category Routing — All Types | ⬜ Pending | — | — | Parallel with 01/02 |
| 04 | Board Denial Scenarios | ⬜ Pending | — | — | After 01/03 |
| 05 | RSO Rejection & Recovery | ⬜ Pending | — | — | After 01 |
| 06 | Payment Edge Cases | ⬜ Pending | — | — | After approval |
| 07 | Household Management | ⬜ Pending | — | — | Parallel with 06 |
| 08 | Portal UI — All Status States | ⬜ Pending | — | — | During 01–07 |
| 09 | Post-Activation Verification | ⬜ Pending | — | — | After 01 & 02 |
| 10 | Admin Account Management | ⬜ Pending | — | — | Before or parallel |

**Legend:** ⬜ = Pending, 🔄 = In Progress, ✅ = Passed, ❌ = Failed

---

## Detailed Scene Checklists

### SCENE 01: Full Individual — Complete Happy Path

**Status:** ⬜ Pending | 🔄 In Progress | ✅ Passed | ❌ Failed

**Duration:** ~45 minutes

**Test Identity:**
```
Name: James Morrison
Email: testapp+full-individual@example.com
Category: Full | Household: Individual
```

#### Application Submission
- ⬜ Navigate to Application Form
  - Expected: Step 1 (Eligibility Questionnaire) visible
  - Actual: ___________
- ⬜ Complete Questionnaire (Q1=YES, Q1b=NO)
  - Expected: Category = Full
  - Actual: ___________
- ⬜ Select Household Type (Individual)
  - Expected: Confirmed on form
  - Actual: ___________
- ⬜ Fill Personal Information (Step 2)
  - Expected: All fields required and accepted
  - Actual: ___________
- ⬜ No spouse/children (Step 4 skipped)
  - Expected: Form proceeds to Step 5 (Rules)
  - Actual: ___________
- ⬜ Accept Rules & Submit
  - Expected: Confirmation page shown; email received
  - Actual: ___________

#### Document Submission
- ⬜ Login with temp password
  - Expected: Application Dashboard loaded
  - Actual: ___________
- ⬜ Upload ID Document (passport)
  - File: `test-data/id-documents/James_Morrison_passport.png`
  - Expected: File accepted; status = "submitted"
  - Actual: ___________
- ⬜ Upload Photo
  - File: `test-data/photos/James_Morrison_photo.png`
  - Expected: Photo accepted; status = "submitted"
  - Actual: ___________

#### Board Initial Review
- ⬜ Board member logs in (board@geabotswana.org)
  - Expected: Admin Portal loads; Applications list visible
  - Actual: ___________
- ⬜ Find James Morrison's application
  - Expected: Listed with status = "awaiting_docs"
  - Actual: ___________
- ⬜ Confirm documents were submitted
  - Expected: Documents tab shows 2 submissions
  - Actual: ___________
- ⬜ Approve application (initial review)
  - Expected: Status = "board_initial_review"; board notified for review
  - Actual: ___________

#### RSO Document Review
- ⬜ RSO Approver receives email with approval link
  - Expected: Email received within 5 minutes
  - Actual: ___________
- ⬜ Click approval link in email
  - Expected: Preview of documents shown
  - Actual: ___________
- ⬜ Approve documents
  - Expected: Status = "rso_approved"; link becomes inactive
  - Actual: ___________

#### Board Final Review
- ⬜ Board member approves final
  - Expected: Status = "approved_pending_payment"
  - Actual: ___________
- ⬜ Applicant notified
  - Expected: Email says "ready to pay dues"
  - Actual: ___________

#### Payment Submission
- ⬜ Applicant logs in and views Payment page
  - Expected: Dues amount shown ($50 USD for individual Full)
  - Actual: ___________
- ⬜ Exchange rate displayed
  - Expected: Shows live rate from Configuration sheet
  - Actual: ___________
- ⬜ Select PayPal payment method
  - Expected: Form shows PayPal instructions
  - Actual: ___________
- ⬜ Submit proof of payment
  - Expected: Status = "submitted", email sent to treasurer
  - Actual: ___________

#### Treasurer Approval
- ⬜ Treasurer (board@geabotswana.org) sees payment
  - Expected: Listed in "Pending Payments" admin section
  - Actual: ___________
- ⬜ Approve payment
  - Expected: Status = "verified"; membership activated
  - Actual: ___________
- ⬜ Applicant notified
  - Expected: Email says "Welcome! Your membership is active"
  - Actual: ___________

#### Final Verification
- ⬜ Applicant logs in to active portal
  - Expected: Full dashboard visible (not restricted)
  - Actual: ___________
- ⬜ Check Individuals sheet
  - Expected: James Morrison row has active=TRUE, membership_expiration_date set to next July 31
  - Actual: ___________
- ⬜ Check Households sheet
  - Expected: HSH record has active=TRUE, primary_member_id set
  - Actual: ___________

**Scene 01 Result:** ✅ PASSED | ❌ FAILED

**Completion Time:** ____________ | **Completed By:** ____________ | **Date:** ____________

**Notes/Issues:**
```
[Describe any issues encountered, workarounds applied, or unexpected behavior]
```

---

### SCENE 02: Full Family — Complete Happy Path

**Status:** ⬜ Pending | 🔄 In Progress | ✅ Passed | ❌ Failed

**Duration:** ~60 minutes

**Test Identity:**
```
Name: William Peterson (Primary)
Spouse: Sarah Peterson
Children: Emma, Lucas
Household Staff: Thabo Motswana
Email: testapp+full-family@example.com
Category: Full | Household: Family
```

#### Application & Family Data
- ⬜ Load test data (Full + Family)
  - Expected: Form pre-filled with William, Sarah, Emma, Lucas, Thabo
  - Actual: ___________
- ⬜ Submit application with family
  - Expected: Household created with 5 individuals (primary, spouse, 2 children, staff)
  - Actual: ___________
- ⬜ Email sent to William (primary)
  - Expected: Contains temp password
  - Actual: ___________

#### Multi-Member Document Upload
- ⬜ William uploads passport
  - File: `William_Peterson_passport.png`
  - Actual: ___________
- ⬜ William uploads photo
  - File: `William_Peterson_photo.png`
  - Actual: ___________
- ⬜ Sarah uploads documents
  - Passports: `Sarah_Peterson_passport.png`
  - Photo: `Sarah_Peterson_photo.png`
  - Actual: ___________
- ⬜ Upload Emma's documents
  - Passport: `Emma_Peterson_passport.png`
  - Photo: `Emma_Peterson_photo.png`
  - Actual: ___________
- ⬜ Upload Lucas's documents
  - Passport: `Lucas_Peterson_passport.png`
  - Photo (optional for children): Consider adding
  - Actual: ___________

#### Board Review & Approval
- ⬜ Board member views application with all family members
  - Expected: All 5 individuals listed with upload status
  - Actual: ___________
- ⬜ Approve application
  - Expected: Status moves to RSO review
  - Actual: ___________

#### RSO Document Review
- ⬜ RSO approves documents for all household members
  - Expected: All 5 individuals marked approved
  - Actual: ___________

#### Board Final & Payment
- ⬜ Board final approval
  - Expected: Status = "approved_pending_payment"
  - Actual: ___________
- ⬜ Dues page shows family rate ($100 USD)
  - Expected: $100 (not $50 individual rate)
  - Actual: ___________
- ⬜ William submits payment
  - Expected: Treasurer receives notification
  - Actual: ___________

#### Activation & Cascade
- ⬜ Treasurer approves payment
  - Expected: Activation email sent
  - Actual: ___________
- ⬜ All 5 household members activated
  - Expected: Each has active=TRUE, membership_expiration_date set
  - Actual: ___________
- ⬜ Check voting eligibility
  - Sarah: active (adult, age 17+)
  - Emma: check if 17+ (voting eligible) or <17 (no vote)
  - Lucas: check if 17+ or <17
  - Thabo (staff): check if voting_eligible flag set
  - Actual: ___________

**Scene 02 Result:** ✅ PASSED | ❌ FAILED

**Completion Time:** ____________ | **Completed By:** ____________ | **Date:** ____________

---

### SCENE 03: Category Routing — All Six Types

**Status:** ⬜ Pending | 🔄 In Progress | ✅ Passed | ❌ Failed

**Duration:** ~90 minutes (6 paths × ~15 min each)

Submit 6 applications (one per category) and verify questionnaire routing.

#### Path A: Full Individual
- ⬜ Load test data (Full + Individual)
- ⬜ Q1: YES, Q1b: NO → Category = Full
- ⬜ Submit as James Morrison (michael+fullindividual@raneyworld.com)
- ⬜ No sponsor required
- Result: ✅ / ❌

#### Path B: Temporary Individual
- ⬜ Load test data (Temporary + Individual)
- ⬜ Q1: YES, Q1b: YES → Category = Temporary
- ⬜ Submit as Patricia Anderson
- ⬜ No sponsor required
- Result: ✅ / ❌

#### Path C: Associate Individual
- ⬜ Load test data (Associate + Individual)
- ⬜ Q1: NO, Q2: YES → Category = Associate
- ⬜ Submit as David Chen
- ⬜ Sponsor required ✅
- Result: ✅ / ❌

#### Path D: Affiliate Individual
- ⬜ Load test data (Affiliate + Individual)
- ⬜ Q1: NO, Q2: NO, Q3: YES → Category = Affiliate
- ⬜ Submit as Boitumelo Lekgotho
- ⬜ Sponsor required ✅
- Result: ✅ / ❌

#### Path E: Diplomatic Individual
- ⬜ Load test data (Diplomatic + Individual)
- ⬜ Q1: NO, Q2: NO, Q3: NO, Q4: YES → Category = Diplomatic
- ⬜ Submit as Jean-Pierre Dupont
- ⬜ Sponsor required ✅
- ⬜ Verify dues = $75 USD (higher than Full)
- Result: ✅ / ❌

#### Path F: Community Individual
- ⬜ Load test data (Community + Individual)
- ⬜ Q1: NO, Q2: NO, Q3: NO, Q4: NO → Category = Community
- ⬜ Submit as George Makgawe
- ⬜ Sponsor required ✅ (ONLY for Community)
- ⬜ Verify dues = $75 USD
- Result: ✅ / ❌

#### Cross-Category Verification (Board)
- ⬜ All 6 applications appear in Admin Portal
- ⬜ Dues rates differ correctly by category
- ⬜ Exchange rate is live (not hardcoded)
- ⬜ Pro-ration applied correctly

**Scene 03 Result:** ✅ PASSED (6/6 paths) | ⚠️ PARTIAL (___/6) | ❌ FAILED

**Completion Time:** ____________ | **Completed By:** ____________ | **Date:** ____________

---

### SCENE 04: Board Denial Scenarios

**Status:** ⬜ Pending | 🔄 In Progress | ✅ Passed | ❌ Failed

**Duration:** ~30 minutes

#### Denial at Initial Review
- ⬜ Board member opens application from Scene 03
- ⬜ Clicks "Deny Initial Review"
- ⬜ Provides denial reason (e.g., "Insufficient employment verification")
- ⬜ Applicant receives denial email
- ⬜ Status set to "denied" (terminal)
- Result: ✅ / ❌

#### No Activation Possible
- ⬜ Applicant logs in and sees denial message
- ⬜ No payment page appears
- ⬜ No appeal option (one-time decision)
- Result: ✅ / ❌

**Scene 04 Result:** ✅ PASSED | ❌ FAILED

---

### SCENE 05: RSO Document Rejection & Recovery

**Status:** ⬜ Pending | 🔄 In Progress | ✅ Passed | ❌ Failed

**Duration:** ~40 minutes

#### RSO Rejects Document
- ⬜ RSO approver receives documents from Scene 01 (James Morrison)
- ⬜ RSO rejects one document with reason (e.g., "Photo out of focus")
- ⬜ Applicant receives rejection email
- ⬜ Status: "rso_rejected" → Applicant can resubmit
- Result: ✅ / ❌

#### Applicant Resubmits
- ⬜ James uploads corrected document
- ⬜ New submission received by RSO
- ⬜ Status: "submitted" again
- Result: ✅ / ❌

#### RSO Re-approves
- ⬜ RSO approves revised documents
- ⬜ Applicant notified
- ⬜ Flow continues to board final review
- Result: ✅ / ❌

**Scene 05 Result:** ✅ PASSED | ❌ FAILED

---

### SCENE 06: Payment Edge Cases

**Status:** ⬜ Pending | 🔄 In Progress | ✅ Passed | ❌ Failed

**Duration:** ~60 minutes (run Parts A–D)

#### Part A: BWP Payment with Wiggle Room
- ⬜ Applicant submits BWP payment slightly off (e.g., $876 instead of $875)
- ⬜ Treasurer approves with judgment (wiggle room accepted)
- ⬜ Status: "verified"
- Result: ✅ / ❌

#### Part B: Clarification Request
- ⬜ Treasurer requests clarification (e.g., "Need transaction reference")
- ⬜ Applicant receives email; status = "clarification_requested"
- ⬜ Applicant resubmits with additional info
- ⬜ Treasurer approves revised submission
- Result: ✅ / ❌

#### Part C: Rejection & Resubmit
- ⬜ Treasurer rejects payment (e.g., "Amount mismatch")
- ⬜ Applicant receives rejection email with reason
- ⬜ Applicant resubmits corrected payment
- ⬜ Treasurer approves second submission
- Result: ✅ / ❌

#### Part D: SDFCU Member2Member
- ⬜ Applicant selects SDFCU as payment method
- ⬜ Form shows SDFCU account details
- ⬜ Applicant submits proof
- ⬜ Treasurer approves
- Result: ✅ / ❌

#### Exchange Rate Spot Check
- ⬜ Payment page shows live exchange rate (USD to BWP)
- ⬜ Rate matches Configuration sheet value (not hardcoded 13.45)
- ⬜ BWP amount = USD amount × rate (verify arithmetic)
- Result: ✅ / ❌

**Scene 06 Result:** ✅ PASSED (4/4 parts) | ⚠️ PARTIAL (___/4) | ❌ FAILED

---

### SCENE 07: Household Management

**Status:** ⬜ Pending | 🔄 In Progress | ✅ Passed | ❌ Failed

**Duration:** ~45 minutes

Use William Peterson (Full Family from Scene 02) for this test.

#### Add New Child
- ⬜ William logs in → Profile → Add Family Member
- ⬜ Add child: "James Peterson Jr.", DOB: [recent date, <17]
- ⬜ Child record created with can_access_unaccompanied=FALSE
- ⬜ Child NOT voting eligible (age <17)
- Result: ✅ / ❌

#### Add Adult Child (Voting Eligible)
- ⬜ Add second child: "Charlotte Peterson", DOB: [2007, age 17+]
- ⬜ Charlotte record created with voting_eligible=TRUE
- Result: ✅ / ❌

#### Edit Spouse Info
- ⬜ Update Sarah's phone number
- ⬜ Change reflected in Individuals sheet
- Result: ✅ / ❌

#### Remove Child
- ⬜ Remove a child (soft delete, not hard delete)
- ⬜ Child marked inactive but record preserved
- ⬜ Check Individuals sheet for removed status
- Result: ✅ / ❌

**Scene 07 Result:** ✅ PASSED | ❌ FAILED

---

### SCENE 08: Portal UI — All Status States

**Status:** ⬜ Pending | 🔄 In Progress | ✅ Passed | ❌ Failed

**Duration:** ~45 minutes

Test responsive design and navigation across all status states.

#### Status: Awaiting Documents
- ⬜ Use applicant from Scene 03 (pre-board approval)
- ⬜ Check UI at 390px (mobile), 768px (tablet), 1200px (desktop)
- ⬜ Document upload section visible and functional
- Result: ✅ / ❌

#### Status: Under Board Review
- ⬜ Use same applicant (after board initial but before RSO)
- ⬜ UI shows "Awaiting RSO Review" message
- ⬜ No upload button visible
- Result: ✅ / ❌

#### Status: Under RSO Review
- ⬜ UI shows RSO is reviewing
- ⬜ Status timeline visible
- Result: ✅ / ❌

#### Status: Approved Pending Payment
- ⬜ Use applicant from Scene 01 (after board final approval)
- ⬜ Payment page visible with dues amount
- ⬜ Form functional at all screen sizes
- Result: ✅ / ❌

#### Status: Payment Submitted
- ⬜ After applicant submits payment
- ⬜ UI shows "Awaiting Treasurer Review"
- ⬜ Document proof visible
- Result: ✅ / ❌

#### Status: Active Membership
- ⬜ After treasurer approval
- ⬜ Full portal available (Dashboard, Reservations, Profile, Card)
- ⬜ Membership card displays correctly
- Result: ✅ / ❌

#### Status: Denied
- ⬜ Use applicant from Scene 04
- ⬜ UI shows denial message and reason
- ⬜ No path to reapply shown (terminal status)
- Result: ✅ / ❌

#### Admin Portal Navigation
- ⬜ Board user logs in → See board nav items
- ⬜ RSO user logs in → See rso nav items
- ⬜ Treasurer user logs in → See payment review
- Result: ✅ / ❌

**Scene 08 Result:** ✅ PASSED | ❌ FAILED

---

### SCENE 09: Post-Activation Verification

**Status:** ⬜ Pending | 🔄 In Progress | ✅ Passed | ❌ Failed

**Duration:** ~30 minutes

Use James Morrison (Scene 01) and William Peterson (Scene 02) after activation.

#### Individual Member Features
- ⬜ James logs in → Dashboard visible
  - Membership status shows "Active"
  - Expiration date shown (next July 31)
- ⬜ Membership Card page
  - Card displays correct name, household ID, membership type
  - Card usable at facilities
- ⬜ Profile page
  - Can view/edit personal info
  - Phone numbers editable
  - Cannot edit email (immutable)
- ⬜ Reservations available
  - Can book Tennis, Leobo, etc.
  - Limits enforced per config
- Result: ✅ / ❌

#### Family Member Features
- ⬜ William logs in → Dashboard shows entire household (5 members)
- ⬜ Spouse (Sarah) can make reservations unaccompanied
  - can_access_unaccompanied = TRUE
- ⬜ Child (Emma, <17) can view card but only accompanied
  - can_access_unaccompanied = FALSE
- ⬜ All household members shown on dashboard
- Result: ✅ / ❌

#### Record Integrity Check
- ⬜ Households sheet
  - active = TRUE
  - membership_expiration_date = next July 31 of current/next membership year
  - primary_member_id = correct
- ⬜ Individuals sheet
  - All household members have active = TRUE
  - voting_eligible set correctly (17+: yes, <17: no for children, NA for staff)
  - can_access_unaccompanied set correctly
- ⬜ File Submissions sheet
  - All documents marked "approved" (or "verified")
  - cloud_storage_path populated for approved photos
- ⬜ Payments sheet
  - Payment record shows status = "verified"
  - Correct amount and currency recorded
  - Treasurer sign-off dates populated
- Result: ✅ / ❌

**Scene 09 Result:** ✅ PASSED | ❌ FAILED

---

### SCENE 10: Admin Account Management

**Status:** ⬜ Pending | 🔄 In Progress | ✅ Passed | ❌ Failed

**Duration:** ~30 minutes

**Note:** Run before or in parallel with Scene 01 to ensure admin accounts exist.

#### Admin Account Setup
- ⬜ System Backend workbook → Administrators sheet
- ⬜ Verify rows exist for:
  - board@geabotswana.org (role: board)
  - treasurer@geabotswana.org (role: board or treasurer)
  - rso-approve@geabotswana.org (role: rso_approve)
- Result: ✅ / ❌

#### Admin Login
- ⬜ Admin Portal login (same URL as member portal)
- ⬜ Enter email: board@geabotswana.org
- ⬜ Enter password (from Administrators sheet)
- ⬜ Admin dashboard loads
- ⬜ Sidebar shows board-specific nav (Applications, Members, etc.)
- Result: ✅ / ❌

#### Role-Based Navigation
- ⬜ Board user → Sees all admin sections
- ⬜ RSO user → Sees Document Reviews, Guest Lists, Calendar (limited)
- ⬜ Treasurer → Sees Payments section
- Result: ✅ / ❌

#### Add New Admin Account
- ⬜ Add new row to Administrators sheet:
  - Email: test-admin@example.com
  - Password hash: (use same hash function as member passwords)
  - Role: board
  - Active: TRUE
- ⬜ New admin can log in
- ⬜ Dashboard loads for that user
- Result: ✅ / ❌

#### Password Reset Workflow
- ⬜ Deactivate an admin: Set active=FALSE
- ⬜ Admin cannot log in (credentials rejected)
- ⬜ Reactivate: Set active=TRUE
- ⬜ Admin can log in again
- Result: ✅ / ❌

#### Session Security
- ⬜ Admin logs in in one browser tab
- ⬜ Opens another tab (different session)
- ⬜ Both sessions work independently
- ⬜ Logout in one tab doesn't affect other tab
- Result: ✅ / ❌

**Scene 10 Result:** ✅ PASSED | ❌ FAILED

---

## Summary & Results

### Overall Test Results

| Scene | Status | Pass/Fail | Duration | Notes |
|-------|--------|-----------|----------|-------|
| 01 | ✅ / ❌ | ___ | ___ | ___ |
| 02 | ✅ / ❌ | ___ | ___ | ___ |
| 03 | ✅ / ❌ | ___ | ___ | ___ |
| 04 | ✅ / ❌ | ___ | ___ | ___ |
| 05 | ✅ / ❌ | ___ | ___ | ___ |
| 06 | ✅ / ❌ | ___ | ___ | ___ |
| 07 | ✅ / ❌ | ___ | ___ | ___ |
| 08 | ✅ / ❌ | ___ | ___ | ___ |
| 09 | ✅ / ❌ | ___ | ___ | ___ |
| 10 | ✅ / ❌ | ___ | ___ | ___ |
| **TOTAL** | | **✅ 10/10** | **~5 hours** | |

### High-Level Issues Found

```
[Summarize critical issues discovered during testing]
```

### Recommendations

```
[Suggest improvements or fixes based on test results]
```

---

**Test Run Date:** ________________
**Test Lead:** ________________
**Testers:** ________________, ________________, ________________
**Overall Result:** ✅ **PASS** | ⚠️ **PASS WITH NOTES** | ❌ **FAIL**

---

**Last Updated:** March 30, 2026
**Version:** 1.0
