# Firestore Migration Plan: Field-by-Field Analysis

**Date:** April 23, 2026  
**Status:** Planning Phase - Field Audit Complete  
**Basis:** Analysis of 200+ fields across all service modules and frontend code

---

## Executive Summary

Migration from Google Sheets to Firestore reveals:
- **180+ fields actively used** across service modules
- **~20 unused fields identified** (secondary/emergency phone variants) — safe to remove
- **No major technical debt** — system is well-structured for migration
- **Clear migration path** — Sessions → Reservations → Members → Payments → Applications (phased approach)

---

## Part A: Cleanup Opportunities

### Removal Candidates (Zero Code References)

These fields exist in the schema but are never referenced in any service module, frontend, or email template. **Safe to remove during migration.**

#### Households Sheet
| Field | References | Recommendation |
|-------|-----------|-----------------|
| `country_code_secondary` | 0 | ❌ Remove |
| `phone_secondary` | 0 | ❌ Remove |
| `phone_secondary_whatsapp` | 0 | ❌ Remove |
| `country_code_emergency` | 0 | ❌ Remove |
| `phone_emergency` | 0 | ❌ Remove |
| `phone_emergency_whatsapp` | 0 | ❌ Remove |

#### Individuals Sheet
| Field | References | Recommendation |
|-------|-----------|-----------------|
| `country_code_secondary` | 0 | ❌ Remove |
| `phone_secondary` | 0 | ❌ Remove |
| `phone_secondary_whatsapp` | 0 | ❌ Remove |
| `country_code_emergency` | 0 | ❌ Remove |
| `phone_emergency` | 0 | ❌ Remove |
| `phone_emergency_whatsapp` | 0 | ❌ Remove |
| `employment_office` (Household context) | 1 ref (fallback) | ⚠️ Keep - document future use |

**Impact:** Removing these fields will simplify Firestore schema by ~10% without losing any functionality.

---

## Part B: Migration Sequencing

Ordered by dependencies and risk profile:

### Phase 1: Sessions (EASIEST — No Dependencies)
- **Why first:** Self-contained, no foreign keys to other collections
- **Risk:** Lowest — authentication doesn't break until migration complete
- **Dependencies:** None
- **Firestore collections:** `sessions`
- **Code change:** Update AuthService → FirestoreAuthService

### Phase 2: Administrators (SAME AS SESSIONS)
- **Why:** Admin accounts are self-contained (similar to Sessions)
- **Firestore collections:** `administrators`
- **Code change:** Update AuthService admin lookup

### Phase 3: Reservations + Guest Lists (MEDIUM)
- **Why:** Can be migrated together (Guest Lists reference Reservations)
- **Risk:** Medium — booking logic is complex
- **Dependencies:** Needs live Households/Individuals for lookups
- **Firestore collections:** `reservations`, `reservations/{id}/guest_lists`
- **Code change:** Update ReservationService → FirestoreReservationService
- **Hybrid Mode:** Can query live Households from Sheets during transition

### Phase 4: File Submissions (MEDIUM)
- **Why:** Manageable size, complex approval workflow
- **Risk:** Medium — multi-stage approval process
- **Dependencies:** Needs live Individuals for lookups
- **Firestore collections:** `individuals/{id}/file_submissions`
- **Code change:** Update FileSubmissionService → FirestoreFileService
- **Hybrid Mode:** Can query live Individuals from Sheets during transition

### Phase 5: Payments (MEDIUM)
- **Why:** Financial data — requires careful validation
- **Risk:** Medium-High — payment history must be preserved
- **Dependencies:** Needs live Households for lookups
- **Firestore collections:** `payments`
- **Code change:** Update PaymentService → FirestorePaymentService
- **Hybrid Mode:** Can query live Households from Sheets during transition

### Phase 6: Households + Individuals (HARDEST — Foundation)
- **Why:** Everything depends on these; migrate last
- **Risk:** Highest — All lookups depend on this
- **Dependencies:** All other collections
- **Firestore collections:** `households`, `households/{id}/individuals`
- **Code change:** Update MemberService → FirestoreMemberService
- **Note:** Coordinate with other services once dependencies are migrated

