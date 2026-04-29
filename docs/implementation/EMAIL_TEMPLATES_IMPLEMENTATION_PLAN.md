# Email Template Implementation Plan
## 4 New Templates: Code Integration & Triggers

**Last Updated:** 2026-04-29  
**Status:** Ready for implementation  
**Scope:** Integrate 4 new email templates into membership application workflow

---

## Summary: Templates to Implement

| # | Template | Recipient | Trigger Function | Trigger Condition | Priority |
|---|----------|-----------|------------------|-------------------|----------|
| 1 | ADM_RSO_APPLICATION_REVIEW_REQUEST_TO_RSO_APPROVE | RSO approve | FileSubmissionService `approveDocumentByRso()` | All application ID docs approved | MEDIUM |
| 2 | ADM_PAYMENT_VERIFICATION_REQUEST_TO_TREASURER | Board email (to Treasurer) | ApplicationService `boardFinalDecision()` | Board approves application (approval path) | MEDIUM |
| 3 | ADM_DOCUMENTS_APPROVED_BY_RSO_TO_APPLICANT | Applicant email | FileSubmissionService `approveDocumentByRso()` | All application ID docs approved | MEDIUM |
| 4 | ADM_MEMBERSHIP_ACTIVATED_TO_RSO | RSO notify | ApplicationService `verifyAndActivateMembership()` | Treasurer verifies payment & activates membership | MEDIUM |

---

## Template 1: ADM_RSO_APPLICATION_REVIEW_REQUEST_TO_RSO_APPROVE

### Purpose
Step 6.1 of playbook: Request RSO to review application eligibility AFTER all documents are approved. Distinguishes from document review.

### Trigger Details
- **File:** `FileSubmissionService.js`
- **Function:** `approveDocumentByRso()`
- **Current Location:** Lines 1050-1095 (approveDocumentByRso → checks if all docs approved)
- **Condition:** When `readiness.allApproved === true` AND application is in `APP_STATUS_RSO_DOCS_REVIEW`
- **Recipient:** `getConfigValue("EMAIL_RSO_APPROVE")` or `EMAIL_RSO_APPROVE` constant

### Implementation: Code Location
**File:** `FileSubmissionService.js`  
**Current Code Location:** After line 1085 (after `ADM_RSO_ALL_DOCS_APPROVED_TO_BOARD` send)

### Code to Add
```javascript
// NEW: Send application review request to RSO (Step 6 of playbook)
// RSO now needs to review eligibility, not just documents
sendEmailFromTemplate("ADM_RSO_APPLICATION_REVIEW_REQUEST_TO_RSO_APPROVE", rsoApproveEmail, {
  FIRST_NAME:           app.primary_applicant_name ? app.primary_applicant_name.split(" ")[0] : "Applicant",
  APPLICANT_NAME:       app.primary_applicant_name || "Applicant",
  APPLICATION_ID:       found.obj.application_id,
  CATEGORY_VERIFICATION_REQUIREMENTS: "Verify membership category, sponsor credentials, and eligibility rules",
  DEADLINE:             formatDate(addDays(new Date(), 14))  // 14-day review window
});
```

### Variable Mappings
| Variable | Source | Example |
|----------|--------|---------|
| FIRST_NAME | `app.primary_applicant_name.split(" ")[0]` | "John" |
| APPLICANT_NAME | `app.primary_applicant_name` | "John Doe" |
| APPLICATION_ID | `found.obj.application_id` | "APP-2026-001234" |
| CATEGORY_VERIFICATION_REQUIREMENTS | Hardcoded text | "Verify membership category..." |
| DEADLINE | `addDays(new Date(), 14)` | "2026-05-13" |

### Pre-Implementation Checklist
- [ ] Verify `EMAIL_RSO_APPROVE` constant exists in Config.js
- [ ] Confirm `addDays()` function is available (Utilities.js)
- [ ] Verify `formatDate()` function works correctly
- [ ] Check that application object includes `primary_applicant_name`

---

## Template 2: ADM_PAYMENT_VERIFICATION_REQUEST_TO_TREASURER

### Purpose
Step 7A.3 of playbook: Explicit action request to Treasurer when board approves application. Sent to board email for coverage.

### Trigger Details
- **File:** `ApplicationService.js`
- **Function:** `boardFinalDecision()`
- **Current Location:** Lines 849-925 (boardFinalDecision approval path)
- **Condition:** When `decision === "approved"` (after line 896)
- **Recipient:** Board email (`getConfigValue("EMAIL_BOARD")`)
- **Body Addressing:** Message body should be addressed to Treasurer, though email goes to board

