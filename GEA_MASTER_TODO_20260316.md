# GEA Management System — Master To-Do List

**Current Date:** March 20, 2026
**Owner:** Michael Raney (Treasurer)
**Status:** Mar 20, 2026 — NMP.4 ✅ COMPLETE. NMP.6-8 ✅ COMPLETE. RES.2 ✅ COMPLETE. RES.3 ✅ COMPLETE. RES.4 ✅ COMPLETE. RES.5.1-5.4 ✅ COMPLETE. SUP.1-4 ✅ COMPLETE. All 63 email templates verified. Comprehensive test suite updated (63 semantic names, reservation workflow, waitlist, guest list, monthly reports, email resend, admin handler tests). Schema fully aligned. xlsx snapshots removed from repo.

---

## ⚠️ IMPORTANT: Development Standards MUST BE FOLLOWED

**Before writing any code, Claude Code MUST read and follow:**

📄 **docs/development/DEVELOPMENT_STANDARDS.md**

This document establishes **mandatory standards** for:
- **JSDoc comments** on every function (purpose, parameters, returns, side effects, errors, examples)
- **Naming conventions** (camelCase variables, UPPER_SNAKE_CASE constants, verb-noun functions)
- **Code organization** (functions grouped by area, organized within files)
- **Error handling** (validate inputs, try-catch, graceful failures, logging)
- **Testing standards** (unit tests, integration tests, manual testing before deploy)
- **Logging & audit trails** (all significant operations logged to Audit_Logs)
- **Code review checklist** (use before committing)

**Core Principle:** Code is written for future maintainers (non-technical Board members and future developers), not for the original developer. Every function must be understandable without external help.

**🚫 This is NOT optional.** Every piece of code written for this project must comply with these standards.

---

## DISCOVERY TASK (DO THIS FIRST)

### D.0 — Assess Current Implementation Status

**PRIORITY: CRITICAL — Do this before anything else**

**What:** Claude Code reads this entire document, then reviews the actual codebase and spreadsheets to determine:
1. Which items listed as "TODO" are actually already completed
2. Which items are partially completed
3. Which items have dependencies that are/aren't met
4. Current state of all schemas, backend functions, frontend pages

**How:**
- Review GitHub commit history (since Feb 23, 2026) to see what's been built
- Review Google Apps Script files (Code.gs, various service modules)
- Review Google Sheets (Member Directory, GEA_Reservations.xlsx, System Backend)
- Review existing HTML portal files (Portal.html, Admin.html, etc.)
- Check Configuration sheet for any new settings
- Review Audit Log for recent activity

**Output:**
- Update this entire document with ACTUAL completion status
- Flag any items that have changed since originally written
- Note any NEW completed items not in this list
- Identify any items with unmet prerequisites
- Flag any items that are stuck or blocked

**Result:** This document becomes the authoritative source of truth for remaining work

**Status:** ✅ COMPLETE — Discovery executed Mar 16, 2026

#### D.0 Findings Snapshot (Mar 16, 2026)

**Evidence reviewed:** git history since Feb 23, 2026; Apps Script modules (`Code.js`, `ApplicationService.js`, `PaymentService.js`, `ReservationService.js`); portal files (`Portal.html`, `Admin.html`, `DocumentUploadPortal.html`); and spreadsheet snapshots (`GEA Member Directory (1).xlsx`, `GEA Reservations (1).xlsx`, `GEA System Backend (1).xlsx`, `GEA Payment Tracking (1).xlsx`).

**Completed since original draft:**
- ✅ Membership application workflow is implemented end-to-end (submit → board/RSO review → payment stage → activation)
- ✅ Payment Verification Module is implemented (member submit, treasurer verify/reject/clarify, reporting endpoints)
- ✅ File upload/document submission workflow is implemented (including RSO/GEA review states)
- ✅ Core reservations backend exists (limits, conflict checks, approvals, cancellation, guest-list deadline helpers)
- ✅ Security hardening and auth regression work completed in March sessions (token hashing, XSS hardening, tests)

**Partially complete (requires polish or spec alignment):**
- 🟡 Non-member/applicant experience exists inside `Portal.html` but not yet delivered as full spec-complete dedicated non-member portal package
- 🟡 Admin portal has substantial payment/applications tooling, but mobile-first polish items remain
- 🟡 Reservations implementation exists in code, but this document's schema/template assumptions are out of sync with current workbook headers and template inventory

**Dependencies and blockers identified:**
- ⚠️ Reservations sheet headers in snapshot differ from the richer process-spec field list; requires decision: extend schema now vs map existing simplified fields
- ⚠️ Reservation email template IDs/names in backend do not exactly match this plan's expected naming set; requires reconciliation matrix before final RES rollout
- ⚠️ Approval distro addresses still require board confirmation before production hardening

**New completed items not originally reflected in this plan:**
- ✅ Deployment sync metadata and DEV/PROD environment signaling completed
- ✅ Applicant login fix for inactive households completed
- ✅ Payment report and payment-verification admin UI shipped

---

## SECTION 0: IMMEDIATE PRIORITIES (Next 1-2 Weeks)

These items unblock critical testing paths and should be done first among active work.

### PRIORITY-1: Non-Member Portal (Full Build)

**Why:** You have a working membership application process and want to test it end-to-end. Non-members need a dedicated portal to view their application status, upload documents, manage household members, and submit payment verification. This is foundational for member onboarding.

**Dependencies:**
- ✅ Payment Verification Module (exists from Phase 2)
- ✅ Document Upload Portal (exists, designed in earlier sessions)
- ✅ Membership Application Workflow (fully implemented)
- ✅ File Upload backend (should exist)
- ⚠️ Household Member Editing (may need Phase 2 enhancement)

**Scope:** Build complete non-member portal from spec

#### NMP.0 — Review & Finalize Non-Member Portal Specification

**What:** Claude Code reviews `GEA_NonMemberPortal_Specification.md` in detail and notes any clarifications/dependencies needed before implementation

**Status:** 🟢 READY — Specification complete

**Predecessor:** D.0 (Discovery Task)

**Successor:** NMP.1

---

#### NMP.1 — Portal Routing & Authentication

**What:** Implement routing logic so non-active users (household.active = FALSE) are directed to non-member portal instead of member portal

**Implementation:**
- Modify Portal.html (or create entry point) to check household.active at login
- Route accordingly: `if (active) showMemberPortal() else showNonMemberPortal()`
- Reuse existing authentication (users already logged in)

**Status:** 🟡 PARTIAL — applicant routing exists (`is_applicant` flow), but dedicated non-member portal routing/spec parity still pending

**Prerequisite:** NMP.0 (spec review)

**Successor:** NMP.2

---

#### NMP.2 — Dashboard & Status Cards

**What:** Build landing page with 4 core cards:
1. Membership Status Card (always visible, color-coded badge + message)
2. Action Items Card (conditionally visible, highlights next steps)
3. Documents Progress Card (conditionally visible, upload status)
4. Quick Links Card (always visible, button grid)

**Implementation Details:** See GEA_NonMemberPortal_Specification.md Section 2

**Key Features:**
- Conditional visibility per application_status and membership_year_{{CURRENT_YEAR}}_status
- Dynamic status messages (pending/under_review/approved/rejected/inactive)
- Progress indicator for applicants (5-step timeline, visual)
- Color-coded badges (amber/green/red/gray)

**Status:** 🟢 COMPLETE (Mar 16, 2026) — dedicated non-member dashboard now renders 4-card layout (status, action items, documents progress, quick links) in applicant portal

**Prerequisite:** NMP.1 (routing)

**Data Sources:**
- Households sheet (active, application_status, membership_year_{{CURRENT_YEAR}}_status)
- Membership Applications sheet (application_status, submitted_date, etc.)
- File Submissions sheet (document upload status)

**Successor:** NMP.3

---

#### NMP.3 — Application Status Page (Timeline View)

**What:** Detailed workflow page showing 5-step application timeline

**Steps:**
1. Application Submitted ✅
2. Documents Uploaded (conditional ✅/⏳)
3. Board Approval (conditional ✅/⏳/❌)
4. Payment Verification (conditional ✅/⏳)
5. Membership Activated (conditional ✅/⏳)

**Each Step Shows:**
- Status indicator (✅/⏳/❌)
- Date (if applicable)
- Description
- Next action button (if applicable)

**Additional Sections:**
- Progress dates timeline
- Contact & FAQ section
- "View full status" link

**Visibility:** Show only if applicant (application_status not null) AND not rejected

**Status:** 🟢 COMPLETE (Mar 16, 2026) — application status page now renders standardized 5-step timeline (submitted, documents, board approval, payment verification, activation)

**Prerequisite:** NMP.2 (dashboard)

**Data Sources:**
- Membership Applications sheet (all status fields, dates)

**Successor:** NMP.4

---

#### NMP.4 — Payment Verification Page

**What:** Display expected membership dues and allow eligible users to submit payment verification

