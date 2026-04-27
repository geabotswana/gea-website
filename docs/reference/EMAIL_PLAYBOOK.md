# Email Template Playbook: 9-Step Membership Application Workflow

## STEP 1: Application Submitted
**Status:** `awaiting_docs`
**User Action:** Applicant fills out and submits application form

### Emails Sent (in order):

#### 1.1 → Applicant (IMMEDIATE)
- **Template:** MEM_APPLICATION_RECEIVED_TO_APPLICANT
- **Subject:** "GEA Application Received — Next Steps Inside"
- **Recipient:** applicant email
- **Trigger Location:** ApplicationService.js `createApplicationRecord()` line 290
- **Content Variables:** FIRST_NAME, APPLICATION_ID, PORTAL_URL
- **Purpose:** Confirms receipt, explains next step (upload documents)

#### 1.2 → Applicant (IMMEDIATE)
- **Template:** MEM_ACCOUNT_CREDENTIALS_TO_APPLICANT
- **Subject:** "Your GEA Member Portal Login Details"
- **Recipient:** applicant email
- **Trigger Location:** ApplicationService.js `createApplicationRecord()` line 299
- **Content Variables:** FIRST_NAME, TEMPORARY_PASSWORD, USERNAME, PORTAL_URL
- **Purpose:** Delivers temporary login credentials for portal access

#### 1.3 → Board (IMMEDIATE)
- **Template:** ADM_NEW_APPLICATION_BOARD_TO_BOARD
- **Subject:** "New Application: {{APPLICANT_NAME}} — Review by {{BOARD_REVIEW_DEADLINE}}"
- **Recipient:** board email (EMAIL_BOARD config)
- **Trigger Location:** ApplicationService.js `createApplicationRecord()` line 316
- **Content Variables:** APPLICANT_NAME, APPLICATION_ID, SUBMISSION_DATE, BOARD_REVIEW_DEADLINE
- **Purpose:** Notifies board of new application and review deadline

---

## STEP 2: Documents Uploaded
**Status:** `awaiting_docs` (unchanged)
**User Action:** Applicant uploads identity documents and photo

### Emails Sent (conditional on document type):

#### 2.1a → Board (ON UPLOAD - if document is not photo)
- **Template:** DOC_DOCUMENT_RECEIVED_TO_BOARD
- **Recipient:** board email
- **Trigger Location:** FileSubmissionService.js `submitFile()` line 91
- **Purpose:** Board gets notification of document upload

#### 2.1b → Board (ON UPLOAD - if document is photo)
- **Template:** DOC_PHOTO_RECEIVED_TO_BOARD
- **Recipient:** board email
- **Trigger Location:** FileSubmissionService.js `submitFile()` line 103
- **Purpose:** Board gets notification of photo upload

#### 2.2 → Applicant (ON CONFIRMATION - when applicant confirms all docs)
- **Template:** ADM_DOCS_SENT_TO_BOARD_FOR_REVIEW_TO_MEMBER
- **Subject:** "GEA: Your Documents Are Under Board Review"
- **Recipient:** applicant email
- **Trigger Location:** ApplicationService.js `confirmDocuments()` line 478
- **Content Variables:** FIRST_NAME, SUBMISSION_DATE
- **Purpose:** Confirms documents received and are now with board

#### 2.3 → Board (ON CONFIRMATION)
- **Template:** ADM_DOCS_SENT_TO_BOARD_FOR_REVIEW_TO_BOARD
- **Subject:** "Documents Ready for Your Review: {{APPLICANT_NAME}}"
- **Recipient:** board email
- **Trigger Location:** ApplicationService.js `confirmDocuments()` line 469
- **Content Variables:** APPLICANT_NAME, APPLICATION_ID, SUBMISSION_DATE
- **Purpose:** Notifies board that all documents are ready for initial review

**Status after Step 2:** Still `awaiting_docs` until board initial decision

---

## STEP 3: Board Reviews Verification Letters
**Status:** `awaiting_docs` (implicit action period)
**User Action:** Board reviews documents for completeness/authenticity

