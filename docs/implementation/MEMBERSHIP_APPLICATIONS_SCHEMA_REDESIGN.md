# Schema Changes: Pending Approvals → Membership Applications

**Purpose:** Repurpose the Pending Approvals sheet to track membership applications with full workflow history

---

## Current Pending Approvals Schema

| Field | Type | Notes |
|-------|------|-------|
| `approval_id` | Text | Unique ID |
| `approval_type` | Enum | Membership Application, Policy, Other |
| `item_id` | Text | ID of the item needing approval |
| `submitted_by` | Email | Who submitted for approval |
| `submission_date` | Date | When submitted |
| `status` | Enum | Pending, Approved, Denied, Withdrawn |
| `assigned_to` | Email | Board member assigned to review |
| `notes` | Text | Reviewer notes |

---

## NEW Membership Applications Schema

### Renamed Sheet: "Membership Applications"

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
| | | |
| **APPLICATION DOCUMENTS** | | |
| `application_form_file_id` | Text | Google Drive file ID for application form |
| `supporting_documents_file_ids` | Text | Comma-separated list of Drive file IDs (optional) |
| `submitted_date` | DateTime | When applicant submitted application |
| | | |
| **BOARD REVIEW** | | |
| `status` | Enum | Pending, Under Review, Approved, Denied, Withdrawn |
| `assigned_to` | Email | Board member reviewing application |
| `assigned_date` | DateTime | When assigned for review |
| `reviewed_by` | Email | Board member who completed review |
| `review_date` | DateTime | When review was completed |
| `denial_reason` | Text | If denied, reason for denial |
| `review_notes` | Text | Reviewer notes (public or internal) |
| | | |
| **APPROVAL TRACKING** | | |
| `approved_date` | Date | Date application was approved |
| `dues_amount` | Number (USD) | Annual dues amount (calculated from membership level) |
| `membership_start_date` | Date | When membership begins (typically approval date) |
| `membership_expiration_date` | Date | When membership expires (1 year from start) |
| | | |
| **METADATA** | | |
| `created_date` | Date | When application record was created in system |
| `last_modified_date` | Date | Last update |
| `notes` | Text | Internal notes |

**Column count:** 32 columns

---

## Changes from Original Pending Approvals

### Removed Fields
- ❌ `approval_type` - No longer needed (sheet is now application-specific)
- ❌ `submission_date` - Replaced with `submitted_date` and `assigned_date` to distinguish applicant vs. board action

### Added Fields
- ✅ `household_id` - Links to Households once approved
- ✅ `primary_applicant_name` - Name of person applying
- ✅ `contact_phone` - Direct communication with applicant
- ✅ `membership_category` - Type of membership being requested
- ✅ `household_type` - Individual or family application
- ✅ `sponsor_*` fields - For non-Full member sponsorship tracking
- ✅ `application_form_file_id` - Tracks where application documents are stored
- ✅ `supporting_documents_file_ids` - Additional documents (proof of employment, etc.)
- ✅ `assigned_date` - When board member was assigned
- ✅ `reviewed_by` - Who actually completed the review (may differ from assigned_to)
- ✅ `review_date` - When review was completed
- ✅ `approved_date` - Formal approval date
- ✅ `dues_amount` - Calculated from membership level
- ✅ `membership_start_date` - When membership takes effect
- ✅ `membership_expiration_date` - Renewal deadline

### Modified Fields
- 🔄 `submitted_by` → `primary_applicant_email` (clearer purpose)
- 🔄 `item_id` → `application_id` (more semantic)
- 🔄 `assigned_to` → `assigned_to` (kept, but now paired with `assigned_date`)
- 🔄 `status` → New values: Pending, Under Review, Approved, Denied, Withdrawn

---

## Status Flow for Membership Applications

```
Pending
  ↓
  → Applicant submits form and documents
  ↓
Under Review
  ↓
  → Board member assigned, reviews application
  → Board member enters review_notes
  ↓
  ├→ Approved
  │   ↓
  │   → Application approved date recorded
  │   → household_id linked
  │   → New household record created in Households sheet
  │   → Membership start/expiration dates calculated
  │   → Membership active flag set to TRUE
  │
  ├→ Denied
  │   ↓
  │   → denial_reason recorded
  │   → Applicant notified
  │
  └→ Withdrawn
      ↓
      → Applicant withdraws voluntarily
      → Record archived
```

---

## Relationships & Dependencies

### Foreign Keys
- `household_id` → Households (N:1, nullable until approved)
- `sponsor_email` → Can reference Individuals or external email
- `assigned_to` → Can reference Individuals (board members)
- `reviewed_by` → Can reference Individuals (board members)

### One-to-One (After Approval)
- When application is approved:
  1. Create new Household record
  2. Set `household_id` in Membership Applications
  3. Set Household `application_status` = "Approved"
  4. Set Household `approved_date` = application `approved_date`
  5. Set Household `approved_by` = application `reviewed_by`
  6. Create Individuals record for primary applicant (with email from `primary_applicant_email`)

