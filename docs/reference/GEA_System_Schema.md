# GEA Management System - Complete Database Schema

**Last Updated:** February 16, 2026  
**System Version:** Core Backend (v1.0)

---

## Overview

The GEA Management System is built on Google Sheets with a Google Apps Script backend. The system manages member directory, reservations, payments, sessions, and administrative functions for the Gaborone Employee Association.

**Core Spreadsheets:**
- GEA Member Directory
- GEA Reservations
- GEA Payment Tracking
- GEA System Backend

---

## 1. MEMBER DIRECTORY

### 1.1 Households Sheet

Represents a household unit (could be individual or family). The primary organizational unit for membership, dues, and reservations.

| Field | Type | Notes |
|-------|------|-------|
| `household_id` | Text | Unique ID (format: HSH-2026-XXXXX) |
| `primary_member_id` | Text | FK to Individuals table |
| `household_name` | Text | Display name (usually family name) |
| `membership_type` | Enum | Full, Affiliate, Associate, Diplomatic, Community, Temporary |
| `membership_category` | Text | Derived from membership_level_id |
| `membership_level_id` | Text | FK to Membership Levels |
| `membership_duration_months` | Number | For Temporary memberships |
| `membership_start_date` | Date | When membership becomes effective |
| `membership_expiration_date` | Date | When membership expires (auto-renewal needed) |
| `dues_amount` | Number (USD) | Annual dues in USD |
| `dues_paid_amount` | Number (USD) | Total paid to date |
| `dues_last_payment_date` | Date | Last payment received date |
| `balance_due` | Number (USD) | Calculated: dues_amount - dues_paid_amount |
| `address_street` | Text | Street address |
| `address_city` | Text | City (usually Gaborone) |
| `address_country` | Text | Country (usually Botswana) |
| `country_code_primary` | Text | Country code for primary phone (e.g., BW, US) |
| `phone_primary` | Text | Primary phone number (no country code) |
| `phone_primary_whatsapp` | Boolean | Whether primary phone has WhatsApp |
| `active` | Boolean | Membership is current/active |
| `application_status` | Enum | Pending, Approved, Denied, Withdrawn |
| `application_date` | Date | When application was submitted |
| `approved_by` | Email | Board member who approved |
| `approved_date` | Date | Date of approval |
| `denial_reason` | Text | If status = Denied |
| `created_date` | Date | Record creation date |
| `last_modified_date` | Date | Last update date |
| `notes` | Text | Internal notes |
| `sponsor_name` | Text | Non-Full member sponsor name |
| `sponsor_email` | Email | Non-Full member sponsor email |
| `sponsor_verified` | Boolean | Sponsor eligibility confirmed |
| `sponsor_verified_date` | Date | Date sponsor was verified |
| `sponsor_verified_by` | Email | Board member who verified |
| `sponsor_notes` | Text | Sponsorship notes |

**Key Relationships:**
- 1:N with Individuals (one household has many individuals)
- 1:1 with Membership Levels (via membership_level_id)
- 1:N with Reservations (household can make many reservations)
- 1:N with Payments (household can make many payments)

---

### 1.2 Individuals Sheet

Represents a single person (adult or child) within a household.

