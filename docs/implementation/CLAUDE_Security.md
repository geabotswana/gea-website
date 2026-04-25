# Security Implementation Guide

**Last Updated:** March 2026

Secure coding practices, authentication, input validation, encryption, and data protection for the GEA system.

---

## Password Security

### Password Hashing

Passwords are stored as **SHA256 hashes** in the Individuals sheet. Never store plaintext passwords.

```javascript
// AuthService.js::hashPassword(plaintext)

function hashPassword(plaintext) {
  // Use Utilities.computeDigest for SHA256 hashing
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, plaintext);
  // Encode as base64 for storage in sheet
  return Utilities.base64Encode(digest);
}
```

### Constant-Time Password Comparison

When checking password during login, use **constant-time comparison** to prevent timing attacks:

```javascript
// AuthService.js::validatePassword(plaintext, storedHash)

function validatePassword(plaintext, storedHash) {
  // Hash the provided plaintext
  var providedHash = hashPassword(plaintext);

  // Constant-time comparison (not ===, which leaks timing info)
  // Prevents timing-based password attacks
  return constantTimeEquals(providedHash, storedHash);
}

function constantTimeEquals(a, b) {
  if (a.length !== b.length) return false;

  var result = 0;
  for (var i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
```

**Key Points:**
- Use SHA256, not MD5 or weaker algorithms
- Always hash stored passwords
- Never log passwords or password hashes in debug output
- Use constant-time comparison to prevent timing attacks

---

## Session Security

### Token Generation & Storage

Session tokens are:
1. Generated as random strings
2. Hashed using SHA256 before storage
3. Stored in Sessions tab (hashed version only)
4. Validated on every API request

```javascript
// Session creation:
var token = generateRandomToken();                    // Generate random string
var hashedToken = hashToken(token);                  // Hash it
storeSessionRow({token: hashedToken, ...});          // Store hashed version
return {success: true, token: token};                // Return unhashed token to client

// Session validation:
var hashedIncoming = hashToken(clientToken);         // Hash incoming token
var sessionRow = lookupByToken(hashedIncoming);      // Find in Sessions tab
if (sessionRow && !isExpired(sessionRow)) {
  return {valid: true};                              // Token valid
}
return {valid: false};                               // Token invalid/expired
```

**Why hash tokens?**
- If database is compromised, hashed tokens are useless (like password hashes)
- Attacker cannot use stolen hashed token without knowing original
- Standard security best practice

### Sliding Window Timeout

Session timeout is **24 hours with sliding window**:

```javascript
// On every successful API call:

function validateSession(token) {
  var session = lookupSession(token);
  var now = new Date();

  // Check if expired
  if (now > new Date(session.expires_at)) {
    return null;  // Expired, cannot use
  }

  // Extend timeout (sliding window)
  session.last_activity_timestamp = now.toISOString();
  session.expires_at = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  updateSessionRow(session);

  return session;  // Valid and extended
}
```

**Why sliding window?**
- UX: User doesn't get logged out while actively using system
- Security: 24-hour inactivity limit still applies (logged out if idle)
- Standard in modern web applications

### Nightly Session Purge

Expired sessions are deleted nightly (2:00 AM GMT+2):

```javascript
function purgeExpiredSessions() {
  var sessions = getSheetData('System Backend', 'Sessions');
  var now = new Date();
  var deletedCount = 0;

  for (var i = sessions.length - 1; i >= 0; i--) {
    var session = sessions[i];
    var expiresAt = new Date(session.expires_at);

    // Delete if expired OR logged out
    if (now > expiresAt || !session.is_active) {
      deleteSheetRow('System Backend', 'Sessions', session.row_index);
      deletedCount++;
    }
  }

  Logger.log("Purged " + deletedCount + " expired sessions");
}
```

---

## RBAC & Authorization

### Role Hierarchy

Three roles with hierarchical permissions:

```javascript
member      // Regular user
            // ├─ View own profile
            // └─ Book reservations (if eligible)

board       // Administrator
            // ├─ All member permissions PLUS
            // ├─ Approve reservations
            // ├─ Approve photos
            // └─ Review applications

mgt         // Management Officer (RSO, Treasurer)
            // ├─ Approve Leobo reservations
            // └─ Verify payments
```

