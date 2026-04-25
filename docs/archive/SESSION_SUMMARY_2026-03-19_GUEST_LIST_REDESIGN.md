# Session Summary — 2026-03-20
## Guest List Redesign + Email Template Housekeeping

---

## What Was Accomplished

### 1. Guest List Workflow — Full Redesign (RES.3)

The original whole-list acknowledge/reject model was replaced with a per-guest review system. The redesign was driven by the user's requirement that the RSO be able to approve and reject individual guests in a single pass, save draft decisions between sessions (to avoid timeout loss), and have the event proceed with the approved subset only — with rejections packaged and sent to the board (not directly to the member).

#### Config.js
- Added `TAB_GUEST_PROFILES = "Guest Profiles"` (new Reservations sheet tab)
- Replaced `GUEST_LIST_STATUS_ACKNOWLEDGED` / `GUEST_LIST_STATUS_REJECTED` with `GUEST_LIST_STATUS_IN_REVIEW` / `GUEST_LIST_STATUS_FINALIZED`
- Added audit constants: `AUDIT_GUEST_LIST_DRAFT_SAVED`, `AUDIT_GUEST_LIST_FINALIZED`, `AUDIT_GUEST_PROFILE_SAVED`

#### ReservationService.js
- **`submitGuestList()`** — updated for new guest fields: `first_name`, `last_name`, `age_group` (over_18/under_18), `id_number` (required for over_18), `save_to_profile`. Validates all fields. Handles profile save requests on submission.
- **`saveGuestProfile()`** — creates or updates a household guest profile. Deduplicates by `(household_id, id_number)` — updates existing row rather than creating a duplicate.
- **`getGuestProfiles()`** — returns all saved profiles for a household, sorted by name.
- **`getGuestHistoryByIdNumbers()`** — batch lookup across all finalized guest lists matched by ID number. Returns `{ id_number: [{event_date, facility, household_name, rso_status, rso_reason, reviewed_date}] }`.
- **`saveGuestListDraft()`** — RSO saves partial decisions; sets status to `in_review` (idempotent). Writes `rso_draft_json`.
- **`finalizeGuestListReview()`** — RSO finalizes all decisions. Validates all guests have a decision. Writes `finalized` status. Triggers approved-list email to RSO + board rejection notice if any rejected.
- **`_sendApprovedGuestListToRso()`** — plain-text email to RSO with approved-only guest details for event day.
- **`_sendGuestListRejectionsToBoard()`** — calls `sendEmailFromTemplate("RES_GUEST_LIST_REJECTIONS_TO_BOARD", ...)` with full approved/rejected lists and reasons.
- Removed: `acknowledgeGuestList()`, `rejectGuestList()`, `_sendFinalGuestListSummary()`

#### Code.js
- Added routes: `get_guest_profiles`, `admin_save_guest_list_draft`, `admin_finalize_guest_list`, `admin_guest_histories`
- Removed routes: `admin_acknowledge_guest_list`, `admin_reject_guest_list`
- `admin_guest_lists` now returns both `submitted` and `in_review` lists by default (no status filter needed for RSO queue)
- New handlers: `_handleGetGuestProfiles`, `_handleAdminSaveGuestListDraft`, `_handleAdminFinalizeGuestList`, `_handleAdminGuestHistories`

#### Portal.html — Guest List Modal
- New guest fields: first name, last name, age group dropdown (Over 18 / Under 18), ID number (placeholder changes based on age group; required for over_18)
- Save to profile checkbox per row
- "Add from Saved Guests" section — loads household profiles via `get_guest_profiles`, populates a picker; selecting a profile pre-fills a new row with name, ID number, age group
- `maskIdNumber()` — masks ID in the saved guests picker (shows last 4 digits, e.g. `******5678`)
- Profile ID field is editable; if changed, backend updates the saved profile

#### Admin.html — Guest List Review Panel
- Replaced detail panel with per-guest radio card interface (Approve / Reject)
- Reject reveals a reason textarea (required before finalize)
- History badges on each guest card: "prev: N approved / N rejected" — shown if ID-number history exists; clickable
- `saveGlDraft()` — saves current decisions without finalizing; updates status badge in table to "In Review"
- `finalizeGlReview()` — validates all decisions + reasons; confirm dialog warns about rejections; calls `admin_finalize_guest_list`
- `openGuestHistoryModal()` — modal showing past events and RSO decisions for a specific guest
- `maskIdAdmin()` — same masking logic; IDs shown as `******5678` in review panel; history modal shows no IDs
- Status column in guest list table: "New" (blue) or "In Review" (orange)
- Review button label: "Review" or "Continue Review" based on status

