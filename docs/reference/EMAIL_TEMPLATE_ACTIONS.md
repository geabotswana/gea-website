# Email Template Action List - Complete

## NEW TEMPLATES TO CREATE (8 total)

### 1. ADM_BOARD_INITIAL_REVIEW_APPROVED_TO_MEMBER
**Priority:** CRITICAL
**Recipient:** Applicant (email)
**Trigger Location:** ApplicationService.js `boardInitialDecision()` after line 703
**Trigger Condition:** When decision === "approved"
**When Sent:** Immediately after board approves initial review
**Subject Line:** "Great News: Your GEA Application Passed Initial Review"
**Content Variables:**
- FIRST_NAME (applicant first name)
- APPLICATION_ID
- NEXT_STEP_DESCRIPTION (explain RSO document review)
- TIMELINE (how long RSO review takes)
- PORTAL_URL
**Purpose:** Explicit notification that initial board review passed; transparency on next step
**Current Gap:** Applicants don't know their initial review passed until they see payment request

---

### 2. ADM_BOARD_INITIAL_REVIEW_DENIED_TO_MEMBER
**Priority:** CRITICAL
**Recipient:** Applicant (email)
**Trigger Location:** ApplicationService.js `boardInitialDecision()` after line 740
**Trigger Condition:** When decision === "denied"
**When Sent:** Immediately after board denies initial review
**Subject Line:** "Your GEA Application — Board Decision"
**Content Variables:**
- FIRST_NAME
- APPLICATION_ID
- DENIAL_REASON (passed from board)
- REAPPLICATION_PROCESS (link/info on how to reapply)
- CONTACT_EMAIL (board@geabotswana.org)
**Purpose:** Explicit notification of denial at initial stage
**Current Gap:** Uses generic MEM_APPLICATION_DENIED_TO_APPLICANT; should be specific to initial stage
**Note:** Could rename/repurpose existing template or create new one

---

### 3. ADM_BOARD_FINAL_APPROVAL_TO_RSO
**Priority:** MEDIUM
**Recipient:** RSO Notify role (read-only role, EMAIL_RSO_NOTIFY)
**Trigger Location:** ApplicationService.js `boardFinalDecision()` after line 896 (after treasurer notification)
**Trigger Condition:** When decision === "approved" (board final approval)
**When Sent:** Immediately after board grants final approval
**Subject Line:** "Application Final Decision: {{APPLICANT_NAME}} — Approved"
**Content Variables:**
- FIRST_NAME ("RSO Team")
- APPLICANT_NAME
- APPLICATION_ID
- APPROVAL_DATE
**Purpose:** FYI notification - RSO sees workflow closure; confirms application was approved
**Current Gap:** RSO has no visibility that final board approval was granted
**Note:** This is a closure notification; RSO takes no action

---

### 4. ADM_RSO_APPLICATION_REVIEW_REQUEST_TO_RSO_APPROVE
**Priority:** MEDIUM
**Recipient:** RSO Approve role (EMAIL_RSO_APPROVE)
**Trigger Location:** [NEW] FileSubmissionService.js `_handleRsoDocumentDecision()` after documents approved (line ~1085)
**Trigger Condition:** When all RSO documents are approved; before application moves to board final review
**When Sent:** After RSO approves all documents, triggering application-specific review
**Subject Line:** "Action Required: Application Review for {{APPLICANT_NAME}}"
**Content Variables:**
- FIRST_NAME ("RSO Team")
- APPLICANT_NAME
- APPLICATION_ID
- CATEGORY_VERIFICATION_REQUIREMENTS (rules for their membership category)
- DEADLINE (e.g., 3-5 business days)
- SPONSOR_VERIFICATION_IF_REQUIRED (only if applicable)
**Purpose:** ACTION REQUEST - Distinguishes application eligibility review from document validation
**Current Gap:** Step 5 & 6 use same template; RSO doesn't know they need to verify eligibility separately
**Code Change:** Needs new trigger after documents approved but before board final review

---

