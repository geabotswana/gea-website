# FIRESTORE PHASE 1 DETAILED IMPLEMENTATION GUIDE

**Document Version:** 1.0  
**Status:** Ready for Implementation  
**Target Audience:** Developers familiar with MySQL, new to Firebase/Firestore  
**Estimated Total Duration:** 5 business days  
**Last Updated:** May 7, 2026

---

## TABLE OF CONTENTS

1. Firestore vs MySQL Concepts
2. Week 1 Setup Checklist
3. Collections & Indexes
4. Security Rules
5. Service Account Setup
6. Firebase Admin SDK in GAS
7. FirestoreAuthService Implementation
8. Data Migration Script
9. Testing Plan
10. Deployment & Monitoring
11. Common Issues & Solutions
12. Rollback Procedure

---

## 1. FIRESTORE VS MYSQL CONCEPTS

### Quick Reference Table

| **Concept** | **MySQL** | **Firestore** | **Example** |
|---|---|---|---|
| **Database** | Single database per project | Single database per Firestore project | `gea-production` |
| **Table** | Fixed schema with columns | **Collection** (flexible schema) | `sessions`, `administrators`, `households` |
| **Row** | Fixed primary key (AUTO_INCREMENT) | **Document** with custom ID | `sessions/{token_hash}` |
| **Column** | Predefined data type (INT, VARCHAR, etc.) | **Field** (any JSON type) | `sessions.email` (string), `sessions.expires_at` (timestamp) |
| **Foreign Key** | `user_id` references `users(id)` | **Reference** or **Subcollection** | `households/{id}/individuals` (subcollection) |
| **Index** | CREATE INDEX on columns | **Composite Index** in Firestore | Index on `(sessions.email, sessions.expires_at)` |
| **Query** | SELECT * FROM sessions WHERE email='user@example.com' | `.collection('sessions').where('email', '==', 'user@example.com').get()` | See code below |
| **Insert** | INSERT INTO sessions VALUES (...) | `.collection('sessions').doc(tokenHash).set({...})` | See code below |
| **Update** | UPDATE sessions SET active=0 WHERE token='abc' | `.collection('sessions').doc(token).update({active: false})` | See code below |
| **Delete** | DELETE FROM sessions WHERE expires_at < NOW() | `.collection('sessions').where('expires_at', '<', Date.now()).delete()` | Requires batch operation |

### Key Differences Explained

**1. No Fixed Schema**
```
MySQL:
  CREATE TABLE sessions (
    token_hash VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    role ENUM('member', 'board', 'mgt'),
    expires_at TIMESTAMP
  );

Firestore:
  // No schema definition — just set documents with whatever fields you want
  db.collection('sessions').doc(tokenHash).set({
    token_hash: "abc123",
    email: "user@example.com",
    role: "member",
    expires_at: admin.firestore.Timestamp.now()
  });
```

**2. Document IDs Matter**
```
MySQL: Table automatically generates IDs (primary key)
Firestore: YOU choose the document ID
  - Best practice: Use the natural key (e.g., token_hash for sessions)
  - Why: Fast lookups without needing index queries
  
Example:
  db.collection('sessions').doc('token_hash_value').get()  // Direct access
  vs
  db.collection('sessions').where('token_hash', '==', 'token_hash_value').get()  // Query (slower)
```

**3. Subcollections Instead of Foreign Keys**
```
MySQL:
  CREATE TABLE households (
    household_id VARCHAR(50) PRIMARY KEY,
    household_name VARCHAR(255)
  );
  
  CREATE TABLE individuals (
    individual_id VARCHAR(50) PRIMARY KEY,
    household_id VARCHAR(50),
    FOREIGN KEY (household_id) REFERENCES households(household_id)
  );

Firestore:
  households/
    HSH-001/
      {household_id, household_name, ...}
      individuals/
        IND-001/ {individual_id, email, ...}
        IND-002/ {individual_id, email, ...}
    HSH-002/
      {household_id, household_name, ...}
      individuals/
        IND-003/ {individual_id, email, ...}
```

**4. Querying Differences**
```
MySQL:
  SELECT email, role FROM sessions
  WHERE active = true AND expires_at > NOW()
  LIMIT 10;

Firestore:
  db.collection('sessions')
    .where('active', '==', true)
    .where('expires_at', '>', admin.firestore.Timestamp.now())
    .limit(10)
    .get();
```

### Cost Implications

| **Operation** | **MySQL (Typical)** | **Firestore** |
|---|---|---|
| Read 100 documents | 1 query = $0 (included in hosting) | 100 read operations = $0.06 |
| Write 100 documents | 1 query = $0 | 100 write operations = $0.12 |
| Monthly storage | Included with server | Pay per GB (~$0.18/GB) |

