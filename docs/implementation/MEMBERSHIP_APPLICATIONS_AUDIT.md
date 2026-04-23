# Membership Applications Workflow - AUDIT DOCUMENT

**Date:** April 23, 2026  
**Audit Scope:** Complete membership application lifecycle, including interconnections with file submissions and payments  
**Status:** Deep-dive analysis in progress  
**Format:** Findings organized by workflow stage; discrepancies flagged without assumptions about "correct" source

---

## Overview of Audit Approach

This audit compares three sources for each workflow stage:
1. **CLAUDE_Membership_Implementation.md** — What documentation claims should happen
2. **ApplicationService.js** — What code actually does
3. **Code.js handlers** — How the API routes requests
4. **Email templates** — What notifications are sent and when

**Key Question:** Where documentation and code diverge, we'll identify it and discuss which source is authoritative.

---

## FINDINGS BY WORKFLOW STAGE

---

## STAGE 1-3: Application Submission (Applicant Creates Account)

### What Docs Claim

**CLAUDE_Membership_Implementation.md (lines 94-190):**
- STEP 1: Applicant accesses form, answers questionnaire, system suggests category
- STEP 2: Applicant provides personal info (first/last name, email, phone, employment info, sponsor if Community)
- STEP 3: Applicant submits application
  - New Household created with `active=FALSE`, `membership_status="Applicant"`
  - Primary Individual created with temporary password
  - Application record created with `status="awaiting_docs"`
  - Email template: "MEM_APPLICATION_RECEIVED_TO_APPLICANT" (welcome)
  - Email template: "ADM_NEW_APPLICATION_BOARD_TO_BOARD" (board notification)
  - Return message: "Application submitted successfully"

**Employment info fields captured:**
- Job title (all categories)
- Posting date (Full/Associate/Diplomatic/Temporary only)
- Departure date (same categories)
- NOT captured: department, employment status

**Household creation:**
- `household_id` format: HHS-YYYY-MM-DD-###
- `household_name`: Applicant last name + " Household" (or hyphenated if spouse has different name)
- `household_type`: Individual or Family
- `membership_category`: From applicant selection
- `membership_level_id`: Derived from category + household type
- `membership_expiration_date`: Next July 31 based on current date

**Individual creation:**
- `individual_id` format: IND-YYYY-MM-DD-###
- Temporary password auto-generated
- `password_hash`: SHA256 of temp password
- `relationship_to_primary`: "Primary"
- `active`: FALSE (until membership activated)
- `voting_eligible`: FALSE (until active)

**Family members (if family application):**
- Spouse: created with `relationship_to_primary="Spouse"`
- Children: created with DOB (REQUIRED), `relationship_to_primary="Child"`, `can_access_unaccompanied=FALSE` (until age 18)
- Household staff: created with name, omang number, phone

### What Code Actually Does

**ApplicationService.js - `createApplicationRecord()` (lines 43-330):**

✅ **Matches:** Validates required fields, creates household, creates primary individual, creates family members/staff if provided

⚠️ **DISCREPANCIES FOUND:**

1. **Household creation format**
   - **Docs claim:** `household_id` format HHS-YYYY-MM-DD-### 
   - **Code does:** `householdId = generateId("HSH")` (line 81)
   - **Question:** What does `generateId("HSH")` produce? Is it HHS- or HSH- prefix?

2. **Family member email handling**
   - **Docs claim:** Family members have email addresses (implied in section 1.2)
   - **Code does:** `email: ""` for family members (lines 193, 207)
   - **Status:** Family members created WITHOUT email addresses during application

3. **Staff member employment dates**
   - **Docs claim:** Capture employment start/end dates for staff
   - **Code does:** Line 175: `arrival_date: todayStr` (auto-populate with application submission date, comment says "employment start date")
   - **Status:** Code DOES NOT read from form field; auto-fills with TODAY

