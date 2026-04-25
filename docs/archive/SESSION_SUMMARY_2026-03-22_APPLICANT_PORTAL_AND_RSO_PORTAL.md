# Session Summary — 2026-03-22 / 2026-03-23 / 2026-03-24
## Applicant Portal Stabilization, Email Infrastructure, RSO Dual-Role Portal, Membership Guide

---

## What Was Accomplished

### 1. Email Infrastructure Fixes

Two critical email delivery failures were diagnosed and fixed.

**BOARD_EMAIL_DELEGATED_USER (Config.js)**

All outbound emails were failing with `unauthorized_client` errors. Domain-Wide Delegation (DWD) requires impersonating a real Google Workspace user as the JWT `sub` claim. `board@geabotswana.org` is a Google Group — Groups cannot be impersonated. Changed `BOARD_EMAIL_DELEGATED_USER` to `treasurer@geabotswana.org`, which is a real Workspace user with Send As delegation for `board@`.

Affected templates: `MEM_APPLICATION_RECEIVED`, `MEM_ACCOUNT_CREDENTIALS`, `ADM_NEW_APPLICATION_BOARD`.

**Email Template Column Indices (EmailService.js)**

`getEmailTemplate()` had incorrect column indices for the Drive-based template system. The Email Templates sheet columns are:

```
A=semantic_name  B=display_name  C=subject  D=drive_file_id  E=placeholders  F=active
```

The column offsets were wrong, causing templates never to load. Also fixed: the `active` flag was being read as a boolean, but Google Sheets returns `"TRUE"` as a string.

---

### 2. Admin Portal Fixes (March 22)

**Admin.html API URL scriptlet not resolving**

`Admin.html` was being served via `HtmlService.createHtmlOutputFromFile()` which outputs raw HTML. The `<?= PORTAL_API_URL ?>` scriptlet was rendering as a literal string. Fixed by switching to `HtmlService.createTemplateFromFile()` so GAS evaluates scriptlets before serving.

**Admin Login link added to public website footer**

Added a visible Admin Login link in the footer of `index.html` so board members can reach the Admin Portal without going through the member portal.

---

### 3. Applicant Portal Stabilization (March 23)

The membership application portal was failing in several interconnected ways. Fixed across a rapid series of PRs.

**Deprecated email template calls**

`ApplicationService.js` was calling `tpl_040` and `tpl_041` (old numeric IDs) instead of semantic template names. Three runtime errors on membership application submission were also fixed simultaneously.

**Loading spinner on submit button**

Added a spinner to the application submit button to prevent double-submissions and provide feedback during the backend call.

**Dev/Prod environment box hidden**

The development/production environment indicator in `member.html` was commented out for production. Followed up with fixes for JS null errors that the now-absent HTML caused.

**Admin Portal link on member login page**

Added a direct link to the Admin Portal from the member portal login screen.

**Email column revert**

An earlier incorrect change to `getEmailTemplate()` column indices was reverted before the correct fix was applied.

