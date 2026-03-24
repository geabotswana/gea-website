# GEA Documentation Master Index

**Last Updated:** March 24, 2026
**Maintained by:** GEA Treasurer & Development Team

---

## Quick Navigation

### For Board Members & GEA Leadership
Start here for policies, decision documents, and board-facing information.

| Document | Purpose | Audience | Status |
|----------|---------|----------|--------|
| [**GEA Membership Policy**](policies/Membership_Policy.md) | Six membership categories, eligibility, sponsorship (Community/Guest only, Full member sponsor), dues, voting (Full 16+), board eligibility (Full 16+), facility access, guest hosting | Board, applicants | ✅ Complete (v1.1 Revised) |
| [**MEMBERSHIP_CATEGORIES_MATRIX**](reference/MEMBERSHIP_CATEGORIES_MATRIX.md) | Detailed reference: all six categories, eligibility, sponsor requirements, dues, voting/board rights, facility access, guest hosting, regulatory basis, implementation notes | Board, members, applicants | ✅ Complete (v1.1 Revised) |
| [**GEA Membership Eligibility Flowchart**](reference/MEMBERSHIP_ELIGIBILITY_FLOW.md) | Sequential decision tree for determining membership category (6 questions) | Board, applicants, staff | ✅ Exists |
| [**GEA Payment Policy**](policies/Payment_Policy.md) | Payment methods (EFT, PayPal, Federal Credit Union, cash), verification procedures, exchange rate determination, treasurer responsibilities | Board, treasurer, applicants | ✅ Complete |
| [**GEA Reservation Policy**](policies/Reservation_Policy.md) | Facility booking rules, approval process, limits, bumping, guest list workflow | Board, members | ✅ Complete |
| [**GEA Reservation Process Specification**](reference/GEA_Reservations_Process_Spec.md) | Technical implementation details, complete 10-step workflow | Developers | ✅ Exists |
| [**GEA Guest List Policy**](policies/Guest_List_Policy.md) | Guest requirements, full name & ID standards, RSO coordination, deadlines, submission workflow | Board, members | ✅ Complete |
| [**GEA Document Submission Policy**](policies/Document_Submission_Policy.md) | Required documents by category, 2-tier verification (RSO → Treasurer), retention schedule, privacy protections | Board, applicants, RSO, treasurer | ✅ Complete |
| [**GEA Data Management Policy**](policies/Data_Management_Policy.md) | What GEA collects, how data is organized (Google Workspace), access controls, retention, privacy & minimization | Board, treasurer | ✅ Complete |
| [**GEA Security & Privacy Policy**](policies/Security_Privacy_Policy.md) | Data protection (encryption, backups), access control, incident response, member privacy rights | Board, treasurer | ✅ Complete |
| [**GEA Communications Policy**](policies/Communications_Policy.md) | Email tone, contact methods, notification preferences, frequency limits, template consistency, response time standards | Board, treasurer | ✅ Complete (v1.0) |
| **GEA Disaster Recovery Plan** | RTO/RPO targets, backup schedule, communication | Board, treasurer | 📋 Planned |
| **GEA Release & Deployment Policy** | Versioning, board communication, maintenance windows | Board, treasurer | 📋 Planned |
| **GEA Security & Privacy Implementation Plan** | Step-by-step setup for Google Workspace security, access controls, training | Board, treasurer, non-technical successors | 📋 Planned |
| [**GEA Audit & Compliance Policy**](policies/Audit_Compliance_Policy.md) | Audit logging, compliance with 6 FAM 500-546, quarterly reviews, violation procedures | Board, treasurer | ✅ Complete |
| [**GEA Development Standards**](development/DEVELOPMENT_STANDARDS.md) | Code quality, documentation, testing expectations, file organization, naming conventions, logging standards, code review checklist | Board (informational), developers | ✅ Complete (v1.0) |

### For Developers & Claude Code
Implementation guides, workflows, and technical references.

