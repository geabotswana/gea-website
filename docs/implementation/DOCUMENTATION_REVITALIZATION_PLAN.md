# Documentation Revitalization Plan (Paired with Firestore Migration)

**Date:** April 23, 2026  
**Status:** Planning Phase  
**Goal:** Single source of truth documentation updated alongside Firestore migration

---

## Current Documentation Inventory

**Total: ~130 documentation files across 12 categories**

### By Category & Age

#### 1. Core Architecture Docs (PRIMARY)
| File | Last Updated | Status | Issues |
|------|--------------|--------|--------|
| **CLAUDE.md** (root) | Mar 30, 2026 | Current | ✅ Most recent, comprehensive |
| **CLAUDE_Security.md** | Mar 31, 2026 | Current | ✅ Recent |
| **CLAUDE_Payments_Implementation.md** | Apr 21, 2026 | Current | ✅ Recent |
| **CLAUDE_Membership_Implementation.md** | Apr 21, 2026 | Current | ✅ Recent |
| **CLAUDE_Reservations_Implementation.md** | Apr 21, 2026 | Current | ✅ Recent |
| **CLAUDE_RSO_Portal_Implementation.md** | Apr 21, 2026 | Current | ✅ Recent |
| **CLAUDE_Authentication_RBAC.md** | Apr 21, 2026 | Current | ✅ Recent |
| **CLAUDE_Google_APIs_Integration.md** | Apr 21, 2026 | Current | ✅ Recent |
| **CLAUDE_Deployment.md** | Apr 21, 2026 | Current | ✅ Recent |
| **CLAUDE_DisasterRecovery.md** | Apr 21, 2026 | Current | ✅ Recent |

#### 2. Reference Material
| File | Last Updated | Status | Issues |
|------|--------------|--------|--------|
| **GEA_System_Schema.md** | Feb 16, 2026 | ⚠️ OUTDATED | Reference Sheets schema, not Firestore |
| EMAIL_TEMPLATES_REFERENCE.md | ? | Current | ✅ Maintained |
| MEMBERSHIP_CATEGORIES_MATRIX.md | ? | Current | ✅ Maintained |
| ROLES_PERMISSIONS_MATRIX.md | ? | Current | ✅ Maintained |
| GEA_Reservations_Process_Spec.md | ? | Current | ✅ Maintained |
| FACILITY_RULES_QUICK_CARD.md | ? | Current | ✅ Maintained |

#### 3. Status/Decision Docs (ARCHIVE)
| File | Last Updated | Status | Action |
|------|--------------|--------|--------|
| IMPLEMENTATION_COMPLETION_REPORT_MARCH_2026.md | Mar 2026 | 📦 Archive | Historical value only |
| IMPLEMENTATION_TODO_CHECKLIST.md | Mar 2026 | 📦 Archive | Completed items; move to archive |
| STATUS_ALIGNMENT_AUDIT.md | Mar 2026 | 📦 Archive | Completed audit; move to archive |
| Board_Decisions_2026_03_03.md | Mar 2026 | 📦 Archive | Board decision record |
| MEMBERSHIP_APPLICATIONS_SCHEMA_REDESIGN.md | ? | 📦 Archive | Superseded by new implementation |
| HOUSEHOLDS_COLUMNS_ANALYSIS.md | ? | 📦 Archive | Analysis doc; superseded |
| GEA_System_Architecture.md | ? | 📦 Archive | Duplicate of CLAUDE.md? |

#### 4. Operational Runbooks
| File | Last Updated | Status | Issues |
|------|--------------|--------|--------|
| DEPLOYMENT_CHECKLIST.md | ? | Current | ✅ Maintained |
| TOKEN_HASH_MIGRATION_RUNBOOK.md | ? | 📦 Archive | One-time migration |
| BOARD_EMAIL_PROPERTIESSERVICE_SETUP.md | ? | Current | ⚠️ Check GAS API changes |
| BOARD_EMAIL_SECRET_RECOVERY.md | ? | Current | ✅ Maintained |

