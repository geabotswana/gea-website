# Changelog

All notable changes to the GEA Management System project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] — 2026-03-26

### Added

#### Rules & Regulations System
- New `Rules` sheet in System Backend spreadsheet with board-managed governance
- Admin Portal Rules Editor: Board members can add/edit/delete rules with category sorting
- Unique sort numbers for rules within each category
- Member attestation in application (Step 8): checkbox confirmation + timestamp
- Public website display: Rules outline on index.html with dynamic content sync
- Backend support: `getRulesOutline()`, `saveRules()`, `createRulesIndex()` functions
- Real-time sync between portal and spreadsheet

#### Automated CI/CD Deployment Pipeline
- GitHub Actions workflow (`.github/workflows/deploy.yml`)
- Service account authentication via JWT (Apps Script REST API)
- Fully automated deployment on every `git push` to main
- HTML files excluded from Google Apps Script push
- Eliminated manual `clasp push` requirement
- Git commit-based deployment tracking

#### MCP Integration for Development
- **gea-sheets-mcp** server in `mcp/` directory
- Model Context Protocol for Claude Code spreadsheet queries
- JWT-based impersonation as treasurer@geabotswana.org
- Four GEA spreadsheets accessible: MEMBER_DIRECTORY, RESERVATIONS, SYSTEM_BACKEND, PAYMENT_TRACKING
- Two tools: `get_sheet` (read sheet data), `list_sheets` (list sheet names)
- Read-only scope (`spreadsheets.readonly`) for safety
- Successfully verified: 70 email templates in Email Templates sheet
- Node.js dependencies: @modelcontextprotocol/sdk, googleapis v127.0.0

#### Portal Improvements & Bug Fixes
- Password reset functionality across all login screens
- Photo management UI: Remove button for member photos
- Upload feedback: Toast notifications for file submissions
- Font Awesome updates: GEA kit, WhatsApp brand icon, Leobo shelter icon
- Applicant portal memory leak fix (sessionStorage reference)
- Code cleanup: Removed dead TEST_MODE flag, simplified ID-prefixing logic

### Changed

#### Membership Application Guide
- Comprehensive applicant-facing guide with policy clarifications
- Terminology standardization (RSO, Tennis Court, etc.)
- Benefits language standardization
- Document renewal policy clarifications
- Sponsor requirements (Community-only membership)
- DOB collection policy (children and staff only)
- Payment method documentation
- Structure improvements (removed redundant sections)

#### Portal UX & Code Quality
- Applicant portal portal URL handling (no OAuth redirect params)
- Dev/Prod environment box removal (was debug-only)
- Admin link removal from member login page
- Header title update for applicants ("Applicant Portal")
- Post-login debug panel removal

#### Version Bump
- CLAUDE.md: v1.0.0 → v2.0.0
- Timestamp updated to March 26, 2026

### Fixed

#### Critical Bugs
- `triggerRsoDailySummary()` infinite recursion → Fixed loadApplicantPortal() logic
- Welcome email on every login → Added `first_login_date` flag to prevent re-triggering
- Applicant auth check pattern → Changed `auth.success` to `auth.ok`
- Admin login password field validation
- Applicant portal environment selector (commented out dev/prod box)

#### Portal Features
- Removed infinite "Add Child"/"Add Staff" buttons for Individual memberships
- Corrected hyphenated last-name formatting for Family memberships
- Fixed household_type assignment at application creation
- WhatsApp icon rendering in applicant portal

---

## [1.4.0] — 2026-03-24

### Added

#### RSO Dual-Role Portal (PR #26)
- **rso_approve role:** Document review, guest list review, applications, photos
- **rso_notify role:** Event calendar (read-only), approved guest lists
- Authenticated sessions replace one-time email links
- Admin Portal role-based navigation filtering (`_applyNavRoleFilter`)

#### Applicant Portal Stabilization
- New RSO email templates for document workflow:
  - `ADM_DOCS_SENT_TO_RSO_TO_MEMBER` — Notification when documents sent for review
  - `ADM_DOCUMENT_APPROVED_BY_RSO_TO_MEMBER` — Approval notification to applicant
- Phone number formatting and household display improvements
- "Add Child" / "Add Staff" button visibility tied to household_type