| Document | Purpose | Audience | Status |
|----------|---------|----------|--------|
| [**CLAUDE_Membership_Implementation.md**](implementation/CLAUDE_Membership_Implementation.md) | Coding guide for membership app & approval workflow | Developers | ✅ Complete (Phase 1) |
| [**CLAUDE_Reservations_Implementation.md**](implementation/CLAUDE_Reservations_Implementation.md) | Coding guide for booking system, limits, waitlisting | Developers | ✅ Complete (Phase 1) |
| [**CLAUDE_Payments_Implementation.md**](implementation/CLAUDE_Payments_Implementation.md) | Coding guide for payment tracking & verification | Developers | 📋 60% Ready (Phase 3) |
| [**CLAUDE_Authentication_RBAC.md**](implementation/CLAUDE_Authentication_RBAC.md) | Session management, role-based access control | Developers | ✅ Complete (Phase 1) |
| [**CLAUDE_RSO_Portal_Implementation.md**](implementation/CLAUDE_RSO_Portal_Implementation.md) | RSO dual-role portal (rso_approve/rso_notify), authenticated access replacing one-time email links | Developers | ✅ Complete |
| [**CLAUDE_Google_APIs_Integration.md**](implementation/CLAUDE_Google_APIs_Integration.md) | Sheets, Drive, Calendar, Storage APIs in Apps Script | Developers | 📋 60% Ready (Phase 3) |
| [**CLAUDE_Deployment.md**](implementation/CLAUDE_Deployment.md) | clasp workflow, GitHub sync, testing, rollback | Developers | ✅ Complete (Phase 2) |
| [**CLAUDE_Security.md**](implementation/CLAUDE_Security.md) | Secure coding, auth, encryption, data protection | Developers | ✅ Complete (Phase 2) |
| [**CLAUDE_DisasterRecovery.md**](implementation/CLAUDE_DisasterRecovery.md) | Backup procedures, recovery testing, restoration | Developers | 📋 50% Ready (Phase 3) |
| [**GEA_System_Architecture.md**](implementation/GEA_System_Architecture.md) | Design patterns, request/response flow, modules | Developers | ✅ Complete (Phase 2) |
| [**development/REPO_ORGANIZATION.md**](development/REPO_ORGANIZATION.md) | Repository folder structure, naming conventions, where to place new docs, files, and scripts | Developers | ✅ Current |

### For New Members & Applicants
Public-facing information about joining, reserving facilities, and using the portal.

| Document | Purpose | Audience | Status |
|----------|---------|----------|--------|
| [**Membership Application Guide**](guides/MEMBERSHIP_APPLICATION_GUIDE.md) | How to apply, eligibility, required documents by member type, payment instructions, FAQ | Applicants | ✅ Complete |
| **Membership Categories FAQ** | Quick reference for member types & benefits | Members, applicants | 📋 Planned |
| **Facility Reservation Guide** | How to book, rules, limits, cancellation | Members | 📋 Planned |
| **Guest List Requirements** | Why required, deadlines, RSO process | Members | 📋 Planned |
| **Member Portal Quick Start** | Login, features, photo upload, contact info | Members | 📋 Planned |

---

## Reference Documents (Shared Across Audiences)

These technical references support multiple audiences and are referenced throughout policy and implementation docs.

