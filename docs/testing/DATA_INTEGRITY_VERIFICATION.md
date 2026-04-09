# Data Integrity Verification Guide

Quick reference for verifying data is correctly stored in the four spreadsheets during membership application testing.

---

## When to Verify Data

Run this verification at key workflow milestones:
- ✅ After application submission
- ✅ After documents confirmed
- ✅ After board approval
- ✅ After payment approved (final stage)

---

## Quick Verification Checklist

Use this checklist after each major stage to ensure data integrity.

### After Application Submission (Stage: awaiting_docs)

**Spreadsheet: Member Directory**

**Households Tab:**
- [ ] New row created with `household_id` (e.g., HSH-2026-001)
- [ ] `primary_member_id` set to applicant's `individual_id`
- [ ] `household_name` contains applicant's last name
- [ ] `household_type` = "Individual" or "Family" (matches form)
- [ ] `membership_type` = correct category (Full, Associate, etc.)
- [ ] `membership_expiration_date` = next July 31 (calculated correctly)
- [ ] `active` = FALSE (not activated yet)
- [ ] `created_date` = today

**Individuals Tab:**
- [ ] New row created for primary applicant with `individual_id` (e.g., IND-2026-001)
- [ ] `household_id` matches the household created above
- [ ] `first_name`, `last_name` match form input (capitalized correctly)
- [ ] `email` matches form input (lowercase)
- [ ] `phone_primary`, `phone_primary_whatsapp` match form
- [ ] `citizenship_country` = form selection
- [ ] `relationship_to_primary` = "Primary"
- [ ] `can_access_unaccompanied` = TRUE
- [ ] `voting_eligible` = FALSE (until membership active)
- [ ] `active` = FALSE
- [ ] `password_hash` = hashed temp password (not visible, but row should be marked as needing password reset)
- [ ] `date_of_birth` = empty (will be filled during document review)

**Family Members (if applicable):**
- [ ] Spouse row created with correct `relationship_to_primary` = "Spouse"
- [ ] `can_access_unaccompanied` = TRUE
- [ ] Children rows created with `relationship_to_primary` = "Child"
- [ ] `can_access_unaccompanied` = FALSE
- [ ] Household staff row created (if applicable)

**Spreadsheet: System Backend**

**Membership Applications Tab:**
- [ ] New row created with `application_id` (e.g., APP-2026-00001)
- [ ] `household_id`, `primary_individual_id` match values above
- [ ] `primary_applicant_name` = full name
- [ ] `primary_applicant_email` = email address
- [ ] `membership_category` = correct category
- [ ] `household_type` = "Individual" or "Family"
- [ ] `status` = "awaiting_docs"
- [ ] `submitted_date` = today
- [ ] `documents_confirmed_date` = NULL (not confirmed yet)
- [ ] `board_initial_status`, `rso_status`, `board_final_status` = NULL (not reviewed yet)
- [ ] `payment_status`, `payment_id` = NULL (not paid yet)

---

### After Documents Confirmed (Stage: board_initial_review)

**File Submissions Tab (Member Directory):**
- [ ] New rows created for each uploaded document
- [ ] `submission_id`, `individual_id`, `document_type` match uploads
- [ ] `status` = "submitted" (waiting for RSO review)
- [ ] `submission_timestamp` = time of upload
- [ ] `rso_reviewed_by`, `rso_review_date` = NULL (not reviewed yet)
- [ ] `gea_reviewed_by`, `gea_review_date` = NULL