#### 5. Testing Documentation
| File | Last Updated | Status | Issues |
|------|--------------|--------|--------|
| TEST_EXECUTION_CHECKLIST.md | ? | Current | ✅ Maintained |
| TEST_FIXTURES_REFERENCE.md | ? | Current | ✅ Maintained |
| DATA_INTEGRITY_VERIFICATION.md | ? | Current | ✅ Maintained |
| SCENE-01 through SCENE-10 | ? | Current | ✅ 10 detailed test scenarios |
| EMAIL_TEMPLATES_TEST_GUIDE.md | ? | Current | ✅ Maintained |
| UI_RESPONSIVE_TESTING_GUIDE.md | ? | Current | ✅ Maintained |

#### 6. Policies & Governance
| File | Last Updated | Status | Issues |
|------|--------------|--------|--------|
| Membership_Policy.md | ? | Current | ✅ Maintained |
| Reservation_Policy.md | ? | Current | ✅ Maintained |
| Payment_Policy.md | ? | Current | ✅ Maintained |
| Document_Submission_Policy.md | ? | Current | ✅ Maintained |
| Guest_List_Policy.md | ? | Current | ✅ Maintained |
| Security_Privacy_Policy.md | ? | Current | ⚠️ Review for Firestore changes |
| Audit_Compliance_Policy.md | ? | Current | ⚠️ Review for Firestore audit logging |
| Data_Management_Policy.md | ? | Current | ⚠️ Review for Firestore backup/retention |
| Communications_Policy.md | ? | Current | ✅ Maintained |

#### 7. Development Standards
| File | Last Updated | Status | Issues |
|------|--------------|--------|--------|
| DEVELOPMENT_STANDARDS.md | ? | Current | ⚠️ Review for Firestore code patterns |
| REPO_ORGANIZATION.md | ? | Current | ✅ Maintained |

#### 8. Email Templates
| Type | Count | Status |
|------|-------|--------|
| ADM_* (Administrative) | 18 | ✅ Current |
| MEM_* (Membership) | 18 | ✅ Current |
| DOC_* (Documents) | 22 | ✅ Current |
| PAY_* (Payments) | 8 | ✅ Current |
| RES_* (Reservations) | 19 | ✅ Current |
| SYS_* (System) | 2 | ✅ Current |
| **Total** | **87 files** | ✅ All current |

#### 9. Guides
| File | Last Updated | Status | Issues |
|------|--------------|--------|--------|
| MEMBERSHIP_APPLICATION_GUIDE.md | ? | Current | ✅ Maintained |

#### 10. Archive Docs
| Location | Purpose | Status |
|----------|---------|--------|
| docs/archive/ | Old documentation | 📦 Archive |
| docs/decisions/ | Board decisions | 📦 Archive |
| docs/audit/ | Audit reports | 📦 Archive |

---

## Documentation Issues Identified

### Critical (Blocking Firestore Migration)
1. **GEA_System_Schema.md** (Feb 16, 2026)
   - Documents Google Sheets schema, not Firestore
   - Will be completely replaced by Firestore schema doc
   - Must be updated as part of Phase 1

2. **DEVELOPMENT_STANDARDS.md**
   - May reference Sheets API patterns
   - Needs Firestore service module pattern examples
   - Must be updated during Phase 2

3. **Security_Privacy_Policy.md**
   - Firestore encryption, backup, compliance implications
   - Must be reviewed during Phase 1

### Important (Confusing/Incomplete)
4. **GEA_System_Architecture.md** vs **CLAUDE.md**
   - Possible duplication; need to verify and consolidate
   
5. **DEPLOYMENT_CHECKLIST.md**
   - May reference @HEAD deployment process
   - Firestore deployment implications unclear

6. **Data_Management_Policy.md**
   - Firestore backup retention policies needed
   - Cloud Storage implications for photos

7. **Audit_Compliance_Policy.md**
   - Firestore audit log retention vs. Sheets
   - Query capabilities and compliance implications

### Lower Priority (Archives/Historical)
8. Multiple completed items in `/docs/decisions/`, `/docs/audit/`, `/docs/archive/`
   - Can be archived after Firestore migration
   - Reference value only

---

## Documentation Revitalization Strategy

### Phase 0: Audit & Consolidation (Before Migration Starts)
**Objective:** Create clean documentation foundation

1. **Consolidate Duplicates**
   - Verify GEA_System_Architecture.md vs. CLAUDE.md overlap
   - Keep CLAUDE.md as primary source of truth
   - Archive GEA_System_Architecture.md if duplicate

