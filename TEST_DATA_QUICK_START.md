# GEA Membership Application — Test Data Quick Start

## What's New

The membership application test data has been reinstated and significantly expanded with:

- ✅ **Comprehensive test data** for all 11 category-type combinations
- ✅ **34 placeholder test images** (ID documents + photos) ready for upload
- ✅ **Test data loader** in Portal.html for quick form population
- ✅ **Complete documentation** for testers and developers

---

## Using the Test Data Loader

### Fastest Way to Load Test Data

1. **Open Portal.html** in your browser and click "Apply for Membership"
2. **Scroll to the bottom** and click **"Load Test Data"** button
3. **Select membership category:**
   - Full Member
   - Associate Member
   - Affiliate Member
   - Diplomatic Member
   - Temporary Member
   - Community Member

4. **Select household type:**
   - Individual
   - Family (not available for Temporary)

5. Click **"Load Test Data"** → Form auto-populates with realistic data

### What Gets Populated

- ✅ Unique applicant name
- ✅ Unique test email (format: `testapp+{category}{type}@example.com`)
- ✅ Phone number
- ✅ Citizenship and country
- ✅ Employment information (job title, office, posting/departure dates)
- ✅ Family members (spouse, children) if Family household
- ✅ Household staff (if Family household)
- ✅ Sponsor information (if category requires sponsor)

---

## All 11 Test Identities

| # | Category | Type | Name | Spouse | Children | Documents |
|---|----------|------|------|--------|----------|-----------|
| 1 | Full | Individual | James Morrison | — | — | ✅ Available |
| 2 | Full | Family | William Peterson | Sarah | Emma, Lucas | ✅ Available |
| 3 | Associate | Individual | David Chen | — | — | ✅ Available |
| 4 | Associate | Family | Michael Thompson | Rebecca | Oliver | ✅ Available |
| 5 | Affiliate | Individual | Boitumelo Lekgotho | — | — | ✅ Available |
| 6 | Affiliate | Family | Kgosiemang Sekhosana | Naledi | Mpilo, Zama | ✅ Available |
| 7 | Diplomatic | Individual | Jean-Pierre Dupont | — | — | ✅ Available |
| 8 | Diplomatic | Family | Carlos Rodriguez | Isabel | Miguel | ✅ Available |
| 9 | Temporary | Individual | Patricia Anderson | — | — | ✅ Available |
| 10 | Community | Individual | George Makgawe | — | — | ✅ Available |
| 11 | Community | Family | Nelson Kabelo | Ayanda | Tsotso | ✅ Available |

---

## Test Image Files

All test images are in `/test-data/`:

```
test-data/
├── id-documents/
│   ├── James_Morrison_passport.png
│   ├── William_Peterson_passport.png
│   ├── David_Chen_passport.png
│   ├── Boitumelo_Lekgotho_omang.png
│   └── ... (17 more documents)
└── photos/
    ├── James_Morrison_photo.png
    ├── William_Peterson_photo.png
    ├── David_Chen_photo.png
    └── ... (16 more photos)
```

**Image Specifications:**
- **ID Documents:** 720 × 450 pixels (landscape) — simulates real ID format
- **Photos:** 600 × 600 pixels (portrait) — meets application requirements
- **Format:** PNG (portable, widely supported)
- **File Size:** ~50 KB each (reasonable for uploads)

### Uploading Test Documents

During the membership application workflow, when prompted to upload documents:

1. ID documents: Browse to `test-data/id-documents/{name}_{document-type}.png`
2. Photos: Browse to `test-data/photos/{name}_photo.png`

Example:
- Upload James Morrison's ID: `test-data/id-documents/James_Morrison_passport.png`
- Upload James Morrison's photo: `test-data/photos/James_Morrison_photo.png`

---

## Test Scenarios Supported

Use test data to complete these 10 test scenes:

| Scene | Description | Test Identity | Status |
|-------|-------------|----------------|--------|
| 01 | Full Individual — Happy Path | James Morrison | ✅ Ready |
| 02 | Full Family — Happy Path | William Peterson | ✅ Ready |
| 03 | Category Routing — All Types | All 11 identities | ✅ Ready |
| 04 | Board Denial | Any identity | ✅ Ready |
| 05 | RSO Rejection & Recovery | James Morrison | ✅ Ready |
| 06 | Payment Edge Cases | Multiple identities | ✅ Ready |
| 07 | Household Management | William Peterson | ✅ Ready |
| 08 | Portal UI — All Status States | Mixed | ✅ Ready |
| 09 | Post-Activation Verification | James & William | ✅ Ready |
| 10 | Admin Account Management | (N/A) | ✅ Ready |