### Phase 7: Applications + Membership Levels (LAST)
- **Why:** References Households (will be migrated)
- **Risk:** Medium — complex workflow state machine
- **Firestore collections:** `applications`, `membership_levels`
- **Code change:** Update ApplicationService → FirestoreApplicationService

### Phase 8: Configuration + Audit Log (UTILITIES)
- **Why:** Configuration is read-mostly; Audit Log is append-only
- **Risk:** Low
- **Firestore collections:** `config`, `audit_logs`
- **Code change:** Migrate Config.js references, add AuditLogService

---

## Part C: Firestore Collection Design (No Unused Fields)

### 1. `sessions` Collection

**Purpose:** User session management for authentication  
**Document ID:** Use `token_hash` as document ID for fast lookup

```json
{
  "token_hash": "abc123...",
  "email": "user@example.com",
  "role": "member|board|mgt",
  "created_at": "2026-04-23T10:30:00Z",
  "expires_at": "2026-04-25T10:30:00Z",
  "active": true
}
```

**Removed Fields:**
- ~~`session_id`~~ (use Firestore document ID instead)

**Migration Notes:**
- Index on `email` and `expires_at` for queries
- TTL policy: Auto-delete expired sessions after 48 hours
- Lookup strategy: Query by `token_hash` (fast) or by `email` (for single-session per user enforcement)

---

### 2. `administrators` Collection

**Purpose:** Admin account credentials  
**Document ID:** Use `email` as document ID

```json
{
  "email": "admin@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "board|rso_approve|rso_notify|mgt",
  "password_hash": "sha256...",
  "active": true,
  "created_at": "2026-04-23T10:30:00Z"
}
```

**Removed Fields:**
- ~~`admin_id`~~ (use email as document ID)
- (No unused fields to remove)

---

### 3. `households` Collection

**Purpose:** Membership household/unit  
**Document ID:** Use `household_id`  
**Subcollection:** `individuals` (1:N relationship)

```json
{
  "household_id": "HSH-2026-00001",
  "household_name": "Johnson Family",
  "primary_member_id": "IND-2026-00001",
  "active": true,
  "membership_status": "Member|Applicant|Lapsed|Resigned|Expelled",
  "membership_start_date": "2024-01-01",
  "membership_expiration_date": "2026-12-31",
  "lapsed_date": null,
  "membership_level_id": "full_family",
  "membership_category": "Full",
  "dues_amount": 500.00,
  "dues_paid_amount": 500.00,
  "balance_due": 0.00,
  "dues_last_payment_date": "2026-04-01",
  "address_street": "123 Main St",
  "address_city": "Gaborone",
  "address_country": "Botswana",
  "country_code_primary": "BW",
  "phone_primary": "7182522",
  "phone_primary_whatsapp": true,
  "application_status": "Approved",
  "application_date": "2024-01-01",
  "approved_by": "board@example.com",
  "approved_date": "2024-01-15",
  "denial_reason": null,
  "sponsor_name": null,
  "sponsor_email": null,
  "sponsor_verified": null,
  "sponsor_verified_date": null,
  "sponsor_verified_by": null,
  "sponsor_notes": null,
  "created_at": "2024-01-01T08:00:00Z",
  "updated_at": "2026-04-23T10:30:00Z"
}
```

**Removed Fields:**
- ~~`country_code_secondary`~~ ❌
- ~~`phone_secondary`~~ ❌
- ~~`phone_secondary_whatsapp`~~ ❌
- ~~`country_code_emergency`~~ ❌
- ~~`phone_emergency`~~ ❌
- ~~`phone_emergency_whatsapp`~~ ❌

**Migration Notes:**
- Index on `active`, `membership_status`, `membership_expiration_date`
- Denormalize `household_name` in Reservations for fast filtering without joins
- Phone fields synced nightly from primary individual