**Membership Applications Tab (GEA Member Directory):**
- [ ] `documents_confirmed_date` = today
- [ ] `status` = "board_initial_review"
- [ ] `board_initial_status` = NULL (board hasn't decided yet)

---

### After Board Approval (Stage: rso_review or board_final_review)

**File Submissions Tab:**
- [ ] If RSO approved: `rso_reviewed_by` = RSO email, `rso_review_date` = today, `status` = "rso_approved"
- [ ] If board final approved: `gea_reviewed_by` = board email, `gea_review_date` = today, `status` = "verified"

**Membership Applications Tab:**
- [ ] `board_initial_status` = "approved"
- [ ] `board_initial_reviewed_by` = board member email
- [ ] `board_initial_review_date` = today
- [ ] `status` = "rso_docs_review" (if after RSO forward), "rso_application_review" (after RSO approves), or "board_final_review" (if at final review)
- [ ] `board_final_status` = "approved" (if final board approved)

---

### After Payment Approval (Stage: activated)

**Payments Tab (Payment Tracking spreadsheet):**
- [ ] New row created with `payment_id` (e.g., PAY-2026-0001)
- [ ] `household_id`, `individual_id` match applicant
- [ ] `amount_usd`, `amount_bwp` = correct dues for category/quarter
- [ ] `payment_method` = selected method (PayPal, SDFCU, Zelle, Absa)
- [ ] `currency_submitted` = USD or BWP
- [ ] `status` = "verified"
- [ ] `submitted_date` = date applicant submitted
- [ ] `verified_date` = today (when treasurer approved)
- [ ] `verified_by` = treasurer email

**Individuals Tab (Member Directory):**
- [ ] `active` = TRUE
- [ ] `membership_expiration_date` = July 31 (current or next year)
- [ ] `voting_eligible` = TRUE (if age 17+) or FALSE (if <17)
- [ ] `date_of_birth` extracted from ID document (if uploaded)

**Households Tab:**
- [ ] `active` = TRUE
- [ ] `membership_expiration_date` = July 31
- [ ] All household members have corresponding active Individuals rows

**Membership Applications Tab:**
- [ ] `status` = "activated" (or similar terminal active status)
- [ ] `payment_id` = the payment ID from Payments tab
- [ ] `payment_status` = "verified"
- [ ] `board_final_status` = "approved"
- [ ] `board_final_reviewed_by`, `board_final_review_date` = board email and date

---

## Detailed Field-by-Field Verification

### Households Sheet (Member Directory)

| Field | Expected Type | Validation Rules |
|-------|---|---|
| `household_id` | Text | Format: HSH-YYYY-MM-DD-### (unique) |
| `primary_member_id` | Text | Must exist in Individuals sheet, same household |
| `household_name` | Text | Capitalized (e.g., "Morrison Household") |
| `household_type` | Text | "Individual" or "Family" |
| `membership_type` | Text | One of: Full, Associate, Affiliate, Diplomatic, Temporary, Community |
| `membership_expiration_date` | Date | July 31 of current or next membership year |
| `active` | Boolean | TRUE after payment verified; FALSE before |
| `created_date` | Date | = application submission date |

### Individuals Sheet (Member Directory)

| Field | Expected Type | Validation Rules |
|---|---|---|
| `individual_id` | Text | Format: IND-YYYY-MM-DD-### (unique) |
| `household_id` | Text | Must match household this member belongs to |
| `first_name`, `last_name` | Text | Capitalized; no extra spaces |
| `email` | Text | Lowercase; valid email format; unique in system |
| `phone_primary` | Text | +267 prefix + digits (international format) |
| `citizenship_country` | Text | 2-letter country code (US, BW, ZA, etc.) |
| `relationship_to_primary` | Text | "Primary", "Spouse", "Child", "[Staff Role]" |
| `can_access_unaccompanied` | Boolean | TRUE: primary, spouse, staff; FALSE: children <18 |
| `voting_eligible` | Boolean | TRUE: 17+; FALSE: <17 or non-voting categories |
| `active` | Boolean | Same as household.active |
| `date_of_birth` | Date | Extracted from ID document during approval |
| `password_hash` | Text | SHA256 hash (not plaintext) |

### File Submissions Sheet (Member Directory)

| Field | Expected Type | Validation Rules |
|---|---|---|
| `submission_id` | Text | Format: SUB-YYYY-MM-DD-### (unique) |
| `individual_id` | Text | Must exist in Individuals sheet |
| `document_type` | Text | "passport", "omang", "photo", or other |
| `status` | Text | "submitted", "rso_approved", "verified", "rejected" |
| `submission_timestamp` | Datetime | Set to upload time |
| `rso_reviewed_by` | Text (email) | RSO approver's email; NULL if not reviewed |
| `rso_review_date` | Date | Date RSO approved/rejected; NULL if pending |
| `gea_reviewed_by` | Text (email) | GEA admin email; NULL if not reviewed |
| `gea_review_date` | Date | Date GEA admin approved; NULL if pending |
| `is_current` | Boolean | TRUE for most recent approved submission of type |
| `cloud_storage_path` | Text | GCS path for approved photos; NULL otherwise |

### Membership Applications Sheet (GEA Member Directory)

| Field | Expected Type | Validation Rules |
|---|---|---|
| `application_id` | Text | Format: APP-YYYY-##### (unique) |
| `household_id`, `primary_individual_id` | Text | Match values in Member Directory |
| `primary_applicant_name`, `email` | Text | Match Individuals sheet |
| `membership_category` | Text | One of six categories |
| `household_type` | Text | "Individual" or "Family" |
| `status` | Text | Progression: awaiting_docs → board_initial_review → rso_docs_review → rso_application_review → board_final_review → approved_pending_payment → payment_submitted → activated |
| `submitted_date` | Date | = application submission date |
| `board_initial_status` | Text | "approved", "denied", or NULL |
| `board_initial_reviewed_by` | Text | Board member email; NULL if not reviewed |
| `board_initial_review_date` | Date | Date board decided; NULL if pending |
| `rso_status` | Text | "approved", "pending", or NULL |
| `rso_reviewed_by` | Text | RSO email; NULL if not reviewed |
| `board_final_status` | Text | "approved", "denied", or NULL |
| `payment_status` | Text | "submitted", "verified", "rejected", "clarification_requested" |
| `payment_id` | Text | References payment ID in Payments sheet; NULL if not paid |

### Payments Sheet (Payment Tracking)

| Field | Expected Type | Validation Rules |
|---|---|---|
| `payment_id` | Text | Format: PAY-YYYY-##### (unique) |
| `household_id`, `individual_id` | Text | Must exist in Individuals sheet |
| `amount_usd` | Number | Correct pro-rated dues for category |
| `amount_bwp` | Number | = amount_usd × exchange_rate |
| `payment_method` | Text | "PayPal", "SDFCU", "Zelle", "Absa" |
| `currency_submitted` | Text | "USD" or "BWP" |
| `status` | Text | "submitted", "verified", "rejected", "clarification_requested" |
| `submitted_date` | Date | Date applicant submitted payment |
| `verified_date` | Date | Date treasurer approved; NULL if pending |
| `verified_by` | Text | Treasurer email; NULL if not verified |

---

## Common Data Errors to Watch For

### Error: duplicate household_id

**Symptom:** Two rows with same household_id
**Cause:** Duplicate application submission
**Fix:** Delete duplicate; keep the one with earliest created_date

### Error: Email mismatch

**Symptom:** Individuals.email ≠ Membership Applications.primary_applicant_email
**Cause:** Email edited after submission
**Fix:** Keep Individuals.email as source of truth

### Error: Expired membership still active=TRUE

**Symptom:** membership_expiration_date is past, but active=TRUE
**Cause:** Nightly task didn't run or failed
**Fix:** Manually check nightly task logs; verify runNightlyTasks() completing

### Error: Child voting_eligible=TRUE but age <17

**Symptom:** Child with date_of_birth 2015 has voting_eligible=TRUE
**Cause:** Manual entry error or formula not calculating correctly
**Fix:** Recalculate: voting_eligible = (age >= 17) AND (household.active=TRUE)

### Error: Payment amount doesn't match pro-ration

**Symptom:** Full Individual pays $75 instead of $50
**Cause:** Wrong category dues used; or wrong pro-ration quarter
**Fix:** Check Config.js for dues rates; verify PRORATED_QUARTER calculation

---

## Batch Verification Script (For Developers)

Run in Google Apps Script editor to verify multiple applications at once:

```javascript
function verifyDataIntegrity() {
  var results = [];

  // Get all applications in awaiting_docs status
  var appSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Membership Applications");
  var appData = appSheet.getDataRange().getValues();

  for (var i = 1; i < appData.length; i++) {
    var app = appData[i];
    var appId = app[0]; // application_id column
    var householdId = app[1]; // household_id
    var primaryIndividualId = app[2]; // primary_individual_id

    // Verify household exists
    var householdFound = _findRowByColumn(
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Households"),
      "household_id",
      householdId
    );

    if (!householdFound) {
      results.push("FAIL: " + appId + " → household_id " + householdId + " not found");
    }

    // ... additional checks ...
  }

  Logger.log(results.join("\n"));
}
```

---

## Sign-Off Checklist

After verification, sign off:

- [ ] All applications created with correct household_id and individual_id
- [ ] All documents submitted and status = "submitted"
- [ ] All approvals recorded with timestamps and approver email
- [ ] Payment amounts calculated correctly (pro-ration, exchange rate)
- [ ] Activation set all active flags to TRUE
- [ ] No placeholder values (e.g., NULL where should have data)

---

**Last Updated:** March 30, 2026
