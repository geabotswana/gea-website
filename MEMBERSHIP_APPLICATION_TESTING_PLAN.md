# Membership Application Testing Plan

**Created:** April 25, 2026  
**Purpose:** Comprehensive test coverage for the 11-step membership application workflow

---

## Overview

The membership application system has multiple test paths:
- **11-step workflow** with 4 decision points (approvals/rejections)
- **3 separate status systems** (Application, File Submission, Payment)
- **6 membership categories** with different requirements
- **Multiple user roles** (applicant, board, RSO, treasurer)
- **Document validation** (2-tier for ID docs, 1-tier for photos)
- **Payment verification** with 3 possible outcomes

**Total Test Scenarios:** 50+ distinct paths

---

## Test Categories

### A. HAPPY PATH (Successful Application → Activation)

**Scenario A1: Full Member (Embassy Employee)**
- [ ] Submit application (Q1: Yes - embassy employee)
- [ ] System auto-assigns: Full category
- [ ] Required documents: Passport AND Omang (or one valid ID)
- [ ] Submit documents
- [ ] Board initial review: APPROVE
- [ ] RSO reviews documents: APPROVE all
- [ ] Board final review: APPROVE
- [ ] Submit payment: ${{ANNUAL_DUES_USD}} USD
- [ ] Treasurer verifies payment
- [ ] Account activated → Portal unlocked → Membership card available
- [ ] **Buttons tested:** Submit app, Upload docs, Confirm docs, Approve (board x2), Approve (RSO), Submit payment, Verify payment

**Scenario A2: Associate Member (51%+ USG Funding)**
- [ ] Submit application (Q1: No, Q2: Yes - 51%+ funding)
- [ ] System auto-assigns: Associate category
- [ ] Required documents: Passport AND Omang (or one valid ID) AND Funding Verification (proof of 51%+ USG funding)
- [ ] Note: Employment letter/verification NOT required (can be requested, but not mandatory)
- [ ] Submit documents
- [ ] Board initial review: APPROVE
- [ ] RSO reviews documents: APPROVE all
- [ ] Board final review: APPROVE
- [ ] Submit payment: ${{ANNUAL_DUES_USD}} USD
- [ ] Treasurer verifies payment
- [ ] Expected outcome: Activated

**Scenario A3: Community Member (Sponsored)**
- [ ] Submit application (Q1-4: No, Q5: Yes - has sponsor)
- [ ] System auto-assigns: Community category
- [ ] Required documents: Passport AND Omang (or one valid ID)
- [ ] Required: Sponsor name and email (captured in application)
- [ ] System validates sponsor: Must be Full member, not maxed out (max 3 sponsors)
- [ ] Document flow: RSO reviews → Board final review
- [ ] Expected outcome: Activated

**Scenario A4: Temporary Member (Contractor, 6-month max)**
- [ ] Submit application (Q4: Yes - TDY/temporary)
- [ ] System auto-assigns: Temporary category
- [ ] Duration: Auto-set to 6 months from approval
- [ ] Required documents: Passport AND Omang (or one valid ID)
- [ ] Note: TDY orders NOT required (no documentation upload)
- [ ] Document flow: RSO reviews → Board final review
- [ ] Expected outcome: Activated with 6-month expiration

**Scenario A5: Diplomatic Member**
- [ ] Submit application (Q3: Yes - diplomatic visa)
- [ ] System auto-assigns: Diplomatic category
- [ ] Required documents: Passport AND Omang (or one valid ID)
- [ ] Diplomatic accreditation: MAY request (discretionary, not required)
- [ ] Document flow: RSO reviews → Board final review
- [ ] Expected outcome: Activated

**Scenario A6: Affiliate Member**
- [ ] Submit application (category assigned as fallback or explicit selection)
- [ ] System auto-assigns: Affiliate category
- [ ] Required documents: Passport AND Omang (or one valid ID)
- [ ] Note: Employment verification NOT required
- [ ] Document flow: RSO reviews → Board final review
- [ ] Expected outcome: Activated
- [ ] **Buttons tested:** Submit app, Upload docs, Confirm docs, Approve (board), Approve (RSO), Submit payment, Verify payment

