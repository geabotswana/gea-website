# Scene 09 — Post-Activation: Member Portal Access and Record Integrity

**Order:** Run after Scene 01 and Scene 02 (requires activated members).

**What this tests:**
- Activated member is redirected to regular member portal (not non-member portal)
- Member portal pages are all accessible (Dashboard, Reservations, Profile, Membership Card)
- Membership Card shows correct category, name, household, and expiration
- Dashboard shows correct household info
- Profile page shows correct personal information
- Dues shown on any payment-related page reflect correct category and year
- Membership expiration date is correct (next July 31)
- Activated individual from Scene 01 (Full Individual) has correct access
- Activated family from Scene 02 (Full Family) — each member has correct individual access
- Cannot access admin portal with member credentials
- Booking/Reservations page is accessible and shows correct household info

---

## Cast

| Role | Who | Access |
|------|-----|--------|
| **Member 1** | James Morrison (Scene 01) | Regular Member Portal |
| **Family Primary** | William Peterson (Scene 02) | Regular Member Portal |
| **Family Member** | Sarah Peterson (Scene 02, spouse) | Regular Member Portal (if she has her own login) |

---

## Pre-conditions

- Scene 01 complete: James Morrison is an active Full Individual member
- Scene 02 complete: Peterson family is active (all 5 members)

---

## Part A — James Morrison (Full Individual)

---

### Step A1 — Login and Portal Redirect
**Who:** James Morrison
**Where:** Portal login page

**Action:**
1. Navigate to the Member Portal login page
2. Log in with James's credentials (email: michael+fullindividual@raneyworld.com)

**Check:**
- Login succeeds
- James is immediately directed to the **regular member portal** (not non-member portal)
- Regular portal nav shows: Dashboard, Reservations, Profile, Membership Card
- Non-member portal nav items (Documents upload, Application Status, My Household, Help/Contact form) are NOT shown

**Fail if:** James sees non-member portal, or regular portal tabs are missing

---

### Step A2 — Dashboard
**Who:** James Morrison
**Where:** Member Portal → Dashboard

**Check:**
- Household name shown: "Morrison" (or "James Morrison")
- Membership status: ACTIVE (green badge or equivalent)
- Membership type shown: "Full — Individual"
- Expiration date: next July 31 (e.g. 2026-07-31 if activated before July 31 2026)
- No pending reservations (he has none yet)
- No warnings or error banners

**Fail if:** Status shows inactive, expiration date is wrong, or household name is missing

---

### Step A3 — Membership Card
**Who:** James Morrison
**Where:** Member Portal → Membership Card

**Action:**
1. Click "Membership Card" in navigation
2. View the digital card

**Check:**
- Name: James Morrison
- Membership Category: Full (Individual) or equivalent
- Member Since: today's date (or application submitted date)
- Valid Through: next July 31
- Household ID: HSH-2026-XXXX (his household ID)
- Card design renders correctly (no broken images, no missing placeholders)

**Fail if:** Name wrong, category wrong, expired date wrong, or card shows a different member's info

---

### Step A4 — Profile Page
**Who:** James Morrison
**Where:** Member Portal → Profile

**Check:**
- First name = James, Last name = Morrison
- Email = michael+fullindividual@raneyworld.com (or his test email)
- Phone = +267 71 234501 or what he entered during application
- Contact info is editable (Edit button or inline edit)

**Action:** Make a small edit — change phone number, save

**Check after edit:**
- Success message shown
- Individuals sheet: James's phone_primary updated
- Profile page reflects new number after save

**Fail if:** Profile is read-only (should be editable), or sheet doesn't update

---

### Step A5 — Reservations Page
**Who:** James Morrison
**Where:** Member Portal → Reservations

**Check:**
- Reservations page loads without error
- **List / Calendar toggle buttons visible** at the top of the page (List button active by default)
- "Book a Facility" form or button visible
- Facility options shown (Tennis/Basketball, Leobo, Gym, Playground)
- No existing reservations (list is empty — correct for a new member)
- Household usage stats show 0 hours used this week (Tennis), 0 reservations this month (Leobo)
- Clicking "Calendar" toggle switches to month-grid view; clicking "List" switches back
- Color-coded legend visible in calendar view (Tennis = blue, Leobo = purple)