**Infinite recursion on applicant login (PR #21)**

`loadApplicantPortal()` was defined twice in `Portal.html`. The second definition overrode the first and called `showPage('applicant')`, which in turn called `loadApplicantPortal()` — producing a stack overflow on every applicant login. Fixed by removing the dead first definition and replacing the recursive `showPage()` call with direct page activation.

**`loadApplicantPortal()` not defined (PR #18)**

The function was called in the login flow but never implemented. Added to `Portal.html`.

**Login routing — `is_applicant` flag not passed through (PRs #17, #18)**

`_handleLogin()` in `Code.js` was not including `is_applicant` in the response, so the portal couldn't distinguish applicant from member logins. Fixed. Additionally, `sessionStorage` was not persisting the flag, so page refreshes broke routing. Flag now saved to `sessionStorage` on login.

**Auth check pattern fix (PR #18)**

Applicant and payment handlers were checking `auth.success` instead of `auth.ok` — the correct field name used throughout the rest of the codebase. All affected handlers updated.

**Header title for applicants (PR #19)**

Portal header now shows "Applicant Portal" instead of "Member Portal" when the logged-in user is an applicant.

**Welcome email sent on every login (PR #20)**

`first_login_date` and `last_login_date` columns were missing from the Individuals sheet. `MemberService._updateField()` was silently returning false, so `first_login_date` was never persisted — every login triggered the welcome email. Fixed: `_updateField()` now auto-creates missing columns in the sheet header row. Both columns documented in the schema reference.

**Post-login debug panel (PR #22/#23)**

A routing debug panel was added to `Portal.html` to trace post-login state during investigation, then disabled (`display:none`) once the routing bugs were resolved.

---

### 4. Phone Formatting & Household Display Refactor (PR #25)

- `household_type` field (Individual/Family) now written to the Households record at application creation time. Previously this field was missing, causing buttons and labels to behave incorrectly for all households.
- Household name now uses a hyphenated last-name format for Family memberships when spouses have different last names (e.g., "Jones-Smith Household").
- "Add Child" and "Add Staff Member" buttons are now hidden for Individual membership types — they only appear when `household_type === "Family"`.
- `membership_type` (Individual/Family) and `membership_category` (Full/Affiliate/Community/etc.) confirmed as distinct fields. Previously conflated in some read paths.

---

### 5. RSO Dual-Role Portal (PR #26)

The RSO access model was redesigned from one-time email links to authenticated Admin Portal sessions with a split role architecture.

**Problem with the old model:** RSO personnel received one-time links by email each time they needed to review documents or guest lists. This was insecure and unscalable; there was no audit trail of who took which action.

**New architecture:** Two roles replace the legacy `rso` role (which is kept as a backward-compatibility alias for `rso_approve`):

| Role | Access |
|------|--------|
| `rso_approve` | Document review, guest list review, applications, photos, event calendar |
| `rso_notify` | Event calendar (read-only), approved guest lists (read-only) |

#### AuthService.js
- `requireAuth()` now accepts role arrays: e.g. `["rso_approve", "rso_notify"]` — either role satisfies the check
- `createAdminAccount()` validates `rso_approve` and `rso_notify` as valid roles
- `board` remains superuser across all role checks
- Legacy `rso` treated as `rso_approve` for backward compatibility

#### Code.js — 4 new routes
- `admin_rso_pending_documents` — list passport/omang submissions pending RSO review
- `admin_rso_approve_document` — approve or reject a document via authenticated session
- `admin_rso_approved_calendar` — approved reservations for RSO calendar view
- `admin_rso_approved_guest_lists` — finalized guest lists for rso_notify reference view
- Guest list routes (`admin_guest_lists`, `admin_save_guest_list_draft`, `admin_finalize_guest_list`, `admin_guest_histories`) now accept rso_approve in addition to board

#### FileSubmissionService.js
- `getDocumentsForRsoReview()` — returns passport/omang submissions with status `rso_pending`
- `approveDocumentByRso()` — approve or reject a document; captures the individual RSO's email from their session (not the generic `EMAIL_RSO_APPROVE` constant)

#### ReservationService.js
- `getApprovedReservationsForCalendar()` — approved reservations formatted for calendar display
- `getApprovedGuestListsForRsoNotify()` — finalized guest lists for reference by rso_notify users

#### Admin.html
- Login routing: `rso_approve` lands on Document Review; `rso_notify` lands on Event Calendar
- `_applyNavRoleFilter()` updated for both new roles
- 3 new sidebar items and 3 new pages: `rso-documents`, `rso-calendar`, `rso-approved-guests`
- RSO document reject modal added
- Administrators page role dropdown updated: `rso` option replaced with `rso_approve` / `rso_notify`
- Sidebar authorization mismatches for `rso_approve` fixed (some pages were inaccessible despite being in the nav)

---

### 6. RSO Email Templates (PR #27)

Two new email templates created as Drive `.txt` files and registered in the manifest:

- **`ADM_DOCS_SENT_TO_RSO_TO_MEMBER`** — notifies the applicant that their documents have been forwarded to RSO for review
- **`ADM_DOCUMENT_APPROVED_BY_RSO_TO_MEMBER`** — notifies the member that RSO has approved their document

Reference to non-existent template `ADM_BOARD_APPROVED_AWAITING_RSO` removed from implementation docs.

Documentation updates:
- `CLAUDE.md` — new RSO Portal section added
- `CLAUDE_Membership_Implementation.md` — STEP 6 rewritten to describe portal-based RSO workflow (not email links)
- `GEA_System_Architecture.md` — architecture diagram updated with current RSO implementation
- `CLAUDE_RSO_Portal_Implementation.md` — fully updated to reflect dual-role architecture and actual deployed state

---

### 7. Membership Dues Audit & Critical Fix

**Audit finding:** `_calculateDuesAmount(applicationId)` was called in two places in `ApplicationService.js` but was never defined — `ReferenceError` at runtime. Consequences:
- `dues_amount` was always 0 in the Membership Applications sheet
- Payment records in the Payments sheet had no amount recorded
- Approval emails could not include the correct dues figure

**Fix:** Implemented `_calculateDuesAmount(applicationId)` in `ApplicationService.js`. It looks up `membership_level_id` from the application → household, retrieves `annual_dues_usd` from the Membership Pricing sheet via `getMembershipLevel()`, and applies pro-ration using the existing `calculateProratedDues()`. Two additional parameter bugs at the call sites (wrong argument passed) were also corrected.

---

### 8. Membership Application Guide

A comprehensive applicant-facing guide was written at `docs/guides/MEMBERSHIP_APPLICATION_GUIDE.md`. Covers the full 11-step application process, eligibility categories, required documents for each member type, payment instructions, and FAQ.

**Policy corrections made during guide authoring:**

- **Sponsor requirement:** The guide initially required sponsors for Associate, Affiliate, and Diplomatic categories. Per `docs/policies/Membership_Policy.md`, sponsorship is only required for Community members. Corrected throughout the guide, implementation docs, and testing scenes.

- **Date of birth collection:** DOB was being collected for all family members in the application form. Corrected: DOB is required for children only — adults' birthdates are extracted from government-issued ID documents (passport/Omang) during verification. Portal.html updated: DOB field now only visible when member type is "Child"; validation enforces it for children only.

- **Staff document requirements:** Clarified in FAQ that household staff follow the same document requirements as adult applicants (Omang + photo).

---

## Files Changed

| File | Change |
|------|--------|
| `Config.js` | `BOARD_EMAIL_DELEGATED_USER` → `treasurer@geabotswana.org` |
| `AuthService.js` | `requireAuth()` accepts role arrays; `createAdminAccount()` accepts rso_approve/rso_notify; `rso` alias to rso_approve |
| `Code.js` | 4 new RSO routes + handlers; guest list routes accept rso_approve |
| `ApplicationService.js` | Implement `_calculateDuesAmount()`; fix 2 call-site parameter bugs; deprecated tpl_ calls replaced |
| `FileSubmissionService.js` | `getDocumentsForRsoReview()`, `approveDocumentByRso()` |
| `ReservationService.js` | `getApprovedReservationsForCalendar()`, `getApprovedGuestListsForRsoNotify()` |
| `MemberService.js` | `_updateField()` auto-creates missing columns; schema updated |
| `EmailService.js` | Column indices fixed; active flag string comparison |
| `Portal.html` | Fix infinite recursion; implement `loadApplicantPortal()`; `is_applicant` routing; applicant header title; DOB field conditional; debug panel (disabled); loading spinner |
| `Admin.html` | Template evaluation fix; RSO dual-role nav filter; 3 new pages + modal; role dropdown updated; sidebar auth fixes |
| `member.html` | Dev/Prod box commented out |
| `index.html` | Admin Login link in footer |
| `docs/guides/MEMBERSHIP_APPLICATION_GUIDE.md` | New file — comprehensive applicant guide |
| `docs/email_templates/` | `ADM_DOCS_SENT_TO_RSO_TO_MEMBER.txt`, `ADM_DOCUMENT_APPROVED_BY_RSO_TO_MEMBER.txt` created; manifest updated |
| `docs/implementation/CLAUDE_RSO_Portal_Implementation.md` | Rewritten for dual-role architecture |
| `docs/implementation/CLAUDE_Membership_Implementation.md` | STEP 6 rewritten for portal-based RSO workflow |
| `docs/implementation/GEA_System_Architecture.md` | Architecture diagram updated |
| `docs/reference/GEA_System_Schema.md` | `first_login_date`, `last_login_date` columns documented; DOB requirements corrected |
| `docs/testing/` | Sponsor requirement and DOB corrections applied to test scenes |
| `CLAUDE.md` | RSO Portal section added |

---

## Commits

```
b6209e3  feat(website): add Admin Login link in footer
a1f26eb  fix(admin): evaluate Admin.html as template so PORTAL_API_URL scriptlet resolves
a86fe93  Comment out Dev/Prod box in member.html
2c37996  Fix JS null errors after commenting out Dev/Prod box HTML
e88ce57  Add Admin Portal link to member login page
6a08377  Add loading spinner to membership application submit button
af4da0b  Fix three errors from membership application submission
119578d  Replace deprecated tpl_040/tpl_041 calls with semantic email templates
a952ea3  (PR #13 merge)
4908411  Fix BOARD_EMAIL_DELEGATED_USER to use real Workspace user account
8981d05  (PR #14 merge)
4488ab0  Revert incorrect getEmailTemplate() column index change
3460e7e  Fix active flag check to handle string "TRUE" from sheet
8aea4d6  Fix test function to use correct template name
e7197d7  Fix getEmailTemplate() column indices for Drive-based template system
d8fa664  (PR #16 merge)
052d5bb  Fix applicant login routing: pass is_applicant flag through _handleLogin
4c76ee8  Implement loadApplicantPortal() — was called but never defined
4301188  (PR #17 merge)
2966ff6  Fix session-resume routing: persist is_applicant in sessionStorage
0fb4fd4  Fix auth check pattern in applicant/payment handlers (auth.success → auth.ok)
6da1211  (PR #18 merge)
4d0f8a1  Change header title to "Applicant Portal" for applicant users
ba78492  (PR #19 merge)
728f2af  Fix first-login welcome email sent on every login
e926c86  (PR #20 merge)
e506c52  Fix applicant portal infinite recursion causing stack overflow on login
2994740  (PR #21 merge)
c1b2a36  Add post-login portal routing debug panel
cb39849  (PR #22 merge)
5212326  Improve Portal deployment-info debug traceability
dd8b033  (PR #23 merge)
f77480a  fix(portal): disable portal debug panel
fde5330  Refactor phone formatting and household primary contact display (#25)
4eaa44b  Implement RSO dual-role portal (rso_approve + rso_notify)
b6bb574  Enhance RSO Portal Implementation with dual-role architecture
b743e87  Add RSO Portal Implementation Plan and update related docs
1a2230b  (PR #26 merge)
fa72066  Add RSO email templates for document review and rejection workflow
2cff23e  Create ADM_DOCUMENT_APPROVED_BY_RSO_TO_MEMBER template
42d34de  Correct implementation plan: ADM_BOARD_APPROVED_AWAITING_RSO does not exist
bfc3c1b  Update RSO implementation plan to reflect actual status
d1e2112  Update RSO implementation plan with actual email templates
bc90795  Fix sidebar authorization mismatches for rso_approve role
62149ce  Fix sidebar authorization mismatches for rso_approve role
3a9e414  Update CLAUDE_Membership_Implementation.md STEP 6 with portal-based RSO workflow
763ad34  Update CLAUDE.md with RSO Portal documentation
757ec39  (PR #27 merge)
8762c56  Update Applicant Portal: adjust document requirements based on age
5889df5  Update Applicant Portal Help & Contact page: change references to Board
02430dc  Update staff document requirements to match over-18 applicants
d2d2d46  Clarify household staff document requirements in FAQ
d5f7d9a  Add date_of_birth field to schema and application requirements
0d44cbd  Add date of birth field to family members in membership application
93c3054  Correct date_of_birth requirements: children only, not adults
e592ddb  Add comprehensive Membership Application Guide for applicants
664968e  Fix: Only Community members require sponsors
6df8b56  Fix: Only Community members require sponsors in implementation doc
ab8e468  Fix: Testing scene to reflect Community-only sponsor requirement
88c7e2a  Fix: Only Community members require sponsors in eligibility flow
9516537  Add: Membership Dues Reference Audit
f8229df  Fix: Implement missing _calculateDuesAmount() function
8345021  (PR #28 merge)
```

---

## Current State

- **Applicant portal:** Stable. Login routing, session persistence, recursion, and welcome email bugs all resolved.
- **Email delivery:** Working. `treasurer@geabotswana.org` used as DWD impersonation user; Drive-based templates loading correctly.
- **RSO portal:** `rso_approve` and `rso_notify` roles live. Legacy `rso` aliased to `rso_approve`.
- **Membership dues calculation:** `_calculateDuesAmount()` implemented; payment amounts will now be correctly recorded and included in approval emails.
- **Membership Application Guide:** Published at `docs/guides/MEMBERSHIP_APPLICATION_GUIDE.md`.
- **Policy alignment:** Community-only sponsor requirement and children-only DOB collection corrected throughout codebase, docs, and test scenes.

---

## Pending Work

- `triggerRsoDailySummary` trigger (6am daily) — not yet created in Apps Script UI
- `sendHolidayCalReminder` — needs internal date guard before attaching to monthly trigger
- **RES.2.7** — daily approval reminder emails (`RES_APPROVAL_REMINDER_TO_BOARD` template + `sendApprovalReminders()`)
- **RES.5.5** — Calendar view (high complexity, deferred)
- **RES.6.1/6.2** — Household member calendar invites / invite other GEA members
- `mgt` and `rso_approve`/`rso_notify` admin accounts still need to be created via the Administrators page (only `board@` and `treasurer@` seeded)
- End-to-end applicant portal test run (Scenes 1–10) not yet completed
- Membership Application Guide needs board review before surfacing to applicants
