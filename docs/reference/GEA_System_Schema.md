# GEA Management System - Complete Database Schema

**Last Updated:** April 24, 2026  
**System Version:** Current Production (with extended fields and new tabs)

---

## Overview

The GEA Management System is built on Google Sheets with a Google Apps Script backend. The system manages member directory, reservations, payments, sessions, and administrative functions for the Gaborone Employee Association.

**Core Spreadsheets:**
- GEA Member Directory (5 tabs)
- GEA Reservations (4 tabs)
- GEA System Backend (6 tabs)
- GEA Payment Tracking (3 tabs)

**Total Sheets:** 18 tabs across 4 spreadsheets

---

## 1. MEMBER DIRECTORY

### 1.1 Households Sheet

Represents a household unit (individual or family). The primary organizational unit for membership, dues, and reservations.

**37 Columns:**

| Field | Type | Purpose |
|-------|------|---------|
| `household_id` | Text | Unique ID (format: HSH-YYYY-XXXXX); primary key |
| `primary_member_id` | Text | FK to Individuals; household head |
| `household_name` | Text | Display name (usually family surname) |
| `household_type` | Enum | Individual \| Family |
| `membership_category` | Text | Full \| Associate \| Affiliate \| Diplomatic \| Community \| Temporary |
| `membership_level_id` | Text | FK to Membership Levels (defines dues, voting, office eligibility) |
| `membership_duration_months` | Number | For Temporary: 1-6 months |
| `membership_start_date` | Date | When membership begins |
| `membership_expiration_date` | Date | Auto-renewal needed if exceeded (typically July 31 annually) |
| `membership_status` | Enum | **Applicant** \| **Member** \| **Lapsed** \| **Resigned** \| **Expelled** (routing flag for Portal.html) |
| `dues_amount` | Number | Annual dues in USD (from Membership Levels or Membership Pricing) |
| `dues_paid_amount` | Number | Cumulative paid to date (USD) |
| `dues_last_payment_date` | Date | Most recent payment received |
| `balance_due` | Number | Calculated: dues_amount - dues_paid_amount |
| `address_street` | Text | Street address |
| `address_city` | Text | City (usually Gaborone) |
| `address_country` | Text | Country (usually Botswana) |
| `country_code_primary` | Text | Country code for primary phone (e.g., BW, US) |
| `phone_primary` | Text | Primary phone (no country code) |
| `phone_primary_whatsapp` | Boolean | Primary phone supports WhatsApp |
| `active` | Boolean | Membership is current/active/not expired |
| `application_date` | Date | When application submitted (if applicant) |
| `approved_by` | Email | Board member who approved membership |
| `approved_date` | Date | Approval timestamp |
| `denial_reason` | Text | If membership was denied |
| `lapsed_date` | Date | When membership expired and became lapsed (NEW) |
| `termination_date` | Date | When membership was terminated (resigned/expelled) (NEW) |
| `termination_reason` | Text | Reason for resignation/expulsion (NEW) |
| `sponsor_name` | Text | Sponsor name (required for non-Full members) |
| `sponsor_email` | Email | Sponsor email (for verification) |
| `sponsor_verified` | Boolean | Sponsor eligibility confirmed |
| `sponsor_verified_date` | Date | Date sponsor was verified |
| `sponsor_verified_by` | Email | Board member who verified sponsor |
| `sponsor_notes` | Text | Sponsorship tracking notes |
| `created_date` | Date | Record creation timestamp |
| `last_modified_date` | Date | Last update timestamp |
| `notes` | Text | Internal notes |

**Key Relationships:**
- 1:N with Individuals (one household has many members)
- 1:1 with Membership Levels (via membership_level_id)
- 1:N with Reservations (household can book multiple times)
- 1:N with Payments (household submits multiple payments)
- 1:N with File Submissions (household members upload documents)

**Critical Fields for Application Logic:**
- `membership_status`: Routes Portal.html display (Applicant → read-only; Member → full access; Lapsed → renewal needed)
- `membership_expiration_date`: Triggers renewal warnings (30-day, 7-day before July 31)
- `sponsor_verified`: Required before payment submission for non-Full categories

---

### 1.2 Individuals Sheet

Represents a single person within a household. Records authentication details, document status, and role information.

**58 Columns:**