---

### B. BOARD INITIAL REJECTION (Step 3)

**Scenario B1: Reject at Initial Review (First Decision Point)**
- [ ] Submit application
- [ ] Board initial review: REJECT
- [ ] Modal appears for rejection reason
- [ ] Enter reason: "Does not meet eligibility criteria"
- [ ] Application status → `denied`
- [ ] Email sent to applicant with reason
- [ ] **Buttons tested:** Submit app, Deny (board initial), Rejection reason entry
- [ ] **Expected:** Application marked denied; applicant cannot continue

---

### C. RSO DOCUMENT REJECTION PATHS

**Scenario C1: RSO Rejects Passport (Resubmission)**
- [ ] Board approves initial
- [ ] RSO reviews documents
- [ ] RSO rejects passport: "Image too blurry"
- [ ] Passport status → `rso_rejected`
- [ ] Application stalls (waiting for resubmission)
- [ ] Applicant resubmits passport
- [ ] RSO reviews again: APPROVE
- [ ] Document status → `gea_pending` → Board reviews
- [ ] **Buttons tested:** Upload doc, RSO approve, RSO reject, Rejection reason entry

**Scenario C2: RSO Rejects Multiple Documents**
- [ ] Board approves initial
- [ ] RSO reviews 2 documents: Reject both
- [ ] Application stalls waiting for both resubmissions
- [ ] Applicant resubmits one, RSO approves
- [ ] Applicant resubmits other, RSO approves
- [ ] All documents now `gea_pending`
- [ ] Board final review continues
- [ ] **Expected:** All documents must be approved before board final

---

### D. BOARD FINAL REJECTION (Step 5)

**Scenario D1: Board Final Rejection**
- [ ] Pass board initial
- [ ] Pass RSO document review
- [ ] Board final review: REJECT
- [ ] Enter reason: "Does not meet community standards"
- [ ] Application status → `denied`
- [ ] Email sent to applicant
- [ ] **Path difference:** Applicant can't reapply immediately (vs initial rejection allows faster reapply)
- [ ] **Buttons tested:** Deny (board final), Rejection reason entry

---

### E. PAYMENT VERIFICATION PATHS

**Scenario E1: Payment Approved (Happy Path)**
- [ ] Board final approves
- [ ] Applicant submits payment proof
- [ ] Applicant enters: Amount, currency, method, date
- [ ] Treasurer reviews and: APPROVE
- [ ] Payment status → `verified`
- [ ] Application status → `activated`
- [ ] **Buttons tested:** Submit payment, Approve payment

**Scenario E2: Payment Rejected (Clear Rejection)**
- [ ] Board final approves
- [ ] Applicant submits payment proof
- [ ] Treasurer reviews and: REJECT
- [ ] Enter reason: "Receipt not legible"
- [ ] Payment status → `rejected`
- [ ] Application loops: Still expects payment
- [ ] Applicant resubmits different proof
- [ ] Treasurer re-reviews: APPROVE
- [ ] Application activated
- [ ] **Buttons tested:** Submit payment, Reject payment, Rejection reason entry

**Scenario E3: Payment Needs Clarification**
- [ ] Board final approves
- [ ] Applicant submits payment proof
- [ ] Treasurer: REQUEST CLARIFICATION
- [ ] Enter question: "What is reference number for this transaction?"
- [ ] Payment status → `clarification_requested`
- [ ] Email sent to applicant with question
- [ ] Applicant resubmits with clarification
- [ ] Treasurer re-reviews: APPROVE
- [ ] Application activated
- [ ] **Buttons tested:** Submit payment, Request clarification, Clarification message entry

**Scenario E4: Payment Wrong Amount**
- [ ] Board final approves
- [ ] Applicant submits payment: $100 USD (should be $250)
- [ ] Treasurer: REJECT
- [ ] Reason: "Amount doesn't match annual dues"
- [ ] Applicant resubmits: $250 USD
- [ ] Treasurer: APPROVE
- [ ] **Expected:** Application doesn't auto-approve partial payments

