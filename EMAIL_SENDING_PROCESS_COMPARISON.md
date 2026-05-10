# Email Sending Process Comparison
## healthCheck() vs ADM_MEMBERSHIP_ACTIVATED_TO_RSO

**Date:** May 10, 2026  
**Status:** ADM_MEMBERSHIP_ACTIVATED_TO_RSO is documented but NOT YET IMPLEMENTED

---

## 1. OVERVIEW

### healthCheck() - System Health Monitoring
- **File:** DisasterRecoveryService.js
- **Lines:** 36-115 (main function); 154-172 (email sending)
- **Purpose:** Daily automated health check (4:00 AM) that verifies critical system APIs and alerts board/treasurer on failures
- **Frequency:** Triggered daily via Apps Script time-based trigger
- **Status:** ✅ **IMPLEMENTED**

### ADM_MEMBERSHIP_ACTIVATED_TO_RSO - Membership Activation Notification
- **File:** ApplicationService.js (proposed)
- **Location:** After line 1196 in `verifyPaymentAndActivate()` function
- **Purpose:** Notify RSO team when a new member's payment is verified and their account is activated
- **Frequency:** Triggered on-demand when Treasurer approves payment
- **Status:** ❌ **PLANNED BUT NOT IMPLEMENTED**

---

## 2. SIDE-BY-SIDE COMPARISON

| Aspect | healthCheck() | ADM_MEMBERSHIP_ACTIVATED_TO_RSO |
|--------|---------------|--------------------------------|
| **Source Module** | DisasterRecoveryService.js | ApplicationService.js |
| **Trigger Function** | `healthCheck()` | `verifyPaymentAndActivate()` |
| **Template Name** | `SYS_HEALTH_CHECK_ALERT_TO_BOARD` | `ADM_MEMBERSHIP_ACTIVATED_TO_RSO` |
| **Primary Recipients** | EMAIL_TREASURER, EMAIL_BOARD | EMAIL_RSO_NOTIFY |
| **Email Count** | 2 emails (one to each recipient) | 1 email (RSO only) |
| **Trigger Condition** | System health check fails (any of 3 checks) | Treasurer verifies payment + membership activated |
| **Trigger Timing** | Daily @ 4:00 AM (scheduled) | On-demand / sporadic (user-triggered) |
| **Action Required?** | YES - Health issue requires investigation | NO - Informational closure notification |
| **Sending Method** | `sendEmailFromTemplate()` | `sendEmailFromTemplate()` (proposed) |

---

## 3. DETAILED IMPLEMENTATION ANALYSIS

### A. healthCheck() Email Sending (Lines 154-172)

```javascript
function _sendHealthCheckAlert(results, escalation) {
  var checkDetails = "";
  results.checks.forEach(function(check) {
    checkDetails += "[" + check.status + "] " + check.name + "\n";
    checkDetails += "  Detail: " + check.detail + "\n\n";
  });

  var variables = {
    TIMESTAMP: results.timestamp.toISOString(),
    CHECK_DETAILS: checkDetails
  };

  try {
    sendEmailFromTemplate("SYS_HEALTH_CHECK_ALERT_TO_BOARD", EMAIL_TREASURER, variables);
    sendEmailFromTemplate("SYS_HEALTH_CHECK_ALERT_TO_BOARD", EMAIL_BOARD, variables);
  } catch (e) {
    Logger.log("ERROR sending health check alert: " + e);
  }
}
```

**Key Characteristics:**
- **Email Construction:** Variables object built from health check results
- **Recipients:** Two separate calls to send to different recipients (treasurer + board)
- **Template Reuse:** Same template used for both recipients (not role-specific variants)
- **Error Handling:** Wrapped in try/catch; logs error but doesn't throw
- **Variables Passed:** TIMESTAMP (ISO string), CHECK_DETAILS (multi-line formatted text)
- **Escalation Flag:** Parameter exists but not used in current code (for future enhancement)
- **Logging:** Calls `Logger.log()` on error; minimal visibility

---

### B. ADM_MEMBERSHIP_ACTIVATED_TO_RSO Email Sending (Proposed)

**Proposed Code (from EMAIL_TEMPLATE_ACTIONS.md, lines 283-298):**

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

**Key Characteristics:**
- **Email Construction:** Variables object built from application + activation context
- **Recipients:** Single recipient (EMAIL_RSO_NOTIFY)
- **Template:** Dedicated template for this specific notification
- **Error Handling:** Conditional check before sending (if _rsoNotifyEmail exists); no explicit try/catch
- **Variables Passed:** FIRST_NAME (salutation), MEMBER_NAME, APPLICATION_ID, MEMBER_ID, ACTIVATION_DATE
- **Guard Clause:** Checks if EMAIL_RSO_NOTIFY is configured before attempting send
- **Logging:** No explicit logging in proposed code

---

## 4. EMAIL TEMPLATE CHARACTERISTICS