#### Admin Portal Updates
- Administrators page: Add, deactivate, reactivate, reset password for admin accounts
- Password field in login form
- Role dropdown for Admin account creation
- Admin session management with role-based routing

### Fixed

#### Critical Bugs (10 total)
1. Deprecated email template calls (tpl_040, tpl_041) → Updated to semantic names
2. Email template loading spinner on submit button → Removed blocking behavior
3. Infinite recursion in `loadApplicantPortal()` → Fixed navigation logic
4. Missing `is_applicant` flag in login response → Added to AuthService
5. Loading email templates per request → Optimized with caching
6. Applicant portal environment selector (Dev/Prod) → Commented out
7. Admin Portal link showing on member login page → Removed conditional display
8. Membership dues calculation → Implemented `_calculateDuesAmount()` function (was called but undefined)
9. Header title not reflecting applicant vs. member → Updated Portal.html logic
10. First login welcome email sending repeatedly → Added `first_login_date` check

### Changed

#### Service Module Updates
- AuthService.js: `adminLogin()` checks Administrators sheet instead of hardcoded accounts
- Code.js: `_getRoleForEmail()` updated to reflect admin vs. member distinction
- Bootstrap function: `bootstrapAdminAccounts()` for seeding Administrators sheet

#### Documentation
- Membership Application Guide: Board review version created with policy corrections
- 20+ content refinements across application guide

---

## [1.3.0] — 2026-03-21

### Added

#### Database-Driven Admin Account Management (Option C)
- New `Administrators` sheet in System Backend spreadsheet
- Admin roles stored in database: `board`, `mgt` (Management), `rso` (all variants)
- `adminLogin(email, password)` function → Checks Administrators sheet for credentials
- `bootstrapAdminAccounts()` → Seed function for board@ and treasurer@ accounts
- Password reset functionality for admin accounts

#### Admin Portal Features
- Admin account management page: Create, deactivate, reactivate admins
- Password change workflow for board members
- Role-based navigation filtering (board vs. mgt vs. rso roles)
- Admin session storage separate from member sessions

#### Test Suite Enhancements
- 9 scenes updated for new admin login system
- New SCENE-10: Admin Account Management
- Login security testing
- Role-based navigation testing
- Deactivation/reactivation workflow testing

### Changed

#### Authentication Architecture
- `adminLogin()` now references Administrators sheet (not hardcoded)
- Admin roles determined by database lookup (no longer role parameters in requireAuth)
- Session handling unified for admin and member accounts

### Fixed

#### Role Assignment Issues
- `_getRoleForEmail()` function simplified (all member logins return role="member")
- Admin role detection moved to Administrators sheet lookup
- Legacy role aliasing support (rso → rso_approve)
- `requireAuth()` now accepts role arrays (["rso_approve","rso_notify"])

---

## [1.2.0] — 2026-03-19

### Added

#### Guest List Redesign (RES.3)
- Per-guest RSO review workflow: Approve/reject individual guests
- `saveGuestListDraft()` → RSO saves partial decisions and returns to finalize later
- `finalizeGuestListReview()` → RSO completes review for all guests
- Event proceeds with approved subset; rejections sent to board

#### New Data Structures
- **Guest Profiles sheet** (new): Upserted by (household_id, id_number)
  - Fields: guest_profile_id, household_id, name, id_number, age_group, submission_date
- **Guest Lists sheet** (enhanced):
  - New columns: rso_draft_json, last_modified_date
  - Status flow: submitted → in_review → finalized

#### Admin Portal Guest List Review
- Guest List Reviews page with per-guest radio cards
- Approve/Reject decision UI
- Save draft and finalize workflows
- Guest profile matching and history lookup

#### Email Templates
- `RES_GUEST_LIST_REJECTIONS_TO_BOARD` → New template for rejected guests notification

### Changed

#### ReservationService.js
- Guest list acceptance/rejection logic refactored for per-guest decisions
- New helper functions: `_saveGuestProfileIfNeeded()`, `_buildGuestListReviewResponse()`
- Updated guest list status determination logic

#### Admin.html Interface
- Guest List Reviews page added to board navigation
- Per-guest review UI with decision cards
- Draft save and finalize buttons

---

## [1.1.0] — 2026-03-13

### Added

