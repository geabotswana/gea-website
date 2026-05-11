# Refactoring Proposal: healthCheck() Email Sending
## Aligning _sendHealthCheckAlert() with APPLICATION Pattern

**Date:** May 10, 2026  
**Purpose:** Demonstrate how to refactor healthCheck() to match the ADM_NEW_APPLICATION_BOARD_TO_BOARD pattern

---

## CURRENT IMPLEMENTATION (healthCheck pattern)

**File:** DisasterRecoveryService.js, lines 100-172

```javascript
// In healthCheck() - line 111
_sendHealthCheckAlert(results, true);

// Separate helper function - lines 154-172
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

**Characteristics:**
- ❌ Separate helper function (_sendHealthCheckAlert)
- ❌ Nested try/catch (isolated from parent)
- ❌ Direct variables object (no intermediate staging)
- ❌ Error-only logging
- ❌ No debug logging before/after
- ❌ Two sendEmailFromTemplate calls (separate)

---

## PROPOSED REFACTORING (APPLICATION pattern)

**Approach:** Move email logic inline, add intermediate staging object, improve logging

### Option A: Inline with Intermediate Staging Object (Closest Match)

```javascript
// In healthCheck() - line 111, replace _sendHealthCheckAlert call with:
if (!results.allPassed) {
  Logger.log("[DEBUG] Health check failed, preparing alert emails");
  
  // Build check details string
  var checkDetails = "";
  results.checks.forEach(function(check) {
    checkDetails += "[" + check.status + "] " + check.name + "\n";
    checkDetails += "  Detail: " + check.detail + "\n\n";
  });

  // Stage variables in intermediate object (matches APPLICATION pattern)
  var healthCheckVars = {
    "TIMESTAMP": results.timestamp.toISOString(),
    "CHECK_DETAILS": checkDetails
  };
  
  Logger.log("[DEBUG] Health check alert variables: " + JSON.stringify({
    TIMESTAMP: healthCheckVars["TIMESTAMP"],
    CHECK_DETAILS_LENGTH: healthCheckVars["CHECK_DETAILS"].length
  }));

  // Send to both recipients with parent function error handling
  try {
    sendEmailFromTemplate("SYS_HEALTH_CHECK_ALERT_TO_BOARD", EMAIL_TREASURER, {
      FIRST_NAME: "Treasurer",
      TIMESTAMP: healthCheckVars["TIMESTAMP"],
      CHECK_DETAILS: healthCheckVars["CHECK_DETAILS"]
    });
    
    Logger.log("[DEBUG] Health check alert sent to treasurer");
    
    sendEmailFromTemplate("SYS_HEALTH_CHECK_ALERT_TO_BOARD", EMAIL_BOARD, {
      FIRST_NAME: "Board",
      TIMESTAMP: healthCheckVars["TIMESTAMP"],
      CHECK_DETAILS: healthCheckVars["CHECK_DETAILS"]
    });
    
    Logger.log("[DEBUG] Health check alert sent to board");
  } catch (e) {
    Logger.log("ERROR sending health check alert: " + e);
    logAuditEntry(null, "HEALTH_CHECK_EMAIL_FAILED", null, null, "Alert email send failed: " + e.toString());
  }
}