### 2. New Sheets Required (manual setup — completed by user)

#### Guest Lists sheet — new column added
- `rso_draft_json` (col N) — JSON array of `{index, rso_status, rso_reason}` decisions
- `last_modified_date` (col O)

Full column order:
`guest_list_id, reservation_id, household_id, household_name, primary_email, facility, event_date, guests_json, guest_count, submitted_date, submission_status, rso_reviewed_by, rso_review_date, rso_draft_json, last_modified_date`

#### Guest Profiles sheet — new tab (created by user)
`guest_profile_id, household_id, first_name, last_name, id_number, age_group, created_date, last_used_date`

### 3. New Email Template: RES_GUEST_LIST_REJECTIONS_TO_BOARD

- Local file: `docs/email_templates/reservations/RES_GUEST_LIST_REJECTIONS_TO_BOARD.txt`
- G: drive file: `G:\Shared drives\GEA Administration\Email Templates\reservations\RES_GUEST_LIST_REJECTIONS_TO_BOARD.txt`
- Placeholders: `RESERVATION_ID, FACILITY_NAME, RESERVATION_DATE, HOUSEHOLD_NAME, MEMBER_EMAIL, APPROVED_COUNT, APPROVED_LIST, REJECTED_COUNT, REJECTED_LIST, REVIEW_DATE`
- Email Templates sheet row (semicolon-separated):
  `RES_GUEST_LIST_REJECTIONS_TO_BOARD;RSO Guest List Flagged Guests — To Board;Guest List Review: Flagged Guests for {{FACILITY_NAME}} on {{RESERVATION_DATE}};[DRIVE_FILE_ID];RESERVATION_ID, FACILITY_NAME, RESERVATION_DATE, HOUSEHOLD_NAME, MEMBER_EMAIL, APPROVED_COUNT, APPROVED_LIST, REJECTED_COUNT, REJECTED_LIST, REVIEW_DATE;TRUE`
- **Still needed:** User must add the sheet row with the Drive file ID after uploading to Drive.

### 4. Email Template Housekeeping — All 62 Templates

Two global changes applied to all template files (both local `docs/email_templates/` and `G:\Shared drives\GEA Administration\Email Templates\`):

- **Footer updated:** "Please do not reply to this email. For assistance, contact board@geabotswana.org." → "You may reply directly to this email -- someone will read it."
- **Org name corrected:** "Gaborone Expatriate Association" → "Gaborone Employee Association"

7 templates that were missing the footer entirely had it appended. 9 templates that existed locally but were missing from G: drive were copied across.

---

## Design Decisions Recorded

- **ID masking:** Last 4 digits visible (`******5678`), rest asterisked. Applied in Portal.html saved-guest picker and Admin.html review panel. History modal shows no IDs. Full ID used server-side only for history matching.
- **History matching:** By ID number across all finalized guest lists — catches repeat guests who were never saved to a profile.
- **Draft persistence:** RSO can save partial decisions at any time. Status changes to `in_review` on first save. `rso_draft_json` is pre-populated when the review panel is reopened.
- **Finalize validation:** All guests must have a decision; rejected guests must have a reason. Confirm dialog warns about rejections before committing.
- **Board notification, not member:** RSO rejections go to board@geabotswana.org. Board decides how to communicate with the member.

---

## Pending / Next Steps

### Must do before guest list workflow is live
- [ ] Add `RES_GUEST_LIST_REJECTIONS_TO_BOARD` row to Email Templates sheet (Drive file ID needed)
- [ ] Also add rows for `RES_GUEST_LIST_SUBMITTED_TO_MEMBER` and `RES_GUEST_LIST_RSO_REJECTED_TO_MEMBER` if not already present

### Upcoming development tasks
- **RES.4** — Waitlist & Excess Booking Management (not started)
- **NMP.9** — Testing & Deployment (deferred)
- **Email Template Drive-based pipeline (Phase 1 plan)** — still pending; plan file exists at `C:\Users\MX-Admin\.claude\plans\piped-zooming-sutherland.md`