### Authorization at Handler Entry

**Every protected handler MUST check authorization:**

```javascript
// WRONG - No authorization check
function _handleAdminApprove(p) {
  ReservationService.approveReservation(p.reservation_id);
  return {success: true};
}

// RIGHT - Check authorization first
function _handleAdminApprove(p) {
  var auth = requireAuth(p.token, "board");
  if (!auth) {
    return {error: "FORBIDDEN", message: "Admin access required"};
  }

  ReservationService.approveReservation(p.reservation_id, auth.email);
  return {success: true};
}
```

**requireAuth() function:**
```javascript
function requireAuth(token, required_role) {
  // 1. Check token exists
  if (!token) return null;

  // 2. Validate session
  var auth = validateSession(token);
  if (!auth) return null;

  // 3. Check role authorization
  var roleHierarchy = {
    'member': 1,
    'board': 2,
    'mgt': 3
  };

  if (roleHierarchy[auth.role] < roleHierarchy[required_role]) {
    return null;  // Insufficient permissions
  }

  return auth;  // Authorized
}
```

---

## Input Validation & Sanitization

### Email Validation

```javascript
function isValidEmail(email) {
  // RFC 5322 simplified regex
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Usage:
if (!isValidEmail(p.email)) {
  return {error: "INVALID_PARAM", message: "Invalid email format"};
}
```

### Phone Number Validation

```javascript
function isValidPhone(phone) {
  // International format: +[country code][number]
  // Allows +, digits, spaces, dashes only
  var phoneRegex = /^[\+]?[\d\s\-]{10,}$/;
  return phoneRegex.test(phone) && phone.length >= 10 && phone.length <= 15;
}

// Usage:
if (!isValidPhone(p.phone)) {
  return {error: "INVALID_PARAM", message: "Invalid phone format"};
}
```

### String Length Validation

```javascript
function validateLength(string, min, max) {
  if (string.length < min || string.length > max) {
    return false;
  }
  return true;
}

// Usage:
if (!validateLength(p.first_name, 1, 100)) {
  return {error: "INVALID_PARAM", message: "First name must be 1-100 characters"};
}
```

### Input Sanitization (XSS/Injection Protection)

```javascript
function sanitizeInput(string) {
  if (typeof string !== 'string') return '';

  return string
    // Remove script tags
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Escape HTML special characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Trim whitespace
    .trim();
}

// Usage in form handlers:
var firstName = sanitizeInput(p.first_name);
var lastName = sanitizeInput(p.last_name);
```

### Preventing Common Injection Attacks

```javascript
// ❌ SQL Injection (Apps Script doesn't use SQL, but principle applies)
var household = getHouseholdById(p.household_id);  // NEVER trust user input directly

// ✅ Validate and sanitize
var household_id = sanitizeInput(p.household_id);
if (!household_id.match(/^[A-Z0-9\-]+$/)) {
  return {error: "INVALID_PARAM", message: "Invalid household ID format"};
}
var household = getHouseholdById(household_id);

// ❌ XSS (Cross-Site Scripting) - Storing unsanitized HTML
EmailService.sendEmail(template, recipient, {
  USER_INPUT: p.user_input  // DANGEROUS if p.user_input contains HTML
});

// ✅ Sanitize before storing/displaying
var safeInput = sanitizeInput(p.user_input);
EmailService.sendEmail(template, recipient, {
  USER_INPUT: safeInput
});

// ❌ Command Injection (Apps Script limitation)
// Cannot execute system commands, so less risk than other platforms
```

---

## Audit Logging

### Complete Audit Trail

Every action is logged to **Audit Log** tab:

```javascript
function logAuditEntry(userEmail, actionType, targetId, details, ipAddress) {
  var auditSheet = getSheet('System Backend', 'Audit Log');

  auditSheet.appendRow([
    new Date().toISOString(),     // timestamp
    userEmail,                     // user_email
    actionType,                    // action_type (create, approve, deny, etc.)
    targetId,                      // target_id (reservation_id, application_id, etc.)
    JSON.stringify(details),       // details (context information)
    ipAddress || 'unknown'         // ip_address (for future use)
  ]);
}

// Usage in handlers:
logAuditEntry(
  auth.email,
  "approve_reservation",
  p.reservation_id,
  {
    facility: "Tennis",
    reservation_date: "2026-03-10",
    household_id: auth.household_id
  },
  e.source.ip  // IP address from request
);
```

### Why Audit Logging?

1. **Compliance:** Federal regulations (6 FAM) require audit trail
2. **Security:** Detect unauthorized access and anomalies
3. **Debugging:** Trace user actions to troubleshoot issues
4. **Accountability:** Record who did what and when

---

## Safe Data Views

### Exclude Sensitive Data from API Responses

**Principle:** Never return `password_hash` or sensitive fields in API responses.

```javascript
// ❌ WRONG - Returns sensitive data
function getMemberData(individual_id) {
  var member = Individuals.query({individual_id: individual_id})[0];
  return member;  // Includes password_hash!
}

// ✅ RIGHT - Uses safe view
function getMemberData(individual_id) {
  var member = Individuals.query({individual_id: individual_id})[0];
  return _safePublicMember(member);
}

function _safePublicMember(member) {
  return {
    individual_id: member.individual_id,
    household_id: member.household_id,
    first_name: member.first_name,
    last_name: member.last_name,
    email: member.email,
    phone: member.phone,
    relationship_to_primary: member.relationship_to_primary,
    voting_eligible: member.voting_eligible,
    active: member.active
    // ← password_hash EXCLUDED
    // ← employment_info EXCLUDED (if sensitive)
  };
}

function _safePublicHousehold(household) {
  return {
    household_id: household.household_id,
    household_name: household.household_name,
    membership_type: household.membership_type,
    membership_expiration_date: household.membership_expiration_date,
    active: household.active
    // ← Internal notes EXCLUDED
    // ← Financial details EXCLUDED (if applicable)
  };
}
```

---

## Common Security Pitfalls

### ❌ Pitfall: Logging Passwords or Sensitive Data

```javascript
// WRONG - Leaks password hash
Logger.log("Login attempt: " + email + " password: " + password);

// RIGHT - Log only email
Logger.log("Login attempt: " + email);

// WRONG - Leaks full member data
Logger.log("Member data: " + JSON.stringify(member));

// RIGHT - Log safe view
Logger.log("Member data: " + JSON.stringify(_safePublicMember(member)));
```

### ❌ Pitfall: Not Sanitizing User Input

```javascript
// WRONG - User input used directly in email template
EmailService.sendEmail("welcome", recipient, {
  USER_MESSAGE: p.message  // Could contain HTML/JavaScript
});

// RIGHT - Sanitize first
EmailService.sendEmail("welcome", recipient, {
  USER_MESSAGE: sanitizeInput(p.message)
});
```

### ❌ Pitfall: Missing Authorization Checks

```javascript
// WRONG - No authorization check
function _handleAdminApprove(p) {
  ReservationService.approveReservation(p.reservation_id);
  return {success: true};
}

// RIGHT - Check authorization
function _handleAdminApprove(p) {
  var auth = requireAuth(p.token, "board");
  if (!auth) {
    return {error: "FORBIDDEN"};
  }
  ReservationService.approveReservation(p.reservation_id);
  return {success: true};
}
```

### ❌ Pitfall: Trusting Client-Side Validation Only

```javascript
// WRONG - Only validates on client
if (Portal.html checks p.facility === "Tennis") {
  // Server assumes facility is tennis...
}

// RIGHT - Validate on server too
if (!["Tennis", "Leobo", "Gym", "Playground"].includes(p.facility)) {
  return {error: "INVALID_PARAM", message: "Invalid facility"};
}
```

### ❌ Pitfall: Session Timeout Not Checked

