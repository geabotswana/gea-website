# Households Table: Column Analysis

**Date:** February 22, 2026
**Purpose:** Evaluate necessity and utility of each column in the Households sheet for the GEA Member Portal

---

## Summary

The Households table is the central organizational unit for GEA membership. This analysis reviews each column to determine if it's essential, optional, or redundant based on current system usage and future requirements.

---

## Column-by-Column Analysis

### ESSENTIAL COLUMNS ✅

These columns are actively used in the system and critical for core functionality.

#### `household_id` (Text)
- **Used:** Dashboard, reservations, payments, lookups
- **Argument FOR:** Unique identifier required for all relationships
- **Argument AGAINST:** None
- **Status:** KEEP - Essential

#### `household_name` (Text)
- **Used:** Dashboard display, email templates, reports
- **Argument FOR:** User-friendly display name; essential for UI
- **Argument AGAINST:** None
- **Status:** KEEP - Essential

#### `membership_level_id` (Text)
- **Used:** Lookup to Membership Levels table for dues, voting rights, office eligibility
- **Argument FOR:** Links to all membership type attributes; single source of truth for membership privileges
- **Argument AGAINST:** Requires join to Membership Levels sheet
- **Status:** KEEP - Essential

#### `active` (Boolean)
- **Used:** Login validation, dashboard alerts, reservation eligibility checks
- **Argument FOR:** Controls member access to portal; triggers inactive membership warnings
- **Argument AGAINST:** None
- **Status:** KEEP - Essential

#### `membership_start_date` (Date)
- **Used:** Dashboard display ("Member since..."), renewal reminders
- **Argument FOR:** Shows membership tenure; useful for member journey tracking
- **Argument AGAINST:** Could be derived from application approval date
- **Status:** KEEP - Useful for UX

#### `membership_expiration_date` (Date)
- **Used:** Dashboard expiry countdown, renewal alerts, eligibility checks
- **Argument FOR:** Critical for membership lifecycle; triggers 30-day warnings
- **Argument AGAINST:** None
- **Status:** KEEP - Essential

#### `dues_amount_usd` (Number)
- **Used:** Dashboard dues display, payment tracking
- **Argument FOR:** Stored per-household in case membership level changes; visible on dashboard
- **Argument AGAINST:** Could be derived from membership_level_id + exchange rate
- **Status:** KEEP - Useful (prevents stale rates if level changes)

#### `dues_paid_amount_usd` (Number)
- **Used:** Dashboard dues display, balance calculations
- **Argument FOR:** Running tally of payments received; essential for balance_due calculation
- **Argument AGAINST:** None
- **Status:** KEEP - Essential

#### `balance_due_usd` (Number)
- **Used:** Dashboard alert trigger, payment due display
- **Argument FOR:** Calculated field but cached for fast lookups; alerts highlight members with debt
- **Argument AGAINST:** Could be calculated on-the-fly (dues_amount - dues_paid)
- **Status:** KEEP - Good for performance

---

### ACTIVELY USED COLUMNS ⚠️

These columns support non-critical but useful features.

#### `sponsor_name` (Text)
- **Used:** Dashboard display for non-Full members
- **Argument FOR:** Shows sponsorship context; required for Affiliate/Associate/Community member types
- **Argument AGAINST:** Could be looked up from application data
- **Status:** KEEP - Improves UX for sponsored member types

#### `sponsor_verified` (Boolean)
- **Used:** Dashboard badge display
- **Argument FOR:** Quick visibility of sponsor approval status
- **Argument AGAINST:** Could be derived from sponsor_verified_by (if not null)
- **Status:** KEEP - Useful for status visibility

#### `household_type` (Enum)
- **Used:** Membership Level lookups, profile organization
- **Argument FOR:** Distinguishes Individual vs Family; affects eligibility rules
- **Argument AGAINST:** Could be inferred from membership_level_id (has household_type)
- **Status:** KEEP - Redundancy is acceptable for fast lookups

---

### RARELY USED COLUMNS 📊

These columns support specific workflows but aren't visible on main dashboard.

#### `primary_member_id` (Text, FK)
- **Used:** Relationship tracking, primary contact lookup
- **Argument FOR:** Identifies household's primary member for contact purposes
- **Argument AGAINST:** Could be derived from Individuals sheet (where relationship_to_primary = "Primary")
- **Status:** CONSIDER REMOVING - Redundant, can be looked up

#### `membership_duration_months` (Number)
- **Used:** Temporary membership expirations
- **Argument FOR:** Specifies temporary member duration limits
- **Argument AGAINST:** Not visible on portal; only used for Temporary members (rare)
- **Status:** KEEP - Necessary for edge case, minimal overhead

#### `sponsor_verified_by` (Email)
- **Used:** Audit trail (who approved sponsor)
- **Argument FOR:** Compliance/audit visibility
- **Argument AGAINST:** Not displayed on dashboard; mostly for records
- **Status:** KEEP FOR COMPLIANCE - Audit trail valuable

