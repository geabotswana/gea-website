# Status Values Alignment Audit

**Date:** March 31, 2026  
**Scope:** Membership Applications, File Submissions, and Payment Workflows

---

## Executive Summary

**CRITICAL MISALIGNMENT FOUND**: The documented membership application process and the actual code implementation are NOT aligned in how status values are used and tracked.

**Key Findings:**
1. ✅ **Application Status Values** — 8 of 11 defined values actively used
2. ❌ **File Submission Status Values** — 6 values used but NOT documented anywhere as formal "Key Status Values"
3. ⚠️ **Payment Status Values** — Uses `payment_verified_date` field instead of explicit status; dashboard check references undefined "status" field
4. ⚠️ **Undefined Constants** — Two Application status constants defined but never used in code

---

## 1. APPLICATION STATUS VALUES

### Defined in Config.js (Lines 666-676)
```javascript
var APP_STATUS_AWAITING_DOCS            = "awaiting_docs";
var APP_STATUS_DOCS_CONFIRMED           = "docs_confirmed";
var APP_STATUS_BOARD_INITIAL_REVIEW     = "board_initial_review";
var APP_STATUS_RSO_DOCS_REVIEW          = "rso_docs_review";
var APP_STATUS_RSO_APPLICATION_REVIEW   = "rso_application_review";
var APP_STATUS_BOARD_FINAL_REVIEW       = "board_final_review";
var APP_STATUS_APPROVED_PENDING_PAYMENT = "approved_pending_payment";
var APP_STATUS_PAYMENT_SUBMITTED        = "payment_submitted";
var APP_STATUS_PAYMENT_VERIFIED         = "payment_verified";  // ⚠️ NOT USED
var APP_STATUS_ACTIVATED                = "activated";
var APP_STATUS_DENIED                   = "denied";
var APP_STATUS_WITHDRAWN                = "withdrawn";  // ⚠️ NOT USED
```

### Actually Used in ApplicationService.js

| Status Value | Used in Code | Line(s) | When Set |
|---|---|---|---|
| `awaiting_docs` | ✅ Yes | 236 | When application first created (createApplicationRecord) |
| `docs_confirmed` | ✅ Yes | 435 | When applicant confirms documents uploaded (confirmDocumentsUploaded) |
| `board_initial_review` | ✅ Yes | 702 (and others) | When RSO rejects documents (rsoApproveApplication), loops back for re-review |
| `rso_docs_review` | ✅ Yes | 585 | When board approves initial application (boardInitialDecision) |
| `rso_application_review` | ✅ Yes | 341 | When RSO approves all documents and application (rsoApproveApplication) |
| `board_final_review` | ✅ Yes | 753 | When board makes final decision after RSO approval |
| `approved_pending_payment` | ✅ Yes | 762 | When board approves final application (boardFinalDecision) |
| `payment_submitted` | ✅ Yes | 880 | When applicant submits payment proof (submitPaymentProofForApplication) |
| `payment_verified` | ❌ NOT USED | 673 only | Defined in Config but never assigned in code |
| `activated` | ✅ Yes | 978 | When treasurer verifies payment (verifyAndActivateMembership) |
| `denied` | ✅ Yes | 628, 800 | When board denies at initial or final stage |
| `withdrawn` | ❌ NOT USED | 676 only | Defined in Config but never assigned in code |

**Observation:** `payment_verified` should be set after treasurer verifies payment (line 978) but instead the code goes directly to `activated`. Unclear if `payment_verified` is a transitional state or dead code.

---

## 2. FILE SUBMISSION STATUS VALUES

### Status Values Used in FileSubmissionService.js

**CRITICAL ISSUE:** These status values are used throughout the code but are **NOT documented in any formal "Key Status Values" list**.

| Status Value | Used in Code | Line(s) | Meaning |
|---|---|---|---|
| `submitted` | ✅ Yes | 51, 423, 509, 527, 574 | Document/photo uploaded, awaiting review |
| `rso_rejected` | ✅ Yes | 190, 310, 579 | RSO rejected the document (looped back for resubmission) |
| `gea_pending` | ✅ Yes | 190, 309 | RSO approved; GEA admin review pending |
| `gea_rejected` | ✅ Yes | 310 | GEA admin rejected the submission |
| `verified` | ✅ Yes | 265, 309, 498 | Document (passport/omang) verified and finalized |
| `approved` | ✅ Yes | 265, 309, 321, 497 | Photo/employment verified and finalized |

### Workflow
```
submitted
  ├─ [RSO approves] → gea_pending → [GEA admin approves] → verified (documents) or approved (photos)
  ├─ [RSO rejects] → rso_rejected (loops back to submitted for resubmission)
  └─ [GEA admin rejects] → gea_rejected (loops back to submitted for resubmission)
```

### Where These Appear in Documentation

The user's CLAUDE_Membership_Implementation.md mentions:
- **Step 5 (Document Submission):** "System: Creates File Submission records (status: submitted)"
- **Step 8 (Approval):** References document status values implicitly

**BUT:** There is **NO formal "Key Status Values" section** that lists these six file submission status values. This creates confusion because:
1. File Submission statuses are different from Application statuses
2. The documentation doesn't clarify which status applies to which sheet
3. Developers don't know what values to expect when querying file submissions

---

## 3. PAYMENT STATUS VALUES

### Issue: Two Different Tracking Models

#### Model A: Payments Sheet (PaymentService.js, PaymentTrackingWorkbook)
- **Primary tracking field:** `payment_verified_date` (empty string or has date)
- **Secondary field:** `payment_verified_by` (treasurer email, empty if unverified)
- **No explicit "status" field** - status is derived from whether `payment_verified_date` is populated
- Logic: `!p.payment_verified_date` = unverified (line 209, 803)

