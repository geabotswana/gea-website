# GEA Management System—Claude Code Task List

**Current Date:** Monday, February 23, 2026  
**Status:** Ready for Session 1 (Tonight)  
**Owner:** Michael Raney

---

## Overview

This task list is organized into **Phases** (logical groupings) and **Sessions** (execution windows). Each item includes complexity assessment, dependencies, and testing requirements.

**Key Reference Documents:**
- **Reservations Process Spec**: `/mnt/user-data/outputs/GEA_Reservations_Process_Spec.md` (comprehensive guide for Phase 2.2 and beyond)
- **GitHub Repo**: RaneyMD/GEA_Portal
- **Development Workflow**: `git pull` → `clasp pull` → Claude Code edits → `clasp push` → test → `git commit` → `git push`

---

## PHASE 1: Quick Wins & Public Site Refresh
**Target: Session 1 (Tonight) — ~45-60 minutes (or split across 2 short sessions)**

These are low-complexity, high-impact items with no dependencies. Complete these first.

### 1.0 — Commit .md Files to Repository

**What:** Commit any .md documentation files to Git that aren't already in the repo (e.g., GEA_Claude_Code_Task_List.md, GEA_Reservations_Process_Spec.md, GEA_Board_Bios.md, and any others created).

**Location:** GitHub repo root and appropriate subdirectories

**Implementation:**
- Check what .md files are untracked: `git status`
- Add them: `git add *.md` or `git add [specific files]`
- Commit with descriptive message: `git commit -m "Add documentation: task list, reservations spec, board bios"`
- Push to GitHub: `git push`

**Why:** Documentation files should be version-controlled so they're available to collaborators and future maintainers. This ensures the task list, specifications, and bios are preserved in the repo history.

**Complexity:** ⭐ Very Low (~2 minutes)

**Testing:**
- Verify files appear in `git status` as tracked
- Check GitHub repo to confirm files are there
- Confirm files are accessible from the repo for future reference

**Successor Impact:** ✅ High positive impact; enables documentation to be tracked and maintained alongside code

---

### 1.1 — Implement iframe Embedding for Member Area (Domain Masking)

**What:** Enable the geabotswana.org homepage to embed the Google Apps Script web app cleanly via iframe, so users see geabotswana.org in the browser URL bar rather than the long script.google.com URL.

**Location:** Google Apps Script backend (main web app file; likely in `doGet()` or relevant `HtmlService.evaluate()` calls)

**Implementation:**
- Add `setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)` to all HtmlService.evaluate() calls in the web app
- Example pattern:
  ```javascript
  return HtmlService
    .createTemplateFromFile('TemplateName')
    .evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);  // ADD THIS LINE
  ```

**Why:** Allows geabotswana.org to embed the authenticated interface in an iframe; users see the clean domain without exposing the Google Apps Script URL in the address bar.

**Complexity:** ⭐ Very Low (~5 minutes)

**Testing:**
- Push code to Apps Script
- In index.html, verify the iframe loads without errors
- Click "Member Area" link on geabotswana.org
- Confirm: (a) geabotswana.org stays in address bar, (b) login/auth still works, (c) embedded interface loads

**Successor Impact:** ✅ Zero additional complexity; maintains current architecture

---

### 1.2 — Update index.html with New Executive Board Bios and Photos

**What:** Replace current board member bios and photos with:
- **Sacha Fraiture** (Chairperson)
- **Michael Raney** (Treasurer)
- **Maria Ester Becerro** (Secretary)

**Bios Provided:** ✅ (See spec doc above)

**Photos:** 📋 Ready to go (edited already)

**Location:** GitHub repo; index.html (likely in a "Board" or "Leadership" section)

**Implementation:**
- Update HTML with new bio text
- Upload board photos to Google Cloud Storage (gea-public-assets bucket)
- Generate HTTPS URLs for photos
- Embed photo URLs in index.html with `<img src="https://storage.googleapis.com/gea-public-assets/...">`

**Complexity:** ⭐⭐ Low (straightforward content + asset upload)

**Testing:**
- Verify text displays correctly
- Test photos load via HTTPS on different browsers
- Confirm responsive design on mobile

**Files:**
- `index.html` (GitHub)
- Photos → Google Cloud Storage bucket

---

### 1.3 — Correct Facilities Descriptions in index.html

**What:** Update three facility descriptions:

1. **Tennis Court** → Rename to "Tennis Court / Basketball Court" (clarify dual use)
2. **Leobo** → Rename "Reception Hall" → "Covered Meeting Area" (accurate description; no walls)
3. **Booking Approval Text** → Clarify approval workflows:
   - **Leobo & Whole Facility bookings** → Require GEA Board AND Embassy Management approval
   - **Guest lists** → Require Embassy RSO approval