4. **Family member relationship handling**
   - **Docs claim:** Spouse, children, household staff as relationships
   - **Code does:** Uses constants `RELATIONSHIP_SPOUSE`, `RELATIONSHIP_PRIMARY`, `RELATIONSHIP_STAFF` (lines 94, 133, 164, 194)
   - **Question:** Are constants defined? What values do they have?

5. **Employment info fields captured**
   - **Docs claim:** Capture job title, posting date, departure date for Full/Associate/Diplomatic/Temporary
   - **Code does:** Lines 142-145 - Captures ALL fields from form if provided, but no validation that posting_date/departure_date are only for certain categories
   - **Status:** Code captures more broadly than docs claim

6. **Household type field**
   - **Docs claim:** Captured from applicant selection in form
   - **Code does:** Line 82: `householdType = formData.household_type || HOUSEHOLD_INDIVIDUAL` (defaults to Individual)
   - **Question:** Does the form always provide household_type? What is HOUSEHOLD_INDIVIDUAL value?

7. **Membership expiration date**
   - **Docs claim:** Set to next July 31 based on current date
   - **Code does:** Lines 115-116: `membership_start_date: ""`, `membership_expiration_date: ""` (BOTH empty at creation)
   - **Status:** Code does NOT set expiration date at application creation; set later during activation

8. **Temporary password generation**
   - **Docs claim:** Auto-generated, sent via email "MEM_ACCOUNT_CREDENTIALS_TO_APPLICANT"
   - **Code does:** Line 75: `_generateTemporaryPassword()` called (function not shown)
   - **Question:** What does `_generateTemporaryPassword()` produce?

### Email Templates Sent at Stage 3

**Docs claim these templates are sent:**
1. "MEM_APPLICATION_RECEIVED_TO_APPLICANT" ← Docs reference line 177, but code references "MEM_APPLICATION_RECEIVED_TO_APPLICANT" (line 280)
2. "MEM_ACCOUNT_CREDENTIALS_TO_APPLICANT" ← Code reference (line 289)
3. "ADM_NEW_APPLICATION_BOARD_TO_BOARD" ← Code reference (line 306)

**Code actually sends (ApplicationService.js lines 279-312):**
- `sendEmailFromTemplate("MEM_APPLICATION_RECEIVED_TO_APPLICANT", ...)` ✅
- `sendEmailFromTemplate("MEM_ACCOUNT_CREDENTIALS_TO_APPLICANT", ...)` ✅
- `sendEmailFromTemplate("ADM_NEW_APPLICATION_BOARD_TO_BOARD", ...)` ✅

✅ **Templates match between docs and code**

---

## STAGE 4: Applicant Logs In & Views Dashboard

### What Docs Claim

**CLAUDE_Membership_Implementation.md (lines 192-210):**
- Applicant logs in with email and temp password
- Dashboard shows: "Under Review by Board"
- Current step: "1. Submit Documents"
- Displays document requirements (based on category)
- Shows upload interface for documents
- Status indicator: "Documents pending" or "All documents submitted"

### What Code Actually Does

**ApplicationService.js - `getApplicationForApplicant()` (lines 340-400+):**
- Retrieves application status
- Gets all individuals in household
- Gets file submissions for each individual
- Queries "Membership Pricing" sheet for dues info (not clearly documented)
- Returns application status and document list

⚠️ **DISCREPANCIES:**

1. **Dashboard status display**
   - **Docs claim:** "Under Review by Board"
   - **Code:** Returns `application.status` but doesn't specify what UI displays for different statuses
   - **Question:** Where does Portal.html handle the display logic?

2. **Document requirements logic**
   - **Docs claim:** Documents required based on category
   - **Code:** Doesn't show category-specific document logic; retrieves all submitted documents
   - **Question:** Where is category-specific document requirement logic implemented?

