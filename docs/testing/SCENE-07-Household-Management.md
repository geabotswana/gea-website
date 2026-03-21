# Scene 07 — Household Management: Add, Edit, and Remove Members During Application

**Order:** Requires a live application in progress (any status up through board_final_review). Can run in parallel with Scene 06.

**What this tests:**
- Add a spouse to an existing application after initial submission
- Add a child (under 18) after initial submission
- Add a child (over 18) after initial submission — verify voting eligibility
- Add a household staff member after initial submission
- Edit a household member's details
- Remove a household member
- Verify Individuals sheet reflects all changes
- Verify document requirements update when new members are added
- Verify removal deactivates the correct individual without affecting others
- Household Management page visibility and navigation

---

## Cast

| Role | Who | Access |
|------|-----|--------|
| **Applicant** | test email | Non-Member Portal |
| **Board Member** | board@geabotswana.org | Admin Portal (email + password; for record verification) |

**Admin Portal login note:** Admin Portal now requires email + password. Credentials are in the Administrators tab of System Backend.

**Suggested test data:**
- Primary applicant: Kwame Asante, kwame.asante.test@[yourdomain]
- Start as Individual, then add members (tests the scenario where someone forgot to add family members during the initial application)

---

## Pre-conditions

- Kwame has submitted a Full Individual application and received credentials
- Application is in any status from awaiting_docs through board_final_review (NOT yet at approved_pending_payment — documents must still be modifiable)

---

## Steps

---

### Step 1 — Navigate to Household Management Page
**Who:** Applicant (Kwame)
**Where:** Non-Member Portal → My Household

**Action:**
1. Log in as Kwame Asante
2. Click "My Household" in navigation

**Check:**
- Household Management page loads
- Shows "Household Overview" section with Kwame as primary member
- Shows empty or placeholder sections for Family Members and Household Staff
- "Add Spouse", "Add Child", "Add Staff Member" buttons visible

**Fail if:** Household page is inaccessible, or shows an error

---

### Step 2 — Add Spouse
**Who:** Applicant
**Where:** Non-Member Portal → My Household

**Action:**
1. Click "Add Spouse"
2. Fill in modal:
   - First Name: Ama
   - Last Name: Asante
   - Email: [optional test email for spouse]
   - Phone: [any]
3. Click "Add Spouse" / Save

**Check:**

**Portal:**
- Ama Asante appears in the Family Members section under "Spouse"
- Success message shown

**Member Directory — Individuals sheet:**
- New row: first_name = "Ama", last_name = "Asante"
- household_id = same as Kwame's household_id
- relationship = "spouse" (or equivalent)
- active = FALSE (not activated yet)

**Documents page:**
- Ama now appears as a household member requiring document uploads
- Document upload slots appear for Ama

**Fail if:** Spouse not added, no Individuals row created, or Documents page doesn't update to show Ama

---

### Step 3 — Add Child Under 18
**Who:** Applicant
**Where:** Non-Member Portal → My Household

**Action:**
1. Click "Add Child"
2. Fill in modal:
   - First Name: Kofi
   - Last Name: Asante
   - Date of Birth: [12 years ago — e.g. 2014-01-15]
3. Save

**Check:**

**Portal:**
- Kofi appears under "Children" in family members section
- Age shown (12)

**Individuals sheet:**
- New row for Kofi
- date_of_birth recorded
- voting_eligible = FALSE (under 17)
- active = FALSE

**Documents page:**
- Check whether Kofi (under 18) requires document uploads — verify expected behavior per system rules

**Fail if:** Child not created, voting_eligible is TRUE for a 12-year-old

---

### Step 4 — Add Child Over 18
**Who:** Applicant
**Where:** Non-Member Portal → My Household

**Action:**
1. Click "Add Child"
2. Fill in:
   - First Name: Abena
   - Last Name: Asante
   - Date of Birth: [20 years ago — e.g. 2006-01-15]
3. Save

**Check:**

**Portal:**
- Abena appears under "Children" section
- Age shown (20)

**Individuals sheet:**
- voting_eligible = TRUE (age ≥ 17)

**Documents page:**
- Abena (over 18) should require document uploads (passport/ID)

**Fail if:** voting_eligible = FALSE for a 20-year-old, or Documents page doesn't show Abena

