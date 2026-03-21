# Scene 08 — Non-Member Portal UI: All Status States and Navigation

**Order:** Can begin once several applications from prior scenes are in various stages (they provide test accounts at different statuses). Run during or after Scenes 01–07.

**What this tests:**
- Non-Member Portal renders correctly at each of the 8 application statuses
- Navigation items are conditionally visible per status
- Page content matches the current status (correct status messages, action items, buttons)
- Responsive design: desktop (1200px+), tablet (768px), mobile (390px)
- No horizontal scrolling at any breakpoint
- All buttons are at least 44×44px on mobile
- ARIA roles and keyboard navigation

**Note:** This scene is primarily a UI/UX checklist. Most steps can be performed by one person testing different browser profiles or incognito windows logged in as applicants from prior scenes.

---

## Cast

| Role | Who | Access |
|------|-----|--------|
| **Tester** | Any team member comfortable with browser DevTools | Non-Member Portal (multiple accounts) |
| **Board Member** | board@geabotswana.org | Needed to advance some applicants through stages |

---

## Pre-conditions

You need test accounts at each of the following statuses. Use accounts from prior scenes, or advance/create dedicated accounts to each stage:

| Status | Source |
|--------|--------|
| `awaiting_docs` | Any new application |
| `board_initial_review` | After docs confirmed |
| `rso_review` | After board initial approval |
| `board_final_review` | After RSO approval |
| `approved_pending_payment` | After board final approval |
| `payment_submitted` | After submitting payment proof |
| `denied` | Scene 04 accounts (Nina Walsh or Owen Batho) |
| `activated` | Scene 01 account (Alice Thornton) — though she redirects to member portal |

---

## Status-by-Status Checklist

For each status, log in as the corresponding test account and verify the following.

---

### Status: `awaiting_docs`

**Navigation visible:**
- [ ] Dashboard ✓
- [ ] Documents ✓
- [ ] My Household ✓
- [ ] Help ✓
- [ ] Status — verify: visible or hidden?
- [ ] Payment — should be HIDDEN

**Dashboard:**
- [ ] Status card shows message about uploading documents
- [ ] Action Items card: "Upload required identity documents for each listed household member"
- [ ] Quick Links card visible with at least Documents link

**Documents page:**
- [ ] Shows document upload slots for primary applicant
- [ ] "Confirm All Documents" button visible
- [ ] "Confirm" button is DISABLED until at least one document uploaded (or grayed)

**Payment page:**
- [ ] Either hidden from nav OR shows info-only mode with no submission form

**Fail if:** Payment submission form visible at awaiting_docs, or Documents page empty

---

### Status: `board_initial_review` (after docs confirmed)

**Navigation:**
- [ ] Same as awaiting_docs but "Confirm" action is complete
- [ ] Payment still HIDDEN

**Dashboard:**
- [ ] Status message: "Documents received. Your application is in review." (or similar)
- [ ] Action Items: "No immediate action required. We will email you for next steps."

**Documents page:**
- [ ] Documents show as submitted/pending — no re-upload prompted (unless doc was rejected)
- [ ] "Confirm" button gone or disabled (already confirmed)

**Fail if:** Dashboard still says "upload documents", or action item still prompts document upload

---

### Status: `rso_review`

**Dashboard:**
- [ ] Status message: "Application is in RSO review."
- [ ] No action required from applicant

**Timeline (if Application Status page is accessible):**
- [ ] Steps 1 (Submitted) and 2 (Documents) show ✓
- [ ] Step 3 (Board Approval) shows ✓ (initial board approved)
- [ ] Step 4 (RSO/Payment) shows ⏳ (in progress)

**Fail if:** Timeline shows incorrect step statuses

---

### Status: `board_final_review`

**Dashboard:**
- [ ] Status message: "Application is in final board review."

**Timeline:**
- [ ] Steps 1–3 ✓ (RSO approved)
- [ ] Step 4 shows ⏳ or ✓ depending on implementation