### 5. ADM_PAYMENT_VERIFICATION_REQUEST_TO_TREASURER
**Priority:** MEDIUM
**Recipient:** Treasurer role (EMAIL_TREASURER or EMAIL_BOARD if no treasurer role)
**Trigger Location:** ApplicationService.js `boardFinalDecision()` at line 897 (replace or supplement existing)
**Trigger Condition:** When board grants final approval and application moves to payment stage
**When Sent:** Immediately after board final approval (same time as MEM_APPLICATION_APPROVED_TO_APPLICANT)
**Subject Line:** "Action Required: Payment Verification for {{MEMBER_NAME}} — {{AMOUNT}}"
**Content Variables:**
- FIRST_NAME ("Treasurer")
- MEMBER_NAME
- PAYMENT_ID (payment reference)
- AMOUNT (dues amount)
- CURRENCY (BWP)
- PAYMENT_DEADLINE (30 days from approval)
- APPROVAL_DATE (date board approved)
**Purpose:** EXPLICIT action request for treasurer to verify incoming payment
**Current Gap:** Treasurer gets generic FYI (PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD); not action-focused
**Code Change:** Either modify trigger subject line of existing template OR create new one and replace existing

---

### 6. ADM_DOCUMENTS_APPROVED_BY_RSO_TO_MEMBER
**Priority:** MEDIUM
**Recipient:** Applicant (email)
**Trigger Location:** FileSubmissionService.js `_handleRsoDocumentDecision()` after line 1085 (when documents approved)
**Trigger Condition:** When all documents approved by RSO
**When Sent:** Immediately after RSO approves all documents
**Subject Line:** "Your GEA Documents Have Been Verified and Approved"
**Content Variables:**
- FIRST_NAME (applicant first name)
- APPLICATION_ID
- APPROVAL_DATE
- NEXT_STEP_DESCRIPTION (board final review coming)
- TIMELINE
**Purpose:** Transparency - applicant knows RSO completed review successfully
**Current Gap:** Applicant has no notification when RSO approves documents; only hears about it if rejected
**Code Change:** Add new sendEmailFromTemplate call in FileSubmissionService after approval decision

---

### 7. ADM_MEMBERSHIP_ACTIVATED_TO_RSO
**Priority:** LOW
**Recipient:** RSO Notify role (EMAIL_RSO_NOTIFY, read-only)
**Trigger Location:** ApplicationService.js `verifyPaymentAndActivate()` after line 1196
**Trigger Condition:** When payment verified and membership activated
**When Sent:** Immediately after membership is activated
**Subject Line:** "{{MEMBER_NAME}} Is Now an Active GEA Member"
**Content Variables:**
- FIRST_NAME ("RSO Team")
- MEMBER_NAME
- APPLICATION_ID
- MEMBER_ID
- ACTIVATION_DATE
**Purpose:** Closure notification - RSO gets confirmation that applicant is now active member
**Current Gap:** RSO has no closure loop; doesn't know when applicant becomes member
**Note:** This is informational; RSO takes no action

---

### 8. ADM_BOARD_REVIEWING_DOCUMENTS_TO_MEMBER
**Priority:** LOW (Nice-to-have)
**Recipient:** Applicant (email)
**Trigger Location:** ApplicationService.js `confirmDocuments()` after line 478
**Trigger Condition:** When applicant confirms documents (before board review begins)
**When Sent:** After applicant confirms documents ready for review; before board acts on them
**Subject Line:** "Your GEA Application Documents Are Being Reviewed"
**Content Variables:**
- FIRST_NAME
- APPLICATION_ID
- SUBMISSION_DATE
- EXPECTED_REVIEW_TIMELINE (e.g., "within 5 business days")
**Purpose:** Transparency - applicant knows board is actively reviewing
**Current Gap:** Silent period between document confirmation and board decision
**Note:** Purely informational; improves UX without operational impact

---

## EXISTING TEMPLATES TO MODIFY

### 1. PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD (at ApplicationService.js line 897)
**Current Subject:** "Payment Submitted: {{MEMBER_NAME}} — {{AMOUNT}} {{CURRENCY}}"
**Change Type:** Modify subject line
**New Subject:** "Action Required: Payment Verification for {{MEMBER_NAME}} — {{AMOUNT}}"
**Rationale:** Make it clear to treasurer this is an action item, not just an FYI
**Alternative:** Create new ADM_PAYMENT_VERIFICATION_REQUEST_TO_TREASURER instead and replace this trigger
**Code Change:** Modify the sendEmailFromTemplate call at line 897 in ApplicationService.js

---