3. **Pricing sheet query**
   - **Docs claim:** NOT mentioned; annual dues set based on membership level
   - **Code:** Lines 370-385 - Queries "TAB_MEMBERSHIP_PRICING" sheet for year-specific dues
   - **Status:** NEW/UNDOCUMENTED feature - code is querying a "Membership Pricing" sheet that isn't mentioned in CLAUDE_Membership_Implementation.md
   - **Question:** What is this sheet? Where is it defined in schema?

---

## STAGE 5: Applicant Submits Documents

### What Docs Claim

**CLAUDE_Membership_Implementation.md (lines 212-244):**
- Applicant uploads documents via `Portal.uploadDocument()`
- Creates File Submission record with `status="submitted"`
- Document validation: file type, photo specs (600x600-1200x1200px, 54KB-10MB)
- Application dashboard shows "Submitted - Awaiting Review"
- No notifications sent yet (wait for board review)

**Document types required vary by category:**
- Passport: required for all non-Botswanans; optional for citizens
- Omang: required for Botswana citizens; optional alternative to passport
- Diplomatic Passport: required for Diplomatic category ONLY
- Passport-style photo: required for all
- Employment verification: may be requested, not always required

### What Code Actually Does

**FileSubmissionService.js / Code.js handlers:**

⚠️ **Unable to fully audit from Code.js snippets; need to read FileSubmissionService.js complete implementation**

**QUESTION:** Does File Submission code during application differ from normal file submission? Is there application-specific document requirement logic?

---

## STAGE 6: Board Reviews Application & Documents (Board Initial Review)

### What Docs Claim

**CLAUDE_Membership_Implementation.md (lines 246-318):**
- Board member logs in to Admin.html
- Sees pending applications
- Reviews: applicant info, family members, employment info, documents, timeline

**Board actions:**

**APPROVE PATH:**
- Update Application: `board_initial_status="approved"`, `board_approved_by=[BOARD_MEMBER]`, `board_approval_timestamp=NOW`
- Send documents to RSO for review: Update File Submissions `status="submitted"` (awaiting RSO)
- Email: ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE (to rso-approve@geabotswana.org)
- Email: ADM_DOCS_SENT_TO_RSO_TO_MEMBER (to applicant)

**DENY PATH:**
- Update Application: `board_approval_status="denied"`, `board_denial_reason=[REASON]`
- Update Household: `active=FALSE`
- Disable individual accounts: `active=FALSE` for all household members
- Email: "Application Not Approved"

**REQUEST MORE INFO PATH:**
- Update Application: `board_approval_status="pending_info"`, `pending_info_description=[DETAILS]`
- Email applicant with deadline
- Application remains "Under Review" status

### What Code Actually Does

**Code.js - `_handleAdminApproveApplication()` (lines 3073-3108):**
```javascript
if (p.stage === "board_initial") {
  result = boardInitialDecision(p.application_id, "approved", ...);
}
```

**Code.js - `_handleAdminDenyApplication()` (lines 3114-3157):**
```javascript
if (p.stage === "board_initial") {
  result = boardInitialDecision(p.application_id, "denied", ...);
}
```

⚠️ **CRITICAL DISCREPANCIES:**

1. **Status field names**
   - **Docs claim:** `board_approval_status` and `board_approval_timestamp`
   - **Code calls:** `boardInitialDecision()` function (not shown in Code.js snippets)
   - **Question:** What fields does `boardInitialDecision()` actually update? Is it `board_initial_status` or `board_approval_status`?
   - **Schema shows:** `board_initial_status`, `board_initial_reviewed_by`, `board_initial_review_date`, `board_initial_notes`, `board_initial_denial_reason`
   - **Status:** Likely mismatch between docs terminology and actual database field names

2. **Request More Info path**
   - **Docs claim:** "REQUEST MORE INFO PATH" exists with `pending_info` status
   - **Code:** No handler for "request_info" stage visible in Code.js handlers
   - **Question:** Is this "Request More Info" feature actually implemented? Or is it a future feature?

