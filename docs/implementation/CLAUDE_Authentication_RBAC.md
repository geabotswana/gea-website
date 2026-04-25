# Authentication & Role-Based Access Control (RBAC) Implementation Guide

**Last Updated:** March 2026

Session management, authentication flow, and role-based authorization for the GEA system.

---

## Session Management Architecture

### Core Principles

- **One session per user** — New login invalidates previous sessions
- **24-hour timeout** — Sliding window (refreshed with each request)
- **Token-based auth** — SHA256 hashed tokens stored in Sessions tab
- **Nightly purge** — Expired sessions deleted via `purgeExpiredSessions()` at 2:00 AM GMT+2

### Session Storage

Sessions are stored in the **Sessions tab** (System Backend spreadsheet) with these key fields:

| Field | Purpose | Notes |
|-------|---------|-------|
| `token` | SHA256 hashed session token | Used for all API requests; lookup key |
| `user_email` | Member email address | Primary identifier |
| `user_id` / `individual_id` | Unique individual ID | Links to Individuals sheet |
| `role` | Authorization level | member, board, mgt (see below) |
| `household_id` | Member's household | For household-level operations |
| `login_timestamp` | When session created | For sliding window validation |
| `last_activity_timestamp` | Last API request time | Updated on each request |
| `expires_at` | Session expiration (24hrs from login) | Check before processing |
| `is_active` | Flag for session status | Set to FALSE on logout |

### Session Lookup Flow

```
Browser sends: google.script.run.handlePortalApi(action, params)
  ├─ Parameters include: p.token (from sessionStorage)
  │
  └─ Server-side Code.js:
     ├─ _routeAction(action, params)
     ├─ Call: var auth = requireAuth(params.token, "board")
     │
     └─ AuthService.requireAuth():
        ├─ Call: validateSession(token)
        ├─ Query Sessions tab by token (lookup)
        ├─ Verify not expired: NOW < expires_at
        ├─ Verify still active: is_active == TRUE
        ├─ Verify role matches: user_role >= required_role
        ├─ Update last_activity_timestamp = NOW (sliding window)
        └─ Return: {email, household_id, role, individual_id}
```

---

## Three-Role RBAC Model

The system defines three roles with hierarchical permissions:

### Role Definitions

```javascript
// Three roles defined in Sessions tab:

member      // Regular users (lowest privilege)
            // Permissions:
            //   - View own profile & household
            //   - Book reservations (subject to limits)
            //   - Cancel own reservations
            //   - Upload documents & photos
            //   - View household members
            //   - Access portal sections: Dashboard, Reservations, Profile, Card

board       // Administrators (middle privilege)
            // Inherits all member permissions PLUS:
            //   - Approve/deny reservations
            //   - Approve/reject member photos
            //   - Review member applications
            //   - Verify payments
            //   - Search member directory
            //   - Access admin portal: Admin.html

mgt         // Management Officer (limited privilege for specific roles)
            // Used for: RSO, Treasurer roles
            // Permissions:
            //   - Approve Leobo reservations (mgmt approval step)
            //   - Review guest lists
            //   - Verify payments (Treasurer role)
            //   - Access restricted admin sections
```

### Authorization Check Pattern

All protected API endpoints must validate authorization at entry:

```javascript
// In Code.js handler functions:

function _handleAdminApprove(p) {
  // Step 1: Require board role
  var auth = requireAuth(p.token, "board");
  if (!auth) {
    return {error: "FORBIDDEN", message: "Admin access required"};
  }

  // Step 2: Use auth object for lookups
  var household = MemberService.getHouseholdById(p.reservation_id);

  // Step 3: Proceed with business logic
  ReservationService.approveReservation(p.reservation_id, auth.email);

  return {success: true, reservation_id: p.reservation_id};
}
```

---

## Login & Logout Flow

### Login Workflow

```
1. Member accesses Portal.html login screen
   └─ Unauthenticated (anyone can reach login)

2. Member enters email & password
   └─ Portal.submitLogin(event):
      ├─ Collect: email, password
      ├─ Call: google.script.run.handlePortalApi("login", {email, password})
      └─ Disable form, show "Authenticating..."

3. Server-side: Code.js::_routeAction("login", params)
   └─ Call: AuthService.login(email, password)
      ├─ Look up member by email in Individuals sheet
      ├─ If not found: return {error: "AUTH_FAILED"}
      ├─ Hash submitted password (SHA256)
      ├─ Compare with stored password_hash (constant-time comparison)
      ├─ If match fails: return {error: "AUTH_FAILED"}
      ├─ If match succeeds:
      │  ├─ Invalidate old session (set is_active = FALSE in Sessions)
      │  ├─ Generate random token
      │  ├─ Hash token (SHA256)
      │  ├─ Create new session row in Sessions tab:
      │  │  ├─ token (hashed), user_email, individual_id, household_id, role
      │  │  ├─ login_timestamp = NOW
      │  │  ├─ expires_at = NOW + 24 hours
      │  │  └─ is_active = TRUE
      │  ├─ Get household info for role determination
      │  ├─ Return: {success: true, token: token, household: {...}, role: "member"}
      │  └─ Send email: "Login activity" (optional security notification)

4. Client-side: Portal.html receives response
   └─ If success:
      ├─ Store token in sessionStorage: sessionStorage.setItem('token', token)
      ├─ Update UI: show member dashboard
      ├─ Load member data: loadDashboard()
      └─ Start slide timer (redirect if idle 24 hours)

   └─ If error:
      ├─ Show error message: "Invalid email or password"
      ├─ Enable login form
      └─ Keep user on login screen
```

