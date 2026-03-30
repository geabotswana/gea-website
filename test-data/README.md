# GEA Membership Application Test Data

Complete test data for all 11 membership category-type combinations, including applicant profiles, family members, and placeholder ID documents/photos.

## Test Data Overview

This directory contains test fixtures for the membership application workflow with comprehensive, realistic test data for each of the 11 possible category-type combinations.

### Test Combinations (11 total)

| # | Category | Type | Primary Applicant | Spouse | Children | Staff |
|---|----------|------|------------------|--------|----------|-------|
| 1 | Full | Individual | James Morrison | — | — | — |
| 2 | Full | Family | William Peterson | Sarah | Emma, Lucas | Thabo Motswana |
| 3 | Associate | Individual | David Chen | — | — | — |
| 4 | Associate | Family | Michael Thompson | Rebecca | Oliver | Lerato Mthembu |
| 5 | Affiliate | Individual | Boitumelo Lekgotho | — | — | — |
| 6 | Affiliate | Family | Kgosiemang Sekhosana | Naledi | Mpilo, Zama | Boago Sechele |
| 7 | Diplomatic | Individual | Jean-Pierre Dupont | — | — | — |
| 8 | Diplomatic | Family | Carlos Rodriguez | Isabel | Miguel | Palesa Diako |
| 9 | Temporary | Individual | Patricia Anderson | — | — | — |
| 10 | Community | Individual | George Makgawe | — | — | — |
| 11 | Community | Family | Nelson Kabelo | Ayanda | Tsotso | Busisiwe Nkosi |

## Directory Structure

```
test-data/
├── README.md (this file)
├── id-documents/
│   ├── James_Morrison_passport.png
│   ├── William_Peterson_passport.png
│   ├── Sarah_Peterson_passport.png
│   ├── Emma_Peterson_passport.png
│   ├── David_Chen_passport.png
│   ├── Michael_Thompson_passport.png
│   ├── Rebecca_Thompson_passport.png
│   ├── Boitumelo_Lekgotho_omang.png
│   ├── Kgosiemang_Sekhosana_omang.png
│   ├── Naledi_Sekhosana_omang.png
│   ├── Jean-Pierre_Dupont_passport.png
│   ├── Carlos_Rodriguez_passport.png
│   ├── Isabel_Rodriguez_passport.png
│   ├── Patricia_Anderson_passport.png
│   ├── George_Makgawe_omang.png
│   ├── Nelson_Kabelo_omang.png
│   └── Ayanda_Kabelo_omang.png
└── photos/
    ├── James_Morrison_photo.png
    ├── William_Peterson_photo.png
    ├── Sarah_Peterson_photo.png
    ├── Emma_Peterson_photo.png
    ├── David_Chen_photo.png
    ├── Michael_Thompson_photo.png
    ├── Rebecca_Thompson_photo.png
    ├── Boitumelo_Lekgotho_photo.png
    ├── Kgosiemang_Sekhosana_photo.png
    ├── Naledi_Sekhosana_photo.png
    ├── Jean-Pierre_Dupont_photo.png
    ├── Carlos_Rodriguez_photo.png
    ├── Isabel_Rodriguez_photo.png
    ├── Patricia_Anderson_photo.png
    ├── George_Makgawe_photo.png
    ├── Nelson_Kabelo_photo.png
    └── Ayanda_Kabelo_photo.png
```

## How to Use

### Loading Test Data in Portal

1. Open Portal.html and go to the **New Member Application** page
2. Click **"Load Test Data"** button
3. Select a membership category from the dropdown (Full, Associate, Affiliate, Diplomatic, Temporary, or Community)
4. Select household type: **Individual** or **Family** (Temporary only allows Individual)
5. Click **"Load Test Data"**

The form will auto-populate with:
- Unique applicant name, email, phone
- Employment information (job title, posting date, departure date as applicable)
- Family members (spouse, children) if household type = Family
- Household staff (if household type = Family)
- Sponsor information (if category requires sponsor)

### Uploading Documents

During the membership application workflow, use the placeholder images to complete the document upload step:

**ID Documents:** Use the appropriate document for each person:
- `{name}_passport.png` for non-Botswana citizens
- `{name}_omang.png` for Botswana citizens

**Photos:** Use `{name}_photo.png` for portrait photos

## Test Data Details

### Category-Specific Employment Info

#### Full Membership (Individual)
- **Applicant:** James Morrison (US, Direct-hire Embassy employee)
- **Employment:** U.S. Embassy Gaborone, Economic Officer
- **Posting Date:** 2023-08-20

#### Full Membership (Family)
- **Applicant:** William Peterson (US, Embassy employee)
- **Spouse:** Sarah Peterson (US)
- **Children:** Emma & Lucas Peterson (US)
- **Household Staff:** Thabo Motswana (BW)
- **Employment:** U.S. Embassy Gaborone, Consular Officer
- **Posting Date:** 2022-06-15

#### Associate Membership (Individual)
- **Applicant:** David Chen (Singapore, USG contractor)
- **Employment:** Infosys Gaborone, Senior Systems Architect
- **Posting Date:** 2024-02-01
- **Note:** Requires Full member sponsor