| Field | Type | Purpose |
|-------|------|---------|
| `individual_id` | Text | Unique ID (format: IND-YYYY-XXXXX); primary key |
| `household_id` | Text | FK to Households |
| `first_name` | Text | Given name |
| `last_name` | Text | Family name |
| `date_of_birth` | Date | Birthdate (YYYY-MM-DD); used for age calculations |
| `age_category` | Enum | Adult \| Youth (16-17) \| Child (<16); derived from DOB |
| `relationship_to_primary` | Enum | Primary \| Spouse \| Child \| Staff (relationship to household head) |
| `email` | Email | Primary email (used for authentication) |
| `citizenship_country` | Text | Country of citizenship |
| `us_citizen` | Boolean | US citizen or resident alien status |
| **CONTACT INFORMATION** |
| `country_code_primary` | Text | Country code for primary phone |
| `phone_primary` | Text | Primary phone (no country code) |
| `phone_primary_whatsapp` | Boolean | Primary phone has WhatsApp |
| `country_code_secondary` | Text | Country code for secondary phone |
| `phone_secondary` | Text | Secondary phone (no country code) |
| `phone_secondary_whatsapp` | Boolean | Secondary phone has WhatsApp |
| `email_primary` | Email | Primary email (same as email field) (NEW) |
| `email_secondary` | Email | Secondary email address (NEW) |
| **EMERGENCY CONTACT** |
| `emergency_contact_name` | Text | Emergency contact person name |
| `country_code_emergency` | Text | Country code for emergency phone |
| `phone_emergency` | Text | Emergency contact phone |
| `phone_emergency_whatsapp` | Boolean | Emergency contact has WhatsApp |
| `emergency_contact_relationship` | Text | Relationship to member |
| `emergency_contact_email` | Email | Emergency contact email |
| **DOCUMENT REFERENCES** |
| `current_passport_submission_id` | Text | FK to File Submissions (current approved passport) |
| `current_omang_submission_id` | Text | FK to File Submissions (current approved Omang/ID) |
| `current_photo_submission_id` | Text | FK to File Submissions (current approved photo) |
| **DOCUMENT STATUS** |
| `passport_status` | Enum | none \| submitted \| rso_approved \| rso_rejected \| gea_pending \| gea_rejected \| verified |
| `passport_expiration_date` | Date | Expiration date from current submission |
| `passport_expiration_warning_sent` | Boolean | 6-month warning sent |
| `passport_expiration_warning_date` | Date | When warning was sent |
| `omang_status` | Enum | none \| submitted \| rso_approved \| rso_rejected \| gea_pending \| gea_rejected \| verified |
| `omang_expiration_date` | Date | Expiration date from current submission |
| `omang_expiration_warning_sent` | Boolean | 6-month warning sent |
| `omang_expiration_warning_date` | Date | When warning was sent |
| `photo_status` | Enum | none \| submitted \| approved \| rejected |
| `photo_approved_by` | Email | GEA admin who approved photo (NEW) |
| `photo_approved_date` | Date | Photo approval timestamp (NEW) |
| **EMPLOYMENT** |
| `employment_office` | Text | USG office (e.g., "Embassy Gaborone") |
| `employment_job_title` | Text | Job title |
| `employment_start_date` | Date | Employment start date (NEW) |
| `employment_end_date` | Date | Expected/actual departure date (NEW) |
| `employment_verification_file_id` | Text | Google Drive file ID for employment letter |
| **LOCATION & ACCESS** |
| `arrival_date` | Date | Arrival in Botswana |
| `departure_date` | Date | Expected/actual departure |
| `can_access_unaccompanied` | Boolean | Access recreational facilities without guardian (age-based) |
| **ELIGIBILITY & PERMISSIONS** |
| `voting_eligible` | Boolean | Can vote in association elections (age 16+) |
| `fitness_center_eligible` | Boolean | Can use fitness center (derived from age) |
| `office_eligible` | Boolean | Can hold board office (age 16+) |
| `staff_rso_cleared` | Boolean | RSO clearance for staff employment |
| `staff_rso_clearance_date` | Date | RSO clearance date |
| **ACCOUNT & SECURITY** |
| `password_hash` | Text | SHA256 hash of password (never stored plain-text) |
| `password_changed_on_date` | Date | Last password change (NEW) |
| `first_login_date` | Date | First portal login (triggers welcome email) |
| `last_login_date` | Date | Most recent login |
| **AUDIT** |
| `active` | Boolean | Record is current/active |
| `created_date` | Date | Record creation timestamp |
| `last_modified_date` | Date | Last update timestamp |

**Key Relationships:**
- N:1 with Households (many individuals per household)
- 1:N with Sessions (one person can have multiple active sessions)
- 1:N with Audit Log entries

**Calculated/Derived Fields:**
- `age_category` - Derived from date_of_birth
- `fitness_center_eligible` - Derived from age (age >= configuration.age_fitness_center)
- `office_eligible` - Derived from age (age >= configuration.age_office_eligible)
- `voting_eligible` - Derived from age and membership type

---

### 1.3 File Submissions Sheet

Tracks all document and photo uploads with complete approval workflow history. Supports 2-tier approval (RSO → GEA) for documents, 1-tier (GEA admin) for photos.

**26 Columns:**

| Field | Type | Purpose |
|-------|------|---------|
| `submission_id` | Text | Unique ID (format: FSB-YYYY-XXXXX); primary key |
| `individual_id` | Text | FK to Individuals |
| `application_id` | Text | FK to Membership Applications (if applicant submission) (NEW) |
| `document_type` | Enum | passport \| omang \| photo \| employment |
| `submission_type` | Enum | (NEW) Tracks submission context (document, photo, employment) |
| `file_id` | Text | Google Drive file ID (original upload) |
| `file_display_name` | Text | Display name/filename (NEW) |
| `file_size_bytes` | Number | File size in bytes (NEW) |
| `upload_device_type` | Text | Device used for upload (mobile, desktop, etc.) (NEW) |
| `submitted_by_email` | Email | Member's email (uploader) |
| `submitted_date` | DateTime | Upload timestamp |
| **APPROVAL WORKFLOW** |
| `status` | Enum | submitted \| rso_approved \| rso_rejected \| gea_pending \| gea_rejected \| verified \| approved \| rejected |
| `rso_reviewed_by` | Email | RSO email who reviewed (documents only) |
| `rso_review_date` | DateTime | RSO review timestamp |
| `gea_reviewed_by` | Email | GEA admin email who reviewed |
| `gea_review_date` | DateTime | GEA admin review timestamp |
| **REJECTIONS & FEEDBACK** |
| `rejection_reason` | Text | Internal reason for rejection (any stage) |
| `member_facing_rejection_reason` | Text | User-friendly rejection message (NEW) |
| `allow_resubmit` | Boolean | Member can resubmit after rejection (NEW) |
| **DOCUMENT EXPIRATION** |
| `document_expiration_date` | Date | Passport/Omang expiration (NEW) |
| `expiration_warning_6m_sent_date` | Date | When 6-month warning sent (NEW) |
| `expiration_warning_1m_sent_date` | Date | When 1-month warning sent (NEW) |
| **CURRENT & ARCHIVE** |
| `is_current` | Boolean | TRUE = active/approved submission for this type; only one per individual/document_type |
| `disabled_date` | DateTime | When superseded by newer approval |
| **CLOUD STORAGE (photos only)** |
| `cloud_storage_path` | Text | gs://gea-member-data/{household_id}/{individual_id}/photo_{submission_id}.jpg |
| **AUDIT** |
| `notes` | Text | Internal review/audit notes |