**Scenario E5: Payment Pro-ration (Mid-Year Join)**
- [ ] Applicant approved in February
- [ ] System calculates: Q2 dues = 75% of annual
- [ ] Applicant submits $187.50 USD (75% of $250)
- [ ] Treasurer: APPROVE
- [ ] **Expected:** Portal correctly shows pro-rated amount

---

### F. APPLICANT ACTIONS & WITHDRAWALS

**Scenario F1: Applicant Withdraws During Documents Stage**
- [ ] Submit application
- [ ] Board initial: APPROVE
- [ ] Applicant sees: "Waiting for RSO review"
- [ ] Applicant clicks: [Withdraw Application]
- [ ] Modal: "Are you sure?"
- [ ] Confirm withdrawal
- [ ] Application status → `withdrawn`
- [ ] Email notification sent
- [ ] **Buttons tested:** Withdraw application, Confirmation dialog

**Scenario F2: Applicant Withdraws During Payment**
- [ ] Board final approves
- [ ] Applicant status shows: "Payment required"
- [ ] Applicant withdraws instead of paying
- [ ] Application status → `withdrawn`
- [ ] **Expected:** Can reapply fresh (restart from step 1)

**Scenario F3: Applicant Re-applies After Withdrawal**
- [ ] Same person submits new application
- [ ] System treats as NEW application (different app_id)
- [ ] Previous application remains in `withdrawn` status
- [ ] New application goes through full workflow
- [ ] **Expected:** Old and new applications coexist in records

---

### G. DOCUMENT SUBMISSION EDGE CASES

**Scenario G1: Upload Same Document Twice**
- [ ] Applicant uploads passport
- [ ] Status → `submitted`
- [ ] Applicant uploads same passport again (different file)
- [ ] System creates NEW submission record
- [ ] RSO sees both submissions
- [ ] **Expected:** Both appear as separate submissions; can approve either

**Scenario G2: Employment Verification (Optional)**
- [ ] Associate member submits employment letter
- [ ] Board requests: "Need employment verification"
- [ ] Applicant requests employment verification form
- [ ] System triggers: Send employment verification request email
- [ ] Employer completes form
- [ ] Applicant uploads form
- [ ] Status → `submitted` for employment verification
- [ ] **Buttons tested:** Request employment verification, Upload verification

**Scenario G3: Document Already Verified**
- [ ] Applicant previously submitted passport (approved)
- [ ] Creates NEW application for some reason
- [ ] Tries to re-upload same passport
- [ ] System creates new submission record
- [ ] RSO approves immediately (or checks if same document)
- [ ] **Expected behavior:** Unclear if auto-approved or requires re-review

**Scenario G4: Missing Required Document**
- [ ] Full member submits: Only omang (missing passport)
- [ ] Board initial: Can they approve with only omang?
- [ ] **Expected behavior:** Board shouldn't be able to approve; missing doc blocks approval

---

### H. ELIGIBILITY DETERMINATION PATHS

**Scenario H1: Q1=Yes → Full Category**
- [ ] Q1: "Are you a direct US Government employee?" → Yes
- [ ] System auto-selects: Full
- [ ] Other questions: Skipped or ignored
- [ ] **Expected:** Category always Full regardless of other answers

**Scenario H2: Q1=No, Q2=51% → Associate**
- [ ] Q1: No
- [ ] Q2: "Are you 51%+ USG funded?" → Yes
- [ ] System auto-selects: Associate
- [ ] **Expected:** Only these two questions matter

**Scenario H3: Q1=No, Q2=No, But Claims 51%**
- [ ] Q1: No (not direct hire)
- [ ] Q2: No (not 51% funded... or no)
- [ ] Applicant submits anyway
- [ ] RulesService.determineCategory() → Should assign: Community (not Associate)
- [ ] **Expected behavior:** Fallback rule: <51% = Community, not Associate