| Document | Purpose | Format | Status |
|----------|---------|--------|--------|
| [**reference/GEA_System_Schema.md**](reference/GEA_System_Schema.md) | Complete database schema (households, individuals, membership levels, relationships) | Markdown | ✅ Exists |
| [**reference/MEMBERSHIP_ELIGIBILITY_FLOW.md**](reference/MEMBERSHIP_ELIGIBILITY_FLOW.md) | Sequential 4-question decision tree; every applicant gets exactly ONE category | Markdown | ✅ Exists |
| [**reference/MEMBERSHIP_CATEGORIES_MATRIX.md**](reference/MEMBERSHIP_CATEGORIES_MATRIX.md) | Configuration table: six categories, regulatory basis, voting rights, guest invitation authority, facility access, active status | Markdown | ✅ Exists |
| [**reference/GEA_Reservations_Process_Spec.md**](reference/GEA_Reservations_Process_Spec.md) | Complete 10-step reservation lifecycle, approval routing, bumping logic, guest list workflow | Markdown | ✅ Exists |
| [**reference/EMAIL_TEMPLATES_REFERENCE.md**](reference/EMAIL_TEMPLATES_REFERENCE.md) | All templates with triggers, placeholders, and purposes | Markdown | ✅ Exists |
| [**reference/FACILITY_RULES_QUICK_CARD.md**](reference/FACILITY_RULES_QUICK_CARD.md) | Hours, capacities, reservation limits, guest policies, usage tracking, closure info by facility (Tennis/Basketball, Leobo, Gym, Playground) | Markdown | ✅ Complete |
| [**reference/ROLES_PERMISSIONS_MATRIX.md**](reference/ROLES_PERMISSIONS_MATRIX.md) | Who can do what (Member, Treasurer, Board, RSO, Applicant); approval authority; communication requirements | Markdown | ✅ Complete |
| [**implementation/HOUSEHOLDS_COLUMNS_ANALYSIS.md**](implementation/HOUSEHOLDS_COLUMNS_ANALYSIS.md) | Data structure analysis for households table, column definitions, relationships | Markdown | ✅ Exists |
| [**implementation/MEMBERSHIP_APPLICATIONS_SCHEMA_REDESIGN.md**](implementation/MEMBERSHIP_APPLICATIONS_SCHEMA_REDESIGN.md) | Application workflow schema redesign, field definitions, status progression | Markdown | ✅ Exists |
| [**audit/DUES_REFERENCE_AUDIT_2026-03-24.md**](audit/DUES_REFERENCE_AUDIT_2026-03-24.md) | Codebase audit of membership dues calculations; identified missing `_calculateDuesAmount()` and payment recording gaps | Markdown | ✅ March 24, 2026 |
| **ARCHITECTURE_DIAGRAMS.md** | System flows, module responsibilities, data flows, request/response patterns | Markdown | 📋 Planned |
| **TOOLS_COMMANDS_REFERENCE.md** | clasp, git, Apps Script editor, testing, debugging commands | Markdown | 📋 Planned |
| **VERSION_HISTORY.md** | Release notes, deployment dates, changes by version | Markdown | 📋 Planned |

---

## Document Relationships & Dependencies

### Membership System (Tier 1 Core Feature)
```
GEA Membership Policy (BOARD)
  ├── Membership year: August 1 – July 31
  ├── Dues deadline: August 31
  ├── Pro-rating: By quarter
  ├── References: MEMBERSHIP_ELIGIBILITY_FLOW
  ├── References: MEMBERSHIP_CATEGORIES_MATRIX
  │
  └── Informs: CLAUDE_Membership_Implementation
        ├── References: GEA_System_Schema
        ├── References: ROLES_PERMISSIONS_MATRIX
        └── References: EMAIL_TEMPLATES_REFERENCE.md
```

### Reservation System (Tier 1 Core Feature)
```
GEA Reservation Policy (BOARD) ✅ COMPLETE (v1.1)
  ├── Facilities: Tennis/Basketball, Leobo, Gym, Playground (no whole facility reservations)
  ├── Booking limits: 3 hrs/week (Tennis), 1/month (Leobo)
  ├── Approval routing: Auto-approve (Tennis regular), Board (Tennis excess), Mgmt→Board (Leobo)
  ├── Bumping: 1-day window (Tennis), 5 business days (Leobo)
  ├── Separate bookings: Members wanting both court and leobo must book each separately
  ├── References: GEA_Reservations_Process_Spec (technical details)
  ├── References: GEA Guest List Policy
  │
  └── Informs: CLAUDE_Reservations_Implementation
        ├── References: GEA_System_Schema
        ├── References: ROLES_PERMISSIONS_MATRIX
        └── References: EMAIL_TEMPLATES_REFERENCE.md
```

### Payment System (Tier 1 Core Feature)
```
GEA Payment Policy (BOARD) ✅ COMPLETE (v1.1)
  ├── Payment methods: EFT (Absa/BWP), PayPal (USD/BWP), Federal Credit Union (Zelle/Member-to-Member, USD), Cash (last resort)
  ├── Exchange rate determination: [Board to select from 5 options]
  ├── Pro-rating: By quarter (100%, 75%, 50%, 25%)
  ├── Dues deadline: August 31 each membership year
  ├── Verification: Treasurer confirms before membership activation
  │
  └── Informs: CLAUDE_Payments_Implementation
        ├── References: GEA_System_Schema
        └── References: PAYMENT_TRACKING_ID (spreadsheet)
```

### System Foundation
```
GEA Data Management Policy (BOARD)
  ├── Informs: GEA_System_Schema
  ├── Informs: GEA Security & Privacy Policy
  └── Informs: CLAUDE_Google_APIs_Integration

GEA Security & Privacy Policy (BOARD)
  └── Informs: CLAUDE_Security
```