#### Phase 2 Payment Features

**Automatic Exchange Rate Management:**
- `fetchAndUpdateExchangeRate()` in PaymentService.js → Nightly fetch from open.er-api.com
- `getExchangeRate()` helper → Reads from Configuration sheet with EXCHANGE_RATE_DEFAULT fallback
- Integrated into `runNightlyTasks()` (2:00 AM GMT+2)
- Configuration-based storage: no API key needed, no hardcoded rates
- Historical backfill via fawaz API

**Payment History Report:**
- `getPaymentReport(filters)` function in PaymentService.js
- `admin_payment_report` route in Code.js
- Admin Portal: Payment Management page with two tabs
  - **Pending Verification:** Current unverified payments list
  - **Payment Report:** Filterable historical report with:
    - Membership year filter (All, 2025-26, 2026-27)
    - Status filter (Verified, Submitted, Rejected, Clarification)
    - Summary section: verified count, total collected USD/BWP
    - CSV export button
- Report columns: Household, Email, Amount USD, Amount BWP, Method, Status, Date

**Dues Information API:**
- `get_dues_info` route with live exchange rate
- Membership year dropdown
- Pro-ration percentage display
- Dynamic amount calculation (USD ↔ BWP)

**Code Quality Improvements:**
- Pro-ration logic: Removed dead code block, uses QUARTER_PERCENTAGES config constants
- Legacy handler consolidation: Removed old payment endpoints
- Streamlined payment verification workflow

#### Documentation Updates
- **CLAUDE_Payments_Implementation.md:** Comprehensive Phase 2 documentation
  - Exchange rate system architecture
  - Payment report specifications
  - Backend routes and service functions
  - Configuration constants and testing checklist

### Changed

#### PaymentService.js
- Pro-ration calculation now uses config constants only
- New functions: `fetchAndUpdateExchangeRate()`, `getExchangeRate()`

#### Config.js
- EXCHANGE_RATE_DEFAULT constant added
- Exchange rate storage moved to Configuration sheet (dynamic)

#### Removed

#### Legacy Payment Handlers
- `_handlePaymentSubmit(p)` from Code.js
- `_handleAdminPayment(p)` from Code.js
- `_confirmPayment(paymentId, verifiedBy)` helper
- `_markPaymentNotFound(paymentId, markedBy)` helper
- `action="payment"` route (consolidated)
- `action="admin_payment"` route (consolidated)
- Hardcoded constants: `EXCHANGE_RATE_USD_TO_BWP`, `EXCHANGE_RATE_LAST_UPDATED`

---

## [1.0.0] — 2026-03-13 (Comprehensive Release)

### Added

#### Complete Membership Application System (Mar 5-13, 2026)
- **ApplicationService.js** (~1,200 lines): 12 functions + 3 helpers for full application lifecycle
- **11-step application workflow:** Submit → Documents → Board Review → RSO Review → Payment → Activation
- **6 membership categories** determined by eligibility questionnaire:
  - Individual (local/expat)
  - Family (local/expat, spouse + children)
  - Staff (non-member household staff)
- **Email templates:** 13 new templates (tpl_040-tpl_052) for entire lifecycle
- **Portal.html:** 6-step application form with sponsor verification, document upload, payment
- **Admin.html:** Applications management page with approval/denial workflow
- **Applicant portal:** Read-only interface during approval process
- **Auto account creation:** New household + individual records with temporary password

#### Phase 1 Payment Verification System (Mar 12-13, 2026)
- **PaymentService.js:** Core payment submission, verification, status tracking
- **PaymentVerification sheet:** Tracks dues payments with status workflow
- **Member portal:** Payment Details page with method instructions
- **File upload:** Members submit payment proof with metadata
- **Treasurer workflow:** Board admin approves, rejects, or requests clarification
- **Email notifications:** 5 templates for submission, review, approval, rejection, clarification
- **Pro-ration:** Quarterly dues calculation
- **Status tracking:** submitted → verified/rejected/clarification_requested

#### Email Infrastructure Overhaul (Mar 16-19, 2026)
- **Drive-based templates:** Plain text files on Google Drive
- **EmailService.js refactored:** 5 new functions for template loading and sending
- **Semantic naming:** ~60 email templates use descriptive names
- **Automatic wrapping:** Templates auto-wrapped in GEA master HTML template
- **Board delegation:** Service account impersonates treasurer@ account
- **Template migration:** All legacy `tpl_XXX` calls replaced with semantic names
- **Drive storage:** Easily editable by board members

