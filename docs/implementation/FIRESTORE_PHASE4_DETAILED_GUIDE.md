# FIRESTORE PHASE 4 DETAILED IMPLEMENTATION GUIDE

**Document Version:** 1.0  
**Status:** Implementation Complete (Error Handling & Merge Patterns Fixed May 9, 2026)  
**Target Audience:** Developers familiar with Firestore, reviewing Phase 4 collections  
**Date Completed:** May 9, 2026  
**Last Updated:** May 9, 2026

---

## 1. OVERVIEW & ARCHITECTURE

### Phase 4 Scope

| Collection | Purpose | Type | Volume |
|-----------|---------|------|--------|
| **submissions** | File/document uploads with approval workflows | Top-level | ~100-500/year |
| **payments** | Membership & facility payment records | Top-level | ~50-200/year |
| **applications** | Membership application tracking (11-step workflow) | Top-level | ~30-100/year |
| **households** | Membership units/families | Top-level | ~300-500 |
| **individuals** | People within households | Subcollection | ~800-1500 |

### Critical Pattern: Merge Flag on Updates

**IMPORTANT FIX (May 9, 2026):** All `updateDocument()` calls **MUST** include `merge=true`:

```javascript
// ✅ CORRECT - merges only specified fields
fs.updateDocument('collections/docId', updates, true);

// ❌ WRONG - replaces entire document (DATA LOSS!)
fs.updateDocument('collections/docId', updates);
```

---

## 2. COLLECTIONS STRUCTURE

### 2.1 `submissions` Collection

**Document ID:** `submission_id` (e.g., `FSB-2026-00001`)

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `submission_id` | string | NO | Primary identifier |
| `household_id` | string | NO | Reference to household |
| `individual_id` | string | NO | Reference to individual |
| `document_type` | string | NO | passport, visa, permit, id_card, etc. |
| `submission_type` | string | NO | 'document' or 'photo' |
| `status` | string | NO | 'submitted', 'rso_approved', 'gea_approved', 'verified', 'expired', etc. |
| `submitted_date` | timestamp | NO | When uploaded |
| `is_current` | boolean | NO | Active version? |
| `cloud_storage_path` | string | NO | Path to file |
| `file_display_name` | string | NO | User-friendly filename |
| `file_size_bytes` | number | NO | File size |
| `rso_reviewed_by` | string | YES | RSO reviewer email |
| `rso_review_date` | timestamp | YES | When RSO reviewed |
| `gea_reviewed_by` | string | YES | GEA admin email |
| `gea_review_date` | timestamp | YES | When GEA reviewed |
| `rejection_reason` | string | YES | Internal rejection reason |
| `member_facing_rejection_reason` | string | YES | User-friendly reason |
| `notes` | string | YES | Internal notes |
| `document_expiration_date` | timestamp | YES | When document expires |
| `expiration_warning_6m_sent_date` | timestamp | YES | 6-month warning sent |
| `expiration_warning_1m_sent_date` | timestamp | YES | 1-month warning sent |
| `allow_resubmit` | boolean | NO | Can member resubmit? |
| `created_at` | timestamp | NO | Created timestamp |
| `updated_at` | timestamp | NO | Last modified |

### 2.2 `payments` Collection

**Document ID:** `payment_id` (e.g., `PAY-2026-00001`)

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `payment_id` | string | NO | Primary identifier |
| `household_id` | string | NO | Reference to household |
| `household_name` | string | NO | Denormalized name |
| `payment_date` | timestamp | NO | Payment date |
| `payment_method` | string | NO | 'Bank Transfer', 'Card', etc. |
| `currency` | string | NO | BWP, USD, ZAR |
| `amount` | number | NO | Amount in original currency |
| `amount_usd` | number | NO | USD equivalent |
| `amount_bwp` | number | NO | BWP equivalent |
| `payment_type` | string | NO | 'Dues Payment', 'Facility', etc. |
| `payment_status` | string | NO | 'pending', 'verified', 'rejected' |
| `payment_submitted_date` | timestamp | NO | When submitted |
| `payment_verified_date` | timestamp | YES | When verified |
| `payment_verified_by` | string | YES | Treasurer email |
| `balance_due_amount` | number | NO | Remaining balance |
| `notes` | string | YES | Internal notes |
| `created_at` | timestamp | NO | Created timestamp |
| `updated_at` | timestamp | NO | Last modified |

### 2.3 `applications` Collection