### Logout Workflow

```
1. Member clicks "Logout" button in Portal.html
   └─ Portal.submitLogout():
      ├─ Get token from sessionStorage
      ├─ Call: google.script.run.handlePortalApi("logout", {token: token})
      └─ Show "Logging out..."

2. Server-side: Code.js::_routeAction("logout", params)
   └─ Call: AuthService.logout(token)
      ├─ Look up session by token in Sessions tab
      ├─ If found:
      │  ├─ Set is_active = FALSE
      │  ├─ Record logout_timestamp = NOW
      │  ├─ Optionally: log audit entry (logout event)
      │  └─ Return: {success: true}
      ├─ If not found (already expired):
      │  └─ Return: {success: true} (idempotent)

3. Client-side: Portal.html receives response
   └─ Regardless of success:
      ├─ Clear sessionStorage.removeItem('token')
      ├─ Clear all UI state
      ├─ Redirect to login page
      └─ Show "You have been logged out"
```

---

## Session Validation & Token Verification

### validateSession() Function

This function is called on **every API request** to ensure the token is valid:

```javascript
// AuthService.js::validateSession(token)

function validateSession(token) {
  // Step 1: Hash the provided token (same algorithm used on storage)
  var hashedToken = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token);
  var hashedTokenStr = Utilities.base64Encode(hashedToken);

  // Step 2: Look up session in Sessions tab
  var sessions = getSheetData('System Backend', 'Sessions');
  var sessionRow = sessions.find(row => row.token === hashedTokenStr);

  if (!sessionRow) {
    return null; // Token not found or already deleted
  }

  // Step 3: Verify session is still valid
  var now = new Date();
  var expiresAt = new Date(sessionRow.expires_at);

  if (now > expiresAt) {
    return null; // Token expired (will be deleted on next nightly purge)
  }

  if (!sessionRow.is_active) {
    return null; // Session manually terminated (user logged out)
  }

  // Step 4: Update sliding window (extend expiration)
  sessionRow.last_activity_timestamp = new Date().toISOString();
  sessionRow.expires_at = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  updateSessionRow(sessionRow);

  // Step 5: Return auth object for use by handlers
  return {
    token: token,
    email: sessionRow.user_email,
    individual_id: sessionRow.individual_id,
    household_id: sessionRow.household_id,
    role: sessionRow.role,
    login_timestamp: new Date(sessionRow.login_timestamp),
    last_activity: new Date(sessionRow.last_activity_timestamp)
  };
}
```

### requireAuth() Function

This is the main authorization function used by handlers:

```javascript
// AuthService.js::requireAuth(token, required_role)
// Call this at the START of every handler function

function requireAuth(token, required_role) {
  // Step 1: Validate token is present
  if (!token) {
    return null; // AUTH_REQUIRED error
  }

  // Step 2: Validate session
  var auth = validateSession(token);
  if (!auth) {
    return null; // AUTH_FAILED error (invalid, expired, or logged out)
  }

  // Step 3: Check role authorization (if required_role specified)
  if (required_role) {
    var roleHierarchy = {
      'member': 1,
      'board': 2,
      'mgt': 3
    };

    if (!roleHierarchy[auth.role]) {
      return null; // Invalid role in session
    }

    if (roleHierarchy[auth.role] < roleHierarchy[required_role]) {
      return null; // FORBIDDEN (insufficient permissions)
    }
  }

  // Step 4: Return auth object for handler to use
  return auth;
}
```

### Pattern: Usage in Handlers

```javascript
// Example: Board member approving a reservation

function _handleAdminApprove(p) {
  // ALWAYS check auth first
  var auth = requireAuth(p.token, "board");
  if (!auth) {
    // Return structured error
    return {error: "AUTH_FAILED", message: "Admin access required"};
  }

  // Now auth object is safe to use
  Logger.log("Approval by: " + auth.email + " (household: " + auth.household_id + ")");

  // Proceed with business logic...
  var result = ReservationService.approveReservation(
    p.reservation_id,
    auth.email,
    auth.household_id
  );

  // Audit log automatically records: auth.email, "admin_approve", p.reservation_id
  return result;
}
```

---

## Password Hashing & Security