```javascript
// WRONG - Check only once per session
Portal.html:
  var token = sessionStorage.getItem('token');
  // Use token for hours without re-checking

// RIGHT - Check on every API request
Code.js:
  function _routeAction(action, params) {
    var auth = requireAuth(params.token);  // Validates on every call
    if (!auth) {
      return {error: "AUTH_FAILED"};  // Expired token = new login required
    }
    // ... proceed with authenticated user
  }
```

### ❌ Pitfall: Not Using Constant-Time Password Comparison

```javascript
// WRONG - Leaks timing information
if (providedHash === storedHash) {
  return true;
}

// RIGHT - Use constant-time comparison
return constantTimeEquals(providedHash, storedHash);
```

---

## Data Protection Practices

### Personal Information Handling

```
What GEA collects:
- Names (first, last)
- Email addresses
- Phone numbers
- Employment information
- Passport/Omang numbers and copies
- Photos (member ID photos)
- Household relationships (spouse, children)

Data protection:
- Stored in Google Sheets (secured by Google access controls)
- Hashed passwords (SHA256) not stored in plaintext
- Photos transferred to Cloud Storage with access controls
- Audit log of all access (who viewed what, when)

Member privacy:
- Only GEA staff can view full records
- Members see only their own data
- Board members see full directory (as required)
- RSO sees only document approval data needed
- Treasurer sees payment and household status

Retention:
- Active member: Full retention while membership active
- Inactive member: Retain for 3 years (tax/compliance)
- After 3 years: Delete or archive per policy

Deletion:
- Member can request data deletion
- Board votes to approve
- System deletes from Individuals sheet (backups kept per GEA retention policy)
```

### Backup Security

**Automated Daily Backups:**
- Location: Google Cloud Storage (gea-public-assets bucket)
- Frequency: Daily at 2:00 AM Botswana time
- Retention: Rolling 30-day retention (older backups auto-deleted)
- Method: Apps Script time-based trigger exports sheets as .xlsx files
- Encryption: Google Cloud Storage encryption at rest (automatic, handled by Google)

**Disaster Recovery Targets:**
- RTO (Recovery Time Objective): 24 hours (1 business day acceptable downtime)
- RPO (Recovery Point Objective): 24 hours (up to 1 day of data loss acceptable)
- Runbook: See CLAUDE_DisasterRecovery.md for complete restoration procedures
- Testing: Quarterly restoration tests (last week of March, June, Sept, Dec)
- Annual test: Full system restoration in November

---

## OWASP Top 10 Mitigation

| Vulnerability | Mitigation in GEA |
|---|---|
| Injection | Input sanitization, constant-time password comparison, no raw SQL |
| Broken Auth | Session tokens, requireAuth() on all handlers, password hashing (SHA256) |
| Sensitive Data Exposure | Safe views exclude password_hash, HTTPS via script.google.com, no plaintext storage |
| XML External Entities | Apps Script limitation: not applicable |
| Broken Access Control | RBAC with role hierarchy, requireAuth() enforcement |
| Security Misconfiguration | Config.js centralized, no hardcoded secrets |
| XSS | sanitizeInput() escapes HTML, safe template variables |
| Insecure Deserialization | Apps Script limitation: not applicable |
| Using Components with Known Vulnerabilities | Google Apps Script maintained by Google, regular updates |
| Insufficient Logging & Monitoring | Audit Log tab records all actions, Logs tab for debugging |

---

## Related Documentation

- **CLAUDE_Authentication_RBAC.md** — Session management, token handling, RBAC
- **GEA_System_Architecture.md** — System overview, service modules
- **GEA Security & Privacy Policy** — Organization-level security policies (docs/policies/)
- **ROLES_PERMISSIONS_MATRIX.md** — Permission reference table (docs/reference/)
- **Utilities.js** — Security helper functions (517 lines)
- **AuthService.js** — Authentication implementation (546 lines)

---

**Last Updated:** March 6, 2026
**Status:** ✅ Complete (Disaster recovery RTO/RPO resolved; runbook complete)
**Source:** IMPLEMENTATION_TODO_CHECKLIST.md Phase 2 resolutions