---

### 4. `households/{household_id}/individuals` Subcollection

**Purpose:** People within a household  
**Document ID:** Use `individual_id`

```json
{
  "individual_id": "IND-2026-00001",
  "household_id": "HSH-2026-00001",
  "email": "jane@example.com",
  "password_hash": "sha256...",
  "first_name": "Jane",
  "last_name": "Johnson",
  "date_of_birth": "1990-05-15",
  "age_category": "Adult",
  "relationship_to_primary": "Primary",
  "citizenship_country": "United States",
  "us_citizen": true,
  "country_code_primary": "US",
  "phone_primary": "2015551234",
  "phone_primary_whatsapp": false,
  "passport_number": "N12345678",
  "passport_status": "verified",
  "passport_expiration_date": "2028-12-31",
  "passport_expiration_warning_sent": false,
  "passport_expiration_warning_date": null,
  "omang_number": "12 345 678 9",
  "omang_status": "verified",
  "omang_expiration_date": "2030-01-01",
  "omang_expiration_warning_sent": false,
  "omang_expiration_warning_date": null,
  "photo_status": "approved",
  "current_passport_submission_id": "FSB-2026-00001",
  "current_omang_submission_id": "FSB-2026-00002",
  "current_photo_submission_id": "FSB-2026-00003",
  "can_access_unaccompanied": true,
  "voting_eligible": true,
  "fitness_center_eligible": true,
  "office_eligible": true,
  "employment_job_title": "Vice Consul",
  "employment_verification_file_id": "google_drive_file_id",
  "staff_rso_cleared": true,
  "staff_rso_clearance_date": "2024-01-15",
  "arrival_date": "2023-06-01",
  "departure_date": "2027-06-01",
  "first_login_date": "2024-01-15T10:30:00Z",
  "last_login_date": "2026-04-23T09:45:00Z",
  "emergency_contact_name": "John Johnson",
  "emergency_contact_relationship": "Spouse",
  "emergency_contact_email": "john@example.com",
  "active": true,
  "created_at": "2024-01-01T08:00:00Z",
  "updated_at": "2026-04-23T10:30:00Z"
}
```

**Removed Fields:**
- ~~`country_code_secondary`~~ ❌
- ~~`phone_secondary`~~ ❌
- ~~`phone_secondary_whatsapp`~~ ❌
- ~~`country_code_emergency`~~ ❌
- ~~`phone_emergency`~~ ❌
- ~~`phone_emergency_whatsapp`~~ ❌

**Migration Notes:**
- Index on `email` (for login), `household_id`, `active`
- Keep emergency_contact info (single contact) but remove multi-phone duplicates
- Derived fields: `age_category`, `*_eligible` — compute at read-time from DOB

---

### 5. `reservations` Collection

**Purpose:** Facility reservations  
**Document ID:** Use `reservation_id`  
**Subcollection:** `guest_lists` (1:N relationship)

```json
{
  "reservation_id": "RES-2026-00001",
  "household_id": "HSH-2026-00001",
  "household_name": "Johnson Family",
  "submitted_by_individual_id": "IND-2026-00001",
  "submitted_by_email": "jane@example.com",
  "submission_timestamp": "2026-04-23T10:30:00Z",
  "facility": "Tennis Court|Leobo|Entire Facility|Playground|Gym",
  "reservation_date": "2026-05-15",
  "start_time": "09:00",
  "end_time": "11:00",
  "duration_hours": 2,
  "event_name": "Family Tennis",
  "guest_count": 2,
  "has_guests": true,
  "guest_list_submitted": true,
  "guest_list_deadline": "2026-05-11",
  "status": "Pending|Approved|Tentative|Confirmed|Cancelled|Waitlisted|Bumped",
  "is_excess_reservation": false,
  "bump_window_deadline": "2026-05-14",
  "bumped_by_household_id": null,
  "bumped_date": null,
  "no_fundraising_confirmed": true,
  "mgt_approved_by": null,
  "mgt_approved_date": null,
  "board_approval_required": false,
  "board_approved_by": null,
  "board_approval_timestamp": null,
  "board_denial_reason": null,
  "calendar_event_id": "google_calendar_event_id",
  "cancelled_by": null,
  "cancellation_timestamp": null,
  "cancellation_reason": null,
  "notes": "Family outing",
  "created_at": "2026-04-23T10:30:00Z",
  "updated_at": "2026-04-23T10:30:00Z"
}
```