**Location:** GitHub repo; index.html (facilities section, likely info boxes)

**Implementation:**
- Update facility names/descriptions in HTML
- Update approval requirement text boxes for clarity
- Example format:
  ```
  Leobo (Covered Meeting Area)
  [Description of space]
  
  Booking Requirements:
  - Approval by GEA Board and Embassy Management required
  - Guest lists require Embassy RSO acknowledgment
  ```

**Complexity:** ⭐⭐ Low (content updates only)

**Testing:**
- Verify all three descriptions display correctly
- Ensure text is clear to non-technical users
- Check mobile responsiveness

**Files:**
- `index.html` (GitHub)

---

### 1.4 — Add Playground & Gym Facilities to index.html + Clarify "Rec Center"

**What:** Add two new facilities to the website and clarify facility location groupings:

1. **Playground** (at Rec Center) — Walk-up only, no reservations
2. **Gym** (separate location) — Walk-up only, no reservations
3. **Rename "Whole Facility"** → "Rec Center" for clarity (includes Tennis Court/Basketball Court + Leobo/Covered Meeting Area only; does NOT include Playground or Gym)

**Location:** GitHub repo; index.html (facilities section)

**Implementation:**
- Add Playground section with description/photo
- Add Gym section with description/photo (note separate location)
- Update "Whole Facility" to "Rec Center" throughout, clarifying what it includes:
  ```
  Rec Center
  The Rec Center includes the Tennis Court/Basketball Court and Covered Meeting Area (Leobo).
  [Description]
  
  Booking Requirements:
  - Approval by GEA Board and Embassy Management required
  ```
- Add note under Playground and Gym: "Open to members during operating hours. No reservation required."

**Details Needed from You:** 📋
- Playground: Short description, hours of operation, key amenities, any restrictions (age groups, supervision requirements, etc.)
- Gym: Short description, location address/directions, hours of operation, key equipment/amenities, capacity/restrictions
- Photos for Playground and Gym (for upload to GCS, similar to board photos)

**Complexity:** ⭐⭐ Low (content + photos)

**Testing:**
- Verify all facility descriptions display correctly
- Ensure location clarity (Rec Center vs. separate gym location)
- Confirm "no reservation" message is clear for Playground & Gym
- Check mobile responsiveness

**Files:**
- `index.html` (GitHub)
- Photos → Google Cloud Storage bucket (once provided)

**Impact on Reservation System:** ⚠️ Important update to Config.gs:
- Update any references from "Whole Facility" to "Rec Center" in reservations backend
- Ensure Playground & Gym are explicitly excluded from reservation logic
- This should be done during PREP-3 (Config.gs review)

---

## PHASE 2: Content Integration & Backend Architecture (Sessions 2-3)

**Prerequisite:** Phase 1 complete; Prep Tasks complete (see below)

These items prepare the backend for the complex approval workflows in Phase 2.2.

### 2.1 — Upload Board Member Photos to GCS & Update index.html

**What:** Move board member photos from local to Google Cloud Storage and embed them in the website.

**Location:** GCS bucket (gea-public-assets); index.html

**Implementation:**
1. Upload 3 edited photos to `gea-public-assets` bucket
2. Generate public HTTPS URLs
3. Update index.html `<img>` tags with GCS URLs
4. Push to GitHub

**Complexity:** ⭐⭐ Low-Medium (involves GCS + HTML updates)

**Testing:**
- Verify photos load via HTTPS
- Test on different devices/browsers
- Confirm accessibility (alt text present)

**Prerequisite:** Board photos edited and ready (✅ complete)

---

### 2.2 — Develop & Test Approval Workflow Backend Logic ⚠️ COMPLEX

**What:** Build the core backend logic for the multi-stage approval workflow. This is the foundational piece for all future reservation work.

**Scope:** This task is LARGE. It includes:
- Household booking limit enforcement (TC/BC 3hrs/week, Leobo 1/month)
- Double-booking prevention
- Excess booking detection & marking
- Calendar event creation with proper status tags
- Approval routing logic (Board only vs. Mgmt→Board)
- Approval state machine management
- Email notifications to approvers
- Daily reminder triggers for pending approvals
- Approval/denial handling
- Calendar event status updates
- Member notification of approval status

**Recommendation:** Break this into sub-tasks:
- **2.2a:** Household limit enforcement + double-booking prevention
- **2.2b:** Calendar event creation + status tagging
- **2.2c:** Approval routing + email notifications
- **2.2d:** Reminder trigger + state management
- **2.2e:** Comprehensive testing with dummy data

**Location:** Google Apps Script backend (multiple functions)

**Complexity:** ⭐⭐⭐⭐⭐ Very High (core business logic)

