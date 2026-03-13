# GEA Website Repository Organization

**Date:** March 3, 2026  
**Repo:** gea-website (existing)  
**Purpose:** Where to organize GEA documentation within existing repo structure

---

## Current Repo Structure (Assumed)

```
gea-website/
├── index.html
├── css/
├── js/
├── assets/
├── docs/                    # ← ADD DOCUMENTATION HERE
└── ...
```

---

## Recommended Documentation Structure in `/docs/`

```
docs/
│
├── README.md                # Overview of all docs
│
├── policies/                # Board-facing policies
│   ├── Membership_Policy.md
│   ├── Payment_Policy.md
│   ├── Reservation_Policy.md
│   ├── Guest_List_Policy.md
│   ├── Document_Submission_Policy.md
│   ├── Data_Management_Policy.md
│   ├── Security_Privacy_Policy.md
│   ├── Audit_Compliance_Policy.md
│   ├── Communications_Policy.md
│   └── README.md
│
├── reference/              # Shared reference materials
│   ├── FACILITY_RULES_QUICK_CARD.md
│   ├── ROLES_PERMISSIONS_MATRIX.md
│   ├── MEMBERSHIP_CATEGORIES_MATRIX.md
│   ├── EMAIL_TEMPLATES_REFERENCE.md
│   ├── MEMBERSHIP_ELIGIBILITY_FLOW.md
│   └── README.md
│
├── development/            # For developers
│   ├── DEVELOPMENT_STANDARDS.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── SYSTEM_SCHEMA.md
│   └── README.md
│
├── implementation/         # Implementation guides (TBD)
│   ├── Membership_Implementation.md
│   ├── Reservations_Implementation.md
│   └── README.md
│
├── workflows/             # Process workflows (TBD)
│   ├── Membership_Application_Workflow.md
│   └── README.md
│
├── decisions/             # Board decisions
│   ├── Board_Decisions_2026_03_03.md
│   └── README.md
│
└── archive/              # Old versions
    └── v1.0/
```

---

## What Goes in `/docs/` NOW

**Complete (12 documents):**
- 9 policies → `/docs/policies/`
- 2 reference docs → `/docs/reference/`
- 1 development standards → `/docs/development/`
- Board decisions → `/docs/decisions/`

**TBD (Add later as created):**
- Implementation guides → `/docs/implementation/`
- Workflow documents → `/docs/workflows/`

---

## Git Workflow for Documentation

**When updating a policy:**
```
git checkout -b update/membership-policy
# Edit docs/policies/Membership_Policy.md
git commit -m "Update Membership Policy: Add board eligibility age requirement"
git push origin update/membership-policy
# Create PR for review if needed
```

**When adding new documentation:**
```
git checkout -b docs/membership-implementation
# Create docs/implementation/Membership_Implementation.md
git commit -m "Add Membership Implementation guide"
git push origin docs/membership-implementation
```

---

## Simple: That's It

- ✅ Use existing `gea-website` repo
- ✅ Add `/docs/` folder with structure above
- ✅ Move documentation into appropriate subfolders
- ✅ Everything is version controlled automatically
- ✅ No separate repo needed
- ✅ No reinventing the wheel

---

**Done. Ready to implement.**