3. **Document status transition**
   - **Docs claim:** File Submissions `status="submitted"` (awaiting RSO review)
   - **Question:** Does the code automatically change file submission status when board approves? Or does applicant need to resubmit?

4. **Email to RSO**
   - **Docs claim:** "ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE" template sent to rso-approve@geabotswana.org
   - **Question:** Where is this email triggered in the code?

---

## STAGE 7: RSO Reviews & Approves Documents, Then Application (RSO Two-Tier Approval)

### What Docs Claim

**CLAUDE_Membership_Implementation.md (lines 320-395):**

**TWO-TIER RSO APPROVAL:**

**TIER 1: RSO Reviews Individual Documents**
- RSO logs in to Admin Portal
- Navigates to "Document Reviews" section
- Reviews each document (passport, omang, diplomatic passport, photo, employment verification)
- Actions per document: [Approve] [Reject with reason] [optionally block resubmission]

**DOCUMENT APPROVAL:**
- Click [Approve]
- Update File Submissions: `status="rso_approved"`
- Set: `rso_reviewed_by=[LOGGED_IN_RSO_EMAIL]`, `rso_review_date=NOW`

**DOCUMENT REJECTION:**
- Click [Reject]
- Update File Submissions: `status="rso_rejected"`
- Set: `rso_reviewed_by=[LOGGED_IN_RSO_EMAIL]`, `rso_review_date=NOW`, `rejection_reason=[REASON]`, `allow_resubmit=FALSE` (optional)
- Email: ADM_DOCUMENT_REJECTED_BY_RSO_TO_BOARD (board notified)
- Application stays in `rso_docs_review` (waits for resubmission)

**TIER 2: RSO Approves Complete Application**
- Once ALL required documents approved, RSO sees "Applications Ready for RSO Approval"
- RSO clicks [Approve Application]
- Update Application: `status="rso_application_review"` (intermediate state), `rso_status="approved"`, `rso_reviewed_by=[LOGGED_IN_RSO_EMAIL]`, `rso_review_date=NOW`
- Email: ADM_RSO_APPLICATION_APPROVED_TO_BOARD

**DOCUMENT RESUBMISSION:**
- Applicant logs in, sees rejected document
- Re-uploads corrected document
- New File Submission record created: `status="submitted"`
- Application stays in `rso_docs_review` status
- RSO sees updated document list, repeats review cycle

### What Code Actually Does

⚠️ **UNABLE TO AUDIT FULLY** - Code handlers for RSO document review not visible in Code.js snippets shown so far. Need to read:
- `_handleRsoApproveDocument()` or similar
- FileSubmissionService.js RSO document handling
- Admin.html RSO review interface logic

**Code.js shows:**
- `_handleRsoApproveApplication()` (lines 3164-3187) - RSO approves application
- `_handleRsoDenyApplication()` (lines 3193-3199+) - RSO recommends denial
- Calls function `rsoApproveApplication()` and `rsoDecision()`

**QUESTIONS:**

1. **Tier 1 vs Tier 2 distinction**
   - **Docs claim:** Two separate approval steps (individual documents, then whole application)
   - **Code:** Unclear if tier 1 is implemented as separate step or automatic
   - **Question:** Does RSO approve documents one-by-one, or approve all documents at once?

2. **Document rejection and resubmission**
   - **Docs claim:** `allow_resubmit=FALSE` field can block resubmission
   - **Question:** Is this field actually implemented in code? Where does it live?

3. **RSO role**
   - **Docs claim:** `rso` role with `rso_approve` role mentioned
   - **Earlier user correction:** "RSO does NOT review photos"
   - **Question:** What documents DO RSO review? (Docs vs code)

---

## STAGE 8: Applicant Submits Payment Proof

### What Docs Claim