**Visibility Rules:**
```
Show page IF:
  - application_status = 'approved_pending_payment' OR
  - membership_year_{{CURRENT_YEAR}}_status = 'inactive'

Show form/button IF eligible (same as above)

Info-only (no form) IF applicant not yet approved
```

**Content Sections:**

**A. Dues Amount Display**
- Membership category
- Annual dues (USD)
- Current quarter (Q1/Q2/Q3/Q4)
- Pro-ration percentage (Q1 100%, Q2 75%, Q3 50%, Q4 25%)
- Pro-rated amount (USD)
- Exchange rate (Sunday's rate)
- Pro-rated amount (BWP equivalent)

**B. Payment Methods** (USD-preferred order per spec)
1. PayPal (USD) — with payment link button
2. SDFCU Member2Member (USD) — code GEA2025
3. Zelle (USD) — email geaboard@gmail.com
4. Absa (BWP) — account 1005193, branch 290267

**Each method shows:**
- Instructions
- Account details (as applicable)
- Pre-populated household reference

**C. Payment Submission Form** (when eligible)
- Membership year dropdown (pre-filled)
- Amount due display (read-only, updates on year change)
- Payment method dropdown
- Currency selector (USD/BWP)
- Amount paid field (numeric)
- Transaction date picker
- Reference field (auto-populated, read-only)
- File upload (optional, max 5MB)
- Notes field (optional, max 500 chars)

**D. Payment Status Display**
- Show previous submission status (if any)
- If verified: ✅ confirmation + next steps
- If submitted: ⏳ awaiting review
- If rejected: ❌ reason + resubmit instructions

**Implementation Notes:**
- Pro-ration calculation uses QUARTER_PERCENTAGES constants
- Exchange rate fetched from Configuration sheet (updated nightly)
- Dues fetched from Membership Pricing sheet (not hard-coded)
- All form validation before submission

**Status:** 🟢 COMPLETE (Mar 20, 2026) — `get_dues_info` backend route added; dues breakdown card (category, annual, quarter, %, pro-rated USD + BWP); live exchange rate via `getExchangeRate()`; SDFCU method added; real available-year dropdown from Membership Pricing; rejection reason + clarification note shown in status; all DOM manipulation uses textContent (XSS-safe)

**Prerequisite:** NMP.2 (dashboard), Payment Verification Module exists

**Data Sources:**
- Membership Applications sheet (application_status)
- Membership Pricing sheet (annual_dues_usd, active_for_payment)
- Configuration sheet (exchange_rate_usd_to_bwp)
- Payment Verifications sheet (previous submission status)

**Successor:** NMP.5

---

#### NMP.5 — Documents Page

**What:** Upload and manage documents required for membership application and household members

**Content Structure:**

**A. Primary Applicant Documents Section**
- One upload card per document type
- Status indicator (✅ Uploaded / ⏳ Pending)
- Upload/View/Delete/Replace actions
- File requirements (format, size, specs)
- Collapsible help text per document type

**Document Types:**
- Passport / National ID
- Proof of Address
- Passport-style Photo
- [Any others per category requirements]

**B. Household Member Documents Section**
- For each family member (spouse, children, staff)
- List of uploaded documents + status
- [Upload] button to add documents
- Document type selector on upload

**C. Upload Experience**
- Drag-and-drop zone + file picker button
- Upload progress bar
- Success/error messages
- File name, size, status display

**Visibility:** Show if applicant (application_status not null) AND not rejected

**Status:** 🟢 COMPLETE (Mar 16, 2026) — documents page implemented in Non-Member Portal with per-household-member upload/replace controls and document confirmation action

**Prerequisite:** NMP.1 (routing), File Upload Portal backend exists

**Data Sources:**
- File Submissions sheet (document uploads, status)
- Individuals sheet (household members)

**Successor:** NMP.6

---

#### NMP.6 — Household Management Page

**What:** Allow primary member to add, edit, and remove family members and household staff; upload documents for each

**Content Sections:**

**A. Household Overview**
- Household name, ID
- Primary member name/email/phone
- Count of family members, staff, total

**B. Family Members Section**
- Primary member (read-only)
- Spouse (if applicable): [Edit] [Remove]
- Children (list each): [Edit] [Remove]
- [+ Add Spouse] [+ Add Child] buttons

**C. Household Staff Section**
- For each staff member: name, role, employment dates, Omang #, phone
- [Edit Profile] [Remove from Household] buttons
- [+ Add Staff Member] button

**D. Edit Member Profile Modal**
- Pre-populated form: name, email, phone, DOB (if child)
- [Save Changes] [Cancel]

**E. Remove Member Modal**
- Confirmation prompt + warning
- Optional: reason for removal, departure date (for staff)
- [Confirm - Remove Member] [Cancel]

**F. Add Member Workflows**

**Add Spouse:**
- First/last name, email, phone
- Optional employment info
- [Add Spouse] [Cancel]

**Add Child:**
- First/last name, DOB
- Age threshold: 17+ = voting eligible
- [Add Child] [Cancel]

**Add Staff:**
- Name, role (dropdown), start date, end date
- Omang #, Omang expiry, phone (required), email (optional)
- [Add Staff Member] [Cancel]

**G. Document Upload for Members**
- Triggered by [Add Document] for family/staff
- Document type dropdown
- File upload area
- File requirements

**Visibility:** Show if applicant (application_status not null) AND not rejected

**Status:** 🟢 COMPLETE (Mar 19, 2026) — Household Management page implemented: overview card, family members card (add spouse/child, edit, remove), household staff card (add, edit, remove), modals for all actions. Backend: `get_household_members`, `add_household_member`, `remove_household_member`, `edit_household_member` routes + `deactivateMember()` in MemberService.js. All user data via textContent; closures for all event handlers.

**Prerequisite:** NMP.1 (routing)

**Data Sources:**
- Households sheet (primary member)
- Individuals sheet (spouse, children, staff)
- File Submissions sheet (member documents)

**Backend Requirements:**
- get_household_members (list all members)
- add_household_member (add spouse/child/staff)
- remove_household_member (remove member)
- edit_household_member (update member info)
- list_household_member_documents (get docs for member)

**Successor:** NMP.7

---

#### NMP.7 — Help & Contact Page

**What:** Provide self-service FAQ and contact mechanism for Treasurer

**Content Sections:**

**A. FAQ Section** (Collapsible, organized by topic)

**Topic 1: Application Process** (5-6 questions)
- Timeline, required documents, editing applications, rejection/reapply

**Topic 2: Payment & Membership** (5-6 questions)
- Activation timing, dues amounts, currency options, refunds

**Topic 3: Household & Family Members** (5-6 questions)
- Post-membership additions, child age thresholds, staff changes

**Topic 4: Technical & Access** (4-5 questions)
- Password reset, login issues, form visibility, payment status

Each Q&A is collapsible (click to expand)

**B. Contact Treasurer Form**
- Name field (auto-filled, read-only)
- Email field (auto-filled, optional override)
- Subject dropdown (Payment Question, Application Status, Household Update, General Inquiry)
- Message text area (max 1000 chars)
- Optional: Urgent checkbox
- [Send Message] [Cancel]
- Success message after submit

**C. Contact Info Display**
- Email: treasurer@geabotswana.org
- Phone: [if available, TBD]
- Office hours: [if available, TBD]
- Typical response time: 1-2 business days

**Status:** 🟢 COMPLETE (Mar 19, 2026) — Full FAQ (4 collapsible topic groups, 20 Q&As), contact form (subject dropdown, 1000-char textarea, urgent flag, success/error feedback) wired to `send_contact_message` backend route, and contact info card. Backend sends to `EMAIL_TREASURER` via MailApp with replyTo set to member email; logs `CONTACT_MESSAGE_SENT` to Audit Log.

**Prerequisite:** NMP.1 (routing)

**Backend Requirements:**
- Route to send contact form message (email to Treasurer, audit log entry)

**Successor:** NMP.8

---

#### NMP.8 — Navigation & Responsive Design

**What:** Complete navigation menu, routing between pages, and ensure full responsive design across all non-member portal pages

**Navigation Menu Items** (conditionally visible):

1. **Dashboard** (always)
2. **Application Status** (if applicant)
3. **Payment Verification** (if approved or inactive member)
4. **Documents** (if applicant, not rejected)
5. **My Household** (if applicant, not rejected)
6. **Help & Contact** (always)

**Desktop:** Fixed sidebar (250px) on left  
**Tablet (768px):** Hamburger menu, collapses to drawer  
**Mobile (<480px):** Full-screen overlay menu

**Responsive Design Requirements:**
- Desktop (1200px+): 2-3 column card grid
- Tablet (768px): 1-2 column, hamburger nav
- Mobile (480px): 1 column, full-width, hamburger nav
- No horizontal scrolling at any breakpoint
- All buttons ≥44×44px
- Keyboard navigation throughout
- WCAG AA accessibility compliance

**Conditional Visibility Matrix** (from spec):
- 6 statuses × 5 sections = 30 visibility rules
- See GEA_NonMemberPortal_Specification.md Section 8

**Status:** 🟢 COMPLETE (Mar 19, 2026) — Responsive layout implemented: hamburger toggle nav (desktop pill row → tablet/mobile collapsible drawer with aria-expanded/aria-current), 2-column dashboard card grid (→ 1-column at ≤768px), max-width container, edge-to-edge cards at ≤480px. All buttons ≥44px. ARIA roles on nav element.

**Prerequisite:** NMP.1-NMP.7 (all content pages)

**Successor:** NMP.9

---

#### NMP.9 — Testing & Deployment

**What:** Comprehensive testing of non-member portal across all user paths and breakpoints

**Test Scenarios:**
1. New applicant (awaiting_docs) — sees documents section, no payment
2. Under review applicant (under_review) — sees timeline, no payment
3. Approved applicant (approved_pending_payment) — sees payment form
4. Rejected applicant (rejected) — sees status only, limited actions
5. Lapsed member (inactive) — sees payment renewal form
6. Lapsed member with rejected docs (rejected_docs) — can resubmit

**Testing Checklist:**
- All pages load correctly per status
- Conditional visibility rules work (use matrix in spec)
- Forms validate correctly
- Payment pro-ration calculates correctly
- Documents upload/delete works
- Household member add/remove/edit works
- Contact form sends message
- All pages responsive at 3+ breakpoints
- No horizontal scrolling
- Keyboard navigation works
- Screen reader accessible (WCAG AA)

**Browser Testing:**
- Chrome/Edge (latest)
- Safari (latest)
- Firefox (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

**Device Testing (via DevTools or real devices):**
- Desktop (1200px+)
- Tablet (768px)
- Mobile (390px, 480px)

**Status:** 🟡 TODO

**Prerequisite:** NMP.8 (all pages complete)

**Result:** Non-member portal ready for production use

---

### PRIORITY-2: Admin Portal Polish (DEV/PROD Box + Mobile Responsiveness)

**Why:** Current admin portal is functional but needs UI improvements (DEV/PROD box positioning and visibility control) and mobile responsiveness. These are quick wins that improve usability for board members who may work on phones/tablets.

**Dependencies:**
- ✅ Admin portal HTML files exist
- ✅ Current CSS exists (may need enhancement)

**Scope:** 2 UI improvements + responsive design across admin portal

#### AP.0 — Assess Current Admin Portal State

**What:** Claude Code reviews existing Admin.html and related portal files to understand current layout, styling, and identify where changes need to be made

**Status:** ✅ COMPLETE (assessed in D.0)

**Successor:** AP.1

---

#### AP.1 — DEV/PROD Box UI Improvements

**What:** Implement 3 enhancements to DEV/PROD indicator box:

**A. Reposition to Bottom-Left Corner**
- Change positioning: `position: fixed; bottom: 20px; left: 20px;`
- Ensure not overlapping critical content on any screen size
- Maintain appropriate z-index (high but not blocking modals)

**B. Add Minimize/Collapse Toggle**
- Add small collapse button (chevron icon or `-` symbol) to box header
- When collapsed: show only thin bar or "DEV/PROD" text
- When expanded: show full box with environment label + status info
- Persist collapse state in localStorage (`gea_devprod_collapsed`)
- Smooth CSS transition animation

**C. Config Setting to Hide/Show Entire Box**
- Add config key in Configuration sheet: `show_devprod_box` (boolean: true/false)
- Default: true (show the box)
- Read config on portal load; only render box if true
- Allows Treasurer to hide without redeploying code

**Implementation:**
- Modify inline `<style>` or CSS file for positioning/animation
- Add JavaScript for localStorage persistence and config reading
- Update visibility toggle logic in portal initialization

**Status:** ✅ COMPLETE (Mar 16, 2026) — moved to bottom-left, added collapse toggle with localStorage persistence (`gea_devprod_collapsed`), and added runtime config visibility control via `show_devprod_box`

**Prerequisite:** AP.0 (current state assessment)

**Successor:** AP.2

---

#### AP.2 — Mobile Responsiveness for Admin Portal

**What:** Make admin portal usable on tablets and phones without horizontal scrolling

**Scope:** Audit existing CSS, add mobile breakpoints, ensure touch-friendly

**Implementation:**

**Step 1: Audit Current Layout**
- Review CSS for fixed pixel widths
- Identify which components don't scale responsively
- Note hard-coded breakpoints (if any)
- Check button sizes, spacing, form inputs

**Step 2: Add Mobile Breakpoints**
- Add media queries: `@media (max-width: 768px)` and `@media (max-width: 480px)`
- Ensure components adapt:
  - Navigation: hamburger menu on mobile, sidebar on desktop
  - Modals/panels: fit on screen, scrollable content
  - Cards/grids: stack to 1 column on mobile, 2+ on larger screens
  - Tables: scroll horizontally OR convert to card view on mobile
  - Spacing/padding: scales down appropriately

**Step 3: Touch-Friendly UI**
- All buttons/inputs: minimum 44×44 pixels on mobile
- Adequate spacing between tappable elements (min 8px margin)
- Form inputs: full-width or 90% width on mobile
- Dropdowns: work well on touch (may need custom styling)

**Step 4: Navigation & Header**
- Header: responsive, not eating up too much space on mobile
- Navigation: hamburger menu on <768px
- Side panels: off-canvas on mobile (slide in from side)

**Step 5: Modals & Overlays**
- Member/Reservation detail modals: don't open full-width on mobile
- Max-width on tablet/mobile (~90vw, ~500px)
- Scrollable content if taller than viewport
- Close button easy to tap

**Step 6: Testing at Breakpoints**
- Test in Chrome DevTools: iPhone 12 (390×844), iPad (768×1024), Galaxy Tab (800×600)
- No horizontal scrolling at any breakpoint
- All buttons/links tappable (no sub-5px margins)
- Font sizes readable (min 16px on body text)
- Forms work on mobile (keyboard behavior, submit visibility)
- Images scale responsively

**Status:** ✅ COMPLETE (Mar 16, 2026) — implemented mobile sidebar drawer/hamburger, touch-target sizing, tightened mobile spacing, and improved modal/content behavior at 768px and 480px breakpoints

**Prerequisite:** AP.0 (current state assessment)

**Files to Touch:**
- Admin.html (and other portal HTML files)
- Inline `<style>` tags or separate CSS files

**Successor:** AP.3

---

#### AP.3 — Testing & Deployment

**What:** Test DEV/PROD box and mobile responsiveness, ensure no regressions

**Testing Checklist:**

**DEV/PROD Box:**
- [ ] Box is in bottom-left corner
- [ ] Minimize toggle works (chevron appears, collapses smoothly)
- [ ] Collapsed state persists in localStorage
- [ ] `show_devprod_box = false` in Configuration hides box
- [ ] `show_devprod_box = true` shows box
- [ ] Box doesn't overlap critical content on any screen size

**Mobile Responsiveness:**
- [ ] Admin portal usable on tablet (768px) without horizontal scroll
- [ ] Admin portal usable on phone (390px) without horizontal scroll
- [ ] All buttons ≥44×44px
- [ ] Modals fit on mobile
- [ ] Navigation is hamburger menu on mobile
- [ ] Cards/grids stack properly
- [ ] Tested in Chrome DevTools at 3+ breakpoints
- [ ] No regressions in desktop view

**Status:** ✅ COMPLETE (Mar 16, 2026)

**Validation Notes:**
- DEV/PROD box implemented bottom-left with collapse state persisted in localStorage
- Runtime visibility toggle wired to `show_devprod_box` config lookup
- Mobile behaviors updated for 1024/768/480 breakpoints including hamburger/off-canvas nav and 44px touch targets

**Prerequisite:** AP.1, AP.2 (both improvements)

**Result:** Admin portal improved and mobile-ready

---

## SECTION 1: RESERVATIONS SYSTEM (Phases 2-4 Combined)

**Why:** Core facility booking system that enables members to reserve TC/BC and Leobo. This is a major feature with complex approval workflows.

**Overall Dependencies:**
- ✅ Reservations sheet schema (may need verification)
- ✅ Guest Lists sheet schema (may need verification)
- 🟡 Config.gs constants (may be partially complete)
- 🟡 Email templates (may be partially complete)
- ⚠️ Approval distro lists (needs confirmation)

**Impact:** Unlocks facility reservations for active members

### RES.PREP — Preparation Tasks for Reservations System

#### RES-PREP.1 — Verify Reservations & Guest Lists Sheet Schemas

**What:** Confirm that GEA_Reservations.xlsx has all required columns in both Reservations and Guest Lists tabs

**Required Columns (from Reservations Process Spec):**

**Reservations Tab:**
- reservation_id (unique key)
- household_id (FK)
- household_name (denormalized)
- facility (TC/BC or Leobo only)
- start_date, start_time, end_time (duration)
- status (pending, approved, denied, waitlisted, cancelled)
- approval_path (board_only, mgmt_then_board)
- board_approval_status, board_approval_date, board_approved_by
- mgmt_approval_status, mgmt_approval_date, mgmt_approved_by (if applicable)
- is_excess_booking (boolean)
- excess_approved_date (if applicable)
- bump_window_start, bump_expiration (if applicable)
- waitlist_position (if waitlisted)
- calendar_event_id
- created_date, last_modified_date
- notes
- [Additional tracking fields per spec]

**Guest Lists Tab:**
- guest_list_id
- reservation_id (FK)
- household_id (FK)
- guest_count
- guest_names_and_relationships (text area)
- submission_date, submission_status (submitted, acknowledged, rejected, final)
- rso_acknowledgment_date, rso_rejected_date
- rejection_reason (if rejected)
- marked_final_date (if early submission)
- [Additional fields per spec]

**Action:** Add any missing columns, verify data types, document schema

**Status:** ✅ VERIFIED (snapshot reviewed) — reservations/guest-list tabs exist but are simplified vs full spec; schema expansion decision required

**Prerequisite:** D.0 (Discovery)

**Reference:** GEA_Claude_Code_Task_List.md PREP-2, GEA_Reservations_Process_Spec.md Part 10b

**Successor:** RES-PREP.2

---

#### RES-PREP.2 — Define Config.gs Constants

**What:** Define all configuration constants needed for reservations system

**Required Constants (from Reservations Process Spec):**

**Calendar & Facilities:**
- RESERVATIONS_CALENDAR_ID (Google Calendar ID for reservations)
- FACILITY_TC_BC (Tennis Court/Basketball Court)
- FACILITY_LEOBO (Leobo/Covered Meeting Area)
- FACILITY_PLAYGROUND (walk-up only)
- FACILITY_GYM (walk-up only)

**Reservation Limits:**
- HOUSEHOLD_TC_BC_LIMIT_HOURS_PER_WEEK (3 hours)
- HOUSEHOLD_LEOBO_LIMIT_PER_MONTH (1 per month)

**Approval Rules:**
- EXCESS_BOOKING_DEFINITION (e.g., "beyond household limits")
- BUMP_WINDOW_DAYS (days before event when excess can be bumped)
- BOARD_APPROVAL_DEADLINE_DAYS (business days to review)
- RSO_APPROVAL_DEADLINE_DAYS (business days for RSO guest review)

**Email Distro Lists:**
- BOARD_EMAIL (board@geabotswana.org)
- MGT_EMAIL (mgt-notify@geabotswana.org for Embassy Management)
- RSO_EMAIL (rso-notify@geabotswana.org for RSO)
- TREASURER_EMAIL (treasurer@geabotswana.org)

**Timing & Notifications:**
- REMINDER_TIME_MORNING (6 AM GMT+2 for pending approvals)
- GUEST_LIST_SUBMISSION_DAYS_BEFORE_EVENT (X business days)
- GUEST_LIST_FINAL_CALL_DAYS_BEFORE_DEADLINE (1 day before deadline)

**Other:**
- WAITLIST_AUTO_PROMOTION_ENABLED (true/false)
- CALENDAR_COLOR_PENDING (color code for pending bookings)
- CALENDAR_COLOR_APPROVED (color code for approved bookings)

**Action:** Create/review Config.gs, add all constants, document their purpose

**Status:** ✅ COMPLETE (2026-03-28) — Full reconciliation done. Fixed `GUEST_LIST_DEADLINE_DAYS` 3→4 to match Configuration sheet. Added 8 missing constants: `FACILITY_PLAYGROUND` ("Playground"), `FACILITY_GYM` ("Fitness Center"), `RSO_APPROVAL_DEADLINE_DAYS` (5), `GUEST_LIST_FINAL_CALL_DAYS_BEFORE_DEADLINE` (1), `WAITLIST_AUTO_PROMOTION_ENABLED` (true), `REMINDER_TIME_MORNING` (6), `CALENDAR_COLOR_PENDING/APPROVED/DENIED/TENTATIVE` (CalendarApp.EventColor). Both walk-up facilities added to `ALL_FACILITIES` array. Also identified that `guest_list_deadline_days` and `guest_list_deadline_business_days` were duplicate sheet keys — removed the former; codebase uses only the `GUEST_LIST_DEADLINE_DAYS` constant (not a runtime sheet lookup). Configuration sheet cleaned of 3 duplicate rows. `docs/config/Configuration.csv` added to repo as read-only snapshot, updated nightly via `.github/workflows/export-configuration.yml`. Version bumped to 2.0.8.

**Prerequisite:** RES-PREP.1 (schema verified)

**Reference:** GEA_Claude_Code_Task_List.md PREP-3, GEA_Reservations_Process_Spec.md Part 10c

**Successor:** RES-PREP.3

---

#### RES-PREP.3 — Verify Email Templates

**What:** Confirm that all 16 email templates for reservations exist in GEA System Backend

**Required Templates:**
- tpl_020: Booking Received (to member)
- tpl_021: Booking Submitted (to board)
- tpl_022: Excess Booking Notice (to member)
- tpl_023: Excess Booking Alert (to board)
- tpl_024: Booking Approved (to member)
- tpl_025: Booking Denied (to member)
- tpl_026: Booking Denied (to board)
- tpl_027: Management Approval Needed (to mgmt)
- tpl_028: Management Approved (to board + member)
- tpl_029: Management Denied (to board + member)
- tpl_030: Approval Reminder (to board/mgmt)
- tpl_031: Guest List Submitted (to member)
- tpl_032: Guest List Deadline Approaching (final call to member)
- tpl_033: Guest List RSO Rejected (to member)
- tpl_034: Waitlist Added (to member)
- tpl_035: Waitlist Promoted (to member)

**Action:** Review GEA System Backend templates sheet, create any missing templates, document all 16

**Status:** 🟡 PARTIAL (Mar 19, 2026) — Drive-based semantic template system fully migrated (58 templates, all tpl_XXX calls replaced with semantic names in all service files). Reservation templates that exist: RES_BOOKING_RECEIVED_TO_MEMBER, RES_BOOKING_APPROVAL_REQUEST_TO_BOARD, RES_BOOKING_APPROVED_TO_MEMBER, RES_BOOKING_DENIED_TO_MEMBER, RES_BOOKING_DENIED_BOARD_COPY_TO_BOARD, RES_BOOKING_CANCELLED_TO_MEMBER, RES_BOOKING_PENDING_REVIEW_TO_MEMBER, RES_EXCESS_TENNIS_APPROVAL_REQUEST_TO_BOARD, RES_EXCESS_TENNIS_APPROVAL_REQUEST_TO_MEMBER, RES_LEOBO_APPROVAL_REQUEST_TO_MGT, RES_EXCESS_LEOBO_APPROVAL_REQUEST_TO_MGT, RES_EXCESS_LEOBO_APPROVAL_REQUEST_TO_MEMBER, RES_GUEST_LIST_DEADLINE_REMINDER_TO_MEMBER, RES_WAITLIST_SLOT_OPENED_TO_MEMBER, RES_LEOBO_LIMIT_REACHED_TO_MEMBER, RES_TENNIS_LIMIT_REACHED_TO_MEMBER, RES_HOLIDAY_CALENDAR_REMINDER_TO_MEMBER. Remaining gaps (management approved/denied, guest list submitted/RSO-rejected, approval reminders) to be created when RES.2+ backend is implemented.

**Prerequisite:** RES-PREP.2 (constants defined)

**Reference:** GEA_Claude_Code_Task_List.md PREP-4, GEA_Reservations_Process_Spec.md Part 10d

**Successor:** RES-PREP.4

---

#### RES-PREP.4 — Confirm Approval Distribution Lists

**What:** Confirm email addresses for all approval paths

**Confirm with Board:**
- board@geabotswana.org — List of all board members who review reservations
- mgt-notify@geabotswana.org — Embassy Management contacts for facility approval
- rso-notify@geabotswana.org — RSO contacts for guest list approval
- treasurer@geabotswana.org — Treasurer receives notifications (already confirmed)

**Action:** Verify these email addresses are correct and active, document in Config.gs

**Status:** ✅ COMPLETE (Mar 20, 2026) — All three distros confirmed active: board@geabotswana.org, mgt-notify@geabotswana.org, rso-notify@geabotswana.org. Already set correctly in Config.js (EMAIL_BOARD, EMAIL_MGT, EMAIL_RSO). No code change needed.

**Prerequisite:** D.0 (Discovery)

**Reference:** GEA_Claude_Code_Task_List.md PREP-5

**Successor:** RES.2.1

---

### RES.2 — Booking Submission & Approval Backend (Phase 2.2)

**Why:** Core booking logic that handles submission, limit enforcement, double-booking prevention, and approval routing

**Dependencies:**
- ✅ RES-PREP.1-4 complete (schemas, config, templates, distros)

**Scope:** Large, broken into sub-tasks

#### RES.2.1 — Household Booking Limits & Double-Booking Prevention

**What:** Implement backend logic to enforce household reservation limits and prevent double-booking

**Business Rules:**
- Tennis Court/Basketball Court (TC/BC): max 3 hours per household per calendar week
- Leobo: max 1 per household per calendar month
- Combined TC/BC + Leobo reservations are not allowed in a single booking request
- No overlapping time slots (no double-booking)

**Implementation:**
- Create function: `validateReservationLimits(householdId, facility, startDate, endTime)` → returns {valid: true/false, reason: "..."}
- Check household's existing reservations for facility
- Sum hours booked in current week (Sun-Sat) or month (1-31)
- Check against household limits
- Return validation result with reason if invalid

**Status:** ✅ COMPLETE (Mar 19, 2026) — `checkReservationLimits()`, `hasConflict()`, `getTennisHoursThisWeek()`, `getLeoboReservationsThisMonth()` all in ReservationService.js. `ALL_FACILITIES` constant added to Config.js (was missing, causing runtime error).

**Prerequisite:** RES-PREP.1 (schema), RES-PREP.2 (config)

**Reference:** GEA_Reservations_Process_Spec.md Part 1

**Successor:** RES.2.2

---

#### RES.2.2 — Excess Booking Detection & Marking

**What:** Identify bookings that exceed household limits and mark them for board review

**Business Rules:**
- If booking exceeds limits: mark `is_excess_booking = TRUE`
- Excess bookings require board approval
- Board can approve or deny excess bookings
- If approved, booking becomes provisional (can be bumped by another member within bump window)

**Implementation:**
- In reservation submission: check if limits exceeded
- If yes, set `is_excess_booking = TRUE`
- Set `approval_path = 'board_only'`
- Create approval record (status = 'pending')
- Notify board with special email template (tpl_023)

**Status:** ✅ COMPLETE (Mar 19, 2026) — `createReservation()` already sets `is_excess_reservation`, calculates `bump_window_deadline`, routes to pending status. Excess member notifications migrated from legacy `tpl_028`/`tpl_029` to `RES_TENNIS_LIMIT_REACHED_TO_MEMBER` and `RES_LEOBO_LIMIT_REACHED_TO_MEMBER`.

**Prerequisite:** RES.2.1 (limit validation)

**Reference:** GEA_Reservations_Process_Spec.md Part 5.1

**Successor:** RES.2.3

---

#### RES.2.3 — Calendar Event Creation with Status Tags

**What:** Create Google Calendar events for all reservations with status metadata

**Implementation:**
- Create function: `createCalendarEvent(reservation)` → calendar event ID
- Event title: `"[FACILITY] - [HOUSEHOLD_NAME] - [STATUS]"`
  - Example: `"Tennis Court - Smith Family - PENDING APPROVAL"`
  - Status tag: PENDING APPROVAL, APPROVED, DENIED, WAITLISTED
- Event time: reservation start/end time
- Event description: reservation details, household contact, approval status
- Event color: based on status (pending = orange, approved = green, denied = red)
- Store calendar_event_id in Reservations sheet

**Calendar Metadata:**
- Custom field or description text with:
  - reservation_id
  - household_id
  - approval_status
  - approval_path
  - links to admin portals

**Status:** ✅ COMPLETE (Mar 19, 2026) — `createCalendarEvent()` and `updateCalendarEventStatus()` added to ReservationService.js. Uses existing `CALENDAR_ID` constant and `calendar` OAuth scope. Events created on booking, updated (colour + title tag) on approve/deny/cancel and nightly bump-window auto-confirm. Colours: red=pending, yellow=tentative, green=confirmed, grey=cancelled.

**Prerequisite:** RES.2.2 (excess marking)

**Reference:** GEA_Reservations_Process_Spec.md Part 2

**Successor:** RES.2.4

---

#### RES.2.4 — Approval Routing Logic

**What:** Route bookings to correct approval path (board only vs. management first)

**Approval Paths:**

**Path 1: Board Only** (most bookings, TC/BC within limits)
- Reservations that don't exceed limits go directly to board
- Status: pending_board_approval
- Notify board only

**Path 2: Management Then Board** (Leobo and applicable excess bookings)
- Leobo and applicable excess bookings require Management approval first
- Only after Mgmt approval goes to Board
- Status progression:
  1. pending_mgmt_approval
  2. (Mgmt approves) → pending_board_approval
  3. (Board approves) → approved

**Implementation:**
- Create function: `determineApprovalPath(facility, isExcess)` → approval_path
- Set approval_path in reservation record
- Route approval notifications accordingly
- Update status based on approvers' responses

**Status:** ✅ COMPLETE (Mar 20, 2026) — Two-stage MGT→Board approval implemented in `approveReservation()`. Stage 1: MGT approves → records `mgt_approved_by`/`mgt_approved_date`, keeps STATUS_PENDING, notifies board via RES_LEOBO_MGT_APPROVED_TO_BOARD. Stage 2: Board gives final approval → CONFIRMED or TENTATIVE, notifies member. Sentinel: `mgt_approved_by` empty + `approverRole === "mgt"` triggers Stage 1; board can bypass MGT stage if needed.

**Prerequisite:** RES-PREP.4 (distros confirmed), RES.2.3 (calendar events)

**Reference:** GEA_Reservations_Process_Spec.md Part 2

**Successor:** RES.2.5

---

#### RES.2.5 — Email Notifications to Approvers

**What:** Send emails to board and/or management when reservations need approval

**Email Flows:**

**Board Approval Notification (tpl_021):**
- Recipient: board@geabotswana.org
- Content: Reservation details, facility, household, timing
- Link to admin portal to approve/deny
- Deadline: [BOARD_APPROVAL_DEADLINE_DAYS] business days

**Management Approval Notification (tpl_027):**
- Recipient: mgt-notify@geabotswana.org
- Content: Reservation details, facility, household, timing
- Link to admin portal to approve/deny
- Deadline: [RSO_APPROVAL_DEADLINE_DAYS] business days (or per spec)

**Excess Booking Alert (tpl_023):**
- Recipient: board@geabotswana.org
- Content: Excess booking notice, household limits, request for approval
- Link to admin portal

**Implementation:**
- Create function: `notifyApprovers(reservation)` → void
- Determine approvers based on approval_path
- Fetch email template
- Populate template with reservation details
- Send email via MailApp
- Log audit entry

**Status:** ✅ COMPLETE (Mar 19, 2026) — `_sendReservationNotifications()` sends to member (pending/confirmed), board (standard, excess tennis), MGT (leobo, excess leobo). Legacy tpl_ calls replaced with semantic template names. Member limit-reached notices use `RES_TENNIS_LIMIT_REACHED_TO_MEMBER` / `RES_LEOBO_LIMIT_REACHED_TO_MEMBER`.

**Prerequisite:** RES-PREP.3 (templates), RES.2.4 (routing)

**Reference:** GEA_Reservations_Process_Spec.md Part 1.4

**Successor:** RES.2.6

---

#### RES.2.6 — Admin Portal: Pending Approvals Interface

**What:** Build board/mgmt interface to view and act on pending approvals

**Location:** Admin.html (new "Pending Approvals" tab/view)

**Display:**
- List all pending approvals for logged-in approver
- Filter by type (Regular, Excess, Leobo)
- Show household, facility, time, approval deadline
- [Approve] [Deny] buttons

**Actions:**
- [Approve] → Set approval_status = 'approved', update calendar event, send notification to member, move to next stage (if Mgmt→Board path)
- [Deny] → Set approval_status = 'denied', send denial email to member, update calendar event

**Complexity:** Medium-High (involves data aggregation, multi-stage logic)

**Status:** ✅ COMPLETE (Mar 19, 2026) — Admin.html has `loadReservations()` (fetches pending, shows table), `openReservationDetail()` (real data from cache), `approveReservation()`, `denyReservation()`. Field name bugs (`res.date` → `res.event_date`, `res.member_name` → `res.household_name`) and hardcoded placeholder data fixed. Reservation detail modal now shows all fields from the actual reservation record.

**Prerequisite:** RES.2.5 (email notifications)

**Data Sources:**
- Reservations sheet (pending approvals, facility, household)
- Households sheet (household info)
- Admin user role (determine if board or mgmt)

**Successor:** RES.2.7

---

#### RES.2.7 — Approval State Machine & Daily Reminders

**What:** Manage reservation approval lifecycle and send reminders to approvers

**State Progression:**
```
submitted
├─ → pending_board_approval (if board_only path)
│   └─ → approved (board approves)
│   └─ → denied (board denies)
└─ → pending_mgmt_approval (if mgmt_then_board path)
    └─ → pending_board_approval (mgmt approves)
    │   └─ → approved (board approves)
    │   └─ → denied (board denies)
    └─ → denied (mgmt denies)
```

**Daily Reminder Trigger:**
- Time: 6 AM GMT+2 (part of runNightlyTasks)
- Find all reservations in "pending_*_approval" status
- For each, send reminder email to appropriate approver
- Email template: tpl_030 (Approval Reminder)

**Implementation:**
- Create function: `sendApprovalReminders()` → void
- Query Reservations for pending approvals
- Group by approver (board or mgmt)
- Send reminder email to each approver
- Log audit entries

**Status:** ✅ COMPLETE (Mar 28, 2026) — `sendReservationApprovalReminders()` in ReservationService.js (line 951) queries all STATUS_PENDING reservations and sends `RES_APPROVAL_REMINDER_TO_BOARD` digest to EMAIL_BOARD with PENDING_COUNT / PENDING_LIST / ADMIN_PORTAL_URL placeholders. Hooked into `runNightlyTasks()` as step 9. State machine: STATUS_PENDING is the single pending state; Leobo two-stage path (MGT → Board) tracked via `mgt_approved_by` field rather than separate status values. Template exists in Email_Templates_Sheet.csv and docs/email_templates/reservations/. All placeholders verified consistent.

**Prerequisite:** RES.2.6 (approval interface)

**Reference:** GEA_Reservations_Process_Spec.md Part 1.5

**Successor:** RES.3.1

---

### RES.3 — Guest List Workflow (Phase 3)

**Why:** Members must submit guest lists for events. RSO needs to vet guests. System must track deadlines and handle rejections.

**Dependencies:**
- ✅ RES.2 (booking approval complete)
- ✅ RES-PREP.3 (email templates)

#### RES.3.1 — Guest List Submission Form & Deadline Tracking

**What:** Build member-facing form to submit guest lists with deadline management

**Form Structure:**
- Displays after reservation is approved
- Dynamic guest list entry (add/remove rows without page refresh)
- For each guest: name, relationship to member, passport country
- Submit button (becomes disabled after deadline)
- Optional: "Mark as Final" button for early submission

**Deadline Logic:**
- Calculate deadline: [GUEST_LIST_SUBMISSION_DAYS_BEFORE_EVENT] business days before event
- Show countdown to member ("3 days remaining")
- Final-call email sent 1 day before deadline (tpl_032)

**Cases Handled:**
- Guest list submitted before deadline → Normal processing
- Guest list submitted at deadline → Normal processing
- Guest list submitted after deadline → Warning to member, RSO gets partial list
- Guest list marked as final → Immediate submission, no changes allowed
- No guest list submitted → RSO notified, member reminded

**Implementation:**
- Create function: `calculateGuestListDeadline(eventDate)` → deadline date
- Create function: `submitGuestList(reservationId, guestList)` → submission record
- Store submission with status = 'submitted'
- Check deadline, set final-call reminder
- Send confirmation email to member (tpl_031)

**Status:** ✅ COMPLETE (Mar 20, 2026) — `submitGuestList()` in ReservationService.js. Guest fields redesigned: first_name, last_name, age_group (over_18/under_18), id_number (required for over_18), save_to_profile. Validates all fields. Handles profile saves on submission. Portal.html shows "Submit Guest List" button for approved reservations with guests; modal has new fields, saved-guest picker ("Add from Saved Guests"), ID masking in picker. RES_GUEST_LIST_SUBMITTED_TO_MEMBER confirmed in Email Templates sheet.

**Prerequisite:** RES.2 (bookings approved), RES-PREP.3 (templates)

**Reference:** GEA_Reservations_Process_Spec.md Part 3

**Successor:** RES.3.2

---

#### RES.3.2 — RSO Guest Verification & Rejection Workflow

**What:** RSO reviews guest lists and approves/rejects guests

**RSO Interface:**
- List all pending guest lists awaiting RSO acknowledgment
- Display submitted guest list with member info
- [Approve All] or [Reject Some] buttons
- If rejecting: capture rejection reason for each guest
- Send decisions to member

**Member Notification:**
- If approved: "Guest list approved, expect confirmation closer to event"
- If partially rejected: "X guests rejected. Reason: [reason]. Please submit updated list."
- If all rejected: "All guests rejected. Please submit new list or contact RSO."

**Audit Trail:**
- Record RSO decision and timestamp
- Track rejection reasons
- Link to final approved guest list for facility staff

**Implementation:**
- Create function: `submitGuestListToRSO(guestListId)` → void (send to RSO)
- Create function: `rsoApproveGuestList(guestListId)` → void
- Create function: `rsoRejectGuests(guestListId, rejectedGuests)` → void
- Send member notification emails (tpl_033 for rejections)
- Update Guest Lists sheet with RSO decision

**Status:** ✅ COMPLETE (Mar 20, 2026) — Full redesign. Old whole-list acknowledge/reject replaced with per-guest review. Key functions: `saveGuestListDraft()` (saves partial decisions, sets status=in_review), `finalizeGuestListReview()` (validates all decisions, sets finalized, triggers emails). `saveGuestProfile()` upserts by (household_id, id_number). `getGuestHistoryByIdNumbers()` batch-lookups history across all finalized lists. Admin.html: per-guest radio cards (Approve/Reject), reject reveals reason textarea, history badge with clickthrough modal, Save Draft + Finalize Review buttons, status column (New/In Review). ID masking: last 4 digits visible in UI, full ID server-side only. Rejections go to board only via RES_GUEST_LIST_REJECTIONS_TO_BOARD — member notification is intentionally manual (board uses diplomatic discretion). All 3 guest list templates confirmed in Email Templates sheet.

**Prerequisite:** RES.3.1 (submission form)

**Reference:** GEA_Reservations_Process_Spec.md Part 3.5

**Successor:** RES.3.3

---

#### RES.3.3 — Final Guest List for Facility Staff

**What:** Generate final approved guest list for facility staff on event day

**Content:**
- Event date/time, facility, household contact
- All approved guests with names, countries
- Emergency contact for member
- Any special notes or restrictions

**Distribution:**
- PDF sent to facility staff email
- Accessible in admin portal
- Member can download for their own reference

**Implementation:**
- Create function: `generateFinalGuestList(reservationId)` → PDF
- Query approved guests from Guest Lists sheet
- Format nicely (table, clear layout)
- Store PDF reference for audit trail

**Status:** ✅ COMPLETE (Mar 19-20, 2026) — Implemented as `_sendApprovedGuestListToRso()` called from `finalizeGuestListReview()`. Sends approved-only guest list (name, masked ID, age group) to RSO as plain-text email. If any guests rejected, `_sendGuestListRejectionsToBoard()` sends board notification via RES_GUEST_LIST_REJECTIONS_TO_BOARD template with full approved/rejected lists and RSO reasons. PDF generation deferred.

**Prerequisite:** RES.3.2 (RSO approval)

**Reference:** GEA_Reservations_Process_Spec.md Part 3.6

**Successor:** RES.4.1

---

### RES.4 — Waitlist & Excess Booking Management (Phase 4)

**Why:** Members may want to book when their household limit is reached. System manages a waitlist and allows bumping of excess bookings within a window.

**Dependencies:**
- ✅ RES.2 (booking system)
- ✅ RES.2.2 (excess marking)

#### RES.4.1 — Waitlist Submission & Position Tracking

**What:** Allow members to join waitlist when facility is unavailable or limits exceeded

**Business Rules:**
- Member can join waitlist if:
  - Facility fully booked (all time slots taken), OR
  - Household exceeds limits (excess booking)
- Waitlist position: first in, first out
- Auto-promotion: when another booking is cancelled, promote next waitlisted member

**Implementation:**
- Separate Waitlist sheet (or use Reservations sheet with status = 'waitlisted')
- Track: waitlist_position, waitlist_date, auto_promote_eligible
- Create function: `addToWaitlist(householdId, facility, preferredDate)` → waitlist_id
- Send member notification email (tpl_034: Waitlist Added)

**Status:** ✅ COMPLETE (Mar 20, 2026) — `addToWaitlist(reservationId, placedBy, notes)` implemented. Sets STATUS_WAITLISTED, calculates position via `_countWaitlistedForFacility()` (per-week for Tennis, per-month for Leobo), records `board_approved_by`/`board_approval_timestamp`, sends RES_BOOKING_WAITLISTED_TO_MEMBER. Board routes it via `admin_waitlist` action; `_handleAdminPending` returns both PENDING and WAITLISTED reservations.

**Prerequisite:** RES.2.2 (excess booking detection)

**Reference:** GEA_Reservations_Process_Spec.md Part 5.2

**Successor:** RES.4.2

---

#### RES.4.2 — Excess Booking Approval & Bumping Window

**What:** Allow board to approve excess bookings and manage bump window

**Excess Booking Flow:**
1. Member submits excess booking (beyond household limits)
2. System marks as excess, sends alert to board (tpl_023)
3. Board approves or denies excess booking
4. If approved: booking becomes "provisional" with bump window
5. Bump window: [BUMP_WINDOW_DAYS] days before event
6. After bump window expires: booking becomes guaranteed (no longer bumpable)
7. If another member requests same time: can bump provisional booking

**Bump Process:**
- When reservation request conflicts with provisional excess booking:
  - Check if bump window is still open
  - If open: bump the excess booking, move to waitlist
  - Notify excess booking household of bump (email with compensation options)
- Bumped household can:
  - Accept waitlist position
  - Request reschedule
  - Contact board

**Implementation:**
- Add fields to Reservations: `bump_window_start`, `bump_expiration`, `is_bumpable`
- Create function: `approveBump(excessBookingId, replacementBookingId)` → void
- Create function: `notifyBump(householdId, originalDate, bumpReason)` → void (send email)
- Update calendar events to reflect bump/waitlist change

**Status:** ✅ COMPLETE (Mar 20, 2026) — `approveBump(reservationId, approvedBy, notes)` implemented. Promotes STATUS_WAITLISTED → CONFIRMED or TENTATIVE, updates calendar event, sends RES_BOOKING_APPROVED_TO_MEMBER. Board routes via `admin_approve_bump` action. `cancelReservation()` automatically calls `promoteFromWaitlist()` when a CONFIRMED/TENTATIVE booking is cancelled.

**Prerequisite:** RES.2.2 (excess marking), RES.4.1 (waitlist)

**Reference:** GEA_Reservations_Process_Spec.md Part 5.2-5.3

**Successor:** RES.4.3

---

#### RES.4.3 — Waitlist Auto-Promotion

**What:** Automatically promote waitlisted members when bookings are cancelled

**Trigger:**
- When reservation is cancelled or denied:
  - Check if waitlist exists for same facility/date
  - Promote first waitlisted member to reserved status
  - Update Reservations sheet with new reservation
  - Send member email (tpl_035: Waitlist Promoted)
  - Create calendar event

**Implementation:**
- Create function: `cancelReservation(reservationId, cancelReason)` → void
  - Set status = 'cancelled'
  - Call promoteFromWaitlist()
- Create function: `promoteFromWaitlist(facility, date)` → reservation_id (or null if no waitlist)
  - Query Waitlist for earliest entry
  - Create Reservation record
  - Update Waitlist (remove promoted entry)
  - Send promotion email
  - Create calendar event

**Status:** ✅ COMPLETE (Mar 20, 2026) — `promoteFromWaitlist(facility, reservationDate)` finds earliest STATUS_WAITLISTED for same facility in same week (Tennis) or month (Leobo), promotes to CONFIRMED/TENTATIVE, sends RES_WAITLIST_SLOT_OPENED_TO_MEMBER. `expireWaitlistPositions()` cancels waitlisted reservations within WAITLIST_HOLD_HOURS (24h) of event; called in `runNightlyTasks()` step 10.

**Prerequisite:** RES.4.1 (waitlist), RES.4.2 (bumping)

**Reference:** GEA_Reservations_Process_Spec.md Part 5.4

**Successor:** RES.5.1

---

## SECTION 2: MEMBER PORTAL INTERFACES (Phase 5)

**Why:** Members need to see and manage their reservations. These are frontend views built after backend is solid.

**Dependencies:**
- ✅ RES.2-4 (backend complete)

#### RES.5.1 — Member Portal: My Reservations View

**What:** Build member view of all household reservations with status and actions

**Content:**
- List all reservations (past & upcoming)
- Status badges:
  - 🟡 Pending (awaiting approval)
  - 🟢 Approved (confirmed)
  - ⏳ Waitlisted (in queue)
  - ❌ Denied (not approved)
  - ✅ Completed (past event)

**For Each Reservation:**
- Facility, date, time
- Status + color badge
- Household members attending (based on email selection)
- [Modify] button (if pending)
- [Cancel] button (if approved and >X days before event)
- [Add/Edit Guests] button (if approved)
- [Mark as Final] button (if guests not yet submitted)
- Link to view full reservation details

**Status:** ✅ COMPLETE (Mar 20, 2026) — `loadReservations()` in Portal.html fixed: corrected field names (`reservation_date`, `guest_count`), added Waitlisted badge, sub-notes for Pending/Waitlisted status, guest list deadline display, cancel enabled for Waitlisted. Guest list button shows deadline date.

**Prerequisite:** RES.2-4 (backend complete)

**Reference:** GEA_Claude_Code_Task_List.md 5.1

**Successor:** RES.5.2

---

#### RES.5.2 — Member Portal: Pending Approvals View

**What:** Show members current approval status of each booking

**Content:**
- Filter: Show pending, approved, denied (separate tabs or filters)
- For each pending: show approver, days remaining, action button
- If multiple stages (mgmt then board): show progress ("Awaiting Management Approval → Then Board")
- [View Details] link for each

**Status:** ✅ COMPLETE (Mar 20, 2026) — Enhanced status cell in `loadReservations()` in Portal.html. Leobo pending bookings now show a two-step MGT→Board progress indicator: MGT step turns green with ✓ once `mgt_approved_by` is populated, Board step shown in amber until approved. Tooltip note updates accordingly ("Awaiting management approval" vs "MGT approved — awaiting final board approval"). Tennis pending shows simple "Awaiting board review".

**Prerequisite:** RES.5.1

**Reference:** GEA_Claude_Code_Task_List.md 5.2

**Successor:** RES.5.3

---

#### RES.5.3 — Admin Portal: Pending Approvals View (Board)

**What:** Board interface to review and approve/deny pending reservations

**Content:**
- List all pending approvals for this board member
- Filter by: type (Regular, Excess, Leobo), facility, date range
- Show: household, facility, time, approval deadline, household usage stats
- [Approve] [Deny] buttons
- Link to full reservation details

**Household Usage Stats:**
- Show how many hours booked this week/month
- Show limits for this facility
- Highlight if household is already near limit (context for decision)

**Status:** ✅ COMPLETE (Mar 20, 2026) — Admin.html reservations table fixed: corrected field names, Waitlisted badge (badge-warning), MGT stage indicator for Leobo, Waitlist/Approve Bump buttons in detail modal (shown/hidden by status), `waitlistReservation()` and `approveBumpReservation()` JS functions wired to `admin_waitlist` and `admin_approve_bump` routes.

**Prerequisite:** RES.2.6 (basic approval interface), RES.5.2

**Reference:** GEA_Claude_Code_Task_List.md 5.3

**Successor:** RES.5.4

---

#### RES.5.4 — Admin Portal: Waitlist Management

**What:** Board view of all waitlisted bookings with position and auto-cancellation countdown

**Content:**
- List all waitlisted members (facility, preferred date, position in queue)
- Show waitlist position (1st, 2nd, 3rd, etc.)
- If applicable: countdown to auto-cancellation (e.g., "Auto-cancel in 7 days if not cleared")
- [Promote] button (to move to approved if facility opens up)
- [Deny] button (to remove from waitlist)
- [View Details] link

**Status:** ✅ COMPLETE (Mar 20, 2026) — New "Waitlist" page in Admin.html (⏳ nav item). Backend: `admin_waitlist_list` route → `_handleAdminWaitlistList()` returns all STATUS_WAITLISTED reservations sorted by facility/date/submission order. Table shows: position badge (orange circle), facility, event date, household + email, event name, guest count, days until event (highlighted if ≤7), auto-expire countdown (red if ≤48h). Promote → `admin_approve_bump`; Remove → `admin_deny`. Badge count shown in sidebar nav and refreshed on dashboard load.

**Prerequisite:** RES.4.1-4.3 (waitlist backend)

**Reference:** GEA_Claude_Code_Task_List.md 5.4

**Successor:** RES.5.5

---

#### RES.5.5 — Calendar View (Member & Admin)

**What:** Interactive calendar showing all reservations, color-coded by facility and status

**Features:**
- Month/week/day view
- Color coding: TC/BC=blue, Leobo=purple
- Status indication: pending=faded, approved=full color, cancelled=strikethrough
- Click to view reservation details
- Filters: show/hide by facility, household, status
- Print-friendly calendar view

**Complexity:** Very High (calendar library integration, data sync)

**Status:** ✅ COMPLETE (Mar 28, 2026) — Interactive calendar implemented in both portals. Admin (board/mgt): new "Reservation Calendar" sidebar page with month/week/day views, color coding (Tennis=blue, Leobo=purple), facility and status filters, print button, and click-to-detail via existing `resDetailModal`. New `admin_calendar` backend route and `getAllReservationsForCalendar()` in ReservationService.js. Member portal: List/Calendar toggle on Reservations page; month-grid calendar from cached reservation data; faded=pending, strikethrough=cancelled.

**Prerequisite:** RES.2-5 (all reservation features)

**Reference:** GEA_Claude_Code_Task_List.md 5.5

---

## SECTION 3: HOUSEHOLD MEMBER FEATURES (Phases 5-6)

**Why:** Household members need to be involved in reservations (invited to events, emails sent to them, etc.)

**Dependencies:**
- ✅ RES.2 (booking system)

#### RES.6.1 — Household Member Email Selection for Calendar Invites

**What:** Allow primary member to select which household member emails receive calendar invites

**Implementation:**
- When booking is approved, show list of household members
- Checkbox for each member: "Send calendar invite"
- Add checked members' emails to Google Calendar event
- All selected members receive invite with event details

**Status:** 🟡 TODO

**Prerequisite:** RES.2.3 (calendar events)

**Reference:** GEA_Claude_Code_Task_List.md 6.1

**Successor:** RES.6.2

---

#### RES.6.2 — Invite Other GEA Members

**What:** Allow members to search and invite other members (with privacy protection)

**Process:**
1. Member clicks "Invite Other Members"
2. Search by first name or last name (no email displayed, privacy)
3. Select member from results
4. System sends email to invited member with accept/decline link
5. Invited member clicks link, chooses to accept/decline
6. If accept: asked to select household member email to receive calendar invite
7. Both parties receive confirmation email
8. Invited members added to calendar event

**Privacy:**
- No email addresses shown in search results
- No member directory access
- Only names visible

**Implementation:**
- Create function: `searchGEAMembers(searchName)` → list of {individual_id, first_name, last_name}
- Create function: `inviteGEAMember(householdId, individualId, eventId)` → void (send email)
- Create accept/decline endpoint
- Update calendar event with accepted invites

**Status:** 🟡 TODO

**Prerequisite:** RES.6.1, RES.2.3 (calendar)

**Reference:** GEA_Claude_Code_Task_List.md 6.2

---

## SECTION 4: SUPPORT FEATURES & ADMINISTRATION

**Why:** System needs audit trails, reporting, and administrative tools to function smoothly

**Dependencies:** Vary by item

#### SUP.1 — Audit Log & Compliance Tracking

**What:** Maintain comprehensive audit trail of all reservations actions (submissions, approvals, denials, cancellations, bumps)

**Audit Log Entry Fields:**
- timestamp
- user (who took action)
- action (submitted, approved, denied, bumped, cancelled, etc.)
- target (reservation_id, guest_list_id, etc.)
- details (free-form notes)
- status_before, status_after

**Implementation:**
- Create Audit Log sheet in GEA System Backend
- Create function: `logAudit(action, target, details)` → void
- Call from all major functions (approval, denial, cancellation, bumping)
- Query for reports/compliance

**Status:** ✅ COMPLETE (general audit framework exists and is actively used); reservation-specific completeness depends on RES workflow finalization

**Prerequisite:** RES.2-4

**Successor:** SUP.2

---

#### SUP.2 — Monthly Collections Report (Payment Verification Update)

**What:** Generate monthly report of membership dues collected (from non-member portal payment verifications)

**Content:**
- Total members at month start/end
- New members joined (count + names)
- Payments verified (by method, by currency)
- Outstanding balance (members with unpaid dues)

**Timing:** Last Monday of each month (ready for Board meeting Tuesday)

**Implementation:**
- Create function: `generateMonthlyCollectionsReport(month)` → PDF or spreadsheet
- Query Payment Verifications for verified payments
- Query Membership Applications for new activations
- Generate summary + detailed table
- Email to board@geabotswana.org

**Status:** ✅ COMPLETE (Mar 20, 2026) — `sendMonthlyCollectionsReport()` in NotificationService.js. Runs automatically on last Monday of each month (`_isLastMondayOfMonth_()` check in `runNightlyTasks()`). Reports: active household count, new activations this month (`created_date` on Households), verified payments by method with USD+BWP totals, pending-verification count, outstanding dues list (active households with no verified payment for current membership year per `_getCurrentMembershipYear_()`). Plain-text email to EMAIL_BOARD.

**Prerequisite:** Payment Verification Module, non-member portal

**Reference:** GEA_Payments_Implementation.md Part G

---

#### SUP.3 — Reservations Reporting & Usage Analytics

**What:** Generate reports on facility usage, household patterns, popular times

**Reports:**
1. Monthly facility usage (hours booked per facility)
2. Household usage patterns (who books what, how often)
3. Popular time slots (demand analysis)
4. Approval stats (approved %, denial %, excess %, waitlist %)

**Implementation:**
- Query Reservations sheet with filters (date range, facility, status)
- Calculate aggregates
- Generate charts/graphs
- Store reports in Financial Records folder

**Status:** ✅ COMPLETE (Mar 20, 2026) — `sendMonthlyReservationsReport()` in NotificationService.js. Runs same nightly trigger as SUP.2. Shared `_buildReservationsReportStats_(refDate)` helper also powers on-demand `admin_reservations_report` API. Admin portal "Reports" page added to Admin.html with month picker, summary stat cards, and per-facility breakdown table. Charts/PDF deferred as future enhancement.

**Prerequisite:** RES.2-5 (reservation data)

---

#### SUP.4 — Administrative Functions for Treasurer

**What:** Tools for Treasurer to manage system configurations and overrides

**Functions:**
- Manual reservation approval (bypass workflow if needed)
- Manual waitlist promotion (if auto-promotion fails)
- Household limit overrides (special cases)
- Reservation cancellation (with reason)
- Guest list rejection override (if RSO unavailable)
- Email resend (if notification failed)

**Admin Interface:**
- Dedicated "System Administration" section in Admin.html
- Require password/MFA for sensitive actions
- Log all admin overrides to Audit Log
- Confirmation dialogs for destructive actions

**Status:** ✅ COMPLETE (Mar 20, 2026) — Most functions existed already: approval (approveReservation), bump promotion (approveBump), cancellation, guest list review. New: `resendReservationEmail()` backend + `admin_resend_email` route + "Resend Email" button in reservation detail modal (visible for Approved/Confirmed/Tentative/Waitlisted). Household limit overrides are handled operationally by approving excess bookings. MFA deferred (not architecturally supported).

**Prerequisite:** RES.2-5

---

## SECTION 5: FUTURE ENHANCEMENTS & MAINTENANCE

These items are planned but not required for initial launch.

### PHASE 7: Polish & Hardening

#### PHASE-7.1 — Improve "Excess Bookings" Messaging

**What:** Clarify to members what "excess booking" means and when they'll be informed of approval

**Enhancement:**
- Add contextual help text when member exceeds limits
- Explain approval timeline ("Board reviews within 3 business days")
- Explain bump window ("Your booking can be bumped up to 7 days before the event")
- Compensation options if bumped

**Status:** 🔴 TODO (post-launch)

---

#### PHASE-7.2 — Edge Case Handling

**What:** Address corner cases not covered in main implementation

**Examples:**
- Multi-week reservations (bookings spanning multiple weeks/months)
- Recurring reservations (weekly, monthly patterns)
- Facility maintenance windows (block certain dates)
- Holidays (special limit rules on holidays)
- Member birthdays (optional: discount or special access)

**Status:** 🔴 TODO (post-launch)

---

#### PHASE-7.3 — Admin Notification System

**What:** Allow Treasurer to configure who gets notified for what events

**Features:**
- Custom distribution lists per notification type
- Escalation rules (if no response after X days, notify backup)
- Do-not-disturb windows (no emails outside business hours)
- Notification digest (daily summary instead of individual emails)

**Status:** 🔴 TODO (post-launch)

---

### FUTURE FEATURES (Phase 8+)

#### Membership Renewal & Automated Reminders

**What:** Automate membership expiration reminders and renewal process

**Status:** 🔴 TODO (post-launch)

---

#### Post-Membership Family/Staff Addition Workflow

**What:** Allow active members to add family members or staff after initial membership

**Status:** 🔴 TODO (post-launch)

**Reference:** GEA_Membership_Implementation.md Future Features

---

#### Payment Plans & Installments

**What:** Allow Treasurer to set up payment installments for large families

**Status:** 🔴 TODO (post-launch)

---

## STATUS LEGEND

- 🟢 **DONE** — Completed, tested, deployed
- 🟡 **TODO** — Ready to implement (prerequisites met or not blocking)
- 🟠 **BLOCKED** — Waiting for prerequisites or clarification
- 🔴 **POST-LAUNCH** — Planned but not required for initial release

---

## QUICK START FOR CLAUDE CODE

**Session Priority (Recommended Order):**

1. **First:** Run D.0 (Discovery Task) to assess actual completion status
2. **Immediate:** Complete PRIORITY-1 (Non-Member Portal, phases NMP.0-NMP.9)
3. **Next:** Complete PRIORITY-2 (Admin Portal Polish, phases AP.0-AP.3)
4. **Then:** Complete RES.PREP (Prep tasks for reservations system)
5. **Then:** Build Reservations System (RES.2-6 backend, RES.3-4 guest lists, RES.5+ frontend)
6. **Finally:** Support features (SUP.1+) and future enhancements

**Rationale:**
- Discovery confirms what's actually done
- Non-member portal unblocks testing of membership application
- Admin portal polish improves usability
- Reservations prep ensures schema/config/templates are ready
- Reservations system is large and depends on all prep being complete
- Support features are maintenance, can come after core features

---

## Key Reference Documents

- **GEA_NonMemberPortal_Specification.md** — Complete non-member portal spec with all details
- **GEA_Reservations_Process_Spec.md** — Complete reservations workflow spec
- **GEA_Payments_Implementation.md** — Payment verification and membership activation
- **GEA_Membership_Implementation.md** — Membership application workflow (already implemented)
- **GitHub Repo:** RaneyMD/GEA_Portal

---

**Last Updated:** March 16, 2026  
**Status:** Discovery executed Mar 16, 2026; this document now updated with current implementation realities and remaining gaps  
**Contact:** Michael Raney (Treasurer)
