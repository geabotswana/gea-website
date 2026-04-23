# Firestore Migration Handover Document

**Date:** April 23, 2026  
**Project:** GEA Management System - Google Sheets → Firestore Migration  
**Status:** Planning Phase (Foundation Work in Progress)

---

## Executive Summary

The GEA Management System is currently built on Google Sheets + Google Apps Script. We've decided to migrate to Firestore for better data access, direct database querying (critical for debugging), reduced risk of accidental data deletion, and long-term maintainability.

**Approach:** Phased migration with Sessions as the first target. This gives us immediate debugging benefits while keeping the system stable.

---

## Why We're Migrating

1. **Direct Database Access**: Currently cannot read Sheets directly, making debugging difficult. Firestore queries will show exactly what's stored.
2. **Data Safety**: Sheets can be accidentally deleted from shared drive. Firestore has proper access controls and backups.
3. **Maintainability**: Future developers inherit a modern stack, not a spreadsheet-based system.
4. **Architecture**: Firestore is better suited for the application's needs (real-time updates, complex queries, scalability).

---

## Phased Migration Strategy

### Phase 1: Design Firestore Schema ✅ (To Be Done)
- Define Firestore collections structure
- Map current Sheets tabs to collections
- Design indexes and security rules
- Document data relationships and access patterns

### Phase 2: Build Proof-of-Concept Services ✅ (To Be Done)
- Implement `FirestoreAuthService` as working template
- Implement `FirestoreSessionService` (handle session CRUD)
- Document the service pattern for other developers
- Get Firestore read access working for debugging

### Phase 3: Migrate Sessions Data (Phase A)
- Export Sessions from Sheets
- Load into Firestore
- Update Code.js to use FirestoreSessionService
- Test authentication and session management
- Keep Sheets as backup during transition

### Phase 4: Migrate Additional Services (Phase B - Subsequent)
- MemberService
- ReservationService
- PaymentService
- FileSubmissionService
- Others as needed

### Phase 5: Full Cutover & Cleanup
- Validate all data
- Deprecate Sheets
- Archive Sheets as read-only backup

---

## Current System State

### Architecture
- **Backend**: Google Apps Script (V8) with 11 service modules
- **Frontend**: Portal.html (members), Admin.html (board), index.html (public)
- **Database**: 4 Google Sheets (Members, Reservations, Payments, System Backend)
- **Deployment**: Clasp with @HEAD live deployment

### Recent Completions
- ✅ Membership lifecycle system (Applicant → Member → Lapsed → Resigned/Expelled)
- ✅ Grace period system (31 days before auto-lapsing)
- ✅ Auto-termination (24 months of lapsed status)
- ✅ Renewal Portal for lapsed members
- ✅ Payment verification auto-activation (sets membership_status to "Member")
- ✅ Admin portal section for lapsed/resigned member management
- ✅ Instant membership resignation feature

### Current Issues / Notes
- None blocking Firestore migration planning
- System is stable and ready for architectural evolution

---

## Recommended Starting Point (Days 1-2)

### Day 1: Schema Design
1. Read through existing Sheets structure (see GEA_System_Schema.md)
2. Design Firestore collections:
   - `households` (from Households sheet)
   - `individuals` (from Individuals sheet)
   - `sessions` (from Sessions sheet)
   - `administrators` (from Administrators sheet)
   - `reservations`, `payments`, `files`, etc.
3. Document collection relationships and indexes needed
4. Design security rules (who can read/write what)

### Day 2: Proof of Concept
1. Create FirestoreAuthService.js
   - `login()` → reads from Firestore instead of Sheets
   - `logout()` → clears session in Firestore
   - `validateSession()` → queries Firestore for token
2. Create FirestoreSessionService.js
   - `createSession()`, `getSession()`, `deleteSession()`
   - Full CRUD operations on Firestore Sessions collection
3. Document the service pattern and data flow
4. Set up Firestore project and get connection working

---

## Key Files & References

| File | Purpose |
|------|---------|
| `Code.js` | Entry point; routes to service modules |
| `AuthService.js` | Current session/auth implementation (template for Firestore version) |
| `MemberService.js` | Member CRUD operations |
| `PaymentService.js` | Payment verification and tracking |
| `ReservationService.js` | Facility booking logic |
| `Config.js` | All configuration (will need Firestore equivalent) |
| `CLAUDE.md` | System architecture & design patterns |
| `GEA_System_Schema.md` | Current Sheets structure (data model reference) |

---

## Firestore Connection Setup

When building services, you'll need:
1. Firestore project created in GCP
2. Service account credentials (for Apps Script access)
3. Security rules configured
4. Necessary indexes created

Ask the project owner for:
- GCP project ID
- Service account JSON key
- Firestore database ID (if non-default)

---

## Constraint to Remember

- **Time Available**: The person who started this work had 2 full business days. After that, the project goes to limited-time contributors.
- **Goal**: Get Phase 1 & 2 done in that window so future developers have clear direction and working examples.
- **Not Expected**: Complete full migration in 2 days. That happens in subsequent phases.

---

## Success Criteria for Phase 1-2

1. ✅ Firestore schema documented (schema.md or comment in Config.js)
2. ✅ Security rules defined
3. ✅ FirestoreAuthService.js working with test data
4. ✅ FirestoreSessionService.js implemented and tested
5. ✅ Service pattern documented for future devs
6. ✅ Credentials/connection tested and working
7. ✅ Next developer can pick up Phase 3 (Sessions data migration) without ambiguity

---

## Questions for Next Developer

Before starting, clarify:
1. Has a Firestore project been created in GCP?
2. Do we have GAS-to-Firestore connection credentials ready?
3. Should we preserve Sheets as read-only archive after migration?
4. Any hard deadline for Phase 3+ (data migration)?

---

## Notes for Future Maintainers

- Keep GAS AuthService.js as reference; FirestoreAuthService should follow same interface
- Session tokens are SHA256 hashed; Firestore will store hashes (not plaintext)
- Constant-time comparison for password/token checks remains critical
- Audit logging should still write to Firestore (add AuditLogService)
- Configuration currently in Config.js—will need to move non-secret config to Firestore as well

---

**Created by:** Claude Code  
**For:** GEA Management System Maintainers  
**Next Steps:** Start with Phase 1 schema design, then Phase 2 proof-of-concept implementation.