### Implementation: Code Location
**File:** `ApplicationService.js`  
**Current Code:** Lines 886-903 (approval path: MEM_APPLICATION_APPROVED_TO_APPLICANT + PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD)

### Code to Replace/Modify
**Current Code (lines 896-903):**
```javascript
// Notify treasurer
var treasurerEmail = getConfigValue("TREASURER_EMAIL") || "treasurer@geabotswana.org";
sendEmailFromTemplate("PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD", treasurerEmail, {
  FIRST_NAME:      "Treasurer",
  MEMBER_NAME:     _appName4,
  PAYMENT_ID:      paymentRef,
  AMOUNT:          duesAmount,
  CURRENCY:        "BWP",
  STATUS:          "Approved — payment expected",
  SUBMISSION_DATE: formatDate(new Date())
});
```

**Replace With:**
```javascript
// Notify board with explicit action request to Treasurer (Step 7A.3)
// Email goes to board email; body addresses Treasurer for coverage
var boardEmail = getConfigValue("EMAIL_BOARD") || "board@geabotswana.org";
sendEmailFromTemplate("ADM_PAYMENT_VERIFICATION_REQUEST_TO_TREASURER", boardEmail, {
  FIRST_NAME:        _appFirstName4,
  MEMBER_NAME:       _appName4,
  APPLICATION_ID:    applicationId,
  AMOUNT:            duesAmount,
  CURRENCY:          "BWP",
  PAYMENT_DEADLINE:  formatDate(addDays(new Date(), 30))
});
```

### Variable Mappings
| Variable | Source | Example |
|----------|--------|---------|
| FIRST_NAME | `_appFirstName4` (already defined in function) | "John" |
| MEMBER_NAME | `_appName4` (already defined in function) | "John Doe" |
| APPLICATION_ID | `applicationId` (function parameter) | "APP-2026-001234" |
| AMOUNT | `duesAmount` (already calculated) | "150.00" |
| CURRENCY | Hardcoded | "BWP" |
| PAYMENT_DEADLINE | `addDays(new Date(), 30)` | "2026-05-29" |

### Pre-Implementation Checklist
- [ ] Verify `EMAIL_BOARD` constant is available in Config.js
- [ ] Confirm `addDays()` function is available
- [ ] Note: Variables `_appFirstName4`, `_appName4`, `duesAmount` already exist in function
- [ ] Update template body to address Treasurer by role (not by name)

---

## Template 3: ADM_DOCUMENTS_APPROVED_BY_RSO_TO_APPLICANT

### Purpose
Step 5.3 of playbook: Transparency notification to applicant when ALL application ID documents are approved by RSO.

### Trigger Details
- **File:** `FileSubmissionService.js`
- **Function:** `approveDocumentByRso()`
- **Current Location:** Lines 1050-1095 (same location as Template 1)
- **Condition:** When `readiness.allApproved === true` AND application is in `APP_STATUS_RSO_DOCS_REVIEW`
- **Recipient:** `app.primary_applicant_email`
- **Note:** Send to applicant (NOT board, unlike existing ADM_DOCUMENT_APPROVED_BY_RSO_TO_BOARD)

### Implementation: Code Location
**File:** `FileSubmissionService.js`  
**Current Code Location:** After line 1085 (same block as Template 1)

### Code to Add
```javascript
// NEW: Send transparency notification to applicant (Step 5.3 of playbook)
// Applicant should know when all their ID documents have been approved
sendEmailFromTemplate("ADM_DOCUMENTS_APPROVED_BY_RSO_TO_APPLICANT", app.primary_applicant_email, {
  FIRST_NAME:      app.primary_applicant_name ? app.primary_applicant_name.split(" ")[0] : "Applicant",
  APPLICATION_ID:  found.obj.application_id,
  APPROVAL_DATE:   formatDate(new Date()),
  DOCUMENT_TYPES:  "All required identity documents",  // Could be dynamic from readiness.docs
  PORTAL_URL:      getConfigValue("PORTAL_URL") || ""
});
```

### Variable Mappings
| Variable | Source | Example |
|----------|--------|---------|
| FIRST_NAME | `app.primary_applicant_name.split(" ")[0]` | "John" |
| APPLICATION_ID | `found.obj.application_id` | "APP-2026-001234" |
| APPROVAL_DATE | `formatDate(new Date())` | "2026-04-29" |
| DOCUMENT_TYPES | Hardcoded or from `readiness.docs` | "All required identity documents" |
| PORTAL_URL | `getConfigValue("PORTAL_URL")` | "https://script.google.com/..." |