**Removed Fields:**
- (None — all fields actively used)

**Migration Notes:**
- Index on `facility`, `reservation_date`, `status`, `household_id`
- Denormalize `household_name` for quick display without joins
- Subcollection `guest_lists` for 1:N relationship (see below)

---

### 6. `reservations/{reservation_id}/guest_lists` Subcollection

**Purpose:** Guest list for a reservation  
**Document ID:** Use `guest_list_id`

```json
{
  "guest_list_id": "GL-2026-00001",
  "reservation_id": "RES-2026-00001",
  "household_id": "HSH-2026-00001",
  "household_name": "Johnson Family",
  "submitted_timestamp": "2026-04-24T08:00:00Z",
  "status": "Pending|Finalized|Rejected",
  "finalized_timestamp": "2026-04-25T10:00:00Z",
  "guests": [
    {
      "first_name": "Mary",
      "last_name": "Smith",
      "age_group": "Adult",
      "id_number": "12345678",
      "decision": "approved"
    }
  ],
  "created_at": "2026-04-24T08:00:00Z",
  "updated_at": "2026-04-25T10:00:00Z"
}
```

**Removed Fields:**
- (None — all fields actively used)

**Migration Notes:**
- Guests stored as array of objects (avoid nested subcollections for simplicity)
- Index on `status`, `reservation_id`

---

### 7. `individuals/{individual_id}/file_submissions` Subcollection

**Purpose:** Document and photo uploads  
**Document ID:** Use `submission_id`

```json
{
  "submission_id": "FSB-2026-00001",
  "individual_id": "IND-2026-00001",
  "application_id": "APP-2026-00001",
  "document_type": "passport|omang|photo|employment_verification",
  "file_id": "google_drive_file_id",
  "submitted_by_email": "jane@example.com",
  "submitted_date": "2026-04-20T14:30:00Z",
  "status": "submitted|gea_pending|rso_rejected|verified|approved|rejected|rso_link_expired|clarification_requested",
  "is_current": true,
  "disabled_date": null,
  "rso_approval_link_token": "secure_token_hash",
  "rso_approval_link_expires_at": "2026-05-04T14:30:00Z",
  "rso_approval_link_used_at": "2026-04-21T10:00:00Z",
  "rso_approval_link_sent_date": "2026-04-20T15:00:00Z",
  "rso_reviewed_by": "rso@embassy.gov",
  "rso_review_date": "2026-04-21T10:00:00Z",
  "gea_reviewed_by": "board@example.com",
  "gea_review_date": "2026-04-22T09:00:00Z",
  "rejection_reason": null,
  "clarification_requested_by": null,
  "clarification_request_date": null,
  "clarification_request_details": null,
  "cloud_storage_path": "gs://gea-member-data/HSH-2026-00001/IND-2026-00001/photo_FSB-2026-00003.jpg",
  "notes": "Passport verified",
  "created_at": "2026-04-20T14:30:00Z",
  "updated_at": "2026-04-22T09:00:00Z"
}
```

**Removed Fields:**
- (None — all fields actively used)

**Migration Notes:**
- Subcollection under `individuals/{id}/file_submissions` for clean relationship
- Index on `status`, `is_current`, `document_type`
- RSO approval workflow: Store token hash (never plaintext)

---

### 8. `payments` Collection

**Purpose:** Payment transactions  
**Document ID:** Use `payment_id`

