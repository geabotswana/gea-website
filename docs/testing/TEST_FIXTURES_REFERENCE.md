# GEA Membership Application — Test Fixtures Reference

Complete reference for all test data fixtures used in the 10-scene test play. Use this document to quickly find applicant details, test email addresses, and ID documents for your assigned role.

---

## Quick Links

- **[Test Data Loader](#test-data-loader)** – How to use Portal's built-in test data
- **[All 11 Test Identities](#all-11-test-identities)** – Complete applicant profiles
- **[Scene-to-Identity Mapping](#scene-to-identity-mapping)** – Which identity for which scene
- **[Admin Test Accounts](#admin-test-accounts)** – Board, Treasurer, RSO credentials
- **[Document & Photo Files](#document--photo-files)** – Where to find test images
- **[Email Address Conventions](#email-address-conventions)** – How test emails are generated

---

## Test Data Loader

### How to Load Test Data

The Portal includes a built-in test data loader for rapid testing.

**To load test data:**
1. Open **Portal.html** in your browser
2. Click **"Apply for Membership"** button
3. Click the **"Load Test Data"** button (bottom of application form)
4. Select a **Membership Category:** Full, Associate, Affiliate, Diplomatic, Temporary, or Community
5. Select a **Household Type:** Individual or Family (Temporary only allows Individual)
6. Click **"Load Test Data"**

The form will auto-populate with all required fields including:
- Unique applicant name, email, phone
- Employment details (job title, office, posting/departure dates as applicable)
- Family members (spouse, children) if household type = Family
- Household staff if applicable
- Sponsor information if category requires sponsor

**Note:** For manual testing without the loader, use the identities below.

---

## All 11 Test Identities

### Category 1: Full Membership — Individual

| Field | Value |
|-------|-------|
| **Applicant Name** | James Morrison |
| **Email** | `testapp+full-individual@example.com` |
| **Phone** | +267 71 234501 |
| **Country** | Botswana (country code: BW) |
| **Citizenship** | United States |
| **Employment Office** | U.S. Embassy Gaborone |
| **Job Title** | Economic Officer |
| **Posting Date** | 2023-08-20 |
| **Departure Date** | (blank — Full members no departure date) |
| **Household Type** | Individual |
| **Family Members** | None |
| **Household Staff** | None |
| **Requires Sponsor** | No |
| **ID Document** | `test-data/id-documents/James_Morrison_passport.png` |
| **Photo** | `test-data/photos/James_Morrison_photo.png` |
| **Annual Dues (USD)** | $50 |
| **Test Scenario** | SCENE-01 (Full Individual Happy Path) |

---

### Category 2: Full Membership — Family

| Field | Value |
|-------|-------|
| **Primary Applicant** | William Peterson |
| **Email** | `testapp+full-family@example.com` |
| **Phone** | +267 71 234502 |
| **Country** | Botswana |
| **Citizenship** | United States |
| **Employment Office** | U.S. Embassy Gaborone |
| **Job Title** | Consular Officer |
| **Posting Date** | 2022-06-15 |
| **Household Type** | Family |
| **Spouse** | Sarah Peterson (US) |
| **Children** | Emma Peterson (US), Lucas Peterson (US) |
| **Household Staff** | Thabo Motswana (Botswana) |
| **Requires Sponsor** | No |
| **Documents** | |
| ├─ Primary: | `William_Peterson_passport.png` |
| ├─ Spouse: | `Sarah_Peterson_passport.png` |
| ├─ Children: | `Emma_Peterson_passport.png`, `Lucas_Peterson_passport.png` (one per child) |
| ├─ Photos: | One per household member (6 total: primary, spouse, 2 children, + 1 extra) |
| **Annual Dues (USD)** | $100 (family rate) |
| **Test Scenario** | SCENE-02 (Full Family Happy Path) |

---

### Category 3: Associate Membership — Individual

| Field | Value |
|-------|-------|
| **Applicant Name** | David Chen |
| **Email** | `testapp+associate-individual@example.com` |
| **Phone** | +267 71 234503 |
| **Country** | Botswana |
| **Citizenship** | Singapore |
| **Employment Office** | Infosys Gaborone |
| **Job Title** | Senior Systems Architect |
| **Posting Date** | 2024-02-01 |
| **Household Type** | Individual |
| **Requires Sponsor** | **YES** – Requires Full member sponsor |
| **ID Document** | `David_Chen_passport.png` |
| **Photo** | `David_Chen_photo.png` |
| **Annual Dues (USD)** | $50 |
| **Test Scenario** | SCENE-03 (Category Routing) |

---

### Category 4: Associate Membership — Family

| Field | Value |
|-------|-------|
| **Primary Applicant** | Michael Thompson |
| **Email** | `testapp+associate-family@example.com` |
| **Phone** | +267 71 234504 |
| **Country** | Botswana |
| **Citizenship** | Canada |
| **Employment Office** | Deloitte Consulting |
| **Job Title** | Senior Management Consultant |
| **Posting Date** | 2023-03-10 |
| **Household Type** | Family |
| **Spouse** | Rebecca Thompson (Canada) |
| **Child** | Oliver Thompson (Canada) |
| **Household Staff** | Lerato Mthembu (Botswana) |
| **Requires Sponsor** | **YES** |
| **Documents** | See full family pattern above |
| **Annual Dues (USD)** | $100 |
| **Test Scenario** | SCENE-03 (Category Routing) |

---

### Category 5: Affiliate Membership — Individual

| Field | Value |
|-------|-------|
| **Applicant Name** | Boitumelo Lekgotho |
| **Email** | `testapp+affiliate-individual@example.com` |
| **Phone** | +267 71 234505 |
| **Country** | Botswana |
| **Citizenship** | Botswana |
| **Employment Office** | U.S. Embassy Gaborone |
| **Job Title** | Local Hire - Administrative Assistant |
| **Posting Date** | 2021-01-15 |
| **Household Type** | Individual |
| **Requires Sponsor** | No |
| **ID Document** | `Boitumelo_Lekgotho_omang.png` (Botswana citizen uses Omang) |
| **Photo** | `Boitumelo_Lekgotho_photo.png` |
| **Annual Dues (USD)** | $50 |
| **Test Scenario** | SCENE-03 (Category Routing) |

---

### Category 6: Affiliate Membership — Family

| Field | Value |
|-------|-------|
| **Primary Applicant** | Kgosiemang Sekhosana |
| **Email** | `testapp+affiliate-family@example.com` |
| **Phone** | +267 71 234506 |
| **Country** | Botswana |
| **Citizenship** | Botswana |
| **Employment Office** | U.S. Embassy Gaborone |
| **Job Title** | Local Hire - Program Officer |
| **Posting Date** | 2020-05-01 |
| **Household Type** | Family |
| **Spouse** | Naledi Sekhosana (Botswana) |
| **Children** | Mpilo Sekhosana (Botswana), Zama Sekhosana (Botswana) |
| **Household Staff** | Boago Sechele (Botswana) |
| **Requires Sponsor** | No |
| **Documents** | Omang for all adults, passport optional for children |
| **Annual Dues (USD)** | $100 |
| **Test Scenario** | SCENE-03 (Category Routing) |

---

### Category 7: Diplomatic Membership — Individual

| Field | Value |
|-------|-------|
| **Applicant Name** | Jean-Pierre Dupont |
| **Email** | `testapp+diplomatic-individual@example.com` |
| **Phone** | +267 71 234507 |
| **Country** | Botswana |
| **Citizenship** | France |
| **Employment Office** | Ministry of Foreign Affairs (France) |
| **Job Title** | Ambassador |
| **Posting Date** | 2021-09-01 |
| **Departure Date** | 2027-08-31 |
| **Household Type** | Individual |
| **Requires Sponsor** | No |
| **ID Document** | `Jean-Pierre_Dupont_passport.png` |
| **Photo** | `Jean-Pierre_Dupont_photo.png` |
| **Annual Dues (USD)** | $75 (higher rate for diplomatic) |
| **Test Scenario** | SCENE-03 (Category Routing) |

---

### Category 8: Diplomatic Membership — Family

| Field | Value |
|-------|-------|
| **Primary Applicant** | Carlos Rodriguez |
| **Email** | `testapp+diplomatic-family@example.com` |
| **Phone** | +267 71 234508 |
| **Country** | Botswana |
| **Citizenship** | Spain |
| **Employment Office** | Ministry of Foreign Affairs (Spain) |
| **Job Title** | Minister Plenipotentiary |
| **Posting Date** | 2022-01-15 |
| **Departure Date** | 2026-12-31 |
| **Household Type** | Family |
| **Spouse** | Isabel Rodriguez (Spain) |
| **Child** | Miguel Rodriguez (Spain) |
| **Household Staff** | Palesa Diako (Botswana) |
| **Requires Sponsor** | No |
| **Documents** | Passports for all |
| **Annual Dues (USD)** | $150 (family diplomatic rate) |
| **Test Scenario** | SCENE-03 (Category Routing) |

---

### Category 9: Temporary Membership — Individual Only

| Field | Value |
|-------|-------|
| **Applicant Name** | Patricia Anderson |
| **Email** | `testapp+temporary-individual@example.com` |
| **Phone** | +267 71 234509 |
| **Country** | Botswana |
| **Citizenship** | United States |
| **Employment Office** | U.S. State Department |
| **Job Title** | Temporary Assignment Officer |
| **Posting Date** | 2026-02-01 |
| **Departure Date** | 2026-08-31 (6-month maximum) |
| **Household Type** | Individual ONLY (Family not allowed) |
| **Requires Sponsor** | No |
| **ID Document** | `Patricia_Anderson_passport.png` |
| **Photo** | `Patricia_Anderson_photo.png` |
| **Annual Dues (USD)** | $20 (pro-rated 6-month period, not full year) |
| **Auto-Expiry** | 6 months from posting date |
| **Test Scenario** | SCENE-03 (Category Routing) |

---

### Category 10: Community Membership — Individual

| Field | Value |
|-------|-------|
| **Applicant Name** | George Makgawe |
| **Email** | `testapp+community-individual@example.com` |
| **Phone** | +267 71 234510 |
| **Country** | Botswana |
| **Citizenship** | Botswana |
| **Employment Office** | Pula Capital Partners |
| **Job Title** | Managing Director |
| **Posting Date** | 2019-06-01 |
| **Household Type** | Individual |
| **Sponsor Required** | **YES** – Must provide Full member sponsor |
| **Sponsor Name** | Ambassador James Morrison |
| **Sponsor Email** | morrison@example.com |
| **ID Document** | `George_Makgawe_omang.png` |
| **Photo** | `George_Makgawe_photo.png` |
| **Annual Dues (USD)** | $75 |
| **Test Scenario** | SCENE-03 (Category Routing) |

---

### Category 11: Community Membership — Family

| Field | Value |
|-------|-------|
| **Primary Applicant** | Nelson Kabelo |
| **Email** | `testapp+community-family@example.com` |
| **Phone** | +267 71 234511 |
| **Country** | Botswana |
| **Citizenship** | Botswana |
| **Employment Office** | Kabelo Solutions Ltd |
| **Job Title** | Chief Executive Officer |
| **Posting Date** | 2018-01-15 |
| **Household Type** | Family |
| **Spouse** | Ayanda Kabelo (South Africa) |
| **Child** | Tsotso Kabelo (Botswana) |
| **Household Staff** | Busisiwe Nkosi (Botswana) |
| **Sponsor Required** | **YES** |
| **Sponsor Name** | Consular Officer Sarah Thompson |
| **Sponsor Email** | sthompson@example.com |
| **Documents** | Omang for BW citizens, passport for SA spouse |
| **Annual Dues (USD)** | $150 |
| **Test Scenario** | SCENE-03 (Category Routing) |

---

## Scene-to-Identity Mapping

Use this table to find which test identity to use for each scene:

| Scene | Title | Test Identity | Email | Notes |
|-------|-------|---------------|-------|-------|
| **01** | Full Individual Happy Path | James Morrison | testapp+full-individual@example.com | Baseline; creates household HSH-XXXX-TEST01 |
| **02** | Full Family Happy Path | William Peterson | testapp+full-family@example.com | Large household; activation cascade test |
| **03A** | Category Routing — Full | James Morrison (above) or Alice Thornton | Use test data loader | Questionnaire to Full, Individual |
| **03B** | Category Routing — Temporary | Patricia Anderson | testapp+temporary-individual@example.com | Test Q1b branch (TDY route) |
| **03C** | Category Routing — Associate | David Chen | testapp+associate-individual@example.com | No sponsor required |
| **03D** | Category Routing — Affiliate | Boitumelo Lekgotho | testapp+affiliate-individual@example.com | Embassy local-hire category |
| **03E** | Category Routing — Diplomatic | Jean-Pierre Dupont | testapp+diplomatic-individual@example.com | Diplomat category with dates |
| **03F** | Category Routing — Community | George Makgawe | testapp+community-individual@example.com | Sponsor requirement (only community) |
| **04** | Board Denial Scenarios | Use 03A or 03C (any applicant) | Any from 03 | Test denial at both board stages |
| **05** | RSO Document Rejection | Use 01 (James Morrison) | testapp+full-individual@example.com | Resubmit documents after RSO rejection |
| **06A** | Payment — BWP Wiggle Room | Use 01 or 02 (after board approval) | From 01 or 02 | BWP payment with tolerance |
| **06B** | Payment — Clarification Request | New applicant | testapp+payment-clarify@example.com | Treasurer asks for more info |
| **06C** | Payment — Rejection & Resubmit | New applicant | testapp+payment-reject@example.com | Member resubmits corrected payment |
| **06D** | Payment — SDFCU Member2Member | New applicant | testapp+payment-sdfcu@example.com | Alternative payment method |
| **07** | Household Management | Use 02 (William Peterson) | testapp+full-family@example.com | Add/edit/remove family members |
| **08** | Portal UI — All Status States | Mixed (one per status) | Various | Responsive design & accessibility |
| **09** | Post-Activation Verification | Use 01 & 02 (after activation) | testapp+full-individual@example.com, testapp+full-family@example.com | Verify active features (card, profile, etc.) |
| **10** | Admin Account Management | Board & Treasurer | board@geabotswana.org, treasurer@geabotswana.org | Admin portal testing; credentials in Administrators sheet |

---

## Admin Test Accounts

Admin portal accounts are stored in the **Administrators** sheet of the **System Backend** workbook.

### Sample Admin Credentials (for reference)

| Email | Role | Password | Status | Test Scenario |
|-------|------|----------|--------|----------------|
| board@geabotswana.org | board | [System] | Active | All scenes |
| treasurer@geabotswana.org | board | [System] | Active | 01, 02, 06 |
| rso-approve@geabotswana.org | rso_approve | [System] | Active | 01, 02, 05, 07 |

**To create or reset admin credentials:**
1. Go to System Backend workbook → Administrators sheet
2. Add a new row with email + password_hash (use same hashing as member passwords)
3. Set role to: `board`, `mgt`, `rso_approve`, or `rso_notify`
4. Admin should change password on first login

**Admin Portal URL:** (same as member portal, but admin login screen)

---

## Document & Photo Files

All test image files are in the `/test-data/` directory:

```
test-data/
├── id-documents/
│   ├── James_Morrison_passport.png
│   ├── William_Peterson_passport.png
│   ├── David_Chen_passport.png
│   ├── Boitumelo_Lekgotho_omang.png
│   ├── Jean-Pierre_Dupont_passport.png
│   ├── Patricia_Anderson_passport.png
│   ├── George_Makgawe_omang.png
│   ├── Nelson_Kabelo_omang.png
│   └── ...
└── photos/
    ├── James_Morrison_photo.png
    ├── William_Peterson_photo.png
    ├── David_Chen_photo.png
    ├── ...
```

**Tip:** To quickly upload test images, use the relative paths above when uploading in the Portal.

---

## Email Address Conventions

Test email addresses follow a pattern to make them easy to identify:

```
testapp+{category}{household-type}@example.com
```

Examples:
- `testapp+full-individual@example.com` → Full Individual (Scene 01)
- `testapp+associate-family@example.com` → Associate Family (Scene 03C)
- `testapp+community-individual@example.com` → Community Individual (Scene 03F)

**Note:** For real testing, replace `@example.com` with a real email address you control (e.g. `testapp+full-individual@gmail.com` if using Gmail aliases).

---

## Using Gmail Aliases for Testing

Gmail allows using `+` aliases for a single inbox:
- Main account: `myname@gmail.com`
- Test emails: `myname+full-individual@gmail.com`, `myname+associate-family@gmail.com`, etc.
- All mail arrives in the same inbox, labeled with the `+` part

**To set up Gmail labels:**
1. Go to Gmail Settings → Filters and Blocked Addresses
2. Create a filter for `+{category}` to auto-label by test scenario
3. All test emails will be organized by category

---

## Troubleshooting Test Data

### Problem: Test data loader button missing

**Solution:** Make sure you're on the **"Apply for Membership"** page, not the login page. The button appears only on the application form.

### Problem: Form auto-populates but with wrong data

**Solution:** The test data selector might have the wrong category/household type selected. Click "Load Test Data" again and select the correct combination.

### Problem: Email address already exists

**Solution:** Test email addresses are unique per category-household combination. If you get "email exists" error, check:
1. You haven't run this combination before
2. You're using the correct email from the table above
3. If repeating tests, delete the old test application from the Membership Applications sheet

### Problem: Document upload fails with test image

**Solution:** Test images are PNG files 720×450 (ID docs) or 600×600 (photos). If upload fails:
1. Check file format is PNG (not JPG or GIF)
2. File size should be reasonable (our test files are ~50KB)
3. Try uploading directly from the `test-data/` directory

---

**Last Updated:** March 30, 2026
**Total Test Identities:** 11 (one per category-type combo)
**Total Test Images:** 34 (ID docs + photos for all individuals)