| Field | Type | Notes |
|-------|------|-------|
| `individual_id` | Text | Unique ID (format: IND-2026-XXXXX) |
| `household_id` | Text | FK to Households |
| `first_name` | Text | First name |
| `last_name` | Text | Last name |
| `date_of_birth` | Date | DOB for age calculations |
| `age_category` | Enum | Adult, Youth (16-17), Child (under 16) — Calculated from DOB |
| `relationship_to_primary` | Enum | Primary, Spouse, Child, Other |
| `email` | Email | Personal email address |
| `citizenship_country` | Text | Country of citizenship |
| `us_citizen` | Boolean | Is US citizen or resident alien |
| `country_code_primary` | Text | Country code for primary phone |
| `phone_primary` | Text | Primary phone (no country code) |
| `phone_primary_whatsapp` | Boolean | Primary phone has WhatsApp |
| `country_code_secondary` | Text | Country code for secondary phone |
| `phone_secondary` | Text | Secondary phone (no country code) |
| `phone_secondary_whatsapp` | Boolean | Secondary phone has WhatsApp |
| | | |
| **CURRENT DOCUMENT REFERENCES** | | |
| `current_passport_submission_id` | Text | FK to File Submissions (current approved passport) |
| `current_omang_submission_id` | Text | FK to File Submissions (current approved Omang) |
| `current_photo_submission_id` | Text | FK to File Submissions (current approved photo) |
| | | |
| **DOCUMENT STATUS (Derived)** | | |
| `passport_status` | Enum | none, submitted, rso_approved, rso_rejected, gea_pending, gea_rejected, verified |
| `passport_expiration_date` | Date | From current submission (if verified) |
| `omang_status` | Enum | none, submitted, rso_approved, rso_rejected, gea_pending, gea_rejected, verified |
| `omang_expiration_date` | Date | From current submission (if verified) |
| `photo_status` | Enum | none, submitted, approved, rejected |
| | | |
| **DOCUMENT EXPIRATION WARNINGS** | | |
| `passport_expiration_warning_sent` | Boolean | Expiration warning email sent |
| `passport_expiration_warning_date` | Date | When warning was sent |
| `omang_expiration_warning_sent` | Boolean | Expiration warning email sent |
| `omang_expiration_warning_date` | Date | When warning was sent |
| | | |
| **OTHER FIELDS** | | |
| `can_access_unaccompanied` | Boolean | Access to recreational facilities without adult |
| `voting_eligible` | Boolean | Can vote in association elections |
| `employment_office` | Text | USG office where employed (e.g., "Embassy Gaborone") |
| `employment_verification_file_id` | Text | File ID for employment verification |
| `emergency_contact_name` | Text | Emergency contact name |
| `country_code_emergency` | Text | Country code for emergency phone |
| `phone_emergency` | Text | Emergency contact phone |
| `phone_emergency_whatsapp` | Boolean | Emergency contact has WhatsApp |
| `emergency_contact_relationship` | Text | Relationship to member |
| `emergency_contact_email` | Email | Emergency contact email |
| `arrival_date` | Date | When person arrived in Botswana |
| `departure_date` | Date | Expected or actual departure from Botswana |
| `active` | Boolean | Record is current/active |
| `created_date` | Date | Record creation date |
| `last_modified_date` | Date | Last update date |
| `staff_rso_cleared` | Boolean | RSO cleared for staff employment |
| `staff_rso_clearance_date` | Date | Date of RSO clearance |
| `fitness_center_eligible` | Boolean | Can use fitness center (based on age) |
| `office_eligible` | Boolean | Can hold board office (age 16+) |
| `password_hash` | Text | SHA256 hash of password for login |

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

### 1.2.1 File Submissions Sheet

Tracks all member-submitted files (documents and photos) with complete approval workflow history.

| Field | Type | Notes |
|-------|------|-------|
| `submission_id` | Text | Unique ID (format: FSB-2026-XXXXX) |
| `individual_id` | Text | FK to Individuals |
| `document_type` | Enum | passport, omang, photo |
| `file_id` | Text | Google Drive file ID (initial submission location) |
| `submitted_by_email` | Email | Member's email address |
| `submitted_date` | DateTime | When member uploaded file to Google Drive |
| `status` | Enum | submitted, rso_approved, rso_rejected, gea_pending, gea_rejected, approved, verified |
| `rso_reviewed_by` | Email | RSO email who reviewed (documents only) |
| `rso_review_date` | DateTime | When RSO reviewed (documents only) |
| `gea_reviewed_by` | Email | GEA admin email who reviewed |
| `gea_review_date` | DateTime | When GEA admin reviewed/approved |
| `rejection_reason` | Text | Reason for rejection (any stage) |
| `is_current` | Boolean | TRUE if this is the active/approved submission for this type |
| `disabled_date` | DateTime | When this submission was superseded by a newer approved one |
| `cloud_storage_path` | Text | Path in gea-member-data bucket (photos only, populated upon approval) |
| `notes` | Text | Internal review notes |

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

Main reservations table for facilities (tennis courts, Leobo venue, etc.).

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

Guest list submissions for reservations (RSO security requirement).

| Field | Type | Notes |
|-------|------|-------|
| `guest_id` | Text | Unique ID (auto-generated) |
| `reservation_id` | Text | FK to Reservations |
| `guest_category` | Enum | Family Member, Colleague, Friend, Local, Other |
| `guest_name` | Text | Full name of guest |
| `age_category` | Enum | Adult, Youth, Child |
| `vendor` | Boolean | Is this person a vendor/contractor? |
| `vendor_company` | Text | If vendor, their company |
| `submission_timestamp` | DateTime | When guest was added to list |

---

### 2.3 Usage Tracking Sheet

Tracks weekly/monthly usage limits to enforce reservation policies.