**Current GEA Estimate:** ~$0.50–1/month (47 MB data, ~100K reads/day, ~10K writes/day; first database is free-tier eligible — writes and storage stay within free quota, only excess reads are billed)

---

## 2. WEEK 1 SETUP CHECKLIST

### Prerequisites
- [ ] Google Cloud Project created
- [ ] Firestore enabled in GCP Console
- [ ] Service account created with Firestore credentials
- [ ] GAS project linked to GCP project
- [ ] Network access from GAS to Firestore API

### Day 1: GCP Project Setup (~1-2 hours)

**Note:** Using existing GCP project, so setup time is reduced.

#### Step 1.1: Use Existing GCP Project
The project already has a Google Cloud Project set up. Verify it's configured correctly:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a Project" at top
3. Confirm the existing GEA project is listed and select it
4. Note the Project ID (you'll need this for Firestore setup)

**Verification:**
```
[ ] Existing GCP project is selected
[ ] Project ID is noted (e.g., "gea-project-123456")
[ ] You have Owner or Editor role in the project
```

#### Step 1.2: Enable Firestore API (10 minutes)
1. In GCP Console, go to "APIs & Services" → "Library"
2. Search for "Cloud Firestore API"
3. Click the result
4. Click "ENABLE"
5. Wait for API to enable (should be ~1 minute)

**Verification:**
```
[ ] Firestore API shows "API ENABLED" button changed to "MANAGE"
```

#### Step 1.3: Create Firestore Database (15 minutes)
1. In GCP Console, go to "Firestore"
2. Click "Create Database"
3. **Name your database:** Set Database ID to `gea-firestore`
4. **Select your edition:** Choose **Standard Edition** (sufficient for GEA — automatic indexing, ~$2-3/month)
   - Enterprise Edition adds MongoDB compatibility and advanced query engine — not needed here
5. **Modes:** Leave **"Firestore in Native mode"** selected (default)
6. **Security rules:** Select **"Restrictive"** — denies all reads and writes by default (you will apply custom rules in Step 4 of this guide)
   - Do NOT select "Open" — it allows unrestricted public access for 30 days
7. **Real-time Updates:** Leave **unchecked** — GAS runs server-side and does not use Firebase SDK real-time listeners; enabling this has no benefit and is a permanent choice
8. **Firestore with MongoDB compatibility:** Leave **unselected** — not needed for GAS backend
9. **Location type:** Select **"Region"** (not Multi-region)
   - Multi-region (`nam5`) is US-based, costs more, and has higher latency from Botswana
   - Under the Region dropdown, select **`europe-west1`** (Belgium) — closest available region to Botswana
10. Under **"Show disaster recovery settings":**
    - **Point-in-time recovery:** Enable it — 7-day retention window, negligible storage cost at GEA's ~47 MB data size
    - **Scheduled backups:** Check **Weekly** — sufficient for Phase 1 (sessions + admins only). Upgrade to Daily once member/payment data is migrated in later phases.
      - **Backup day:** Sunday (low-activity day)
      - **Days until backups expire:** **98 days** (maximum — ~14 weekly restore points). Can be reduced later if backup storage cost is a concern; note that changing this requires deleting and re-creating the backup schedule.
11. Under **"Show encryption options":**
    - Leave **Google-managed encryption key** selected — Cloud KMS adds cost and complexity with no meaningful benefit for GEA
12. Click **"Create Database"**
13. Wait for initialization (2-3 minutes)

**Pricing note (Free-tier eligible):**
Your first Firestore database qualifies for the free quota:
- 50,000 read units/day free — Phase 1 (sessions/admins) will be well under this
- 40,000 write units/day free — full system (~10K writes/day) stays within free quota
- 1 GiB storage free — GEA's full dataset (~47 MB) stays well within free quota
- Once fully migrated (~100K reads/day), read costs will be ~$0.18/day — total system cost closer to **$0.50–1/month** (lower than the original $2–3/month estimate)

**Verification:**
```
[ ] Firestore shows collections view (empty initially)
[ ] Database ID is "gea-firestore"
[ ] Security rules show "Restrictive" (deny all by default)
[ ] Location is europe-west1 (Region, not Multi-region)
[ ] Point-in-time recovery enabled
[ ] Weekly backup scheduled
```

#### Step 1.4: Create Service Account (20 minutes)
This allows Google Apps Script to authenticate with Firestore.

**Note:** The system already has a service account for email sending. Do **not** reuse it for Firestore — keep them separate so Firestore access can be rotated or revoked independently without affecting email, and to keep permissions and audit trails clean.

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in:
   - Service account name: `gea-firestore-admin`
   - Service account description: `Firestore admin access for GAS`
4. Click "Create and Continue"
5. Grant role: **Editor** (temporary; will restrict later)
6. Click "Continue"
7. Click "Create Key" (use JSON format) — download on a personal/secure computer, not a work machine
8. In GAS Script Properties (Project Settings → Script Properties), add:
   - **Property:** `FIRESTORE_SERVICE_ACCOUNT_JSON`
   - **Value:** Paste the entire JSON key file contents

**Verification:**
```
[ ] JSON key file downloaded and saved to secure location
[ ] Key contains: "type": "service_account", "private_key", "client_email"
[ ] FIRESTORE_SERVICE_ACCOUNT_JSON added to GAS Script Properties
```

### Step 1.5: Add getFirestore() Helper to GAS

Create a new file `FirestoreService.gs` with this helper. All Firestore operations call this to get a database reference:

```javascript
function getFirestore() {
  var creds = JSON.parse(
    PropertiesService.getScriptProperties().getProperty('FIRESTORE_SERVICE_ACCOUNT_JSON')
  );
  return FirestoreApp.getFirestore(creds.client_email, creds.private_key, creds.project_id);
}
```

**Prerequisite:** This uses the [FirestoreApp](https://github.com/grahamearley/FirestoreGoogleAppsScript) library. Add it to your GAS project:
1. In GAS editor, go to **Libraries** (+ icon in left sidebar)
2. Search for script ID: `1VUSl4b1r1eoNcRWotZM3e87ybkVxJyTGKzCFzBRv7R5k7BYbkx5eVkM`
3. Select the latest version and click **Add**

---

## 3. COLLECTIONS & INDEXES (PHASE 1)

### 3.1 Sessions Collection

**Purpose:** Store user authentication sessions (temporary)

**Document ID Strategy:** Use `token_hash` as document ID for direct lookup

**Schema:**
```javascript
{
  "token_hash": "abc123def456...",  // Document ID (40-char SHA256 hash)
  "email": "user@example.com",       // For session lookup by email
  "role": "member|board|mgt",        // User role
  "created_at": Timestamp(2026-05-07T10:30:00Z),
  "expires_at": Timestamp(2026-05-09T10:30:00Z),
  "active": true
}
```

**Indexes Needed:**
```
1. sessions (email, expires_at DESC) — Find active sessions by email
2. sessions (active, expires_at DESC) — Purge expired sessions
```

### 3.2 Administrators Collection

**Purpose:** Store admin/board credentials

**Document ID Strategy:** Use `email` as document ID for direct lookup

**Schema:**
```javascript
{
  "email": "admin@example.com",      // Document ID
  "first_name": "John",
  "last_name": "Doe",
  "role": "board|rso_approve|rso_notify|mgt",
  "password_hash": "sha256_hash...", // SHA256(password), never plaintext
  "active": true,
  "created_at": Timestamp(2026-05-07T10:30:00Z)
}
```

---

## 4. SECURITY RULES (PHASE 1)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // PHASE 1: Sessions Collection
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
    
    // PHASE 1: Administrators Collection
    match /administrators/{email} {
      allow read, write: if request.auth != null;
    }
    
    // Default: Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Apply Rules in Console:**
1. Go to Firestore → "Rules" tab
2. Paste the above rules
3. Click "Publish"

---

## 5. COMPLETE FIRESTOREAUTH SERVICE

Create a new file `FirestoreAuthService.gs`:

```javascript
/**
 * FIRESTOREAUTH SERVICE
 * Firestore-based session and authentication management
 */

function firestoreCreateSession(email, role) {
  try {
    if (!email || !role) {
      throw new Error("Email and role required");
    }
    
    var db = getFirestore();
    var token = _generateToken();
    var tokenHash = _hashToken(token);
    var now = new Date();
    var expiryTime = new Date(now.getTime() + SESSION_TIMEOUT_HOURS * 60 * 60 * 1000);
    
    db.collection("sessions").doc(tokenHash).set({
      token_hash: tokenHash,
      email: email,
      role: role,
      created_at: now,
      expires_at: expiryTime,
      active: true
    });
    
    Logger.log("Session created for " + email);
    return token;
    
  } catch (error) {
    Logger.log("ERROR creating session: " + error.message);
    throw error;
  }
}

function firestoreValidateSession(token) {
  try {
    if (!token) {
      return { valid: false, reason: "No token provided" };
    }
    
    var db = getFirestore();
    var tokenHash = _hashToken(token);
    var sessionDoc = db.collection("sessions").doc(tokenHash).get();
    
    if (!sessionDoc.exists) {
      return { valid: false, reason: "Session not found" };
    }
    
    var sessionData = sessionDoc.data();
    
    if (!sessionData.active) {
      return { valid: false, reason: "Session inactive" };
    }
    
    var now = new Date();
    var expiryTime = sessionData.expires_at;
    
    if (expiryTime && typeof expiryTime.toDate === 'function') {
      expiryTime = expiryTime.toDate();
    }
    
    if (now > expiryTime) {
      return { valid: false, reason: "Session expired" };
    }
    
    return {
      valid: true,
      email: sessionData.email,
      role: sessionData.role,
      expires_at: expiryTime
    };
    
  } catch (error) {
    Logger.log("ERROR validating session: " + error.message);
    return { valid: false, reason: "Validation error" };
  }
}

function firestoreDeleteSession(token) {
  try {
    if (!token) return false;
    
    var db = getFirestore();
    var tokenHash = _hashToken(token);
    db.collection("sessions").doc(tokenHash).delete();
    
    Logger.log("Session deleted");
    return true;
    
  } catch (error) {
    Logger.log("ERROR deleting session: " + error.message);
    return false;
  }
}

function firestoreGetAdministrator(email) {
  try {
    if (!email) return null;
    
    var db = getFirestore();
    var adminDoc = db.collection("administrators").doc(email).get();
    
    return adminDoc.exists ? adminDoc.data() : null;
    
  } catch (error) {
    Logger.log("ERROR getting administrator: " + error.message);
    return null;
  }
}

function firestoreCreateAdministrator(email, firstName, lastName, role, passwordHash) {
  try {
    if (!email || !role || !passwordHash) {
      throw new Error("Required fields missing");
    }
    
    var db = getFirestore();
    var existingDoc = db.collection("administrators").doc(email).get();
    
    if (existingDoc.exists) {
      return false;
    }
    
    db.collection("administrators").doc(email).set({
      email: email,
      first_name: firstName,
      last_name: lastName,
      role: role,
      password_hash: passwordHash,
      active: true,
      created_at: new Date()
    });
    
    Logger.log("Administrator created: " + email);
    return true;
    
  } catch (error) {
    Logger.log("ERROR creating administrator: " + error.message);
    throw error;
  }
}

// Helper functions
function _hashToken(token) {
  var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token);
  return Utilities.base64Encode(hash);
}

function _generateToken() {
  try {
    var randomBytes = Utilities.getUuid();
    var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, randomBytes + Date.now());
    var encoded = Utilities.base64Encode(hash).replace(/[^a-zA-Z0-9]/g, '');
    return encoded.substring(0, 40);
  } catch (e) {
    return _generateTokenFallback();
  }
}

function _generateTokenFallback() {
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var token = "";
  for (var i = 0; i < 40; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
```

---

## 6. INTEGRATION & TESTING

### Update AuthService.js

Modify `_createSession()` and `validateSession()` to use Firestore:

```javascript
function _createSession(email, role) {
  try {
    return firestoreCreateSession(email, role);
  } catch (error) {
    Logger.log("Firestore failed, using Sheets backup: " + error.message);
    return _createSessionSheets(email, role);
  }
}

function validateSession(token) {
  try {
    var result = firestoreValidateSession(token);
    if (result.valid) {
      return { email: result.email, role: result.role };
    }
  } catch (error) {
    Logger.log("Firestore check failed, trying Sheets: " + error.message);
  }
  
  return validateSessionSheets(token);
}
```

### Test Function

Add to `Code.js`:

```javascript
function testFirestoreConnection() {
  try {
    var db = getFirestore();
    var sessionsRef = db.collection("sessions");
    var query = sessionsRef.limit(1).get();
    
    Logger.log("SUCCESS: Firestore connection working!");
    Logger.log("Sessions collection size: " + query.size);
    return { success: true };
    
  } catch (error) {
    Logger.log("ERROR: " + error.message);
    return { success: false, message: error.message };
  }
}
```

---

## 7. DEPLOYMENT & MONITORING

### Deployment Steps

1. **Store credentials** in Properties Service
2. **Deploy FirestoreAuthService.gs** and updated AuthService.js
3. **Run test function** to verify connection
4. **Monitor logs** for errors during first week
5. **Keep Sheets as fallback** during hybrid mode

### Rollback Procedure

If issues occur, simply revert AuthService.js functions to use Sheets-only operations and redeploy.

---

**Status:** Phase 1 guide complete and ready for implementation.  
**Next Step:** Create Firestore project in GCP and begin Day 1 setup.