#### Associate Membership (Family)
- **Applicant:** Michael Thompson (Canada, Contractor)
- **Spouse:** Rebecca Thompson (Canada)
- **Child:** Oliver Thompson (Canada)
- **Household Staff:** Lerato Mthembu (BW)
- **Employment:** Deloitte Consulting, Senior Management Consultant
- **Posting Date:** 2023-03-10
- **Note:** Requires Full member sponsor

#### Affiliate Membership (Individual)
- **Applicant:** Boitumelo Lekgotho (BW, Host country national)
- **Employment:** Botswana Institute for Development Policy Analysis, Senior Research Officer
- **Posting Date:** 2021-01-15
- **Note:** Requires Full member sponsor

#### Affiliate Membership (Family)
- **Applicant:** Kgosiemang Sekhosana (BW, Host country national)
- **Spouse:** Naledi Sekhosana (BW)
- **Children:** Mpilo & Zama Sekhosana (BW)
- **Household Staff:** Boago Sechele (BW)
- **Employment:** Ministry of Education, Policy Director
- **Posting Date:** 2020-05-01
- **Note:** Requires Full member sponsor

#### Diplomatic Membership (Individual)
- **Applicant:** Jean-Pierre Dupont (France, Diplomat)
- **Employment:** Ministry of Foreign Affairs, Ambassador
- **Posting Date:** 2021-09-01
- **Departure Date:** 2027-08-31
- **Note:** Requires Full member sponsor

#### Diplomatic Membership (Family)
- **Applicant:** Carlos Rodriguez (Spain, Diplomat)
- **Spouse:** Isabel Rodriguez (Spain)
- **Child:** Miguel Rodriguez (Spain)
- **Household Staff:** Palesa Diako (BW)
- **Employment:** Ministry of Foreign Affairs, Minister Plenipotentiary
- **Posting Date:** 2022-01-15
- **Departure Date:** 2026-12-31
- **Note:** Requires Full member sponsor

#### Temporary Membership (Individual)
- **Applicant:** Patricia Anderson (US, Temporary assignment)
- **Employment:** U.S. State Department, Temporary Assignment Officer
- **Posting Date:** 2026-02-01
- **Departure Date:** 2026-08-31 (6 months, auto-expires)

#### Community Membership (Individual)
- **Applicant:** George Makgawe (BW, Local national)
- **Employment:** Pula Capital Partners, Managing Director
- **Posting Date:** 2019-06-01
- **Sponsor:** Ambassador James Morrison
- **Note:** Community members require a Full member sponsor

#### Community Membership (Family)
- **Applicant:** Nelson Kabelo (BW, CEO)
- **Spouse:** Ayanda Kabelo (South Africa)
- **Child:** Tsotso Kabelo (BW)
- **Household Staff:** Busisiwe Nkosi (BW)
- **Employment:** Kabelo Solutions Ltd, Chief Executive Officer
- **Posting Date:** 2018-01-15
- **Sponsor:** Consular Officer Sarah Thompson
- **Note:** Community members require a Full member sponsor

## Test Image Specifications

### ID Documents (Landscape format)
- **Size:** 720 × 450 pixels
- **Format:** PNG
- **Content:** Placeholder ID document with:
  - Document type (Passport or Omang)
  - Applicant name
  - Photo placeholder area (left side)
  - Document number, issue date, expiry date
  - Gray/tan background (like real documents)

### Portrait Photos (Square format)
- **Size:** 600 × 600 pixels
- **Format:** PNG
- **Content:** Simplified portrait placeholder with:
  - Face outline (peach/tan skin tone)
  - Eye placeholders
  - Mouth placeholder
  - Applicant name and "TEST PHOTO" label
  - Gray background

## Regenerating Test Images

To regenerate test images (if needed), run:

```bash
cd /home/user/gea-website
python3 scripts/generate-test-images.py
```

This requires Python 3 and the Pillow library (`pip install Pillow`).

## Notes for Testing

1. **Email Addresses:** Test emails are generated with format `testapp+{category}{type}{random}@example.com`
2. **Phone Numbers:** Test phone numbers use Botswana format (71234501-71234511)
3. **Citizenship:** Mixed (US, ZA, SG, CA, ES, FR, BW) to test different scenarios
4. **Sponsors:** For categories requiring sponsors, emails use placeholder format (`sponsor@example.com`)
5. **Family Names:** Realistically reflect member countries (English for US/CA, Spanish for ES, French for FR, etc.)

## Testing Checklist

Use this test data to verify:

- ✅ Application form loads with unique data for each combo
- ✅ Family member fields populate correctly
- ✅ Household staff fields populate for family memberships
- ✅ Sponsor fields show only for categories that require sponsors
- ✅ Employment date fields appear/disappear based on category
- ✅ Citizenship country selection works
- ✅ Document upload accepts placeholder images
- ✅ Photo upload accepts portrait placeholders
- ✅ Application submission creates correct household/individual records
- ✅ Email notifications send to test email addresses
- ✅ Board review page displays all family member info
- ✅ RSO document review workflow works
- ✅ Payment verification uses correct dues amounts

## Cleanup

Before production deployment, delete this entire `test-data/` directory to prevent test data from being committed to production:

```bash
rm -rf test-data/
```

---

**Last Updated:** March 30, 2026
**Version:** 1.0
**Membership Categories:** 6 categories × 11 combos (with Temporary individual-only)