### Audit Trail
- Membership Applications serves as complete record of application lifecycle
- Audit Log captures state changes (submitted, assigned, approved, denied, etc.)

---

## Data Validation Rules

### Before Approval
- `status` cannot be "Approved" or "Denied" without `reviewed_by` and `review_date`
- `assigned_to` must be a valid board member email
- `membership_category` must match one of: Full, Affiliate, Associate, Diplomatic, Community, Temporary
- If `membership_category` is Community (only category requiring sponsor):
  - `sponsor_name` is required
  - `sponsor_email` is required
  - `sponsor_verified` is required before approval

### Upon Approval
- `household_id` must be populated
- `dues_amount` must be calculated from membership level
- `membership_start_date` typically = `approved_date`
- `membership_expiration_date` = `membership_start_date` + 1 year
- New Household record auto-created (via Apps Script trigger)
- Primary applicant becomes Primary member in new household

### Upon Denial
- `denial_reason` is required
- `status` = "Denied"
- `reviewed_by` and `review_date` required
- No household record created
- No Individuals record created

---

## Copy-Paste Header Row

```
application_id	household_id	primary_applicant_name	primary_applicant_email	contact_phone	membership_category	household_type	sponsor_name	sponsor_email	sponsor_verified	sponsor_verified_date	sponsor_verified_by	application_form_file_id	supporting_documents_file_ids	submitted_date	status	assigned_to	assigned_date	reviewed_by	review_date	denial_reason	review_notes	approved_date	dues_amount	membership_start_date	membership_expiration_date	created_date	last_modified_date	notes
```

---

## Integration with Households Sheet

When application is approved, Apps Script automatically:

1. **Create new Household record:**
   - Generate `household_id`
   - Set `primary_member_id` (to primary applicant individual_id)
   - Set `household_name` (from primary applicant name)
   - Set `membership_type` from application `membership_category`
   - Set `membership_level_id` (lookup from category)
   - Set `dues_amount` from membership level
   - Set `membership_start_date` from application
   - Set `membership_expiration_date` from application
   - Set `application_status` = "Approved"
   - Set `approved_by` from application `reviewed_by`
   - Set `approved_date` from application `approved_date`
   - Set `active` = TRUE

2. **Create Individuals record for primary applicant:**
   - Generate `individual_id`
   - Set `household_id` (from new household)
   - Set `first_name`, `last_name` (parsed from application `primary_applicant_name`)
   - Set `email` from application `primary_applicant_email`
   - Set `relationship_to_primary` = "Primary"
   - Set `active` = TRUE

3. **If sponsorship required:**
   - Set Household `sponsor_name` from application
   - Set Household `sponsor_email` from application
   - Set Household `sponsor_verified` = TRUE (already verified in application)
   - Set Household `sponsor_verified_date` from application
   - Set Household `sponsor_verified_by` from application

4. **Update Membership Applications record:**
   - Set `household_id` (link back to new household)
   - Set `application_id` to "Approved" status is permanent

---

## Comparison: Old vs New

| Aspect | Old Pending Approvals | New Membership Applications |
|--------|----------------------|---------------------------|
| **Sheet Name** | Pending Approvals | Membership Applications |
| **Purpose** | Generic approval queue | Membership application tracking |
| **Scope** | All approvals (overly broad) | Membership applications only |
| **Tracking** | Generic queue | Complete application lifecycle |
| **Sponsorship** | Not tracked | Full sponsorship workflow |
| **Documents** | Generic file reference | Specific application form + supporting docs |
| **Approval Details** | Basic (assigned_to, notes) | Detailed (who reviewed, when, review notes) |
| **Link to Households** | No | Yes (NULL until approved) |
| **Membership Details** | No | Yes (dues, start date, expiration) |
| **Audit Trail** | Minimal | Complete (dates at each stage) |

---

## Migration Path (If Existing Data)

If you have existing data in Pending Approvals:

1. **Export current data** as backup
2. **Filter out non-application items** (photos, documents, reservations)
   - Delete or archive those rows
   - They're now tracked in File Submissions or Reservations sheets
3. **Map remaining application records to new schema:**
   - `approval_id` → `application_id`
   - `item_id` → `application_id` (keep same)
   - `submitted_by` → `primary_applicant_email`
   - Add missing fields (primary_applicant_name, contact_phone, etc. from Households/Individuals)
   - Add application documents references if available
4. **Delete old Pending Approvals sheet**
5. **Create new Membership Applications sheet** with new schema

---

## Summary of Changes

✅ **Renamed:** Pending Approvals → Membership Applications  
✅ **Narrowed scope:** Applications only (not all approvals)  
✅ **Added fields:** Sponsorship tracking, document references, detailed review workflow  
✅ **Added relationships:** Links to Households, Individuals  
✅ **Improved audit trail:** Dates at each stage (submitted, assigned, reviewed, approved)  
✅ **Automation ready:** Apps Script can auto-create Household/Individuals upon approval  

**This makes Membership Applications a complete, specialized sheet for its purpose.**

---

**Ready to update the schema document with this new design?**