| Field | Type | Notes |
|-------|------|-------|
| `household_id` | Text | FK to Households |
| `household_name` | Text | Display name |
| `week_start_date` | Date | Monday of the week |
| `tennis_hours_this_week` | Number | Cumulative tennis hours this week |
| `month_start_date` | Date | First day of month |
| `leobo_reservations_this_month` | Number | Count of Leobo reservations this month |
| `last_calculated` | DateTime | When usage was last recalculated |

**Calculated nightly at midnight GMT+2 to reset weekly/monthly counters.**

---

## 3. PAYMENT TRACKING

### 3.1 Payments Sheet

Records all payment transactions for membership dues.

| Field | Type | Notes |
|-------|------|-------|
| `payment_id` | Text | Unique ID (auto-generated) |
| `household_id` | Text | FK to Households |
| `household_name` | Text | Display name |
| `payment_date` | Date | Date payment was received |
| `payment_method` | Enum | Bank Transfer, Cash, Check, Credit Card |
| `currency` | Enum | USD, BWP |
| `amount` | Number | Amount in specified currency |
| `amount_usd` | Number | Normalized to USD |
| `amount_bwp` | Number | Normalized to BWP |
| `payment_type` | Enum | Dues Payment, Late Fee, Donation |
| `applied_to_period` | Text | Which membership period (e.g., "2026-01") |
| `recorded_by` | Email | Board member who recorded payment |
| `notes` | Text | Payment notes |
| `journal_entry_id` | Text | Link to accounting system (future) |
| `payment_reference` | Text | Bank reference number or check number |
| `payment_confirmation_file_id` | Text | Google Drive file ID for receipt/proof |
| `payment_submitted_date` | Date | When member submitted payment |
| `payment_verified_date` | Date | When board verified receipt |
| `payment_verified_by` | Email | Board member who verified |

**Key Relationships:**
- N:1 with Households

**Auto-Calculations:**
- `balance_due` in Households = dues_amount - dues_paid_amount (updated when payment recorded)
- `active` status in Households = balance_due <= 0 (payment required for active status)

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

### 4.2 Sessions Sheet

Active user sessions for login management.

| Field | Type | Notes |
|-------|------|-------|
| `session_id` | Text | Unique ID (format: SES-2026-XXXXX) |
| `token` | Text | Secure session token (SHA256 hash) |
| `email` | Email | User's email address |
| `role` | Enum | member, board, admin |
| `created_at` | DateTime | When session started |
| `expires_at` | DateTime | When session expires (48 hours default) |
| `active` | Boolean | Session is still valid |

**Session Management:**
- Sessions expire after 48 hours
- Token is secure hash (SHA256)
- One session per user at a time (new login invalidates previous)
- Manual logout clears session

---

### 4.3 Audit Log Sheet

Complete audit trail of all system changes for compliance and debugging.

| Field | Type | Notes |
|-------|------|-------|
| `log_id` | Text | Unique ID (format: LOG-2026-XXXXX) |
| `timestamp` | DateTime | When action occurred |
| `user_email` | Email | Who performed the action |
| `action_type` | Enum | LOGIN, LOGIN_FAILED, LOGOUT, MEMBER_UPDATED, PASSWORD_SET, RESERVATION_CREATED, PAYMENT_RECORDED, etc. |
| `target_type` | Enum | Individual, Household, Reservation, Payment, etc. |
| `target_id` | Text | ID of the affected record |
| `details` | Text | Detailed description of what changed |
| `ip_address` | Text | IP address of request (for security) |

**Example Log Entries:**
- "LOGIN successful (role: member)"
- "Updated phone_primary → 71825225"
- "Password set by board member"
- "Reservation created for Tennis Court"
- "FILE_SUBMISSION_CREATED FSB-2026-00123 (passport) by IND-2026-12345"
- "FILE_SUBMISSION_RSO_APPROVED FSB-2026-00123 by rso@embassy.gov"
- "FILE_SUBMISSION_RSO_REJECTED FSB-2026-00123 by rso@embassy.gov - Expiration date already passed"
- "FILE_SUBMISSION_GEA_APPROVED FSB-2026-00123 by board@geabotswana.org"
- "FILE_SUBMISSION_GEA_REJECTED FSB-2026-00123 by board@geabotswana.org - Document illegible"
- "FILE_SUBMISSION_VERIFIED FSB-2026-00123 (both RSO and GEA approved)"
- "FILE_SUBMISSION_CURRENT_SET IND-2026-12345 passport → FSB-2026-00123 (previous FSB-2026-00120 disabled)"
- "FILE_SUBMISSION_CREATED FSB-2026-00124 (photo) by IND-2026-12345"
- "FILE_SUBMISSION_APPROVED FSB-2026-00124 by board@geabotswana.org (transferred to Cloud Storage)"
- "FILE_SUBMISSION_REJECTED FSB-2026-00124 by board@geabotswana.org - Face not clearly visible"