**Document ID:** `application_id` (e.g., `APP-2026-00001`)

**Status values:** `awaiting_docs`, `submitted`, `board_initial_review`, `rso_review`, `board_final_review`, `payment_pending`, `activated`, `denied`, `withdrawn`

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `application_id` | string | NO | Primary identifier |
| `household_id` | string | YES | Reference to household |
| `primary_individual_id` | string | YES | Lead applicant |
| `primary_applicant_name` | string | NO | Applicant name |
| `primary_applicant_email` | string | NO | Applicant email |
| `membership_category` | string | NO | 'Full', 'Individual', etc. |
| `status` | string | NO | Current workflow status |
| `submitted_date` | timestamp | NO | When submitted |
| `board_initial_status` | string | YES | 'approved', 'denied', null |
| `board_initial_reviewed_by` | string | YES | Reviewer email |
| `board_initial_review_date` | timestamp | YES | Review date |
| `rso_status` | string | YES | RSO decision |
| `rso_reviewed_by` | string | YES | RSO reviewer |
| `rso_review_date` | timestamp | YES | RSO review date |
| `board_final_status` | string | YES | Final board decision |
| `board_final_reviewed_by` | string | YES | Final reviewer |
| `board_final_review_date` | timestamp | YES | Final review date |
| `payment_status` | string | YES | Payment verification status |
| `payment_id` | string | YES | Linked payment |
| `rules_agreement_accepted` | boolean | NO | Agreed to rules? |
| `created_at` | timestamp | NO | Created timestamp |
| `updated_at` | timestamp | NO | Last modified |

### 2.4 `households` Collection

**Document ID:** `household_id` (e.g., `HSH-2026-00001`)

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `household_id` | string | NO | Primary identifier |
| `household_name` | string | NO | Family/unit name |
| `primary_member_id` | string | NO | Lead member |
| `household_type` | string | NO | 'Family', 'Individual', etc. |
| `membership_category` | string | NO | Membership type |
| `membership_level_id` | string | YES | Linked level |
| `membership_start_date` | timestamp | NO | When started |
| `membership_expiration_date` | timestamp | YES | When expires |
| `dues_amount` | number | NO | Annual dues |
| `dues_paid_amount` | number | NO | Amount paid |
| `balance_due` | number | NO | Remaining balance |
| `membership_status` | string | NO | 'Member', 'Applicant', 'Lapsed', etc. |
| `active` | boolean | NO | Is household active? |
| `address_city` | string | YES | City |
| `address_country` | string | YES | Country |
| `phone_primary` | string | YES | Contact phone |
| `country_code_primary` | string | YES | Country code |
| `phone_primary_whatsapp` | boolean | NO | WhatsApp available? |
| `approved_by` | string | YES | Who approved |
| `approved_date` | timestamp | YES | When approved |
| `lapsed_date` | timestamp | YES | When lapsed |
| `created_at` | timestamp | NO | Created timestamp |
| `updated_at` | timestamp | NO | Last modified |

### 2.5 `individuals` Subcollection

**Path:** `households/{household_id}/individuals`  
**Document ID:** `individual_id` (e.g., `IND-2026-00001`)

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `individual_id` | string | NO | Primary identifier |
| `household_id` | string | NO | Parent household |
| `first_name` | string | NO | Given name |
| `last_name` | string | NO | Surname |
| `email` | string | YES | Email address |
| `date_of_birth` | timestamp | YES | Birth date |
| `age_category` | string | YES | 'Adult', 'Minor', etc. |
| `relationship_to_primary` | string | YES | Relationship |
| `citizenship_country` | string | YES | Country of citizenship |
| `us_citizen` | boolean | NO | US citizen? |
| `passport_status` | string | YES | Passport verification status |
| `passport_expiration_date` | timestamp | YES | Passport expiry |
| `omang_status` | string | YES | Omang verification status |
| `can_access_unaccompanied` | boolean | NO | Unaccompanied facility access? |
| `voting_eligible` | boolean | NO | GEA voting rights? |
| `employment_office` | string | YES | Embassy office (EXEC, MGT, etc.) |
| `active` | boolean | NO | Is individual active? |
| `password_hash` | string | YES | Login password hash |
| `created_at` | timestamp | NO | Created timestamp |
| `updated_at` | timestamp | NO | Last modified |

---

## 3. CRITICAL FIXES (May 9, 2026)

### What Was Wrong