### Password Storage

Passwords are stored as SHA256 hashes in the Individuals sheet:

```javascript
// AuthService.js::hashPassword(plaintext)

function hashPassword(plaintext) {
  // Use Utilities.computeDigest for SHA256 hashing
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, plaintext);
  // Encode as base64 for storage in sheet
  return Utilities.base64Encode(digest);
}
```

### Password Validation

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

### Key Security Points

1. **Never log passwords** — Only log password_hash or email
2. **Use SHA256** — Google Apps Script built-in: `Utilities.computeDigest()`
3. **Constant-time comparison** — Prevents timing attacks
4. **Hash immediately on storage** — Never store plaintext
5. **Generate temp passwords** — For new accounts, use random string + hash

---

## Session Cleanup (Nightly Task)

### purgeExpiredSessions() Function

Called nightly at 2:00 AM GMT+2 by NotificationService.runNightlyTasks():

```javascript
// AuthService.js::purgeExpiredSessions()

function purgeExpiredSessions() {
  var sessions = getSheetData('System Backend', 'Sessions');
  var now = new Date();
  var deletedCount = 0;

  // Iterate backwards to safely delete rows
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
  logAuditEntry(
    'system',
    'purge_expired_sessions',
    null,
    'Cleanup task',
    {deleted_sessions: deletedCount}
  );
}
```

---

## Common Pitfalls & How to Avoid Them

### ❌ Pitfall: Forgetting to include token in API calls

```javascript
// WRONG - No token parameter
google.script.run.handlePortalApi("book", {facility: "tennis", date: "2026-03-05"});

// RIGHT - Always include token
google.script.run.handlePortalApi("book", {
  token: sessionStorage.getItem('token'),  // Get from sessionStorage
  facility: "tennis",
  date: "2026-03-05"
});
```

### ❌ Pitfall: Not checking requireAuth() result before using auth object

```javascript
// WRONG - Doesn't check if auth is null
function _handleAdminApprove(p) {
  var auth = requireAuth(p.token, "board");
  var household = MemberService.getHouseholdById(auth.household_id); // CRASHES if auth is null!
}

// RIGHT - Check and return error
function _handleAdminApprove(p) {
  var auth = requireAuth(p.token, "board");
  if (!auth) {
    return {error: "AUTH_FAILED", message: "Admin access required"};
  }
  var household = MemberService.getHouseholdById(auth.household_id);
}
```

### ❌ Pitfall: Not updating last_activity_timestamp on each request

```javascript
// This happens automatically in validateSession()
// The sliding window is CRITICAL for UX
// If you DON'T update: user logged out after 24hrs even with activity
// If you DO update: session extends 24hrs on each API call
```

### ❌ Pitfall: Using === for password comparison

```javascript
// WRONG - Vulnerable to timing attacks
if (providedHash === storedHash) {
  return true;
}

// RIGHT - Use constant-time comparison
return constantTimeEquals(providedHash, storedHash);
```

### ❌ Pitfall: Session timeout not checked on every request

```javascript
// WRONG - Check only once per load
Portal.html:
  var token = sessionStorage.getItem('token');
  // Use token for 1 hour without re-checking

// RIGHT - Check on every API request
// This is automatic in validateSession() when requireAuth() is called
// Ensures expired sessions cannot perform any operations
```

---

## Testing Authentication

### Test Data

```
Test member for general use:
  Email: jane@example.com
  Password: TestPass123!
  Individual ID: IND-2026-TEST01
  Household: HSH-2026-TEST01 (Johnson Family)
  Role: member

Test member for admin:
  Email: board@geabotswana.org
  Password: [Set by board member]
  Role: board

Test management officer:
  Email: [RSO/Treasurer email]
  Password: [Set by board]
  Role: mgt
```

### Testing Login Flow

```javascript
// In Google Apps Script editor, run this to test:

function testLogin() {
  var result = handlePortalApi("login", {
    email: "jane@example.com",
    password: "TestPass123!"
  });

  console.log("Login result:", result);
  // Should return: {success: true, token: "...", household: {...}, role: "member"}

  // Use returned token for subsequent calls
  var token = result.token;
  var dashResult = handlePortalApi("dashboard", {token: token});
  console.log("Dashboard result:", dashResult);
}
```

---

## Related Documentation

- **CLAUDE_Security.md** — Password hashing, input validation, injection protection
- **AuthService.js** — Complete authentication implementation (546 lines)
- **Code.js** — Route dispatcher & requireAuth() usage (1,503 lines)
- **Portal.html** — Client-side login form & sessionStorage management
- **Admin.html** — Admin login (same flow, requires role="board")
- **GEA_System_Schema.md** — Sessions sheet definition
- **ROLES_PERMISSIONS_MATRIX.md** — Permission reference table

---

**Last Updated:** March 4, 2026
**Source:** Extracted from CLAUDE.md lines 76–91, 153–158, 1271–1285
