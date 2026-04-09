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
| **Board Member** | board@geabotswana.org | Admin Portal (email + password) |
| **RSO Approver** | rso-approve@geabotswana.org | One-time email link; Admin Portal (rso role) |
| **Treasurer** | board@geabotswana.org | Admin Portal (email + password) |

**Admin Portal login note:** Admin credentials are in the Administrators tab of the System Backend. Both Board and Treasurer use email + password to log in — not just email.

**Suggested test data:**
- Primary applicant: William Peterson, michael+fullfamily@raneyworld.com
- Spouse: Sarah Peterson (US)
- Child 1: Emma Peterson (US)
- Child 2: Lucas Peterson (US)
- Staff: Thabo Motswana (Botswana — household staff)

---

## Pre-conditions

- No existing application for michael+fullfamily@raneyworld.com
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

**Action:** Fill in William Peterson's details (name, email, phone, citizenship, employment office, etc.):
- First Name: William
- Last Name: Peterson
- Email: michael+fullfamily@raneyworld.com
- Phone: +267 71 234502
- Country of Citizenship: United States
- Employment Office: U.S. Embassy Gaborone
- Job Title: Consular Officer
- Posting Date: 2022-06-15

**Check:** Same as Scene 01, Step 3. No errors, form advances.

---

### Step 3 — Add Spouse
**Who:** Applicant
**Where:** Portal — Step 4: Family Members

**Action:**
1. Click "Add Spouse"
2. Fill in: First Name = Sarah, Last Name = Peterson, email = [optional test email], phone = [any]
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
2. Fill in: First Name = Emma, Last Name = Peterson, Date of Birth = [approximately 10-12 years ago, to be under 18]
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
2. Fill in: First Name = Lucas, Last Name = Peterson, Date of Birth = [approximately 15-17 years ago, to be 17-19 for voting eligibility threshold]
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
2. Fill in: First Name = Thabo, Last Name = Motswana, Role = Household Staff (or equivalent dropdown)
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
- New row: household_name = "Peterson", active = FALSE, membership_level_id = "full_family"

**Member Directory — Individuals sheet:**
- 5 rows: William (primary), Sarah (spouse), Emma (child), Lucas (child), Thabo (staff)
- All have household_id = same HSH-XXXX
- Lucas: voting_eligible = TRUE (age ≥ 17)
- Emma: voting_eligible = FALSE (age < 17)
- Thabo: role indicates staff (not primary member)
- All: active = FALSE

**Applications sheet:**
- One row with email = michael+fullfamily@raneyworld.com, household_type = "Family", status = "awaiting_docs"

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
1. Log in as William Peterson
2. Go to Documents page
3. Upload Passport for William (use test-data/id-documents/William_Peterson_passport.png)
4. Upload Photo for William
5. Upload Passport for Sarah
6. Upload Photo for Sarah
7. Upload Passport for Lucas (over 17 — requires ID document)
8. Note: Emma (under 17) may not require documents — verify what the portal shows
9. Note: Thabo (staff) requires Omang — upload Omang for Thabo
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

**Action:** Approve William Peterson's payment

**Check (ALL 5 household members must activate):**

**Individuals sheet:**
- William Peterson: active = TRUE
- Sarah Peterson: active = TRUE
- Emma Peterson: active = TRUE
- Lucas Peterson: active = TRUE
- Thabo Motswana: active = TRUE

**Households sheet:**
- active = TRUE, expiration = next July 31

**Applications sheet:** status = "activated"

**Applicant logs in:** Directed to regular member portal (not non-member)

**Fail if:** Any family member remains active = FALSE after activation

---

## Completion Criteria

This scene is **PASS** when all 15 steps complete and all 5 household members are active.

Key end state:
- Peterson family (Full Family) is fully activated
- All member IDs are consistent across tables
- family_dues > individual_dues was confirmed on the payment page
- Activation cascade confirmed for all 5 individuals