**Scenario H4: Sponsor Validation During Application**
- [ ] Q5: Yes, have sponsor
- [ ] Sponsor name/email: bob@example.com
- [ ] System validates:
  - [ ] Sponsor exists in Individuals
  - [ ] Sponsor has active membership (status = Member)
  - [ ] Sponsor is Full member (not Associate/etc)
  - [ ] Sponsor hasn't maxed out sponsorships (max 3?)
- [ ] If sponsor invalid: Show error, request different sponsor
- [ ] If sponsor valid: Continue
- [ ] **Buttons tested:** Select sponsor, Validate sponsor, Change sponsor

---

### I. PERMISSION & ROLE-BASED PATHS

**Scenario I1: Applicant Can't Access Admin Functions**
- [ ] Logged in as applicant
- [ ] Try to access: Admin dashboard URL
- [ ] Expected: Redirect to applicant portal or error
- [ ] Can't: Approve other applications, verify payments, etc.

**Scenario I2: Board Member Can Access All Functions**
- [ ] Logged in as board
- [ ] Can: Approve applications, verify payments, view RSO docs
- [ ] RSO members: Permissions?

**Scenario I3: RSO Can Only Approve Documents**
- [ ] Logged in as rso_approve
- [ ] Can: View and approve documents, approve guest lists
- [ ] Can't: Approve applications, verify payments, access admin dashboard
- [ ] RSO_notify: Can only view calendars (read-only)

---

### J. DATA VALIDATION & SANITIZATION

**Scenario J1: Invalid Email in Application**
- [ ] Submit application with email: "notanemail"
- [ ] System should: Reject, show validation error
- [ ] **Expected:** Email format validation on client AND server

**Scenario J2: XSS Attempt in Text Fields**
- [ ] Submit application with name: "<script>alert('xss')</script>"
- [ ] System should: Sanitize input, store safely
- [ ] **Expected:** No script execution; name displayed safely

**Scenario J3: Phone Number Validation**
- [ ] Primary phone: "123" (too short)
- [ ] System should: Reject or format validation
- [ ] Resubmit: "+267 71 123456" (valid Botswana)
- [ ] System accepts

**Scenario J4: Date of Birth Validation**
- [ ] DOB: "2050-01-01" (future date)
- [ ] System should: Reject, show error
- [ ] DOB: "1800-01-01" (unrealistic)
- [ ] System should: Reject or warn

---

### K. STATUS TRANSITIONS & STATE MACHINE

**Scenario K1: Status Can't Go Backwards**
- [ ] Application: `board_initial_review` → Board REJECTS
- [ ] Status: `denied` (terminal state)
- [ ] Can't manually change to `awaiting_docs` or `rso_docs_review`
- [ ] **Expected:** State machine enforces forward-only transitions

**Scenario K2: Multiple Simultaneous File Submissions**
- [ ] Applicant uploads: Passport AND Omang (same time)
- [ ] Both receive submission records
- [ ] RSO approves Passport, rejects Omang
- [ ] Application status: Stalled (waiting for omang resubmission)
- [ ] Applicant resubmits omang
- [ ] Application continues
- [ ] **Expected:** All docs must reach `verified` before advancing

**Scenario K3: Payment Before Board Final Approval**
- [ ] Applicant somehow tries to submit payment during RSO stage
- [ ] System should: Reject or prevent (wrong status)
- [ ] **Expected:** Payment only accepted after `approved_pending_payment` status

---

### L. EMAIL NOTIFICATIONS & AUDIT TRAIL

**Scenario L1: Each Status Change Triggers Email**
- [ ] Submit application → Email: "We received your application"
- [ ] Board approves initial → Email: "Approved for RSO review"
- [ ] RSO approves docs → Email: "Documents approved, board final review"
- [ ] Board approves final → Email: "Approved! Submit payment now"
- [ ] Treasurer approves payment → Email: "Activated! Membership account unlocked"
- [ ] **Expected:** User receives email at each major transition