```json
{
  "payment_id": "PAY-2026-00001",
  "household_id": "HSH-2026-00001",
  "household_name": "Johnson Family",
  "payment_date": "2026-04-15",
  "payment_method": "Bank Transfer|Cash|Check|Credit Card|PayPal|Zelle",
  "currency": "USD|BWP",
  "amount": 500.00,
  "amount_usd": 500.00,
  "amount_bwp": 6700.00,
  "payment_type": "Dues Payment|Late Fee|Donation",
  "applied_to_period": "2026-01",
  "payment_reference": "Bank ref 12345",
  "payment_confirmation_file_id": "google_drive_file_id",
  "payment_submitted_date": "2026-04-01T10:30:00Z",
  "payment_verified_date": "2026-04-05T09:00:00Z",
  "payment_verified_by": "board@example.com",
  "notes": "Annual dues",
  "created_at": "2026-04-01T10:30:00Z",
  "updated_at": "2026-04-05T09:00:00Z"
}
```

**Removed Fields:**
- (None — all fields actively used)

**Migration Notes:**
- Index on `household_id`, `payment_date`, `payment_verified_date`
- Financial audit trail: Keep all timestamps and verification metadata
- Query strategy: List payments by household, by date range, by verification status

---

### 9. `applications` Collection

**Purpose:** Membership applications  
**Document ID:** Use `application_id`

```json
{
  "application_id": "APP-2026-00001",
  "household_id": "HSH-2026-00001",
  "primary_individual_id": "IND-2026-00001",
  "primary_applicant_name": "Jane Johnson",
  "primary_applicant_email": "jane@example.com",
  "country_code_primary": "US",
  "phone_primary": "2015551234",
  "phone_primary_whatsapp": false,
  "membership_category": "Full|Affiliate|Associate|Diplomatic|Community|Temporary",
  "household_type": "Individual|Family",
  "employment_job_title": "Vice Consul",
  "employment_posting_date": "2023-06-01",
  "employment_departure_date": "2027-06-01",
  "dues_amount": 500.00,
  "membership_start_date": "2024-01-01",
  "membership_expiration_date": "2026-12-31",
  "sponsor_name": null,
  "sponsor_email": null,
  "sponsor_verified": null,
  "sponsor_verified_date": null,
  "sponsor_verified_by": null,
  "submitted_date": "2024-01-01T10:00:00Z",
  "status": "awaiting_docs|board_initial_review|rso_docs_review|rso_application_review|board_final_review|approved_pending_payment|payment_submitted|activated|denied|withdrawn",
  "documents_confirmed_date": "2024-01-05T14:30:00Z",
  "board_initial_status": "approved|denied|pending",
  "board_initial_reviewed_by": "board@example.com",
  "board_initial_review_date": "2024-01-10T09:00:00Z",
  "board_initial_notes": "Approved for RSO review",
  "board_initial_denial_reason": null,
  "rso_status": "approved|denied|pending",
  "rso_reviewed_by": "rso@embassy.gov",
  "rso_review_date": "2024-01-15T10:00:00Z",
  "rso_private_notes": "All documents verified",
  "board_final_status": "approved|denied|pending",
  "board_final_reviewed_by": "board@example.com",
  "board_final_review_date": "2024-01-20T09:00:00Z",
  "board_final_denial_reason": null,
  "payment_status": "pending|submitted|verified",
  "payment_id": "PAY-2026-00001",
  "notes": "Embassy applicant",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2026-04-23T10:30:00Z"
}
```

**Removed Fields:**
- (None — all fields actively used)

**Migration Notes:**
- Index on `status`, `membership_category`, `household_id`
- Multi-stage workflow: Track all review stages with timestamps
- Payment linkage: Reference to `payments` collection

---

### 10. `membership_levels` Collection

**Purpose:** Membership type reference data  
**Document ID:** Use `level_id`