// DELETE the separate _sendHealthCheckAlert() helper function entirely
```

**Change Summary:**
- ✅ Inline in main function (not separate helper)
- ✅ Uses parent function try/catch context
- ✅ Intermediate staging object (healthCheckVars)
- ✅ Debug logging before and after variable construction
- ✅ Per-recipient logging after each send
- ✅ Role-aware greeting (FIRST_NAME: "Treasurer" vs "Board")
- ✅ Error logged to audit trail

---

### Option B: Recipient Loop Pattern (More DRY)

If you want to reduce repetition for multiple recipients:

```javascript
if (!results.allPassed) {
  Logger.log("[DEBUG] Health check failed, preparing alert emails");
  
  // Build check details
  var checkDetails = "";
  results.checks.forEach(function(check) {
    checkDetails += "[" + check.status + "] " + check.name + "\n";
    checkDetails += "  Detail: " + check.detail + "\n\n";
  });

  // Stage variables
  var healthCheckVars = {
    "TIMESTAMP": results.timestamp.toISOString(),
    "CHECK_DETAILS": checkDetails
  };
  
  Logger.log("[DEBUG] Health check alert variables prepared");

  // Send to multiple recipients
  var recipients = [
    { email: EMAIL_TREASURER, role: "Treasurer" },
    { email: EMAIL_BOARD, role: "Board" }
  ];

  try {
    recipients.forEach(function(recipient) {
      sendEmailFromTemplate("SYS_HEALTH_CHECK_ALERT_TO_BOARD", recipient.email, {
        FIRST_NAME: recipient.role,
        TIMESTAMP: healthCheckVars["TIMESTAMP"],
        CHECK_DETAILS: healthCheckVars["CHECK_DETAILS"]
      });
      Logger.log("[DEBUG] Health check alert sent to " + recipient.role);
    });
  } catch (e) {
    Logger.log("ERROR sending health check alert: " + e);
    logAuditEntry(null, "HEALTH_CHECK_EMAIL_FAILED", null, null, "Alert email send failed: " + e.toString());
  }
}
```

**Additional Benefits:**
- DRY principle: recipient loop reduces code duplication
- Easier to add/remove recipients
- Consistent per-recipient logging
- Scales better if more recipients needed in future

---

## SIDE-BY-SIDE COMPARISON

| Aspect | Current | Proposed A | Proposed B |
|--------|---------|-----------|-----------|
| **Helper Function** | ✅ Separate | ❌ Removed | ❌ Removed |
| **Inline Logic** | ❌ No | ✅ Yes | ✅ Yes |
| **Intermediate Object** | ❌ No | ✅ Yes | ✅ Yes |
| **Debug Logging** | ❌ No | ✅ Yes | ✅ Yes |
| **Role-Aware Greeting** | ❌ No | ✅ Yes | ✅ Yes |
| **Per-Recipient Logging** | ❌ No | ✅ Yes | ✅ Yes |
| **Recipient Loop** | ❌ No | ❌ No | ✅ Yes |
| **Code Duplication** | Low | Medium | Low |
| **Readability** | Good | Excellent | Excellent |
| **Maintainability** | Good | Excellent | Excellent |
| **Scalability** | Medium | Medium | High |

---

## KEY CHANGES EXPLAINED

### 1. Remove Separate Helper Function
**Before:**
```javascript
_sendHealthCheckAlert(results, true);  // Line 111 calls helper
```

**After:**
```javascript
// Logic inline, no separate function call
if (!results.allPassed) {
  // ... email logic here
}
```

**Why:** Matches APPLICATION pattern; keeps workflow logic in one place

---

### 2. Add Intermediate Staging Object
**Before:**
```javascript
var variables = {
  TIMESTAMP: results.timestamp.toISOString(),
  CHECK_DETAILS: checkDetails
};
```

**After:**
```javascript
var healthCheckVars = {
  "TIMESTAMP": results.timestamp.toISOString(),
  "CHECK_DETAILS": checkDetails
};
```

**Why:** Explicit object makes available fields clear; easier to document; matches APPLICATION pattern

---

### 3. Add Debug Logging
**Before:**
```javascript
try {
  sendEmailFromTemplate(...);
  sendEmailFromTemplate(...);
} catch (e) {
  Logger.log("ERROR...");
}
```

**After:**
```javascript
Logger.log("[DEBUG] Health check failed, preparing alert emails");
// ... variable construction ...
Logger.log("[DEBUG] Health check alert variables: " + JSON.stringify({...}));