**CLAUDE_Membership_Implementation.md (lines 397-428):**
- Applicant submits payment proof after board-initial approval and RSO approval
- Creates Payment record (from PaymentService)
- Update Application: `payment_status="submitted"`, `payment_submission_timestamp=NOW`
- Email treasurer: "Payment Proof Submitted - Needs Verification"
- Email applicant: "Payment Received - Verifying"
- Verification deadline: 2 business days

### What Code Actually Does

**ApplicationService.js - `submitPaymentProof()` (lines 869-...)**
- Creates Payment record
- Updates Application
- Sends emails
- Audit log

⚠️ **QUESTION:** When can applicant submit payment? Is it AFTER RSO approval or BEFORE board final approval?
- **Docs suggest:** After RSO application approval but before board final
- **Code logic:** Need to verify the validation checks

---

## STAGE 9: Treasurer Verifies Payment & Activates Membership

### What Docs Claim

**CLAUDE_Membership_Implementation.md (lines 430-506):**

**VERIFY & ACTIVATE:**
- Treasurer reviews payment
- Clicks [Verify & Activate]
- Update Payment: `status="verified"`, `verified_by=[TREASURER]`, `verification_timestamp=NOW`
- Update Application: `payment_status="verified"`, `payment_verified_timestamp=NOW`, `status="activated"`, `final_approval_timestamp=NOW`
- Update Household: `active=TRUE`, `membership_expiration_date=next July 31`, `membership_start_date=TODAY`
- Update Individuals: `active=TRUE`, `voting_eligible=TRUE` (primary & spouse), unlock portal features
- Transfer approved photos to Cloud Storage: `gs://gea-member-data/{household_id}/{individual_id}/photo.jpg`
- Email applicant: "Welcome to GEA! Membership Activated"
- Email board: "New Member Activated"
- Audit log

### What Code Actually Does

⚠️ **Expect this section matches closely to code since it's recent feature (Phase 2)**

Need to verify in PaymentService.js activation logic

---

## STAGE 10-11: Portal Features & Renewal

### What Docs Claim

**CLAUDE_Membership_Implementation.md (lines 508-542):**

**If membership ACTIVE:**
- Dashboard: "Your membership is active through July 31, 20XX"
- Unlock features: Reservations, Profile, Membership Card, household member list
- Application dashboard archived (hidden but available)

**If membership PENDING:**
- Dashboard: "Your application is [current stage]"
- Restrict features: No reservations, limited profile

**If membership DENIED:**
- Account remains active (read-only)
- Message: "Your application was not approved"
- No portal access to member features

**STEP 11: Membership Renewal (Nightly Task)**
- NotificationService.runNightlyTasks() at 2:00 AM GMT+2
- Check: Current date within 30 days before expiration?
  - 30-day warning: Send email
  - 7-day warning: Send email
  - After July 31: Set household/individual active=FALSE
- Renewal process: [TBD - out of scope]

### What Code Actually Does

**Portal.html / Code.js dashboard logic:**

⚠️ **Unable to audit without reading Portal.html and dashboard handlers**

---

## CROSS-CUTTING CONCERNS - INTERCONNECTIONS

### File Submissions ↔ Applications

**Docs claim:**
- During application, applicant uploads documents
- Documents linked to Application via File Submissions sheet
- RSO reviews documents in context of application
- Approved documents (photos) transferred to Cloud Storage on final activation

**Code considerations:**
- File Submission schema has `application_id` field (from schema docs)
- Unclear if application-specific document requirements enforced
- Unclear which documents are required for which categories

### Payments ↔ Applications

**Docs claim:**
- After board-initial approval and RSO approval, applicant can submit payment proof
- Payment creates Payment record, links to Application via `payment_id`
- Treasurer verification triggers membership activation
- Pro-ration based on quarter

**Code considerations:**
- PaymentService handles pro-ration
- Unclear exactly when payment submission becomes available
- Unclear if pro-ration considers membership category

### Email Templates - Complete List for Applications