#### `sponsor_notes` (Text)
- **Used:** Internal notes on sponsorship arrangements
- **Argument FOR:** Captures context for future reference
- **Argument AGAINST:** Not displayed to members; manual entry
- **Status:** OPTIONAL - Keep if board uses; archive if not

---

### RARELY/NEVER USED COLUMNS ❌

These columns exist but aren't referenced in current system implementation.

#### Address Fields (`address_street`, `address_city`, `address_country`, `address_postal_code`)
- **Used:** Not seen in Code.js, Portal.html, or backend
- **Argument FOR:** May be required for regulatory/tax compliance; useful for emergency contact
- **Argument AGAINST:** Not displayed on dashboard; not used in queries
- **Status:** KEEP IF COMPLIANCE REQUIRED - Otherwise archive

#### `notes` (Text)
- **Used:** Internal notes field, not referenced in code
- **Argument FOR:** Board can add context for specific households
- **Argument AGAINST:** Not visible on portal; manual entry
- **Status:** OPTIONAL - Remove if unused for 6 months

#### `application_id` (FK, if present)
- **Used:** Link to Membership Applications sheet
- **Argument FOR:** Maintains audit trail to original application
- **Argument AGAINST:** Not referenced in current code
- **Status:** KEEP IF AUDITING - Otherwise archive

#### `application_status` (Enum, if present)
- **Used:** Displayed in dashboard alerts or admin views
- **Argument FOR:** Shows current membership phase (pending/approved/denied)
- **Argument AGAINST:** Unclear if still maintained; might be superseded by `active` flag
- **Status:** REVIEW - Clarify if still used or if `active` is the source of truth

#### `membership_category` (Text)
- **Used:** Might be cached from membership_level_id
- **Argument FOR:** Fast lookup without joining Membership Levels
- **Argument AGAINST:** Redundant with membership_level_id relationship
- **Status:** OPTIONAL - Remove if query performance is acceptable

---

## Recommendations

### IMMEDIATELY IMPLEMENT
- ✅ Fix voting_rights field reference in Portal.html (already done)
- ✅ Ensure all critical columns (household_id through sponsor_verified) are well-maintained

### SHORT TERM (Next Sprint)
- 🔍 **Audit** columns not referenced in code:
  - Are `address_*` fields needed for compliance?
  - Is `notes` used by board?
  - What is `application_status` vs `active`?
- 📋 **Document** the audit findings and decide: KEEP or ARCHIVE

### MEDIUM TERM (3 Months)
- 🗂️ **Archive** unused columns:
  - Create a "Households_Archive" sheet
  - Move rarely-used historical data there
  - Keep Households sheet lean for performance
- ✨ **Optimize** query performance:
  - `membership_category` could be removed if joins are fast
  - `primary_member_id` could be derived on-demand

### LONG TERM (Annual Review)
- 📊 Review Membership Levels table redundancy with Households
- 🎯 Evaluate if household-level dues storage (dues_amount_usd) should align with level-based dues or allow variance

---

## Membership Levels Table Structure

For reference, the Membership Levels table currently contains:

| Field | Type | Example |
|-------|------|---------|
| `level_id` | Text | `full_indiv`, `affiliate_indiv` |
| `level_name` | Text | "Full Membership - Individual" |
| `membership_category` | Enum | Full, Affiliate, Associate, Diplomatic, Community, Temporary |
| `household_type` | Enum | Individual, Family |
| `annual_dues_usd` | Number | 50, 100, etc. |
| `voting_rights` | Boolean | TRUE/FALSE |
| `office_eligible` | Boolean | TRUE/FALSE |
| `max_duration_months` | Number | NULL (unlimited), 6 (temp max) |
| `eligibility_criteria` | Text | Description of who qualifies |
| `active` | Boolean | TRUE/FALSE |
| `annual_dues_bwp` | Number | 700, 1400, etc. |
| `monthly_dues_usd` | Number | (Future use) |
| `monthly_dues_bwp` | Number | (Future use) |

**Note:** `voting_rights` and `office_eligible` are membership-level attributes, NOT individual attributes. The current system correctly shows these at the household level based on membership type.

---

## Questions for Board Review

1. **Compliance:** Are address fields required by tax, legal, or regulatory authorities?
2. **Audit Trail:** Is `sponsor_verified_by` actively used, or can we simplify to just `sponsor_verified` (boolean)?
3. **Application Tracking:** Is `application_status` maintained, or does `active` supersede it?
4. **Board Operations:** Is the `notes` field used for household-specific context?
5. **Data Quality:** How often are `address_*` and `notes` fields actually populated (0%, 50%, 100%)?

---

**Next Action:** Schedule board review of this analysis to determine archive/keep decisions.