### 2. MEM_APPLICATION_DENIED_TO_APPLICANT (applicant denial at initial stage)
**Current Usage:** Used for both initial denial (line 740) and final denial (line 925)
**Issue:** Generic subject line doesn't specify which stage of denial
**Option A:** Create new ADM_BOARD_INITIAL_REVIEW_DENIED_TO_MEMBER for initial denial only
**Option B:** Modify subject to be conditional: "Application Denied at Initial Review" vs "Application Final Decision"
**Recommendation:** Option A - clearer to keep separate

---

### 3. ADM_DOCS_SENT_TO_RSO_TO_MEMBER (verification that it exists and is triggered)
**Current Status:** Template exists in EMAIL_TEMPLATES_REFERENCE.md (line 33)
**Action Required:** VERIFY this template is actually being triggered in code
**Search Location:** ApplicationService.js `boardInitialDecision()` line 716
**Status:** ✅ CONFIRMED - Being sent at line 716
**Purpose:** Already sending notification to applicant when documents forwarded to RSO
**No Change Needed:** This template is working correctly

---

## CODE CHANGES REQUIRED (by file)

### ApplicationService.js

#### Change 1: Add new email trigger for initial review approval (CRITICAL)
**Location:** After line 703 (after existing ADM_BOARD_INITIAL_APPROVAL_TO_BOARD)
**Code to Add:**
```javascript
      sendEmailFromTemplate("ADM_BOARD_INITIAL_REVIEW_APPROVED_TO_MEMBER", application.primary_applicant_email, {
        FIRST_NAME:           _appFirstName0,
        APPLICATION_ID:       applicationId,
        NEXT_STEP_DESCRIPTION: "Your documents will now be reviewed and verified by our RSO team for authenticity and validity.",
        TIMELINE:             "RSO review typically takes 5-7 business days.",
        PORTAL_URL:           getConfigValue("PORTAL_URL") || ""
      });
```

#### Change 2: Add new email trigger for initial review denial (CRITICAL)
**Location:** Replace or supplement line 740 (MEM_APPLICATION_DENIED_TO_APPLICANT)
**Alternative:** Add new sendEmailFromTemplate call for ADM_BOARD_INITIAL_REVIEW_DENIED_TO_MEMBER
```javascript
      sendEmailFromTemplate("ADM_BOARD_INITIAL_REVIEW_DENIED_TO_MEMBER", application.primary_applicant_email, {
        FIRST_NAME:              _appFirstName2,
        APPLICATION_ID:          applicationId,
        DENIAL_REASON:           reason || "Your application does not meet membership requirements at this time.",
        REAPPLICATION_PROCESS:   "You may reapply after addressing the board's feedback. Contact board@geabotswana.org for details.",
        CONTACT_EMAIL:           "board@geabotswana.org"
      });
```

#### Change 3: Modify treasurer notification at board final approval (MEDIUM)
**Location:** Line 897 (in boardFinalDecision function)
**Current Code:**
```javascript
      sendEmailFromTemplate("PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD", treasurerEmail, {
```
**Change Option A:** Modify subject in template to include "Action Required"
**Change Option B:** Create new template ADM_PAYMENT_VERIFICATION_REQUEST_TO_TREASURER and use it here

#### Change 4: Add new email trigger for board final approval to RSO (MEDIUM)
**Location:** After line 897 (after treasurer notification)
**Code to Add:**
```javascript
      var _rsoNotifyEmail = EMAIL_RSO_NOTIFY;
      if (_rsoNotifyEmail) {
        sendEmailFromTemplate("ADM_BOARD_FINAL_APPROVAL_TO_RSO", _rsoNotifyEmail, {
          FIRST_NAME:     "RSO Team",
          APPLICANT_NAME: _appName4,
          APPLICATION_ID: applicationId,
          APPROVAL_DATE:  formatDate(new Date())
        });
      }
```

#### Change 5: Verify ADM_READY_FOR_FINAL_APPROVAL_TO_MEMBER trigger (MEDIUM)
**Location:** Search for "ADM_READY_FOR_FINAL_APPROVAL_TO_MEMBER" in ApplicationService.js
**Current Status:** Need to verify when/if this template is sent
**Action:** If not being sent, add trigger before board final review

---

### FileSubmissionService.js