### Emails Sent:
⚠️ **NONE CURRENTLY** - This is a silent review period

**🆕 PROPOSED:** Board could send progress notification to applicant
- **Template:** [NEW] ADM_BOARD_REVIEWING_DOCUMENTS_TO_MEMBER
- **Subject:** "Your GEA Application Documents Are Being Reviewed"
- **Recipient:** applicant email
- **Purpose:** Transparency - lets applicant know board is actively reviewing

---

## STEP 4: Board Initial Application Review
**Status:** `board_initial_review` (approval) OR `denied` (rejection)
**User Action:** Board votes to approve or deny initial application

### SCENARIO A: Board APPROVES

#### 4A.1 → Board (IMMEDIATE)
- **Template:** ADM_BOARD_INITIAL_APPROVAL_TO_BOARD
- **Subject:** "Application Approved — {{APPLICANT_NAME}} — Moving to RSO Review"
- **Recipient:** board email
- **Trigger Location:** ApplicationService.js `boardInitialDecision()` line 696
- **Content Variables:** FIRST_NAME, APPLICANT_NAME, APPLICATION_ID, APPROVED_BY_NAME, APPROVAL_DATE
- **Purpose:** Internal board notification of approval decision

#### 4A.2 → RSO (IMMEDIATE)
- **Template:** ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE
- **Subject:** "Action Required: Document Review for {{APPLICANT_NAME}}"
- **Recipient:** RSO approve email (EMAIL_RSO_APPROVE)
- **Trigger Location:** ApplicationService.js `boardInitialDecision()` line 708
- **Content Variables:** FIRST_NAME, APPLICANT_NAME, APPLICATION_ID, DOCUMENT_TYPES, APPROVAL_DEADLINE
- **Purpose:** ACTION REQUEST - RSO must verify documents by deadline

#### 4A.3 → Applicant (IMMEDIATE)
- **Template:** ADM_DOCS_SENT_TO_RSO_TO_MEMBER
- **Subject:** "GEA: Your Documents Have Been Forwarded for Review"
- **Recipient:** applicant email
- **Trigger Location:** ApplicationService.js `boardInitialDecision()` line 716
- **Content Variables:** FIRST_NAME, DOCUMENT_TYPES, SUBMISSION_DATE
- **Purpose:** Informs applicant that board approved and RSO is reviewing

**🆕 PROPOSED - Step 4A.4:** Send explicit approval decision to applicant
- **Template:** [NEW] ADM_BOARD_INITIAL_REVIEW_APPROVED_TO_MEMBER
- **Subject:** "Great News: Your GEA Application Passed Initial Review"
- **Recipient:** applicant email
- **Trigger Location:** ApplicationService.js `boardInitialDecision()` line [NEW]
- **Content Variables:** FIRST_NAME, APPLICATION_ID, NEXT_STEP_DESCRIPTION, TIMELINE
- **Purpose:** CLARITY - Tells applicant explicitly that initial review passed

#### Status after 4A: `rso_docs_review`

---

### SCENARIO B: Board DENIES

#### 4B.1 → Applicant (IMMEDIATE)
- **Template:** MEM_APPLICATION_DENIED_TO_APPLICANT
- **Subject:** "Your GEA Application — Update from the Board"
- **Recipient:** applicant email
- **Trigger Location:** ApplicationService.js `boardInitialDecision()` line 740
- **Content Variables:** FIRST_NAME, APPLICATION_ID, DENIAL_REASON, CONTACT_EMAIL
- **Purpose:** Notifies applicant of denial decision

**🆕 PROPOSED - Step 4B.2:** Send explicit denial decision to board
- **Template:** [NEW] ADM_BOARD_INITIAL_REVIEW_DENIED_TO_MEMBER (N/A - reuse ADM_BOARD_INITIAL_DENIED_TO_BOARD)
- **Purpose:** Internal confirmation (board already knows, but creates audit trail)

#### Status after 4B: `denied` (application closed)

---

## STEP 5: RSO Reviews Documents
**Status:** `rso_docs_review`
**User Action:** RSO validates document authenticity and format (JPEG quality, file validity, expiration dates)

