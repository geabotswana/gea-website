# Changelog

All notable changes to the GEA Management System project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-02-23

### Added

#### Public Website (geabotswana.org)
- **index.html:** Self-contained public informational website with 6 sections
  - Navigation (sticky header with logo, menu links, Member Login button)
  - Hero section (full-width gradient, organization tagline, CTAs)
  - About GEA (mission, facilities overview, board officers with photos)
  - Facilities (Tennis Court/Basketball, Playground, Leobo, Gym with details)
  - Membership Categories (6 types, currently commented out pending review)
  - Contact & Footer (board contact info, location, links)
- **index.html Features:**
  - Responsive design (mobile-friendly, tested at 375px)
  - Smooth scroll navigation anchors
  - GEA brand colors and typography (Source Sans 3, Roboto Mono)
  - Professional styling with CSS grid and flexbox layouts

#### Member Portal Wrapper
- **member.html:** Full-page iframe embedding GAS web app for domain masking
  - Users see geabotswana.org in address bar (not script.google.com)
  - Full-height iframe for complete portal experience
  - Clean header with GEA branding and "Back to Website" link
  - Responsive design
  - Allow="same-origin" security configuration

#### Executive Board Section
- Professional bios for three board officers:
  - **Sacha Fraiture** (Chairperson) — PAO with extensive diplomatic background
  - **Michael Raney** (Treasurer) — 20+ years Foreign Service
  - **Maria Ester Becerro** (Secretary) — CLO experience from Uruguay
- High-quality professional photos (120×120px, rounded corners)
- Clickable mailto: email links for direct contact
- Professional contact banner below board members

#### Documentation
- **GEA_Board_Bios.md:** Comprehensive executive board profiles
- **SESSION_SUMMARY_2026-02-23.md:** Detailed session notes documenting all work
- **CHANGELOG.md:** This file

#### Version Control Infrastructure
- **.gitignore:** Protects member data (*.xlsx), credentials (.clasp.json), local tooling
- **CNAME:** Custom domain configuration for geabotswana.org
- **.claspignore:** Updated to exclude website files from GAS deployment

#### Deployment Configuration
- GitHub Pages setup for geabotswana.org (automatic deployment on git push)
- Google Cloud Storage asset URLs for logos and branding
- Production GAS deployment ID: `AKfycbw7DG2PpLUK9zrAQt9IVF35eQM7U-C3HUFyZIoQo7ChGB10xK5NuJRdUJpVrBjDwuAQ`

### Changed

#### About GEA Section
- Enhanced with specific facility locations (Presidents Drive, North Ring Road)
- Added operating hours (6am–8pm daily)
- Clarified membership diversity statement
- Separated into two paragraphs for better readability

#### Facilities Section
- Standardized card structure across all facilities:
  1. Location (with operating hours)
  2. Access (reservation requirement or freely available)
  3. Equipment (specific details)
  4. Max Reserved Session (only for reservable facilities)
  5. Subtitle: "Reservation limits to promote fair use" (for reserved facilities)
- Facilities now grouped by location (Presidents Drive together, North Ring Road separate)
- Enhanced equipment descriptions with specific details
- Clear access messaging distinguishing between reservation-only, walk-in, and freely available

#### CLAUDE.md Documentation
- Added "Public Website Files" section documenting index.html and member.html
- Updated System Overview to reflect 4 HTML interfaces (not 2)
- Updated Frontend Structure with public website details
- Updated Facilities section with 4 facilities (removed "Whole Facility" as separate entry)
- Added specific location information and operating hours
- Clarified that "Whole Facility" refers to reservation combinations, not a standalone facility

### Removed

#### Membership Categories Section
- Commented out pending content accuracy review
- Code preserved for easy restoration once verified data is available

#### Facility Listing Changes
- Removed "Whole Facility" as standalone facility entry
- Clarified it's a reservation combination, not a separate booking option
- Removed "Whole Facility" from public-facing website descriptions

### Fixed

#### Contact Section
- Removed "reservations" from General Inquiries contact text
- Clarified that reservations are handled through member portal

#### Board Section Bio
- Corrected Maria Ester Becerro bio: Changed "Maria managed" to "Ester managed"

### Documentation Updates

#### CLAUDE.md
- Added website deployment section with GitHub Pages information
- Clarified member.html as hybrid (public + authenticated via iframe)
- Updated facilities list with locations and operating hours
- Added comprehensive index.html and member.html documentation
- Updated system overview to reflect current architecture