**Fail if:** Payment page accessible at this status (it shouldn't be)

---

### Status: `approved_pending_payment`

**Navigation:**
- [ ] Payment page NOW VISIBLE in nav ✓

**Dashboard:**
- [ ] Status message: "Application approved. Submit your payment verification to proceed."
- [ ] Action Items: "Next step: submit payment verification details."
- [ ] Quick Links includes link to Payment page

**Payment page:**
- [ ] Dues Breakdown card visible with all values
- [ ] Payment methods listed (all 4: PayPal, SDFCU, Zelle, Absa)
- [ ] Payment submission form IS visible
- [ ] Membership year dropdown populated (not empty)
- [ ] Amount Due shows and updates when year changes

**Fail if:** Payment submission form hidden, or dues breakdown shows $0 or hardcoded values

---

### Status: `payment_submitted`

**Dashboard:**
- [ ] Status message: "Payment submitted. Treasurer verification is in progress."
- [ ] Action Items: "Next step: wait for treasurer verification."

**Payment page:**
- [ ] Payment status card shows "Submitted — Awaiting Review" (or similar)
- [ ] Submission form is HIDDEN (already submitted; cannot re-submit until clarification or rejection)

**Fail if:** Applicant can submit a second payment on top of an existing submitted one

---

### Status: `denied`

**Navigation:**
- [ ] Limited: Dashboard and Help only (or just Dashboard)
- [ ] Payment, Documents, Household, Status pages HIDDEN or inaccessible

**Dashboard:**
- [ ] Status card shows "Application Denied" or equivalent
- [ ] Reason visible if provided
- [ ] Contact information or link to Help page shown

**Fail if:** Denied applicant can access Payment page

---

### Status: `activated` (redirected to member portal)

**Action:**
1. Log in as Alice Thornton (Scene 01 — activated member)

**Check:**
- [ ] Directed to the REGULAR Member Portal (NOT the non-member portal)
- [ ] Regular portal shows: Dashboard, Reservations, Profile, Membership Card tabs
- [ ] Non-member portal pages (Documents, Household Mgmt, Help/Contact) are NOT shown in regular portal nav

**Fail if:** Activated member sees non-member portal

---

## Responsive Design Checklist

For each breakpoint, test using **Chrome DevTools** (F12 → device toolbar):

### Desktop (1200px+)
- [ ] Navigation shows as a horizontal pill row (not hamburger)
- [ ] Dashboard shows 2-column card grid
- [ ] All text readable, no truncation
- [ ] No horizontal scrollbar

### Tablet (768px) — iPad size in DevTools
- [ ] Navigation collapses to hamburger menu
- [ ] Hamburger button tappable (≥44px)
- [ ] Menu opens as a drawer when hamburger clicked
- [ ] Cards stack to 1 column
- [ ] Forms are full-width or near-full-width
- [ ] No horizontal scrollbar

### Mobile (390px) — iPhone 14 size in DevTools
- [ ] Same as tablet for nav
- [ ] Cards are edge-to-edge or nearly so
- [ ] All buttons ≥44px height
- [ ] Form inputs full-width
- [ ] No horizontal scrollbar
- [ ] Text minimum 16px (check body text)

### Mobile (480px)
- [ ] No horizontal scrollbar (extra breakpoint check)

---

## Accessibility Checklist

- [ ] Navigation element has `role="navigation"` or is a `<nav>` tag
- [ ] Hamburger button has `aria-expanded` attribute (changes true/false on open/close)
- [ ] Active nav item has `aria-current="page"` or equivalent
- [ ] Tab key navigates through nav items and page elements in logical order
- [ ] All buttons have visible focus styles (not just outline: none)
- [ ] Form labels are associated with inputs (click label → focuses input)
- [ ] Error messages are readable by screen reader (not hidden in CSS-only)

---

## Completion Criteria

Scene 08 is **PASS** when:
- All 8 status states show correct content and navigation visibility
- No status exposes pages/forms that should be hidden
- Responsive design works at all three breakpoints
- No horizontal scrolling at any width
- Keyboard navigation functional