### Emails Sent (based on RSO decision):

#### 5.1 → RSO (if documents approved)
- No explicit template - RSO system shows approval in admin interface

#### 5.2 → Board (if documents approved)
- **Template:** ADM_RSO_ALL_DOCS_APPROVED_TO_BOARD
- **Recipient:** board email
- **Trigger Location:** FileSubmissionService.js `_handleRsoDocumentDecision()` line 1085
- **Content Variables:** APPLICANT_NAME, APPLICATION_ID
- **Purpose:** Informs board that all documents passed RSO validation

#### 5.3 → Applicant (if documents approved)
- **Template:** ADM_DOCUMENT_APPROVED_BY_RSO_TO_BOARD (sent to board about member approval)
- **Recipient:** board email
- **Trigger Location:** FileSubmissionService.js line 1054
- **Purpose:** Board internal notification (NOT sent to applicant currently)

**🆕 PROPOSED - Step 5.3:** Send approval notification to applicant
- **Template:** [NEW] ADM_DOCUMENTS_APPROVED_BY_RSO_TO_MEMBER
- **Subject:** "Your GEA Documents Have Been Verified and Approved"
- **Recipient:** applicant email
- **Purpose:** Transparency - lets applicant know RSO approved their documents

#### Status after 5 (approval): Application moves to `rso_application_review` (if that status exists)
#### Status after 5 (rejection): Applicant gets document rejection notice

#### 5.4 → Applicant (if documents REJECTED)
- **Template:** DOC_DOCUMENT_REJECTED_TO_MEMBER
- **Subject:** "Your {{DOCUMENT_TYPE}} Submission Was Not Approved — Action Required"
- **Recipient:** applicant email
- **Trigger Location:** FileSubmissionService.js line 1287
- **Content Variables:** FIRST_NAME, DOCUMENT_TYPE, REJECTION_REASON, RESUBMIT_DEADLINE
- **Purpose:** Notifies applicant of document rejection and resubmission deadline

#### 5.5 → Board (if documents REJECTED)
- **Template:** ADM_RSO_DOCUMENT_ISSUE_TO_BOARD
- **Subject:** "RSO Document Issue: {{APPLICANT_NAME}} ({{APPLICATION_ID}})"
- **Recipient:** board email
- **Trigger Location:** ApplicationService.js `rsoDecision()` line 814
- **Content Variables:** FIRST_NAME, APPLICANT_NAME, APPLICATION_ID, ISSUE_DESCRIPTION, DEADLINE_TO_RESOLVE
- **Purpose:** Alerts board that documents failed RSO review

---

## STEP 6: RSO Reviews Application
**Status:** `rso_application_review` (theoretical - appears to be conflated with step 5)
**User Action:** RSO validates membership category, sponsor credentials, eligibility rules

### Current State:
⚠️ **ISSUE:** This step appears to be CONFLATED with Step 5. RSO document review and application review are not distinguished in current code.

### Emails Sent:
⚠️ **NONE SPECIFIC TO APPLICATION REVIEW** - Only document review notifications exist

**🆕 PROPOSED:** Split RSO request into two clear action items:

#### After Step 5 Documents Approved → Step 6 Application Review

#### 6.1 → RSO (NEW ACTION REQUEST)
- **Template:** [NEW] ADM_RSO_APPLICATION_REVIEW_REQUEST_TO_RSO_APPROVE
- **Subject:** "Action Required: Application Review for {{APPLICANT_NAME}}"
- **Recipient:** RSO approve email
- **Trigger Location:** [NEW] ApplicationService.js - after documents approved
- **Content Variables:** FIRST_NAME, APPLICANT_NAME, APPLICATION_ID, CATEGORY_VERIFICATION_REQUIREMENTS, DEADLINE
- **Purpose:** ACTION REQUEST - Different from document review, focuses on eligibility

#### 6.2 → Board (status update)
- **Template:** [NEW or modify] Board notification when RSO moves to next phase
- **Purpose:** Board aware that application review is underway

