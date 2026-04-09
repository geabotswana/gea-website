# Scene 03 — Category Routing: All Six Membership Types

**Order:** Can run in parallel with Scene 01/02 (uses different test email addresses). Run before Scene 04+.

**What this tests:**
- All 6 questionnaire paths produce the correct category assignment
- Each category's dues amount loads from Membership Pricing sheet (not hardcoded)
- Application record stores the correct membership_category value
- Sponsorship requirement appears ONLY for Community membership (not for other categories)
- Individual vs Family selection is available for all categories
- Correct email templates are triggered per category

**Note:** This scene does NOT go all the way to activation. It covers questionnaire → submit → board initial review only. The goal is to confirm routing and record creation are correct for each category.

---

## Cast

| Role | Who | Access |
|------|-----|--------|
| **Applicant (×6)** | Six different test email addresses | Portal |
| **Board Member** | board@geabotswana.org | Admin Portal (email + password; for record verification only) |

**Admin Portal login note:** Admin Portal now requires email + password. Credentials are in the Administrators tab of System Backend.

---

## Pre-conditions

- Six available test email inboxes (or use + aliases on one Gmail: test+full@, test+affiliate@, etc.)
- Membership Pricing sheet has active rows for all 6 category types for the current year

---

## The Six Paths

---

### Path A — FULL (Individual)
**Questionnaire route:** Q1=YES → Q1b=NO → Full → Individual

**Action:**
1. Start new application
2. Q1: "U.S. Direct-Hire?" → **YES**
3. Q1b: "Temporary duty?" → **NO**
4. Household type: **Individual**
5. Fill personal info:
   - Name: James Morrison
   - Email: michael+fullindividual@raneyworld.com
   - Phone: +267 71 234501
   - Citizenship: United States
   - Employment Office: U.S. Embassy Gaborone
   - Job Title: Economic Officer
   - Posting Date: 2023-08-20
6. Submit