### Operations & Maintenance
```
GEA Disaster Recovery Plan (BOARD)
  └── Informs: CLAUDE_DisasterRecovery

GEA Release & Deployment Policy (BOARD)
  └── Informs: CLAUDE_Deployment

GEA Audit & Compliance Policy (BOARD)
  ├── References: GEA_System_Schema (audit fields)
  └── References: Email Templates (for audit notification templates)
```

---

## How to Use This Index

### If you're a Board Member:
1. Read the relevant **GEA Policy** document for your area (Membership, Reservations, etc.)
2. Reference the related quick-card or matrix documents as needed
3. Consult **GEA Audit & Compliance Policy** and **GEA Data Management Policy** for federal compliance and data governance context
4. Contact the GEA Treasurer or Development Lead for implementation details

### If you're a Developer:
1. Read the relevant **Policy** document to understand requirements
2. Consult **GEA_System_Schema** for database structure
3. Follow the **CLAUDE_Implementation** guide for your feature
4. Reference supporting docs (Architecture, Security, Deployment) as needed
5. Check **ROLES_PERMISSIONS_MATRIX** to understand access control

### If you're a New Member:
1. Start with the **Membership Application Guide**
2. Review **Membership Categories FAQ** for your category benefits
3. Check **Facility Reservation Guide** before booking
4. Use **Member Portal Quick Start** for technical help

---

## Operational Runbooks

**For system administrators and developers responsible for deployments:**

| Document | Purpose | Audience | Status |
|----------|---------|----------|--------|
| [**DEPLOYMENT_CHECKLIST.md**](operational/DEPLOYMENT_CHECKLIST.md) | Step-by-step checklist for deploying Apps Script changes: pre-deploy verification, clasp push, @HEAD testing, versioned deployment, and post-deploy validation | Developers, devops | ✅ Current |
| [**BOARD_EMAIL_SECRET_RECOVERY.md**](operational/BOARD_EMAIL_SECRET_RECOVERY.md) | Restore board email signing capability after disaster, rebuild, or handoff. Includes prerequisites, exact steps, verification checklist, and troubleshooting. | System admin, treasurer, devops | ✅ Current |
| [**TOKEN_HASH_MIGRATION_RUNBOOK.md**](operational/TOKEN_HASH_MIGRATION_RUNBOOK.md) | Safe deployment of session token hashing (plain-text → SHA256 hashes). Includes preflight checklist, step-by-step deployment, validation helpers, and rollback procedures. | Developers, devops | ✅ Current |

**Key Points:**
- Board email secret is **intentionally out-of-band** (not in Git/clasp) — see secret recovery guide
- Token hash migration is **one-time deployment** — see migration runbook
- Both runbooks include exact operator-facing steps, verification checklists, and rollback procedures

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Document exists and is current |
| 📋 | Document is planned / in queue |
| 🔄 | Document needs review/update |
| ⚠️ | Document is outdated / needs revision |

---

## Document Maintenance

**Last Reviewed:** March 24, 2026
**Next Review:** June 24, 2026 (quarterly)

### Adding New Documents
1. Add entry to appropriate section above
2. Set status to 📋 Planned
3. Update this index when document is ready
4. Add to version control with commit message

### Updating Documents
1. Mark status as 🔄 while in progress
2. Update "Last Updated" date in the document
3. Return status to ✅ when complete
4. Commit to GitHub with detailed message

---

## Quick Links by Subject

**Membership:** Policy | Categories | Eligibility | FAQ | Implementation  
**Reservations:** Policy | Facility Rules | Bumping Rules | Implementation  
**Payments:** Policy | Dues Matrix | Implementation  
**Guests:** Policy | Requirements | Implementation  
**Data & Security:** Data Policy | Schema | Security Policy | Privacy Policy  
**Development:** Standards | Architecture | Google APIs | Deployment  
**Compliance:** Regulatory Status | Audit Policy | Disaster Recovery  

---

## Contact & Questions

- **GEA Treasurer:** Primary contact for policy questions and board approvals
- **Development Lead:** Technical implementation and architecture questions
- **RSO Liaison:** Document verification, guest list, facility access
- **Board Secretary:** Records, retention, compliance documentation

*This index is version-controlled in GitHub. Changes require board approval for policy documents.*