```javascript
// ❌ BEFORE: No error handling, crashes on missing document
function firestoreGetSubmission(submissionId) {
  var fs = getFirestore();
  var result = fs.getDocument('submissions/' + submissionId);  // THROWS on 404
  return result ? result.obj : null;
}

// ❌ BEFORE: Missing merge flag — REPLACES entire document
function firestoreUpdateSubmission(submissionId, updates) {
  fs.updateDocument('submissions/' + submissionId, updates);  // DATA LOSS
}
```

### What Was Fixed

```javascript
// ✅ AFTER: try/catch + null check
function firestoreGetSubmission(submissionId) {
  if (!submissionId) return null;
  try {
    var result = getFirestore().getDocument('submissions/' + submissionId);
    return result.obj || null;
  } catch (e) {
    return null;
  }
}

// ✅ AFTER: merge=true prevents data loss
function firestoreUpdateSubmission(submissionId, updates) {
  updates.updated_at = new Date();
  fs.updateDocument('submissions/' + submissionId, updates, true);
}
```

### All Functions Fixed

| Function | Fix |
|----------|-----|
| `firestoreGetSubmission()` | try/catch + null check |
| `firestoreGetPayment()` | try/catch + null check |
| `firestoreGetApplication()` | try/catch + null check |
| `firestoreGetHousehold()` | try/catch + null check |
| `firestoreGetIndividual()` | try/catch + null check |
| `firestoreUpdateSubmission()` | merge flag (true) |
| `firestoreUpdatePayment()` | merge flag (true) |
| `firestoreUpdateApplication()` | merge flag (true) |
| `firestoreUpdateHousehold()` | merge flag (true) |
| `firestoreUpdateIndividual()` | merge flag (true) |

---

## 4. TESTING

Run `testPhase4Read()` in GAS editor — expect 11 PASS results:

```
Household read: OK — Test Family, status: Member
Individual read: OK — Test User, email: testuser@example.com
Individual by email: OK — IND-TEST-00001
Individuals for household: OK — 1 found
Submission read: OK — passport, status: verified
Current passport: OK — FSB-TEST-00001
Submissions for individual: OK — 1 found
Payment read: OK — $500 verified
Payments for household: OK — 1 found
Application read: OK — Full, status: activated
Applications for household: OK — 1 found
```

Run `createTestPhase4Data()` first to populate test documents.

---

## 5. DATA MIGRATION

```javascript
function migrateHouseholdsToFirestore() {
  var sheet = SpreadsheetApp.openById(CONFIG.MEMBER_DIRECTORY_SPREADSHEET_ID)
    .getSheetByName('Households');
  var data = sheet.getDataRange().getValues();
  var fs = getFirestore();
  var successCount = 0;

  for (var i = 1; i < data.length; i++) {
    try {
      var row = data[i];
      var household = {
        household_id: row[0],
        household_name: row[1],
        membership_status: row[3],
        active: row[4] === true || row[4] === 'TRUE',
        created_at: new Date(row[50]),
        updated_at: new Date(row[51])
      };
      fs.createDocument('households/' + household.household_id, household);
      successCount++;
    } catch (e) {
      Logger.log('Error row ' + i + ': ' + e);
    }
  }
  Logger.log('Households migration: ' + successCount + ' records');
}
```

---

## 6. INTEGRATION POINTS

| Service | Collections Used | Key Functions |
|---------|-----------------|---------------|
| FileSubmissionService | submissions | `firestoreGetCurrentSubmissionByType()` |
| PaymentService | payments | `firestoreGetPaymentsForHousehold()` |
| ApplicationService | applications | `firestoreGetApplicationsForHousehold()` |
| MemberService | households, individuals | `firestoreGetHousehold()`, `firestoreGetIndividual()` |
| ReservationService | (via MemberService) | Cross-references households |

---

## 7. TROUBLESHOOTING

| Issue | Cause | Solution |
|-------|-------|----------|
| "Update didn't save" | Missing merge flag | Add `true` as 3rd param to `updateDocument()` |
| Crash on missing document | Missing try/catch | Wrap `getDocument()` in try/catch |
| Individual not found | Wrong path | Use `households/{id}/individuals`, not `individuals` |
| "No matching index" | Missing composite index | Create in Firestore Console → Indexes |
| "getFirestore() undefined" | Missing import | Ensure FirestoreService.js is loaded |

---

**For questions:** board@geabotswana.org  
**Last Updated:** May 9, 2026