### Enhanced Version (Optional)
If `readiness` object contains document list, could show specific docs:
```javascript
var docsList = readiness.docs ? readiness.docs.map(function(d) { return d.type; }).join(", ") : "All required documents";
```

### Pre-Implementation Checklist
- [ ] Verify `PORTAL_URL` config exists
- [ ] Confirm `app.primary_applicant_email` is available in function scope
- [ ] Check `readiness` object structure to see if we can extract document types
- [ ] Test email rendering with empty PORTAL_URL fallback

---

## Template 4: ADM_MEMBERSHIP_ACTIVATED_TO_RSO

### Purpose
Step 9.4 of playbook: Closure notification to RSO when member is activated. RSO now expects the new member in directory.

### Trigger Details
- **File:** `ApplicationService.js`
- **Function:** `verifyAndActivateMembership()`
- **Current Location:** Lines 1106-1196
- **Condition:** After all membership activation steps are complete (after line 1196)
- **Recipient:** `getConfigValue("EMAIL_RSO_NOTIFY")` or `EMAIL_RSO_NOTIFY` constant
- **Email Type:** RSO notify role (read-only, for information only)

### Implementation: Code Location
**File:** `ApplicationService.js`  
**Current Code:** Lines 1180-1196 (after ADM_BOARD_FINAL_APPROVAL_TO_BOARD)

### Code to Add
```javascript
// NEW: Notify RSO of membership activation (Step 9.4 of playbook)
// RSO needs to know member is now active so they can expect them in member directory
var rsoNotifyEmail = getConfigValue("EMAIL_RSO_NOTIFY") || "rso@geabotswana.org";
sendEmailFromTemplate("ADM_MEMBERSHIP_ACTIVATED_TO_RSO", rsoNotifyEmail, {
  FIRST_NAME:      _appFirstName7,
  MEMBER_NAME:     _appName7,
  APPLICATION_ID:  applicationId,
  MEMBER_ID:       application.primary_member_id || "(generated at activation)",
  ACTIVATION_DATE: formatDate(new Date())
});
```

### Variable Mappings
| Variable | Source | Example |
|----------|--------|---------|
| FIRST_NAME | `_appFirstName7` (already defined in function) | "John" |
| MEMBER_NAME | `_appName7` (already defined in function) | "John Doe" |
| APPLICATION_ID | `applicationId` (function parameter) | "APP-2026-001234" |
| MEMBER_ID | `application.primary_member_id` | "IND-2026-005678" |
| ACTIVATION_DATE | `formatDate(new Date())` | "2026-04-29" |

### Pre-Implementation Checklist
- [ ] Verify `EMAIL_RSO_NOTIFY` constant exists in Config.js
- [ ] Confirm `application.primary_member_id` is available
- [ ] Note: Variables `_appFirstName7`, `_appName7` already exist in function
- [ ] Placement: After line 1196 (after board FYI email)

---

## Implementation Order & Dependencies

### Phase 1: Independent Additions (Can be done in any order)
1. **Template 1 & 3:** FileSubmissionService.js (same block, both in `approveDocumentByRso()`)
2. **Template 4:** ApplicationService.js `verifyAndActivateMembership()` (independent location)

### Phase 2: Replacement Required
3. **Template 2:** ApplicationService.js `boardFinalDecision()` (replaces existing email call)

### Recommended Sequence
1. Add Template 1 & 3 together to FileSubmissionService.js
2. Add Template 4 to ApplicationService.js
3. Replace Template 2 email in ApplicationService.js

---

## Testing Checklist

### Pre-Implementation Testing
- [ ] Verify all 4 template files exist in `/docs/email_templates/`
- [ ] Verify all 4 templates are in `Email_Templates_Sheet.csv` with drive_file_ids
- [ ] Confirm all 4 templates have content (not empty files)
- [ ] Test `sendEmailFromTemplate()` function with existing templates (verify it works)

### Per-Template Testing

#### Template 1 & 3 (FileSubmissionService)
- [ ] Create test application with multiple documents
- [ ] RSO approves each document individually (verify no premature email)
- [ ] RSO approves final document that completes all required docs
  - [ ] Verify Template 1 sent to RSO approve email ✓
  - [ ] Verify Template 3 sent to applicant email ✓
  - [ ] Verify both emails in same execution (no delays)