try {
  sendEmailFromTemplate(...);
  Logger.log("[DEBUG] Health check alert sent to treasurer");
  sendEmailFromTemplate(...);
  Logger.log("[DEBUG] Health check alert sent to board");
} catch (e) {
  Logger.log("ERROR...");
}
```

**Why:** Visibility into email workflow; easier debugging; matches APPLICATION pattern

---

### 4. Add Role-Aware Greeting
**Before:**
```javascript
var variables = {
  TIMESTAMP: results.timestamp.toISOString(),
  CHECK_DETAILS: checkDetails
};
// No FIRST_NAME
```

**After:**
```javascript
sendEmailFromTemplate("SYS_HEALTH_CHECK_ALERT_TO_BOARD", EMAIL_TREASURER, {
  FIRST_NAME: "Treasurer",
  TIMESTAMP: healthCheckVars["TIMESTAMP"],
  CHECK_DETAILS: healthCheckVars["CHECK_DETAILS"]
});

sendEmailFromTemplate("SYS_HEALTH_CHECK_ALERT_TO_BOARD", EMAIL_BOARD, {
  FIRST_NAME: "Board",
  TIMESTAMP: healthCheckVars["TIMESTAMP"],
  CHECK_DETAILS: healthCheckVars["CHECK_DETAILS"]
});
```

**Why:** Personalized greeting for each recipient; matches APPLICATION pattern; improves UX

---

### 5. Error Logging Enhancement
**Before:**
```javascript
catch (e) {
  Logger.log("ERROR sending health check alert: " + e);
}
```

**After:**
```javascript
catch (e) {
  Logger.log("ERROR sending health check alert: " + e);
  logAuditEntry(null, "HEALTH_CHECK_EMAIL_FAILED", null, null, 
                "Alert email send failed: " + e.toString());
}
```

**Why:** Audit trail for email failures; critical for operational visibility

---

## FULL REFACTORED CODE (Option A - Inline)

```javascript
function healthCheck() {
  var results = {
    timestamp: new Date(),
    checks: [],
    allPassed: true
  };

  // Check 1: Sheets API (read from Member Directory)
  try {
    var ss = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID);
    var membersSheet = ss.getSheetByName(TAB_HOUSEHOLDS);
    var data = membersSheet.getRange(1, 1, 1, 5).getValues();
    results.checks.push({
      name: "Sheets API",
      status: "PASS",
      detail: "Read from Members sheet successful"
    });
  } catch (e) {
    results.checks.push({
      name: "Sheets API",
      status: "FAIL",
      detail: e.toString()
    });
    results.allPassed = false;
  }

  // Check 2: Gmail API (verify service is accessible)
  try {
    var quota = MailApp.getRemainingDailyQuota();
    results.checks.push({
      name: "Gmail API",
      status: "PASS",
      detail: "Gmail service accessible, " + quota + " messages remaining today"
    });
  } catch (e) {
    results.checks.push({
      name: "Gmail API",
      status: "FAIL",
      detail: e.toString()
    });
    results.allPassed = false;
  }

  // Check 3: Audit Log accessible
  try {
    var systemSheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID);
    var auditSheet = systemSheet.getSheetByName(TAB_AUDIT_LOG);
    var auditData = auditSheet.getRange(1, 1, 1, 5).getValues();
    results.checks.push({
      name: "Audit Log",
      status: "PASS",
      detail: "Audit Log sheet readable"
    });
  } catch (e) {
    results.checks.push({
      name: "Audit Log",
      status: "FAIL",
      detail: e.toString()
    });
    results.allPassed = false;
  }

  // Log result
  if (results.allPassed) {
    Logger.log("✅ Health check PASSED at " + results.timestamp);
    logAuditEntry(null, "HEALTH_CHECK_PASSED", null, null, "All checks passed");
  } else {
    Logger.log("❌ Health check FAILED at " + results.timestamp);
    logAuditEntry(null, "HEALTH_CHECK_FAILED", null, null, JSON.stringify(results.checks));

    // === REFACTORED: Inline email logic (matches APPLICATION pattern) ===
    Logger.log("[DEBUG] Health check failed, preparing alert emails");
    
    // Build check details string
    var checkDetails = "";
    results.checks.forEach(function(check) {
      checkDetails += "[" + check.status + "] " + check.name + "\n";
      checkDetails += "  Detail: " + check.detail + "\n\n";
    });

    // Stage variables in intermediate object
    var healthCheckVars = {
      "TIMESTAMP": results.timestamp.toISOString(),
      "CHECK_DETAILS": checkDetails
    };
    
    Logger.log("[DEBUG] Health check alert variables: " + JSON.stringify({
      TIMESTAMP: healthCheckVars["TIMESTAMP"],
      CHECK_DETAILS_LENGTH: healthCheckVars["CHECK_DETAILS"].length
    }));

    // Send to both recipients
    try {
      sendEmailFromTemplate("SYS_HEALTH_CHECK_ALERT_TO_BOARD", EMAIL_TREASURER, {
        FIRST_NAME: "Treasurer",
        TIMESTAMP: healthCheckVars["TIMESTAMP"],
        CHECK_DETAILS: healthCheckVars["CHECK_DETAILS"]
      });
      Logger.log("[DEBUG] Health check alert sent to treasurer");
      
      sendEmailFromTemplate("SYS_HEALTH_CHECK_ALERT_TO_BOARD", EMAIL_BOARD, {
        FIRST_NAME: "Board",
        TIMESTAMP: healthCheckVars["TIMESTAMP"],
        CHECK_DETAILS: healthCheckVars["CHECK_DETAILS"]
      });
      Logger.log("[DEBUG] Health check alert sent to board");
    } catch (e) {
      Logger.log("ERROR sending health check alert: " + e);
      logAuditEntry(null, "HEALTH_CHECK_EMAIL_FAILED", null, null, 
                    "Alert email send failed: " + e.toString());
    }
    // === END REFACTORED SECTION ===
  }

  return results;
}