---

### 4.4 Holiday Calendar Sheet

US Federal and Botswana public holidays for business day calculations.

| Field | Type | Notes |
|-------|------|-------|
| `holiday_id` | Text | Unique ID (e.g., US-2026-01, BW-2026-02) |
| `holiday_date` | Date | Date of holiday |
| `holiday_name` | Text | Name (e.g., "New Year's Day") |
| `holiday_type` | Enum | US Federal, Botswana Public |
| `holiday_year` | Number | Year |
| `notes` | Text | Observance rules (e.g., "Sat→Fri observed") |
| `active` | Boolean | Holiday is recognized in system |
| `created_by` | Email | Who added this holiday |
| `created_date` | Date | Date added |

**2026 Holidays (Sample):**
- 01/01 - New Year's Day (US)
- 01/02 - New Year's Public Holiday (BW)
- 01/19 - MLK Day (US)
- 04/03 - Good Friday (BW)
- 05/25 - Memorial Day (US)
- 07/01 - Sir Seretse Khama Day (BW)
- 09/07 - Labor Day (US)
- 11/26 - Thanksgiving (US)

**Used for:**
- Calculating 4 business day deadline for guest lists
- Determining when facilities are closed
- Computing membership expiration dates

---

### 4.5 Email Templates Sheet

Templates for all automated system emails.

| Field | Type | Notes |
|-------|------|-------|
| `template_id` | Text | Unique ID (e.g., tpl_001, tpl_025, tpl_032) |
| `template_name` | Text | Display name |
| `subject` | Text | Email subject line (with variables) |
| `body` | Text | Email body (with variables) |
| `active` | Boolean | Template is in use |

**Current Templates:**

| ID | Name | Purpose |
|----|------|---------|
| tpl_001 | Application Received | Confirm membership application submitted |
| (others) | ... | Various notifications, approvals, etc. |

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
| `primary_applicant_name` | Text | Full name of person applying |
| `primary_applicant_email` | Email | Email address of applicant |
| `contact_phone` | Text | Phone number for follow-up |
| `membership_category` | Enum | Full, Affiliate, Associate, Diplomatic, Community, Temporary |
| `household_type` | Enum | Individual, Family |
| `sponsor_name` | Text | If non-Full member, who is sponsoring |
| `sponsor_email` | Email | Sponsor's email address |
| `sponsor_verified` | Boolean | Board has verified sponsor eligibility |
| `sponsor_verified_date` | Date | Date sponsor was verified |
| `sponsor_verified_by` | Email | Board member who verified sponsor |
| `application_form_file_id` | Text | Google Drive file ID for application form |
| `supporting_documents_file_ids` | Text | Comma-separated list of Drive file IDs (optional) |
| `submitted_date` | DateTime | When applicant submitted application |
| `status` | Enum | Pending, Under Review, Approved, Denied, Withdrawn |
| `assigned_to` | Email | Board member assigned to review |
| `assigned_date` | DateTime | When assigned for review |
| `reviewed_by` | Email | Board member who completed review |
| `review_date` | DateTime | When review was completed |
| `denial_reason` | Text | If denied, reason for denial |
| `review_notes` | Text | Reviewer notes |
| `approved_date` | Date | Date application was approved |
| `dues_amount` | Number (USD) | Annual dues amount (from membership level) |
| `membership_start_date` | Date | When membership begins (typically approval date) |
| `membership_expiration_date` | Date | When membership expires (1 year from start) |
| `created_date` | Date | When application record was created in system |
| `last_modified_date` | Date | Last update |
| `notes` | Text | Internal notes |

**Key Relationships:**
- N:1 with Households (many applications, but each links to one household if approved)
- 1:1 with Individuals (primary applicant becomes Primary member in household)

**Status Flow:**

1. `Pending` — Applicant has submitted form and documents, awaiting board assignment
2. `Under Review` — Board member assigned, actively reviewing application
3. `Approved` — Board approved membership
   - Apps Script auto-creates Household record
   - Apps Script auto-creates Individuals record for primary applicant
   - household_id linked back to application
   - Membership dates and dues set
   - Household `active` flag set to TRUE
4. `Denied` — Board denied application, `denial_reason` recorded
5. `Withdrawn` — Applicant withdrew application

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
- date_of_birth: Cannot be in future
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