#### Status after 6 (approval): Application moves to `board_final_review`
#### Status after 6 (rejection): Application loops back to `board_initial_review`

#### 6.3 → Applicant (if application APPROVED after RSO review)
- **Template:** ADM_READY_FOR_FINAL_APPROVAL_TO_MEMBER
- **Subject:** "Your GEA Application is Ready for Final Approval"
- **Recipient:** applicant email
- **Trigger Location:** FileSubmissionService.js (or ApplicationService - timing TBD)
- **Content Variables:** FIRST_NAME, APPLICATION_ID
- **Purpose:** Informs applicant that RSO completed review successfully

---

## STEP 7: Board Final Approval
**Status:** `board_final_review` → `approved_pending_payment`
**User Action:** Board votes final approval (documents verified, category confirmed, eligible)

### SCENARIO A: Board APPROVES

#### 7A.1 → Board (IMMEDIATE)
- **Template:** ADM_BOARD_FINAL_APPROVAL_TO_BOARD
- **Subject:** "Membership Activated: {{APPLICANT_NAME}} ({{APPLICATION_ID}})"
- **Recipient:** board email
- **Trigger Location:** ApplicationService.js `boardFinalDecision()` line [after approval]
- **Content Variables:** FIRST_NAME, APPLICANT_NAME, APPLICATION_ID, APPROVAL_DATE
- **Purpose:** Internal board notification of final approval

**🆕 PROPOSED - Step 7A.2:** Notify RSO of final approval
- **Template:** [NEW] ADM_BOARD_FINAL_APPROVAL_TO_RSO
- **Subject:** "Application Final Decision: {{APPLICANT_NAME}} — Approved"
- **Recipient:** RSO notify email (read-only role)
- **Trigger Location:** ApplicationService.js `boardFinalDecision()` line [NEW]
- **Content Variables:** FIRST_NAME, APPLICANT_NAME, APPLICATION_ID
- **Purpose:** FYI - Closure notification for RSO workflow

#### 7A.3 → Applicant (IMMEDIATE)
- **Template:** MEM_APPLICATION_APPROVED_TO_APPLICANT
- **Subject:** "GEA Application Approved — Payment Required to Activate"
- **Recipient:** applicant email
- **Trigger Location:** ApplicationService.js `boardFinalDecision()` line 887
- **Content Variables:** FIRST_NAME, APPLICATION_ID, PAYMENT_AMOUNT, PAYMENT_DEADLINE, PORTAL_URL
- **Purpose:** Notifies applicant of approval and payment requirement

#### 7A.4 → Treasurer (IMMEDIATE)
- **Template:** PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD (re-purposed)
- **Subject:** "Action Required: Payment Verification for {{MEMBER_NAME}} — {{AMOUNT}}"
- **Recipient:** treasurer email
- **Trigger Location:** ApplicationService.js `boardFinalDecision()` line 897
- **Content Variables:** FIRST_NAME, MEMBER_NAME, PAYMENT_ID, AMOUNT, CURRENCY, STATUS, SUBMISSION_DATE
- **Purpose:** Proactive action request (currently FYI, should be ACTION REQUIRED)

**🆕 PROPOSED - Step 7A.4 Alternative:** Create specific template
- **Template:** [NEW] ADM_PAYMENT_VERIFICATION_REQUEST_TO_TREASURER
- **Subject:** "Action Required: Payment Verification for {{MEMBER_NAME}} — {{AMOUNT}}"
- **Recipient:** treasurer email (if role exists; else board email)
- **Purpose:** EXPLICIT action request - more clear than FYI

#### Status after 7A: `approved_pending_payment`

---

### SCENARIO B: Board DENIES

#### 7B.1 → Applicant (IMMEDIATE)
- **Template:** MEM_APPLICATION_DENIED_TO_APPLICANT
- **Subject:** "Your GEA Application — Update from the Board"
- **Recipient:** applicant email
- **Trigger Location:** ApplicationService.js `boardFinalDecision()` line 925
- **Content Variables:** FIRST_NAME, APPLICATION_ID, DENIAL_REASON, CONTACT_EMAIL
- **Purpose:** Notifies applicant of final denial