---

### Step 5 — Add Household Staff
**Who:** Applicant
**Where:** Non-Member Portal → My Household

**Action:**
1. Click "Add Staff Member"
2. Fill in:
   - First Name: Mary
   - Last Name: Tiro
   - Role: Household Staff (from dropdown)
   - Start Date: [any past date]
   - Omang #: 123456789
   - Phone: [any]
   - Email: [optional]
3. Save

**Check:**

**Portal:**
- Mary appears under "Household Staff" section

**Individuals sheet:**
- New row for Mary Tiro
- relationship or role indicates "staff"
- omang_number = 123456789
- active = FALSE

**Documents page:**
- Mary should require Omang document upload

**Fail if:** Staff member not created, Omang field missing, or Documents page doesn't show Mary

---

### Step 6 — Edit a Household Member
**Who:** Applicant
**Where:** Non-Member Portal → My Household

**Action:**
1. Find Ama Asante (spouse) in the family list
2. Click "Edit" or the edit icon
3. Change Ama's phone number to a new value
4. Save changes

**Check:**

**Portal:**
- Success message shown
- Ama's updated phone number visible in household list

**Individuals sheet:**
- Ama's row: phone_primary updated to new value

**Fail if:** Edit button missing, save fails, or sheet doesn't update

---

### Step 7 — Remove a Household Member
**Who:** Applicant
**Where:** Non-Member Portal → My Household

**Action:**
1. Find Kofi Asante (the under-18 child)
2. Click "Remove from Household" or equivalent
3. A confirmation dialog should appear: "Are you sure you want to remove Kofi Asante?"
4. Confirm removal

**Check:**

**Portal:**
- Kofi no longer appears in the family members list
- Success message shown
- Other family members (Ama, Abena, Mary) still appear

**Individuals sheet:**
- Kofi's row: active = FALSE AND some indication of removal (e.g. disabled_date populated, or status = "removed")
- Kofi's row is NOT deleted — it should be deactivated (audit trail preserved)
- household_id still set (for history)

**Documents page:**
- Kofi no longer appears as requiring document uploads

**Fail if:**
- Kofi's row is hard-deleted from Individuals sheet (should be soft-delete only)
- Other family members are affected
- Kofi still appears in Documents page

---

### Step 8 — Verify Final Household State in Sheets
**Who:** Board Member (or tester with Sheets access)
**Where:** Member Directory — Individuals sheet

**Action:** Filter by Kwame's household_id

**Expected rows:**
| Name | active | notes |
|------|--------|-------|
| Kwame Asante | FALSE | primary, active = FALSE until payment |
| Ama Asante | FALSE | spouse, recently edited phone |
| Abena Asante | FALSE | child, voting_eligible = TRUE |
| Mary Tiro | FALSE | staff, Omang on record |
| Kofi Asante | FALSE | removed child — deactivated, not deleted |

**Fail if:** Kofi's row missing entirely, or row count doesn't match expected 5

---

### Step 9 — Cannot Remove Primary Applicant
**Who:** Applicant
**Where:** Non-Member Portal → My Household

**Action:**
1. Find Kwame Asante (primary applicant) in the household list
2. Check whether a "Remove" button is present for the primary member

**Check:**
- No "Remove" button for the primary applicant
- OR: if a remove button exists, clicking it shows an error: "Cannot remove primary household member"

**Fail if:** Primary applicant can be removed through the household management page

---

### Step 10 — Continue Application to Activation
**Who:** Applicant, Board, RSO, Treasurer
**Where:** Standard flow

**Action:** Continue Kwame's application through RSO, final board review, payment, and treasurer approval (refer to Scene 01 Steps 9–16)

**Check at activation:**
- Individuals sheet: Kwame, Ama, Abena, and Mary all set active = TRUE
- Kofi remains active = FALSE (was removed before activation)
- Households sheet: active = TRUE

**Fail if:** Kofi is accidentally activated along with the rest of the household

---

## Completion Criteria

Scene 07 is **PASS** when:
- All four member types added (spouse, child <18, child >18, staff)
- Voting eligibility correct for each age
- Kofi soft-deleted (row exists, deactivated, not hard-deleted)
- Other members unaffected by removal
- Documents page reflects membership changes in real time
- Activation applies to current (non-removed) members only