### SYS_HEALTH_CHECK_ALERT_TO_BOARD

| Property | Value |
|----------|-------|
| **Purpose** | Emergency alert - system malfunction |
| **Recipient Type** | Admin/Board/Treasurer |
| **Subject** | Not documented in visible code (in Email Templates sheet) |
| **Tone** | Urgent, technical, action-required |
| **Variables Used** | `TIMESTAMP`, `CHECK_DETAILS` |
| **Recipient Email** | Both EMAIL_TREASURER and EMAIL_BOARD |
| **Attachments** | None |
| **Conditional Logic** | None (always sends both checks) |

### ADM_MEMBERSHIP_ACTIVATED_TO_RSO

| Property | Value |
|----------|-------|
| **Purpose** | Closure notification - member now active |
| **Recipient Type** | RSO Notify (read-only role) |
| **Subject** | `{{MEMBER_NAME}} Is Now an Active GEA Member` |
| **Tone** | Informational, FYI, no action required |
| **Variables Used** | `FIRST_NAME`, `MEMBER_NAME`, `APPLICATION_ID`, `MEMBER_ID`, `ACTIVATION_DATE` |
| **Recipient Email** | EMAIL_RSO_NOTIFY |
| **Attachments** | None |
| **Conditional Logic** | None (template is straightforward) |

---

## 5. IMPLEMENTATION DIFFERENCES

### Variable Building Strategy

**healthCheck() Approach:**
- Iterates through results array to build formatted text
- Creates multi-line string with status indicators and details
- Passes as single formatted `CHECK_DETAILS` variable
- Direct data transformation (results → template variable)

**ADM_MEMBERSHIP_ACTIVATED_TO_RSO Approach:**
- Maps individual fields from application object
- Uses `formatDate()` utility for date formatting
- Includes metadata (APPLICATION_ID, MEMBER_ID) for reference
- Uses context-aware greeting ("RSO Team" vs actual name)

### Error Handling Philosophy

| Aspect | healthCheck() | ADM_MEMBERSHIP_ACTIVATED_TO_RSO |
|--------|---------------|--------------------------------|
| **Strategy** | Try/catch wrapper around both sends | Conditional guard clause |
| **Error Recovery** | Logs error; execution continues | Skips send if config missing |
| **Visibility** | Logger.log() call | No error logging in proposed code |
| **Fail-Safe** | Continues; both recipients may or may not receive | Graceful degradation if EMAIL_RSO_NOTIFY not set |

### Recipient Management

**healthCheck():**
- Uses pre-defined constants: EMAIL_TREASURER, EMAIL_BOARD
- Always sends to both recipients (no role-based filtering in sending logic)
- Two separate `sendEmailFromTemplate()` calls

**ADM_MEMBERSHIP_ACTIVATED_TO_RSO:**
- Uses single constant: EMAIL_RSO_NOTIFY
- Single `sendEmailFromTemplate()` call
- Read-only role (informational only, no action)

---

## 6. CALLING CONVENTION: sendEmailFromTemplate()

Both processes use the same underlying function. Here's how it works:

```javascript
function sendEmailFromTemplate(templateName, recipient, variables, options) {
  // 1. Fetch template from Drive (by semantic name)
  // 2. Replace {{PLACEHOLDERS}} with variables
  // 3. Wrap in GEA HTML template
  // 4. Send via GmailApp.sendEmail()
  // 5. Log success/failure
}
```

**Key Points:**
- Template lookup is by semantic name (not ID)
- Templates are stored in Google Drive, not spreadsheet
- Subject line and body text are both template-based
- Variables object uses uppercase `{{PLACEHOLDER}}` syntax

---

## 7. EXECUTION CONTEXT DIFFERENCES

### healthCheck() Execution
```
Apps Script Daily Trigger (4:00 AM)
  → healthCheck() runs
    → Checks 3 systems (Sheets, Gmail, Audit Log)
    → Results compiled into object
    → If any fail → _sendHealthCheckAlert(results, true)
      → Builds variables object
      → Sends 2 emails (try/catch)
    → Logs to Execution Log
```

**Execution Model:** Background task, scheduled, no user interaction  
**Frequency:** Once per day  
**User Visibility:** None (async, background operation)

### ADM_MEMBERSHIP_ACTIVATED_TO_RSO Execution
```
User triggers via Admin Portal (Payment Verification page)
  → Board/Treasurer clicks "Verify Payment"
    → Code.js routes to PaymentService → ApplicationService
    → verifyPaymentAndActivate(applicationId, token)
      → Updates Household/Individual status to "active"
      → Marks application as "activated"
      → Sends MEM_MEMBERSHIP_ACTIVATED_TO_MEMBER email
      → [PROPOSED] Sends ADM_MEMBERSHIP_ACTIVATED_TO_RSO email
    → Returns success response to portal
    → Portal shows confirmation message
```

**Execution Model:** Synchronous user action, foreground operation  
**Frequency:** On-demand, variable (depends on payment submissions)  
**User Visibility:** Part of payment verification workflow