#### Status after 7B: `denied` (application closed)

---

## STEP 8: Payment Submitted
**Status:** `approved_pending_payment` → `payment_submitted`
**User Action:** Applicant uploads proof of payment to portal

### Emails Sent (in order):

#### 8.1 → Applicant (IMMEDIATE)
- **Template:** PAY_PAYMENT_SUBMITTED_TO_MEMBER
- **Subject:** "GEA: Your Payment Has Been Submitted"
- **Recipient:** applicant email
- **Trigger Location:** PaymentService.js `submitPaymentProof()` line 113
- **Content Variables:** FIRST_NAME, PAYMENT_ID, AMOUNT, SUBMISSION_DATE
- **Purpose:** Confirms receipt of payment proof

#### 8.2 → Applicant (IMMEDIATE)
- **Template:** PAY_PAYMENT_PROOF_RECEIVED_TO_MEMBER
- **Subject:** "GEA: Payment Proof Received — Under Review"
- **Recipient:** applicant email
- **Trigger Location:** ApplicationService.js `submitPaymentProof()` line 1081
- **Content Variables:** FIRST_NAME, PAYMENT_ID, SUBMISSION_DATE, EXPECTED_REVIEW_DATE
- **Purpose:** Sets expectation for treasurer review timeline

#### 8.3 → Treasurer (IMMEDIATE)
- **Template:** PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD
- **Subject:** "Payment Submitted: {{MEMBER_NAME}} — {{AMOUNT}} {{CURRENCY}}"
- **Recipient:** treasurer email
- **Trigger Location:** PaymentService.js `submitPaymentProof()` line 127
- **Content Variables:** FIRST_NAME, MEMBER_NAME, AMOUNT, CURRENCY, SUBMISSION_DATE
- **Purpose:** Notifies treasurer of payment submission for verification

**🆕 PROPOSED - Step 8.3 Alternative:** Make this ACTION REQUEST
- Modify subject to: "Action Required: Payment Verification for {{MEMBER_NAME}} — {{AMOUNT}}"
- Or use [NEW] ADM_PAYMENT_VERIFICATION_REQUEST_TO_TREASURER template

#### Status after 8: `payment_submitted`

---

## STEP 9: Membership Activated
**Status:** `payment_submitted` → `payment_verified` → `activated`
**User Action:** Treasurer verifies payment and confirms in system

### Emails Sent (in order):

#### 9.1 → Applicant (IMMEDIATE after payment verified)
- **Template:** PAY_PAYMENT_VERIFIED_TO_MEMBER
- **Subject:** "GEA: Your Payment Is Verified — Membership Is Now Active!"
- **Recipient:** applicant email
- **Trigger Location:** ApplicationService.js `verifyPaymentAndActivate()` line 1186 or 1191
- **Content Variables:** FIRST_NAME, APPLICATION_ID, ACTIVATION_DATE, PORTAL_URL
- **Purpose:** Final confirmation - membership is now active

#### 9.2 → Applicant (IMMEDIATE)
- **Template:** MEM_MEMBERSHIP_ACTIVATED_TO_MEMBER
- **Subject:** "Welcome to GEA — Your Membership Is Now Active!"
- **Recipient:** applicant email
- **Trigger Location:** ApplicationService.js `verifyPaymentAndActivate()` line [after 9.1]
- **Content Variables:** FIRST_NAME, MEMBER_ID, WELCOME_MESSAGE, PORTAL_FEATURES, PORTAL_URL
- **Purpose:** Welcome email - orientation to member benefits and portal

#### 9.3 → Board (IMMEDIATE)
- **Template:** PAY_PAYMENT_VERIFIED_ACTIVATED_BOARD_FYI_TO_BOARD
- **Subject:** "Payment Verified & Membership Activated: {{MEMBER_NAME}}"
- **Recipient:** board email
- **Trigger Location:** ApplicationService.js `verifyPaymentAndActivate()` line 1196
- **Content Variables:** FIRST_NAME, MEMBER_NAME, APPLICATION_ID, ACTIVATION_DATE
- **Purpose:** Board FYI - applicant is now active member