#### Change 1: Add new email trigger when RSO approves all documents (MEDIUM)
**Location:** After line 1085 (in _handleRsoDocumentDecision function, documents approved path)
**Code to Add:**
```javascript
      sendEmailFromTemplate("ADM_DOCUMENTS_APPROVED_BY_RSO_TO_MEMBER", applicantEmail, {
        FIRST_NAME:           applicantFirstName,
        APPLICATION_ID:       applicationId,
        APPROVAL_DATE:        formatDate(new Date()),
        NEXT_STEP_DESCRIPTION: "Your documents have been verified. Your application will now proceed to the board for final approval.",
        TIMELINE:             "Board final review typically takes 3-5 business days."
      });
```

#### Change 2: Add new email trigger for application-specific RSO review request (MEDIUM)
**Location:** Same function, after documents are approved and moving to application review phase
**Code to Add:**
```javascript
      sendEmailFromTemplate("ADM_RSO_APPLICATION_REVIEW_REQUEST_TO_RSO_APPROVE", EMAIL_RSO_APPROVE, {
        FIRST_NAME:                       "RSO Team",
        APPLICANT_NAME:                   applicantName,
        APPLICATION_ID:                   applicationId,
        CATEGORY_VERIFICATION_REQUIREMENTS: "Verify membership category eligibility, sponsor credentials if required, and compliance with GEA membership rules.",
        DEADLINE:                         formatDate(addDays(new Date(), 5)),
        SPONSOR_VERIFICATION_IF_REQUIRED: "Check if sponsor is valid and active member"
      });
```

---

### ApplicationService.js (verifyPaymentAndActivate function)

#### Change 1: Add new email trigger for RSO activation notification (LOW)
**Location:** After line 1196 (after PAY_PAYMENT_VERIFIED_ACTIVATED_BOARD_FYI_TO_BOARD)
**Code to Add:**
```javascript
      var _rsoNotifyEmail = EMAIL_RSO_NOTIFY;
      if (_rsoNotifyEmail) {
        var _memberName = application.primary_applicant_name || "";
        var _memberId = application.household_id; // or member_id if that field exists
        sendEmailFromTemplate("ADM_MEMBERSHIP_ACTIVATED_TO_RSO", _rsoNotifyEmail, {
          FIRST_NAME:    "RSO Team",
          MEMBER_NAME:   _memberName,
          APPLICATION_ID: applicationId,
          MEMBER_ID:     _memberId,
          ACTIVATION_DATE: formatDate(new Date())
        });
      }
```

---

## SUMMARY TABLE

| # | Template | Action | Priority | File | Location |
|---|----------|--------|----------|------|----------|
| 1 | ADM_BOARD_INITIAL_REVIEW_APPROVED_TO_MEMBER | CREATE | CRITICAL | ApplicationService.js | After line 703 |
| 2 | ADM_BOARD_INITIAL_REVIEW_DENIED_TO_MEMBER | CREATE | CRITICAL | ApplicationService.js | After line 740 |
| 3 | ADM_BOARD_FINAL_APPROVAL_TO_RSO | CREATE | MEDIUM | ApplicationService.js | After line 897 |
| 4 | ADM_RSO_APPLICATION_REVIEW_REQUEST_TO_RSO_APPROVE | CREATE | MEDIUM | FileSubmissionService.js | After line 1085 |
| 5 | ADM_PAYMENT_VERIFICATION_REQUEST_TO_TREASURER | CREATE | MEDIUM | ApplicationService.js | Line 897 |
| 6 | ADM_DOCUMENTS_APPROVED_BY_RSO_TO_MEMBER | CREATE | MEDIUM | FileSubmissionService.js | After line 1085 |
| 7 | ADM_MEMBERSHIP_ACTIVATED_TO_RSO | CREATE | LOW | ApplicationService.js | After line 1196 |
| 8 | ADM_BOARD_REVIEWING_DOCUMENTS_TO_MEMBER | CREATE | LOW | ApplicationService.js | After line 478 |
| 9 | PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD | MODIFY | MEDIUM | ApplicationService.js | Line 897 |
| 10 | MEM_APPLICATION_DENIED_TO_APPLICANT | VERIFY/SEPARATE | MEDIUM | ApplicationService.js | Lines 740, 925 |
| 11 | ADM_DOCS_SENT_TO_RSO_TO_MEMBER | VERIFY | LOW | ApplicationService.js | Line 716 |