2. **Move Archives**
   - Move IMPLEMENTATION_COMPLETION_REPORT_MARCH_2026.md → archive/
   - Move IMPLEMENTATION_TODO_CHECKLIST.md → archive/
   - Move STATUS_ALIGNMENT_AUDIT.md → archive/
   - Move HOUSEHOLDS_COLUMNS_ANALYSIS.md → archive/
   - Move MEMBERSHIP_APPLICATIONS_SCHEMA_REDESIGN.md → archive/

3. **Create Skeleton Docs (Ready for Migration Content)**
   - FIRESTORE_SCHEMA_REFERENCE.md (replaces GEA_System_Schema.md)
   - FIRESTORE_SERVICE_PATTERNS.md (new — how to write Firestore services)
   - FIRESTORE_SECURITY_RULES.md (new — Firestore security rules)

### Phase 1: Sessions & Administrators Migration (Week 1)

**Documentation Updates:**

1. **FIRESTORE_SCHEMA_REFERENCE.md** (NEW)
   - Document Sessions collection (copied from FIRESTORE_MIGRATION_PLAN.md Part C)
   - Document Administrators collection
   - Mark as Phase 1 (not final)

2. **FIRESTORE_SERVICE_PATTERNS.md** (NEW)
   - Service module pattern: FirestoreAuthService structure
   - Comparison: AuthService.js (Sheets) vs. FirestoreAuthService.js (Firestore)
   - Constant-time comparison remains same; query patterns change
   - Code examples of CRUD operations on Firestore collections

3. **DEVELOPMENT_STANDARDS.md** (UPDATE)
   - Add section: "Firestore Service Modules"
   - Link to FIRESTORE_SERVICE_PATTERNS.md
   - Migration timeline for old Sheets patterns → Firestore patterns

4. **CLAUDE_Authentication_RBAC.md** (UPDATE)
   - Add note: "Sessions and admin lookup now via Firestore"
   - Update code examples if needed
   - Clarify backward compatibility during transition

5. **Security_Privacy_Policy.md** (UPDATE)
   - Firestore encryption at rest (GCP managed)
   - Session token hashing (unchanged)
   - Audit logging via Firestore (instead of Sheets)

### Phase 2: Reservations & Guest Lists (Week 2)

**Documentation Updates:**

1. **FIRESTORE_SCHEMA_REFERENCE.md** (UPDATE)
   - Add Reservations collection
   - Add Guest Lists subcollection
   - Add indexes and query patterns

2. **FIRESTORE_SERVICE_PATTERNS.md** (UPDATE)
   - Add ReservationService pattern
   - Subcollection queries (Guest Lists under Reservations)
   - Joining Households (queried from Sheets during transition)

3. **CLAUDE_Reservations_Implementation.md** (UPDATE)
   - Add: "Firestore Migration Notes"
   - Highlight field removals (unused fields from Phase A)
   - Reservation query examples (old Sheets API → Firestore)

4. **GEA_Reservations_Process_Spec.md** (UPDATE)
   - Database schema references → Firestore
   - No business logic changes needed
   - Update data flow diagrams if necessary

### Phase 3: Files & Payments (Week 3)

**Documentation Updates:**

1. **FIRESTORE_SCHEMA_REFERENCE.md** (UPDATE)
   - Add File Submissions subcollection
   - Add Payments collection
   - Cloud Storage integration for photos (unchanged, still uses GCS)

2. **FIRESTORE_SERVICE_PATTERNS.md** (UPDATE)
   - FileSubmissionService pattern (nested subcollection queries)
   - PaymentService pattern (with file references)

3. **CLAUDE_Payments_Implementation.md** (UPDATE)
   - Firestore migration notes
   - Payment query examples
   - Audit trail implications

4. **Security_Privacy_Policy.md** (UPDATE)
   - Sensitive data fields: password hashes still in Firestore
   - RSO approval link tokens: hashed in Firestore (same as Sheets)
   - File Submissions: sensitive document metadata queries

### Phase 4: Households & Individuals (Week 4)

**Documentation Updates:**

1. **FIRESTORE_SCHEMA_REFERENCE.md** (UPDATE - FINAL SCHEMA)
   - Add Households collection (with all relationships)
   - Add Individuals subcollection
   - Mark schema as complete and finalized

