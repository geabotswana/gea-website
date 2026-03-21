# Scene 02 — Full Family: Complete Happy Path with Household Members

**Order:** Run after Scene 01 (same overall flow; this scene focuses on family-specific features).

**What this tests:**
- Full Family questionnaire path and dues (family rate, not individual rate)
- Adding a spouse during application
- Adding a child (under 18) during application
- Adding a child (over 18) during application — verify voting eligibility flag
- Adding a household staff member during application
- Document requirements for each household member
- Confirming all family member rows created in Individuals sheet
- Payment via Zelle (USD)
- Treasurer activation cascades to all family members (all set active = TRUE)

---

## Cast

| Role | Who | Access |
|------|-----|--------|
| **Applicant** | Test person (different inbox from Scene 01) | Portal |
| **Board Member** | board@geabotswana.org | Admin Portal |
| **RSO Approver** | rso-approve@geabotswana.org | One-time email link |
| **Treasurer** | board@geabotswana.org | Admin Portal |

**Suggested test data:**
- Primary applicant: Robert Osei, robert.osei.test@[yourdomain]
- Spouse: Margaret Osei
- Child 1: Daniel Osei, age 14 (under 18 — not voting eligible)
- Child 2: Sophie Osei, age 19 (over 18 — should be voting eligible)
- Staff: Grace Mokobi (household staff)

---

## Pre-conditions

- No existing application for robert.osei.test@[yourdomain]
- Scene 01 has been run (confirms baseline application flow works)

---

## Steps

---

### Step 1 — Questionnaire: Full Family Path
**Who:** Applicant
**Where:** Portal → Apply for Membership

**Action:**
1. Q1: "U.S. Direct-Hire?" → **YES**
2. Q1b: "Temporary duty?" → **NO** → category = **Full**
3. Household Type → **"Family"**
4. Click Next

**Check:**
- Category = "Full"
- Household type = "Family"
- Family member section is visible on the next step (Step 4: Family Members)

**Fail if:** Category wrong, or family member fields don't appear

---

### Step 2 — Complete Personal Information
**Who:** Applicant
**Where:** Portal — Step 2

**Action:** Fill in Robert Osei's details (name, email, phone, citizenship, employment office, etc.)

**Check:** Same as Scene 01, Step 3. No errors, form advances.

---

### Step 3 — Add Spouse
**Who:** Applicant
**Where:** Portal — Step 4: Family Members

**Action:**
1. Click "Add Spouse"
2. Fill in: First Name = Margaret, Last Name = Osei, email = [optional test email], phone = [any]
3. Confirm spouse is added to the family list

**Check:**
- Spouse appears in the family member list
- No error

**Fail if:** Add Spouse button missing, or validation rejects valid data

---

### Step 4 — Add Child (Under 18)
**Who:** Applicant
**Where:** Portal — Step 4: Family Members

**Action:**
1. Click "Add Child"
2. Fill in: First Name = Daniel, Last Name = Osei, Date of Birth = [14 years ago]
3. Confirm child is added

**Check:**
- Daniel appears in family list
- Age is calculated as under 18
- No voting eligibility flag shown (children under 18 are not voting eligible)

**Fail if:** DOB field missing, or child not added

---

### Step 5 — Add Child (Over 18)
**Who:** Applicant
**Where:** Portal — Step 4: Family Members

**Action:**
1. Click "Add Child"
2. Fill in: First Name = Sophie, Last Name = Osei, Date of Birth = [19 years ago]
3. Confirm child is added

**Check:**
- Sophie appears in family list
- Age is calculated as over 18
- Voting eligibility indicator should show eligible (17+ threshold)

**Fail if:** Over-18 child not flagged for voting eligibility

---

### Step 6 — Add Household Staff
**Who:** Applicant
**Where:** Portal — Step 4 or Household Staff section

**Action:**
1. Click "Add Staff Member"
2. Fill in: First Name = Grace, Last Name = Mokobi, Role = Household Staff (or equivalent dropdown)
3. Start date = [any past date], Omang # = [any 8-digit number], phone = [any]
4. Confirm staff member is added

**Check:**
- Grace appears in staff list
- Omang # recorded
- No error

**Fail if:** Staff section missing, or staff add fails

---

### Step 7 — Submit Application
**Who:** Applicant
**Where:** Portal — Final step

**Action:** Submit application

**Check:**

**Member Directory — Households sheet:**
- New row: household_name = "Osei", active = FALSE, membership_level_id = "full_family"