#### Project Files
- Committed 8 documentation files to GitHub:
  - EMAIL_TEMPLATES.md
  - GEA_System_Schema.md
  - HOUSEHOLDS_COLUMNS_ANALYSIS.md
  - MEMBERSHIP_APPLICATIONS_SCHEMA_REDESIGN.md
  - MEMBERSHIP_ELIGIBILITY_FLOW.md
  - MEMBERSHIP_LEVELS.md
  - SESSION_SUMMARY_2026-02-22.md (from previous session)
  - GEA_Claude_Code_Task_List.md (updated with Phase 1 completion)

---

## Git Commit History (v1.0.0)

**Total commits: 16** (all from 2026-02-23)

1. ✅ Create public website (index.html) with 6 sections
2. ✅ Implement Option B: Dedicated member.html with full-page iframe embed
3. ✅ Fix member.html: Simplify iframe and remove sandbox restrictions
4. ✅ Simplify member.html: Remove header, use full-page iframe
5. ✅ Update board section with new executive board members (Feb 2026)
6. ✅ Refine board section: Fix bio, make emails clickable, add contact banner
7. ✅ Update About GEA section with detailed facilities information
8. ✅ Enhance Facilities section with detailed, location-based descriptions
9. ✅ Polish Facilities section: Remove limits advertising, streamline language
10. ✅ Standardize facility card structure for consistency and clarity
11. ✅ Add comprehensive documentation files
12. ✅ Update CLAUDE.md: Add website deployment section and version tracking
13. ✅ Comment out Membership Categories section (pending content update)
14. ✅ Remove 'reservations' from General Inquiries contact text
15. ✅ Update CLAUDE.md to reflect today's website launch and changes
16. ✅ Mark Phase 1 as COMPLETED (February 23, 2026)

---

## Release Notes

### v1.0.0 — Public Website Launch

**Date:** February 23, 2026
**Phase:** 1 (Quick Wins & Public Site Refresh)
**Status:** Complete ✅

#### What's New
The GEA Management System now has a professional public-facing website at **https://geabotswana.org**, presenting GEA's mission, facilities, and contact information to the broader mission community.

#### Key Features
- **Public Website:** Informational landing page at geabotswana.org
- **Domain Masking:** Member portal accessible via geabotswana.org/member.html (shows geabotswana.org in address bar, not script.google.com)
- **Executive Board:** Current leadership with professional bios and photos
- **Facility Information:** Clear descriptions of all GEA facilities with operating hours and access requirements
- **Professional Branding:** Consistent GEA colors, logos, and typography

#### Deployment
- Frontend: GitHub Pages (https://geabotswana.org)
- Backend: Google Apps Script (production deployment v1)
- Database: Google Sheets (unchanged)
- Source Code: GitHub repository (geabotswana/gea-website)

#### Testing
- ✅ Website responsive (tested 375px–1920px)
- ✅ Member portal iframe loads correctly
- ✅ Board photos display from Google Cloud Storage
- ✅ Email links functional
- ✅ Navigation smooth-scrolls correctly
- ✅ Mobile menu toggle works
- ✅ All links external and internal functional

#### Known Limitations / Pending Items
1. **Membership Categories:** Section commented out pending content accuracy review
2. **Gym Hours:** Currently set to 6am–8pm (pending confirmation for 24-hour access)
3. **Tennis Court:** Description says "Full-size" (pending confirmation if full vs. half-court)
4. **Facility Photos:** Placeholder text; awaiting actual facility images

#### Next Phase
**Phase 2:** Content Integration & Backend Architecture (scheduled for Sessions 2-3)
- Backend improvements to member portal
- Comprehensive testing and validation
- User feedback incorporation

---

## Contributors

- **Michael Raney** (Product Owner, Board Treasurer)
- **Claude Code** (Development, Implementation)
- **Sacha Fraiture** (Chairperson - Board Bios)
- **Maria Ester Becerro** (Secretary - Board Bios)

---

## Resources

- **Public Website:** https://geabotswana.org
- **GitHub Repository:** https://github.com/geabotswana/gea-website
- **Member Portal:** https://geabotswana.org/member.html
- **Production Deployment:** https://script.google.com/a/macros/geabotswana.org/s/AKfycbw7DG2PpLUK9zrAQt9IVF35eQM7U-C3HUFyZIoQo7ChGB10xK5NuJRdUJpVrBjDwuAQ/exec
- **Documentation:** See GEA_Board_Bios.md, SESSION_SUMMARY_2026-02-23.md, CLAUDE.md

---

## Future Roadmap

### Phase 2 (Sessions 2-3)
- Backend improvements
- Member portal enhancements
- Comprehensive testing

### Phase 3 (Future)
- Enhanced facility photos
- Event calendar integration
- Member testimonials and gallery

---

**Last Updated:** February 23, 2026
**Maintained by:** Claude Code
**License:** Internal Use (GEA/U.S. Mission to Botswana)