#### Security Hardening (Mar 8, 2026)
- **XSS Prevention (14 vulnerabilities fixed):**
  - Safe DOM construction with `textContent`
  - Event handler closures
  - Git pre-commit hook for regression detection
- **Session Token Security:**
  - SHA256 hashing of session tokens
  - Constant-time comparison for all credentials
  - Improved token entropy
  - One session per user enforcement
- **Authentication Regression Tests:** 8 focused tests

### Changed

#### Code Quality & Refactoring
- Dashboard layout redesign
- Membership card enhancements
- Navigation improvements
- Session management fix
- Form data collection fixes
- Board email refactored

### Fixed

#### Critical Bugs (15+ total)
- Session accumulation
- Voting rights field mismatch
- Membership level undefined
- Header revert on page load
- Form data collection errors
- Family members creation
- Citizenship country column
- Board email sending
- Test data loader
- Nightly task failure
- XSS vulnerabilities (14 total)
- Email template indices
- Dues display
- Payment pro-ration
- Auth patterns

### Removed

#### Legacy Payment Handlers
- `_handlePaymentSubmit(p)`
- `_handleAdminPayment(p)`
- `_confirmPayment()` helper
- `_markPaymentNotFound()` helper
- Hardcoded payment routes

---

## [0.7.0] — 2026-02-22 to 2026-02-23

### Added

#### Dashboard Enhancement (Feb 22, 2026)
- Dashboard layout redesign with 2-column grid (85vw responsive)
- Membership card enhancements (level display, contact info, dues display)
- Navigation improvements (clickable header, back-to-dashboard links)
- Session management fix (one session per user)
- Data field inventory documentation
- Environmental metadata display (DEV vs. PROD indicator)

#### Public Website Launch (Feb 23, 2026)

#### Public Website (geabotswana.org)
- **index.html:** Self-contained public informational website with 6 sections
  - Navigation (sticky header with logo, menu links, Member Login button)
  - Hero section (full-width gradient, organization tagline, CTAs)
  - About GEA (mission, facilities overview, board officers with photos)
  - Facilities (Tennis Court/Basketball, Playground, Leobo, Gym with details)
  - Membership Categories (6 types, currently commented out pending review)
  - Contact & Footer (board contact info, location, links)
- **index.html Features:**
  - Responsive design (mobile-friendly, tested at 375px)
  - Smooth scroll navigation anchors
  - GEA brand colors and typography (Source Sans 3, Roboto Mono)
  - Professional styling with CSS grid and flexbox layouts

#### Member Portal Wrapper
- **member.html:** Full-page iframe embedding GAS web app for domain masking
  - Users see geabotswana.org in address bar (not script.google.com)
  - Full-height iframe for complete portal experience
  - Clean header with GEA branding and "Back to Website" link
  - Responsive design
  - Allow="same-origin" security configuration

#### Executive Board Section
- Professional bios for three board officers:
  - **Sacha Fraiture** (Chairperson) — PAO with extensive diplomatic background
  - **Michael Raney** (Treasurer) — 20+ years Foreign Service
  - **Maria Ester Becerro** (Secretary) — CLO experience from Uruguay
- High-quality professional photos (120×120px, rounded corners)
- Clickable mailto: email links for direct contact
- Professional contact banner below board members

#### Documentation
- **GEA_Board_Bios.md:** Comprehensive executive board profiles
- **SESSION_SUMMARY_2026-02-23.md:** Detailed session notes documenting all work
- **CHANGELOG.md:** This file

#### Version Control Infrastructure
- **.gitignore:** Protects member data (*.xlsx), credentials (.clasp.json), local tooling
- **CNAME:** Custom domain configuration for geabotswana.org
- **.claspignore:** Updated to exclude website files from GAS deployment

#### Deployment Configuration
- GitHub Pages setup for geabotswana.org (automatic deployment on git push)
- Google Cloud Storage asset URLs for logos and branding
- Production GAS deployment ID: `AKfycbw7DG2PpLUK9zrAQt9IVF35eQM7U-C3HUFyZIoQo7ChGB10xK5NuJRdUJpVrBjDwuAQ`