**Member Directory — Individuals sheet:**
- 5 rows: Robert (primary), Margaret (spouse), Daniel (child), Sophie (child), Grace (staff)
- All have household_id = same HSH-XXXX
- Sophie: voting_eligible = TRUE (age ≥ 17)
- Daniel: voting_eligible = FALSE
- Grace: role indicates staff (not primary member)
- All: active = FALSE

**Applications sheet:**
- One row with email = Robert's email, household_type = "Family", status = "awaiting_docs"

**Applicant receives:** Credentials email (MEM_ACCOUNT_CREDENTIALS_TO_APPLICANT)

**Fail if:** Wrong number of individuals created, voting eligibility flags incorrect, or household_level_id is "full_indiv" instead of "full_family"

---

### Step 8 — Verify Dues Are Family Rate
**Who:** Applicant (after approval, at payment stage) OR Board Member (check Membership Pricing sheet now)
**Where:** Membership Pricing sheet in Member Directory

**Action:** Look up the `full_family` row for the current membership year

**Check:**
- annual_dues_usd for "full_family" > annual_dues_usd for "full_indiv" (family rate is higher)
- Note down the expected amount for verification in Step 14

---

### Step 9 — Upload Documents for All Household Members
**Who:** Applicant
**Where:** Non-Member Portal → Documents page (after logging in with credentials)

**Action:**
1. Log in as Robert Osei
2. Go to Documents page
3. Upload Passport for Robert (primary applicant)
4. Upload Photo for Robert
5. Upload Omang (or Passport) for Margaret
6. Upload Photo for Margaret
7. Upload Passport for Sophie (over 18 — requires ID document)
8. Note: Daniel (under 18) may not require documents — verify what the portal shows
9. Note: Grace (staff) requires Omang — upload for Grace
10. Confirm all uploads show "Pending"

**Check:**
- File Submissions sheet has a row for each uploaded document
- All rows: status = "submitted", individual_id correct for each person

**Fail if:** Documents page only shows primary applicant (should show all household members), any upload fails

---

### Step 10 — Confirm Documents and Board Initial Review
**Who:** Applicant then Board Member
**Where:** Portal then Admin Portal

**Action:**
1. Applicant clicks "Confirm All Documents Submitted"
2. Board reviews application in Admin Portal → approves for RSO Review

**Check:** Same as Scene 01 Steps 8–9. Confirm RSO receives separate one-time links for each document (or a single link covering all).

---

### Step 11 — RSO Approves All Documents
**Who:** RSO Approver
**Where:** Email → one-time links

**Action:** Click each one-time approval link and approve all documents

**Check:**
- All File Submissions rows update to "gea_pending" or "approved"
- Board is notified of RSO approval

---

### Step 12 — Board Gives Final Approval
**Who:** Board Member
**Where:** Admin Portal → Applications

Same as Scene 01 Step 12. Applicant notified and can now see Payment page.

---

### Step 13 — Verify Family Dues on Payment Page
**Who:** Applicant
**Where:** Non-Member Portal → Payment

**Action:** Check Dues Breakdown card

**Check:**
- Membership Category = "Full" (Family)
- Annual Dues matches the `full_family` value noted in Step 8 (higher than full_indiv)
- Pro-ration and BWP calculations are correct
- Membership year dropdown shows current year

**Fail if:** Dues show individual rate instead of family rate

---

### Step 14 — Applicant Submits Payment via Zelle
**Who:** Applicant
**Where:** Non-Member Portal → Payment

**Action:**
1. Select method: **"Zelle (USD)"**
2. Enter today's date
3. Notes: "Paid $[amount] via Zelle to geaboard@gmail.com. Reference: Osei Family"
4. Attach a test proof file
5. Submit

**Check:** Same as Scene 01 Step 14, but method = "Zelle (USD)"

---

### Step 15 — Treasurer Approves Payment
**Who:** Treasurer
**Where:** Admin Portal → Payments

**Action:** Approve Robert Osei's payment

**Check (ALL 5 household members must activate):**

**Individuals sheet:**
- Robert Osei: active = TRUE
- Margaret Osei: active = TRUE
- Daniel Osei: active = TRUE
- Sophie Osei: active = TRUE
- Grace Mokobi: active = TRUE

**Households sheet:**
- active = TRUE, expiration = next July 31

**Applications sheet:** status = "activated"

**Applicant logs in:** Directed to regular member portal (not non-member)

**Fail if:** Any family member remains active = FALSE after activation

---

## Completion Criteria

This scene is **PASS** when all 15 steps complete and all 5 household members are active.

Key end state:
- Osei family (Full Family) is fully activated
- All member IDs are consistent across tables
- family_dues > individual_dues was confirmed on the payment page
- Activation cascade confirmed for all 5 individuals