**🆕 PROPOSED - Step 9.4:** Notify RSO of successful activation
- **Template:** [NEW] ADM_MEMBERSHIP_ACTIVATED_TO_RSO
- **Subject:** "{{MEMBER_NAME}} Is Now an Active GEA Member"
- **Recipient:** RSO notify email
- **Trigger Location:** ApplicationService.js `verifyPaymentAndActivate()` line [NEW]
- **Content Variables:** FIRST_NAME, MEMBER_NAME, APPLICATION_ID, MEMBER_ID
- **Purpose:** Closure notification - RSO completes workflow visibility

#### Status after 9: `activated` (application complete)

---

## REJECTION/REPLACEMENT PATHS

### Document Replacement Workflow
**Trigger:** When applicant submits replacement documents after rejection

#### R.1 → Applicant (IMMEDIATE)
- **Template:** DOC_FILE_SUBMISSION_CONFIRMATION_TO_MEMBER
- **Subject:** "GEA: File Received — {{FILE_NAME}}"
- **Recipient:** applicant email
- **Purpose:** Confirms replacement document received

#### R.2 → Board (IMMEDIATE)
- **Template:** ADM_REPLACEMENT_DOCS_SUBMITTED_TO_BOARD
- **Recipient:** board email
- **Trigger Location:** ApplicationService.js `confirmDocuments()` (when replacement=true)
- **Purpose:** Notifies board of replacement submission

#### R.3 → Applicant (IMMEDIATE)
- **Template:** ADM_REPLACEMENT_DOCS_SUBMITTED_TO_MEMBER
- **Recipient:** applicant email
- **Purpose:** Confirms replacement submission and next steps

---

## SUMMARY: Email Count by Step

| Step | To Applicant | To Board | To RSO | To Treasurer | Total |
|------|-------------|----------|--------|--------------|-------|
| 1: Submit | 2 | 1 | - | - | **3** |
| 2: Upload | 2 | 2 | - | - | **4** |
| 3: Review | 0 | 0 | - | - | **0** ⚠️ |
| 4: Initial | 2-3 | 1 | 1 | - | **4-5** |
| 5: RSO Docs | 1 | 2 | - | - | **3** |
| 6: RSO App | 1 | 1 | 1 | - | **3** 🆕 |
| 7: Final | 1 | 1 | 1 | 1 | **4** |
| 8: Payment | 2 | - | - | 1 | **3** |
| 9: Activate | 2 | 1 | 1 | - | **4** |
| **TOTAL** | **13-14** | **9** | **4** | **2** | **28-29** |

---

## PROPOSED NEW TEMPLATES (Summary)

| # | Name | Recipient | Priority | Purpose |
|---|------|-----------|----------|---------|
| 1 | ADM_BOARD_INITIAL_REVIEW_APPROVED_TO_MEMBER | Applicant | CRITICAL | Explicit approval notification after step 4 |
| 2 | ADM_BOARD_INITIAL_REVIEW_DENIED_TO_MEMBER | Applicant | CRITICAL | Explicit denial notification after step 4 |
| 3 | ADM_BOARD_FINAL_APPROVAL_TO_RSO | RSO | MEDIUM | RSO sees final approval decision |
| 4 | ADM_RSO_APPLICATION_REVIEW_REQUEST_TO_RSO_APPROVE | RSO | MEDIUM | Distinguish app review from doc review |
| 5 | ADM_PAYMENT_VERIFICATION_REQUEST_TO_TREASURER | Treasurer | MEDIUM | Explicit action request vs. FYI |
| 6 | ADM_MEMBERSHIP_ACTIVATED_TO_RSO | RSO | LOW | Closure notification for RSO |
| 7 | ADM_DOCUMENTS_APPROVED_BY_RSO_TO_MEMBER | Applicant | MEDIUM | Transparency after RSO approval |
| 8 | ADM_BOARD_REVIEWING_DOCUMENTS_TO_MEMBER | Applicant | LOW | Progress notification during Step 3 |