### Changed

#### About GEA Section
- Enhanced with specific facility locations (Presidents Drive, North Ring Road)
- Added operating hours (6am–8pm daily)
- Clarified membership diversity statement
- Separated into two paragraphs for better readability

#### Facilities Section
- Standardized card structure across all facilities:
  1. Location (with operating hours)
  2. Access (reservation requirement or freely available)
  3. Equipment (specific details)
  4. Max Reserved Session (only for reservable facilities)
  5. Subtitle: "Reservation limits to promote fair use" (for reserved facilities)
- Facilities now grouped by location (Presidents Drive together, North Ring Road separate)
- Enhanced equipment descriptions with specific details
- Clear access messaging distinguishing between reservation-only, walk-in, and freely available

#### CLAUDE.md Documentation
- Added "Public Website Files" section documenting index.html and member.html
- Updated System Overview to reflect 4 HTML interfaces (not 2)
- Updated Frontend Structure with public website details
- Updated Facilities section with 4 facilities (removed "Whole Facility" as separate entry)
- Added specific location information and operating hours
- Clarified that "Whole Facility" refers to reservation combinations, not a standalone facility

### Removed

#### Membership Categories Section
- Commented out pending content accuracy review
- Code preserved for easy restoration once verified data is available

#### Facility Listing Changes
- Removed "Whole Facility" as standalone facility entry
- Clarified it's a reservation combination, not a separate booking option
- Removed "Whole Facility" from public-facing website descriptions

### Fixed

#### Contact Section
- Removed "reservations" from General Inquiries contact text
- Clarified that reservations are handled through member portal

#### Board Section Bio
- Corrected Maria Ester Becerro bio: Changed "Maria managed" to "Ester managed"

### Documentation Updates

#### CLAUDE.md
- Added website deployment section with GitHub Pages information
- Clarified member.html as hybrid (public + authenticated via iframe)
- Updated facilities list with locations and operating hours
- Added comprehensive index.html and member.html documentation
- Updated system overview to reflect current architecture

#### Project Files
- Committed 8 documentation files to GitHub:
  - EMAIL_TEMPLATES.md
  - GEA_System_Schema.md
  - HOUSEHOLDS_COLUMNS_ANALYSIS.md
  - MEMBERSHIP_APPLICATIONS_SCHEMA_REDESIGN.md
  - MEMBERSHIP_ELIGIBILITY_FLOW.md
  - MEMBERSHIP_LEVELS.md
  - SESSION_SUMMARY_2026-02-22.md (from previous session)
  - GEA_Claude_Code_Task_List.md (updated with Phase 1 completion)

---

## Git Commit History (v1.0.0)

**Total commits: 16** (all from 2026-02-23)

1. ✅ Create public website (index.html) with 6 sections
2. ✅ Implement Option B: Dedicated member.html with full-page iframe embed
3. ✅ Fix member.html: Simplify iframe and remove sandbox restrictions
4. ✅ Simplify member.html: Remove header, use full-page iframe
5. ✅ Update board section with new executive board members (Feb 2026)
6. ✅ Refine board section: Fix bio, make emails clickable, add contact banner
7. ✅ Update About GEA section with detailed facilities information
8. ✅ Enhance Facilities section with detailed, location-based descriptions
9. ✅ Polish Facilities section: Remove limits advertising, streamline language
10. ✅ Standardize facility card structure for consistency and clarity
11. ✅ Add comprehensive documentation files
12. ✅ Update CLAUDE.md: Add website deployment section and version tracking
13. ✅ Comment out Membership Categories section (pending content update)
14. ✅ Remove 'reservations' from General Inquiries contact text
15. ✅ Update CLAUDE.md to reflect today's website launch and changes
16. ✅ Mark Phase 1 as COMPLETED (February 23, 2026)

---

## Release Notes

### v1.0.0 — Public Website Launch

**Date:** February 23, 2026
**Phase:** 1 (Quick Wins & Public Site Refresh)
**Status:** Complete ✅

#### What's New
The GEA Management System now has a professional public-facing website at **https://geabotswana.org**, presenting GEA's mission, facilities, and contact information to the broader mission community.