**Key Relationships:**
- N:1 with Individuals (many submissions per individual)
- 1:N with File Submission History (audit trail)

**Status Flow:**

**For ID Documents (Passport & Omang):**
1. `submitted` — Member uploaded, awaiting RSO review
2. `rso_approved` — RSO approved via one-time link, awaiting GEA admin
3. `rso_rejected` — RSO rejected; `rejection_reason` recorded, `is_current` = FALSE
4. `gea_pending` — RSO approved, GEA admin reviewing
5. `gea_rejected` — GEA admin rejected; `rejection_reason` recorded, `is_current` = FALSE
6. `verified` — Both RSO and GEA admin approved; `is_current` = TRUE

**For Photos:**
1. `submitted` — Member uploaded, awaiting GEA admin review
2. `gea_pending` — GEA admin reviewing
3. `approved` — GEA admin approved; photo transferred to Cloud Storage, `is_current` = TRUE
4. `rejected` — GEA admin rejected; `rejection_reason` recorded, `is_current` = FALSE

**Automation Rules:**
- When new submission approved and `is_current` = TRUE:
  - Find previous submission with same `document_type` and `is_current` = TRUE
  - Set previous `is_current` = FALSE
  - Record previous `disabled_date` = now
- When member re-uploads after rejection:
  - New submission created with `status` = `submitted`
  - Old rejected submission remains archived with `is_current` = FALSE
- **For photos upon approval:**
  - Duplicate photo from Google Drive (`file_id`) to gea-member-data Cloud Storage
  - Record Cloud Storage path in `cloud_storage_path` (format: `gs://gea-member-data/{household_id}/{individual_id}/photo_{submission_id}.jpg`)
  - Retain original Google Drive copy for audit archive
  - Update Individuals `current_photo_submission_id`
- **For documents (no Cloud Storage):**
  - Documents remain in Google Drive only
  - Retained for security and audit trail

**Data Validation:**
- Only one submission per individual can have `is_current` = TRUE for each document type
- `is_current` can only be TRUE if `status` = `verified` (documents) or `approved` (photos)
- `rejection_reason` must be populated if status is any "rejected" state
- For documents: `status` must progress through RSO before GEA (no jumping to gea_pending without rso_approved)

---

### 1.3 Membership Levels Sheet

Reference table defining membership types and associated attributes.

| Field | Type | Notes |
|-------|------|-------|
| `level_id` | Text | Unique ID (e.g., full_indiv, full_family, affiliate_indiv, etc.) |
| `level_name` | Text | Display name |
| `membership_category` | Enum | Full, Affiliate, Associate, Diplomatic, Community, Temporary |
| `household_type` | Enum | Individual or Family |
| `annual_dues_usd` | Number | Annual dues in USD |
| `annual_dues_bwp` | Number | Annual dues in BWP (Pula) |
| `voting_rights` | Boolean | Can vote in elections (Full members only) |
| `office_eligible` | Boolean | Can hold board position (Full members only) |
| `max_duration_months` | Number | For Temporary: max 6 months |
| `eligibility_criteria` | Text | Description of who can join this category |
| `active` | Boolean | This membership level is available |
| `monthly_dues_usd` | Number | For future monthly billing (not currently used) |
| `monthly_dues_bwp` | Number | For future monthly billing (not currently used) |

**Current Membership Levels:**
- `full_indiv` - Full Membership (Individual)
- `full_family` - Full Membership (Family)
- `affiliate_indiv` - Affiliate (Individual)
- `affiliate_family` - Affiliate (Family)
- `associate_indiv` - Associate (Individual)
- `associate_family` - Associate (Family)
- `diplomatic_indiv` - Diplomatic (Individual)
- `diplomatic_family` - Diplomatic (Family)
- `community_indiv` - Community/Guest (Individual)
- `community_family` - Community/Guest (Family)
- `temporary` - Temporary (6 months max)

---

## 2. RESERVATIONS

### 2.1 Reservations Sheet

Main reservations table for facilities (tennis court, Leobo, etc.).