**Reference:** GEA_Reservations_Process_Spec.md (Parts 1-2 detail all requirements)

**Prerequisites:**
- ✅ PREP-2: Reservations sheet schema columns added
- ✅ PREP-4: Config.gs constants defined
- ✅ PREP-5: Approval distro lists confirmed

**Testing:** Comprehensive dummy data validation
- Create test reservations that trigger each approval path
- Verify email notifications are sent to correct distros
- Test denial/approval flows
- Verify calendar events created with correct metadata
- Test reminder triggers at 6 AM Botswana time

**Estimated Duration:** 3-4 hours (across multiple sessions)

---

## PHASE 3: Guest List Workflow (Sessions 4-5)

**Prerequisite:** Phase 2.2 complete

### 3.1 — Develop Guest List Submission & Deadline Workflow

**What:** Build the guest list form, deadline tracking, and RSO notification system.

**Scope:**
- Dynamic guest list form (add/remove rows without page refresh)
- Deadline calculation (X business days before event)
- Automated final-call emails (1 day before deadline)
- Deadline-passed logic (Cases A-D in spec)
- Early submission option ("Mark as Final")
- RSO notification & acknowledgment

**Location:** Google Apps Script + Member Portal frontend

**Complexity:** ⭐⭐⭐⭐ High (involved form logic + scheduling)

**Reference:** GEA_Reservations_Process_Spec.md (Part 3)

**Testing:**
- Submit guests at various points (before deadline, at deadline, after deadline)
- Verify automated emails trigger correctly
- Test early submission / "Mark as Final" flow
- Verify RSO gets correct guest list

**Estimated Duration:** 2-3 hours

---

### 3.2 — RSO Guest Rejection & Member Notification

**What:** Build RSO decision page, rejection flow, and member notifications.

**Scope:**
- RSO acknowledgment page (approve/reject guests)
- Rejection reason capture
- Member email notification of rejections
- Final guest list generation for facility staff
- Audit trail in Guest Lists sheet

**Location:** Google Apps Script + Admin Portal

**Complexity:** ⭐⭐⭐ Medium-High

**Reference:** GEA_Reservations_Process_Spec.md (Part 3.5)

**Estimated Duration:** 1.5-2 hours

---

## PHASE 4: Waitlist & Excess Booking Management (Sessions 6-7)

**Prerequisite:** Phase 2.2 complete

### 4.1 — Excess Booking Approval & Bumping

**What:** Implement excess booking board approval and automatic bumping when another member requests the same time slot.

**Scope:**
- Mark excess bookings clearly
- Provide "bump window" (X days before event)
- Auto-approve after bump window passes if not bumped
- Manage waitlist queue positions
- Promote waitlisted bookings when primary is cancelled

**Location:** Google Apps Script backend

**Complexity:** ⭐⭐⭐⭐ High (state machine logic)

**Reference:** GEA_Reservations_Process_Spec.md (Part 5.1-5.2)

**Estimated Duration:** 2-2.5 hours

---

## PHASE 5: Frontend Interface Development (Sessions 8+)

**Prerequisite:** Phase 2.2-4 complete (backend solid)

### 5.1 — Member Portal: My Reservations View

**What:** Build the member view of their household's reservations with status badges and action buttons.

**Scope:**
- List all reservations (past & upcoming)
- Status badges (Pending, Approved, Waitlisted, Cancelled)
- [Modify], [Cancel], [Add Guests], [Mark Final] buttons (contextual visibility)
- Guest list display

**Complexity:** ⭐⭐⭐ Medium

**Estimated Duration:** 1.5-2 hours

---

### 5.2 — Member Portal: Pending Approvals View

**What:** Show members the current approval status of each booking.

**Complexity:** ⭐⭐⭐ Medium

**Estimated Duration:** 1-1.5 hours

---

### 5.3 — Admin Portal: Pending Approvals View (Board)

**What:** Show board members reservations awaiting their approval with decision buttons.

**Scope:**
- Filter by type (Regular, Excess, Leobo, Whole Facility, Waitlisted)
- Household usage statistics
- [Approve], [Deny] buttons
- Link to full reservation details

**Complexity:** ⭐⭐⭐⭐ High (involves data aggregation)

**Estimated Duration:** 2-2.5 hours

---

### 5.4 — Admin Portal: Waitlist Management

**What:** Board view of all waitlisted bookings with position tracking and auto-cancellation countdown.

**Complexity:** ⭐⭐⭐ Medium

**Estimated Duration:** 1-1.5 hours

---

### 5.5 — Calendar View (Member & Admin)

**What:** Interactive calendar showing all reservations, color-coded by facility, with filters.

**Complexity:** ⭐⭐⭐⭐⭐ Very High (calendar library integration, data visualization)