See `docs/testing/` for detailed test play instructions.

---

## Key Features of New Test Data

### Realistic Details
- Names reflect applicant's country of origin
- Employment details match category requirements
- Sponsorship info included where needed
- Family structures vary (single children, multiple children, household staff)

### Complete Family Support
- Family households include spouse, multiple children
- Household staff members (domestic workers)
- Different citizenship combinations

### Category-Specific Data
- **Full:** Direct-hire US Embassy employees
- **Associate:** US contractors from outside Botswana
- **Affiliate:** Host country locals (Botswana hire)
- **Diplomatic:** International diplomats
- **Temporary:** Short-term TDY officers (6-month max)
- **Community:** Local nationals (require sponsor)

### Ready for Testing
- Pre-populated forms speed up testing
- Real image files for document/photo uploads
- Unique emails prevent conflicts between test runs
- All 11 combos available instantly

---

## Related Documentation

For detailed information, see:

1. **[test-data/README.md](test-data/README.md)** — Complete test data reference
2. **[docs/testing/TEST_FIXTURES_REFERENCE.md](docs/testing/TEST_FIXTURES_REFERENCE.md)** — All test identities with scene mappings
3. **[docs/testing/TEST_EXECUTION_CHECKLIST.md](docs/testing/TEST_EXECUTION_CHECKLIST.md)** — Scene-by-scene testing checklist
4. **[docs/testing/README.md](docs/testing/README.md)** — Overview of 10 test scenes

---

## Regenerating Test Images (if needed)

To regenerate placeholder test images:

```bash
cd /home/user/gea-website
python3 scripts/generate-test-images.py
```

Requires: Python 3 + Pillow (`pip install Pillow`)

---

## Pre-Deployment Cleanup

⚠️ **IMPORTANT:** Before production deployment, delete test data:

```bash
rm -rf test-data/
```

The test data should NOT be deployed to production.

---

## Quick Reference: Email Format

All test emails use:

```
michael+{category}{type}{random}@raneyworld.com
```

Examples:
- `michael+fullindividual12345@raneyworld.com` → Full Individual
- `michael+associatefamily67890@raneyworld.com` → Associate Family
- `michael+temporaryindividual54321@raneyworld.com` → Temporary Individual

You'll receive all test emails at your michael@raneyworld.com inbox (Gmail-style aliases).

---

## Troubleshooting

### "Load Test Data" button missing
- Make sure you're on the **"Apply for Membership"** page, not login page
- Button appears at the bottom of the application form

### Form doesn't auto-populate
- Click "Load Test Data" again
- Select the correct Category and Household Type
- Check browser console for any errors

### Test image won't upload
- Verify file is PNG format (not JPG, GIF, etc.)
- Check file path is correct (`test-data/id-documents/{name}_{type}.png`)
- File should be ~50 KB or less

### "Email already exists" error
- Each category-household combo has a unique test email
- If repeating tests, delete the previous test application from the Membership Applications sheet
- Or use a different test email address

---

## What's Included

| Item | Location | Count | Purpose |
|------|----------|-------|---------|
| **Test Data Function** | Portal.html | 1 | Auto-populate forms |
| **ID Documents** | test-data/id-documents/ | 17 | Passport & Omang files |
| **Photos** | test-data/photos/ | 17 | Portrait placeholders |
| **Python Generator** | scripts/generate-test-images.py | 1 | Regenerate images if needed |
| **README** | test-data/README.md | 1 | Test data guide |
| **Fixtures Reference** | docs/testing/TEST_FIXTURES_REFERENCE.md | 1 | All identities + mappings |
| **Checklist** | docs/testing/TEST_EXECUTION_CHECKLIST.md | 1 | Scene-by-scene tracking |

**Total:** 39 new/modified files, 34 test images, comprehensive documentation

---

## Next Steps

1. ✅ Load test data in Portal.html
2. ✅ Submit a membership application
3. ✅ Upload test documents from `/test-data/`
4. ✅ Run through the 10 test scenes (see `docs/testing/`)
5. ✅ Before production: Delete test-data/ directory

---

**Ready to test!** Start with the test data loader and work through the 10 test scenes. See `docs/testing/README.md` for the complete test play guide.

---

**Version:** 1.0 | **Updated:** March 30, 2026