---

## 8. CURRENT IMPLEMENTATION STATUS

### ✅ healthCheck() - FULLY IMPLEMENTED

- Function exists and is functional
- Email sending logic is complete
- Error handling is in place
- Daily trigger is set up (requires manual verification)
- Template exists and is active

### ❌ ADM_MEMBERSHIP_ACTIVATED_TO_RSO - NOT IMPLEMENTED

**Missing Components:**
1. Email sending code block (not in ApplicationService.js)
2. Not called from `verifyPaymentAndActivate()` function
3. Error handling not established

**What's Ready:**
- Template exists in Email Templates sheet
- Template documentation complete
- Variables documented
- Implementation instructions provided (EMAIL_TEMPLATE_ACTIONS.md)
- Design reviewed and approved (marked as LOW priority)

**Implementation Gap:**
The template is fully documented but the actual email send call is missing from the code. According to the implementation plan (EMAIL_TEMPLATE_ACTIONS.md:280-298), it should be added after line 1196 in ApplicationService.js's `verifyPaymentAndActivate()` function.

---

## 9. COMPARISON MATRIX: Process Similarities & Differences

| Dimension | Similar | Different |
|-----------|---------|-----------|
| **Sending Method** | ✅ Both use `sendEmailFromTemplate()` | — |
| **Template System** | ✅ Both use Drive-hosted templates | — |
| **Variables** | ✅ Both use object with key-value pairs | ❌ Different variable sets |
| **Recipients** | ❌ Different roles/emails | healthCheck: 2 recipients; ACTIVATION: 1 recipient |
| **Trigger** | ❌ Different trigger types | healthCheck: scheduled; ACTIVATION: user-triggered |
| **Error Handling** | ❌ Different approaches | healthCheck: try/catch; ACTIVATION: guard clause (proposed) |
| **Action Required** | ❌ Different intent | healthCheck: YES (urgent); ACTIVATION: NO (informational) |
| **Frequency** | ❌ Different cadence | healthCheck: daily; ACTIVATION: sporadic |
| **Response Type** | ❌ Different scope | healthCheck: multi-check result; ACTIVATION: single-object metadata |

---

## 10. KEY INSIGHTS & OBSERVATIONS

### Similarities
1. **Common Sending Function:** Both rely on `sendEmailFromTemplate()` for consistency
2. **Template-Based:** Both use semantically-named templates (not IDs)
3. **Variables Object:** Both pass context data as `{ KEY: value }` objects
4. **RFC 2047 Encoding:** Subject lines are automatically encoded for special characters
5. **HTML Wrapping:** Both get GEA brand treatment (header, footer, styling)

### Key Differences
1. **Execution Model:**
   - healthCheck = scheduled background task
   - ACTIVATION = synchronous user-triggered operation

2. **Recipient Count:**
   - healthCheck sends 2 emails (different recipients, same template)
   - ACTIVATION sends 1 email (single RSO notification)

3. **Error Handling:**
   - healthCheck logs errors and continues
   - ACTIVATION (proposed) uses guard clause, no logging

4. **Variables Complexity:**
   - healthCheck: 2 variables (TIMESTAMP, CHECK_DETAILS)
   - ACTIVATION: 5 variables (FIRST_NAME, MEMBER_NAME, APPLICATION_ID, MEMBER_ID, ACTIVATION_DATE)

5. **Data Transformation:**
   - healthCheck: iterates results array to build formatted string
   - ACTIVATION: maps individual fields from application object

### Design Recommendations
1. **Add Error Handling to ACTIVATION:** Wrap in try/catch like healthCheck()
2. **Add Logging:** Log success/failure of ACTIVATION email send
3. **Consider Retry Logic:** For on-demand operations (ACTIVATION), consider retry mechanism
4. **Standardize Variable Building:** Both could benefit from consistent naming conventions

---

## 11. IMPLEMENTATION CHECKLIST FOR ADM_MEMBERSHIP_ACTIVATED_TO_RSO

- [ ] Add code block to ApplicationService.js after line 1196
- [ ] Import EMAIL_RSO_NOTIFY constant (likely already imported)
- [ ] Add try/catch wrapper around sendEmailFromTemplate() call
- [ ] Add Logger.log() call for success/failure
- [ ] Test with real membership activation workflow
- [ ] Verify EMAIL_RSO_NOTIFY is configured in Config.js
- [ ] Add audit trail entry (logAuditEntry) if needed
- [ ] Document in code comments why RSO is notified

---

## 12. REFERENCES

- **healthCheck() Source:** DisasterRecoveryService.js:36-172
- **ACTIVATION Proposal:** EMAIL_TEMPLATE_ACTIONS.md:280-298
- **EMAIL_TEMPLATES_REFERENCE.md:** Line 35 (template definition)
- **ApplicationService.js:** `verifyPaymentAndActivate()` function (~line 1130-1202)