**Estimated Duration:** 3+ hours

---

## PHASE 6: Household Member Invite System (Sessions 8-9)

**Prerequisite:** Phase 2.2 complete

### 6.1 — Household Member Email Selection & Invites

**What:** Allow members to select which household member emails receive calendar invites.

**Scope:**
- Display household member email options with checkboxes
- Add selected emails to Google Calendar event invites
- All selected members receive calendar invite with event details

**Complexity:** ⭐⭐⭐ Medium

**Reference:** GEA_Reservations_Process_Spec.md (Part 4)

**Estimated Duration:** 1.5-2 hours

---

### 6.2 — Invite Other GEA Members

**What:** Allow members to search by name and invite other members (names hidden, privacy protected).

**Scope:**
- Member search by name
- Send system email to invited member with accept/decline link
- Accept/decline page with email selection
- Confirmation emails to both parties
- Add accepted members to calendar event

**Complexity:** ⭐⭐⭐⭐ High (email delivery, accept/decline flow)

**Estimated Duration:** 2-2.5 hours

---

## PHASE 7: Polish & Hardening (Future)

### 7.1 — Improve "Excess Bookings" Messaging
### 7.2 — Add Edge Case Handling
### 7.3 — Implement Admin Notification System

---

---

## PREP TASKS (Complete Before Relevant Phases)

All prep tasks are listed in the Reservations Process Spec document (Part 10b-10e).

### PREP-1: Photo Editing ✅ COMPLETE
- Status: Photos edited and ready

### PREP-2: Reservations Sheet Schema Setup (Before Phase 2.2)
- Add 10+ columns to Reservations tab
- Add 8+ columns to Guest Lists tab
- Status: TODO

### PREP-3: Config.gs Constants Definition (Before Phase 2.2)
- Define all calendar, facility, limit, and email configuration variables
- Status: TODO

### PREP-4: Email Templates Review (Before Phase 2.2)
- Verify all 16 email templates exist in GEA System Backend
- Create any missing templates
- Status: TODO (review needed)

### PREP-5: Approval Distro Lists (Before Phase 2.2)
- Confirm emails for board@geabotswana.org, mgt-notify@geabotswana.org, rso-notify@geabotswana.org
- Status: TODO

---

## SUGGESTED SESSION BREAKDOWN

| Session | Target | Items | Duration | Status |
|---------|--------|-------|----------|--------|
| **Tonight (1)** | Git cleanup + site refresh | 1.0, 1.1, 1.2, 1.3, 1.4 | ~45-60 min | 🟡 Ready (needs details for 1.4) |
| **Session 2** | Prep + Photo integration | PREP tasks, 2.1 | ~1 hour | 🟡 Ready after prep |
| **Session 3** | Core approval backend | 2.2 (broken into sub-tasks) | 3-4 hours | 🔴 Depends on schema |
| **Session 4** | Guest list workflow | 3.1, 3.2 | 3-4 hours | 🔴 Depends on 2.2 |
| **Session 5** | Waitlist & excess mgmt | 4.1 | 2-2.5 hours | 🔴 Depends on 2.2 |
| **Sessions 6-8** | Frontend interfaces | 5.1-5.5 | 8+ hours | 🔴 Depends on phases 3-4 |
| **Sessions 9-10** | Member invites | 6.1, 6.2 | 4+ hours | 🔴 Depends on 2.2 |

---

## NOTES FOR SUCCESS

✅ **Before Tonight:**
- Review GEA_Reservations_Process_Spec.md
- Ensure photos are edited and ready
- Confirm iframe approach is acceptable

✅ **During Each Session:**
- Use the standard git/clasp workflow
- Add code comments explaining approval logic (for your successor's benefit)
- Test with dummy data before committing
- Keep this task list updated as you progress

✅ **Before Phase 2.2 Starts:**
- Complete all PREP tasks (schema columns, Config.gs, templates, distro lists)
- Review the Reservations Process Spec in detail
- Have decision-making authority ready (e.g., confirm distro lists with board)

✅ **Long-term Maintainability:**
- Document all approval state transitions
- Comment on calendar event metadata structure
- Keep the Reservations spec updated as you discover edge cases
- Build comprehensive test data sets

---

## Key Files & References

- **Reservations Spec**: `/mnt/user-data/outputs/GEA_Reservations_Process_Spec.md`
- **GitHub Repo**: RaneyMD/GEA_Portal
- **Config.gs**: Configuration variables (update before 2.2)
- **GEA_Reservations.xlsx**: Reservations & Guest Lists sheets (update before 2.2)
- **GEA_System_Backend.xlsx**: Email Templates (verify before 2.2)

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-23 | Michael Raney & Claude | Initial comprehensive task list; ready for Phase 1 |