**Docs reference these templates (should verify all exist):**
1. MEM_APPLICATION_RECEIVED_TO_APPLICANT (Step 3 - submission confirmation)
2. MEM_ACCOUNT_CREDENTIALS_TO_APPLICANT (Step 3 - login credentials)
3. ADM_NEW_APPLICATION_BOARD_TO_BOARD (Step 3 - board notification)
4. ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE (Step 6 - RSO document request)
5. ADM_DOCS_SENT_TO_RSO_TO_MEMBER (Step 6 - applicant notification)
6. ADM_DOCUMENT_REJECTED_BY_RSO_TO_BOARD (Step 7 - rejection notification)
7. ADM_RSO_APPLICATION_APPROVED_TO_BOARD (Step 7 - approval notification)
8. "Payment Proof Submitted" email template (Step 8)
9. "Payment Received - Verifying" email template (Step 8)
10. "Welcome to GEA! Membership Activated" (Step 9)
11. "New Member Activated" (Step 9)
12. "Your application was not approved" (Denial path)
13. "More Information Needed" (Request Info path)

**Question:** Are all these templates actually implemented in the code? Which templates exist in email_templates/ directory?

---

## STATUS FIELD TERMINOLOGY MISMATCH

**Critical Issue:**

**Docs use:**
- `board_approval_status`
- `board_approval_timestamp`
- `board_initial_status`
- `board_initial_denial_reason`

**Code may use:**
- `board_initial_status`
- `board_initial_review_date`
- `board_initial_notes`
- `board_initial_denial_reason`

**Schema defines:**
- `board_initial_status`
- `board_initial_reviewed_by`
- `board_initial_review_date`
- `board_initial_notes`
- `board_initial_denial_reason`
- `board_final_status`
- `board_final_reviewed_by`
- `board_final_review_date`
- `board_final_denial_reason`

**Question:** Are docs using outdated terminology?

---

## SUMMARY OF DISCREPANCIES FOUND

| Category | Docs Claim | Code Does | Status | Question |
|----------|-----------|-----------|--------|----------|
| Household ID format | HHS-YYYY-MM-DD-### | generateId("HSH") | ⚠️ | Does generateId use HSH or HHS prefix? |
| Family member emails | Implied they have emails | Created with empty email="" | ❌ | Should family members have emails during application? |
| Staff employment dates | Capture from form | Auto-fill with TODAY | ❌ | Should staff employment start date be captured or auto-filled? |
| Employment info scope | Capture for specific categories | Capture for all categories | ⚠️ | Should employment info be category-specific? |
| Membership expiration | Set at application creation | Set at activation | ❌ | When should expiration date be set? |
| Board field names | board_approval_status | board_initial_status | ⚠️ | Terminology mismatch |
| Request Info feature | Documented as working | No handler visible | ❌ | Is "Request More Info" implemented? |
| Document requirements | Category-specific | Unclear in code | ⚠️ | Are doc requirements enforced by category? |
| Pricing sheet | Not documented | Code queries it | ❌ | Where is "Membership Pricing" sheet defined? |
| RSO photo review | "RSO does NOT review photos" (user correction) | Docs claim RSO reviews photos | ❌ | Who actually reviews photos? |
| Payment submission timing | After RSO approval | Unclear | ❓ | When can applicant submit payment? |
| Stage naming | 11 "STEP" labels | Status value names | ⚠️ | Terminology differs (steps vs. statuses) |

---

## NEXT STEPS

This audit needs your input to resolve discrepancies. Key questions for discussion:

1. **Which source is authoritative?** (Docs describing intent vs. code showing reality)
2. **What should the actual workflow be?** (Design decision for uncertain areas)
3. **Which bugs/gaps exist?** (Where code doesn't match intended design)
4. **Which features are unimplemented?** (Planned but not coded, like "Request More Info")

Ready to discuss findings and come to agreement on corrections needed.

---

**Created by:** Code Quality & Documentation Audit  
**Status:** Awaiting user review and discussion  
**Format:** Factual discrepancies flagged without assumptions