// DELETE _sendHealthCheckAlert() function entirely (no longer needed)
```

---

## MIGRATION STEPS

1. **Backup current code** - Save DisasterRecoveryService.js backup
2. **Replace lines 100-115** - Inline email logic in healthCheck()
3. **Delete lines 154-172** - Remove _sendHealthCheckAlert() helper
4. **Update line references** - Note that line numbers will change
5. **Test locally** - Run healthCheck() manually to verify
6. **Monitor logs** - Check Logger output for debug messages
7. **Verify email delivery** - Confirm treasurer and board receive emails

---

## BENEFITS OF REFACTORING

1. **Consistency:** Matches established APPLICATION pattern across codebase
2. **Maintainability:** Single function, easier to understand workflow
3. **Visibility:** Debug logging provides insight into email workflow
4. **Scalability:** Loop pattern (Option B) makes adding recipients trivial
5. **Personalization:** Role-aware greetings improve user experience
6. **Audit Trail:** Email failures logged to audit log
7. **Code Reduction:** Fewer helper functions to maintain

---

## RISKS & MITIGATIONS

| Risk | Mitigation |
|------|-----------|
| Break existing email flow | Test thoroughly before deployment; monitor logs |
| Change error handling behavior | Parent try/catch still catches errors; log to audit trail |
| Recipient loop breaks single recipient | Option A avoids this; explicitly handles both recipients |
| Lost functionality | All features preserved; only structure changed |

---

## RECOMMENDATION

**Option B (Recipient Loop)** is recommended because:
1. Most DRY (Don't Repeat Yourself)
2. Easiest to maintain and extend
3. Best readability with loop structure
4. Reduces code duplication
5. Still matches APPLICATION pattern
6. Scales well if recipients added in future

---

## References

- **Current Code:** DisasterRecoveryService.js:100-172
- **APPLICATION Pattern:** ApplicationService.js:299-314
- **Comparison Document:** EMAIL_SENDING_PROCESS_COMPARISON.md