| Field | Type | Notes |
|-------|------|-------|
| `reservation_id` | Text | Unique ID (auto-generated) |
| `household_id` | Text | FK to Households |
| `submitted_by_individual_id` | Text | FK to Individuals (who made the reservation) |
| `submitted_by_email` | Email | Email of person who submitted |
| `submission_timestamp` | DateTime | When reservation was created |
| `facility` | Enum | Tennis Court, Leobo, Entire Facility, etc. |
| `reservation_date` | Date | Date of the reservation |
| `start_time` | Time | Start time (e.g., "09:00") |
| `end_time` | Time | End time (e.g., "11:00") |
| `duration_hours` | Number | Calculated: hours between start and end |
| `event_name` | Text | Name of event/purpose |
| `guest_count` | Number | Number of non-member guests |
| `guest_list_submitted` | Boolean | Guest list has been provided |
| `guest_list_deadline` | Date | Deadline for submitting guest list (4 business days before) |
| `status` | Enum | Tentative, Confirmed, Cancelled, Bumped, Approved by Board |
| `board_approval_required` | Boolean | Requires board review (large events, etc.) |
| `board_approved_by` | Email | Board member who approved |
| `board_approval_timestamp` | DateTime | When board approved |
| `board_denial_reason` | Text | If board denied |
| `rso_notified_timestamp` | DateTime | When RSO was notified (for guest list) |
| `calendar_event_id` | Text | Google Calendar event ID (for integration) |
| `cancelled_by` | Email | Who cancelled |
| `cancellation_timestamp` | DateTime | When cancelled |
| `cancellation_reason` | Text | Reason for cancellation |
| `notes` | Text | Additional notes |
| `is_excess_reservation` | Boolean | Reservation that exceeds limits (pending approval) |
| `bump_window_deadline` | Date | Last date tentative reservation can be bumped |
| `bumped_by_household_id` | Text | Household that bumped this reservation |
| `bumped_date` | Date | Date bumped |

**Key Relationships:**
- N:1 with Households
- N:1 with Individuals (submitted_by)
- 1:N with Guest Lists

**Business Rules:**
- Tennis: Max 3 hours/week per household, 2 hours/session
- Leobo: Max 1 reservation/month per household, max 6 hours/reservation
- Guest lists due 4 business days before event
- Tentative reservations can be bumped within window (1 day for tennis, 5 days for Leobo)

---

### 2.2 Guest Lists Sheet

Attendees for each reservation. RSO reviews for event coordination before approval.

**15 Columns:**

| Field | Type | Purpose |
|-------|------|---------|
| `guest_list_id` | Text | Unique ID; primary key |
| `reservation_id` | Text | FK to Reservations |
| `household_id` | Text | FK to Households |
| `household_name` | Text | Household display name |
| `primary_email` | Email | Household primary email |
| `facility` | Enum | Tennis, Leobo, etc. |
| `event_date` | Date | Event date |
| `guests_json` | JSON | Guest details (name, relationship, age) |
| `guest_count` | Number | Total non-member guests |
| `submitted_date` | DateTime | Submission timestamp |
| `submission_status` | Enum | submitted \| rso_approved \| rso_rejected \| finalized |
| `rso_reviewed_by` | Email | RSO reviewer |
| `rso_review_date` | DateTime | Review timestamp |
| `rso_draft_json` | JSON | RSO draft/notes on guests |
| `last_modified_date` | DateTime | Last update |

---

### 2.3 Guest Profiles Sheet

Reusable guest registry. Enables quick guest list creation without re-entering details. (NEW - was missing from docs)

**8 Columns:**

| Field | Type | Purpose |
|-------|------|---------|
| `guest_profile_id` | Text | Unique ID; primary key |
| `household_id` | Text | FK to Households (household that created profile) |
| `first_name` | Text | Guest first name |
| `last_name` | Text | Guest last name |
| `id_number` | Text | Guest ID number (passport, Omang, etc.) |
| `age_group` | Enum | Child \| Youth \| Adult |
| `created_date` | DateTime | Profile creation timestamp |
| `last_used_date` | DateTime | Most recent use in guest list |

---

### 2.4 Usage Tracking Sheet

Weekly/monthly usage limits for each household. Reset nightly via `NotificationService.runNightlyTasks()`.

**7 Columns:**

| Field | Type | Purpose |
|-------|------|---------|
| `household_id` | Text | FK to Households; primary key |
| `household_name` | Text | Household display name |
| `week_start_date` | Date | Monday of current tracking week |
| `tennis_hours_this_week` | Number | Hours booked this week (resets Monday) |
| `month_start_date` | Date | 1st of current tracking month |
| `leobo_reservations_this_month` | Number | Count of Leobo bookings this month (resets 1st) |
| `last_calculated` | DateTime | Last nightly reset timestamp |

---

## 3. PAYMENT TRACKING

### 3.1 Payments Sheet

Member dues payments with verification workflow. Treasurer reviews, approves/rejects/requests clarification.

**25 Columns:**