```json
{
  "level_id": "full_family",
  "level_name": "Full Membership (Family)",
  "membership_category": "Full",
  "household_type": "Family",
  "annual_dues_usd": 500.00,
  "annual_dues_bwp": 6700.00,
  "voting_rights": true,
  "office_eligible": true,
  "max_duration_months": null,
  "eligibility_criteria": "US Embassy staff with valid visa",
  "active": true,
  "created_at": "2024-01-01T08:00:00Z",
  "updated_at": "2026-04-23T10:30:00Z"
}
```

**Removed Fields:**
- `monthly_dues_usd` (future billing, unused)
- `monthly_dues_bwp` (future billing, unused)

**Migration Notes:**
- Static reference data — can be cached at runtime
- Index on `membership_category`, `household_type`

---

### 11. `config` Document

**Purpose:** System configuration and business rules  
**Document ID:** Single document `config`

```json
{
  "config": {
    "youth_document_required": false,
    "passport_warning_months": 6,
    "max_temporary_months": 6,
    "tennis_weekly_limit": 3,
    "tennis_session_max_hours": 2,
    "tennis_bump_window_days": 1,
    "leobo_monthly_limit": 1,
    "leobo_max_hours": 6,
    "leobo_bump_window_days": 5,
    "guest_list_deadline_business_days": 4,
    "age_unaccompanied_access": 15,
    "age_fitness_center": 15,
    "age_voting": 16,
    "age_office_eligible": 16,
    "age_document_required": 16,
    "file_submission_retention_days": 90,
    "photo_file_size_max_mb": 5,
    "document_file_size_max_mb": 10,
    "cloud_storage_bucket": "gea-member-data",
    "rso_approval_link_expiry_hours": 336,
    "exchange_rate_default": 13.4,
    "exchange_rate_usd_to_bwp": 13.45,
    "exchange_rate_last_updated": "2026-04-23T02:00:00Z"
  }
}
```

**Removed Fields:**
- (None — all fields actively used)

**Migration Notes:**
- Single document for all config (use as cache in memory)
- Update timestamp for exchange rate tracking
- Read-only access for app; board-only write access

---

### 12. `audit_logs` Collection

**Purpose:** Compliance audit trail  
**Document ID:** Auto-generated (use Firestore server timestamp)

```json
{
  "log_id": "LOG-2026-00001",
  "timestamp": "2026-04-23T10:30:00Z",
  "user_email": "jane@example.com",
  "action_type": "LOGIN|LOGOUT|LOGIN_FAILED|MEMBER_UPDATED|PASSWORD_SET|RESERVATION_CREATED|PAYMENT_RECORDED|FILE_SUBMISSION_CREATED|FILE_SUBMISSION_RSO_APPROVED|FILE_SUBMISSION_RSO_REJECTED|FILE_SUBMISSION_GEA_APPROVED|FILE_SUBMISSION_GEA_REJECTED|FILE_SUBMISSION_VERIFIED|APPLICATION_SUBMITTED|APPLICATION_APPROVED|APPLICATION_ACTIVATED",
  "target_type": "Individual|Household|Reservation|Payment|FileSubmission|Application",
  "target_id": "IND-2026-00001|HSH-2026-00001|RES-2026-00001|...",
  "details": "Updated phone_primary → 71825225",
  "ip_address": "192.168.1.1",
  "created_at": "2026-04-23T10:30:00Z"
}
```

**Removed Fields:**
- (None — all fields actively used)

**Migration Notes:**
- Append-only collection (no updates)
- Index on `user_email`, `action_type`, `timestamp`
- TTL policy: Archive logs > 1 year to separate collection (optional)

---

## Part D: Data Size Estimates

Based on current system load:

| Collection | Est. Documents | Avg Size | Total |
|-----------|---------------|----------|-------|
| `households` | 150 | 1.2 KB | 180 KB |
| `individuals` | 350 | 2.0 KB | 700 KB |
| `sessions` | 50 (active) | 0.5 KB | 25 KB |
| `reservations` | 5,000 | 1.5 KB | 7.5 MB |
| `guest_lists` | 10,000 | 0.8 KB | 8 MB |
| `file_submissions` | 1,200 | 1.2 KB | 1.4 MB |
| `payments` | 2,000 | 1.0 KB | 2 MB |
| `applications` | 300 | 2.5 KB | 750 KB |
| `administrators` | 15 | 0.6 KB | 9 KB |
| `membership_levels` | 11 | 0.7 KB | 7.7 KB |
| `audit_logs` | 50,000 | 0.5 KB | 25 MB |
| `config` | 1 | 1.2 KB | 1.2 KB |
| | | **TOTAL** | **~47 MB** |

**Firestore Cost Analysis (US pricing, April 2026):**
- Reads: ~100K reads/day → ~$0.06/day
- Writes: ~10K writes/day → $0.12/day
- Storage: ~47 MB → ~$0.01/month
- **Total: ~$2-3/month** (minimal cost)

---

## Part E: Migration Sequence & Timeline

### Week 1: Setup & Phase 1 (Sessions)
- Day 1: Create Firestore project, indexes, security rules
- Day 2-3: Implement `FirestoreAuthService` (Sessions + Administrators)
- Day 4: Test authentication with Firestore backend
- Day 5: Deploy to @HEAD, monitor for issues

### Week 2: Phase 2-3 (Reservations + Guest Lists)
- Day 1-2: Implement `FirestoreReservationService`
- Day 3-4: Hybrid mode testing (Firestore reservations, Sheets households/individuals)
- Day 5: Deploy and monitor

### Week 3: Phase 4-5 (Files + Payments)
- Day 1-2: Implement `FirestoreFileService` + `FirestorePaymentService`
- Day 3-4: Integration testing
- Day 5: Deploy

### Week 4: Phase 6 (Members)
- Day 1-3: Implement `FirestoreMemberService` (critical — all lookups depend on this)
- Day 4: Full integration testing
- Day 5: Cutover to Firestore for member queries

### Week 5: Phase 7-8 (Applications + Utilities)
- Day 1-2: Implement `FirestoreApplicationService`
- Day 3: Migrate Configuration + Audit Logging
- Day 4: Full system validation
- Day 5: Final checks, cleanup

### Week 6: Validation & Sheets Deprecation
- Days 1-3: Full regression testing, data validation
- Days 4-5: Archive Sheets, cleanup credentials, finalize documentation

**Total Timeline:** 4-6 weeks (depending on team size and testing thoroughness)

---

## Part F: Risk Mitigation

### During Hybrid Mode (Sheets + Firestore)
- Keep Sheets as read-only backup during transition
- Run nightly validation jobs: Compare Sheets data with Firestore (until cutover)
- Test rollback procedures before cutover
- Have Sheets data export ready for emergency restoration

### Security Considerations
- Session tokens: Store as hashes in Firestore (same as Sheets)
- Constant-time comparison: Maintain in all credential checks
- Audit logging: Every operation logged to Firestore `audit_logs`
- Access control: Firestore security rules enforce role-based access

### Data Loss Prevention
- Nightly backups of Firestore to Cloud Storage
- Archive Sheets (read-only) after cutover for 90 days minimum
- Immutable audit log for forensics

---

## Summary: What Stays, What Goes

### Removed (Unused Fields)
- 6 secondary phone variants from Households
- 6 secondary phone variants from Individuals
- `monthly_dues_usd` / `monthly_dues_bwp` from Membership Levels

**Total:** ~13 field columns removed from schema

### Firestore Schema Benefits
1. **Cleaner schema:** Remove unused fields immediately
2. **Better performance:** Native Firestore queries vs. Sheets API
3. **Subcollections:** Clean 1:N relationships (Guest Lists under Reservations, etc.)
4. **Direct access:** Firestore console for debugging (huge QA/ops improvement)
5. **Security:** Proper access controls, audit trails, encryption at rest
6. **Cost-effective:** ~$2-3/month for full system

---

**Next Step:** Review Part C collection designs. Any changes needed before implementation?