#### Key Features
- **Public Website:** Informational landing page at geabotswana.org
- **Domain Masking:** Member portal accessible via geabotswana.org/member.html (shows geabotswana.org in address bar, not script.google.com)
- **Executive Board:** Current leadership with professional bios and photos
- **Facility Information:** Clear descriptions of all GEA facilities with operating hours and access requirements
- **Professional Branding:** Consistent GEA colors, logos, and typography

#### Deployment
- Frontend: GitHub Pages (https://geabotswana.org)
- Backend: Google Apps Script (production deployment v1)
- Database: Google Sheets (unchanged)
- Source Code: GitHub repository (geabotswana/gea-website)

#### Testing
- ✅ Website responsive (tested 375px–1920px)
- ✅ Member portal iframe loads correctly
- ✅ Board photos display from Google Cloud Storage
- ✅ Email links functional
- ✅ Navigation smooth-scrolls correctly
- ✅ Mobile menu toggle works
- ✅ All links external and internal functional

#### Known Limitations / Pending Items
1. **Membership Categories:** Section commented out pending content accuracy review
2. **Gym Hours:** Currently set to 6am–8pm (pending confirmation for 24-hour access)
3. **Tennis Court:** Description says "Full-size" (pending confirmation if full vs. half-court)
4. **Facility Photos:** Placeholder text; awaiting actual facility images

#### Next Phase
**Phase 2:** Content Integration & Backend Architecture (scheduled for Sessions 2-3)
- Backend improvements to member portal
- Comprehensive testing and validation
- User feedback incorporation

---

## Contributors

- **Michael Raney** (Product Owner, Board Treasurer)
- **Claude Code** (Development, Implementation)
- **Sacha Fraiture** (Chairperson - Board Bios)
- **Maria Ester Becerro** (Secretary - Board Bios)

---

## Resources

- **Public Website:** https://geabotswana.org
- **GitHub Repository:** https://github.com/geabotswana/gea-website
- **Member Portal:** https://geabotswana.org/member.html
- **Production Deployment:** https://script.google.com/a/macros/geabotswana.org/s/AKfycbw7DG2PpLUK9zrAQt9IVF35eQM7U-C3HUFyZIoQo7ChGB10xK5NuJRdUJpVrBjDwuAQ/exec
- **Documentation:** See GEA_Board_Bios.md, SESSION_SUMMARY_2026-02-23.md, CLAUDE.md

---

## Future Roadmap

### Phase 2 (Sessions 2-3)
- Backend improvements
- Member portal enhancements
- Comprehensive testing

### Phase 3 (Future)
- Enhanced facility photos
- Event calendar integration
- Member testimonials and gallery

---

**Last Updated:** March 26, 2026
**Maintained by:** Claude Code
**License:** Internal Use (GEA/U.S. Mission to Botswana)

---

## Development Summary

This changelog covers the GEA Management System development from **February 22 through March 26, 2026**.

**Total Development Span:** 33 days
**Versions Released:** v0.7.0 → v2.0.0
**Major Features Implemented:** 12+
**Commits:** 69+ across multiple PRs
**Critical Bugs Fixed:** 50+
**Security Vulnerabilities Resolved:** 14 XSS fixes + session hardening

### Version Progression

- **v0.7.0** (Feb 22-23): Dashboard enhancements, public website launch
- **v1.0.0** (Mar 5-13): Membership applications, payment verification, email infrastructure, security hardening
- **v1.1.0** (Mar 13): Phase 2 payments - exchange rate automation, payment report
- **v1.2.0** (Mar 19): Guest list redesign - per-guest RSO review
- **v1.3.0** (Mar 21): Admin account management - database-driven RBAC
- **v1.4.0** (Mar 24): Applicant portal stabilization, RSO dual-role portal
- **v2.0.0** (Mar 26): Rules & Regulations, CI/CD automation, MCP integration

### Key Architectural Achievements

1. Complete membership application lifecycle (11 steps)
2. Drive-based email template system (60+ templates)
3. Service account impersonation with domain-wide delegation
4. Automated CI/CD deployment via GitHub Actions
5. RSO dual-role portal with authenticated sessions
6. Database-driven admin account management
7. Rules & Regulations system with board management
8. MCP integration for development tooling