2. **GEA_System_Schema.md** (RETIRE/REPLACE)
   - Keep as historical reference (archived)
   - Create new FIRESTORE_SCHEMA_REFERENCE.md as primary source

3. **CLAUDE.md** (UPDATE)
   - Update "System Overview" section: "Database: Firestore"
   - Update "Request Flow" to reference Firestore service modules
   - Keep critical design patterns section (auth, RBAC, audit logging unchanged)

4. **DEVELOPMENT_STANDARDS.md** (MAJOR UPDATE)
   - Add comprehensive Firestore patterns
   - Deprecate Sheets API examples
   - Code formatting standards for Firestore queries (transactions, batches)

### Phase 5: Applications & Configuration (Week 5)

**Documentation Updates:**

1. **FIRESTORE_SCHEMA_REFERENCE.md** (COMPLETE)
   - Add Applications collection (final schema)
   - Add Membership Levels (reference data)
   - Add Configuration (single document)

2. **CLAUDE_Membership_Implementation.md** (UPDATE)
   - Firestore Application workflow details
   - Multi-stage review with Firestore timestamps
   - Query examples for application status

3. **FIRESTORE_SECURITY_RULES.md** (NEW - COMPLETE)
   - Document all Firestore security rules
   - Collection-level rules (who can read/write)
   - Field-level rules (sensitive data protection)
   - Role-based access patterns

4. **DEPLOYMENT_CHECKLIST.md** (UPDATE)
   - Firestore index creation before deployment
   - Security rules activation checklist
   - Data validation queries

### Phase 6: Validation & Finalization (Week 6)

**Documentation Updates:**

1. **FIRESTORE_SCHEMA_REFERENCE.md** (FINAL)
   - All 12 collections documented
   - Index requirements listed
   - TTL policies (sessions auto-deletion)
   - Complete field mapping from Sheets to Firestore

2. **FIRESTORE_SERVICE_PATTERNS.md** (FINAL)
   - All 8 service modules documented
   - CRUD patterns for each
   - Transaction/batch operation patterns
   - Error handling patterns

3. **FIRESTORE_SECURITY_RULES.md** (FINAL)
   - Complete security ruleset
   - Test cases for each rule
   - Rationale for each restriction

4. **CLAUDE.md** (FINAL REFRESH)
   - Update all architecture diagrams
   - Update service module descriptions
   - Clarify: "Backend: Google Apps Script + Firestore"
   - Keep section on critical design patterns

5. **Data_Management_Policy.md** (UPDATE)
   - Firestore backup strategy
   - Retention periods per collection
   - Archive procedures for old audit logs
   - Disaster recovery time estimates

6. **Audit_Compliance_Policy.md** (UPDATE)
   - Firestore audit log schema
   - Query capabilities for compliance
   - Immutability of audit records
   - Retention requirements

7. **DEVELOPMENT_STANDARDS.md** (RETIRE SHEETS PATTERNS)
   - Keep for reference but mark deprecated
   - Link to Firestore equivalents
   - Timeline for full Sheets API removal

8. **Archive Old Docs**
   - Move GEA_System_Schema.md → archive/ (historical)
   - Move CLAUDE_Google_APIs_Integration.md → archive/ (Apps Script + Sheets API, no longer primary)
   - Move old analysis docs

---

## Documentation Structure (Post-Migration)

### Primary Sources of Truth (Always Current)
```
CLAUDE.md (root)
  ├── System Overview (Firestore-based)
  ├── Critical Design Patterns (auth, RBAC, audit)
  ├── Common Development Tasks
  └── Links to detailed docs below

docs/reference/
  ├── FIRESTORE_SCHEMA_REFERENCE.md ← Primary schema doc
  ├── EMAIL_TEMPLATES_REFERENCE.md
  ├── ROLES_PERMISSIONS_MATRIX.md
  └── Other reference material

docs/implementation/
  ├── FIRESTORE_SERVICE_PATTERNS.md ← How to write Firestore services
  ├── FIRESTORE_SECURITY_RULES.md
  ├── CLAUDE_Authentication_RBAC.md (updated)
  ├── CLAUDE_Deployment.md (updated)
  ├── CLAUDE_Membership_Implementation.md (updated)
  ├── CLAUDE_Reservations_Implementation.md (updated)
  ├── CLAUDE_Payments_Implementation.md (updated)
  └── Other implementation guides

docs/development/
  ├── DEVELOPMENT_STANDARDS.md (Firestore patterns)
  └── REPO_ORGANIZATION.md

docs/operational/
  ├── DEPLOYMENT_CHECKLIST.md (updated)
  └── Runbooks (unchanged)

docs/policies/
  ├── Data_Management_Policy.md (updated)
  ├── Security_Privacy_Policy.md (updated)
  ├── Audit_Compliance_Policy.md (updated)
  └── Other policies (unchanged)

docs/archive/
  ├── GEA_System_Schema.md (historical, pre-Firestore)
  ├── IMPLEMENTATION_COMPLETION_REPORT_MARCH_2026.md
  ├── STATUS_ALIGNMENT_AUDIT.md
  └── Other historical docs
```