**Fail if:** Reservations page shows an error, facility booking options are missing, or List/Calendar toggle is absent

---

### Step A6 — Cannot Access Admin Portal
**Who:** James Morrison
**Where:** Admin Portal URL

**Action:** Navigate to the Admin Portal URL while logged in as James

**Check:**
- James is denied access with "Forbidden" or "Board access required" error
- He is NOT shown the admin dashboard
- His role is "member" (not "board") — confirm in Sessions sheet if needed

**Fail if:** Regular member can access admin portal

---

## Part B — William Peterson and Family (Full Family)

---

### Step B1 — William Peterson Login
**Who:** William Peterson (primary family member)
**Where:** Portal login

**Action:** Log in as William Peterson (email: michael+fullfamily@raneyworld.com)

**Check:**
- Directed to regular member portal
- Dashboard shows household name "Peterson"
- Family members count: 4 additional members (Sarah, Emma, Lucas, Thabo) — confirm household size indicator if present
- Membership type: "Full — Family"

**Fail if:** Shows non-member portal, or shows individual rate instead of family

---

### Step B2 — Membership Card Shows Family Designation
**Who:** William Peterson
**Where:** Membership Card

**Check:**
- Card shows "Full Family" or equivalent
- William's name on card
- Valid through next July 31

---

### Step B3 — Dues Reflect Family Rate
**Who:** William Peterson

**Action:** Navigate to any page that shows dues or membership pricing

**Check:**
- Annual dues shown = full_family rate (higher than full_indiv)
- NOT showing the individual rate

---

### Step B4 — Family Members Have Individual Access
**Who:** Sarah Peterson (spouse)
**Where:** Portal login

**Pre-condition:** Sarah has her own email address and received credentials during the application

**Action:** Log in as Sarah Peterson

**Check:**
- Sarah can log in
- Directed to regular member portal
- Dashboard shows Peterson household info
- Her individual profile is accessible

**Note:** If Sarah's email was not provided during the application, skip this step and note it as untested.

---

### Step B5 — Thabo (Staff Member) Cannot Make Reservations
**Who:** Thabo Motswana (household staff)
**Where:** Portal login (if Thabo has login credentials)

**Action:** If Thabo has an email address and received credentials, log in as Thabo

**Check:**
- Thabo can log in
- His access may be limited compared to full members — verify what he can and cannot do
- Specifically: can Thabo make a reservation? (per system design, staff members may have limited access)

**Note:** Document the actual behavior observed here as this may inform future policy.

---

## Part C — Record Integrity Cross-Check

**Who:** Board Member (or tester with Sheets access)
**Where:** Google Sheets — both Member Directory and System Backend

### Step C1 — Households Integrity
**Check:**
- James Morrison: Households row active = TRUE, membership_level_id = "full_indiv", expiration = next July 31
- Peterson family: Households row active = TRUE, membership_level_id = "full_family", expiration = next July 31

### Step C2 — Individuals Integrity
**Check:**
- All active individuals (James, William, Sarah, Emma, Lucas, Thabo) have active = TRUE
- Lucas (over 17): voting_eligible = TRUE
- Emma (under 17): voting_eligible = FALSE

### Step C3 — Applications Integrity
**Check:**
- James Morrison's application: status = "activated", payment_status = "verified"
- Peterson family application: status = "activated", payment_status = "verified"
- Neither has any residual pending or null fields that should have been populated at activation

### Step C4 — Sessions
**Check:**
- Active sessions exist for recently logged-in members
- Sessions tab in System Backend: rows with token_hash populated, expiry = 24 hours from login
- Expired sessions from prior test logins should be cleared by nightly purge (run `purgeExpiredSessions()` manually if needed to verify it runs without error)

---

## Completion Criteria

Scene 09 is **PASS** when:
- Both activated accounts access regular member portal (not non-member portal)
- Membership cards show correct names, categories, and expiration
- Profile editing works and persists to sheet
- Reservations page accessible with facility booking available
- Regular member cannot access admin portal
- Family rate confirmed for Osei household
- All sheet records are consistent and complete across Households, Individuals, and Applications tabs
