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
| **Member 1** | Alice Thornton (Scene 01) | Regular Member Portal |
| **Family Primary** | Robert Osei (Scene 02) | Regular Member Portal |
| **Family Member** | Margaret Osei (Scene 02, spouse) | Regular Member Portal (if she has her own login) |

---

## Pre-conditions

- Scene 01 complete: Alice Thornton is an active Full Individual member
- Scene 02 complete: Osei family is active (all 5 members)

---

## Part A — Alice Thornton (Full Individual)

---

### Step A1 — Login and Portal Redirect
**Who:** Alice Thornton
**Where:** Portal login page

**Action:**
1. Navigate to the Member Portal login page
2. Log in with Alice's credentials

**Check:**
- Login succeeds
- Alice is immediately directed to the **regular member portal** (not non-member portal)
- Regular portal nav shows: Dashboard, Reservations, Profile, Membership Card
- Non-member portal nav items (Documents upload, Application Status, My Household, Help/Contact form) are NOT shown

**Fail if:** Alice sees non-member portal, or regular portal tabs are missing

---

### Step A2 — Dashboard
**Who:** Alice Thornton
**Where:** Member Portal → Dashboard

**Check:**
- Household name shown: "Thornton" (or "Alice Thornton")
- Membership status: ACTIVE (green badge or equivalent)
- Membership type shown: "Full — Individual"
- Expiration date: next July 31 (e.g. 2026-07-31 if activated before July 31 2026)
- No pending reservations (she has none yet)
- No warnings or error banners

**Fail if:** Status shows inactive, expiration date is wrong, or household name is missing

---

### Step A3 — Membership Card
**Who:** Alice Thornton
**Where:** Member Portal → Membership Card

**Action:**
1. Click "Membership Card" in navigation
2. View the digital card

**Check:**
- Name: Alice Thornton
- Membership Category: Full (Individual) or equivalent
- Member Since: today's date (or application submitted date)
- Valid Through: next July 31
- Household ID: HSH-2026-XXXX (her household ID)
- Card design renders correctly (no broken images, no missing placeholders)

**Fail if:** Name wrong, category wrong, expired date wrong, or card shows a different member's info

---

### Step A4 — Profile Page
**Who:** Alice Thornton
**Where:** Member Portal → Profile

**Check:**
- First name = Alice, Last name = Thornton
- Email = [her test email]
- Phone = what she entered during application
- Contact info is editable (Edit button or inline edit)

**Action:** Make a small edit — change phone number, save

**Check after edit:**
- Success message shown
- Individuals sheet: Alice's phone_primary updated
- Profile page reflects new number after save

**Fail if:** Profile is read-only (should be editable), or sheet doesn't update

---

### Step A5 — Reservations Page
**Who:** Alice Thornton
**Where:** Member Portal → Reservations

**Check:**
- Reservations page loads without error
- "Book a Facility" form or button visible
- Facility options shown (Tennis/Basketball, Leobo, Gym, Playground)
- No existing reservations (list is empty — correct for a new member)
- Household usage stats show 0 hours used this week (Tennis), 0 reservations this month (Leobo)

**Fail if:** Reservations page shows an error, or facility booking options are missing

---

### Step A6 — Cannot Access Admin Portal
**Who:** Alice Thornton
**Where:** Admin Portal URL

**Action:** Navigate to the Admin Portal URL while logged in as Alice

**Check:**
- Alice is denied access with "Forbidden" or "Board access required" error
- She is NOT shown the admin dashboard
- Her role is "member" (not "board") — confirm in Sessions sheet if needed

**Fail if:** Regular member can access admin portal

---

## Part B — Robert Osei and Family (Full Family)

---

### Step B1 — Robert Osei Login
**Who:** Robert Osei (primary family member)
**Where:** Portal login

**Action:** Log in as Robert Osei

**Check:**
- Directed to regular member portal
- Dashboard shows household name "Osei"
- Family members count: 4 additional members (Margaret, Daniel, Sophie, Grace) — confirm household size indicator if present
- Membership type: "Full — Family"

**Fail if:** Shows non-member portal, or shows individual rate instead of family

---

### Step B2 — Membership Card Shows Family Designation
**Who:** Robert Osei
**Where:** Membership Card

**Check:**
- Card shows "Full Family" or equivalent
- Robert's name on card
- Valid through next July 31

---

### Step B3 — Dues Reflect Family Rate
**Who:** Robert Osei

**Action:** Navigate to any page that shows dues or membership pricing

**Check:**
- Annual dues shown = full_family rate (higher than full_indiv)
- NOT showing the individual rate

---

### Step B4 — Family Members Have Individual Access
**Who:** Margaret Osei (spouse)
**Where:** Portal login

**Pre-condition:** Margaret has her own email address and received credentials during the application

**Action:** Log in as Margaret Osei

**Check:**
- Margaret can log in
- Directed to regular member portal
- Dashboard shows Osei household info
- Her individual profile is accessible

**Note:** If Margaret's email was not provided during the application, skip this step and note it as untested.

---

### Step B5 — Grace (Staff Member) Cannot Make Reservations
**Who:** Grace Mokobi (household staff)
**Where:** Portal login (if Grace has login credentials)

**Action:** If Grace has an email address and received credentials, log in as Grace

**Check:**
- Grace can log in
- Her access may be limited compared to full members — verify what she can and cannot do
- Specifically: can Grace make a reservation? (per system design, staff members may have limited access)

**Note:** Document the actual behavior observed here as this may inform future policy.

---

## Part C — Record Integrity Cross-Check

**Who:** Board Member (or tester with Sheets access)
**Where:** Google Sheets — both Member Directory and System Backend

### Step C1 — Households Integrity
**Check:**
- Alice Thornton: Households row active = TRUE, membership_level_id = "full_indiv", expiration = next July 31
- Osei family: Households row active = TRUE, membership_level_id = "full_family", expiration = next July 31

### Step C2 — Individuals Integrity
**Check:**
- All active individuals (Alice, Robert, Margaret, Abena, Grace) have active = TRUE
- Kofi Asante (removed in Scene 07): active = FALSE
- Sophie Osei (over 18): voting_eligible = TRUE
- Daniel Osei (under 18): voting_eligible = FALSE

### Step C3 — Applications Integrity
**Check:**
- Alice's application: status = "activated", payment_status = "verified"
- Osei application: status = "activated", payment_status = "verified"
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