| Field | Type | Purpose |
|-------|------|---------|
| `payment_id` | Text | Unique ID (format: PAY-YYYY-XXXXX); primary key |
| `household_id` | Text | FK to Households |
| `household_name` | Text | Household display name |
| **SUBMISSION** |
| `payment_submitted_date` | DateTime | When member submitted proof |
| `payment_date` | Date | Date of actual payment (from receipt) |
| `payment_method` | Enum | PayPal \| SDFCU_Member_to_Member \| Zelle \| Absa \| Other |
| **AMOUNTS** |
| `currency` | Enum | USD \| BWP |
| `amount` | Number | Amount submitted (in original currency) |
| `amount_usd` | Number | Converted to USD (if submitted in BWP) |
| `amount_bwp` | Number | Converted to BWP (if submitted in USD) |
| `actual_amount_received` | Number | Confirmed received amount |
| `actual_amount_usd` | Number | Converted actual amount (USD) |
| `actual_amount_bwp` | Number | Converted actual amount (BWP) |
| **TRACKING** |
| `payment_type` | Enum | regular_dues \| late_payment \| partial_payment \| pro_rated |
| `applied_to_period` | Text | Membership year applied to (e.g., "2025-26") |
| `balance_due_amount` | Number | Remaining balance after this payment |
| **VERIFICATION** |
| `payment_status` | Enum | submitted \| verified \| rejected \| clarification_requested |
| `payment_verified_date` | DateTime | When treasurer verified |
| `payment_verified_by` | Email | Treasurer email |
| `verification_notes` | Text | Verification or rejection notes |
| **REFERENCES** |
| `payment_reference` | Text | Reference number (receipt #, transaction ID) |
| `payment_confirmation_file_id` | Text | Google Drive file ID (receipt/screenshot) |
| `journal_entry_id` | Text | Accounting system reference |
| **AUDIT** |
| `recorded_by` | Email | Person who entered payment |
| `notes` | Text | Internal notes |

**Verification Workflow:**
1. Member submits proof → `status=submitted`
2. Treasurer approves → `status=verified`, payment credited
3. Treasurer rejects → `status=rejected`, member notified
4. Treasurer requests clarification → `status=clarification_requested`

---

### 3.2 Membership Pricing Sheet

Membership year dues setup. One row per level per year. Referenced for pro-ration calculations.

**5 Columns:**

| Field | Type | Purpose |
|-------|------|---------|
| `membership_year` | Text | Year (e.g., "2025-26"); with membership_level_id forms composite key |
| `membership_level_id` | Text | FK to Membership Levels |
| `annual_dues_usd` | Number | Annual dues in USD for this year/level |
| `active_for_payment` | Boolean | This level available for new payments |
| `notes` | Text | Notes (e.g., "Updated Jan 2026") |

**Purpose:** Separates static membership level definitions from dynamic annual pricing. Allows dues to change year-to-year without modifying Membership Levels table.

---

### 3.3 Rates Sheet

Exchange rate history (USD ↔ BWP). Updated nightly via `NotificationService.runNightlyTasks()` from open.er-api.com.

**5 Columns:**

| Field | Type | Purpose |
|-------|------|---------|
| `rate_date` | Date | Date of rate; primary key (unique per day) |
| `usd_to_bwp` | Number | Exchange rate (1 USD = X BWP) |
| `is_sunday_rate` | Boolean | Special weekend rate (if applicable) |
| `timestamp` | DateTime | When rate was fetched |
| `source` | Text | API source (open.er-api.com) |

**Usage:** Payment submission uses most recent rate for USD ↔ BWP conversion.

---

## 4. SYSTEM BACKEND

### 4.1 Configuration Sheet

System-wide settings and business rule thresholds.

| Field | Type | Notes |
|-------|------|-------|
| `config_key` | Text | Setting name |
| `config_value` | Text | Setting value |
| `description` | Text | What this setting controls |
| `last_modified` | DateTime | When last changed |

**Current Configuration:**

| Key | Value | Purpose |
|-----|-------|---------|
| `youth_document_required` | FALSE | Require ID for members under 16 |
| `passport_warning_months` | 6 | Months before document expiration to warn |
| `document_types_botswana` | Omang, Passport | Accepted ID types for BW citizens |
| `max_temporary_months` | 6 | Max duration for temporary membership |
| `tennis_weekly_limit` | 3 | Max hours/week per household |
| `tennis_session_max_hours` | 2 | Max hours per single session |
| `tennis_walkin_available` | TRUE | Allow walk-ups when not reserved |
| `tennis_bump_window_days` | 1 | Days before event can bump tentative |
| `leobo_monthly_limit` | 1 | Max reservations/month per household |
| `leobo_max_hours` | 6 | Max hours per Leobo reservation |
| `leobo_bump_window_days` | 5 | Business days before event can bump |
| `guest_list_deadline_business_days` | 4 | Business days to submit guest list |
| `age_unaccompanied_access` | 15 | Min age for unaccompanied facility access |
| `age_fitness_center` | 15 | Min age for fitness center use |
| `age_voting` | 16 | Min age to vote |
| `age_office_eligible` | 16 | Min age for board position |
| `age_document_required` | 16 | Min age requiring document upload |
| `file_submission_retention_days` | 90 | Days to retain rejected submissions before archive |
| `photo_file_size_max_mb` | 5 | Maximum photo file size in MB |
| `document_file_size_max_mb` | 10 | Maximum document scan file size in MB |
| `cloud_storage_bucket` | gea-member-data | GCS bucket for approved member photos |
| `rso_approval_link_expiry_hours` | 336 | Hours RSO approval link remains active (14 days) |

---

### 4.3 Sessions Sheet

Active user sessions. Token-based authentication with 24-hour timeout (sliding window). Purged nightly via `NotificationService.runNightlyTasks()`.

**8 Columns:**

| Field | Type | Purpose |
|-------|------|---------|
| `session_id` | Text | Unique ID; primary key |
| `token` | Text | Plain-text session token (used by frontend; NEVER returned in responses after creation) |
| `token_hash` | Text | SHA256 hash of token (used for lookup & validation) |
| `email` | Email | User email (member or admin) |
| `role` | Enum | member \| board \| mgt \| rso_approve \| rso_notify \| applicant |
| `created_at` | DateTime | Session creation timestamp |
| `expires_at` | DateTime | Token expiration (24 hours from creation) |
| `active` | Boolean | Session is valid (FALSE after logout or expiration) |

**Security Notes:**
- Token generated with entropy (Utilities.getUuid() + timestamp + entropy)
- Token hashed immediately, plain-text never persisted
- Lookup always uses token_hash
- Token comparison uses constant-time comparison (prevents timing attacks)

---

### 4.4 Administrators Sheet

Admin and RSO accounts. Managed by board members only. Roles determine portal access.

**12 Columns:**

| Field | Type | Purpose |
|-------|------|---------|
| `admin_id` | Text | Unique ID; primary key |
| `email` | Email | Login email (unique); primary lookup key |
| `first_name` | Text | First name |
| `last_name` | Text | Last name |
| `role` | Enum | board \| mgt \| rso_approve \| rso_notify |
| `password_hash` | Text | SHA256 hash of password |
| `active` | Boolean | Account is active |
| `created_by` | Email | Board member who created account |
| `created_date` | DateTime | Account creation timestamp |
| `deactivated_by` | Email | Board member who deactivated (if applicable) |
| `deactivated_date` | DateTime | Deactivation timestamp |
| `first_login_date` | DateTime | First portal login |

**Roles:**
- `board` — Full admin: approvals, payments, membership, users
- `mgt` — Management Officer: Leobo approvals only
- `rso_approve` — Documents & guest list reviewer
- `rso_notify` — Read-only event coordinator

---

### 4.5 Audit Log Sheet

Compliance trail. Every significant action logged. 1000+ rows, indexed by timestamp/action_type/user.

**8 Columns:**

| Field | Type | Purpose |
|-------|------|---------|
| `log_id` | Text | Unique ID; primary key |
| `timestamp` | DateTime | Action timestamp |
| `user_email` | Email | User who performed action |
| `action_type` | Enum | login \| approve_application \| submit_payment \| upload_document \| etc. |
| `target_type` | Enum | membership \| payment \| document \| reservation \| etc. |
| `target_id` | Text | ID of object affected (household_id, payment_id, etc.) |
| `details` | Text | Action summary (e.g., "Approved by John Doe, reason: complete documents") |
| `ip_address` | Text | User's IP address (for security tracking) |

---

### 4.6 Holiday Calendar Sheet

US Federal and Botswana public holidays; used for business day calculations (bumping deadlines, nightly task timing).

**9 Columns:**

| Field | Type | Purpose |
|-------|------|---------|
| `holiday_id` | Text | Unique ID; primary key |
| `holiday_date` | Date | Date of holiday |
| `holiday_name` | Text | Holiday name (e.g., "Independence Day", "Botswana Day") |
| `holiday_type` | Enum | US_Federal \| Botswana_Public \| Association_Special |
| `holiday_year` | Number | Year (YYYY) |
| `notes` | Text | Notes (observed date if different, etc.) |
| `active` | Boolean | Holiday is recognized in system |
| `created_by` | Email | Board member who created entry |
| `created_date` | DateTime | Entry creation timestamp |

---

### 4.2 Email Templates Sheet

114 notification templates across 6 categories. Metadata stored here; body text in Google Drive files.

**8 Columns:**

| Field | Type | Purpose |
|-------|------|---------|
| `semantic_name` | Text | Template ID (e.g., MEM_APPLICATION_RECEIVED_TO_APPLICANT); primary key |
| `display_name` | Text | Human-readable name (e.g., "Application Received - Applicant Notification") |
| `subject` | Text | Email subject line |
| `drive_file_id` | Text | Google Drive file ID containing body text |
| `placeholders` | Text | Comma-separated template variables (e.g., {{APPLICANT_NAME}}, {{DUES_AMOUNT}}) |
| `active` | Boolean | Template is enabled |
| `notes` | Text | Internal notes on usage, conditions, etc. |
| `` | (empty) | Trailing column |

**Template Categories (114 total):**
- ADM (6) — Admin workflow templates
- DOC (18) — Document submission templates
- MEM (26) — Membership templates
- PAY (14) — Payment templates
- RES (25) — Reservation templates
- SYS (25) — System templates

See [EMAIL_TEMPLATES_REFERENCE.md](EMAIL_TEMPLATES_REFERENCE.md) for the full list.

**Template Variables:**
- `{{FIRST_NAME}}` - First name
- `{{FULL_NAME}}` - Full name
- `{{MEMBERSHIP_LEVEL}}` - Level name
- `{{HOUSEHOLD_TYPE}}` - Individual or Family
- `{{FAMILY_MEMBERS_LIST}}` - Formatted list of family
- `{{DURATION_MONTHS}}` - For temporary memberships
- `{{DUES_AMOUNT}}` - Annual or period dues
- `{{SPONSOR_NAME}}` - Non-full member sponsor
- `{{IF_FAMILY}}...{{END_IF}}` - Conditional block for families
- `{{IF_TEMPORARY}}...{{END_IF}}` - Conditional for temporary members
- `{{IF_NON_FULL}}...{{END_IF}}` - Conditional for non-full members

---

### 4.6 Membership Applications Sheet

Tracks membership applications with complete workflow history from submission through approval.

| Field | Type | Notes |
|-------|------|-------|
| `application_id` | Text | Unique ID (format: APP-2026-XXXXX) |
| `household_id` | Text | FK to Households (NULL until approved) |
| `primary_individual_id` | Text | FK to Individuals for primary applicant (set after household/person creation) |
| `primary_applicant_name` | Text | Full name of person applying |
| `primary_applicant_email` | Email | Email address of applicant |
| `country_code_primary` | Text | Two-letter country code for applicant phone (e.g., BW, US) |
| `phone_primary` | Text | Applicant phone number without country code |
| `phone_primary_whatsapp` | Boolean | Whether applicant phone supports WhatsApp |
| `membership_category` | Enum | Full, Affiliate, Associate, Diplomatic, Community, Temporary |
| `household_type` | Enum | Individual, Family |
| `employment_job_title` | Text | Applicant employment role/title |
| `employment_posting_date` | Date | Applicant posting/arrival date |
| `employment_departure_date` | Date | Applicant expected departure date |
| `dues_amount` | Number (USD) | Annual dues amount (from membership level/rules) |
| `membership_start_date` | Date | Set when membership is activated |
| `membership_expiration_date` | Date | Set to membership-year end on activation |
| `sponsor_name` | Text | If non-Full member, who is sponsoring |
| `sponsor_email` | Email | Sponsor's email address |
| `sponsor_verified` | Boolean | Board has verified sponsor eligibility |
| `sponsor_verified_date` | Date | Date sponsor was verified |
| `sponsor_verified_by` | Email | Board member who verified sponsor |
| `submitted_date` | DateTime | When applicant submitted application |
| `status` | Enum | Workflow state (see status flow below) |
| `documents_confirmed_date` | DateTime | Applicant confirmed all documents uploaded |
| `board_initial_status` | Enum | approved, denied, pending |
| `board_initial_reviewed_by` | Email | Board reviewer for initial board stage |
| `board_initial_review_date` | DateTime | Timestamp for initial board decision |
| `board_initial_notes` | Text | Internal notes for initial board stage |
| `board_initial_denial_reason` | Text | Denial reason when board-initial stage denies |
| `rso_status` | Enum | approved, denied, pending |
| `rso_reviewed_by` | Email | RSO reviewer |
| `rso_review_date` | DateTime | Timestamp for RSO decision |
| `rso_private_notes` | Text | RSO-only/internal notes |
| `board_final_status` | Enum | approved, denied, pending |
| `board_final_reviewed_by` | Email | Board reviewer for final stage |
| `board_final_review_date` | DateTime | Timestamp for final board decision |
| `board_final_denial_reason` | Text | Denial reason when board-final stage denies |
| `payment_status` | Enum | pending, submitted, verified |
| `payment_id` | Text | FK to Payments once payment proof is submitted |
| `created_date` | Date | When application record was created in system |
| `last_modified_date` | Date | Last update |
| `notes` | Text | Internal notes |

**Key Relationships:**
- N:1 with Households (many applications, but each links to one household if approved)
- 1:1 with Individuals (primary applicant becomes Primary member in household)

**Status Flow:**

1. `awaiting_docs` — Application submitted; applicant uploads and confirms required documents.
2. `board_initial_review` — Board reviews application and documents; decides whether to forward to RSO.
3. `rso_docs_review` — RSO reviews individual documents (passport, omang, photos, etc).
4. `rso_application_review` — All documents approved by RSO; RSO approves/denies application as a whole.
5. `board_final_review` — Board makes final decision after RSO.
6. `approved_pending_payment` — Applicant approved, awaiting payment submission.
7. `payment_submitted` — Payment proof submitted and pending verification.
8. `activated` — Treasurer verified payment; membership activated.
9. `denied` — Application denied at board-initial or board-final stage.
10. `withdrawn` — Applicant withdrew application.

**Automation Upon Approval:**
- New Household record created with dues, membership dates, and level
- New Individuals record created for primary applicant (email, name from application)
- If sponsorship required: Household sponsor fields populated and marked verified
- Application record updated with household_id (back-reference)
- Audit log entry created

---

## 5. DATA RELATIONSHIPS & REFERENTIAL INTEGRITY

### Primary Key-Foreign Key Relationships

```
Households (household_id)
├─ 1:N → Individuals (household_id FK)
├─ N:1 ← Membership Levels (membership_level_id FK)
├─ 1:N → Reservations (household_id FK)
└─ 1:N → Payments (household_id FK)

Individuals (individual_id)
├─ N:1 ← Households (household_id FK)
├─ 1:N → File Submissions (individual_id FK)
│   ├─ current_passport_submission_id → File Submissions
│   ├─ current_omang_submission_id → File Submissions
│   └─ current_photo_submission_id → File Submissions
├─ 1:N → Sessions (email FK)
└─ 1:N → Audit Log (user_email FK)

File Submissions (submission_id)
├─ N:1 ← Individuals (individual_id FK)
└─ Related to Individuals via document_type (passport/omang/photo)

Reservations (reservation_id)
├─ N:1 ← Households (household_id FK)
├─ N:1 ← Individuals (submitted_by_individual_id FK)
└─ 1:N → Guest Lists (reservation_id FK)

Usage Tracking
└─ N:1 ← Households (household_id FK)

Sessions
└─ N:1 ← Individuals (email FK)

Audit Log
└─ N:1 ← Individuals (user_email FK)
```

---

## 6. CALCULATED/DERIVED FIELDS

| Field | Location | Calculated From | Recalculation |
|-------|----------|-----------------|--------------|
| `balance_due` | Households | dues_amount - dues_paid_amount | On payment recorded |
| `age_category` | Individuals | date_of_birth | Nightly |
| `fitness_center_eligible` | Individuals | DOB vs config.age_fitness_center | Nightly |
| `office_eligible` | Individuals | DOB vs config.age_office_eligible | Nightly |
| `voting_eligible` | Individuals | DOB vs config.age_voting | Nightly |
| `tennis_hours_this_week` | Usage Tracking | Sum of Tennis Court reservations | Nightly (Monday reset) |
| `leobo_reservations_this_month` | Usage Tracking | Count of Leobo reservations | Nightly (1st of month reset) |
| `duration_hours` | Reservations | end_time - start_time | On creation |
| `guest_list_deadline` | Reservations | reservation_date - 4 business days | On creation |
| `bump_window_deadline` | Reservations | Tennis: res_date - 1 day, Leobo: res_date - 5 days | On creation |

---

## 7. DATA VALIDATION RULES

### Individuals
- email: Must be valid email format
- date_of_birth: Cannot be in future; required for children only (extracted from ID documents for adults)
- phone_primary, phone_secondary: Numbers only, 7-12 digits
- document_expiration_date: Cannot be in past if document_type != None

### Households
- dues_amount: Must be > 0 and match membership level
- membership_start_date: Cannot be after membership_expiration_date
- balance_due: Calculated, not editable

### Reservations
- duration_hours: Max 2 (tennis) or 6 (Leobo)
- Tennis: Ensure tennis_hours_this_week + duration_hours <= 3 (config.tennis_weekly_limit)
- Leobo: Ensure leobo_reservations_this_month + 1 <= 1 (config.leobo_monthly_limit)
- start_time < end_time
- reservation_date >= today

### Payments
- amount: Must be > 0
- payment_date: Cannot be in future
- payment_method: Required

---

## 8. NOTES FOR DEVELOPERS

### Data Types Across Google Sheets
- **Text** - Any string content
- **Email** - Text field with email validation
- **Number** - Integer or decimal
- **Date** - YYYY-MM-DD format
- **DateTime** - YYYY-MM-DD HH:MM:SS format
- **Time** - HH:MM format (24-hour)
- **Boolean** - TRUE or FALSE
- **Enum** - Restricted set of values (enforced via data validation)

### Important Field Notes
- All IDs are auto-generated with format PREFIX-YEAR-RANDOMNUMBER
- Dates use ISO 8601 format (YYYY-MM-DD)
- Phone numbers stored separately (country_code + local number) to avoid formatting issues
- Passwords stored as SHA256 hashes (never plain text)
- Session tokens are secure random hashes
- All timestamps are GMT+2 (Botswana time)

### Current Test Data
- Household: HSH-2026-TEST01 (Johnson Family)
- Individual: IND-2026-TEST01 (Jane Johnson), IND-2026-TEST02 (John Johnson)
- Status: Approved, Dues Paid
- **Note:** Delete before production go-live

---

## 9. SPREADSHEET STRUCTURE

Each sheet has:
- **Header row** with column names
- **Data validation** on enum fields (dropdowns)
- **Formatting** for dates and currencies
- **Hidden columns** for sensitive data (passwords, tokens)
- **Protected** from accidental deletion (board approval required)

Access control is managed via Google Drive permissions and Apps Script authentication.

---

## 10. IMAGE STORAGE & SERVING

### Public Assets — Google Cloud Storage

**Bucket**: `gea-public-assets` (public-readable, no authentication required)

All logo and favicon assets are served from GCS for performance and reliability:
- `gea-logo-round-*.png` — 32, 80, 120, 160, 200, 240 px (circular logo)
- `gea-logotype-light-*.png` — 560, 800, 1120 px (light variant for light backgrounds)
- `gea-logotype-dark-*.png` — 560, 800, 1120 px (dark variant for dark backgrounds)

**URLs stored in**: Config.gs constants (LOGO_*, FAVICON_URL)
- Format: `https://storage.googleapis.com/gea-public-assets/gea-logo-round-80.png`
- Access: No signed URLs, no authentication (public bucket with allUsers → Storage Object Viewer role)

### Member Photos & Documents — Storage Strategy

**Google Drive (Primary Archive):**
All member submissions (photos and documents) initially stored in Google Drive folders:
- `FOLDER_PHOTOS_PENDING` — Pending/rejected photo submissions
- `FOLDER_DOCUMENTS` — All member documents (passports, IDs, employment verification)
- `FOLDER_MEMBERSHIP_APPLICATIONS` — Application documents
- `FOLDER_PAYMENT_CONFIRMATIONS` — Payment receipts
- `FOLDER_BRAND_ASSETS` — Marketing materials (internal use only)

**Google Cloud Storage (Approved Photos Only):**
Approved member photos duplicated to `gea-member-data` bucket for app display:
- **Path format**: `gs://gea-member-data/{household_id}/{individual_id}/photo_{submission_id}.jpg`
- **Purpose**: Fast, reliable serving of member photos on digital membership cards
- **Lifecycle**: Approved photos retained; rejected/superseded photos never uploaded to Cloud Storage
- **Access**: Authenticated; served to member portal app

**Storage Flow:**
1. Member uploads photo/document → Google Drive (via File Submissions sheet)
2. If approved:
   - **Photos**: Duplicated to gea-member-data Cloud Storage, `cloud_storage_path` recorded
   - **Documents**: Remain in Google Drive only
3. If rejected: File stays in Google Drive for audit trail; not uploaded to Cloud Storage
4. When new version approved: Previous version disabled in Individuals sheet; both Drive copies retained

### Image Proxy Handler

The Apps Script includes an image proxy to serve Google Drive files directly as binary image responses:
- **Route**: `?action=img&id=<DRIVE_FILE_ID>`
- **Purpose**: Allows embedding Drive files in iframes without hotlink/preview restrictions
- **Security**: Currently unauthenticated (for public logos). If future use cases require private images, add `requireAuth()` check.
- **Implementation**: Fetches Drive file blob, returns with appropriate MIME type (JPEG/PNG/GIF)

### Image Diagnostic Page

Utility page for testing image asset availability:
- **Route**: `?action=image_diagnostic`
- **Purpose**: Live test of all LOGO_* and FAVICON_URL constants
- **Display**: Grid showing which images load successfully (✓) vs fail (✗)
- **Used for**: Debugging broken image URLs, verifying GCS bucket access, checking logo variants

---

**End of Schema Document**