---

## Documentation Metrics

### Before Migration
- **Total docs:** ~130
- **Current (within 1 month):** ~80
- **Outdated (pre-Feb 2026):** ~30
- **Archives (historical):** ~20

### After Migration (Goal)
- **Total active docs:** ~90
- **Archived docs:** ~40
- **All active docs updated:** 100%
- **All schemas current:** 100%

---

## Implementation Approach

### Paired with Migration Phases
- **Each migration phase updates corresponding documentation**
- **No documentation debt carries forward**
- **New developers inherit clean, current docs**

### Responsibility
- Assign one person to doc updates per migration phase
- Review cycle: Code PR → Doc review (concurrent)
- Final review: Week 6 validation phase

### Tools
- Markdown files (version controlled, Git history)
- No separate wiki (single source of truth in repo)
- Link style: `docs/reference/FILE.md` (relative links)

---

## Documentation Checklist (Parallel to Migration)

### Week 1 (Sessions)
- [ ] Create FIRESTORE_SCHEMA_REFERENCE.md (Sessions section)
- [ ] Create FIRESTORE_SERVICE_PATTERNS.md (Auth pattern)
- [ ] Update CLAUDE_Authentication_RBAC.md
- [ ] Update Security_Privacy_Policy.md
- [ ] Update DEVELOPMENT_STANDARDS.md (add Firestore section)

### Week 2 (Reservations)
- [ ] Update FIRESTORE_SCHEMA_REFERENCE.md (Reservations section)
- [ ] Update FIRESTORE_SERVICE_PATTERNS.md (Reservation pattern)
- [ ] Update CLAUDE_Reservations_Implementation.md
- [ ] Update GEA_Reservations_Process_Spec.md

### Week 3 (Files & Payments)
- [ ] Update FIRESTORE_SCHEMA_REFERENCE.md (Files, Payments)
- [ ] Update FIRESTORE_SERVICE_PATTERNS.md (Files, Payments patterns)
- [ ] Update CLAUDE_Payments_Implementation.md
- [ ] Update Audit_Compliance_Policy.md

### Week 4 (Households & Individuals)
- [ ] Update FIRESTORE_SCHEMA_REFERENCE.md (Members section - final)
- [ ] Update CLAUDE.md (system overview)
- [ ] Move GEA_System_Schema.md to archive/
- [ ] Archive old analysis docs

### Week 5 (Applications)
- [ ] Update FIRESTORE_SCHEMA_REFERENCE.md (Applications - final schema)
- [ ] Create FIRESTORE_SECURITY_RULES.md (complete)
- [ ] Update CLAUDE_Membership_Implementation.md
- [ ] Review all policy docs

### Week 6 (Finalization)
- [ ] Final review of FIRESTORE_SCHEMA_REFERENCE.md
- [ ] Final review of FIRESTORE_SERVICE_PATTERNS.md
- [ ] Final review of FIRESTORE_SECURITY_RULES.md
- [ ] Archive obsolete docs
- [ ] Update docs/README.md with navigation
- [ ] Verify all links and cross-references work

---

## Success Criteria

✅ **Documentation Revitalization Complete When:**
1. All active docs updated for Firestore
2. Schema docs (Sheets) moved to archive/
3. All links updated and working
4. New developer can: read CLAUDE.md → read schema → write Firestore service module
5. No outdated patterns in active docs
6. Zero conflicts between code and documentation

---

**Next Step:** Approve plan, then pair each migration phase with doc updates.