- [ ] Check email subject and body contain expected variables

#### Template 2 (ApplicationService - boardFinalDecision approval)
- [ ] Create test application at board_final_review stage
- [ ] Board approves application
  - [ ] Verify MEM_APPLICATION_APPROVED_TO_APPLICANT sent to applicant ✓
  - [ ] Verify ADM_PAYMENT_VERIFICATION_REQUEST_TO_TREASURER sent to board email ✓
  - [ ] Verify old PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD is NO LONGER sent ✓
- [ ] Check subject line shows "Action Required: Payment Verification..."
- [ ] Verify message body addresses Treasurer appropriately

#### Template 4 (ApplicationService - verifyAndActivateMembership)
- [ ] Create test application with payment submitted
- [ ] Treasurer verifies payment
  - [ ] Verify MEM_MEMBERSHIP_ACTIVATED_TO_MEMBER sent to applicant ✓
  - [ ] Verify ADM_BOARD_FINAL_APPROVAL_TO_BOARD sent to board ✓
  - [ ] Verify ADM_MEMBERSHIP_ACTIVATED_TO_RSO sent to RSO notify email ✓
- [ ] Check all 3 emails contain correct application/member IDs
- [ ] Verify activation date is today

### Integration Testing
- [ ] Run full application workflow from submission to activation
- [ ] Verify all 4 new emails sent at correct steps
- [ ] Verify existing emails still work and not duplicated
- [ ] Check Audit Log shows all actions
- [ ] Verify no emails sent to wrong recipients

### Regression Testing
- [ ] Test board denials (verify MEM_APPLICATION_DENIED_TO_APPLICANT still works)
- [ ] Test document rejection (verify existing rejection emails still work)
- [ ] Test duplicate document (verify no email sent for duplicates)
- [ ] Test household member removals (verify cleanup still works)

---

## Code Review Checklist

- [ ] All 4 `sendEmailFromTemplate()` calls use correct template names (exact case)
- [ ] All variables match template placeholders in Email_Templates_Sheet.csv
- [ ] All variables are defined and not null/undefined before use
- [ ] All recipients are email addresses (strings), not arrays (unless template expects array)
- [ ] No hardcoded "Applicant" names (use actual names from object)
- [ ] Dates formatted consistently with `formatDate()`
- [ ] No sensitive data (passwords, tokens) in email variables
- [ ] Function indentation and structure preserved

---

## Rollback Plan

If issues arise during implementation:

1. **If Template 1 & 3 cause issues:**
   - Comment out both `sendEmailFromTemplate()` calls in FileSubmissionService.js lines 1086-1095
   - Existing `ADM_RSO_ALL_DOCS_APPROVED_TO_BOARD` will still notify board

2. **If Template 2 causes issues:**
   - Revert to original `PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD` call
   - Restore lines 896-903 to original code

3. **If Template 4 causes issues:**
   - Remove `sendEmailFromTemplate()` call from verifyAndActivateMembership()
   - Existing `MEM_MEMBERSHIP_ACTIVATED_TO_MEMBER` and `ADM_BOARD_FINAL_APPROVAL_TO_BOARD` will still work

---

## File Changes Summary

| File | Function | Change Type | Lines Affected |
|------|----------|-------------|-----------------|
| FileSubmissionService.js | approveDocumentByRso() | Add 2 email sends | After line 1085 |
| ApplicationService.js | boardFinalDecision() | Replace 1 email send | Lines 896-903 |
| ApplicationService.js | verifyAndActivateMembership() | Add 1 email send | After line 1196 |

**Total Changes:** 3 functions, 3 code locations, ~20 new lines of code

---

## Next Steps

1. Review this plan with team
2. Implement changes per "Implementation Order & Dependencies"
3. Execute "Testing Checklist" items
4. Commit to main branch with message: `Implement 4 new email templates in membership workflow (ADM_RSO_APPLICATION_REVIEW_REQUEST_TO_RSO_APPROVE, ADM_PAYMENT_VERIFICATION_REQUEST_TO_TREASURER, ADM_DOCUMENTS_APPROVED_BY_RSO_TO_APPLICANT, ADM_MEMBERSHIP_ACTIVATED_TO_RSO)`
5. Monitor production for any email delivery issues

---

**Document Status:** Ready for implementation  
**Created:** 2026-04-29  
**Author:** Claude  
**Review Status:** Pending