**Scenario L2: Audit Log Entries**
- [ ] Every action logged: user_email, action_type, target_id, timestamp
- [ ] Example: "board@gea.org" / "APPLICATION_APPROVED_INITIAL" / "APP-123" / "2026-04-25T15:30:00Z"
- [ ] Rejections logged with reason
- [ ] **Expected:** Complete audit trail for compliance

**Scenario L3: Rejection Reason Preserved**
- [ ] Board rejects with reason: "Employment documents incomplete"
- [ ] Applicant receives email with reason
- [ ] Applicant can see reason in portal (if applicable)
- [ ] Audit log records reason
- [ ] **Expected:** Reason is always preserved and communicated

---

### M. CONCURRENT/RACE CONDITIONS

**Scenario M1: Board and Applicant Both Submitting**
- [ ] Applicant submitting payment at same time board is reviewing
- [ ] Expected: Locks prevent both from updating simultaneously
- [ ] One succeeds, other sees: "Status changed, please refresh"

**Scenario M2: Multiple Board Members Reviewing**
- [ ] Board member 1 approves application
- [ ] Board member 2 (at same time) rejects application
- [ ] Expected: First action wins; second sees "Already processed"

---

### N. LONG-TERM STATE (Activation & Beyond)

**Scenario N1: Account Activation Unlocks Features**
- [ ] After activation, applicant's role: `member` (not `applicant`)
- [ ] Portal shows: All pages (reservations, payments, etc.)
- [ ] Can book facilities
- [ ] Can submit payment for future years
- [ ] **Expected:** Full member access after activation

**Scenario N2: Membership Expiration**
- [ ] Member joins; membership expires July 31, 2027
- [ ] On Aug 1, 2027: Membership status → `lapsed`
- [ ] Portal shows: Renewal prompt
- [ ] Member can submit renewal payment
- [ ] **Expected:** Portal guides renewal workflow

---

## Test Execution Checklist

### Per-Scenario Requirements

For EACH scenario, verify:
- [ ] All buttons that should appear ARE visible
- [ ] All buttons that shouldn't appear are NOT visible
- [ ] Correct email sent (check inbox or logs)
- [ ] Database status values correct (check sheet)
- [ ] Audit log entry created with user/timestamp/reason
- [ ] UI shows correct next step / messaging
- [ ] No console errors (F12 → Console)
- [ ] No server errors (Cloud Logs)

### Test Data Requirements

**Test Household:** `HSH-2026-TEST01` (Johnson Family)  
**Test Applicants:**
- Jane Johnson (jane@example.com) — Multiple test runs
- John Johnson (john@example.com) — Test alternate paths
- Family members for household changes

**Test Credentials:**
- Applicant: jane@example.com / password
- Board: board@geabotswana.org / password
- RSO: rso@geabotswana.org / password
- Treasurer: Same as board (for payment verification)

### Known Gaps / Unclear Behaviors

- [ ] **G3:** Auto-approve same document on second application?
- [ ] **K2:** How many simultaneous file submissions supported?
- [ ] **M2:** What's the actual behavior with concurrent updates?
- [ ] **Sponsor limits:** Is it 3 sponsorships max? Configurable?
- [ ] **Temporary membership:** Auto-expire after 6 months?
- [ ] **Pro-ration:** Exact calculation for Q1/Q2/Q3/Q4?
- [ ] **Reapply:** Can applicant reapply immediately after rejection?

---

## Success Criteria

✅ All 50+ scenarios tested  
✅ Every button tested at least once  
✅ Every decision point (approve/reject/clarify) tested  
✅ All 6 membership categories tested  
✅ All 4 rejection points tested  
✅ Payment paths: approved, rejected, clarification  
✅ File submission: approved, rejected, resubmitted  
✅ Audit logs: All actions recorded  
✅ Emails: All notifications sent  
✅ Error handling: Invalid data rejected  
✅ Permissions: Roles enforced  
✅ State machine: Transitions valid  

---

**Total Estimated Time:** 30-40 hours of testing  
**Recommended:** Break into 5-6 testing sessions, 6-8 hours each  
**Test Environment:** Production-like with test data cleared between sessions