#### Model B: Application Record (ApplicationService.js, Membership Applications Sheet)
- **Fields used:**
  - `payment_status` (line 251, 878, 979) — stores "submitted" or "verified"
  - `payment_id` (line 252, 879) — references Payment ID
- When applicant submits payment proof: `payment_status = "submitted"` (line 878)
- When treasurer verifies: `payment_status = "verified"` (line 979)

### Dashboard Counting Issue (Code.js line 3555)

```javascript
for (var i = 1; i < payData.length; i++) {
  var pay = rowToObject(payHeaders, payData[i]);
  if (pay.payment_id && pay.status === "submitted") {  // ⚠️ Checking "status" field
    unverifiedPayments++;
  }
}
```

**Problem:** The dashboard handler (_handleAdminDashboardStats) checks for `pay.status === "submitted"` but:
- Payments sheet doesn't have a "status" field
- Should be checking `!p.payment_verified_date` instead
- OR should be checking `p.payment_verified_date === ""`

This might cause the unverified payment count to always return 0 if "status" field doesn't exist on Payments sheet.

---

## 4. SUMMARY: What's Documented vs. Code

### What's Documented (CLAUDE_Membership_Implementation.md)

**"Key Status Values"** section lists:
- awaiting_docs
- docs_confirmed
- board_initial_review
- rso_docs_review
- rso_application_review
- board_final_review
- approved_pending_payment
- payment_submitted
- payment_verified
- activated
- denied
- withdrawn

**What's NOT documented:**
- File Submission statuses (submitted, rso_rejected, gea_pending, gea_rejected, verified, approved)
- Payment verification tracking model (payment_verified_date vs. explicit status)

---

## 5. ROOT CAUSES

1. **Separate Status Systems:** Application, File Submission, and Payment tracking each have different status models, but only Application statuses are documented.

2. **Missing File Submission Documentation:** FileSubmissionService.js was added in Feb 2026, and while the code is solid, the "Key Status Values" list was never updated to include file submission states.

3. **Payment Model Ambiguity:** Payments use `payment_verified_date` for tracking but ApplicationService creates a `payment_status` field on the Application record. Two parallel systems are tracking the same information.

4. **Unused Constants:** `APP_STATUS_PAYMENT_VERIFIED` and `APP_STATUS_WITHDRAWN` are defined but never used, suggesting incomplete implementation or dead code.

---

## 6. RECOMMENDED FIXES

### Immediate Actions

1. **Update CLAUDE_Membership_Implementation.md:**
   - Add "File Submission Status Values" section documenting the 6 states and their workflow
   - Clarify that File Submission and Application statuses are separate systems
   - Document Payment verification tracking: explain `payment_verified_date` model and why `payment_status` field exists on Application record

2. **Fix Dashboard Payment Counting (Code.js line 3555):**
   - Replace: `if (pay.payment_id && pay.status === "submitted")`
   - With: `if (pay.payment_id && !pay.payment_verified_date)`
   - OR verify that Payments sheet actually has a "status" field before accepting the current logic

3. **Clarify `APP_STATUS_PAYMENT_VERIFIED` Usage:**
   - Either implement the use of this status (set it after treasurer verifies but before activation)
   - OR remove the constant and document why `payment_submitted` transitions directly to `activated`

4. **Clarify `APP_STATUS_WITHDRAWN` Usage:**
   - Either implement application withdrawal functionality
   - OR document why applicants cannot withdraw applications

### Long-term Improvements

- Consider consolidating to single status field per sheet for clarity
- Add comprehensive status diagrams to documentation showing transitions
- Add validation rules in ApplicationService to prevent invalid status transitions

---

## 7. STATUS TRANSITION DIAGRAM

```
APPLICATION FLOW:
awaiting_docs
  │ [Applicant confirms documents uploaded]
  └─→ docs_confirmed
      │ [Board initial review]
      ├─→ rso_docs_review [Board approves]
      │   │ [RSO reviews individual documents]
      │   ├─→ rso_application_review [RSO approves all documents]
      │   │   │ [RSO approves application]
      │   │   └─→ board_final_review [Ready for board final review]
      │   │       │ [Board final review]
      │   │       ├─→ approved_pending_payment [Board approves]
      │   │       │   │ [Applicant submits payment proof]
      │   │       │   └─→ payment_submitted
      │   │       │       │ [Treasurer verifies payment]
      │   │       │       └─→ activated ✅
      │   │       └─→ denied ❌
      │   └─→ board_initial_review [RSO rejects documents - loops back]
      └─→ denied ❌ [Board denies initial]

FILE SUBMISSION FLOW:
submitted
  ├─→ [RSO Review]
  │   ├─→ gea_pending [RSO approves - awaiting GEA]
  │   │   ├─→ verified [GEA approves doc] ✅
  │   │   └─→ gea_rejected [GEA rejects]
  │   └─→ rso_rejected [RSO rejects]
  └─→ [GEA Admin Review]
      ├─→ approved ✅ [for photos/employment]
      └─→ gea_rejected [for documents]

PAYMENT FLOW:
(Implicit status via payment_verified_date field)
[Applicant submits proof] → payment_verified_date = "" (empty)
[Treasurer approves] → payment_verified_date = now() ✅
```

---

## Conclusion

**The process and code ARE misaligned.** The documentation covers only Application statuses, but the actual implementation includes File Submission and Payment tracking with their own status models. This confusion likely contributed to:

- Dashboard statistics potentially showing incorrect counts
- Ambiguous API responses about "status" fields
- Developer confusion about which status values are valid for which sheets

Priority should be updating the documentation to reflect the three separate status systems and their transitions.