**Check:**
- Application row: membership_category = "Full", household_type = "Individual"
- membership_level_id on Households row = "full_indiv"
- No sponsor field shown (Full members don't need sponsors)
- Employment fields (office, title, dates) were required and accepted

**Fail if:** Category shows anything else, or employment fields were not required

---

### Path B — TEMPORARY (Individual)
**Questionnaire route:** Q1=YES → Q1b=YES → Temporary → Individual

**Action:**
1. Q1: **YES**, Q1b: **YES** (temporary duty)
2. Household type: **Individual**
3. Fill personal info:
   - Name: Patricia Anderson
   - Email: michael+temporaryindividual@raneyworld.com
   - Phone: +267 71 234509
   - Citizenship: United States
   - Employment Office: U.S. State Department
   - Job Title: Temporary Assignment Officer
   - Posting Date: 2026-02-01
   - Departure Date: 2026-08-31 (6-month maximum)
4. Submit

**Check:**
- Application row: membership_category = "Temporary"
- membership_level_id = "temporary_indiv" (or similar)
- No sponsor required
- Dues on payment page (after approval) should reflect the temporary member rate, which may be lower
- Note in Config: Temporary memberships max 6 months — check if expiration is handled differently

**Fail if:** Category = "Full" (Q1b branch not working)

---

### Path C — ASSOCIATE (Individual)
**Questionnaire route:** Q1=NO → Q2=YES → Associate → Individual

**Action:**
1. Q1: **NO**
2. Q2: "Recruited outside Botswana or USG-funded contractor?" → **YES**
3. Household type: **Individual**
4. Fill personal info:
   - Name: David Chen
   - Email: michael+associateindividual@raneyworld.com
   - Phone: +267 71 234503
   - Citizenship: Singapore
   - Employment Office: Infosys Gaborone
   - Job Title: Senior Systems Architect
   - Posting Date: 2024-02-01
5. Submit

**Check:**
- Application row: membership_category = "Associate"
- No sponsor field shown (Associates do NOT need sponsors)
- membership_level_id = "associate_indiv"

**Fail if:** Category = "Full" or "Affiliate", or sponsor field is shown

---

### Path D — AFFILIATE (Individual)
**Questionnaire route:** Q1=NO → Q2=NO → Q3=YES → Affiliate → Individual

**Action:**
1. Q1: **NO**
2. Q2: **NO**
3. Q3: "Embassy employee recruited IN Botswana?" → **YES**
4. Household type: **Individual**
5. Fill personal info:
   - Name: Boitumelo Lekgotho
   - Email: michael+affiliateindividual@raneyworld.com
   - Phone: +267 71 234505
   - Citizenship: Botswana
   - Employment Office: U.S. Embassy Gaborone
   - Job Title: Local Hire - Administrative Assistant
   - Posting Date: 2021-01-15
6. Submit

**Check:**
- Application row: membership_category = "Affiliate"
- membership_level_id = "affiliate_indiv"
- No sponsor field shown (Affiliates do NOT need sponsors)
- Employer/employment fields accepted (different fields from Full USG staff)

**Fail if:** Category = "Associate" (Q2/Q3 branch confusion), wrong employment fields shown, or sponsor field appears

---

### Path E — DIPLOMATIC (Individual)
**Questionnaire route:** Q1=NO → Q2=NO → Q3=NO → Q4=YES → Diplomatic → Individual

**Action:**
1. Q1: **NO**, Q2: **NO**, Q3: **NO**
2. Q4: "Registered diplomat of another mission?" → **YES**
3. Household type: **Individual**
4. Fill personal info:
   - Name: Jean-Pierre Dupont
   - Email: michael+diplomaticindividual@raneyworld.com
   - Phone: +267 71 234507
   - Citizenship: France
   - Employment Office: Ministry of Foreign Affairs (France)
   - Job Title: Ambassador
   - Posting Date: 2021-09-01
   - Departure Date: 2027-08-31
5. Submit

**Check:**
- Application row: membership_category = "Diplomatic"
- Diplomatic-specific fields (mission, diplomatic title, posting dates) were shown and accepted
- membership_level_id = "diplomatic_indiv"
- No sponsor field shown (Diplomats do NOT need sponsors)

**Fail if:** Category = "Community" (Q4 branch not working), or sponsor field appears

---

### Path F — COMMUNITY (Individual)
**Questionnaire route:** Q1=NO → Q2=NO → Q3=NO → Q4=NO → Community → Individual

**Action:**
1. Q1: **NO**, Q2: **NO**, Q3: **NO**, Q4: **NO**
2. Household type: **Individual**
3. Fill personal info:
   - Name: George Makgawe
   - Email: michael+communityindividual@raneyworld.com
   - Phone: +267 71 234510
   - Citizenship: Botswana
   - Employment Office: Pula Capital Partners
   - Job Title: Managing Director
   - Posting Date: 2019-06-01
4. Provide sponsor:
   - Sponsor Name: Ambassador James Morrison
   - Sponsor Email: morrison@example.com
5. Submit

**Check:**
- Application row: membership_category = "Community"
- Employment fields shown (Community members have employment, just not USG-specific)
- membership_level_id = "community_indiv"
- Sponsor field IS shown (required for Community)

**Fail if:** Category = "Diplomatic" (fallthrough not working), or sponsor field not shown

---

## Cross-Category Verification (Board Member)

After all six applications are submitted, the Board Member should:

1. Open the Admin Portal → Applications list
2. Confirm all six applications appear, each with the correct category
3. For each, note the application_id and confirm Households + Individuals rows are correct

### Dues Rate Spot Check

For any two categories (e.g. Full vs Community), compare the dues displayed on the payment page after board approval:

**Action:** Advance Full (Path A) and Community (Path F) applications through board approval to the payment page.

**Check:**
- Each category shows a different annual_dues_usd (rates differ by category)
- Neither shows a hardcoded amount
- Both show live exchange rate (same rate for both, pulled from Configuration sheet)
- Both show correct pro-ration for current quarter

**Fail if:** Two different categories show identical dues amounts, or any shows $0

---

## Completion Criteria

Scene 03 is **PASS** when:
- All 6 questionnaire paths produce the correct category
- All 6 create correct Household and Individual records
- Sponsor requirement enforced for Community ONLY
- Sponsor NOT required for Full, Associate, Affiliate, Diplomatic, or Temporary
- Dues amounts differ by category and are not hardcoded
